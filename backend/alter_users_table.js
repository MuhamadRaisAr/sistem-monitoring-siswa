const db = require('./config/db');

async function alterTable() {
    try {
        const query = `
            ALTER TABLE users 
            ADD COLUMN nip VARCHAR(50) DEFAULT NULL,
            ADD COLUMN jenis_kelamin ENUM('L', 'P') DEFAULT NULL,
            ADD COLUMN status_aktif ENUM('aktif', 'non-aktif') DEFAULT 'aktif'
        `;
        await db.query(query);
        console.log('Tabel users berhasil diperbarui dengan kolom NIP, jenis_kelamin, dan status_aktif.');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Kolom sudah ada di tabel users, tidak perlu diubah.');
        } else {
            console.error('Error alter table:', err);
        }
    } finally {
        process.exit();
    }
}

alterTable();
