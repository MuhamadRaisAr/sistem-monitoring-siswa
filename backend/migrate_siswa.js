require('dotenv').config();
const mysql = require('mysql2/promise');

async function runMigration() {
    console.log("Menghubungkan ke database...");
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'monitoring_santri'
    });

    try {
        console.log("Memulai migrasi skema database...");

        // 1. Rename table santri to siswa
        console.log("Mempersiapkan rename tabel santri -> siswa...");
        await db.query("RENAME TABLE santri TO siswa;").catch(e => console.log("Tabel siswa mungkin sudah ada atau santri tidak ditemukan: ", e.message));

        // 2. Rename columns in mapping tables
        const tablesToAlter = [
            'wali_siswa_mapping',
            'kehadiran_siswa',
            'kedisiplinan',
            'spp_billing'
        ];

        for (const table of tablesToAlter) {
            console.log(`Mengubah nama kolom santri_id menjadi siswa_id di tabel ${table}...`);
            try {
                // In MySQL 8, RENAME COLUMN works and handles FKs mostly fine.
                await db.query(`ALTER TABLE ${table} RENAME COLUMN santri_id TO siswa_id;`);
            } catch (err) {
                console.log(`Gagal rename kolom di ${table}: ${err.message}. Mencoba CHANGE COLUMN...`);
                try {
                    await db.query(`ALTER TABLE ${table} CHANGE santri_id siswa_id INT NOT NULL;`);
                } catch(e2) {
                     console.log(`Gagal CHANGE COLUMN di ${table}: ${e2.message}`);
                }
            }
        }
        
        console.log("Migrasi database berhasil diselesaikan!");

    } catch (err) {
        console.error("Terjadi kesalahan fatal saat migrasi:", err);
    } finally {
        await db.end();
    }
}

runMigration();
