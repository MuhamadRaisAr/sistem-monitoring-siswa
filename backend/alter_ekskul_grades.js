const db = require('./config/db');

async function alterTable() {
    try {
        // Change to VARCHAR first to avoid truncation errors
        await db.query("ALTER TABLE nilai_ekskul MODIFY predikat VARCHAR(50);");
        
        // Update existing values
        await db.query("UPDATE nilai_ekskul SET predikat = 'A' WHERE predikat = 'Sangat Baik';");
        await db.query("UPDATE nilai_ekskul SET predikat = 'B' WHERE predikat = 'Baik';");
        await db.query("UPDATE nilai_ekskul SET predikat = 'C' WHERE predikat = 'Cukup';");
        await db.query("UPDATE nilai_ekskul SET predikat = 'D' WHERE predikat = 'Kurang';");
        
        // Change to new ENUM
        await db.query("ALTER TABLE nilai_ekskul MODIFY predikat ENUM('A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'E') NULL DEFAULT NULL;");
        console.log('ALTER TABLE SUCCESS');
    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        process.exit();
    }
}

alterTable();
