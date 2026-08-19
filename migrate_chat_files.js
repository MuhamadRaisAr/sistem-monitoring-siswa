const db = require('./backend/config/db');

async function migrate() {
    try {
        await db.query(`ALTER TABLE chat_messages ADD COLUMN file_url VARCHAR(255) DEFAULT NULL`);
        await db.query(`ALTER TABLE chat_messages ADD COLUMN file_type VARCHAR(50) DEFAULT NULL`);
        await db.query(`ALTER TABLE chat_messages MODIFY COLUMN message TEXT`); // Make sure it can be empty if needed, or we just insert empty string.
        console.log("Migration successful");
    } catch (e) {
        console.error("Migration failed:", e.message);
    } finally {
        process.exit();
    }
}
migrate();
