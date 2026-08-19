const db = require('./config/db');

async function deleteDummyData() {
    try {
        // Disable foreign key checks for easier deletion
        await db.query('SET FOREIGN_KEY_CHECKS = 0');

        // Delete all data from tables
        await db.query('TRUNCATE TABLE chat_messages');
        await db.query('TRUNCATE TABLE spp_billing');
        await db.query('TRUNCATE TABLE kedisiplinan');
        await db.query('TRUNCATE TABLE kehadiran_siswa');
        await db.query('TRUNCATE TABLE wali_siswa_mapping');
        await db.query('TRUNCATE TABLE jadwal_pelajaran');
        await db.query('TRUNCATE TABLE santri');
        await db.query('TRUNCATE TABLE kelas');

        // Delete all users EXCEPT admin
        await db.query('DELETE FROM users WHERE role != "admin"');

        // Enable foreign key checks
        await db.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log("Semua data dummy berhasil dihapus.");
        process.exit(0);
    } catch (err) {
        console.error("Error deleting data:", err);
        process.exit(1);
    }
}

deleteDummyData();
