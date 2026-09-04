const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateHonor() {
    console.log('Mulai migrasi Honor Guru...');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'monitoring_santri'
    });

    try {
        // 1. Tambah kolom tarif_per_jam ke tabel users
        const [userColumns] = await connection.query(`SHOW COLUMNS FROM users LIKE 'tarif_per_jam'`);
        if (userColumns.length === 0) {
            console.log('Menambahkan kolom tarif_per_jam ke tabel users...');
            await connection.query(`
                ALTER TABLE users 
                ADD COLUMN tarif_per_jam DECIMAL(10,2) DEFAULT 0
            `);
            console.log('Kolom tarif_per_jam berhasil ditambahkan.');
        } else {
            console.log('Kolom tarif_per_jam sudah ada di tabel users.');
        }

        // 2. Buat tabel honor_guru
        console.log('Membuat tabel honor_guru...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS honor_guru (
                id INT AUTO_INCREMENT PRIMARY KEY,
                guru_id INT NOT NULL,
                tahun_ajaran_id INT NULL,
                bulan INT NOT NULL,
                tahun INT NOT NULL,
                total_jam_mengajar INT DEFAULT 0,
                tarif_per_jam DECIMAL(10,2) DEFAULT 0,
                total_honor DECIMAL(10,2) DEFAULT 0,
                status_pembayaran ENUM('belum_dibayar', 'dibayar') DEFAULT 'belum_dibayar',
                tanggal_bayar DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (guru_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id) ON DELETE SET NULL,
                UNIQUE KEY unique_honor_bulan (guru_id, bulan, tahun)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('Tabel honor_guru berhasil dibuat/diverifikasi.');

        console.log('Migrasi Honor Guru Selesai!');
    } catch (error) {
        console.error('Error saat migrasi honor:', error);
    } finally {
        await connection.end();
    }
}

migrateHonor();
