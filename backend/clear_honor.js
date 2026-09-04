const db = require('./config/db');

async function run() {
    try {
        await db.query('TRUNCATE TABLE honor_guru');
        console.log('Berhasil mengosongkan tabel honor_guru');
    } catch (error) {
        // Fallback to DELETE if TRUNCATE fails due to foreign keys
        try {
            await db.query('DELETE FROM honor_guru');
            console.log('Berhasil menghapus data honor_guru');
        } catch (err) {
            console.error('Gagal menghapus data:', err);
        }
    }
    process.exit(0);
}
run();
