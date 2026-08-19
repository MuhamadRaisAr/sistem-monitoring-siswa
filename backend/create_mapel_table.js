const db = require('./config/db');

async function createTable() {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS mata_pelajaran (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nama_pelajaran VARCHAR(100) NOT NULL UNIQUE
            );
        `;
        await db.query(query);
        console.log("Table 'mata_pelajaran' created successfully.");
        
        // Insert sample data
        const sampleData = [
            ['Matematika'],
            ['Bahasa Indonesia'],
            ['Bahasa Inggris'],
            ['IPA'],
            ['IPS'],
            ['Pendidikan Agama Islam']
        ];
        
        for (const mapel of sampleData) {
            try {
                await db.query('INSERT IGNORE INTO mata_pelajaran (nama_pelajaran) VALUES (?)', [mapel[0]]);
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
