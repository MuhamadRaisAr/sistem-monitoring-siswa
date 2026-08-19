const db = require('./config/db');

async function testInsert() {
    try {
        const insertQuery = `
            INSERT INTO nilai_ekskul (siswa_id, ekskul_id, tahun_ajaran_id, predikat, keterangan)
            VALUES (?, ?, ?, ?, ?)
        `;
        // Use ID 1 for siswa, ekskul, tahun_ajaran - Assuming they exist or will throw FK error instead
        const [result] = await db.query(insertQuery, [1, 1, 1, 'Sangat Baik', 'Test']);
        console.log('Inserted:', result);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

testInsert();
