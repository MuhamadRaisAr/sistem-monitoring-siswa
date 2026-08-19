const db = require('./config/db');

async function migrate() {
    try {
        console.log('Adding bukti_bayar column...');
        try {
            await db.query('ALTER TABLE spp_billing ADD COLUMN bukti_bayar VARCHAR(255) DEFAULT NULL');
            console.log('Added bukti_bayar column successfully.');
        } catch (e) {
            console.log('Column bukti_bayar might already exist or error:', e.message);
        }

        console.log('Modifying status_bayar enum...');
        try {
            await db.query(`ALTER TABLE spp_billing MODIFY COLUMN status_bayar ENUM('belum_lunas', 'menunggu_verifikasi', 'lunas') DEFAULT 'belum_lunas'`);
            console.log('Modified status_bayar enum successfully.');
        } catch (e) {
            console.log('Error modifying status_bayar:', e.message);
        }

        console.log('Migration done.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

migrate();
