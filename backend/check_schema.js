const db = require('./config/db');

async function run() {
    try {
        const [tables] = await db.query('SHOW TABLES');
        console.log(tables);
        
        const [cols] = await db.query('SHOW COLUMNS FROM kehadiran_siswa');
        console.log("kehadiran_siswa columns:", cols.map(c => c.Field).join(', '));
        
        const [jadwalCols] = await db.query('SHOW COLUMNS FROM jadwal_pelajaran').catch(() => [[{Field: 'Not found'}]]);
        console.log("jadwal_pelajaran columns:", jadwalCols.map(c => c.Field).join(', '));
    } catch (error) {
        console.error(error);
    }
    process.exit(0);
}
run();
