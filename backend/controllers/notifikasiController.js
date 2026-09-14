const db = require('../config/db');

// Dapatkan semua notifikasi user (guru)
exports.getNotifikasi = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const [rows] = await db.query(
            'SELECT * FROM notifikasi WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
            [userId]
        );
        
        return res.json(rows);
    } catch (err) {
        console.error('Error fetching notifikasi:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Kirim pengingat/notifikasi ke guru
exports.kirimNotifikasi = async (req, res) => {
    try {
        const { user_id, judul, pesan } = req.body;
        
        if (!user_id || !judul || !pesan) {
            return res.status(400).json({ message: 'Semua field (user_id, judul, pesan) harus diisi.' });
        }
        
        // Insert into DB
        const [result] = await db.query(
            'INSERT INTO notifikasi (user_id, judul, pesan, is_read) VALUES (?, ?, ?, false)',
            [user_id, judul, pesan]
        );
        
        // Coba emit via socket.io kalau tersedia
        const io = req.app.get('io');
        if (io) {
            // Karena user_id adalah ID si penerima, broadcast ke 'new_notification'
            // Idealnya dikirim ke room spesifik: io.to(`user_${user_id}`).emit('new_notification', ...)
            io.emit('new_notification', {
                id: result.insertId,
                user_id,
                judul,
                pesan,
                is_read: false,
                created_at: new Date()
            });
        }
        
        return res.status(201).json({ message: 'Notifikasi berhasil dikirim.' });
    } catch (err) {
        console.error('Error sending notifikasi:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Tandai notifikasi dibaca
exports.markAsRead = async (req, res) => {
    try {
        const notifId = req.params.id;
        const userId = req.user.id; // Pastikan hanya milik user ini
        
        await db.query(
            'UPDATE notifikasi SET is_read = true WHERE id = ? AND user_id = ?',
            [notifId, userId]
        );
        
        return res.json({ message: 'Marked as read' });
    } catch (err) {
        console.error('Error marking read:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
