const db = require('./config/db');

async function run() {
    try {
        await db.query(`UPDATE users SET tarif_per_jam = 0 WHERE role = 'guru'`);
        console.log('Cleared');
    } catch (error) {
        console.error(error);
    }
}
run().then(() => process.exit(0));
