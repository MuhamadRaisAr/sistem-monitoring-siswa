const db = require('./config/db');

async function check() {
    try {
        const [rows] = await db.query('SHOW CREATE TABLE nilai_ekskul');
        console.log(rows[0]['Create Table']);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

check();
