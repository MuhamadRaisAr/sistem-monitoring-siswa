const db = require('../config/db');

exports.getAllSP = async (req, res) => {
    try {
        const { tahun_ajaran_id } = req.query;
        let targetTaId = tahun_ajaran_id;
        
        if (!targetTaId) {
            const [taActive] = await db.query('SELECT id FROM tahun_ajaran WHERE is_active = 1');
            if (taActive.length > 0) {
                targetTaId = taActive[0].id;
            }
        }

        const query = `
            SELECT sp.*, s.nama_lengkap, s.nis, s.kelas
            FROM surat_peringatan sp
            JOIN siswa s ON sp.siswa_id = s.id
            WHERE sp.tahun_ajaran_id = ?
            ORDER BY sp.tanggal_sp DESC, sp.id DESC
        `;
        
        const [rows] = await db.query(query, [targetTaId]);
        res.json(rows);
    } catch (err) {
        console.error('Error in getAllSP:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

exports.createSP = async (req, res) => {
    try {
        const { siswa_id, tahun_ajaran_id, jenis_sp, tanggal_sp, keterangan } = req.body;
        
        if (!siswa_id || !tahun_ajaran_id || !jenis_sp || !tanggal_sp) {
            return res.status(400).json({ message: 'Data tidak lengkap' });
        }

        await db.query(
            'INSERT INTO surat_peringatan (siswa_id, tahun_ajaran_id, jenis_sp, tanggal_sp, keterangan) VALUES (?, ?, ?, ?, ?)',
            [siswa_id, tahun_ajaran_id, jenis_sp, tanggal_sp, keterangan || null]
        );
        
        res.status(201).json({ message: 'Surat Peringatan berhasil dibuat' });
    } catch (err) {
        console.error('Error in createSP:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

exports.updateSP = async (req, res) => {
    try {
        const { id } = req.params;
        const { jenis_sp, tanggal_sp, keterangan } = req.body;

        if (!jenis_sp || !tanggal_sp) {
            return res.status(400).json({ message: 'Data tidak lengkap' });
        }

        await db.query(
            'UPDATE surat_peringatan SET jenis_sp = ?, tanggal_sp = ?, keterangan = ? WHERE id = ?',
            [jenis_sp, tanggal_sp, keterangan || null, id]
        );
        
        res.json({ message: 'Surat Peringatan berhasil diupdate' });
    } catch (err) {
        console.error('Error in updateSP:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

exports.deleteSP = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM surat_peringatan WHERE id = ?', [id]);
        res.json({ message: 'Surat Peringatan berhasil dihapus' });
    } catch (err) {
        console.error('Error in deleteSP:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};
