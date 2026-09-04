const db = require('./config/db');

async function checkDouble() {
    try {
        const [logs] = await db.query(`
            SELECT id, nama_lengkap, kelas FROM siswa WHERE nama_lengkap LIKE '%AQILA%'
        `);
        console.log(logs);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
checkDouble();
