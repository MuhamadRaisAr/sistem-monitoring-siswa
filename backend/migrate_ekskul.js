const db = require('./config/db');

async function migrate() {
    try {
        console.log('Connecting to database...');
        
        console.log('Creating ekstrakurikuler table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS ekstrakurikuler (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nama_ekskul VARCHAR(100) NOT NULL,
                pembina_id INT,
                deskripsi TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (pembina_id) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('Table ekstrakurikuler created or already exists.');
        
        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit(0);
    }
}

migrate();
