const db = require('./backend/config/db');

async function migrate() {
    try {
        await db.query(`ALTER TABLE spp_billing ADD COLUMN nama_tagihan VARCHAR(255) DEFAULT NULL`);
        console.log("Migration successful");
    } catch (e) {
        console.error("Migration failed:", e.message);
    } finally {
        process.exit();
    }
}
migrate();
