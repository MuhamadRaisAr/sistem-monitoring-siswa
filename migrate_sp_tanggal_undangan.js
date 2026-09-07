const db = require('./backend/config/db');

async function migrate() {
    try {
        console.log('Adding tanggal_undangan to surat_peringatan table...');
        
        // check if exists
        const [columns] = await db.query("SHOW COLUMNS FROM surat_peringatan LIKE 'tanggal_undangan'");
        if (columns.length === 0) {
            await db.query("ALTER TABLE surat_peringatan ADD COLUMN tanggal_undangan DATE NULL AFTER tanggal_sp");
            console.log('Successfully added tanggal_undangan.');
        } else {
            console.log('tanggal_undangan already exists.');
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

migrate();
