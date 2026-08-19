const db = require('./config/db');

async function cleanOldAkademik() {
    try {
        console.log('Menghapus semua data lama...');
        await db.query("DELETE FROM nilai_siswa");
        await db.query("DELETE FROM kehadiran_siswa");
        await db.query("DELETE FROM kedisiplinan");
        console.log(`Berhasil menghapus data lama.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

cleanOldAkademik();
