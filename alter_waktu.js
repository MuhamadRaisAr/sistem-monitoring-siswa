const db = require('./backend/config/db');
async function run() {
    try {
        await db.query('ALTER TABLE kehadiran_siswa ADD COLUMN waktu TIME NULL AFTER tanggal');
        console.log('Column waktu added successfully');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('Column waktu already exists');
        } else {
            console.error('Error:', e.message);
        }
    }
    process.exit();
}
run();
