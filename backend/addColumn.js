const db = require('./config/db');

async function run() {
    try {
        await db.query(`ALTER TABLE chat_messages ADD COLUMN is_edited TINYINT(1) DEFAULT 0`);
        console.log("Column added successfully");
    } catch(err) {
        if(err.code === 'ER_DUP_FIELDNAME') {
            console.log("Column already exists");
        } else {
            console.error(err);
        }
    }
    process.exit();
}
run();
