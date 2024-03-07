'use client'

import { useState, useEffect } from 'react'
import axios from 'axios';
import Link  from 'next/link';

export default function SideMenu({session}) {

const [createServerDiv, setCreateServerDiv] = useState(false);
const [servername, setServername] = useState('');
const [serverlist, setServerlist] = useState([]);

useEffect(() => {
    const getServerList = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:8000/getservers/' + session.user.id + '/' + session.user.secret);
            console.log(response.data);
            setServerlist(response.data);
        }
        catch (error) {
            console.error('Error sending file:', error); 
        }
    }
    getServerList();
}, [session.user]);

const createServer = () => {
    setCreateServerDiv(true);
}

const closeCreateServer = () => {
    setCreateServerDiv(false);
}

const submitServer = async () => {
    console.log('submit server')
    let servername_hex = Buffer.from(servername).toString('hex');
    try {
        const response = await axios.post('http://127.0.0.1:8000/createserver/' + session.user.id + '/' + session.user.secret , servername_hex);
        console.log(response.data);
        setServername('');
        try {
            const response = await axios.get('http://127.0.0.1:8000/getservers/' + session.user.id + '/' + session.user.secret);
            console.log(response.data);
            setServerlist(response.data);
        }
        catch (error) {
            console.error('Error sending file:', error); 
        }
        setCreateServerDiv(false);
    } catch (error) {
        console.error('Error sending file:', error); 
    }
}

return (
    <>
    <div className="w-20 flex backdrop-blur-md border-2 border-white sidemenu">
        <div className=" h-full w-20 ">
            <button className="flex w-12 m-4 h-12 justify-center items-center" onClick={createServer}>    
                <div className="w-12 h-12 rounded-lg bg-slate-500/30 p-2 flex justify-center items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="white" className="w-5 h-5" viewBox="0 0 448 512"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/></svg>
                </div>
            </button>
            {serverlist.map((server, index) => (
                <div key={index} className="w-12 h-12 m-4 rounded-lg border-2 border-white bg-slate-500/30 flex justify-center items-center">
                    <Link href={`/home/${server.serverid}/@`} replace prefetch={true}>
                        <img src={server.serveravatar} className="w-12 h-12 rounded-lg border-2 border-white" />
                    </Link>
                </div>

            ))}
        </div>
    </div>
    {createServerDiv &&
        <>
            <div className="absolute h-full w-full inset-0 z-20 bg-black/25 backdrop-blur-sm">
                <div className='w-96 h-96 absolute-center bg-black rounded-3xl border-2 shadow-lg z-20 border-white'>
                    <div className='absolute w-full'>
                        <button className='flex justify-center items-center float-right h-8 w-8 m-4' onClick={closeCreateServer}> 
                            <svg xmlns="http://www.w3.org/2000/svg" fill="white" className="h-8 w-8"  viewBox="0 0 512 512"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z"/></svg>   
                        </button>
                    </div>
                    <div className='w-96 h-96 p-4 z-20 flex flex-col justify-between items-center pt-16'>    
                        <input className="h-8 w-full rounded-lg bg-black text-white p-2" placeholder="Server Name" value={servername} onChange={(e) => setServername(e.target.value)}></input>
                        <button className="h-8 w-24 rounded-lg bg-slate-500/50 text-white m-2" onClick={submitServer}>Create</button>
                    </div>
                </div>
            </div>
        </>
    }
    </>
)
}