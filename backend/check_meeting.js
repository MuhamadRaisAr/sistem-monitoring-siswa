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
                      AND MONTH(k.tanggal) = 8
                      AND YEAR(k.tanggal) = 2026
                ) as calculated_pertemuan
            FROM users u
            WHERE u.role = 'guru'
            ORDER BY u.nama_lengkap ASC
        `;
        const [rows] = await db.query(query);
        console.log(rows.filter(r => r.calculated_pertemuan > 0));
    } catch (error) {
        console.error(error);
    }
    process.exit(0);
}
run();
