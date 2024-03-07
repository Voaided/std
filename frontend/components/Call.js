'use client'

import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';

function Call() {
    const [peerId, setPeerId] = useState('');
    const [remotePeerIdValue, setRemotePeerIdValue] = useState('');
    const peerInstance = useRef(null);
    const screenSharePeerinstance = useRef(null);
    const localstreaming = useRef(null);
    const localscreensharestreaming = useRef(null);
    const [connectedpeers, setConnectedpeers] = useState([]);
    const [errors, setErrors] = useState('');
    const [currentCalls, setCurrentCalls] = useState([]);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState('');
    const [micDevices, setMicDevices] = useState([]);
    const [selectedMicDevice, setSelectedMicDevice] = useState('');
    const [isSharingScreen, setIsSharingScreen] = useState(false);
    const [isscreensharepeerstarted, setIsscreensharepeerstarted] = useState(false);
    const [screensharepeerId, setScreensharepeerId] = useState('');

    const [isGetPermsBtnDisabled, setIsGetPermsBtnDisabled] = useState(false);
    const [isStartBtnDisabled, setIsStartBtnDisabled] = useState(true);
    const [isCallBtnDisabled, setIsCallBtnDisabled] = useState(true);
    const [isToggleCameraBtnDisabled, setIsToggleCameraBtnDisabled] = useState(true);
    const [isToggleScreenShareBtnDisabled, setIsToggleScreenShareBtnDisabled] = useState(true);
    const [isToggleMuteBtnDisabled, setIsToggleMuteBtnDisabled] = useState(true);
    const [isCameraSelectionDisabled, setIsCameraSelectionDisabled] = useState(true);
    const [isMicSelectionDisabled, setIsMicSelectionDisabled] = useState(true);
    const [isRemotePeerIdInputDisabled, setIsRemotePeerIdInputDisabled] = useState(true);
    const config = {
        host: 'localhost',
        port: 9001,
        key: 'Straight_discord',
        path: '/myapp'
    };



    useEffect(() => {
        navigator.mediaDevices.enumerateDevices()
            .then(devices => {
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                setDevices(videoDevices);
                setSelectedDevice(videoDevices[0]?.deviceId);
            });
    }, []);

    const handleDeviceChange = async (e) => {
        setSelectedDevice(e.target.value);
        const newVideoTrack = await navigator.mediaDevices.getUserMedia({ video: { deviceId: e.target.value } }).then(stream => stream.getTracks()[0]);
        currentCalls.forEach(call => {
            const senders = call.peerConnection.getSenders();
            for (let sender of senders) {
                if (sender.track.kind === 'video') {
                    sender.replaceTrack(newVideoTrack);
                }
            }
        });
    };

    const toggleCamera = async () => {
        if (!isCameraOn) {
            // Start the camera
            try {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    const localStream = await navigator.mediaDevices.getUserMedia({
                        video: { deviceId: selectedDevice },
                        audio: {
                            deviceId: selectedMicDevice,
                            echoCancellation: true,
                            noiseSuppression: true,
                        },                    });
                    // Replace the tracks in the peer connection
                    currentCalls.forEach(call => {
                        localStream.getTracks().forEach(track => {
                            call.peerConnection.getSenders().forEach(sender => {
                                if (sender.track.kind === track.kind) {
                                    sender.replaceTrack(track);
                                }
                            });
                        });
                    });
                    localstreaming.current = localStream;

                    const userVideoElement = document.getElementById('uservideo');
                    if (userVideoElement) {
                        userVideoElement.srcObject = localStream;
                        userVideoElement.muted = true;
                    }
                } else {
                    throw new Error('Media devices are not available');
                }
            } catch (error) {
                console.error('Error capturing media: ', error);
                setErrors("CaptureError");
            }
        } else {
            // Stop the camera
            if (localstreaming.current) {
                localstreaming.current.getVideoTracks().forEach(track => track.stop());
            }
        }

        // Toggle the camera status
        setIsCameraOn(!isCameraOn);

        // Send a message to all connected peers about the camera status
        connectedpeers.forEach(peerId => {
            const conn = peerInstance.current.connect(peerId);
            conn.on('open', () => {
                conn.send({ type: 'cameraStatus', isCameraOn: !isCameraOn });
            });
        });
    };

    useEffect(() => {
        const intervalId = setInterval(() => {
            //dont console log if there are no connected peers
            if (connectedpeers.length > 0) {
                console.log("connected peers are:" + connectedpeers);
            }

        }, 5000);

        return () => clearInterval(intervalId);
    }, [connectedpeers])



    useEffect(() => {
        for ( let i = 0; i < connectedpeers.length; i++) {
            console.log(connectedpeers[i]);
            const conn = peerInstance.current.connect(connectedpeers[i]);
            let isOnline = false;
            conn.on("open", () => {
                const intervalId = setInterval(() => {
                    conn.send("ping" + connectedpeers[i]); // Send a "ping" message every 1500ms
                    console.log("ping" + connectedpeers[i]);
                    isOnline = false;
                    setTimeout(() => {
                        if (!isOnline) {
                            console.log(`Peer ${connectedpeers[i]} is offline.`);
                            setConnectedpeers(prevPeers => prevPeers.filter(peerId => peerId !== conn.peer));


                            const video = document.getElementById(conn.peer);
                            if (video) {
                                video.remove();

                            }
                            const decibelElement = document.getElementById(conn.peer + '-decibel');
                            if (decibelElement) {
                                decibelElement.remove();
                            }
                            // Clear the interval
                            clearInterval(intervalId);
                        }
                    }, 3500);
                }, 2500);
            });
            conn.on("data", (data) => {
                if (data === "pong" + connectedpeers[i]) {
                    isOnline = true;
                    console.log(`Peer ${connectedpeers[i]} is online.`);
                }
            });
        }

    }, [connectedpeers]);



    const startselectedpeer = async () => {

        const peer = new Peer(peerId, config);
        peer.on('open', (id) => {
            setPeerId(id)
            console.log('My peer ID is: ' + id)
        });
        peer.on('call', (call) => {
            call.answer();
            call.on('stream', (remoteStream) => {
                if (!document.getElementById(call.peer)) {
                    startcall(call.peer)
                    const video = document.createElement('video');
                    video.srcObject = remoteStream;
                    video.autoplay = true;
                    video.playsInline = true;
                    video.id = call.peer;
                    document.getElementById("remotevideocontainer").appendChild(video);
                    //add peer to connected peers
                    if (!connectedpeers.includes(call.peer)) {
                        setConnectedpeers(prevconnectedpeers => [...prevconnectedpeers, call.peer]);
                    }
                    if (remoteStream.getAudioTracks().length > 0) {

                        // Create an AudioContext and an AnalyserNode
                        const audioContext = new AudioContext();
                        const analyser = audioContext.createAnalyser();
                        analyser.fftSize = 256;

                        // Connect the audio stream to the analyser
                        const source = audioContext.createMediaStreamSource(remoteStream);
                        source.connect(analyser);

                        // Create an array to hold the frequency data
                        const dataArray = new Uint8Array(analyser.frequencyBinCount);

                        // Create a new HTML element to display the decibel level
                        const decibelElement = document.createElement('p');
                        decibelElement.id = call.peer + '-decibel';
                        document.getElementById("remotevideocontainer").appendChild(decibelElement);

                        // Function to calculate and display the decibel level
                        const calculateDecibelLevel = () => {
                            analyser.getByteFrequencyData(dataArray);

                            // Calculate the RMS value of the frequencies
                            let rms = 0;
                            for (let i = 0; i < dataArray.length; i++) {
                                rms += dataArray[i] * dataArray[i];
                            }
                            rms = Math.sqrt(rms / dataArray.length);

                            // Convert the RMS value to decibels
                            const db = 20 * Math.log10(rms);

                            // Display the decibel level
                            decibelElement.textContent = `Decibel level of peer ${call.peer}: ${db.toFixed(2)}`;

                        };


                        // Call the function every second
                        setInterval(calculateDecibelLevel, 1000);

                    }
                }


            });

            call.on('close', () => {
                const video = document.getElementById(call.peer);
                if (video) {
                    video.remove();
                    if (connectedpeers.includes(call.peer)) {
                        setConnectedpeers(prevPeers => prevPeers.filter(peerId => peerId !== call.peer));
                    }
                }
                const decibelElement = document.getElementById(call.peer + '-decibel');
                if (decibelElement) {
                    decibelElement.remove();
                    if (connectedpeers.includes(call.peer)) {
                        setConnectedpeers(prevPeers => prevPeers.filter(peerId => peerId !== call.peer));
                    }
                }
            });


        });
        peer.on("connection", (conn) => {
            conn.on("data", (data) => {
                if (data === "ping" + peerId) {
                    conn.send("pong" + peerId); // Send back a "pong" message
                }
            });
            conn.on("data", (data) => {

                // Handle camera status messages
                if (data.type === 'cameraStatus') {
                    const video = document.getElementById(conn.peer);
                    const videoContainer = document.getElementById("remotevideocontainer");

                    if (data.isCameraOn) {
                        // If the camera is turned on, remove the image and show the video
                        if (video) {
                            video.style.display = 'block';
                        }
                        const image = document.getElementById(conn.peer + '-image');
                        if (image) {
                            videoContainer.removeChild(image);
                        }
                    } else {
                        // If the camera is turned off, hide the video and show the image
                        if (video) {
                            video.style.display = 'none';
                        }
                        let image = document.getElementById(conn.peer + '-image');
                        if (!image) {
                            image = document.createElement('img');
                            image.id = conn.peer + '-image';
                            image.src = 'https://w.wallhaven.cc/full/28/wallhaven-288vgg.jpg';
                            videoContainer.appendChild(image);
                        }
                    }
                }

            });
        });


        setIsCallBtnDisabled(false);
        setIsRemotePeerIdInputDisabled(false);
        peerInstance.current = peer;

    }

    const startcall = async (remotePeerId) => {

        const call = peerInstance.current.call(remotePeerId, localstreaming.current)
        setCurrentCalls(prevCalls => [...prevCalls, call]);



        const conn = peerInstance.current.connect(remotePeerId);
        conn.on("open", () => {
            conn.send("hi!");
        });
        conn.on("open", () => {
            if (!connectedpeers.includes(conn.peer)) {
                setConnectedpeers(prevconnectedpeers => [...prevconnectedpeers, call.peer]);
            }
            // Send the camera status to the peer
            conn.send({ type: 'cameraStatus', isCameraOn: isCameraOn });
        });
        call.on('close', () => {
            const video = document.getElementById(call.peer);
            if (video) {
                video.remove();
                if (connectedpeers.includes(call.peer)) {
                    setConnectedpeers(prevPeers => prevPeers.filter(peerId => peerId !== call.peer));
                }
            }
            const decibelElement = document.getElementById(call.peer + '-decibel');
            if (decibelElement) {
                decibelElement.remove();
                if (connectedpeers.includes(call.peer)) {
                    setConnectedpeers(prevPeers => prevPeers.filter(peerId => peerId !== call.peer));
                }
            }
        });
    }


    const toggleMute = () => {
        const audioTracks = localstreaming.current.getAudioTracks();
        if (audioTracks.length === 0) {
            console.log("No local audio available.");
            return;
        }
        console.log("Toggling audio mute state.");
        for (let track of audioTracks) {
            if (track.getSettings().deviceId === selectedMicDevice) {
                // If the track is enabled, we'll disable it, and vice versa
                track.enabled = !track.enabled;
                currentCalls.forEach(call => {
                    const senders = call.peerConnection.getSenders();
                    for (let sender of senders) {
                        if (sender.track.kind === 'audio') {
                            sender.replaceTrack(track);
                        }
                    }
                });
            }
        }
        setIsMuted(!isMuted); // Update the mute state
    };


    const toggleScreenShare = async () => {
        if (isscreensharepeerstarted === false) {
            const screenSharePeer = new Peer(peerId + "screenshare", config);
            screenSharePeer.on('open', (id) => {
                console.log('My peer ID is: ' + id)
                setScreensharepeerId(peerId + "screenshare");
            });
            screenSharePeer.on('call', (call) => {
                call.answer();
                call.on('stream', (remoteStream) => {
                });


            });
            screenSharePeer.on("connection", (conn) => {
                conn.on("data", (data) => {
                    if (data === "ping" + screensharepeerId) {
                        conn.send("pong" + screensharepeerId); // Send back a "pong" message
                    }
                });
            });
            screenSharePeerinstance.current = screenSharePeer;
            setIsscreensharepeerstarted(true);

            if (isSharingScreen === false) {
                const screenShareStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true,
                });
                screenShareStream.getTracks().forEach(track => {
                    track.onended = () => {
                        // When the 'onended' event is fired, stop screen sharing
                        console.log("screen share stream is stopped");
                        localscreensharestreaming.current.getTracks().forEach(track => track.stop());
                        screenSharePeerinstance.current.destroy();
                        setIsscreensharepeerstarted(false);
                        setIsSharingScreen(false);
                    };
                });

                localscreensharestreaming.current = screenShareStream;
                console.log("screen share stream is started");
                for (let i = 0; i < connectedpeers.length; i++) {
                    const call = screenSharePeerinstance.current.call(connectedpeers[i], localscreensharestreaming.current);
                    call.on('stream', (remoteStream) => {

                    })
                }

                setIsSharingScreen(true);

            } else if (isSharingScreen === true) {
                localscreensharestreaming.current.getTracks().forEach(track => track.stop());
                screenSharePeerinstance.current.destroy();
                console.log("screen share stream is stopped");
                setIsscreensharepeerstarted(false);
                setIsSharingScreen(false);
            }

        }
        if (isscreensharepeerstarted === true) {
            if (isSharingScreen === false) {
                const screenShareStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true,
                });
                screenShareStream.getTracks().forEach(track => {
                    track.onended = () => {
                        // When the 'onended' event is fired, stop screen sharing
                        console.log("screen share stream is stopped");
                        localscreensharestreaming.current.getTracks().forEach(track => track.stop());
                        screenSharePeerinstance.current.destroy();
                        setIsscreensharepeerstarted(false);
                        setIsSharingScreen(false);
                    };
                });

                localscreensharestreaming.current = screenShareStream;
                console.log("screen share stream is started");
                for (let i = 0; i < connectedpeers.length; i++) {
                    const call = screenSharePeerinstance.current.call(connectedpeers[i], localscreensharestreaming.current);
                    call.on('stream', (remoteStream) => {

                    })
                }

                setIsSharingScreen(true);

            } else if (isSharingScreen === true) {
                localscreensharestreaming.current.getTracks().forEach(track => track.stop());
                screenSharePeerinstance.current.destroy();
                console.log("screen share stream is stopped");
                setIsscreensharepeerstarted(false);
                setIsSharingScreen(false);
            }
        }
    };

    useEffect(() => {
        navigator.mediaDevices.enumerateDevices()
            .then(devices => {
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                const audioDevices = devices.filter(device => device.kind === 'audioinput');
                setDevices(videoDevices);
                setMicDevices(audioDevices);
                setSelectedDevice(videoDevices[0]?.deviceId);
                setSelectedMicDevice(audioDevices[0]?.deviceId);
            });
    }, []);

    const handleMicDeviceChange = async (e) => {
        setSelectedMicDevice(e.target.value);
        const newAudioTrack = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: e.target.value } }).then(stream => stream.getTracks()[0]);
        currentCalls.forEach(call => {
            const senders = call.peerConnection.getSenders();
            for (let sender of senders) {
                if (sender.track.kind === 'audio') {
                    sender.replaceTrack(newAudioTrack);
                }
            }
        });
    };

    const Getperms = async () => {
        await toggleCamera();
        navigator.mediaDevices.enumerateDevices()
            .then(devices => {
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                const audioDevices = devices.filter(device => device.kind === 'audioinput');
                setDevices(videoDevices);
                setMicDevices(audioDevices);
                setSelectedDevice(videoDevices[0]?.deviceId);
                setSelectedMicDevice(audioDevices[0]?.deviceId);
            });

        setIsGetPermsBtnDisabled(true);
        setIsStartBtnDisabled(false);
        setIsToggleCameraBtnDisabled(false);
        setIsToggleScreenShareBtnDisabled(false);
        setIsToggleMuteBtnDisabled(false);
        setIsCameraSelectionDisabled(false);
        setIsMicSelectionDisabled(false);
    }
    return (
        <div className="App">

            {errors === "CaptureError" ? (
                <h1>There was an error capturing media</h1>
            ) : (
                <video id="uservideo" autoPlay playsInline={true}/>
            )}
            <button disabled={isGetPermsBtnDisabled} onClick={Getperms}> Get permissions</button>
            <input value={peerId} onChange={e => setPeerId(e.target.value)}/>
            <select disabled={isCameraSelectionDisabled} onChange={handleDeviceChange} value={selectedDevice}>
                {devices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                    </option>
                ))}
            </select>
            <select disabled={isMicSelectionDisabled} onChange={handleMicDeviceChange} value={selectedMicDevice}>
                {micDevices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                    </option>
                ))}
            </select>
            <button onClick={toggleCamera} disabled={isToggleCameraBtnDisabled}>{isCameraOn ? "Turn Off Camera" : "Turn On Camera"}</button>
            <button
                disabled={isToggleScreenShareBtnDisabled}
                onClick={toggleScreenShare}>{isSharingScreen ? "Stop Sharing Screen" : "Start Sharing Screen"}</button>
            <button disabled={isToggleMuteBtnDisabled} onClick={toggleMute}>{isMuted ? "Unmute" : "Mute"}</button>
            <button disabled={isStartBtnDisabled} onClick={startselectedpeer}>Start</button>
            <h1>Current user id is {peerId}</h1>
            <input disabled={isRemotePeerIdInputDisabled} type="text" value={remotePeerIdValue} onChange={e => setRemotePeerIdValue(e.target.value)}/>
            <button disabled={isCallBtnDisabled} onClick={() => startcall(remotePeerIdValue)}>Call</button>
            <div>
            </div>
            <div id="remotevideocontainer">


            </div>

        </div>
    );
}

export default Call;