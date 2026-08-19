const db = require('./config/db');

async function migrate() {
    try {
        console.log('Creating tahun_ajaran table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS tahun_ajaran (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nama_tahun VARCHAR(20) NOT NULL,
                semester ENUM('Ganjil', 'Genap') NOT NULL,
                is_active BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Check if there is any active tahun ajaran
        const [existing] = await db.query('SELECT * FROM tahun_ajaran');
        if (existing.length === 0) {
            console.log('Inserting default tahun ajaran...');
            await db.query(`
                INSERT INTO tahun_ajaran (nama_tahun, semester, is_active) 
                VALUES ('2023/2024', 'Ganjil', 1)
            `);
        }

        // Add tahun_ajaran_id to other tables
        const tablesToAlter = [
            'jadwal_pelajaran',
            'nilai_siswa',
            'kehadiran_siswa',
            'kedisiplinan',
            'spp_billing'
        ];

        for (const table of tablesToAlter) {
            try {
                // Check if table exists
                const [checkTable] = await db.query(`SHOW TABLES LIKE '${table}'`);
                if (checkTable.length > 0) {
                    // Check if column exists
                    const [columns] = await db.query(`SHOW COLUMNS FROM ${table} LIKE 'tahun_ajaran_id'`);
                    if (columns.length === 0) {
                        console.log(`Adding tahun_ajaran_id to ${table}...`);
                        await db.query(`
                            ALTER TABLE ${table} 
                            ADD COLUMN tahun_ajaran_id INT NULL,
                            ADD FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id) ON DELETE SET NULL
                        `);
                        // Update existing rows to use the default active tahun ajaran (ID 1)
                        await db.query(`UPDATE ${table} SET tahun_ajaran_id = 1`);
                        console.log(`Success adding to ${table}`);
                    } else {
                        console.log(`${table} already has tahun_ajaran_id.`);
                    }
                } else {
                    console.log(`Table ${table} does not exist! Skipping...`);
                }
            } catch (err) {
                console.error(`Failed to alter table ${table}:`, err.message);
            }
        }
        console.log('Migration completed.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit(0);
    }
}
migrate();
