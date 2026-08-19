const db = require('./config/db');

async function run() {
    try {
        await db.query("ALTER TABLE nilai_ekskul MODIFY predikat ENUM('Sangat Baik', 'Baik', 'Cukup', 'Kurang') NULL DEFAULT NULL;");
        console.log("ALTER TABLE SUCCESS");
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

run();
