const db = require('../config/db');

// Get Unpaid Honor per Guru and Mapel
exports.getUnpaidHonor = async (req, res) => {
    try {
        if (req.user.role !== 'bendahara') {
            return res.status(403).json({ message: 'Access denied. Bendahara only.' });
        }

        const query = `
            SELECT 
                base.guru_id,
                u.nama_lengkap AS nama_guru,
                base.mapel,
                COALESCE(unpaid.jumlah, 0) AS jumlah_pertemuan_belum_dibayar
            FROM (
                SELECT DISTINCT guru_id, mata_pelajaran AS mapel
                FROM jadwal_pelajaran
            ) AS base
            JOIN users u ON base.guru_id = u.id
            LEFT JOIN (
                SELECT
                    jp.guru_id,
                    ka.jenis_kegiatan AS mapel,
                    COUNT(DISTINCT CONCAT(s.kelas, '_', ka.tanggal)) AS jumlah
                FROM kehadiran_siswa ka
                JOIN siswa s ON ka.siswa_id = s.id
                JOIN jadwal_pelajaran jp ON jp.mata_pelajaran = ka.jenis_kegiatan AND jp.kelas = s.kelas
                WHERE ka.is_paid = 0 AND ka.jenis_kegiatan != 'wali_kelas'
                GROUP BY jp.guru_id, ka.jenis_kegiatan
            ) AS unpaid ON unpaid.guru_id = base.guru_id AND unpaid.mapel = base.mapel
            ORDER BY u.nama_lengkap ASC
        `;
        const [rows] = await db.query(query);
        return res.json(rows);
    } catch (err) {
        console.error('Get unpaid honor error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Pay Honor
exports.payHonor = async (req, res) => {
    try {
        if (req.user.role !== 'bendahara') {
            return res.status(403).json({ message: 'Access denied. Bendahara only.' });
        }

        const { guru_id, mapel, nominal_per_pertemuan } = req.body;
        if (!guru_id || !mapel || !nominal_per_pertemuan) {
            return res.status(400).json({ message: 'guru_id, mapel, and nominal_per_pertemuan are required.' });
        }

        // Hitung jumlah pertemuan yang akan dibayar untuk memastikan validasi
        const queryCount = `
            SELECT COUNT(DISTINCT CONCAT(s.kelas, '_', ka.tanggal)) AS jumlah
            FROM kehadiran_siswa ka
            JOIN siswa s ON ka.siswa_id = s.id
            JOIN jadwal_pelajaran jp ON jp.mata_pelajaran = ka.jenis_kegiatan AND jp.kelas = s.kelas
            WHERE jp.guru_id = ? AND ka.jenis_kegiatan = ? AND ka.is_paid = 0
        `;
        const [countRows] = await db.query(queryCount, [guru_id, mapel]);
        const jumlah_pertemuan = countRows[0].jumlah;

        if (jumlah_pertemuan === 0) {
            return res.status(400).json({ message: 'Tidak ada pertemuan yang belum dibayar untuk guru dan mapel ini.' });
        }

        const total_bayar = jumlah_pertemuan * nominal_per_pertemuan;

        // Mulai transaksi
        await db.query('START TRANSACTION');

        // Insert ke riwayat pembayaran_honor
        const [insertRes] = await db.query(
            'INSERT INTO pembayaran_honor (guru_id, mapel, jumlah_pertemuan, nominal_per_pertemuan, total_bayar) VALUES (?, ?, ?, ?, ?)',
            [guru_id, mapel, jumlah_pertemuan, nominal_per_pertemuan, total_bayar]
        );

        // Update is_paid = 1 di kehadiran_siswa
        // Karena MySQL tidak bisa UPDATE dengan JOIN yang terlalu kompleks dengan fungsi agregat mudah, 
        // kita update berdasarkan kondisi IN (subquery). Tapi subquery di MySQL update kadang problematik.
        // Cara amannya: Kita update kehadiran_siswa yang memiliki id tertentu.
        const queryIds = `
            SELECT ka.id
            FROM kehadiran_siswa ka
            JOIN siswa s ON ka.siswa_id = s.id
            JOIN jadwal_pelajaran jp ON jp.mata_pelajaran = ka.jenis_kegiatan AND jp.kelas = s.kelas
            WHERE jp.guru_id = ? AND ka.jenis_kegiatan = ? AND ka.is_paid = 0
        `;
        const [idRows] = await db.query(queryIds, [guru_id, mapel]);
        const idsToUpdate = idRows.map(r => r.id);

        if (idsToUpdate.length > 0) {
            await db.query(
                `UPDATE kehadiran_siswa SET is_paid = 1 WHERE id IN (?)`,
                [idsToUpdate]
            );
        }

        await db.query('COMMIT');

        return res.json({ 
            message: 'Pembayaran honor berhasil dicatat.',
            pembayaran_id: insertRes.insertId,
            jumlah_pertemuan,
            total_bayar
        });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Pay honor error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Get Riwayat Pembayaran
exports.getRiwayatHonor = async (req, res) => {
    try {
        if (req.user.role !== 'bendahara') {
            return res.status(403).json({ message: 'Access denied. Bendahara only.' });
        }

        const query = `
            SELECT ph.*, u.nama_lengkap AS nama_guru
            FROM pembayaran_honor ph
            JOIN users u ON ph.guru_id = u.id
            ORDER BY ph.tanggal_bayar DESC
        `;
        const [rows] = await db.query(query);
        return res.json(rows);
    } catch (err) {
        console.error('Get riwayat honor error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete Riwayat Pembayaran (Batalkan Pembayaran)
exports.deleteRiwayatHonor = async (req, res) => {
    try {
        if (req.user.role !== 'bendahara') {
            return res.status(403).json({ message: 'Access denied. Bendahara only.' });
        }

        const { id } = req.params;

        // Mulai transaksi
        await db.query('START TRANSACTION');

        const [riwayatRows] = await db.query('SELECT guru_id, mapel, jumlah_pertemuan FROM pembayaran_honor WHERE id = ?', [id]);
        if (riwayatRows.length > 0) {
            const { guru_id, mapel, jumlah_pertemuan } = riwayatRows[0];
            
            // Cari ID kehadiran_siswa yang sudah dibayar untuk di-revert
            const queryIds = `
                SELECT ka.id
                FROM kehadiran_siswa ka
                JOIN siswa s ON ka.siswa_id = s.id
                JOIN jadwal_pelajaran jp ON jp.mata_pelajaran = ka.jenis_kegiatan AND jp.kelas = s.kelas
                WHERE jp.guru_id = ? AND ka.jenis_kegiatan = ? AND ka.is_paid = 1
                ORDER BY ka.id DESC
                LIMIT ?
            `;
            const [idRows] = await db.query(queryIds, [guru_id, mapel, parseInt(jumlah_pertemuan)]);
            const idsToUpdate = idRows.map(r => r.id);

            if (idsToUpdate.length > 0) {
                await db.query('UPDATE kehadiran_siswa SET is_paid = 0 WHERE id IN (?)', [idsToUpdate]);
            }
        }

        await db.query('DELETE FROM pembayaran_honor WHERE id = ?', [id]);
        
        await db.query('COMMIT');
        return res.json({ message: 'Riwayat pembayaran berhasil dihapus dan dibatalkan.' });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Delete riwayat honor error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
