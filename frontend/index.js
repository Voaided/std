const { PeerServer } = require('peer');
const peerserver = PeerServer({
    port: 9001,
    key: 'Straight_discord',
    path: '/myapp',
});


console.log ("server started");
peerserver.on('connection',async (client) => {
    console.log('New client connected with id:', client.id);
});


peerserver.on('disconnect', async (client) => {
    console.log('Client disconnected with id:', client.id);
});


//const express = require('express');
//const multer = require('multer');
//const cors = require('cors');
//
//const app = express();
//
//// Enable CORS for all routes
//app.use(cors());
//
//const storage = multer.diskStorage({
//  destination: function (req, file, cb) {
//    cb(null, 'storage/')
//  },
//  filename: function (req, file, cb) {
//    cb(null, file.originalname)
//  }
//})
//
//const upload = multer({ storage: storage })
//
//app.post('/upload', upload.single('file'), (req, res) => {
//  const id = req.body.id; // Access the id
//  if (id !== 'expected_id') {
//    console.log(id)
//    res.status(400).send('Invalid id');
//    return;
//  }
//  res.status(200).send('File uploaded successfully');
//});
//
//app.listen(9002, () => console.log('Server started on port 9002'));