const db = require('../config/db');

// Get all ekstrakurikuler with pembina name
exports.getAllEkskul = async (req, res) => {
    try {
        const query = `
            SELECT e.*, u.nama_lengkap AS nama_pembina
            FROM ekstrakurikuler e
            LEFT JOIN users u ON e.pembina_id = u.id
            ORDER BY e.nama_ekskul ASC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (err) {
        console.error('Error in getAllEkskul:', err);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

// Create new ekskul
exports.createEkskul = async (req, res) => {
    const { nama_ekskul, pembina_id, deskripsi } = req.body;
    try {
        if (!nama_ekskul) {
            return res.status(400).json({ message: 'Nama ekskul wajib diisi.' });
        }

        const query = `
            INSERT INTO ekstrakurikuler (nama_ekskul, pembina_id, deskripsi)
            VALUES (?, ?, ?)
        `;
        const [result] = await db.query(query, [nama_ekskul, pembina_id || null, deskripsi || '']);
        
        res.status(201).json({ id: result.insertId, message: 'Ekstrakurikuler berhasil ditambahkan.' });
    } catch (err) {
        console.error('Error in createEkskul:', err);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

// Update ekskul
exports.updateEkskul = async (req, res) => {
    const { id } = req.params;
    const { nama_ekskul, pembina_id, deskripsi } = req.body;
    
    try {
        if (!nama_ekskul) {
            return res.status(400).json({ message: 'Nama ekskul wajib diisi.' });
        }

        const query = `
            UPDATE ekstrakurikuler 
            SET nama_ekskul = ?, pembina_id = ?, deskripsi = ?
            WHERE id = ?
        `;
        await db.query(query, [nama_ekskul, pembina_id || null, deskripsi || '', id]);
        
        res.json({ message: 'Ekstrakurikuler berhasil diupdate.' });
    } catch (err) {
        console.error('Error in updateEkskul:', err);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

// Delete ekskul
exports.deleteEkskul = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM ekstrakurikuler WHERE id = ?', [id]);
        res.json({ message: 'Ekstrakurikuler berhasil dihapus.' });
    } catch (err) {
        console.error('Error in deleteEkskul:', err);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};
