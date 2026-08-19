const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'monitoring_santri',
    });

    console.log('Connected. Running migration...');

    await conn.execute(`
        ALTER TABLE kegiatan_akademik 
        MODIFY COLUMN jenis_kegiatan 
        ENUM('pengajian_pagi', 'pengajian_sore', 'pengajian_malam', 'ekstrakurikuler', 'kegiatan_lain') 
        NOT NULL
    `);

    console.log('✅ ENUM jenis_kegiatan berhasil diupdate!');
    console.log('   Nilai baru: pengajian_pagi, pengajian_sore, pengajian_malam, ekstrakurikuler, kegiatan_lain');

    await conn.end();
}

migrate().catch(err => {
    console.error('❌ Migration gagal:', err.message);
    process.exit(1);
});
