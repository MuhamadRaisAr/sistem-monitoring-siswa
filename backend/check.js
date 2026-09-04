const db = require('./config/db');

async function run() {
    const [rows] = await db.query('SELECT * FROM honor_guru');
    console.log(rows);
    await db.query('DELETE FROM honor_guru WHERE total_honor = 0');
    console.log('Deleted 0 honor');
    process.exit(0);
}
run();
