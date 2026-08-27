"use client";
import React, { useEffect, useRef, useState } from 'react';
import { Phone, Video, X, Mic, MicOff, VideoOff, PhoneMissed } from 'lucide-react';

export default function CallModal({ socket, currentUser, contact, onClose, initialCallType, incomingCallData }) {
    const [stream, setStream] = useState(null);
    const [receivingCall, setReceivingCall] = useState(false);
    const [caller, setCaller] = useState('');
    const [callerName, setCallerName] = useState('');
    const [callerSignal, setCallerSignal] = useState();
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [callType, setCallType] = useState('video'); // 'video' or 'audio'
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    
    // Are we the one initiating the call right now?
    const [initiating, setInitiating] = useState(false);

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();

    useEffect(() => {
        let currentStreamObj = null;

        // If we are initiating the call from the start
        if (contact && initialCallType) {
            setInitiating(true);
            setCallType(initialCallType);
            const mediaConstraints = initialCallType === 'video' ? { video: true, audio: true } : { audio: true };
            
            navigator.mediaDevices.getUserMedia(mediaConstraints).then((currentStream) => {
                currentStreamObj = currentStream;
                setStream(currentStream);
                if (myVideo.current) {
                    myVideo.current.srcObject = currentStream;
                }
                callUser(contact.id, initialCallType, currentStream);
            }).catch(err => {
                console.error("Failed to get local stream", err);
                if (err.name === 'NotReadableError') {
                    alert("Kamera/Mikrofon sedang digunakan oleh aplikasi atau tab lain. Mohon tutup penggunaan di tempat lain terlebih dahulu.");
                } else {
                    alert("Gagal mengakses Mikrofon/Kamera. Pastikan perangkat Anda memiliki Mikrofon/Kamera yang berfungsi.");
                }
                onClose();
            });
        }

        if (incomingCallData) {
            setReceivingCall(true);
            setCaller(incomingCallData.from);
            setCallerName(incomingCallData.callerName);
            setCallerSignal(incomingCallData.signal);
            setCallType(incomingCallData.type);
        }

        if (socket) {
            socket.on('call_ended', () => {
                setCallEnded(true);
                if (connectionRef.current) connectionRef.current.close();
                setTimeout(() => onClose(), 2000);
            });
            
            socket.on('call_rejected', () => {
                setCallEnded(true);
                alert("Panggilan ditolak.");
                if (initiating && contact) {
                    const logMsg = callType === 'video' ? `🎥 Panggilan Video (Ditolak)` : `📞 Panggilan Suara (Ditolak)`;
                    socket.emit('send_msg', {
                        sender_id: currentUser.id,
                        receiver_id: contact.id,
                        message: logMsg
                    });
                }
                setTimeout(() => onClose(), 2000);
            });
        }

        return () => {
            if (currentStreamObj) {
                currentStreamObj.getTracks().forEach(track => track.stop());
            }
            if (socket) {
                socket.off('call_ended');
                socket.off('call_rejected');
                socket.off('call_accepted');
                socket.off('ice_candidate');
            }
        };
    }, [socket, initialCallType, incomingCallData]);

    const callUser = (idToCall, type, localStream) => {
        const peer = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
            ]
        });
        
        connectionRef.current = peer;

        localStream.getTracks().forEach(track => {
            peer.addTrack(track, localStream);
        });

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice_candidate', {
                    to: idToCall,
                    candidate: event.candidate
                });
            }
        };

        peer.ontrack = (event) => {
            if (userVideo.current) {
                userVideo.current.srcObject = event.streams[0];
            }
        };

        // Explicitly create offer
        const makeOffer = async () => {
            try {
                const offer = await peer.createOffer();
                await peer.setLocalDescription(offer);
                socket.emit('call_user', {
                    userToCall: idToCall,
                    signalData: offer,
                    from: currentUser.id,
                    callerName: currentUser.nama_lengkap,
                    type: type
                });
            } catch (err) {
                console.error("Negotiation error", err);
            }
        };
        makeOffer();

        socket.on('call_accepted', async (signal) => {
            setCallAccepted(true);
            try {
                await peer.setRemoteDescription(new RTCSessionDescription(signal));
            } catch(e) {
                console.error("Error setting remote desc:", e);
            }
        });

        socket.on('ice_candidate', async (candidate) => {
            try {
                await peer.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error("Error adding ice candidate:", e);
            }
        });
    };

    const answerCall = async () => {
        const isVideoCall = callType === 'video';
        const mediaConstraints = isVideoCall ? { video: true, audio: true } : { audio: true };
        
        let currentStream;
        try {
            currentStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
            setStream(currentStream);
            if (myVideo.current) {
                myVideo.current.srcObject = currentStream;
            }
        } catch (err) {
            console.error("Failed to get local stream for answering", err);
            if (err.name === 'NotReadableError') {
                alert("Kamera/Mikrofon sedang digunakan di tab/aplikasi lain. Gagal menerima panggilan.");
            } else {
                alert("Gagal mengakses Mikrofon/Kamera.");
            }
            rejectCall();
            return;
        }

        setCallAccepted(true);

        const peer = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
            ]
        });
        
        connectionRef.current = peer;

        currentStream.getTracks().forEach(track => {
            peer.addTrack(track, currentStream);
        });

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice_candidate', {
                    to: caller,
                    candidate: event.candidate
                });
            }
        };

        peer.ontrack = (event) => {
            if (userVideo.current) {
                userVideo.current.srcObject = event.streams[0];
            }
        };

        socket.on('ice_candidate', async (candidate) => {
            try {
                await peer.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error("Error adding ice candidate:", e);
            }
        });

        try {
            await peer.setRemoteDescription(new RTCSessionDescription(callerSignal));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            socket.emit('answer_call', { signal: answer, to: caller });
        } catch (e) {
            console.error("Error creating answer", e);
        }
    };

    const leaveCall = () => {
        setCallEnded(true);
        if (connectionRef.current) {
            connectionRef.current.close();
        }
        
        socket.emit('end_call', { to: contact?.id || caller });
        
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        if (initiating && contact) {
            const logMsg = callType === 'video' ? `🎥 Panggilan Video (${callAccepted ? 'Selesai' : 'Tidak Terjawab'})` : `📞 Panggilan Suara (${callAccepted ? 'Selesai' : 'Tidak Terjawab'})`;
            socket.emit('send_msg', {
                sender_id: currentUser.id,
                receiver_id: contact.id,
                message: logMsg
            });
        }

        onClose();
    };

    const rejectCall = () => {
        socket.emit('reject_call', { to: caller });
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        onClose();
    };

    const toggleMute = () => {
        if (stream) {
            stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled;
            setIsMuted(!stream.getAudioTracks()[0].enabled);
        }
    };

    const toggleVideo = () => {
        if (stream) {
            stream.getVideoTracks()[0].enabled = !stream.getVideoTracks()[0].enabled;
            setIsVideoOff(!stream.getVideoTracks()[0].enabled);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-3xl w-full max-w-4xl p-6 flex flex-col items-center relative overflow-hidden shadow-2xl border border-emerald-500/20">
                
                <h2 className="text-white text-xl font-bold mb-4 z-10 flex items-center gap-2">
                    {callType === 'video' ? <Video className="h-5 w-5 text-emerald-400" /> : <Phone className="h-5 w-5 text-emerald-400" />}
                    {callAccepted ? "Sedang Berlangsung" : initiating ? "Memanggil..." : "Panggilan Masuk"}
                </h2>

                <div className="flex w-full gap-4 relative justify-center h-[60vh]">
                    {/* User Video (Remote) */}
                    {callAccepted && !callEnded ? (
                        <div className="flex-1 rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-slate-700 relative h-full w-full">
                            <video playsInline ref={userVideo} autoPlay className="h-full w-full object-cover" />
                            <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1.5 rounded-lg text-white text-sm font-medium backdrop-blur-sm">
                                {contact?.nama_lengkap || callerName}
                            </div>
                        </div>
                    ) : (
                        initiating && (
                            <div className="flex-1 rounded-2xl bg-slate-800 flex flex-col items-center justify-center border border-slate-700 text-center animate-pulse h-full w-full">
                                <div className="h-24 w-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                                    <Phone className="h-10 w-10 text-emerald-400 animate-ping" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">{contact?.nama_lengkap}</h3>
                                <p className="text-emerald-400 mt-2 text-sm font-medium tracking-wide">Berdering...</p>
                            </div>
                        )
                    )}

                    {/* My Video (Local) */}
                    {(stream && !isVideoOff && callType === 'video') && (
                        <div className={`rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-lg border border-emerald-500/30 ${callAccepted ? 'absolute bottom-6 right-6 w-48 h-64 z-20' : 'w-full h-full max-w-sm relative'}`}>
                            <video playsInline muted ref={myVideo} autoPlay className="h-full w-full object-cover transform -scale-x-100" />
                            <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-white text-[10px] font-medium">Anda</div>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="mt-8 flex gap-4 z-10">
                    {receivingCall && !callAccepted ? (
                        <>
                            <button onClick={answerCall} className="h-14 w-14 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 transition hover:scale-105">
                                {callType === 'video' ? <Video className="h-6 w-6 text-white" /> : <Phone className="h-6 w-6 text-white" />}
                            </button>
                            <button onClick={rejectCall} className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center shadow-lg shadow-red-500/30 transition hover:scale-105">
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={toggleMute} className={`h-12 w-12 rounded-full flex items-center justify-center transition hover:scale-105 ${isMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
                                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                            </button>
                            {callType === 'video' && (
                                <button onClick={toggleVideo} className={`h-12 w-12 rounded-full flex items-center justify-center transition hover:scale-105 ${isVideoOff ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
                                    {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                                </button>
                            )}
                            <button onClick={leaveCall} className="h-12 w-12 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center shadow-lg shadow-red-500/30 transition hover:scale-105">
                                <PhoneMissed className="h-5 w-5 text-white" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
