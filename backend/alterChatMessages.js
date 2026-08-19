const db = require('./config/db');

async function run() {
    try {
        await db.query(`ALTER TABLE chat_messages ADD COLUMN deleted_by_sender TINYINT(1) DEFAULT 0`);
        console.log("Column deleted_by_sender added successfully");
    } catch(err) {
        console.error(err);
    }
    try {
        await db.query(`ALTER TABLE chat_messages ADD COLUMN deleted_by_receiver TINYINT(1) DEFAULT 0`);
        console.log("Column deleted_by_receiver added successfully");
    } catch(err) {
        console.error(err);
    }
    process.exit();
}
run();
