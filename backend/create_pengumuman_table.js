const db = require('./config/db');

async function createTable() {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS pengumuman (
                id INT AUTO_INCREMENT PRIMARY KEY,
                judul VARCHAR(255) NOT NULL,
                isi_pengumuman TEXT NOT NULL,
                tanggal DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await db.query(query);
        console.log("Table 'pengumuman' created successfully.");
        
        // Insert sample data
        const sampleData = [
            ['Ujian Akhir Semester Ganjil', 'Ujian Akhir Semester Ganjil akan dilaksanakan mulai tanggal 15 Desember hingga 22 Desember 2026. Seluruh santri diwajibkan untuk melunasi SPP sebelum tanggal tersebut.', '2026-12-01'],
            ['Libur Nasional Maulid Nabi', 'Kegiatan belajar mengajar diliburkan pada tanggal 16 September dalam rangka memperingati Maulid Nabi Muhammad SAW.', '2026-09-10']
        ];
        
        for (const p of sampleData) {
            try {
                // simple insert, avoid duplicates by checking if table is empty
                const [existing] = await db.query('SELECT id FROM pengumuman WHERE judul = ?', [p[0]]);
                if (existing.length === 0) {
                    await db.query('INSERT INTO pengumuman (judul, isi_pengumuman, tanggal) VALUES (?, ?, ?)', [p[0], p[1], p[2]]);
                }
            } catch (err) {
                console.error("Error inserting sample data:", err);
            }
        }
        console.log("Sample data inserted.");
    } catch (err) {
        console.error("Error creating table:", err);
    } finally {
        process.exit();
    }
}

createTable();
