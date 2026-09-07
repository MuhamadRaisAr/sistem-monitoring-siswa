const mysql = require('mysql2/promise');
async function check() {
    const db = await mysql.createConnection({
        host: 'localhost', user: 'root', password: 'root',
        database: 'monitoring_santri'
    });

    // Cek kolom tabel siswa
    const [cols] = await db.query('SHOW COLUMNS FROM siswa');
    console.log('Kolom siswa:', cols.map(c => c.Field).join(', '));

    // Cek kolom wali_siswa_mapping
    const [mc] = await db.query('SHOW COLUMNS FROM wali_siswa_mapping');
    console.log('Kolom wali_siswa_mapping:', mc.map(c => c.Field).join(', '));

    // Cek tahun_ajaran aktif
    const [ta] = await db.query('SELECT id FROM tahun_ajaran WHERE is_active = 1');
    console.log('Tahun ajaran aktif:', JSON.stringify(ta));

    const targetTaId = ta.length > 0 ? ta[0].id : 0;

    // Coba query utama getAllsiswa
    try {
        const [rows] = await db.query(`
            SELECT s.*, u.nama_lengkap AS nama_wali, u.no_hp, u.id AS wali_id,
                   w.nama_lengkap AS nama_wali_kelas
            FROM siswa s
            LEFT JOIN wali_siswa_mapping wsm ON s.id = wsm.siswa_id
            LEFT JOIN users u ON wsm.wali_id = u.id AND u.role = 'wali_siswa'
            LEFT JOIN wali_kelas_history wkh ON s.kelas = wkh.nama_kelas AND wkh.tahun_ajaran_id = ?
            LEFT JOIN users w ON wkh.guru_id = w.id
            ORDER BY s.nama_lengkap ASC
        `, [targetTaId]);
        console.log('QUERY OK, jumlah rows:', rows.length);
    } catch(e) {
        console.error('QUERY ERROR:', e.message);
        console.error('SQL State:', e.sqlState);
    }

    await db.end();
}
check().catch(e => console.error('ERR:', e.message));
