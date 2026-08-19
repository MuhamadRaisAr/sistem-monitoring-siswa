const db = require('./config/db');

async function run() {
    try {
        await db.query("ALTER TABLE users ADD COLUMN avatar LONGTEXT DEFAULT NULL;");
        console.log("Column avatar added successfully!");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("Column already exists.");
        } else {
            console.error("Error adding column:", e);
        }
    }
    process.exit();
}

run();
