const db = require('../config/db');

exports.getAllKelas = async (req, res) => {
    try {
        const query = `
            SELECT k.*, u.nama_lengkap AS wali_kelas_nama
            FROM kelas k
            LEFT JOIN users u ON k.wali_kelas_id = u.id
            ORDER BY k.tingkat ASC, k.nama_kelas ASC
        `;
        const [rows] = await db.query(query);

        // Helper to sort by Roman numerals extracted from nama_kelas
        const romanToInt = (roman) => {
            if (!roman) return 999;
            const romanValues = {
                'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12
            };
            const match = roman.match(/^([IVX]+)/i);
            return match ? (romanValues[match[1].toUpperCase()] || 999) : 999;
        };

        rows.sort((a, b) => romanToInt(a.nama_kelas) - romanToInt(b.nama_kelas));

        return res.json(rows);
    } catch (err) {
        console.error('Get all kelas error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getGuruList = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, nama_lengkap FROM users WHERE role = "guru" ORDER BY nama_lengkap ASC'
        );
        return res.json(rows);
    } catch (err) {
        console.error('Get guru list error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.createKelas = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses ditolak.' });

        const { nama_kelas, wali_kelas_id } = req.body;
        if (!nama_kelas) return res.status(400).json({ message: 'Nama kelas wajib diisi.' });

        // Check duplicate
        const [existing] = await db.query('SELECT id FROM kelas WHERE nama_kelas = ?', [nama_kelas]);
        if (existing.length > 0) return res.status(400).json({ message: 'Nama kelas sudah ada.' });

        await db.query(
            'INSERT INTO kelas (nama_kelas, wali_kelas_id) VALUES (?, ?)',
            [nama_kelas, wali_kelas_id || null]
        );

        // Jika wali kelas diisi, simpan ke wali_kelas_history untuk tahun ajaran aktif
        if (wali_kelas_id) {
            const [taActive] = await db.query('SELECT id FROM tahun_ajaran WHERE is_active = 1');
            if (taActive.length > 0) {
                await db.query(
                    `INSERT INTO wali_kelas_history (nama_kelas, tahun_ajaran_id, guru_id) 
                     VALUES (?, ?, ?) 
                     ON DUPLICATE KEY UPDATE guru_id = VALUES(guru_id)`,
                    [nama_kelas, taActive[0].id, wali_kelas_id]
                );
            }
        }

        return res.status(201).json({ message: 'Kelas berhasil ditambahkan.' });
    } catch (err) {
        console.error('Create kelas error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.updateKelas = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses ditolak.' });

        const { id } = req.params;
        const { nama_kelas, wali_kelas_id } = req.body;
        
        if (!nama_kelas) return res.status(400).json({ message: 'Nama kelas wajib diisi.' });

        // Check duplicate for other records
        const [existing] = await db.query('SELECT id FROM kelas WHERE nama_kelas = ? AND id != ?', [nama_kelas, id]);
        if (existing.length > 0) return res.status(400).json({ message: 'Nama kelas sudah digunakan.' });

        // Get old class name to update siswa and jadwal if changed
        const [oldKelasData] = await db.query('SELECT nama_kelas FROM kelas WHERE id = ?', [id]);
        if (oldKelasData.length === 0) return res.status(404).json({ message: 'Kelas tidak ditemukan.' });
        const oldNamaKelas = oldKelasData[0].nama_kelas;

        await db.query(
            'UPDATE kelas SET nama_kelas = ?, wali_kelas_id = ? WHERE id = ?',
            [nama_kelas, wali_kelas_id || null, id]
        );

        // Sync old name with new name in siswa and jadwal_pelajaran tables to preserve string relationships
        if (oldNamaKelas !== nama_kelas) {
            await db.query('UPDATE siswa SET kelas = ? WHERE kelas = ?', [nama_kelas, oldNamaKelas]);
            await db.query('UPDATE jadwal_pelajaran SET kelas = ? WHERE kelas = ?', [nama_kelas, oldNamaKelas]);
            
            // Sync old name with new name in wali_kelas_history
            await db.query('UPDATE wali_kelas_history SET nama_kelas = ? WHERE nama_kelas = ?', [nama_kelas, oldNamaKelas]);
        }

        // Simpan/update ke wali_kelas_history untuk tahun ajaran aktif
        const [taActive] = await db.query('SELECT id FROM tahun_ajaran WHERE is_active = 1');
        if (taActive.length > 0) {
            if (wali_kelas_id) {
                await db.query(
                    `INSERT INTO wali_kelas_history (nama_kelas, tahun_ajaran_id, guru_id) 
                     VALUES (?, ?, ?) 
                     ON DUPLICATE KEY UPDATE guru_id = VALUES(guru_id)`,
                    [nama_kelas, taActive[0].id, wali_kelas_id]
                );
            } else {
                // Hapus jika wali kelas di-set kosong untuk tahun ajaran aktif
                await db.query(
                    'DELETE FROM wali_kelas_history WHERE nama_kelas = ? AND tahun_ajaran_id = ?',
                    [nama_kelas, taActive[0].id]
                );
            }
        }

        return res.json({ message: 'Kelas berhasil diupdate.' });
    } catch (err) {
        console.error('Update kelas error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deleteKelas = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses ditolak.' });

        const { id } = req.params;
        await db.query('DELETE FROM kelas WHERE id = ?', [id]);
        
        // We will NOT delete students or schedules, their 'kelas' string will just remain as is, 
        // acting as an "archived" class name string. Or we could clear them, but keeping is safer.

        return res.json({ message: 'Kelas berhasil dihapus.' });
    } catch (err) {
        console.error('Delete kelas error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getsiswaByKelas = async (req, res) => {
    try {
        if (!['admin', 'guru_bk'].includes(req.user.role)) return res.status(403).json({ message: 'Akses ditolak.' });

        const { nama_kelas } = req.params;
        const [rows] = await db.query(
            'SELECT * FROM siswa WHERE kelas = ? ORDER BY nama_lengkap ASC',
            [nama_kelas]
        );
        return res.json(rows);
    } catch (err) {
        console.error('Error fetching siswa by kelas:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
