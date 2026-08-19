const db = require('./backend/config/db');

async function test() {
    try {
        const [siswaRows] = await db.query('SELECT id, nama_lengkap, nis FROM siswa WHERE nis = "2" OR id = 2');
        console.log("SISWA INFO:", siswaRows);
        if (siswaRows.length > 0) {
            const [rows] = await db.query('SELECT * FROM nilai_ekskul WHERE siswa_id = ?', [siswaRows[0].id]);
            console.log("NILAI EKSKUL FOR SISWA:", rows);
        }
    } catch(e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
test();
