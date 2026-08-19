const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }

        // Fetch user (Case Sensitive menggunakan BINARY)
        const [rows] = await db.query('SELECT * FROM users WHERE BINARY username = ?', [username]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Username atau password salah.' });
        }

        const user = rows[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Username atau password salah.' });
        }

        // Block login if user (e.g. Guru) is lulus, keluar, or non-aktif
        if (user.status_aktif) {
            const userStatus = user.status_aktif.toLowerCase();
            if (userStatus === 'lulus' || userStatus === 'keluar' || userStatus === 'non-aktif') {
                return res.status(403).json({ 
                    message: `Akses ditolak. Akun Anda saat ini berstatus ${userStatus}.` 
                });
            }
        }

        // If Wali Siswa, check associated student's status
        if (user.role === 'wali_siswa') {
            const [mapping] = await db.query(
                `SELECT s.status_aktif 
                 FROM wali_siswa_mapping wsm 
                 JOIN siswa s ON wsm.siswa_id = s.id 
                 WHERE wsm.wali_id = ?`,
                [user.id]
            );
            
            if (mapping.length > 0) {
                const status = mapping[0].status_aktif.toLowerCase();
                if (status === 'lulus' || status === 'keluar') {
                    return res.status(403).json({ 
                        message: `Akses ditolak. Akun tidak dapat digunakan karena status siswa telah ${status}.` 
                    });
                }
            }
        }

        // Check if guru is wali kelas
        let is_wali_kelas = false;
        let kelas_wali = [];
        if (user.role === 'guru') {
            const [kelasRows] = await db.query('SELECT id, nama_kelas FROM kelas WHERE wali_kelas_id = ?', [user.id]);
            if (kelasRows.length > 0) {
                is_wali_kelas = true;
                kelas_wali = kelasRows;
            }
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, is_wali_kelas },
            process.env.JWT_SECRET || 'monitoring_siswa_secret_key_123',
            { expiresIn: '30d' }
        );

        return res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                nama_lengkap: user.nama_lengkap,
                role: user.role,
                no_hp: user.no_hp,
                avatar: user.avatar,
                kelas_diajar: user.kelas_diajar ? user.kelas_diajar.split(',') : [],
                is_wali_kelas,
                kelas_wali
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getMe = async (req, res) => {
    try {
        // Query fresh data from DB (so nama_lengkap etc. always up-to-date)
        const [rows] = await db.query(
            'SELECT id, username, nama_lengkap, role, no_hp, nip, jenis_kelamin, status_aktif, mapel, avatar, kelas_diajar FROM users WHERE id = ?',
            [req.user.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        let userObj = rows[0];
        
        if (userObj.role === 'guru') {
            userObj.kelas_diajar = userObj.kelas_diajar ? userObj.kelas_diajar.split(',') : [];
            const [kelasRows] = await db.query('SELECT id, nama_kelas FROM kelas WHERE wali_kelas_id = ?', [userObj.id]);
            if (kelasRows.length > 0) {
                userObj.is_wali_kelas = true;
                userObj.kelas_wali = kelasRows;
            } else {
                userObj.is_wali_kelas = false;
                userObj.kelas_wali = [];
            }
        }
        
        return res.json({ user: userObj });
    } catch (err) {
        console.error('GetMe error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.register = async (req, res) => {
    try {
        // Only admin can register new users
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const { username, password, nama_lengkap, role, no_hp, mapel, nip, jenis_kelamin, status_aktif, kelas_diajar, kelas_wali } = req.body;

        // If role is guru, use nip as username
        const finalUsername = (role === 'guru' && !username) ? nip : username;

        if (!finalUsername || !password || !nama_lengkap || !role) {
            return res.status(400).json({ message: 'Username (or No. HP for Guru), password, name, and role are required.' });
        }

        if (!['admin', 'guru', 'wali_siswa', 'bendahara'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role.' });
        }

        // Check duplicate
        const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [finalUsername]);
        if (existing.length > 0) {
            const errorMsg = role === 'guru' || role === 'wali_siswa' ? 'Nomor HP sudah terdaftar.' : 'Username is already taken.';
            return res.status(400).json({ message: errorMsg });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Format kelas_diajar
        const kelasDiajarStr = (kelas_diajar && Array.isArray(kelas_diajar)) ? kelas_diajar.join(',') : null;

        // Insert
        const [result] = await db.query(
            'INSERT INTO users (username, password, nama_lengkap, role, no_hp, mapel, nip, jenis_kelamin, status_aktif, kelas_diajar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [finalUsername, passwordHash, nama_lengkap, role, no_hp || '', role === 'guru' ? (mapel || '') : null, role === 'guru' ? (nip || null) : null, role === 'guru' ? (jenis_kelamin || null) : null, role === 'guru' ? (status_aktif || 'aktif') : 'aktif', role === 'guru' ? kelasDiajarStr : null]
        );
        
        // Update Wali Kelas if provided
        if (role === 'guru' && kelas_wali) {
            await db.query('UPDATE kelas SET wali_kelas_id = ? WHERE nama_kelas = ?', [result.insertId, kelas_wali]);
            
            // Simpan ke wali_kelas_history untuk tahun ajaran aktif
            const [taActive] = await db.query('SELECT id FROM tahun_ajaran WHERE is_active = 1');
            if (taActive.length > 0) {
                await db.query(
                    `INSERT INTO wali_kelas_history (nama_kelas, tahun_ajaran_id, guru_id) 
                     VALUES (?, ?, ?) 
                     ON DUPLICATE KEY UPDATE guru_id = VALUES(guru_id)`,
                    [kelas_wali, taActive[0].id, result.insertId]
                );
            }
        }

        return res.status(201).json({ message: 'User registered successfully.' });
    } catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: 'Old password and new password are required.' });
        }

        // Fetch user password hash
        const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const user = rows[0];

        // Verify current password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Password lama salah.' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        // Update in database
        await db.query('UPDATE users SET password = ? WHERE id = ?', [newPasswordHash, userId]);

        return res.json({ message: 'Password berhasil diubah.' });
    } catch (err) {
        console.error('Change password error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Admin: Get all users
exports.getAllUsers = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }
        const { role } = req.query;

        let query = `
            SELECT 
                u.id, 
                u.username, 
                u.nama_lengkap, 
                u.role, 
                u.no_hp, 
                u.created_at,
                u.mapel,
                u.nip,
                u.jenis_kelamin,
                u.status_aktif,
                u.kelas_diajar,
                (SELECT nama_kelas FROM kelas WHERE wali_kelas_id = u.id LIMIT 1) AS kelas_wali,
                GROUP_CONCAT(s.nama_lengkap ORDER BY s.nama_lengkap ASC SEPARATOR ', ') AS nama_siswa,
                GROUP_CONCAT(s.nis ORDER BY s.nis ASC SEPARATOR ', ') AS nis_siswa
            FROM users u
            LEFT JOIN wali_siswa_mapping wsm ON u.id = wsm.wali_id
            LEFT JOIN siswa s ON wsm.siswa_id = s.id
            GROUP BY u.id
            ORDER BY FIELD(u.role, 'admin', 'bendahara', 'guru_bk', 'guru', 'wali_siswa'), u.nama_lengkap ASC
        `;
        
        const params = [];
        if (role) {
            query = query.replace('GROUP BY u.id', 'WHERE u.role = ? GROUP BY u.id');
            params.push(role);
        }

        const [rows] = await db.query(query, params);
        return res.json(rows);
    } catch (err) {
        console.error('Get all users error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Admin: Reset user password
exports.resetUserPassword = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const { id } = req.params;
        const { newPassword } = req.body;

        const passwordToSet = newPassword || 'password123';
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(passwordToSet, salt);

        await db.query('UPDATE users SET password = ? WHERE id = ?', [passwordHash, id]);
        return res.json({ message: `Password berhasil direset ke "${passwordToSet}".` });
    } catch (err) {
        console.error('Reset password error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Admin: Update user profile and optional password
exports.updateUser = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const { id } = req.params;
        const { username, password, nama_lengkap, role, no_hp, mapel, nip, jenis_kelamin, status_aktif, kelas_diajar, kelas_wali } = req.body;

        // If username is empty, try to use nip or no_hp
        const finalUsername = username || nip || no_hp;

        if (!finalUsername || !nama_lengkap) {
            return res.status(400).json({ message: 'Username/No HP dan nama lengkap wajib diisi.' });
        }

        // Check duplicate username for other users
        const [existing] = await db.query('SELECT id FROM users WHERE username = ? AND id != ?', [finalUsername, id]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Username / Nomor HP sudah digunakan oleh user lain.' });
        }

        let query = 'UPDATE users SET ';
        const params = [];

        if (finalUsername) { query += 'username=?, '; params.push(finalUsername); }
        if (password) { 
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            query += 'password=?, '; params.push(hash); 
        }
        if (nama_lengkap) { query += 'nama_lengkap=?, '; params.push(nama_lengkap); }
        if (role) { query += 'role=?, '; params.push(role); }
        if (no_hp !== undefined) { query += 'no_hp=?, '; params.push(no_hp); }
        if (mapel !== undefined) { query += 'mapel=?, '; params.push(mapel); }
        if (nip !== undefined) { query += 'nip=?, '; params.push(nip); }
        if (jenis_kelamin !== undefined) { query += 'jenis_kelamin=?, '; params.push(jenis_kelamin); }
        if (status_aktif !== undefined) { query += 'status_aktif=?, '; params.push(status_aktif); }
        if (kelas_diajar !== undefined) {
            query += 'kelas_diajar=?, ';
            params.push((kelas_diajar && Array.isArray(kelas_diajar)) ? kelas_diajar.join(',') : null);
        }

        query = query.slice(0, -2);
        query += ' WHERE id=?';
        params.push(id);

        await db.query(query, params);
        
        // Update Wali Kelas if role is guru
        if (role === 'guru') {
            const [taActive] = await db.query('SELECT id FROM tahun_ajaran WHERE is_active = 1');
            if (kelas_wali) {
                // Remove this user from any other class first
                await db.query('UPDATE kelas SET wali_kelas_id = NULL WHERE wali_kelas_id = ?', [id]);
                // Set as wali for the new class
                await db.query('UPDATE kelas SET wali_kelas_id = ? WHERE nama_kelas = ?', [id, kelas_wali]);

                // Sync ke wali_kelas_history
                if (taActive.length > 0) {
                    // Hapus history lama guru ini di TA aktif (jika ada di kelas lain)
                    await db.query('DELETE FROM wali_kelas_history WHERE guru_id = ? AND tahun_ajaran_id = ?', [id, taActive[0].id]);
                    // Daftarkan history baru
                    await db.query(
                        `INSERT INTO wali_kelas_history (nama_kelas, tahun_ajaran_id, guru_id) 
                         VALUES (?, ?, ?) 
                         ON DUPLICATE KEY UPDATE guru_id = VALUES(guru_id)`,
                        [kelas_wali, taActive[0].id, id]
                    );
                }
            } else if (kelas_wali === '') {
                // Explicitly remove from wali kelas
                await db.query('UPDATE kelas SET wali_kelas_id = NULL WHERE wali_kelas_id = ?', [id]);
                if (taActive.length > 0) {
                    await db.query('DELETE FROM wali_kelas_history WHERE guru_id = ? AND tahun_ajaran_id = ?', [id, taActive[0].id]);
                }
            }
        }
        
        // If status becomes non-aktif, lulus, or keluar, remove from jadwal and wali
        if (status_aktif && ['keluar', 'lulus', 'non-aktif'].includes(status_aktif.toLowerCase())) {
            // Remove from wali kelas just in case
            await db.query('UPDATE kelas SET wali_kelas_id = NULL WHERE wali_kelas_id = ?', [id]);
            // Remove from jadwal (set guru_id to NULL)
            await db.query('UPDATE jadwal_pelajaran SET guru_id = NULL WHERE guru_id = ?', [id]);

            const [taActive] = await db.query('SELECT id FROM tahun_ajaran WHERE is_active = 1');
            if (taActive.length > 0) {
                await db.query('DELETE FROM wali_kelas_history WHERE guru_id = ? AND tahun_ajaran_id = ?', [id, taActive[0].id]);
            }
        }

        return res.json({ message: 'User berhasil diperbarui.' });
    } catch (err) {
        console.error('Update user error:', err);
        return res.status(500).json({ message: err.message || 'Internal server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { username, nama_lengkap, no_hp, avatar } = req.body;

        if (!username || !nama_lengkap) {
            return res.status(400).json({ message: 'Username dan nama lengkap wajib diisi.' });
        }

        // Check duplicate username for other users
        const [existing] = await db.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, userId]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Username sudah digunakan oleh user lain.' });
        }

        let query = 'UPDATE users SET username = ?, nama_lengkap = ?, no_hp = ? WHERE id = ?';
        let params = [username, nama_lengkap, no_hp || '', userId];

        if (avatar !== undefined) {
            query = 'UPDATE users SET username = ?, nama_lengkap = ?, no_hp = ?, avatar = ? WHERE id = ?';
            params = [username, nama_lengkap, no_hp || '', avatar, userId];
        }

        await db.query(query, params);

        return res.json({ message: 'Profil berhasil diperbarui.' });
    } catch (err) {
        console.error('Update profile error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const { id } = req.params;
        
        // Prevent deleting oneself
        if (req.user.id === parseInt(id)) {
            return res.status(400).json({ message: 'Tidak dapat menghapus akun Anda sendiri.' });
        }

        await db.query('DELETE FROM users WHERE id = ?', [id]);
        return res.json({ message: 'User berhasil dihapus.' });
    } catch (err) {
        console.error('Delete user error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
