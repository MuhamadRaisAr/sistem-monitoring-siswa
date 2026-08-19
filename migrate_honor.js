const db = require('./backend/config/db');

async function migrate() {
    try {
        console.log("Adding is_paid to kehadiran_siswa...");
        try {
            await db.query(`ALTER TABLE kehadiran_siswa ADD COLUMN is_paid TINYINT(1) DEFAULT 0`);
            console.log("Column is_paid added.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("Column is_paid already exists.");
            } else {
                throw e;
            }
        }

        console.log("Creating table pembayaran_honor...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS pembayaran_honor (
                id INT AUTO_INCREMENT PRIMARY KEY,
                guru_id INT NOT NULL,
                mapel VARCHAR(255) NOT NULL,
                jumlah_pertemuan INT NOT NULL,
                nominal_per_pertemuan DECIMAL(15,2) NOT NULL,
                total_bayar DECIMAL(15,2) NOT NULL,
                tanggal_bayar DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (guru_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log("Table pembayaran_honor created/exists.");

        console.log("Migration successful");
    } catch (e) {
        console.error("Migration failed:", e.message);
    } finally {
        process.exit();
    }
}
migrate();
