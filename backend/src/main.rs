#[macro_use] extern crate rocket;

#[cfg(test)]
mod tests;
mod paste_id;


use uuid::Uuid;

use chrono::{DateTime, Duration, Utc, NaiveDateTime, TimeZone};

use scylla::transport::session::Session;
use scylla::SessionBuilder;

use std::env;
use std::{io::ErrorKind, path::Path};

use tokio::runtime::Runtime;
use tokio::task;
use std::io;
use std::path::PathBuf;

use hex;

use rocket::State;
use rocket::fs::NamedFile;
use rocket::data::{Data, ToByteUnit};
use rocket::tokio::fs::{self};
use rocket::fairing::AdHoc;
use rocket::http::Status;
use rocket::http::Header;
use rocket::serde::{Serialize, json::Json};

use rocket_download_response::DownloadResponse;

use paste_id::PasteId;

use postgres::Client;
use postgres::error::Error as DBError;

use r2d2::Pool;
use r2d2_postgres::{PostgresConnectionManager, postgres::NoTls};

// In a real application, these would be retrieved dynamically from a config.
const ID_LENGTH: usize = 64;

const POSTGRESHOST: &str = "127.0.1.1";
const PORT: u16 = 5433;
const DB_NAME: &str = "yugabyte";
const USER: &str = "yugabyte";
const PASSWORD: &str = "yugabyte";


#[derive(Debug)]
#[derive(Serialize)]
#[serde(crate = "rocket::serde")]
struct Message {
    channelid: String,
    datetime: String,
    id: String,
    message: String,
    senderid: String,
    serverid: String,
    type_: String,
    senderavatar: String,
    sendername: String,
}


#[derive(Debug)]
#[derive(Serialize)]
#[serde(crate = "rocket::serde")]
struct ServerDetails {
    serverid: String,
    servername: String,
    serverowner: String,
    serveravatar: String,
}

#[derive(Debug)]
#[derive(Serialize)]
#[serde(crate = "rocket::serde")]
struct ChannelDetails {
    id: String,
    name: String,
}


#[derive(Debug)]
#[derive(Serialize)]
#[serde(crate = "rocket::serde")]
struct ServerUsers {
    userid: String,
    username: String,
    useravatar: String,
}


#[derive(Debug)]
#[derive(Serialize)]
#[serde(crate = "rocket::serde")]
struct ServerData {
    serverusers: Vec<ServerUsers>,
    name : String,
    id: String,
    channels: Vec<ChannelDetails>,
}



fn check_id(client: &mut Client, user_id: &str, expected_secret: &str) -> Result<bool, DBError> {
    let row = client.query(
        r#"SELECT * FROM "User" WHERE ID = $1"#,
        &[&user_id]
    ).unwrap();

    if row.is_empty() {
        return Ok(false);
    }

    for row in row {
        let name: &str = row.get("name");
        println!("Found user: {}", name);
        let actual_secret: &str = row.get("secret");
        if actual_secret == expected_secret {
            return Ok(true);
        } else {
            return Ok(false);
        }
    }

    Ok(false)
}

fn get_filename(client: &mut Client, id: &str) -> Result<String, DBError> {
    let row = client.query(
        r#"SELECT * FROM "Files" WHERE ID = $1"#,
        &[&id]
    ).unwrap();

    if row.is_empty() {
        return Ok(id.to_string());
    }

    for row in row {
        let name: &str = row.get("name");
        return Ok(name.to_string());
    }

    Ok(id.to_string())
}

fn get_user_name_and_avatar(client: &mut Client, id: &str) -> Result<(String, String), DBError> {
    let row = client.query(
        r#"SELECT * FROM "User" WHERE ID = $1"#,
        &[&id]
    ).unwrap();

    if row.is_empty() {
        return Ok(("".to_string(), "".to_string()));
    }

    for row in row {
        let name: &str = row.get("name");
        let avatar: &str = row.get("image");
        return Ok((name.to_string(), avatar.to_string()));
    }

    Ok(("".to_string(), "".to_string()))
}

fn add_file(client: &mut Client, user_id: &str, filename: &str, id: &str, channel_id: &str, server_id: &str) -> Result<(), DBError> {

    client.execute(
        r#"INSERT INTO "Files" ("id", "name", "channelId", "createdAt", "updatedAt", "userId", "serverId") VALUES ($1, $2, $3, NOW(), NOW(), $4, $5)"#,
        &[&id, &filename, &channel_id, &user_id, &server_id]
    ).unwrap();

    Ok(())
}

fn cerate_server(client: &mut Client, id: &str, name: &str, userid: &str ) -> Result<(), DBError> {
    client.execute(
        r#"INSERT INTO "servers" ("id", "name", "createdAt", "updatedAt", "ownerid") VALUES ($1, $2, NOW(), NOW(), $3)"#,
        &[&id, &name, &userid]
    ).unwrap();

    Ok(())
}

fn add_user_to_server(client: &mut Client, serverid: &str, userid: &str) -> Result<(), DBError> {
    client.execute(
        r#"INSERT INTO "serveruser" ("serverid", "userid") VALUES ($1, $2)"#,
        &[&serverid, &userid]
    ).unwrap();

    Ok(())
}

fn get_server(client: &mut Client, userid: &str) -> Result<Vec<ServerDetails>, DBError> {
    let row = client.query("
        SELECT Servers.Id, Servers.Name, Servers.OwnerId, Servers.Avatar
        FROM Servers
        INNER JOIN ServerUser ON Servers.Id = ServerUser.ServerId
        WHERE ServerUser.UserId = $1
    ", &[&userid])?;

    if row.is_empty() {
        return Ok(Vec::new());
    }
    let mut serverdetails = Vec::new();
    for row in row {
        let serverid: String = row.get("id");
        let name_hex: String = row.get("name");
        let ownerid: String = row.get("ownerid");
        let avatar: String = row.get("avatar");
        let decoded_data = hex::decode(name_hex).expect("Invalid hex string");
        let name = String::from_utf8(decoded_data).expect("Invalid UTF-8");
        serverdetails.push(ServerDetails {
            serverid,
            servername: name,
            serverowner: ownerid,
            serveravatar: avatar,
        });
    }

    Ok(serverdetails)
}

fn get_server_data(client: &mut Client, serverid: &str) -> Result<Vec<ServerData>, DBError> {

    let row = client.query(
        r#"SELECT name, id FROM "servers" WHERE id = $1"#,
        &[&serverid]
    ).unwrap();

    if row.is_empty() {
        return Ok(Vec::new());
    }

    let mut serverdata = Vec::new();
    
    for row in row {
        let name: String = row.get("name");
        let id: String = row.get("id");    

        let row = client.query(
            r#"SELECT u.id, u.name, u.image
            FROM "User" u
            INNER JOIN serveruser su ON u.id = su.userId
            WHERE su.serverId = $1"#,
            &[&serverid]
        ).unwrap();

        if row.is_empty() {
            return Ok(serverdata);
        }

        let mut serverusers = Vec::new();
    
        for row in row {
            let userid: String = row.get("id");
            let username: String = row.get("name");
            let useravatar: String = row.get("image");
            serverusers.push(ServerUsers {
                userid,
                username,
                useravatar,
            });
        }

        let row = client.query(
            r#"SELECT id, name
            FROM "channel"
            WHERE serverid = $1"#,
            &[&serverid]
        ).unwrap();

        if row.is_empty() {
            return Ok(serverdata);
        }
        let mut channeldetails = Vec::new();
    
        for row in row {
            let channelid: String = row.get("id");
            let channelname: String = row.get("name");
            channeldetails.push(ChannelDetails {
                id: channelid,
                name: channelname,
            });
        }

        serverdata.push(ServerData {
            serverusers: serverusers,
            name,
            id,
            channels: channeldetails,
        });

    }

    Ok(serverdata)
}

#[get("/getserverdata/<user_id>/<user_secret>/<server_id>")]
async fn getserverdata(user_id: &str, user_secret: &str, server_id: &str, pool: &State<Pool<PostgresConnectionManager<NoTls>>>) -> Json<Vec<ServerData>> {
    let authorized = task::block_in_place(|| {
        let mut client = pool.get().unwrap();
        let is_authorized = check_id(&mut client, user_id, user_secret).unwrap();
        is_authorized
        });
    if authorized {
        println!("\x1b[32m✅ Getting servers users: {} {}\x1b[0m", user_id, user_secret);
        let data = task::block_in_place(|| {
            let mut client = pool.get().unwrap();
            get_server_data(&mut client, server_id).unwrap()
        });

        Json(data)
    } else {
        println!("\x1b[31m❌ Unauthorized user: {} {}\x1b[0m", user_id, user_secret);
        Json(Vec::new())
    }
}


#[get("/getservers/<user_id>/<user_secret>")]
async fn getservers(user_id: &str, user_secret: &str, pool: &State<Pool<PostgresConnectionManager<NoTls>>>) -> Json<Vec<ServerDetails>> {
    let authorized = task::block_in_place(|| {
        let mut client = pool.get().unwrap();
        let is_authorized = check_id(&mut client, user_id, user_secret).unwrap();
        is_authorized
        });
    if authorized {
        println!("\x1b[32m✅ Getting servers: {} {}\x1b[0m", user_id, user_secret);
        let servers = task::block_in_place(|| {
            let mut client = pool.get().unwrap();
            get_server(&mut client, user_id).unwrap()
        });

        Json(servers)
    } else {
        println!("\x1b[31m❌ Unauthorized user: {} {}\x1b[0m", user_id, user_secret);
        Json(Vec::new())
    }
}

        
#[post("/createserver/<user_id>/<user_secret>", data = "<name>")]
async fn createserver(user_id: &str, user_secret: &str, name: &str, pool: &State<Pool<PostgresConnectionManager<NoTls>>>) -> Result<String, String> {
    let authorized = task::block_in_place(|| {
        let mut client = pool.get().unwrap();
        let is_authorized = check_id(&mut client, user_id, user_secret).unwrap();
        is_authorized
        });
    if authorized {
        println!("\x1b[32m✅ Creating server: {} {}\x1b[0m", user_id, user_secret);
        let server_id = Uuid::new_v4().to_string();
        task::block_in_place(|| {
            let mut client = pool.get().unwrap();
            cerate_server(&mut client, &server_id, name, user_id).unwrap();
            add_user_to_server(&mut client, &server_id, user_id).unwrap();
        });
        Ok(server_id.to_string())
    } else {
        println!("\x1b[31m❌ Unauthorized user: {} {}\x1b[0m", user_id, user_secret);
        Ok("Unauthorized".to_string())
    }
}

#[post("/upload/<filename>/<user_id>/<user_secret>/<server_id>/<channel_id>", data = "<paste>")]
async fn upload(paste: Data<'_>, filename: &str, user_id: &str, user_secret: &str, server_id: &str, channel_id: &str, pool: &State<Pool<PostgresConnectionManager<NoTls>>>) -> io::Result<String> {
    let id = PasteId::new(ID_LENGTH);
    let authorized = task::block_in_place(|| {
        let mut client = pool.get().unwrap();
        let is_authorized = check_id(&mut client, user_id, user_secret).unwrap();
        is_authorized
        });
    if authorized {
        println!("\x1b[32m✅ Uploading: {} {} {}\x1b[0m", user_id, user_secret, filename);   
        let newfilename = id.file_path().display().to_string();
        task::block_in_place(|| {
            let binding = id.file_path();
            let id_file = binding.file_name().unwrap().to_str().unwrap();
            println!("ID: {}", id_file);
            let mut client = pool.get().unwrap();
            add_file(&mut client, user_id, filename, id_file, channel_id, server_id).unwrap();
        });
        paste.open(10.gibibytes()).into_file(newfilename).await?;
        //Ok(HOST.to_string() + "/download/" + id.file_path().file_name().unwrap().to_str().unwrap())
        Ok(id.file_path().file_name().unwrap().to_str().unwrap().to_string())
    } else {
        println!("\x1b[31m❌ Unauthorized user: {} {}\x1b[0m", user_id, user_secret);
        Ok("Unauthorized".to_string())
    }
}

#[post("/upload/withextention/<filename>/<user_id>/<user_secret>/<server_id>/<channel_id>/<imagetype>", data = "<paste>")]
async fn uploadimage(paste: Data<'_>, filename: &str, user_id: &str, user_secret: &str, imagetype: &str, server_id: &str, channel_id: &str, pool: &State<Pool<PostgresConnectionManager<NoTls>>>) -> io::Result<String> {
    let id = PasteId::new(ID_LENGTH);
    let authorized = task::block_in_place(|| {
        let mut client = pool.get().unwrap();
        let is_authorized = check_id(&mut client, user_id, user_secret).unwrap();
        is_authorized
        });
    if authorized {
        println!("\x1b[32m✅ Uploading: {} {} {}\x1b[0m", user_id, user_secret, filename);   
        let newfilename = id.file_path().display().to_string() + "." + imagetype;
        task::block_in_place(|| {
            let binding = id.file_path();
            let id_file = binding.file_name().unwrap().to_str().unwrap().to_owned() + "." + imagetype;
            println!("ID: {}", id_file);
            let mut client = pool.get().unwrap();
            add_file(&mut client, user_id, filename, &id_file, channel_id, server_id).unwrap();
        });
        paste.open(10.gibibytes()).into_file(newfilename).await?;
        Ok(id.file_path().file_name().unwrap().to_str().unwrap().to_string() + "." + imagetype)
    } else {
        println!("\x1b[31m❌ Unauthorized user: {} {}\x1b[0m", user_id, user_secret);
        Ok("Unauthorized".to_string())
    }
}



#[get("/files/<id>")]
async fn files(id: &str) -> Option<NamedFile> {
    let path = PathBuf::from("upload").join(id);
    NamedFile::open(path).await.ok()
}

#[get("/download/<id>")]
async fn download(id: String, pool: &State<Pool<PostgresConnectionManager<NoTls>>>) -> Result<DownloadResponse, Status> {
    let path = Path::join(Path::new("upload"), id.clone());

    let filename_hex = task::block_in_place(|| {
        let mut client = pool.get().unwrap();
        get_filename(&mut client, &id).unwrap()
    }); 
    let decoded_data = hex::decode(filename_hex).expect("Invalid hex string");
    let filename = String::from_utf8(decoded_data).expect("Invalid UTF-8");
    println!("\x1b[32m✅Filename: {}\x1b[0m", filename);

    DownloadResponse::from_file(path, Some(filename), None).await.map_err(|err| {
        if err.kind() == ErrorKind::NotFound {
            Status::NotFound
        } else {
            Status::InternalServerError
        }
    })
}


#[delete("/<id>")]
async fn delete(id: PasteId<'_>) -> Option<()> {
    fs::remove_file(id.file_path()).await.ok()
}

#[post("/sendmessage/<user_id>/<user_secret>/<server_id>/<channel_id>/<message_type>", data = "<message>")]
async fn sendmessage(server_id: &str, channel_id: &str, user_id: &str, user_secret: &str, message_type: &str, message: &str, pool: &State<Pool<PostgresConnectionManager<NoTls>>> ) -> Result<String, String> {
    let authorized = task::block_in_place(|| {
        let mut client = pool.get().unwrap();
        let is_authorized = check_id(&mut client, user_id, user_secret).unwrap();
        is_authorized
        });
    if authorized {
        let uri = env::var("SCYLLA_URI").unwrap_or_else(|_| "127.0.0.1:9002".to_string());
        println!("Connecting to {} ...", uri);
        let session: Session = SessionBuilder::new().known_node(uri).build().await.map_err(|e| e.to_string())?;
        let prepare = session
        .prepare(
            "INSERT INTO messages_keyspace.messages (id, channelId, serverId, message, createdAt, senderId, type, senderAvatar, senderName) VALUES (?, ?, ?, ?, dateOf(now()), ?, ?, ?, ?)",
        )
        .await.map_err(|e| e.to_string())?;
        let user_name_and_avatar = task::block_in_place(|| {
            let mut client = pool.get().unwrap();
            get_user_name_and_avatar(&mut client, user_id).unwrap()
        });
        let uuid = Uuid::new_v4(); // Generate a new UUID
        let values = (
            uuid, // id
            channel_id.to_string(), // channelId
            server_id.to_string(), // serverId
            message.to_string(), // message
            user_id.to_string(), // senderId
            message_type.to_string(), // type
            user_name_and_avatar.1, // senderAvatar
            user_name_and_avatar.0, // senderName
        );
        session.execute(&prepare, values).await.map_err(|e| e.to_string())?;
        Ok("authorized".to_string())
    } else {
        println!("\x1b[31m❌ Unauthorized user: {} {}\x1b[0m", user_id, user_secret);
        Ok("Unauthorized".to_string())
    }
}

#[get("/getmessage/<user_id>/<user_secret>/<server_id>/<channel_id>")]
async fn getmessage(server_id: &str, channel_id: &str, user_id: &str, user_secret: &str, pool: &State<Pool<PostgresConnectionManager<NoTls>>>) -> Json<Vec<Message>> {
    let authorized = task::block_in_place(|| {
        let mut client = pool.get().unwrap();
        let is_authorized = check_id(&mut client, user_id, user_secret).unwrap();
        is_authorized
        });
    if authorized {
        let uri = env::var("SCYLLA_URI").unwrap_or_else(|_| "127.0.0.1:9002".to_string());
        println!("Connecting to {} ...", uri);
        let session: Session = SessionBuilder::new().known_node(uri).build().await.unwrap();
        if let Some(rows) = session
            .query("SELECT * FROM messages_keyspace.messages WHERE channelid = ? AND serverid = ? LIMIT 50", (&channel_id, &server_id))
            .await.unwrap()
            .rows
        {
            let mut messages = Vec::new();
            for row in rows {
                let channelid = row.columns[0].as_ref().unwrap().as_text().unwrap().to_string();
                let serverid = row.columns[1].as_ref().unwrap().as_text().unwrap().to_string();
                let createdat = row.columns[2].as_ref().unwrap().as_cql_timestamp().unwrap();
                let id = row.columns[3].as_ref().unwrap().as_uuid().unwrap().to_string();
                let message = row.columns[4].as_ref().unwrap().as_text().unwrap().to_string();
                let senderavatar = row.columns[5].as_ref().unwrap().as_text().unwrap().to_string();
                let senderid = row.columns[6].as_ref().unwrap().as_text().unwrap().to_string();
                let sendername = row.columns[7].as_ref().unwrap().as_text().unwrap().to_string();
                let type_ = row.columns[8].as_ref().unwrap().as_text().unwrap().to_string();

                let timestamp = Duration::milliseconds(createdat.0);
                let naive_datetime = NaiveDateTime::from_timestamp_opt(0, 0).unwrap();
                let datetime: DateTime<Utc> = Utc.from_utc_datetime(&naive_datetime) + timestamp;
                let datetime = datetime.format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string();

                messages.push(Message {
                    channelid,
                    datetime,
                    id,
                    message,
                    senderid,
                    serverid,
                    type_,
                    senderavatar,
                    sendername,
                });
            }
            println!("Messages found");
            Json(messages)
        } else {
            println!("No messages found");
            Json(Vec::new()) // return empty Json<Vec<Message>>
        }
    } else {
        println!("\x1b[31m❌ Unauthorized user: {} {}\x1b[0m", user_id, user_secret);
        Json(Vec::new()) // return empty Json<Vec<Message>>
    }
}

#[launch]
fn rocket() -> _ {

    let rt = Runtime::new().unwrap();
    rt.block_on(async {
        let uri = env::var("SCYLLA_URI").unwrap_or_else(|_| "127.0.0.1:9002".to_string());
        println!("Connecting to {} ...", uri);
        let session: Session = SessionBuilder::new().known_node(uri).build().await.unwrap();
        session.query("CREATE KEYSPACE IF NOT EXISTS messages_keyspace WITH REPLICATION = {'class' : 'NetworkTopologyStrategy', 'replication_factor' : 1}", &[]).await.unwrap();
        session
        .query(
            "CREATE TABLE IF NOT EXISTS messages_keyspace.messages ( 
                id UUID, 
                channelId TEXT, 
                serverId TEXT, 
                message TEXT, 
                createdAt TIMESTAMP, 
                senderId TEXT, 
                type TEXT, 
                senderAvatar TEXT,
                senderName TEXT,
                PRIMARY KEY ((channelId, serverId), createdAt) 
            ) WITH CLUSTERING ORDER BY (createdAt DESC);
            ",
            &[],
        )
        .await.unwrap();
        println!("Connected to ScyllaDB");
    });

    
    // Postgres connection pool
    let conn_string = format!(
        "host={} port={} dbname={} user={} password={}",
        POSTGRESHOST, PORT, DB_NAME, USER, PASSWORD
    );

    // Create a connection manager for the Postgres database.
    let manager = PostgresConnectionManager::new(
        conn_string.parse().unwrap(),
        NoTls,
    );

    // Create a pool of connections.
    let pool: Pool<PostgresConnectionManager<NoTls>> = r2d2::Builder::new()
        .max_size(15) // Set maximum number of connections in the pool
        .build(manager)
        .unwrap();

    // Get a connection from the pool.
    let mut conn = pool.get().unwrap();
    // Execute a query.
    let rows = conn.query(r#"SELECT * FROM "User""#, &[]).unwrap();

    for row in rows {
        let name: &str = row.get("name");
        println!("Found user: {}", name);
    }
    
    rocket::build()
        .manage(pool)
        .attach(AdHoc::on_response("CORS", |_, res| {
            Box::pin(async move {
                res.set_header(Header::new("Access-Control-Allow-Origin", "http://localhost:3000"));
            })
        }))
        .mount("/", routes![upload, uploadimage, delete, files, download, sendmessage, getmessage, createserver, getservers, getserverdata])
}