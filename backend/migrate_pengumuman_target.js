const db = require('./config/db');

async function migrate() {
    try {
        // Check if column already exists
        const [columns] = await db.query("SHOW COLUMNS FROM pengumuman LIKE 'target'");
        if (columns.length === 0) {
            await db.query("ALTER TABLE pengumuman ADD COLUMN target ENUM('semua', 'guru', 'wali_siswa') DEFAULT 'semua' AFTER isi_pengumuman");
            console.log("Successfully added 'target' column to 'pengumuman' table.");
        } else {
            console.log("'target' column already exists in 'pengumuman' table.");
        }
        process.exit(0);
    } catch (err) {
        console.error("Migration error:", err);
        process.exit(1);
    }
}

migrate();
