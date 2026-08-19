const db = require('../config/db');
const { notifyRoles } = require('../utils/notificationHelper');

exports.getAllPengumuman = async (req, res) => {
    try {
        let query = 'SELECT * FROM pengumuman';
        if (req.user.role === 'guru') {
            query += " WHERE target IN ('semua', 'guru')";
        } else if (req.user.role === 'wali_siswa') {
            query += " WHERE target IN ('semua', 'wali_siswa')";
        }
        query += ' ORDER BY tanggal DESC, id DESC';

        const [rows] = await db.query(query);
        return res.json(rows);
    } catch (err) {
        console.error('Get all pengumuman error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.createPengumuman = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses ditolak.' });

        const { judul, isi_pengumuman, tanggal, target } = req.body;
        if (!judul || !isi_pengumuman || !tanggal) {
            return res.status(400).json({ message: 'Semua kolom wajib diisi.' });
        }

        await db.query(
            'INSERT INTO pengumuman (judul, isi_pengumuman, tanggal, target) VALUES (?, ?, ?, ?)', 
            [judul, isi_pengumuman, tanggal, target || 'semua']
        );

        // Emit Notification
        const io = req.app.get('io');
        const notifTarget = target || 'semua';
        let urlTarget = '/';
        if (notifTarget === 'guru') urlTarget = '/guru/dashboard';
        else if (notifTarget === 'wali_siswa') urlTarget = '/wali_siswa/pengumuman';

        await notifyRoles(io, notifTarget, {
            title: 'Pengumuman Baru',
            message: judul,
            type: 'info',
            url: urlTarget
        });

        return res.status(201).json({ message: 'Pengumuman berhasil ditambahkan.' });
    } catch (err) {
        console.error('Create pengumuman error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.updatePengumuman = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses ditolak.' });

        const { id } = req.params;
        const { judul, isi_pengumuman, tanggal, target } = req.body;
        
        if (!judul || !isi_pengumuman || !tanggal) {
            return res.status(400).json({ message: 'Semua kolom wajib diisi.' });
        }

        const [result] = await db.query(
            'UPDATE pengumuman SET judul = ?, isi_pengumuman = ?, tanggal = ?, target = ? WHERE id = ?', 
            [judul, isi_pengumuman, tanggal, target || 'semua', id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ message: 'Data tidak ditemukan.' });

        return res.json({ message: 'Pengumuman berhasil diupdate.' });
    } catch (err) {
        console.error('Update pengumuman error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deletePengumuman = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses ditolak.' });

        const { id } = req.params;
        await db.query('DELETE FROM pengumuman WHERE id = ?', [id]);
        
        return res.json({ message: 'Pengumuman berhasil dihapus.' });
    } catch (err) {
        console.error('Delete pengumuman error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
