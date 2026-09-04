const db = require('./config/db');

async function migrate() {
    try {
        console.log("Creating surat_peringatan table...");
        
        await db.query(`
            CREATE TABLE IF NOT EXISTS surat_peringatan (
                id INT AUTO_INCREMENT PRIMARY KEY,
                siswa_id INT NOT NULL,
                tahun_ajaran_id INT NOT NULL,
                jenis_sp ENUM('SP 1', 'SP 2', 'SP 3') NOT NULL,
                tanggal_sp DATE NOT NULL,
                keterangan TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
                FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id) ON DELETE CASCADE
            );
        `);
        
        console.log("surat_peringatan table created successfully.");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        process.exit();
    }
}

migrate();
