"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            let socketUrl = 'http://localhost:5000';
            if (typeof window !== 'undefined') {
                socketUrl = `http://${window.location.hostname}:5000`;
            }
            const newSocket = io(socketUrl);
            setSocket(newSocket);

            newSocket.on('connect', () => {
                console.log('Socket.io connected:', newSocket.id);
                // Register user room channel
                newSocket.emit('join_user', user.id);
            });

            return () => {
                newSocket.disconnect();
            };
        } else {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
        }
    }, [user]);

    const sendSocketMsg = (sender_id, receiver_id, message, file_url = null, file_type = null) => {
        if (socket) {
            socket.emit('send_msg', { sender_id, receiver_id, message, file_url, file_type });
        }
    };

    return (
        <SocketContext.Provider value={{ socket, sendSocketMsg }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
