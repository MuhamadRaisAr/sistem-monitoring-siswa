const db = require('./config/db');

async function up() {
    try {
        console.log('Creating nilai_ekskul table...');
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS nilai_ekskul (
                id INT AUTO_INCREMENT PRIMARY KEY,
                siswa_id INT NOT NULL,
                ekskul_id INT NOT NULL,
                tahun_ajaran_id INT NOT NULL,
                predikat ENUM('Sangat Baik', 'Baik', 'Cukup', 'Kurang') NULL DEFAULT NULL,
                keterangan TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
                FOREIGN KEY (ekskul_id) REFERENCES ekstrakurikuler(id) ON DELETE CASCADE,
                FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
                UNIQUE KEY unique_siswa_ekskul_ta (siswa_id, ekskul_id, tahun_ajaran_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        await db.query(createTableQuery);
        console.log('Table nilai_ekskul created successfully.');
        
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit();
    }
}

up();
