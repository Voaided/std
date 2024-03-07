'use server'

import axios from "axios"

export default async function SendMessage(message, messagetype, session, serverId, channelId) {
'use server'


axios.post('http://localhost:8000/sendmessage/' + session.user.id + '/' + session.user.secret + '/' + serverId + '/' + channelId + '/' + messagetype, message)
.then(response => {
  console.log(response.data);
})
.catch(error => {
  console.error('Error:', error);
});

}
