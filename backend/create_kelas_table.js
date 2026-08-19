const db = require('./config/db');

async function createKelasTable() {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS kelas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nama_kelas VARCHAR(50) NOT NULL UNIQUE,
                tingkat VARCHAR(20),
                jurusan VARCHAR(100),
                wali_kelas_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (wali_kelas_id) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `;
        
        await db.query(createTableQuery);
        console.log('Tabel kelas berhasil dibuat.');
        process.exit(0);
    } catch (err) {
        console.error('Error creating table:', err);
        process.exit(1);
    }
}

createKelasTable();
