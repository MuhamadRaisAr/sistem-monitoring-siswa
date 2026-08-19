const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function clean() {
    console.log('Menghubungkan ke database untuk pembersihan...');

    // Disable foreign key checks to truncate cleanly
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    
    console.log('Mengosongkan data log chat, tagihan, kesehatan, kedisiplinan, akademik...');
    await db.query('TRUNCATE TABLE chat_messages');
    await db.query('TRUNCATE TABLE spp_billing');
    await db.query('TRUNCATE TABLE kedisiplinan');
    await db.query('TRUNCATE TABLE kehadiran_siswa');
    
    console.log('Mengosongkan pemetaan wali santri...');
    await db.query('TRUNCATE TABLE wali_siswa_mapping');
    
    console.log('Mengosongkan data santri...');
    await db.query('TRUNCATE TABLE santri');
    
    console.log('Mengosongkan semua user...');
    await db.query('TRUNCATE TABLE users');
    
    // Enable foreign key checks back
    await db.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('Membuat ulang akun default Admin...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    await db.query(
        'INSERT INTO users (username, password, nama_lengkap, role, no_hp) VALUES (?, ?, ?, ?, ?)',
        ['admin', passwordHash, 'Ustadz Ahmad Mudakir (Admin)', 'admin', '081234567890']
    );

    console.log('Database berhasil dibersihkan! Hanya tersisa akun Admin.');
    process.exit(0);
}

clean().catch(err => {
    console.error('Gagal membersihkan database:', err);
    process.exit(1);
});
