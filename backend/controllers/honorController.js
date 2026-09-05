const db = require('../config/db');

const honorController = {
    // 1. Mendapatkan daftar guru beserta tarif_per_jam
    getGuruList: async (req, res) => {
        try {
            const [gurus] = await db.query(`
                SELECT id, nama_lengkap, username, no_hp, tarif_per_jam 
                FROM users 
                WHERE role = 'guru'
                ORDER BY nama_lengkap ASC
            `);
            res.json(gurus);
        } catch (error) {
            console.error('Error getGuruList:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        }
    },

    // 2. Mengupdate tarif per jam seorang guru
    updateTarif: async (req, res) => {
        const { id } = req.params;
        const { tarif_per_jam } = req.body;
        
        try {
            await db.query(
                `UPDATE users SET tarif_per_jam = ? WHERE id = ? AND role = 'guru'`,
                [tarif_per_jam, id]
            );
            res.json({ message: 'Tarif berhasil diupdate' });
        } catch (error) {
            console.error('Error updateTarif:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        }
    },

    // 2.5 Mendapatkan akumulasi honor yang belum dibayar (Pending Balance)
    getPendingHonor: async (req, res) => {
        try {
            let query = `
                SELECT 
                    u.id as guru_id, 
                    u.nama_lengkap, 
                    u.username,
                    u.tarif_per_jam as default_tarif,
                    h.id, h.bulan, h.tahun, h.total_jam_mengajar, h.tarif_per_jam, h.total_honor, h.status_pembayaran, h.tanggal_bayar, h.tahun_ajaran_id,
                    (
                        SELECT COUNT(DISTINCT k.tanggal, s.kelas)
                        FROM kehadiran_siswa k
                        JOIN siswa s ON k.siswa_id = s.id
                        JOIN jadwal_pelajaran j ON k.jenis_kegiatan = j.mata_pelajaran AND (s.kelas = j.kelas OR s.kelas LIKE CONCAT(j.kelas, ' %'))
                        WHERE j.guru_id = u.id 
                          AND k.is_paid = 0
                    ) as computed_pertemuan
                FROM users u
                LEFT JOIN honor_guru h ON u.id = h.guru_id AND h.status_pembayaran = 'belum_dibayar'
                WHERE u.role = 'guru'
                ORDER BY u.nama_lengkap ASC
            `;
            const [honors] = await db.query(query);
            res.json(honors);
        } catch (error) {
            console.error('Error getPendingHonor:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        }
    },

    // 3. Mendapatkan data honor berdasarkan bulan & tahun
    getHonorByBulan: async (req, res) => {
        const { bulan, tahun, tahun_ajaran_id } = req.query;
        try {
            let query = `
                SELECT 
                    u.id as guru_id, 
                    u.nama_lengkap, 
                    u.username,
                    u.tarif_per_jam as default_tarif,
                    h.id, h.bulan, h.tahun, h.total_jam_mengajar, h.tarif_per_jam, h.total_honor, h.status_pembayaran, h.tanggal_bayar, h.tahun_ajaran_id,
                    (SELECT GROUP_CONCAT(DISTINCT mata_pelajaran SEPARATOR ', ') FROM jadwal_pelajaran j WHERE j.guru_id = u.id AND j.tahun_ajaran_id = ?) as mapel,
                    (
                        SELECT COUNT(DISTINCT k.tanggal, s.kelas)
                        FROM kehadiran_siswa k
                        JOIN siswa s ON k.siswa_id = s.id
                        JOIN jadwal_pelajaran j ON k.jenis_kegiatan = j.mata_pelajaran AND (s.kelas = j.kelas OR s.kelas LIKE CONCAT(j.kelas, ' %'))
                        WHERE j.guru_id = u.id 
                          AND MONTH(k.tanggal) = ? 
                          AND YEAR(k.tanggal) = ?
                    ) as computed_pertemuan
                FROM users u
                JOIN honor_guru h ON u.id = h.guru_id AND h.bulan = ? AND h.tahun = ? ${tahun_ajaran_id ? 'AND h.tahun_ajaran_id = ?' : ''} AND h.status_pembayaran = 'dibayar'
                WHERE u.role = 'guru'
                ORDER BY u.nama_lengkap ASC
            `;
            let params = [tahun_ajaran_id || null, bulan, tahun, bulan, tahun];
            if (tahun_ajaran_id) params.push(tahun_ajaran_id);

            const [honors] = await db.query(query, params);
            res.json(honors);
        } catch (error) {
            console.error('Error getHonorByBulan:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        }
    },

    // 3b. Mendapatkan data riwayat honor per semester
    getHonorRiwayatBySemester: async (req, res) => {
        const { tahun_ajaran_id } = req.query;
        try {
            let query = `
                SELECT 
                    u.id as guru_id, 
                    u.nama_lengkap, 
                    u.username,
                    u.tarif_per_jam as default_tarif,
                    h.id, h.bulan, h.tahun, h.total_jam_mengajar, h.tarif_per_jam, h.total_honor, h.status_pembayaran, h.tanggal_bayar, h.tahun_ajaran_id
                FROM users u
                JOIN honor_guru h ON u.id = h.guru_id AND h.status_pembayaran = 'dibayar' ${tahun_ajaran_id ? 'AND h.tahun_ajaran_id = ?' : ''}
                WHERE u.role = 'guru'
                ORDER BY h.tanggal_bayar DESC, u.nama_lengkap ASC
            `;
            let params = [];
            if (tahun_ajaran_id) params.push(tahun_ajaran_id);

            const [honors] = await db.query(query, params);
            res.json(honors);
        } catch (error) {
            console.error('Error getHonorRiwayatBySemester:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        }
    },

    // 4. Generate/Hitung otomatis honor untuk bulan tertentu berdasarkan jadwal
    generateHonor: async (req, res) => {
        const { bulan, tahun, tahun_ajaran_id, nominal } = req.body;
        
        if (!bulan || !tahun || !tahun_ajaran_id || nominal === undefined) {
            return res.status(400).json({ message: 'Bulan, tahun, tahun ajaran, dan nominal wajib diisi' });
        }

        try {
            await db.query('START TRANSACTION');

            // Ambil semua guru dengan default tarifnya
            const [gurus] = await db.query(`SELECT id, tarif_per_jam FROM users WHERE role = 'guru'`);

            let countNew = 0;
            let countUpdate = 0;

            for (const guru of gurus) {
                // Hitung pertemuan dinamis dari kehadiran_siswa yang belum dibayar
                const [[{ computed_pertemuan }]] = await db.query(`
                    SELECT COUNT(DISTINCT k.tanggal, s.kelas) as computed_pertemuan
                    FROM kehadiran_siswa k
                    JOIN siswa s ON k.siswa_id = s.id
                    JOIN jadwal_pelajaran j ON k.jenis_kegiatan = j.mata_pelajaran AND (s.kelas = j.kelas OR s.kelas LIKE CONCAT(j.kelas, ' %'))
                    WHERE j.guru_id = ? 
                      AND k.is_paid = 0
                `, [guru.id]);

                const totalJamBulan = computed_pertemuan || 0;

                // Skip guru yang tidak ada absensi belum dibayar
                if (totalJamBulan === 0) continue;

                // Gunakan nominal dari input, jika tidak ada fallback ke tarif_per_jam milik guru
                const tarif = nominal !== undefined && nominal !== null && nominal !== '' ? parseInt(nominal) : (parseInt(guru.tarif_per_jam) || 0);
                const totalHonor = totalJamBulan * tarif;

                // Cek apakah sudah ada tagihan yang belum dibayar (tanpa peduli bulannya)
                const [existing] = await db.query(`
                    SELECT id FROM honor_guru 
                    WHERE guru_id = ? AND status_pembayaran = 'belum_dibayar'
                `, [guru.id]);

                if (existing.length > 0) {
                    // Update hitungannya
                    await db.query(`
                        UPDATE honor_guru 
                        SET total_jam_mengajar = ?, tarif_per_jam = ?, total_honor = ?, tahun_ajaran_id = ?, bulan = ?, tahun = ?
                        WHERE id = ?
                    `, [totalJamBulan, tarif, totalHonor, tahun_ajaran_id, bulan, tahun, existing[0].id]);
                    countUpdate++;
                } else {
                    // Insert baru
                    await db.query(`
                        INSERT INTO honor_guru (guru_id, tahun_ajaran_id, bulan, tahun, total_jam_mengajar, tarif_per_jam, total_honor)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `, [guru.id, tahun_ajaran_id, bulan, tahun, totalJamBulan, tarif, totalHonor]);
                    countNew++;
                }
            }

            await db.query('COMMIT');
            if (countNew === 0 && countUpdate === 0) {
                return res.json({ message: 'Tidak ada guru dengan absensi yang belum terbayar.' });
            }
            res.json({ message: `Berhasil generate honor. Baru: ${countNew}, Diupdate: ${countUpdate}` });
        } catch (error) {
            await db.query('ROLLBACK');
            console.error('Error generateHonor:', error);
            res.status(500).json({ message: 'Gagal men-generate data honor' });
        }
    },

    // 5. Update manual tarif atau jumlah jam
    updateManualHonor: async (req, res) => {
        const { id } = req.params;
        const { total_jam_mengajar, tarif_per_jam } = req.body;
        
        try {
            const [honor] = await db.query(`SELECT total_jam_mengajar, tarif_per_jam FROM honor_guru WHERE id = ?`, [id]);
            if(honor.length === 0) return res.status(404).json({ message: 'Data tidak ditemukan' });

            const jmlPertemuan = total_jam_mengajar !== undefined ? total_jam_mengajar : honor[0].total_jam_mengajar;
            const tarif = tarif_per_jam !== undefined ? tarif_per_jam : honor[0].tarif_per_jam;
            const finalHonor = jmlPertemuan * tarif;

            await db.query(
                `UPDATE honor_guru SET total_jam_mengajar = ?, tarif_per_jam = ?, total_honor = ? WHERE id = ?`,
                [jmlPertemuan, tarif, finalHonor, id]
            );
            res.json({ message: 'Data honor berhasil diupdate' });
        } catch (error) {
            console.error('Error updateManualHonor:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        }
    },

    // 6. Bayar Honor
    payHonor: async (req, res) => {
        const { id } = req.params;
        try {
            await db.query('START TRANSACTION');

            // Ambil guru_id dari tagihan ini
            const [[honor]] = await db.query(`SELECT guru_id FROM honor_guru WHERE id = ?`, [id]);

            await db.query(
                `UPDATE honor_guru SET status_pembayaran = 'dibayar', tanggal_bayar = CURDATE() WHERE id = ?`,
                [id]
            );

            // Lunasi absensi guru tersebut
            if (honor && honor.guru_id) {
                await db.query(`
                    UPDATE kehadiran_siswa k
                    JOIN siswa s ON k.siswa_id = s.id
                    JOIN jadwal_pelajaran j ON k.jenis_kegiatan = j.mata_pelajaran AND (s.kelas = j.kelas OR s.kelas LIKE CONCAT(j.kelas, ' %'))
                    SET k.is_paid = 1
                    WHERE j.guru_id = ? AND k.is_paid = 0
                `, [honor.guru_id]);
            }

            await db.query('COMMIT');
            res.json({ message: 'Honor berhasil dibayar' });
        } catch (error) {
            await db.query('ROLLBACK');
            console.error('Error payHonor:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        }
    },

    // 6a. Bayar Bulk Honor (sekaligus)
    payBulkHonor: async (req, res) => {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'Tidak ada data yang dipilih' });
        }
        try {
            await db.query('START TRANSACTION');

            for (const id of ids) {
                const [[honor]] = await db.query(`SELECT guru_id FROM honor_guru WHERE id = ? AND status_pembayaran = 'belum_dibayar'`, [id]);
                if (!honor) continue;

                await db.query(
                    `UPDATE honor_guru SET status_pembayaran = 'dibayar', tanggal_bayar = CURDATE() WHERE id = ?`,
                    [id]
                );

                if (honor.guru_id) {
                    await db.query(`
                        UPDATE kehadiran_siswa k
                        JOIN siswa s ON k.siswa_id = s.id
                        JOIN jadwal_pelajaran j ON k.jenis_kegiatan = j.mata_pelajaran AND (s.kelas = j.kelas OR s.kelas LIKE CONCAT(j.kelas, ' %'))
                        SET k.is_paid = 1
                        WHERE j.guru_id = ? AND k.is_paid = 0
                    `, [honor.guru_id]);
                }
            }

            await db.query('COMMIT');
            res.json({ message: `${ids.length} honor berhasil dibayar sekaligus` });
        } catch (error) {
            await db.query('ROLLBACK');
            console.error('Error payBulkHonor:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        }
    },

    // 6b. Batalkan Pembayaran Honor
    cancelHonor: async (req, res) => {
        const { id } = req.params;
        try {
            await db.query('START TRANSACTION');

            // Ambil data tagihan
            const [[honor]] = await db.query(
                `SELECT * FROM honor_guru WHERE id = ?`, [id]
            );

            if (!honor) {
                await db.query('ROLLBACK');
                return res.status(404).json({ message: 'Data honor tidak ditemukan' });
            }

            if (honor.status_pembayaran !== 'dibayar') {
                await db.query('ROLLBACK');
                return res.status(400).json({ message: 'Hanya honor berstatus DIBAYAR yang dapat dibatalkan' });
            }

            // Reset status honor ke menunggu
            await db.query(
                `UPDATE honor_guru SET status_pembayaran = 'belum_dibayar', tanggal_bayar = NULL WHERE id = ?`,
                [id]
            );

            // Reset absensi yang sempat dilunasi kembali ke belum dibayar
            if (honor.guru_id) {
                await db.query(`
                    UPDATE kehadiran_siswa k
                    JOIN siswa s ON k.siswa_id = s.id
                    JOIN jadwal_pelajaran j ON k.jenis_kegiatan = j.mata_pelajaran AND (s.kelas = j.kelas OR s.kelas LIKE CONCAT(j.kelas, ' %'))
                    SET k.is_paid = 0
                    WHERE j.guru_id = ? AND k.is_paid = 1
                `, [honor.guru_id]);
            }

            await db.query('COMMIT');
            res.json({ message: 'Pembayaran honor berhasil dibatalkan' });
        } catch (error) {
            await db.query('ROLLBACK');
            console.error('Error cancelHonor:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        }
    },

    // 6c. Hapus Riwayat Honor
    deleteHonor: async (req, res) => {
        const { id } = req.params;
        try {
            const [[honor]] = await db.query(`SELECT * FROM honor_guru WHERE id = ?`, [id]);
            if (!honor) return res.status(404).json({ message: 'Data honor tidak ditemukan' });

            if (honor.status_pembayaran === 'dibayar') {
                return res.status(400).json({ message: 'Honor yang sudah dibayar tidak dapat dihapus, batalkan pembayaran terlebih dahulu' });
            }

            await db.query(`DELETE FROM honor_guru WHERE id = ?`, [id]);
            res.json({ message: 'Riwayat honor berhasil dihapus' });
        } catch (error) {
            console.error('Error deleteHonor:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        }
    },

    // 7. Mendapatkan data honor untuk diri sendiri (Role Guru)
    getMyHonor: async (req, res) => {
        const guru_id = req.user.id;
        const { tahun_ajaran_id } = req.query;
        
        try {
            let query = `
                SELECT 
                    h.*, ta.nama_tahun, ta.semester,
                    u.nama_lengkap, u.username,
                    (SELECT GROUP_CONCAT(DISTINCT mata_pelajaran SEPARATOR ', ') FROM jadwal_pelajaran j WHERE j.guru_id = h.guru_id AND j.tahun_ajaran_id = h.tahun_ajaran_id) as mapel
                FROM honor_guru h
                JOIN users u ON h.guru_id = u.id
                LEFT JOIN tahun_ajaran ta ON h.tahun_ajaran_id = ta.id
                WHERE h.guru_id = ?
            `;
            let params = [guru_id];

            if (tahun_ajaran_id) {
                query += ` AND h.tahun_ajaran_id = ?`;
                params.push(tahun_ajaran_id);
            }

            query += ` ORDER BY h.tahun DESC, h.bulan DESC`;

            const [honors] = await db.query(query, params);
            res.json(honors);
        } catch (error) {
            console.error('Error getMyHonor:', error);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        }
    }
};

module.exports = honorController;
