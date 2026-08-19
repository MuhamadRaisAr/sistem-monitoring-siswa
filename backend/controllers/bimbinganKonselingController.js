const db = require('../config/db');

// Get all bimbingan konseling records
exports.getAllBimbingan = async (req, res) => {
    try {
        const { siswa_id, tahun_ajaran_id } = req.query;
        let query = `
            SELECT bk.*, s.nama_lengkap AS nama_siswa, s.nis, s.kelas, u.nama_lengkap AS nama_konselor
            FROM bimbingan_konseling bk
            JOIN siswa s ON bk.siswa_id = s.id
            LEFT JOIN users u ON bk.created_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (siswa_id) {
            query += ' AND bk.siswa_id = ?';
            params.push(siswa_id);
        }
        if (tahun_ajaran_id) {
            query += ' AND bk.tahun_ajaran_id = ?';
            params.push(tahun_ajaran_id);
        }

        query += ' ORDER BY bk.tanggal DESC, bk.created_at DESC';

        const [rows] = await db.query(query, params);
        return res.json(rows);
    } catch (err) {
        console.error('Get bimbingan konseling error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Create new bimbingan konseling record
exports.createBimbingan = async (req, res) => {
    try {
        if (!['admin', 'guru_bk'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied. Only Guru BK and Admin can create counseling records.' });
        }

        const { siswa_id, tahun_ajaran_id, tanggal, topik, hasil_konseling, tindak_lanjut } = req.body;

        if (!siswa_id || !tanggal || !topik) {
            return res.status(400).json({ message: 'Siswa, tanggal, dan topik wajib diisi.' });
        }

        const created_by = req.user.id;

        const [result] = await db.query(
            'INSERT INTO bimbingan_konseling (siswa_id, tahun_ajaran_id, tanggal, topik, hasil_konseling, tindak_lanjut, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [siswa_id, tahun_ajaran_id || null, tanggal, topik, hasil_konseling || '', tindak_lanjut || '', created_by]
        );

        return res.status(201).json({ message: 'Catatan konseling berhasil ditambahkan.', id: result.insertId });
    } catch (err) {
        console.error('Create bimbingan konseling error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Update bimbingan konseling record
exports.updateBimbingan = async (req, res) => {
    try {
        if (!['admin', 'guru_bk'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        const { id } = req.params;
        const { siswa_id, tahun_ajaran_id, tanggal, topik, hasil_konseling, tindak_lanjut } = req.body;

        if (!siswa_id || !tanggal || !topik) {
            return res.status(400).json({ message: 'Siswa, tanggal, dan topik wajib diisi.' });
        }

        await db.query(
            'UPDATE bimbingan_konseling SET siswa_id = ?, tahun_ajaran_id = ?, tanggal = ?, topik = ?, hasil_konseling = ?, tindak_lanjut = ? WHERE id = ?',
            [siswa_id, tahun_ajaran_id || null, tanggal, topik, hasil_konseling || '', tindak_lanjut || '', id]
        );

        return res.json({ message: 'Catatan konseling berhasil diperbarui.' });
    } catch (err) {
        console.error('Update bimbingan konseling error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete bimbingan konseling record
exports.deleteBimbingan = async (req, res) => {
    try {
        if (!['admin', 'guru_bk'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        const { id } = req.params;
        await db.query('DELETE FROM bimbingan_konseling WHERE id = ?', [id]);
        return res.json({ message: 'Catatan konseling berhasil dihapus.' });
    } catch (err) {
        console.error('Delete bimbingan konseling error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
