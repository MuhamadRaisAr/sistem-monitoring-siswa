const db = require('./config/db');

async function migrate() {
    try {
        console.log('Memulai migrasi wali_kelas_history...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS wali_kelas_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nama_kelas VARCHAR(50) NOT NULL,
                tahun_ajaran_id INT NOT NULL,
                guru_id INT NOT NULL,
                FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
                FOREIGN KEY (guru_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY uq_kelas_ta (nama_kelas, tahun_ajaran_id)
            )
        `);
        console.log('Tabel wali_kelas_history berhasil dibuat.');

        // Inisialisasi data dari kelas saat ini menggunakan tahun ajaran aktif
        const [taActive] = await db.query('SELECT id FROM tahun_ajaran WHERE is_active = 1');
        if (taActive.length > 0) {
            const taId = taActive[0].id;
            const [classes] = await db.query('SELECT nama_kelas, wali_kelas_id FROM kelas WHERE wali_kelas_id IS NOT NULL');
            console.log(`Menemukan ${classes.length} kelas untuk diinisialisasi.`);
            for (const c of classes) {
                await db.query(
                    'INSERT IGNORE INTO wali_kelas_history (nama_kelas, tahun_ajaran_id, guru_id) VALUES (?, ?, ?)',
                    [c.nama_kelas, taId, c.wali_kelas_id]
                );
            }
            console.log('Inisialisasi riwayat wali kelas awal selesai.');
        } else {
            console.log('Tidak ada Tahun Ajaran aktif ditemukan, inisialisasi awal dilewati.');
        }
        console.log('Migrasi sukses.');
        process.exit(0);
    } catch (err) {
        console.error('Migrasi gagal:', err);
        process.exit(1);
    }
}

migrate();
