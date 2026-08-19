const db = require('./config/db');

async function run() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS archived_chats (
                id INT AUTO_INCREMENT PRIMARY KEY,
                admin_id INT NOT NULL,
                wali_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_archive (admin_id, wali_id)
            )
        `);
        console.log("Table archived_chats created successfully");
    } catch(err) {
        console.error(err);
    }
    process.exit();
}
run();
