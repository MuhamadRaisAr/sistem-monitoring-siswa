const mysql = require('mysql2/promise');
require('dotenv').config();

async function createNotifikasiTable() {
    try {
        const db = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || 'root',
            database: process.env.DB_NAME || 'monitoring_santri'
        });

        console.log('Connected to the database.');

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS notifikasi (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                judul VARCHAR(255) NOT NULL,
                pesan TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `;

        await db.query(createTableQuery);
        console.log('Tabel notifikasi berhasil dibuat atau sudah ada.');
        
        await db.end();
    } catch (err) {
        console.error('Error creating table:', err);
    }
}

createNotifikasiTable();
