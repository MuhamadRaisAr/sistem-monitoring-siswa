const db = require('./config/db');

async function migrate() {
    try {
        console.log("Adding kelas_diajar column to users table...");
        await db.query(`ALTER TABLE users ADD COLUMN kelas_diajar VARCHAR(255) DEFAULT NULL`);
        console.log("Migration successful!");
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Column kelas_diajar already exists. Skipping.");
        } else {
            console.error("Migration failed:", err);
        }
    } finally {
        process.exit(0);
    }
}

migrate();
