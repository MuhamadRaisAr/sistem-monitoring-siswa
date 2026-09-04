const db = require('../config/db');
const webpush = require('../config/webpush');

// Get discipline records (violations & permissions)
exports.getRecords = async (req, res) => {
    try {
        const { siswa_id, kategori, status_izin, tahun_ajaran_id, kelas } = req.query;

        // Security check for parents
        if (req.user.role === 'wali_siswa') {
            if (!siswa_id) {
                return res.status(400).json({ message: 'siswa ID is required for parents.' });
            }
            const [mapping] = await db.query(
                'SELECT id FROM wali_siswa_mapping WHERE wali_id = ? AND siswa_id = ?',
                [req.user.id, siswa_id]
            );
            if (mapping.length === 0) {
                return res.status(403).json({ message: 'Access denied. You can only view your children\'s logs.' });
            }
        }

        let query = `
            SELECT k.*, s.nama_lengkap AS nama_siswa, s.nis, s.kelas, u.nama_lengkap AS nama_pelapor
            FROM kedisiplinan k
            JOIN siswa s ON k.siswa_id = s.id
            LEFT JOIN users u ON k.pelapor_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (siswa_id) {
            query += ' AND k.siswa_id = ?';
            params.push(siswa_id);
        }
        if (kategori) {
            query += ' AND k.kategori = ?';
            params.push(kategori);
        }
        if (status_izin) {
            query += ' AND k.status_izin = ?';
            params.push(status_izin);
        }
        if (tahun_ajaran_id) {
            query += ' AND k.tahun_ajaran_id = ?';
            params.push(tahun_ajaran_id);
        }
        if (kelas) {
            query += ' AND (s.kelas = ? OR s.kelas LIKE ?)';
            params.push(kelas, kelas + ' (%');
        }

        query += ' ORDER BY k.tanggal_kejadian DESC, k.created_at DESC';

        const [rows] = await db.query(query, params);
        return res.json(rows);
    } catch (err) {
        console.error('Get discipline records error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Create a record (admin can create violations and permissions)
exports.createRecord = async (req, res) => {
    try {
        if (!['admin', 'guru', 'guru_bk'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied. Admins, Guru, or Guru BK only.' });
        }

        const { siswa_id, kategori, nama_kegiatan, tanggal_kejadian, status_izin, tahun_ajaran_id } = req.body;
        if (!siswa_id || !kategori || !nama_kegiatan || !tanggal_kejadian) {
            return res.status(400).json({ message: 'siswa ID, category, name of activity/reason, and date are required.' });
        }

        if (!['pelanggaran', 'perizinan'].includes(kategori)) {
            return res.status(400).json({ message: 'Invalid category.' });
        }

        const [result] = await db.query(
            'INSERT INTO kedisiplinan (siswa_id, tahun_ajaran_id, kategori, nama_kegiatan, tanggal_kejadian, status_izin, pelapor_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                siswa_id, 
                tahun_ajaran_id || null,
                kategori, 
                nama_kegiatan, 
                tanggal_kejadian, 
                kategori === 'perizinan' ? (status_izin || 'disetujui') : 'disetujui',
                req.user.id
            ]
        );

        if (kategori === 'pelanggaran') {
            const [mappings] = await db.query('SELECT wali_id FROM wali_siswa_mapping WHERE siswa_id = ?', [siswa_id]);
            const io = req.app.get('io');
            if (io && mappings.length > 0) {
                const [siswaData] = await db.query('SELECT nama_lengkap FROM siswa WHERE id = ?', [siswa_id]);
                const namaSiswa = siswaData[0]?.nama_lengkap || 'Putra/Putri Anda';
                
                const notifPayload = {
                    title: 'Pemberitahuan Pelanggaran',
                    message: `Anak Anda, ${namaSiswa}, mendapat catatan pelanggaran baru: ${nama_kegiatan}.`,
                    type: 'warning',
                    created_at: new Date().toISOString()
                };
                
                console.log(`Emit notification for ${namaSiswa} to ${mappings.length} parents:`, mappings);
                mappings.forEach(m => {
                    // Socket.IO notification (In-App)
                    io.to(`user_${m.wali_id}`).emit('new_notification', notifPayload);
                    console.log(`Emitted to user_${m.wali_id}`);
                });

                // Web Push Notification (Background)
                const waliIds = mappings.map(m => m.wali_id);
                if (waliIds.length > 0) {
                    const [subs] = await db.query('SELECT endpoint, keys_auth, keys_p256dh FROM push_subscriptions WHERE user_id IN (?)', [waliIds]);
                    
                    const pushPayload = JSON.stringify({
                        title: notifPayload.title,
                        body: notifPayload.message,
                        url: '/wali_siswa/kedisiplinan'
                    });

                    for (const sub of subs) {
                        const pushSubscription = {
                            endpoint: sub.endpoint,
                            keys: {
                                auth: sub.keys_auth,
                                p256dh: sub.keys_p256dh
                            }
                        };
                        
                        try {
                            await webpush.sendNotification(pushSubscription, pushPayload);
                            console.log('Web Push sent to', sub.endpoint);
                        } catch (err) {
                            console.error('Failed to send Web Push:', err);
                            // Optional: Delete subscription if expired/unsubscribed (status 410 or 404)
                            if (err.statusCode === 410 || err.statusCode === 404) {
                                await db.query('DELETE FROM push_subscriptions WHERE endpoint = ?', [sub.endpoint]);
                            }
                        }
                    }
                }
            } else {
                console.log(`Failed to emit notification. io present: ${!!io}, mappings count: ${mappings.length}`);
            }
        }

        return res.status(201).json({ message: 'Discipline record logged successfully', id: result.insertId });
    } catch (err) {
        console.error('Create discipline record error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Request leave permission (Wali siswa only)
exports.requestPermission = async (req, res) => {
    try {
        if (req.user.role !== 'wali_siswa') {
            return res.status(403).json({ message: 'Access denied. Parents only.' });
        }

        const { siswa_id, nama_kegiatan, tanggal_kejadian, tahun_ajaran_id } = req.body;
        if (!siswa_id || !nama_kegiatan || !tanggal_kejadian) {
            return res.status(400).json({ message: 'siswa ID, reason for leaving, and date are required.' });
        }

        // Verify child maps to this parent
        const [mapping] = await db.query(
            'SELECT id FROM wali_siswa_mapping WHERE wali_id = ? AND siswa_id = ?',
            [req.user.id, siswa_id]
        );
        if (mapping.length === 0) {
            return res.status(403).json({ message: 'Access denied. You can only request permissions for your own child.' });
        }

        const [result] = await db.query(
            'INSERT INTO kedisiplinan (siswa_id, tahun_ajaran_id, kategori, nama_kegiatan, tanggal_kejadian, status_izin, pelapor_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [siswa_id, tahun_ajaran_id || null, 'perizinan', nama_kegiatan, tanggal_kejadian, 'diajukan', req.user.id]
        );

        return res.status(201).json({ message: 'Leave permission request submitted successfully.', id: result.insertId });
    } catch (err) {
        console.error('Request leave permission error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Update record (Admin only)
exports.updateRecord = async (req, res) => {
    try {
        if (!['admin', 'guru', 'guru_bk'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied. Admins, Guru, or Guru BK only.' });
        }

        const { id } = req.params;
        const { siswa_id, kategori, nama_kegiatan, tanggal_kejadian, status_izin, tahun_ajaran_id } = req.body;

        if (!siswa_id || !kategori || !nama_kegiatan || !tanggal_kejadian) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        await db.query(
            'UPDATE kedisiplinan SET siswa_id = ?, tahun_ajaran_id = ?, kategori = ?, nama_kegiatan = ?, tanggal_kejadian = ?, status_izin = ? WHERE id = ?',
            [
                siswa_id, 
                tahun_ajaran_id || null,
                kategori, 
                nama_kegiatan, 
                tanggal_kejadian, 
                status_izin || 'disetujui',
                id
            ]
        );

        return res.json({ message: 'Discipline record updated successfully.' });
    } catch (err) {
        console.error('Update discipline record error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Approve / Reject Permission (Admin only)
exports.updatePermissionStatus = async (req, res) => {
    try {
        if (!['admin', 'guru', 'guru_bk'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied. Admins, Guru, or Guru BK only.' });
        }

        const { id } = req.params;
        const { status_izin } = req.body; // 'disetujui', 'ditolak', 'kembali'

        if (!['disetujui', 'ditolak', 'kembali'].includes(status_izin)) {
            return res.status(400).json({ message: 'Invalid permission status.' });
        }

        await db.query(
            'UPDATE kedisiplinan SET status_izin = ? WHERE id = ? AND kategori = "perizinan"',
            [status_izin, id]
        );

        return res.json({ message: 'Leave permission status updated successfully.' });
    } catch (err) {
        console.error('Update permission status error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete record
exports.deleteRecord = async (req, res) => {
    try {
        if (!['admin', 'guru', 'guru_bk'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied. Admins, Guru, or Guru BK only.' });
        }

        const { id } = req.params;

        // Check ownership for guru
        if (req.user.role === 'guru') {
            const [record] = await db.query(`
                SELECT k.pelapor_id, s.kelas
                FROM kedisiplinan k
                JOIN siswa s ON k.siswa_id = s.id
                WHERE k.id = ?
            `, [id]);
            
            if (record.length === 0) {
                return res.status(404).json({ message: 'Record not found.' });
            }

            const isPelapor = record[0].pelapor_id === req.user.id;
            
            let isWaliKelas = false;
            if (record[0].kelas) {
                const [kelasRows] = await db.query('SELECT id FROM kelas WHERE nama_kelas = ? AND wali_kelas_id = ?', [record[0].kelas, req.user.id]);
                if (kelasRows.length > 0) isWaliKelas = true;
            }

            if (!isPelapor && !isWaliKelas) {
                return res.status(403).json({ message: 'Akses ditolak. Anda hanya bisa menghapus pelanggaran buatan sendiri atau untuk siswa di kelas perwalian Anda.' });
            }
        }

        await db.query('DELETE FROM kedisiplinan WHERE id = ?', [id]);
        return res.json({ message: 'Discipline record deleted successfully.' });
    } catch (err) {
        console.error('Delete discipline record error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Get Rekap for Surat Peringatan (Guru BK & Admin only)
exports.getRekapSP = async (req, res) => {
    try {
        if (!['admin', 'guru_bk'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied. Admins or Guru BK only.' });
        }

        const query = `
            SELECT s.id, s.nis, s.nama_lengkap, s.kelas, 
                   COUNT(k.id) AS total_pelanggaran
            FROM siswa s
            JOIN kedisiplinan k ON s.id = k.siswa_id
            WHERE k.kategori = 'pelanggaran'
            GROUP BY s.id
            HAVING total_pelanggaran > 0
            ORDER BY total_pelanggaran DESC, s.nama_lengkap ASC
        `;
        
        const [rows] = await db.query(query);
        return res.json(rows);
    } catch (err) {
        console.error('Get rekap SP error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
