const db = require('../config/db');

exports.getAllMapel = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM mata_pelajaran ORDER BY nama_pelajaran ASC');
        return res.json(rows);
    } catch (err) {
        console.error('Get all mapel error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.createMapel = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses ditolak.' });

        const { nama_pelajaran } = req.body;
        if (!nama_pelajaran) return res.status(400).json({ message: 'Nama pelajaran wajib diisi.' });

        const [existing] = await db.query('SELECT id FROM mata_pelajaran WHERE nama_pelajaran = ?', [nama_pelajaran]);
        if (existing.length > 0) return res.status(400).json({ message: 'Mata pelajaran sudah ada.' });

        await db.query('INSERT INTO mata_pelajaran (nama_pelajaran) VALUES (?)', [nama_pelajaran]);
        return res.status(201).json({ message: 'Mata pelajaran berhasil ditambahkan.' });
    } catch (err) {
        console.error('Create mapel error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.updateMapel = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses ditolak.' });

        const { id } = req.params;
        const { nama_pelajaran } = req.body;
        
        if (!nama_pelajaran) return res.status(400).json({ message: 'Nama pelajaran wajib diisi.' });

        const [existing] = await db.query('SELECT id FROM mata_pelajaran WHERE nama_pelajaran = ? AND id != ?', [nama_pelajaran, id]);
        if (existing.length > 0) return res.status(400).json({ message: 'Nama pelajaran sudah digunakan.' });

        const [oldData] = await db.query('SELECT nama_pelajaran FROM mata_pelajaran WHERE id = ?', [id]);
        if (oldData.length === 0) return res.status(404).json({ message: 'Data tidak ditemukan.' });
        const oldNama = oldData[0].nama_pelajaran;

        await db.query('UPDATE mata_pelajaran SET nama_pelajaran = ? WHERE id = ?', [nama_pelajaran, id]);

        // Sync old name with new name in jadwal_pelajaran table
        if (oldNama !== nama_pelajaran) {
            await db.query('UPDATE jadwal_pelajaran SET mata_pelajaran = ? WHERE mata_pelajaran = ?', [nama_pelajaran, oldNama]);
        }

        return res.json({ message: 'Mata pelajaran berhasil diupdate.' });
    } catch (err) {
        console.error('Update mapel error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deleteMapel = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses ditolak.' });

        const { id } = req.params;
        await db.query('DELETE FROM mata_pelajaran WHERE id = ?', [id]);
        
        return res.json({ message: 'Mata pelajaran berhasil dihapus.' });
    } catch (err) {
        console.error('Delete mapel error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
