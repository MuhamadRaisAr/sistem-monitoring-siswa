const db = require('./config/db');

async function run() {
    try {
        console.log("Menambahkan kolom-kolom baru ke tabel siswa (MariaDB/MySQL safe syntax)...");
        
        const alterQueries = [
            `ALTER TABLE siswa ADD COLUMN nisn VARCHAR(20) DEFAULT NULL`,
            `ALTER TABLE siswa ADD COLUMN tempat_lahir VARCHAR(50) DEFAULT NULL`,
            `ALTER TABLE siswa ADD COLUMN tanggal_lahir DATE DEFAULT NULL`,
            `ALTER TABLE siswa ADD COLUMN jenis_kelamin ENUM('L', 'P') DEFAULT NULL`,
            `ALTER TABLE siswa ADD COLUMN agama VARCHAR(20) DEFAULT NULL`,
            `ALTER TABLE siswa ADD COLUMN pendidikan_sebelumnya VARCHAR(100) DEFAULT NULL`,
            `ALTER TABLE siswa ADD COLUMN alamat_siswa TEXT DEFAULT NULL`,
            `ALTER TABLE siswa ADD COLUMN nama_ayah VARCHAR(100) DEFAULT NULL`,
            `ALTER TABLE siswa ADD COLUMN nama_ibu VARCHAR(100) DEFAULT NULL`,
            `ALTER TABLE siswa ADD COLUMN pekerjaan_ayah VARCHAR(50) DEFAULT NULL`,
            `ALTER TABLE siswa ADD COLUMN pekerjaan_ibu VARCHAR(50) DEFAULT NULL`,
            `ALTER TABLE siswa ADD COLUMN jalan_ortu VARCHAR(100) DEFAULT NULL`,
            `ALTER TABLE siswa ADD COLUMN kelurahan_ortu VARCHAR(50) DEFAULT NULL`,
            `ALTER TABLE siswa ADD COLUMN kecamatan_ortu VARCHAR(50) DEFAULT NULL`,
            `ALTER TABLE siswa ADD COLUMN kabupaten_ortu VARCHAR(50) DEFAULT NULL`,
            `ALTER TABLE siswa ADD COLUMN provinsi_ortu VARCHAR(50) DEFAULT NULL`,
            `ALTER TABLE siswa ADD COLUMN pekerjaan_wali VARCHAR(50) DEFAULT NULL`,
            `ALTER TABLE siswa ADD COLUMN alamat_wali TEXT DEFAULT NULL`
        ];

        for (const q of alterQueries) {
            try {
                await db.query(q);
            } catch (err) {
                // Abaikan jika kolom sudah ada
                if (err.code !== 'ER_DUP_FIELDNAME') {
                    console.error("Gagal menjalankan query:", q, err.message);
                }
            }
        }
        
        console.log("Semua kolom berhasil ditambahkan ke tabel siswa.");
    } catch(err) {
        console.error("Kesalahan migrasi:", err);
    }
    process.exit();
}
run();
