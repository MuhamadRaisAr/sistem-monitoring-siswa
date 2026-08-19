const mysql = require('mysql2/promise');
require('dotenv').config();

async function createJadwalTable() {
    try {
        const db = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || 'root',
            database: process.env.DB_NAME || 'monitoring_santri'
        });

        console.log('Connected to the database.');

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS jadwal_pelajaran (
                id INT AUTO_INCREMENT PRIMARY KEY,
                hari ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu') NOT NULL,
                jam_mulai TIME NOT NULL,
                jam_selesai TIME NOT NULL,
                mata_pelajaran VARCHAR(255) NOT NULL,
                kelas VARCHAR(50) NOT NULL,
                guru_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (guru_id) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `;

        await db.query(createTableQuery);
        console.log('Tabel jadwal_pelajaran berhasil dibuat atau sudah ada.');
        
        await db.end();
    } catch (err) {
        console.error('Error creating table:', err);
    }
}

createJadwalTable();
