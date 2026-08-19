const ioClient = require('socket.io-client');
const socket = ioClient('http://localhost:5000');

socket.on('connect', () => {
    console.log('Test client connected');
    socket.emit('join_user', 1);
    socket.emit('join_user', 2);
    socket.emit('join_user', 3);
});

socket.on('new_notification', (data) => {
    console.log('Received notification via socket:', data);
    process.exit(0);
});

setTimeout(() => {
    console.log('Timeout waiting for notification');
    process.exit(1);
}, 10000);
