'use client'

import { useState, useEffect, useRef } from "react";

import GetMessages from "./GetMessages";
import InputMessage from "./InputMessage";
import React from "react";

export default function Chatroom({session , channelId , serverid}) {
'use client'
const [gotmessages, setGotmessages] = useState([]);
const hasRungotmessages = useRef(false);
useEffect(() => {
  console.log(serverid, channelId);
}, []);
useEffect(() => {
    if (!hasRungotmessages.current && gotmessages.length === 0) {
        const getinitialmessage = async () => {
            const messages = await GetMessages( session, channelId, serverid);
            setGotmessages(messages);
        }
        getinitialmessage();
        hasRungotmessages.current = true;
    }
}, [gotmessages]);


  
return (
    <>
        <div className="border-2 border-white chatroom backdrop-blur-md flex flex-col justify-end">
        
        {/* WRAP MESSAGES AREA START */}        

        
          <div className="overflow-y-auto messages-container m-4">
            {(() => {
              let prevSenderid = null;
              let prevFormattedDate = null;
              let prevFormattedTime = null;
          
              return gotmessages.slice().reverse().map((message) => {
                const messageDate = new Date(message.createdAt);
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
          
                let formattedDate;
                if (messageDate.toDateString() === today.toDateString()) {
                  formattedDate = 'Today';
                } else if (messageDate.toDateString() === yesterday.toDateString()) {
                  formattedDate = 'Yesterday';
                } else {
                  formattedDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(messageDate);
                }
          
                const formattedTime = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(messageDate);
          
                const shouldDisplayDetails = message.senderid !== prevSenderid || formattedDate !== prevFormattedDate || formattedTime !== prevFormattedTime;
                
                prevSenderid = message.senderid;
                prevFormattedDate = formattedDate;
                prevFormattedTime = formattedTime;
                
                return (  
                <div key={message.id}>
                    {shouldDisplayDetails ? (
                  <div className="mt-4 mr-4 flex text-white text-2xl" key={message.id}>
                    {shouldDisplayDetails ? (
                      <img src={message.senderAvatar} className="ml-4 rounded-full h-10 w-10 flex-shrink-0" />
                    ) : (
                      <div className="ml-4 rounded-full h-10 w-10 flex-shrink-0" />
                    )}
                    <div className="bg-black/10 backdrop-blur p-3 rounded-lg flex-grow ml-1">
                      {shouldDisplayDetails && (
                        <div className="flex mb-1 items-end">
                          <p className="text-white font-semibold text-sm mr-2">{message.sendername}</p>
                          <p className="text-white text-xs font-light items-end">{`${formattedDate} at ${formattedTime}`}</p>
                        </div>
                      )}
                      <div className="text-white text-sm font-normal">
                      {message.type === 'text' && (
                        <>
                        
                      {message.message.map((part, index) => {
                        let formattedMessage = part.message;
                        part.formats.forEach(format => {
                          switch (format) {
                            case 'b':
                              formattedMessage = <b>{formattedMessage}</b>;
                              break;
                            case 'i':
                              formattedMessage = <i>{formattedMessage}</i>;
                              break;
                            case 'u':
                              formattedMessage = <u>{formattedMessage}</u>;
                              break;
                            case 'del':
                              formattedMessage = <del>{formattedMessage}</del>;
                              break;
                            case 'bi':
                              formattedMessage = <b><i>{formattedMessage}</i></b>;
                              break;
                            case 'code':
                              formattedMessage = <code>{formattedMessage}</code>;
                              break;
                            case 'multiline_code':
                              formattedMessage = formattedMessage.split('\n').map((line, i) => <code key={i}>{line}<br /></code>);
                              break;
                            case 'h1':
                              formattedMessage = <h1><b>{formattedMessage}</b></h1>;
                              break;
                            case 'h2':
                              formattedMessage = <h2><b>{formattedMessage}</b></h2>;
                              break;
                            case 'h3':
                              formattedMessage = <h3><b>{formattedMessage}</b></h3>;
                              break;
                            case "a":
                                formattedMessage = <a href={part.message.url}>{part.message.text}</a>;
                                break;
                            case 'blockquote':
                              formattedMessage = <blockquote className="border-l-4 border-gray-300 pl-4">{formattedMessage}</blockquote>;
                              break;
                            case 'blockquote_h1':
                              formattedMessage = <blockquote className="border-l-4 border-gray-300 pl-4"><h1>{formattedMessage}</h1></blockquote>;
                              break;
                            case 'blockquote_h2':
                              formattedMessage = <blockquote className="border-l-4 border-gray-300 pl-4"><h2>{formattedMessage}</h2></blockquote>;
                              break;
                            case 'li':
                              formattedMessage = <li>{formattedMessage}</li>;
                              break;
                            case "sublist":
                                const previousLine = message.message.filter(part => part.line === (message.message[index].line - 1));
                                const previousLineHasListItem = previousLine.some(part => part.formats.includes('li'));
                                const listStyle = previousLineHasListItem ? 'list-circle ml-6' : 'list-disc';
                                formattedMessage = <li className={`${listStyle} list-inside`}>{formattedMessage}</li>;
                                break;
                            case 'blockquote_h3':
                              formattedMessage = <blockquote className="border-l-4 border-gray-300 pl-4"><h3>{formattedMessage}</h3></blockquote>;
                              break;
                              default:
                              break;
                          }
                        });
                        const lineBreak = index > 0 && message.message[index].line !== message.message[index - 1].line ? <br /> : null;
                      
                        return (
                          <React.Fragment key={index}>
                            {lineBreak}
                            <span>{formattedMessage}</span>
                          </React.Fragment>
                        )    })}
                        </>
                      )}
                      {message.type === 'image' && (
                        <>
                          <img src={`http://localhost:8000/files/${message.message}`} alt="message" />
                          <a href={`http://localhost:8000/download/${message.message}`}>
                            <p className="text-blue-400">download</p>
                          </a>
                        </>
                      )}
                      {message.type === 'video' && (
                        <>
                          <video src={`http://localhost:8000/files/${message.message}`} controls alt="message" />
                          <a href={`http://localhost:8000/download/${message.message}`}>
                            <p className="text-blue-400">download</p>
                          </a>
                        </>
                      )}
                      {message.type === 'file' && (
                        <>
                          <a href={`http://localhost:8000/download/${message.message}`}>
                            <p className="text-blue-400">download file</p>
                          </a>
                        </>
                      )}
                      </div>
                    </div>
                  </div>
                  ) : (
                    <div className="mt-1 mr-4 flex text-white text-2xl" key={message.id}>
                    {shouldDisplayDetails ? (
                      <img src={message.senderAvatar} className="ml-4 rounded-full h-10 w-10 flex-shrink-0" />
                    ) : (
                      <div className="ml-4 rounded-full h-10 w-10 flex-shrink-0" />
                    )}
                    <div className="bg-black/10 backdrop-blur p-3 rounded-lg flex-grow ml-1">
                      {shouldDisplayDetails && (
                        <div className="flex mb-1 items-end">
                          <p className="text-white font-semibold text-sm mr-2">{message.sendername}</p>
                          <p className="text-white text-xs font-light items-end">{`${formattedDate} at ${formattedTime}`}</p>
                        </div>
                      )}
                      <div className="text-white text-sm font-normal">
                      {message.type === 'text' && (
                        <>
                        
                      {message.message.map((part, index) => {
                        let formattedMessage = part.message;
                        part.formats.forEach(format => {
                          switch (format) {
                            case 'b':
                              formattedMessage = <b>{formattedMessage}</b>;
                              break;
                            case 'i':
                              formattedMessage = <i>{formattedMessage}</i>;
                              break;
                            case 'u':
                              formattedMessage = <u>{formattedMessage}</u>;
                              break;
                            case 'del':
                              formattedMessage = <del>{formattedMessage}</del>;
                              break;
                            case 'bi':
                              formattedMessage = <b><i>{formattedMessage}</i></b>;
                              break;
                            case 'code':
                              formattedMessage = <code>{formattedMessage}</code>;
                              break;
                            case 'multiline_code':
                              formattedMessage = formattedMessage.split('\n').map((line, i) => <code key={i}>{line}<br /></code>);
                              break;
                            case 'h1':
                              formattedMessage = <h1><b>{formattedMessage}</b></h1>;
                              break;
                            case 'h2':
                              formattedMessage = <h2><b>{formattedMessage}</b></h2>;
                              break;
                            case 'h3':
                              formattedMessage = <h3><b>{formattedMessage}</b></h3>;
                              break;
                            case "a":
                                formattedMessage = <a href={part.message.url}>{part.message.text}</a>;
                                break;
                            case 'blockquote':
                              formattedMessage = <blockquote className="border-l-4 border-gray-300 pl-4">{formattedMessage}</blockquote>;
                              break;
                            case 'blockquote_h1':
                              formattedMessage = <blockquote className="border-l-4 border-gray-300 pl-4"><h1>{formattedMessage}</h1></blockquote>;
                              break;
                            case 'blockquote_h2':
                              formattedMessage = <blockquote className="border-l-4 border-gray-300 pl-4"><h2>{formattedMessage}</h2></blockquote>;
                              break;
                            case 'li':
                              formattedMessage = <li>{formattedMessage}</li>;
                              break;
                            case "sublist":
                                const previousLine = message.message.filter(part => part.line === (message.message[index].line - 1));
                                const previousLineHasListItem = previousLine.some(part => part.formats.includes('li'));
                                const listStyle = previousLineHasListItem ? 'list-circle ml-6' : 'list-disc';
                                formattedMessage = <li className={`${listStyle} list-inside`}>{formattedMessage}</li>;
                                break;
                            case 'blockquote_h3':
                              formattedMessage = <blockquote className="border-l-4 border-gray-300 pl-4"><h3>{formattedMessage}</h3></blockquote>;
                              break;
                              default:
                              break;
                          }
                        });
                        const lineBreak = index > 0 && message.message[index].line !== message.message[index - 1].line ? <br /> : null;
                      
                        return (
                          <React.Fragment key={index}>
                            {lineBreak}
                            <span>{formattedMessage}</span>
                          </React.Fragment>
                        )    })}
                        </>
                      )}
                      {message.type === 'image' && (
                        <>
                          <img src={`http://localhost:8000/files/${message.message}`} alt="message" />
                          <a href={`http://localhost:8000/download/${message.message}`}>
                            download
                          </a>
                        </>
                      )}
                      {message.type === 'video' && (
                        <>
                          <video src={`http://localhost:8000/files/${message.message}`} controls alt="message" />
                          <a href={`http://localhost:8000/download/${message.message}`}>
                            <p className="text-blue-400">download</p>
                          </a>
                        </>
                      )}
                      {message.type === 'file' && (
                        <>
                          <a href={`http://localhost:8000/download/${message.message}`}>
                            <p className="text-blue-400">download file</p>
                          </a>
                        </>
                      )}
                      </div>
                    </div>
                  </div>
                    )} 
                </div>
                );
              });
            })()}
          </div>
                
        {/* WRAP MESSAGES AREA END */}        
        

        
        {/* TEXT INPUT START */}        
          
        <InputMessage session={session} channelId={channelId} serverId={serverid}/>
          
        {/* TEXT INPUT END */}        



</div>
</>
);
}