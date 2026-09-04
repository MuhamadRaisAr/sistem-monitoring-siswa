const db = require('./config/db');

async function run() {
    try {
        const query = `
            SELECT 
                u.id as guru_id, 
                u.nama_lengkap, 
                (
                    SELECT COUNT(DISTINCT k.tanggal, s.kelas)
                    FROM kehadiran_siswa k
                    JOIN siswa s ON k.siswa_id = s.id
                    JOIN jadwal_pelajaran j ON k.jenis_kegiatan = j.mata_pelajaran AND (s.kelas = j.kelas OR s.kelas LIKE CONCAT(j.kelas, ' %'))
                    WHERE j.guru_id = u.id 
                      AND MONTH(k.tanggal) = ? 
                      AND YEAR(k.tanggal) = ?
                ) as computed_pertemuan
            FROM users u
            WHERE u.role = 'guru'
            ORDER BY u.nama_lengkap ASC
            LIMIT 5
        `;
        const [rows] = await db.query(query, [8, 2026]);
        console.log("August:", rows.map(r => `${r.nama_lengkap}: ${r.computed_pertemuan}`));
        
        const [rowsSept] = await db.query(query, [9, 2026]);
        console.log("September:", rowsSept.map(r => `${r.nama_lengkap}: ${r.computed_pertemuan}`));
    } catch (error) {
        console.error(error);
    }
}
run().then(() => process.exit(0));
