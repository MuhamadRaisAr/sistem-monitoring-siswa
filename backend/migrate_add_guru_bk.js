const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function migrateGuruBk() {
    console.log('Memulai migrasi untuk menambahkan role Guru BK...');

    try {
        // 1. Ubah ENUM pada kolom role di tabel users
        console.log('Mengubah tipe data ENUM pada tabel users...');
        await db.query(`ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'guru', 'wali_siswa', 'bendahara', 'guru_bk') NOT NULL;`);
        console.log('✅ Kolom role berhasil di-update.');

        // 2. Buat default akun Guru BK
        console.log('Mengecek apakah akun Guru BK sudah ada...');
        const [existing] = await db.query('SELECT * FROM users WHERE username = ?', ['gurubk']);
        
        if (existing.length === 0) {
            console.log('Membuat akun Guru BK default...');
            const hashedPassword = await bcrypt.hash('password123', 10);
            
            await db.query(
                `INSERT INTO users (username, password, nama_lengkap, role, no_hp) VALUES (?, ?, ?, ?, ?)`,
                ['gurubk', hashedPassword, 'Guru Bimbingan Konseling', 'guru_bk', '081234567891']
            );
            console.log('✅ Akun Guru BK berhasil dibuat (username: gurubk, password: password123).');
        } else {
            console.log('ℹ️ Akun Guru BK sudah ada.');
        }

        console.log('🎉 Migrasi selesai!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Terjadi kesalahan saat migrasi:', error);
        process.exit(1);
    }
}

migrateGuruBk();
