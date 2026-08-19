const db = require('../config/db');

// Get chat history between current user and selected contact
exports.getChatHistory = async (req, res) => {
    try {
        const { contactId } = req.params;
        const currentUserId = req.user.id;

        const query = `
            SELECT cm.*, 
                   s.nama_lengkap AS sender_name, 
                   r.nama_lengkap AS receiver_name
            FROM chat_messages cm
            JOIN users s ON cm.sender_id = s.id
            JOIN users r ON cm.receiver_id = r.id
            WHERE ((cm.sender_id = ? AND cm.receiver_id = ?) OR (cm.sender_id = ? AND cm.receiver_id = ?))
               AND ((cm.sender_id = ? AND cm.deleted_by_sender = 0) OR (cm.receiver_id = ? AND cm.deleted_by_receiver = 0))
            ORDER BY cm.created_at ASC
        `;

        const [rows] = await db.query(query, [currentUserId, contactId, contactId, currentUserId, currentUserId, currentUserId]);
        return res.json(rows);
    } catch (err) {
        console.error('Get chat history error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Get list of contacts
exports.getContacts = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const currentUserRole = req.user.role;

        let query = '';
        const params = [];

        if (currentUserRole === 'admin') {
            // Admin sees all Wali siswa contacts, plus count of unread messages from them
            query = `
                SELECT u.id, u.username, u.nama_lengkap, u.no_hp, u.role,
                       COALESCE(unread.count, 0) AS unread_count,
                       last_msg.message AS last_message,
                       last_msg.file_url AS last_message_file,
                       last_msg.created_at AS last_message_time,
                       IF(ac.id IS NOT NULL, 1, 0) AS is_archived
                FROM users u
                LEFT JOIN (
                    SELECT sender_id, COUNT(*) AS count
                    FROM chat_messages
                    WHERE receiver_id = ? AND is_read = FALSE
                    GROUP BY sender_id
                ) unread ON u.id = unread.sender_id
                LEFT JOIN (
                    SELECT m1.sender_id, m1.receiver_id, m1.message, m1.file_url, m1.created_at
                    FROM chat_messages m1
                    INNER JOIN (
                        SELECT LEAST(sender_id, receiver_id) as u1, 
                               GREATEST(sender_id, receiver_id) as u2, 
                               MAX(created_at) as max_time
                        FROM chat_messages
                        WHERE (sender_id = ? AND deleted_by_sender = 0) OR (receiver_id = ? AND deleted_by_receiver = 0)
                        GROUP BY u1, u2
                    ) m2 ON ((m1.sender_id = m2.u1 AND m1.receiver_id = m2.u2) OR (m1.sender_id = m2.u2 AND m1.receiver_id = m2.u1))
                    AND m1.created_at = m2.max_time
                ) last_msg ON (u.id = last_msg.sender_id AND ? = last_msg.receiver_id) 
                           OR (u.id = last_msg.receiver_id AND ? = last_msg.sender_id)
                LEFT JOIN archived_chats ac ON ac.admin_id = ? AND ac.wali_id = u.id
                WHERE u.role = 'wali_siswa'
                ORDER BY last_message_time DESC, u.nama_lengkap ASC
            `;
            params.push(currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId);
        } else {
            // Wali Siswa sees all Admin contacts, plus count of unread messages from them
            query = `
                SELECT u.id, u.username, u.nama_lengkap, u.no_hp, u.role,
                       COALESCE(unread.count, 0) AS unread_count,
                       last_msg.message AS last_message,
                       last_msg.file_url AS last_message_file,
                       last_msg.created_at AS last_message_time
                FROM users u
                LEFT JOIN (
                    SELECT sender_id, COUNT(*) AS count
                    FROM chat_messages
                    WHERE receiver_id = ? AND is_read = FALSE
                    GROUP BY sender_id
                ) unread ON u.id = unread.sender_id
                LEFT JOIN (
                    SELECT m1.sender_id, m1.receiver_id, m1.message, m1.file_url, m1.created_at
                    FROM chat_messages m1
                    INNER JOIN (
                        SELECT LEAST(sender_id, receiver_id) as u1, 
                               GREATEST(sender_id, receiver_id) as u2, 
                               MAX(created_at) as max_time
                        FROM chat_messages
                        WHERE (sender_id = ? AND deleted_by_sender = 0) OR (receiver_id = ? AND deleted_by_receiver = 0)
                        GROUP BY u1, u2
                    ) m2 ON ((m1.sender_id = m2.u1 AND m1.receiver_id = m2.u2) OR (m1.sender_id = m2.u2 AND m1.receiver_id = m2.u1))
                    AND m1.created_at = m2.max_time
                ) last_msg ON (u.id = last_msg.sender_id AND ? = last_msg.receiver_id) 
                           OR (u.id = last_msg.receiver_id AND ? = last_msg.sender_id)
                WHERE u.role = 'admin' OR u.id IN (
                    SELECT k.wali_kelas_id
                    FROM wali_siswa_mapping wsm
                    JOIN siswa s ON wsm.siswa_id = s.id
                    JOIN kelas k ON s.kelas = k.nama_kelas
                    WHERE wsm.wali_id = ?
                )
                ORDER BY last_message_time DESC, u.nama_lengkap ASC
            `;
            params.push(currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId);
        }

        const [rows] = await db.query(query, params);
        return res.json(rows);
    } catch (err) {
        console.error('Get chat contacts error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
    try {
        const { contactId } = req.params;
        const currentUserId = req.user.id;

        await db.query(
            'UPDATE chat_messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE',
            [contactId, currentUserId]
        );

        return res.json({ message: 'Messages marked as read.' });
    } catch (err) {
        console.error('Mark messages as read error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Upload attachment
exports.uploadAttachment = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        const fileUrl = `/uploads/chat/${req.file.filename}`;
        const fileType = req.file.mimetype;

        return res.json({ 
            message: 'File uploaded successfully', 
            file_url: fileUrl,
            file_type: fileType
        });
    } catch (err) {
        console.error('Chat upload attachment error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deleteChatHistory = async (req, res) => {
    const userId = req.user.id;
    const { contactId } = req.params;

    try {
        await db.query(
            `DELETE FROM chat_messages 
             WHERE (sender_id = ? AND receiver_id = ?) 
                OR (sender_id = ? AND receiver_id = ?)`,
            [userId, contactId, contactId, userId]
        );
        return res.json({ message: 'Riwayat obrolan berhasil dihapus' });
    } catch (err) {
        console.error('Delete chat history error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.editMessage = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { new_message } = req.body;

    try {
        const [msgRows] = await db.query(`SELECT sender_id, created_at FROM chat_messages WHERE id = ?`, [id]);
        if (msgRows.length === 0) return res.status(404).json({ message: 'Pesan tidak ditemukan' });

        const msg = msgRows[0];
        if (msg.sender_id !== userId) return res.status(403).json({ message: 'Anda tidak diizinkan mengedit pesan ini' });

        const timeDiff = Date.now() - new Date(msg.created_at).getTime();
        if (timeDiff > 10000) return res.status(403).json({ message: 'Waktu edit (10 detik) sudah habis' });

        await db.query(`UPDATE chat_messages SET message = ?, is_edited = 1 WHERE id = ?`, [new_message, id]);
        
        return res.json({ message: 'Pesan berhasil diedit' });
    } catch (err) {
        console.error('Edit message error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.archiveChat = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { contactId } = req.params;
        
        await db.query(`INSERT IGNORE INTO archived_chats (admin_id, wali_id) VALUES (?, ?)`, [adminId, contactId]);
        return res.json({ message: 'Chat archived successfully' });
    } catch (err) {
        console.error('Archive chat error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.unarchiveChat = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { contactId } = req.params;
        
        await db.query(`DELETE FROM archived_chats WHERE admin_id = ? AND wali_id = ?`, [adminId, contactId]);
        return res.json({ message: 'Chat unarchived successfully' });
    } catch (err) {
        console.error('Unarchive chat error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deleteMessageForMe = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user.id;

        const [msg] = await db.query('SELECT * FROM chat_messages WHERE id = ?', [id]);
        if (!msg || msg.length === 0) return res.status(404).json({ message: 'Message not found' });

        const message = msg[0];
        if (message.sender_id === currentUserId) {
            await db.query('UPDATE chat_messages SET deleted_by_sender = 1 WHERE id = ?', [id]);
        } else if (message.receiver_id === currentUserId) {
            await db.query('UPDATE chat_messages SET deleted_by_receiver = 1 WHERE id = ?', [id]);
        } else {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Optional: If both deleted, delete the row
        const [updatedMsg] = await db.query('SELECT * FROM chat_messages WHERE id = ?', [id]);
        if (updatedMsg[0].deleted_by_sender === 1 && updatedMsg[0].deleted_by_receiver === 1) {
            await db.query('DELETE FROM chat_messages WHERE id = ?', [id]);
        }

        return res.json({ message: 'Message deleted for you' });
    } catch (err) {
        console.error('Delete message for me error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deleteMessageForEveryone = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user.id;

        const [msg] = await db.query('SELECT * FROM chat_messages WHERE id = ?', [id]);
        if (!msg || msg.length === 0) return res.status(404).json({ message: 'Message not found' });

        const message = msg[0];
        if (message.sender_id !== currentUserId) {
            return res.status(403).json({ message: 'Hanya pengirim yang bisa menghapus pesan untuk semua orang' });
        }

        await db.query('DELETE FROM chat_messages WHERE id = ?', [id]);
        return res.json({ message: 'Message deleted for everyone' });
    } catch (err) {
        console.error('Delete message for everyone error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
