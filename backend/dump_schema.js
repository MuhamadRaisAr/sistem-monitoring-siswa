const db = require('./config/db');

async function run() {
    try {
        const [tables] = await db.query('SHOW TABLES');
        for (const row of tables) {
            const tableName = Object.values(row)[0];
            console.log(`\n--- TABLE: ${tableName} ---`);
            const [cols] = await db.query(`DESCRIBE ${tableName}`);
            console.table(cols);
        }
    } catch(err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
run();
