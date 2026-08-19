const db = require('../config/db');

// Get all nilai ekskul for a specific student and tahun ajaran
exports.getNilaiEkskulBySiswa = async (req, res) => {
    try {
        const { siswa_id, tahun_ajaran_id } = req.query;
        if (!siswa_id || !tahun_ajaran_id) {
            return res.status(400).json({ message: 'siswa_id and tahun_ajaran_id are required' });
        }

        const query = `
            SELECT ne.*, e.nama_ekskul, e.deskripsi as ekskul_deskripsi 
            FROM nilai_ekskul ne
            JOIN ekstrakurikuler e ON ne.ekskul_id = e.id
            WHERE ne.siswa_id = ? AND ne.tahun_ajaran_id = ?
            ORDER BY e.nama_ekskul ASC
        `;
        const [rows] = await db.query(query, [siswa_id, tahun_ajaran_id]);
        res.json(rows);
    } catch (err) {
        console.error('Error in getNilaiEkskulBySiswa:', err);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

// Create or update nilai ekskul
exports.saveNilaiEkskul = async (req, res) => {
    try {
        let { siswa_id, ekskul_id, tahun_ajaran_id, predikat, keterangan } = req.body;
        
        if (predikat) {
            predikat = predikat.trim();
        }
        
        console.log(`Saving Ekskul: predikat='${predikat}' length=${predikat ? predikat.length : 0}`);

        if (!siswa_id || !ekskul_id || !tahun_ajaran_id || !predikat) {
            return res.status(400).json({ message: 'Data tidak lengkap (siswa, ekskul, tahun ajaran, dan predikat wajib diisi).' });
        }

        const validPredikats = ['Sangat Baik', 'Baik', 'Cukup', 'Kurang'];
        if (!validPredikats.includes(predikat)) {
            return res.status(400).json({ message: `Nilai predikat '${predikat}' tidak valid.` });
        }

        // Check if exists
        const checkQuery = 'SELECT id FROM nilai_ekskul WHERE siswa_id = ? AND ekskul_id = ? AND tahun_ajaran_id = ?';
        const [existing] = await db.query(checkQuery, [siswa_id, ekskul_id, tahun_ajaran_id]);

        if (existing.length > 0) {
            // Update
            const updateQuery = `
                UPDATE nilai_ekskul 
                SET predikat = ?, keterangan = ? 
                WHERE id = ?
            `;
            await db.query(updateQuery, [predikat, keterangan || '', existing[0].id]);
            return res.json({ message: 'Nilai Ekstrakurikuler berhasil diperbarui.' });
        } else {
            // Insert
            const insertQuery = `
                INSERT INTO nilai_ekskul (siswa_id, ekskul_id, tahun_ajaran_id, predikat, keterangan)
                VALUES (?, ?, ?, ?, ?)
            `;
            const [result] = await db.query(insertQuery, [siswa_id, ekskul_id, tahun_ajaran_id, predikat, keterangan || '']);
            return res.status(201).json({ id: result.insertId, message: 'Nilai Ekstrakurikuler berhasil ditambahkan.' });
        }
    } catch (err) {
        console.error('Error in saveNilaiEkskul:', err);
        res.status(500).json({ message: err.message || 'Terjadi kesalahan pada server saat menyimpan nilai.' });
    }
};

// Delete nilai ekskul
exports.deleteNilaiEkskul = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM nilai_ekskul WHERE id = ?', [id]);
        res.json({ message: 'Nilai Ekstrakurikuler berhasil dihapus.' });
    } catch (err) {
        console.error('Error in deleteNilaiEkskul:', err);
        res.status(500).json({ message: 'Terjadi kesalahan pada server saat menghapus nilai.' });
    }
};

// Get members of an ekskul
exports.getAnggotaEkskul = async (req, res) => {
    try {
        const { ekskul_id, tahun_ajaran_id } = req.query;
        if (!ekskul_id || !tahun_ajaran_id) {
            return res.status(400).json({ message: 'ekskul_id and tahun_ajaran_id are required' });
        }

        const query = `
            SELECT ne.id as nilai_ekskul_id, s.id as siswa_id, s.nama_lengkap, s.nis, s.nisn, s.kelas, ne.predikat, ne.keterangan 
            FROM nilai_ekskul ne
            JOIN siswa s ON ne.siswa_id = s.id
            WHERE ne.ekskul_id = ? AND ne.tahun_ajaran_id = ?
            ORDER BY s.nama_lengkap ASC
        `;
        const [rows] = await db.query(query, [ekskul_id, tahun_ajaran_id]);
        res.json(rows);
    } catch (err) {
        console.error('Error in getAnggotaEkskul:', err);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

// Add member to ekskul (by Admin)
exports.addAnggotaEkskul = async (req, res) => {
    try {
        const { siswa_id, ekskul_id, tahun_ajaran_id } = req.body;
        if (!siswa_id || !ekskul_id || !tahun_ajaran_id) {
            return res.status(400).json({ message: 'siswa_id, ekskul_id, and tahun_ajaran_id are required' });
        }

        // Check if exists
        const checkQuery = 'SELECT id FROM nilai_ekskul WHERE siswa_id = ? AND ekskul_id = ? AND tahun_ajaran_id = ?';
        const [existing] = await db.query(checkQuery, [siswa_id, ekskul_id, tahun_ajaran_id]);

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Siswa sudah terdaftar di ekskul ini pada tahun ajaran tersebut.' });
        }

        // Insert with NULL predikat
        const insertQuery = `
            INSERT INTO nilai_ekskul (siswa_id, ekskul_id, tahun_ajaran_id, predikat, keterangan)
            VALUES (?, ?, ?, NULL, NULL)
        `;
        const [result] = await db.query(insertQuery, [siswa_id, ekskul_id, tahun_ajaran_id]);
        res.status(201).json({ id: result.insertId, message: 'Siswa berhasil ditambahkan ke ekskul.' });
    } catch (err) {
        console.error('Error in addAnggotaEkskul:', err);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};
