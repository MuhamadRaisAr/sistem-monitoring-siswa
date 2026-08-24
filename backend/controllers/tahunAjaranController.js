const db = require('../config/db');

// Mendapatkan semua tahun ajaran
exports.getAllTahunAjaran = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM tahun_ajaran ORDER BY id DESC');
        return res.json(rows);
    } catch (err) {
        console.error('Get all tahun ajaran error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Mendapatkan tahun ajaran yang sedang aktif
exports.getActiveTahunAjaran = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM tahun_ajaran WHERE is_active = 1 LIMIT 1');
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Tidak ada tahun ajaran yang aktif.' });
        }
        return res.json(rows[0]);
    } catch (err) {
        console.error('Get active tahun ajaran error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Menambahkan tahun ajaran baru (Hanya Admin)
exports.createTahunAjaran = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const { nama_tahun, semester, set_active, copy_from_id } = req.body;
        if (!nama_tahun || !semester) {
            return res.status(400).json({ message: 'Nama tahun dan semester wajib diisi.' });
        }

        // Jika diset sebagai aktif, tidak perlu menonaktifkan yang lain karena admin bisa mengaktifkan beberapa sekaligus
        // if (set_active) {
        //     await db.query('UPDATE tahun_ajaran SET is_active = 0');
        // }

        const [result] = await db.query(
            'INSERT INTO tahun_ajaran (nama_tahun, semester, is_active) VALUES (?, ?, ?)',
            [nama_tahun, semester, set_active ? 1 : 0]
        );
        
        const newId = result.insertId;

        // Copy schedules from another academic year if requested
        if (copy_from_id) {
            await db.query(`
                INSERT INTO jadwal_pelajaran (guru_id, tahun_ajaran_id, mata_pelajaran, kelas, hari, jam_mulai, jam_selesai)
                SELECT guru_id, ?, mata_pelajaran, kelas, hari, jam_mulai, jam_selesai 
                FROM jadwal_pelajaran 
                WHERE tahun_ajaran_id = ?
            `, [newId, copy_from_id]);
        }

        return res.status(201).json({ message: 'Tahun Ajaran berhasil ditambahkan.', id: newId });
    } catch (err) {
        console.error('Create tahun ajaran error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Mengubah tahun ajaran (Hanya Admin)
exports.updateTahunAjaran = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const { id } = req.params;
        const { nama_tahun, semester, set_active, copy_from_id } = req.body;

        if (!nama_tahun || !semester) {
            return res.status(400).json({ message: 'Nama tahun dan semester wajib diisi.' });
        }

        // Cek apakah ada
        const [check] = await db.query('SELECT id FROM tahun_ajaran WHERE id = ?', [id]);
        if (check.length === 0) {
            return res.status(404).json({ message: 'Tahun Ajaran tidak ditemukan.' });
        }

        // Tidak menonaktifkan yang lain agar bisa multi-aktif
        // if (set_active) {
        //     await db.query('UPDATE tahun_ajaran SET is_active = 0');
        // }

        await db.query(
            'UPDATE tahun_ajaran SET nama_tahun = ?, semester = ?, is_active = ? WHERE id = ?',
            [nama_tahun, semester, set_active ? 1 : 0, id]
        );

        // Copy schedules from another academic year if requested during edit
        if (copy_from_id) {
            // Cek apakah sudah ada jadwal di tahun ajaran ini
            const [existing] = await db.query('SELECT id FROM jadwal_pelajaran WHERE tahun_ajaran_id = ? LIMIT 1', [id]);
            
            // Jika belum ada jadwal, maka copy. (Mencegah duplikasi data jika di-klik berulang kali)
            if (existing.length === 0) {
                await db.query(`
                    INSERT INTO jadwal_pelajaran (guru_id, tahun_ajaran_id, mata_pelajaran, kelas, hari, jam_mulai, jam_selesai)
                    SELECT guru_id, ?, mata_pelajaran, kelas, hari, jam_mulai, jam_selesai 
                    FROM jadwal_pelajaran 
                    WHERE tahun_ajaran_id = ?
                `, [id, copy_from_id]);
            }
        }

        return res.json({ message: 'Tahun Ajaran berhasil diperbarui.' });
    } catch (err) {
        console.error('Update tahun ajaran error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Mengubah tahun ajaran yang aktif (Hanya Admin)
exports.setActive = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const { id } = req.params;

        // Cek apakah ada
        const [check] = await db.query('SELECT id FROM tahun_ajaran WHERE id = ?', [id]);
        if (check.length === 0) {
            return res.status(404).json({ message: 'Tahun Ajaran tidak ditemukan.' });
        }

        // Toggle status aktif
        await db.query('UPDATE tahun_ajaran SET is_active = NOT is_active WHERE id = ?', [id]);

        return res.json({ message: 'Status Aktif Tahun Ajaran berhasil diubah.' });
    } catch (err) {
        console.error('Set active tahun ajaran error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Menghapus tahun ajaran (Hanya Admin)
exports.deleteTahunAjaran = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const { id } = req.params;

        // Cek apakah sedang aktif
        const [check] = await db.query('SELECT is_active FROM tahun_ajaran WHERE id = ?', [id]);
        if (check.length === 0) {
            return res.status(404).json({ message: 'Tahun Ajaran tidak ditemukan.' });
        }



        // HAPUS SAKTI: Hapus semua data yang berkaitan dengan tahun ajaran ini.
        // Lakukan secara berurutan untuk menghindari foreign key constraint error.
        await db.query('DELETE FROM kehadiran_siswa WHERE tahun_ajaran_id = ?', [id]);
        await db.query('DELETE FROM nilai_siswa WHERE tahun_ajaran_id = ?', [id]);
        await db.query('DELETE FROM spp_billing WHERE tahun_ajaran_id = ?', [id]);
        await db.query('DELETE FROM kedisiplinan WHERE tahun_ajaran_id = ?', [id]);
        await db.query('DELETE FROM jadwal_pelajaran WHERE tahun_ajaran_id = ?', [id]);

        // Hapus tahun ajaran
        await db.query('DELETE FROM tahun_ajaran WHERE id = ?', [id]);

        return res.json({ message: 'Tahun Ajaran beserta SEMUA data terkait berhasil dihapus.' });
    } catch (err) {
        console.error('Delete tahun ajaran error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
