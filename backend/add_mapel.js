const db = require('./config/db');

async function updateSchema() {
    try {
        await db.query("ALTER TABLE users ADD COLUMN mapel VARCHAR(100) DEFAULT NULL");
        console.log("Column 'mapel' added successfully.");
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Column 'mapel' already exists.");
        } else {
            console.error("Error:", err);
        }
    }
    process.exit(0);
}
updateSchema();
