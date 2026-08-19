const db = require('./backend/config/db');

async function migrate() {
    try {
        await db.query('ALTER TABLE kedisiplinan ADD COLUMN pelapor_id INT DEFAULT NULL');
        console.log('Column pelapor_id added');
        await db.query('ALTER TABLE kedisiplinan ADD CONSTRAINT fk_kedisiplinan_pelapor FOREIGN KEY (pelapor_id) REFERENCES users(id) ON DELETE SET NULL');
        console.log('Foreign key constraint added');
    } catch (e) {
        console.error('Migration error (it might already exist):', e.message);
    }
    process.exit(0);
}

migrate();
