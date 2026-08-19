const db = require('../config/db');

exports.pindahKelas = async (req, res) => {
    const { siswa_ids, target_kelas } = req.body;

    if (!siswa_ids || !Array.isArray(siswa_ids) || siswa_ids.length === 0) {
        return res.status(400).json({ message: 'Tidak ada siswa yang dipilih.' });
    }
    if (!target_kelas) {
        return res.status(400).json({ message: 'Kelas tujuan wajib diisi.' });
    }

    try {
        const query = 'UPDATE siswa SET kelas = ? WHERE id IN (?)';
        await db.query(query, [target_kelas, siswa_ids]);
        
        res.json({ message: `Berhasil memindahkan ${siswa_ids.length} siswa ke kelas ${target_kelas}.` });
    } catch (err) {
        console.error('Error in pindahKelas:', err);
        res.status(500).json({ message: 'Terjadi kesalahan pada server saat memindahkan kelas.' });
    }
};

exports.ubahStatus = async (req, res) => {
    const { siswa_ids, status } = req.body; // status: 'aktif', 'lulus', 'keluar'

    if (!siswa_ids || !Array.isArray(siswa_ids) || siswa_ids.length === 0) {
        return res.status(400).json({ message: 'Tidak ada siswa yang dipilih.' });
    }
    if (!['aktif', 'lulus', 'keluar'].includes(status)) {
        return res.status(400).json({ message: 'Status tidak valid.' });
    }

    try {
        const query = 'UPDATE siswa SET status_aktif = ? WHERE id IN (?)';
        await db.query(query, [status, siswa_ids]);
        
        res.json({ message: `Berhasil mengubah status ${siswa_ids.length} siswa menjadi ${status}.` });
    } catch (err) {
        console.error('Error in ubahStatus:', err);
        res.status(500).json({ message: 'Terjadi kesalahan pada server saat mengubah status.' });
    }
};
