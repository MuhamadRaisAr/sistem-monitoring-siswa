const db = require('../config/db');

// Get academic logs
exports.getLogs = async (req, res) => {
    try {
        const { siswa_id, jenis_kegiatan, start_date, end_date, tahun_ajaran_id, kelas } = req.query;

        // Security check for Wali Siswa
        if (req.user.role === 'wali_siswa') {
            if (!siswa_id) {
                return res.status(400).json({ message: 'siswa ID is required for parents.' });
            }
            // Check if this siswa is mapped to this parent
            const [mapping] = await db.query(
                'SELECT id FROM wali_siswa_mapping WHERE wali_id = ? AND siswa_id = ?',
                [req.user.id, siswa_id]
            );
            if (mapping.length === 0) {
                return res.status(403).json({ message: 'Access denied. You can only view your children\'s logs.' });
            }
        }

        // Build query
        let query = `
            SELECT ka.*, s.nama_lengkap AS nama_siswa, s.nis, s.kelas
            FROM kehadiran_siswa ka
            JOIN siswa s ON ka.siswa_id = s.id
            WHERE 1=1
        `;
        const params = [];

        if (siswa_id) {
            query += ' AND ka.siswa_id = ?';
            params.push(siswa_id);
        }
        if (jenis_kegiatan) {
            query += ' AND ka.jenis_kegiatan = ?';
            params.push(jenis_kegiatan);
        }
        if (start_date) {
            query += ' AND ka.tanggal >= ?';
            params.push(start_date);
        }
        if (end_date) {
            query += ' AND ka.tanggal <= ?';
            params.push(end_date);
        }
        if (tahun_ajaran_id) {
            query += ' AND ka.tahun_ajaran_id = ?';
            params.push(tahun_ajaran_id);
        }
        if (kelas) {
            query += ' AND (s.kelas = ? OR s.kelas LIKE ?)';
            params.push(kelas, kelas + ' (%');
        }

        query += ' ORDER BY ka.tanggal DESC, ka.created_at DESC';

        const [rows] = await db.query(query, params);
        return res.json(rows);
    } catch (err) {
        console.error('Get academic logs error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Create new log
exports.createLog = async (req, res) => {
    try {
        if (!['admin', 'guru'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied. Admins or Guru only.' });
        }

        const { siswa_id, jenis_kegiatan, deskripsi, tanggal, waktu, kehadiran, tahun_ajaran_id } = req.body;
        if (!siswa_id || !jenis_kegiatan || !tanggal || !kehadiran) {
            return res.status(400).json({ message: 'siswa ID, activity type, date, and attendance status are required.' });
        }

        if (!jenis_kegiatan) {
            return res.status(400).json({ message: 'Invalid activity type.' });
        }
        if (!['hadir', 'izin', 'sakit', 'alpa'].includes(kehadiran)) {
            return res.status(400).json({ message: 'Invalid attendance status.' });
        }

        // Handle time (waktu) fallback
        let timeToSave = waktu;
        if (!timeToSave) {
            const now = new Date();
            timeToSave = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
        }

        // Handle file upload path
        let bukti_foto = null;
        if (req.file) {
            bukti_foto = `/uploads/${req.file.filename}`;
        }

        const [result] = await db.query(
            'INSERT INTO kehadiran_siswa (siswa_id, tahun_ajaran_id, jenis_kegiatan, deskripsi, tanggal, waktu, kehadiran, bukti_foto) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [siswa_id, tahun_ajaran_id || null, jenis_kegiatan, deskripsi || '', tanggal, timeToSave, kehadiran, bukti_foto]
        );

        return res.status(201).json({ message: 'Academic record logged successfully', id: result.insertId });
    } catch (err) {
        console.error('Create academic log error:', err);
        require('fs').appendFileSync('error.log', new Date().toISOString() + ' POST: ' + err.stack + '\n');
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Update log
exports.updateLog = async (req, res) => {
    try {
        if (!['admin', 'guru', 'wali_siswa'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        const { id } = req.params;
        const { siswa_id, jenis_kegiatan, deskripsi, tanggal, waktu, kehadiran, tahun_ajaran_id } = req.body;

        if (!siswa_id || !jenis_kegiatan || !tanggal || !kehadiran) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const existing = await db.query('SELECT waktu FROM kehadiran_siswa WHERE id = ?', [id]);
        let timeToUpdate = waktu || (existing[0] && existing[0].length > 0 ? existing[0][0].waktu : null);

        let query = 'UPDATE kehadiran_siswa SET siswa_id = ?, jenis_kegiatan = ?, deskripsi = ?, tanggal = ?, waktu = ?, kehadiran = ?, tahun_ajaran_id = ?';
        const params = [siswa_id, jenis_kegiatan, deskripsi || '', tanggal, timeToUpdate, kehadiran, tahun_ajaran_id || null];

        if (req.file) {
            query += ', bukti_foto = ?';
            params.push(`/uploads/${req.file.filename}`);
        }

        query += ' WHERE id = ?';
        params.push(id);

        await db.query(query, params);
        return res.json({ message: 'Academic record updated successfully.' });
    } catch (err) {
        console.error('Update academic log error:', err);
        require('fs').appendFileSync('error.log', new Date().toISOString() + ' PUT: ' + err.stack + '\n');
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete log
exports.deleteLog = async (req, res) => {
    try {
        if (!['admin', 'guru'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied. Admins or Guru only.' });
        }

        const { id } = req.params;
        await db.query('DELETE FROM kehadiran_siswa WHERE id = ?', [id]);
        return res.json({ message: 'Academic record deleted successfully.' });
    } catch (err) {
        console.error('Delete academic log error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Reset all historical logs (keep today's logs)
exports.resetAllLogs = async (req, res) => {
    try {
        if (!['admin', 'guru'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied. Admins or Guru only.' });
        }
        
        // Hanya hapus data yang tanggalnya kurang dari hari ini
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        await db.query('DELETE FROM kehadiran_siswa WHERE DATE(tanggal) < ?', [todayStr]);
        return res.json({ message: 'Historical academic records reset successfully.' });
    } catch (err) {
        console.error('Reset academic logs error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
