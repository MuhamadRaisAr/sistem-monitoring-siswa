const db = require('./config/db');

async function createNilaiTable() {
    try {
        console.log('Creating nilai_siswa table...');
        
        await db.query(`
            CREATE TABLE IF NOT EXISTS nilai_siswa (
                id INT AUTO_INCREMENT PRIMARY KEY,
                santri_id INT NOT NULL,
                mata_pelajaran VARCHAR(100) NOT NULL,
                jenis_nilai ENUM('Tugas', 'Ulangan Harian', 'UTS', 'UAS') NOT NULL,
                nilai DECIMAL(5,2) NOT NULL DEFAULT 0,
                semester VARCHAR(50) NOT NULL,
                keterangan TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (santri_id) REFERENCES santri(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log('Table nilai_siswa created successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error creating table:', error);
        process.exit(1);
    }
}

createNilaiTable();
