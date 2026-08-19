const db = require('./config/db');
async function run() {
    try {
        await db.query('ALTER TABLE push_subscriptions CHANGE wali_id user_id INT NOT NULL');
        console.log('Altered table push_subscriptions');
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
