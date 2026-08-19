const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/authRoutes');
const siswaRoutes = require('./routes/siswaRoutes');
const akademikRoutes = require('./routes/akademikRoutes');
const kedisiplinanRoutes = require('./routes/kedisiplinanRoutes');
const sppRoutes = require('./routes/sppRoutes');
const chatRoutes = require('./routes/chatRoutes');
const jadwalRoutes = require('./routes/jadwalRoutes');
const kelasRoutes = require('./routes/kelasRoutes');
const mapelRoutes = require('./routes/mapelRoutes');
const pengumumanRoutes = require('./routes/pengumumanRoutes');
const nilaiRoutes = require('./routes/nilaiRoutes');
const pushRoutes = require('./routes/pushRoutes');
const tahunAjaranRoutes = require('./routes/tahunAjaranRoutes');
const honorRoutes = require('./routes/honorRoutes');
const bimbinganKonselingRoutes = require('./routes/bimbinganKonselingRoutes');
const ekskulRoutes = require('./routes/ekskulRoutes');
const nilaiEkskulRoutes = require('./routes/nilaiEkskulRoutes');
const mutasiRoutes = require('./routes/mutasiRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/siswa', siswaRoutes);
app.use('/api/akademik', akademikRoutes);
app.use('/api/kedisiplinan', kedisiplinanRoutes);
app.use('/api/keuangan', sppRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/jadwal', jadwalRoutes);
app.use('/api/kelas', kelasRoutes);
app.use('/api/mapel', mapelRoutes);
app.use('/api/pengumuman', pengumumanRoutes);
app.use('/api/nilai', nilaiRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/tahun-ajaran', tahunAjaranRoutes);
app.use('/api/bendahara/honor', honorRoutes);
app.use('/api/bimbingan-konseling', bimbinganKonselingRoutes);
app.use('/api/ekskul', ekskulRoutes);
app.use('/api/nilai-ekskul', nilaiEkskulRoutes);
app.use('/api/mutasi', mutasiRoutes);

// Root Route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to siswa Monitoring System API Server' });
});

// Socket.io (Real-time Chat)
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
app.set('io', io);

io.on('connection', (socket) => {
    console.log('A socket client connected: ' + socket.id);

    // Register user room
    socket.on('join_user', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`Socket ${socket.id} joined room user_${userId}`);
    });

    // Handle sending message
    socket.on('send_msg', async (data) => {
        const { sender_id, receiver_id, message, file_url, file_type } = data;
        if (!sender_id || !receiver_id || (!message && !file_url)) return;

        try {
            // Save to Database
            const [result] = await db.query(
                'INSERT INTO chat_messages (sender_id, receiver_id, message, file_url, file_type, is_read) VALUES (?, ?, ?, ?, ?, FALSE)',
                [sender_id, receiver_id, message || '', file_url || null, file_type || null]
            );
            
            const messagePayload = {
                id: result.insertId,
                sender_id,
                receiver_id,
                message: message || '',
                file_url: file_url || null,
                file_type: file_type || null,
                is_read: 0,
                created_at: new Date().toISOString()
            };

            // Broadcast message to receiver's room and sender's room
            io.to(`user_${receiver_id}`).emit('receive_msg', messagePayload);
            io.to(`user_${sender_id}`).emit('receive_msg', messagePayload);
        } catch (err) {
            console.error('Error saving chat message via socket:', err);
        }
    });

    // Edit message
    socket.on('edit_msg', async (data) => {
        try {
            const { message_id, new_message, sender_id, receiver_id } = data;
            
            // Broadcast edit_msg to receiver's room and sender's room
            const editPayload = { message_id, new_message, sender_id, receiver_id };
            io.to(`user_${receiver_id}`).emit('edit_msg', editPayload);
            io.to(`user_${sender_id}`).emit('edit_msg', editPayload);
        } catch (err) {
            console.error('Error broadcasting edit message:', err);
        }
    });

    // Delete message for everyone
    socket.on('delete_msg_everyone', (data) => {
        try {
            const { message_id, sender_id, receiver_id } = data;
            
            const deletePayload = { message_id, sender_id, receiver_id };
            io.to(`user_${receiver_id}`).emit('delete_msg_everyone', deletePayload);
            io.to(`user_${sender_id}`).emit('delete_msg_everyone', deletePayload);
        } catch (err) {
            console.error('Error broadcasting delete message:', err);
        }
    });

    // WebRTC Signaling Events
    socket.on('call_user', (data) => {
        io.to(`user_${data.userToCall}`).emit('incoming_call', { signal: data.signalData, from: data.from, type: data.type, callerName: data.callerName });
    });

    socket.on('answer_call', (data) => {
        io.to(`user_${data.to}`).emit('call_accepted', data.signal);
    });

    socket.on('reject_call', (data) => {
        io.to(`user_${data.to}`).emit('call_rejected');
    });

    socket.on('ice_candidate', (data) => {
        io.to(`user_${data.to}`).emit('ice_candidate', data.candidate);
    });

    socket.on('end_call', (data) => {
        io.to(`user_${data.to}`).emit('call_ended');
    });

    socket.on('disconnect', () => {
        console.log('Socket client disconnected: ' + socket.id);
    });
});

// Port Listening
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
