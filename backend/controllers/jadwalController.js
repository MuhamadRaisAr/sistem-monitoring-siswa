const db = require('../config/db');

exports.getAllJadwal = async (req, res) => {
    try {
        const { kelas, tahun_ajaran_id, siswa_id } = req.query;
        let query = `
            SELECT j.*, u.nama_lengkap as nama_guru 
            FROM jadwal_pelajaran j
            LEFT JOIN users u ON j.guru_id = u.id
            WHERE 1=1
        `;
        const queryParams = [];

        if (kelas) {
            query += ` AND j.kelas = ? `;
            queryParams.push(kelas);
        }

        if (tahun_ajaran_id) {
            query += ` AND j.tahun_ajaran_id = ? `;
            queryParams.push(tahun_ajaran_id);
        }

        query += ` ORDER BY FIELD(j.hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'), j.jam_mulai ASC`;

        const [rows] = await db.query(query, queryParams);

        let mappedEkskul = [];
        if (siswa_id) {
            // Fetch ekstrakurikuler specifically for this student
            const [ekskulRows] = await db.query(`
                SELECT e.*, u.nama_lengkap as nama_guru 
                FROM ekstrakurikuler e
                JOIN nilai_ekskul ne ON e.id = ne.ekskul_id
                LEFT JOIN users u ON e.pembina_id = u.id
                WHERE e.hari IS NOT NULL AND e.hari != '' AND ne.siswa_id = ?
            `, [siswa_id]);

            mappedEkskul = ekskulRows.map(e => ({
                id: 'ekskul_' + e.id,
                hari: e.hari,
                jam_mulai: e.jam_mulai || '-',
                jam_selesai: e.jam_selesai || '-',
                mata_pelajaran: 'Ekskul: ' + e.nama_ekskul,
                kelas: '-',
                guru_id: e.pembina_id,
                nama_guru: e.nama_guru || 'Belum ditentukan',
                tahun_ajaran_id: tahun_ajaran_id || null,
                is_ekskul: true
            }));
        }

        res.json([...rows, ...mappedEkskul]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getMyJadwal = async (req, res) => {
    try {
        if (req.user.role !== 'guru') {
            return res.status(403).json({ message: 'Akses ditolak. Khusus guru.' });
        }
        
        const { tahun_ajaran_id } = req.query;
        let query = `
            SELECT j.*, u.nama_lengkap as nama_guru 
            FROM jadwal_pelajaran j
            LEFT JOIN users u ON j.guru_id = u.id
            WHERE j.guru_id = ?
        `;
        const queryParams = [req.user.id];

        if (tahun_ajaran_id) {
            query += ` AND j.tahun_ajaran_id = ? `;
            queryParams.push(tahun_ajaran_id);
        }

        query += ` ORDER BY FIELD(j.hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'), j.jam_mulai ASC`;

        const [rows] = await db.query(query, queryParams);
        
        res.json(rows);
    } catch (err) {
        console.error('Get my jadwal error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getJadwalById = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT j.*, u.nama_lengkap as nama_guru 
            FROM jadwal_pelajaran j
            LEFT JOIN users u ON j.guru_id = u.id
            WHERE j.id = ?
        `, [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Jadwal tidak ditemukan' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.createJadwal = async (req, res) => {
    const { hari, jam_mulai, jam_selesai, mata_pelajaran, kelas, guru_id, tahun_ajaran_id } = req.body;
    try {
        const [result] = await db.query(`
            INSERT INTO jadwal_pelajaran (hari, jam_mulai, jam_selesai, mata_pelajaran, kelas, guru_id, tahun_ajaran_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [hari, jam_mulai, jam_selesai, mata_pelajaran, kelas, guru_id || null, tahun_ajaran_id || null]);
        
        res.status(201).json({ message: 'Jadwal berhasil ditambahkan', id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateJadwal = async (req, res) => {
    const { hari, jam_mulai, jam_selesai, mata_pelajaran, kelas, guru_id, tahun_ajaran_id } = req.body;
    try {
        const [result] = await db.query(`
            UPDATE jadwal_pelajaran 
            SET hari=?, jam_mulai=?, jam_selesai=?, mata_pelajaran=?, kelas=?, guru_id=?, tahun_ajaran_id=?
            WHERE id=?
        `, [hari, jam_mulai, jam_selesai, mata_pelajaran, kelas, guru_id || null, tahun_ajaran_id || null, req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Jadwal tidak ditemukan' });
        }
        res.json({ message: 'Jadwal berhasil diperbarui' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteJadwal = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM jadwal_pelajaran WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Jadwal tidak ditemukan' });
        }
        res.json({ message: 'Jadwal berhasil dihapus' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
