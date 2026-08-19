const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Get all siswa (with mapping info)
exports.getAllsiswa = async (req, res) => {
    try {
        const { kelas, tahun_ajaran_id } = req.query;
        
        // Cari ID tahun ajaran aktif jika tidak dikirimkan di query params
        let targetTaId = tahun_ajaran_id;
        if (!targetTaId) {
            const [taActive] = await db.query('SELECT id FROM tahun_ajaran WHERE is_active = 1');
            if (taActive.length > 0) {
                targetTaId = taActive[0].id;
            }
        }

        if (['admin', 'guru_bk', 'bendahara'].includes(req.user.role)) {
            let query = `
                SELECT s.*, u.nama_lengkap AS nama_wali, u.no_hp, u.id AS wali_id,
                       w.nama_lengkap AS nama_wali_kelas
                FROM siswa s
                LEFT JOIN wali_siswa_mapping wsm ON s.id = wsm.siswa_id
                LEFT JOIN users u ON wsm.wali_id = u.id AND u.role = 'wali_siswa'
                LEFT JOIN wali_kelas_history wkh ON s.kelas = wkh.nama_kelas AND wkh.tahun_ajaran_id = ?
                LEFT JOIN users w ON wkh.guru_id = w.id
            `;
            const params = [targetTaId || 0];

            if (kelas) {
                query += ' WHERE (s.kelas = ? OR s.kelas LIKE ?) ';
                params.push(kelas, kelas + ' (%');
            }
            
            query += ' ORDER BY s.nama_lengkap ASC';
            
            const [rows] = await db.query(query, params);
            return res.json(rows);
        } else if (req.user.role === 'guru') {
            // Fetch classes assigned to this guru from jadwal_pelajaran
            const [classes] = await db.query('SELECT DISTINCT kelas FROM jadwal_pelajaran WHERE guru_id = ?', [req.user.id]);
            
            // Also fetch if this guru is a wali kelas, UNLESS strict_jadwal is true
            const classNames = new Set(classes.map(c => c.kelas));
            
            if (req.query.strict_jadwal !== 'true') {
                const [waliClasses] = await db.query('SELECT nama_kelas FROM kelas WHERE wali_kelas_id = ?', [req.user.id]);
                waliClasses.forEach(c => classNames.add(c.nama_kelas));
            }
            
            if (classNames.size === 0) {
                return res.json([]); // Guru has no assigned classes and is not a wali kelas, return empty
            }
            
            const classArray = Array.from(classNames);
            
            // Get siswa that belong to those classes
            let query = `
                SELECT s.*, u.nama_lengkap AS nama_wali, u.no_hp, u.id AS wali_id,
                       w.nama_lengkap AS nama_wali_kelas
                FROM siswa s
                LEFT JOIN wali_siswa_mapping wsm ON s.id = wsm.siswa_id
                LEFT JOIN users u ON wsm.wali_id = u.id AND u.role = 'wali_siswa'
                LEFT JOIN wali_kelas_history wkh ON s.kelas = wkh.nama_kelas AND wkh.tahun_ajaran_id = ?
                LEFT JOIN users w ON wkh.guru_id = w.id
                WHERE s.kelas IN (?)
            `;
            const params = [targetTaId || 0, classArray];

            if (req.query.kelas) {
                query += ' AND (s.kelas = ? OR s.kelas LIKE ?) ';
                params.push(req.query.kelas, req.query.kelas + ' (%');
            }
            
            query += ' ORDER BY s.kelas ASC, s.nama_lengkap ASC';
            
            const [rows] = await db.query(query, params);
            return res.json(rows);
        } else {
            return res.status(403).json({ message: 'Access denied.' });
        }
    } catch (err) {
        console.error('Get all siswa error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Create new siswa
exports.createsiswa = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const { 
            nis, nama_lengkap, kelas, asrama, status_aktif, nama_wali, no_hp,
            nisn, tempat_lahir, tanggal_lahir, jenis_kelamin, agama, pendidikan_sebelumnya, alamat_siswa,
            nama_ayah, nama_ibu, pekerjaan_ayah, pekerjaan_ibu, jalan_ortu, kelurahan_ortu, kecamatan_ortu, kabupaten_ortu, provinsi_ortu,
            pekerjaan_wali, alamat_wali
        } = req.body;
        
        if (!nis || !nama_lengkap || !kelas) {
            return res.status(400).json({ message: 'NIS, full name, and class are required.' });
        }

        // Check duplicate NIS
        const [existing] = await db.query('SELECT id FROM siswa WHERE nis = ?', [nis]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'NIS is already registered.' });
        }

        const asramaVal = asrama || '-';
        const [result] = await db.query(
            `INSERT INTO siswa (
                nis, nama_lengkap, kelas, asrama, status_aktif, 
                nisn, tempat_lahir, tanggal_lahir, jenis_kelamin, agama, pendidikan_sebelumnya, alamat_siswa,
                nama_ayah, nama_ibu, pekerjaan_ayah, pekerjaan_ibu, jalan_ortu, kelurahan_ortu, kecamatan_ortu, kabupaten_ortu, provinsi_ortu,
                pekerjaan_wali, alamat_wali
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nis, nama_lengkap, kelas, asramaVal, status_aktif || 'aktif',
                nisn || null, tempat_lahir || null, tanggal_lahir || null, jenis_kelamin || null, agama || null, pendidikan_sebelumnya || null, alamat_siswa || null,
                nama_ayah || null, nama_ibu || null, pekerjaan_ayah || null, pekerjaan_ibu || null, jalan_ortu || null, kelurahan_ortu || null, kecamatan_ortu || null, kabupaten_ortu || null, provinsi_ortu || null,
                pekerjaan_wali || null, alamat_wali || null
            ]
        );
        const siswaId = result.insertId;

        // Auto-create Wali siswa user account with username = NIS, password = 'password123'
        const [existingUser] = await db.query('SELECT id FROM users WHERE username = ?', [nis]);
        let waliId;
        if (existingUser.length === 0) {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash('password123', salt);
            const [userResult] = await db.query(
                'INSERT INTO users (username, password, nama_lengkap, role, no_hp) VALUES (?, ?, ?, ?, ?)',
                [nis, passwordHash, nama_wali || `Wali ${nama_lengkap}`, 'wali_siswa', no_hp || '']
            );
            waliId = userResult.insertId;
        } else {
            waliId = existingUser[0].id;
        }

        // Map wali to siswa
        await db.query(
            'INSERT INTO wali_siswa_mapping (wali_id, siswa_id) VALUES (?, ?)',
            [waliId, siswaId]
        );

        return res.status(201).json({ message: 'siswa created successfully', id: siswaId });
    } catch (err) {
        console.error('Create siswa error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Update siswa
exports.updatesiswa = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const { id } = req.params;
        const { 
            nis, nama_lengkap, kelas, asrama, status_aktif, nama_wali, no_hp,
            nisn, tempat_lahir, tanggal_lahir, jenis_kelamin, agama, pendidikan_sebelumnya, alamat_siswa,
            nama_ayah, nama_ibu, pekerjaan_ayah, pekerjaan_ibu, jalan_ortu, kelurahan_ortu, kecamatan_ortu, kabupaten_ortu, provinsi_ortu,
            pekerjaan_wali, alamat_wali
        } = req.body;

        if (!nis || !nama_lengkap || !kelas || !status_aktif) {
            return res.status(400).json({ message: 'NIS, full name, class, and status are required.' });
        }

        // Check duplicate NIS for other records
        const [existing] = await db.query('SELECT id FROM siswa WHERE nis = ? AND id != ?', [nis, id]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'NIS is already registered by another student.' });
        }

        // Cek kelas lama sebelum update
        const [oldsiswa] = await db.query('SELECT kelas FROM siswa WHERE id = ?', [id]);
        const oldKelas = oldsiswa.length > 0 ? oldsiswa[0].kelas : null;

        const asramaVal = asrama || '-';
        await db.query(
            `UPDATE siswa SET 
                nis = ?, nama_lengkap = ?, kelas = ?, asrama = ?, status_aktif = ?, 
                nisn = ?, tempat_lahir = ?, tanggal_lahir = ?, jenis_kelamin = ?, agama = ?, pendidikan_sebelumnya = ?, alamat_siswa = ?,
                nama_ayah = ?, nama_ibu = ?, pekerjaan_ayah = ?, pekerjaan_ibu = ?, jalan_ortu = ?, kelurahan_ortu = ?, kecamatan_ortu = ?, kabupaten_ortu = ?, provinsi_ortu = ?,
                pekerjaan_wali = ?, alamat_wali = ?
            WHERE id = ?`,
            [
                nis, nama_lengkap, kelas, asramaVal, status_aktif,
                nisn || null, tempat_lahir || null, tanggal_lahir || null, jenis_kelamin || null, agama || null, pendidikan_sebelumnya || null, alamat_siswa || null,
                nama_ayah || null, nama_ibu || null, pekerjaan_ayah || null, pekerjaan_ibu || null, jalan_ortu || null, kelurahan_ortu || null, kecamatan_ortu || null, kabupaten_ortu || null, provinsi_ortu || null,
                pekerjaan_wali || null, alamat_wali || null,
                id
            ]
        );

        // Jika kelas berubah, reset/hapus data akademik, absensi, dan kedisiplinan lama
        if (oldKelas && oldKelas !== kelas) {
            await db.query('DELETE FROM nilai_siswa WHERE siswa_id = ?', [id]);
            await db.query('DELETE FROM kehadiran_siswa WHERE siswa_id = ?', [id]);
            await db.query('DELETE FROM kedisiplinan WHERE siswa_id = ?', [id]);
        }

        // Update the associated Wali siswa user's username to match new NIS and update full name & no_hp
        const [mapping] = await db.query('SELECT wali_id FROM wali_siswa_mapping WHERE siswa_id = ?', [id]);
        if (mapping.length > 0) {
            const waliId = mapping[0].wali_id;
            await db.query(
                'UPDATE users SET username = ?, nama_lengkap = ?, no_hp = ? WHERE id = ?',
                [nis, nama_wali || `Wali ${nama_lengkap}`, no_hp || '', waliId]
            );
        } else {
            // In case mapping does not exist for legacy data, create user and map
            const [existingUser] = await db.query('SELECT id FROM users WHERE username = ?', [nis]);
            let waliId;
            if (existingUser.length === 0) {
                const salt = await bcrypt.genSalt(10);
                const passwordHash = await bcrypt.hash('password123', salt);
                const [userResult] = await db.query(
                    'INSERT INTO users (username, password, nama_lengkap, role, no_hp) VALUES (?, ?, ?, ?, ?)',
                    [nis, passwordHash, nama_wali || `Wali ${nama_lengkap}`, 'wali_siswa', no_hp || '']
                );
                waliId = userResult.insertId;
            } else {
                waliId = existingUser[0].id;
            }
            await db.query(
                'INSERT INTO wali_siswa_mapping (wali_id, siswa_id) VALUES (?, ?)',
                [waliId, id]
            );
        }

        return res.json({ message: 'siswa updated successfully.' });
    } catch (err) {
        console.error('Update siswa error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete siswa
exports.deletesiswa = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const { id } = req.params;

        // Find associated Wali siswa account and delete it
        const [mapping] = await db.query('SELECT wali_id FROM wali_siswa_mapping WHERE siswa_id = ?', [id]);
        if (mapping.length > 0) {
            const waliId = mapping[0].wali_id;
            await db.query('DELETE FROM users WHERE id = ?', [waliId]);
        }

        // Delete student (will also cascade delete mapping record)
        await db.query('DELETE FROM siswa WHERE id = ?', [id]);

        return res.json({ message: 'siswa deleted successfully.' });
    } catch (err) {
        console.error('Delete siswa error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Get children for logged in Wali siswa
exports.getMyChildren = async (req, res) => {
    try {
        if (req.user.role !== 'wali_siswa') {
            return res.status(403).json({ message: 'Access denied. Wali siswa only.' });
        }

        const query = `
            SELECT s.* 
            FROM siswa s
            JOIN wali_siswa_mapping wsm ON s.id = wsm.siswa_id
            WHERE wsm.wali_id = ?
        `;
        const [rows] = await db.query(query, [req.user.id]);
        return res.json(rows);
    } catch (err) {
        console.error('Get my children error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Get list of all wali users (for dropdown select mapping)
exports.getWaliUsers = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const [rows] = await db.query(
            'SELECT id, username, nama_lengkap, no_hp FROM users WHERE role = "wali_siswa" ORDER BY nama_lengkap ASC'
        );
        return res.json(rows);
    } catch (err) {
        console.error('Get wali users error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Assign wali to siswa
exports.mapWali = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const { siswa_id, wali_id } = req.body;

        if (!siswa_id) {
            return res.status(400).json({ message: 'siswa ID is required.' });
        }

        // Clean mapping for this siswa first (a siswa is typically mapped to one primary wali)
        await db.query('DELETE FROM wali_siswa_mapping WHERE siswa_id = ?', [siswa_id]);

        // If wali_id is provided, insert mapping. If not, it means the siswa has no wali mapping now (unassigned).
        if (wali_id) {
            await db.query(
                'INSERT INTO wali_siswa_mapping (wali_id, siswa_id) VALUES (?, ?)',
                [wali_id, siswa_id]
            );
        }

        return res.json({ message: 'Wali siswa mapping updated successfully.' });
    } catch (err) {
        console.error('Map wali error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
