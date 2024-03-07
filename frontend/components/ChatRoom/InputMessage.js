'use client'

import React, { useState, useEffect, useRef } from 'react';
import SendMessage from './SendMessage';
import axios from 'axios';

export default function InputMessage({ session, channelId, serverId } ) {
'use client'
const [text, setText] = useState("");
const textAreaRef = useRef(null);
const [formattedText, setFormattedText] = useState([]);

useEffect(() => {
    textAreaRef.current.style.height = '20px'; // Start from minHeight
    textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`; // Then increase

    // If the new height exceeds maxHeight, enable overflow
    if (textAreaRef.current.scrollHeight > 250) {
        textAreaRef.current.style.overflow = 'auto';
    } else {
        textAreaRef.current.style.overflow = 'hidden';
    }
}, [text]);

const sendMessage = async (event) => {
    event.preventDefault();
    if (text === "") {
        return;
    }
    let messageString = JSON.stringify(formattedText);
    let messagetype = 'text';
    SendMessage(messageString, messagetype, session, serverId, channelId);
    setFormattedText([]);
    setText("");
}


useEffect(() => {
// Define the patterns
const patterns = [
    { regex: /```([^`]+)```/g, format: 'multiline_code' },
    { regex: /`([^`]+)`/g, format: 'code' },
    { regex: /(\[[^\]]+\]\(http[^)]+\))/, format: 'a' },
    { regex: /^\s*> ###\s*(.+)/, format: 'blockquote_h3' },
    { regex: /^\s*> ##\s*(.+)/, format: 'blockquote_h2' },
    { regex: /^\s*> #\s*(.+)/, format: 'blockquote_h1' },
    { regex: /^\s*>\s*(.+)/, format: 'blockquote' },
    { regex: /^###\s*(.+)/, format: 'h3' },
    { regex: /^##\s*(.+)/, format: 'h2' },
    { regex: /^#\s*(.+)/, format: 'h1' },
    { regex: /\*\*\*\s*([^*]+?)\s*\*\*\*/g, format: 'bi' },
    { regex: /\*\*(.*?)\*\*/, format: 'b' },
    { regex: /^\s{2,}\*\s(.+)/, format: 'sublist'},
    { regex: /^\s{2,}-\s(.+)/, format: 'sublist'},
    { regex: /^\s*-\s(.+)/, format: 'li'},
    { regex: /^\s*\*\s(.+)/, format: 'li'},
    { regex: /\*([^*\s]+)\*/g, format: 'i' },
    { regex: /~~(.*?)~~/g, format: 'del' },
    { regex: /__(.*?)__/g, format: 'u' },
];
// Initialize the array with the original text
let parts = [{ message: text, formats: [], line: 1 }];
let lineNumber = 1;

// Apply the multiline code formatting first
parts = applyFormat(parts, patterns.find(pattern => pattern.format === 'multiline_code'));

// Then split the text by newline characters
parts = parts.flatMap(part => {
    if (part.formats.includes('multiline_code')) {
        // Don't split multiline code
        return [part];
    } else {
        // Split other text by newline characters
        return part.message.split('\n').map((line, index) => {
            if (index > 0) {
            lineNumber++;
            }
            return { message: line, formats: [], line: lineNumber };
        });
    }
});
// Apply the other formats
patterns.filter(pattern => pattern.format !== 'multiline_code').forEach(pattern => {
    parts = applyFormat(parts, pattern);
});

function applyFormat(parts, pattern) {
    let newParts = [];
    parts.forEach(part => {
        if (typeof part.message === 'string') {
            let splitParts = part.message.split(pattern.regex);
            splitParts.forEach((splitPart, index) => {
            if (index % 2 === 0) {
                // This part does not match the pattern
                newParts.push({ message: splitPart, formats: part.formats, line: part.line });
            } else {
                    // This part matches the pattern
                    // If the format is 'a', keep the link text and URL together in the same part
                    if (pattern.format === 'a') {
                        const linkText = splitPart.match(/\[([^\]]+)\]/)[1];
                        const linkUrl = splitPart.match(/\((http[^)]+)\)/)[1];
                        newParts.push({ message: { text: linkText, url: linkUrl }, formats: [...part.formats, pattern.format], line: part.line });          
                    } else {
                        newParts.push({ message: splitPart, formats: [...part.formats, pattern.format], line: part.line });
                        }
                    }
                });
            } else {
                // If part.message is not a string, just push the part to newParts
                newParts.push(part);
            }
        });
        return newParts;
    }

    setFormattedText(parts);
}, [text]);

const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) {
        return; 
    }
    const filename = file.name;
    // Use FileReader for binary data
    const reader = new FileReader();
    reader.onload = (event) => {
        sendFileToServer(event.target.result, filename, file.type); 
    };
    reader.onerror = (error) => {
        console.error('Error reading file:', error);
    };
    reader.readAsArrayBuffer(file); 

    
};


const sendFileToServer = async (fileData, filename, type) => {
    const isImageType = (type) => type.startsWith('image/');
    const isVideoType = (type) => type.startsWith('video/');
    if (isImageType(type)) {
        const fileExtension = filename.split('.').pop();
        let filename_hex = Buffer.from(filename).toString('hex');
        try {
            const response = await axios.post('http://127.0.0.1:8000/upload/withextention/' + filename_hex + '/' + session.user.id + '/' + session.user.secret + '/' + serverId + '/' + channelId + '/' + fileExtension, fileData);
            const file_url = response.data;
            const file_url_string = JSON.stringify(file_url);
            const messagetype = 'image';
            SendMessage(file_url_string, messagetype, session, serverId, channelId);
        } catch (error) {
            console.error('Error sending file:', error); 
        }
    } else if (isVideoType(type)) {
        const fileExtension = filename.split('.').pop();
        let filename_hex = Buffer.from(filename).toString('hex');
        try {
            const response = await axios.post('http://127.0.0.1:8000/upload/withextention/' + filename_hex + '/' + session.user.id + '/' + session.user.secret + '/' + serverId + '/' + channelId + '/' + fileExtension, fileData);
            const file_url = response.data;
            const file_url_string = JSON.stringify(file_url);
            const messagetype = 'video';
            SendMessage(file_url_string, messagetype, session, serverId, channelId);  
        } catch (error) {
            console.error('Error sending file:', error); 
        }
    }
    else {
        let filename_hex = Buffer.from(filename).toString('hex');
        try {
            const response = await axios.post('http://127.0.0.1:8000/upload/' + filename_hex + '/' + session.user.id + '/' + session.user.secret + '/' + serverId + '/' + channelId, fileData);
            const file_url = response.data;
            const file_url_string = JSON.stringify(file_url);
            const messagetype = 'file';
            SendMessage(file_url_string, messagetype, session, serverId, channelId);    
        } catch (error) {
            console.error('Error sending file:', error); 
        }
    }
};  


return (
    <div className="text-white backdrop-blur-lg bg-gray-600/20 message-input-container items-center flex rounded-xl">
        
    {/* START Upload button */}
    
    <div className='justift-center rounded-full items-center m-2 self-start'>
        <input type="file" id="fileInput" style={{ display: 'none' }} onChange={handleFileChange} />
        <button onClick={() => document.getElementById('fileInput').click()}>
            <svg fill="#bfbfbf" width="28px" height="28px" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.5 29.5c-7.18 0-13-5.82-13-13s5.82-13 13-13 13 5.82 13 13-5.82 13-13 13zM21.938 15.938c0-0.552-0.448-1-1-1h-4v-4c0-0.552-0.447-1-1-1h-1c-0.553 0-1 0.448-1 1v4h-4c-0.553 0-1 0.448-1 1v1c0 0.553 0.447 1 1 1h4v4c0 0.553 0.447 1 1 1h1c0.553 0 1-0.447 1-1v-4h4c0.552 0 1-0.447 1-1v-1z"></path>
            </svg>
        </button>
    </div>
    
    {/* END Upload button  */}


    {/* START textarea button */}
    
    <div className='grow justify-center items-center'>
        <textarea
            ref={textAreaRef}
            id="messageInput"
            name="messageInput"
            className="focus:outline-none grow bg-transparent message-input p-2 text-white resize-none better-scrollbar h-28"
            placeholder="type message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                }
            }}
            style={{ minHeight: '20px', maxHeight: '250px', overflow: 'auto' }}
        />
    </div>
    
    {/* END textarea button */}
    
    </div>        
);
}