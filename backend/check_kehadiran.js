const db = require('./config/db');

async function run() {
    try {
        const [rows] = await db.query('SELECT * FROM kehadiran_siswa LIMIT 5');
        console.log("kehadiran_siswa:", rows);
        
        const [jenis] = await db.query('SELECT DISTINCT jenis_kegiatan FROM kehadiran_siswa');
        console.log("jenis_kegiatan:", jenis);
    } catch (error) {
        console.error(error);
    }
    process.exit(0);
}
run();
