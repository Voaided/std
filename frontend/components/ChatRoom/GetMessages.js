'use server'
import axios from 'axios';

export default async function GetMessages( session, channelId, serverId) {
'use server'
  try {
    const response = await axios.get('http://localhost:8000/getmessage/' + session.user.id + '/' + session.user.secret + '/' + serverId + '/' + channelId );
    // response.data is an array of objects
    const items = []; // create an array
    response.data.forEach(item => {
      items.push({
        channelid: item.channelid,
        createdAt: item.datetime,
        id: item.id,
        message: JSON.parse(item.message),
        senderid: item.senderid,
        serverid: item.serverid,
        type: item.type_,
        senderAvatar: item.senderavatar,
        sendername: item.sendername
      });
    });
    return items ; 
  } catch (error) {
    console.error('Error:', error);
  }
}