const db = require('./config/db');

async function run() {
    try {
        const [rows] = await db.query('DESCRIBE chat_messages');
        console.table(rows);
    } catch(err) {
        console.error(err);
    }
    process.exit();
}
run();
