const db = require('../config/db');
const { notifyParents } = require('../utils/notificationHelper');

// Get SPP bills
exports.getBills = async (req, res) => {
    try {
        const { siswa_id, status_bayar, bulan, tahun, tahun_ajaran_id, kelas } = req.query;

        // Security check for Wali Siswa
        if (req.user.role === 'wali_siswa') {
            if (!siswa_id) {
                return res.status(400).json({ message: 'siswa ID is required for parents.' });
            }
            const [mapping] = await db.query(
                'SELECT id FROM wali_siswa_mapping WHERE wali_id = ? AND siswa_id = ?',
                [req.user.id, siswa_id]
            );
            if (mapping.length === 0) {
                return res.status(403).json({ message: 'Access denied. You can only view your children\'s bills.' });
            }
        }

        let query = `
            SELECT sb.*, s.nama_lengkap AS nama_siswa, s.nis, s.kelas
            FROM spp_billing sb
            JOIN siswa s ON sb.siswa_id = s.id
            WHERE 1=1
        `;
        const params = [];

        if (siswa_id) {
            query += ' AND sb.siswa_id = ?';
            params.push(siswa_id);
        }
        if (status_bayar) {
            query += ' AND sb.status_bayar = ?';
            params.push(status_bayar);
        }
        if (bulan) {
            query += ' AND sb.bulan = ?';
            params.push(bulan);
        }
        if (tahun) {
            query += ' AND sb.tahun = ?';
            params.push(tahun);
        }
        if (tahun_ajaran_id) {
            query += ' AND sb.tahun_ajaran_id = ?';
            params.push(tahun_ajaran_id);
        }
        if (kelas) {
            query += ' AND (s.kelas = ? OR s.kelas LIKE ?)';
            params.push(kelas, kelas + ' (%');
        }

        if (status_bayar === 'lunas' || status_bayar === 'menunggu_validasi' || status_bayar === 'menunggu_verifikasi') {
            query += ' ORDER BY sb.tanggal_bayar DESC, sb.id DESC, s.nama_lengkap ASC';
        } else if (status_bayar === 'belum_lunas') {
            query += ' ORDER BY sb.tahun DESC, sb.bulan DESC, sb.id DESC, s.nama_lengkap ASC';
        } else {
            // Mixed or no status (Semua Tagihan view)
            query += ` ORDER BY 
                CASE 
                    WHEN sb.status_bayar IN ('belum_lunas', 'ditolak') THEN 1 
                    ELSE 2 
                END ASC, 
                sb.tahun DESC, sb.bulan DESC, sb.id DESC, s.nama_lengkap ASC`;
        }

        const [rows] = await db.query(query, params);
        return res.json(rows);
    } catch (err) {
        console.error('Get SPP bills error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Get Rekap Tunggakan SPP
exports.getTunggakan = async (req, res) => {
    try {
        if (req.user.role !== 'bendahara') {
            return res.status(403).json({ message: 'Access denied. Bendahara only.' });
        }

        const { tahun_ajaran_id } = req.query;
        let query = `
            SELECT 
                s.id AS siswa_id, 
                s.nama_lengkap, 
                s.nis, 
                s.kelas,
                COUNT(sb.id) AS jumlah_bulan_nunggak,
                SUM(sb.nominal) AS total_tunggakan
            FROM siswa s
            JOIN spp_billing sb ON s.id = sb.siswa_id
            WHERE sb.status_bayar IN ('belum_lunas', 'ditolak')
        `;
        
        const params = [];
        if (tahun_ajaran_id) {
            query += ' AND sb.tahun_ajaran_id = ?';
            params.push(tahun_ajaran_id);
        }
        
        query += `
            GROUP BY s.id
            ORDER BY s.kelas ASC, s.nama_lengkap ASC
        `;

        const [rows] = await db.query(query, params);
        return res.json(rows);
    } catch (err) {
        console.error('Get tunggakan error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Create a single SPP bill (Admin only)
exports.createBill = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'bendahara') {
            return res.status(403).json({ message: 'Access denied. Admins and Bendahara only.' });
        }

        const { siswa_id, bulan, tahun, nominal, status_bayar, tanggal_bayar, nama_tagihan, tahun_ajaran_id } = req.body;
        if (!siswa_id || !bulan || !tahun || !nominal || !tahun_ajaran_id) {
            return res.status(400).json({ message: 'siswa ID, month, year, tahun ajaran, and nominal amount are required.' });
        }

        // Check if bill already exists for this student, month, year, and nama_tagihan
        const [existing] = await db.query(
            'SELECT id FROM spp_billing WHERE siswa_id = ? AND bulan = ? AND tahun = ? AND IFNULL(nama_tagihan, "") = ? AND tahun_ajaran_id = ?',
            [siswa_id, bulan, tahun, nama_tagihan || '', tahun_ajaran_id]
        );
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Tagihan untuk siswa, bulan, tahun, dan jenis ini sudah ada.' });
        }

        const [result] = await db.query(
            'INSERT INTO spp_billing (siswa_id, tahun_ajaran_id, bulan, tahun, nominal, status_bayar, tanggal_bayar, nama_tagihan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [siswa_id, tahun_ajaran_id, bulan, tahun, nominal, status_bayar || 'belum_lunas', status_bayar === 'lunas' ? (tanggal_bayar || new Date()) : null, nama_tagihan || null]
        );

        // Send Notification
        const [siswaData] = await db.query('SELECT nama_lengkap FROM siswa WHERE id = ?', [siswa_id]);
        const namaSiswa = siswaData[0]?.nama_lengkap || 'Putra/Putri Anda';
        const io = req.app.get('io');
        
        await notifyParents(io, siswa_id, {
            title: 'Tagihan SPP Baru',
            message: `Tagihan baru untuk ${namaSiswa} telah diterbitkan: ${nama_tagihan || 'SPP'} Bulan ${bulan} ${tahun} (Rp ${nominal.toLocaleString('id-ID')}).`,
            type: 'warning',
            url: '/wali_siswa/keuangan'
        });

        return res.status(201).json({ message: 'SPP bill created successfully', id: result.insertId });
    } catch (err) {
        console.error('Create SPP bill error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Bulk generate SPP bills for all active siswa (Admin only)
exports.bulkGenerateBills = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'bendahara') {
            return res.status(403).json({ message: 'Access denied. Admins and Bendahara only.' });
        }

        const { bulan, tahun, nominal, nama_tagihan, target_type, target_value, tahun_ajaran_id } = req.body;
        if (!bulan || !tahun || !nominal || !tahun_ajaran_id) {
            return res.status(400).json({ message: 'Month, year, tahun ajaran, and nominal amount are required.' });
        }

        let query = 'SELECT id, nama_lengkap FROM siswa WHERE status_aktif = "aktif"';
        const params = [];

        if (target_type === 'kelas' && target_value) {
            query += ' AND kelas = ?';
            params.push(target_value);
        } else if (target_type === 'siswa' && target_value) {
            query += ' AND id = ?';
            params.push(target_value);
        }

        // Get active siswa based on target
        const [activesiswa] = await db.query(query, params);
        if (activesiswa.length === 0) {
            return res.json({ message: 'No active siswa found to generate bills for.' });
        }

        const siswaIds = activesiswa.map(s => s.id);
        const [existingBills] = await db.query(
            'SELECT siswa_id FROM spp_billing WHERE bulan = ? AND tahun = ? AND IFNULL(nama_tagihan, "") = ? AND tahun_ajaran_id = ? AND siswa_id IN (?)',
            [bulan, tahun, nama_tagihan || '', tahun_ajaran_id, siswaIds]
        );
        const existingSiswaIds = new Set(existingBills.map(b => b.siswa_id));

        const values = [];
        for (const siswa of activesiswa) {
            if (!existingSiswaIds.has(siswa.id)) {
                values.push([siswa.id, tahun_ajaran_id, bulan, tahun, nominal, 'belum_lunas', nama_tagihan || null]);
            }
        }

        if (values.length > 0) {
            await db.query(
                'INSERT INTO spp_billing (siswa_id, tahun_ajaran_id, bulan, tahun, nominal, status_bayar, nama_tagihan) VALUES ?',
                [values]
            );

            // Send Notifications
            const io = req.app.get('io');
            for (const siswa of activesiswa) {
                if (!existingSiswaIds.has(siswa.id)) {
                    await notifyParents(io, siswa.id, {
                        title: 'Tagihan SPP Baru',
                        message: `Tagihan baru untuk ${siswa.nama_lengkap} telah diterbitkan: ${nama_tagihan || 'SPP'} Bulan ${bulan} ${tahun} (Rp ${nominal.toLocaleString('id-ID')}).`,
                        type: 'warning',
                        url: '/wali_siswa/keuangan'
                    });
                }
            }
        }

        return res.status(201).json({
            message: `Tagihan berhasil dibuat. ${values.length} tagihan baru dibuat.`,
            count: values.length
        });
    } catch (err) {
        console.error('Bulk generate SPP bills error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Pay bill (mark as paid / unpaid) (Admin only)
exports.payBill = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'bendahara') {
            return res.status(403).json({ message: 'Access denied. Admins and Bendahara only.' });
        }

        const { id } = req.params;
        const { status_bayar, tanggal_bayar } = req.body; // status_bayar: 'lunas' or 'belum_lunas'

        if (!['lunas', 'belum_lunas'].includes(status_bayar)) {
            return res.status(400).json({ message: 'Invalid payment status.' });
        }

        let payDate = null;
        if (status_bayar === 'lunas') {
            const [existing] = await db.query('SELECT tanggal_bayar FROM spp_billing WHERE id = ?', [id]);
            const localDate = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' });
            
            // If existing date is exactly midnight (00:00:00) because of old DATE column, we use current time instead
            const existingDateObj = existing[0]?.tanggal_bayar;
            if (existingDateObj && existingDateObj instanceof Date && existingDateObj.getUTCHours() === 17 && existingDateObj.getUTCMinutes() === 0) { 
                // UTC 17:00 is 00:00 WIB
                payDate = localDate;
            } else if (existingDateObj) {
                payDate = new Date(existingDateObj).toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' });
            } else {
                payDate = localDate;
            }
        }

        if (status_bayar === 'belum_lunas') {
            await db.query(
                'UPDATE spp_billing SET status_bayar = ?, tanggal_bayar = ?, bukti_bayar = NULL WHERE id = ?',
                [status_bayar, payDate, id]
            );
        } else {
            await db.query(
                'UPDATE spp_billing SET status_bayar = ?, tanggal_bayar = ? WHERE id = ?',
                [status_bayar, payDate, id]
            );
        }

        return res.json({ message: 'Payment status updated successfully.' });
    } catch (err) {
        console.error('Pay SPP bill error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Upload bukti bayar (Wali siswa)
exports.uploadBuktiBayar = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!req.file) {
            return res.status(400).json({ message: 'Bukti pembayaran tidak ditemukan' });
        }

        const buktiUrl = `/uploads/bukti_bayar/${req.file.filename}`;

        const localDate = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' });

        await db.query(
            'UPDATE spp_billing SET bukti_bayar = ?, status_bayar = ?, tanggal_bayar = ? WHERE id = ?',
            [buktiUrl, 'menunggu_verifikasi', localDate, id]
        );

        return res.json({ message: 'Bukti pembayaran berhasil diupload.', bukti_bayar: buktiUrl });
    } catch (err) {
        console.error('Upload bukti bayar error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Update bill details (Admin only)
exports.updateBill = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'bendahara') {
            return res.status(403).json({ message: 'Access denied. Admins and Bendahara only.' });
        }

        const { id } = req.params;
        const { siswa_id, bulan, tahun, nominal, status_bayar, tanggal_bayar, tahun_ajaran_id } = req.body;

        if (!siswa_id || !bulan || !tahun || !nominal || !status_bayar || !tahun_ajaran_id) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const localDate = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' });
        const payDate = status_bayar === 'lunas' ? (tanggal_bayar || localDate) : null;

        await db.query(
            'UPDATE spp_billing SET siswa_id = ?, tahun_ajaran_id = ?, bulan = ?, tahun = ?, nominal = ?, status_bayar = ?, tanggal_bayar = ? WHERE id = ?',
            [siswa_id, tahun_ajaran_id, bulan, tahun, nominal, status_bayar, payDate, id]
        );

        return res.json({ message: 'SPP bill details updated successfully.' });
    } catch (err) {
        console.error('Update SPP bill error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete SPP bill (Admin only)
exports.deleteBill = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'bendahara') {
            return res.status(403).json({ message: 'Access denied. Admins and Bendahara only.' });
        }

        const { id } = req.params;

        const [rows] = await db.query('SELECT status_bayar FROM spp_billing WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Tagihan tidak ditemukan.' });
        }

        const status = rows[0].status_bayar;
        if (status === 'lunas' || status === 'menunggu_verifikasi') {
            return res.status(400).json({ message: 'Tidak dapat menghapus tagihan yang sudah dibayar atau sedang menunggu verifikasi.' });
        }

        await db.query('DELETE FROM spp_billing WHERE id = ?', [id]);
        return res.json({ message: 'SPP bill deleted successfully.' });
    } catch (err) {
        console.error('Delete SPP bill error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
