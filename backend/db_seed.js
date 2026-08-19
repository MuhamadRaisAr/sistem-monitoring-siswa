const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seed() {
    console.log('Connecting to database...');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });

    console.log('Clearing old data...');
    await connection.query('TRUNCATE TABLE chat_messages');
    await connection.query('TRUNCATE TABLE spp_billing');
    await connection.query('TRUNCATE TABLE kedisiplinan');
    await connection.query('TRUNCATE TABLE kehadiran_siswa');
    await connection.query('TRUNCATE TABLE jadwal_pelajaran');
    await connection.query('TRUNCATE TABLE nilai_siswa');
    await connection.query('TRUNCATE TABLE wali_siswa_mapping');
    await connection.query('TRUNCATE TABLE santri');
    await connection.query('TRUNCATE TABLE users');
    await connection.query('TRUNCATE TABLE tahun_ajaran');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('Seeding tahun ajaran...');
    const [ta1] = await connection.query(
        'INSERT INTO tahun_ajaran (nama_tahun, semester, is_active) VALUES (?, ?, ?)',
        ['2023/2024', 'Ganjil', 1]
    );
    const tahunAjaranId = ta1.insertId;

    console.log('Seeding users...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // Insert Admin
    const [adminResult] = await connection.query(
        'INSERT INTO users (username, password, nama_lengkap, role, no_hp) VALUES (?, ?, ?, ?, ?)',
        ['admin', passwordHash, 'Ustadz Ahmad Mudakir (Admin)', 'admin', '081234567890']
    );
    const adminId = adminResult.insertId;

    // Insert Bendahara
    const [bendaharaResult] = await connection.query(
        'INSERT INTO users (username, password, nama_lengkap, role, no_hp) VALUES (?, ?, ?, ?, ?)',
        ['bendahara', passwordHash, 'Ustadz Hasan (Bendahara)', 'bendahara', '081234567891']
    );
    const bendaharaId = bendaharaResult.insertId;

    // Insert Guru
    const [guruResult] = await connection.query(
        'INSERT INTO users (username, password, nama_lengkap, role, no_hp) VALUES (?, ?, ?, ?, ?)',
        ['guru1', passwordHash, 'Ustadz Budi (Guru)', 'guru', '081111222333']
    );
    const guruId = guruResult.insertId;

    // Insert Wali Siswa for Ahmad Fauzi (NIS 100201)
    const [wali1Result] = await connection.query(
        'INSERT INTO users (username, password, nama_lengkap, role, no_hp) VALUES (?, ?, ?, ?, ?)',
        ['100201', passwordHash, 'Bpk. Hendra Wijaya (Wali Ahmad)', 'wali_siswa', '082345678901']
    );
    const wali1Id = wali1Result.insertId;

    // Insert Wali Siswa for Siti Aminah (NIS 100202)
    const [wali2Result] = await connection.query(
        'INSERT INTO users (username, password, nama_lengkap, role, no_hp) VALUES (?, ?, ?, ?, ?)',
        ['100202', passwordHash, 'Ibu Aminah (Wali Siti)', 'wali_siswa', '082345678902']
    );
    const wali2Id = wali2Result.insertId;

    // Insert Wali Siswa for M. Rizky Pratama (NIS 100203)
    const [wali3Result] = await connection.query(
        'INSERT INTO users (username, password, nama_lengkap, role, no_hp) VALUES (?, ?, ?, ?, ?)',
        ['100203', passwordHash, 'Ibu Siti Khadijah (Wali Rizky)', 'wali_siswa', '083456789012']
    );
    const wali3Id = wali3Result.insertId;

    // Insert Wali Siswa for Yusuf Halim (NIS 100204)
    const [wali4Result] = await connection.query(
        'INSERT INTO users (username, password, nama_lengkap, role, no_hp) VALUES (?, ?, ?, ?, ?)',
        ['100204', passwordHash, 'Bpk. Yusuf (Wali Halim)', 'wali_siswa', '083456789014']
    );
    const wali4Id = wali4Result.insertId;

    console.log('Seeding santri...');
    // Santri
    const [s1] = await connection.query(
        'INSERT INTO santri (nis, nama_lengkap, kelas, asrama, status_aktif) VALUES (?, ?, ?, ?, ?)',
        ['100201', 'Ahmad Fauzi', '10-A', 'Asrama Al-Azhar', 'aktif']
    );
    const [s2] = await connection.query(
        'INSERT INTO santri (nis, nama_lengkap, kelas, asrama, status_aktif) VALUES (?, ?, ?, ?, ?)',
        ['100202', 'Siti Aminah', '11-B', 'Asrama Fatimah', 'aktif']
    );
    const [s3] = await connection.query(
        'INSERT INTO santri (nis, nama_lengkap, kelas, asrama, status_aktif) VALUES (?, ?, ?, ?, ?)',
        ['100203', 'M. Rizky Pratama', '12-C', 'Asrama Cordoba', 'aktif']
    );
    const [s4] = await connection.query(
        'INSERT INTO santri (nis, nama_lengkap, kelas, asrama, status_aktif) VALUES (?, ?, ?, ?, ?)',
        ['100204', 'Yusuf Halim', '10-A', 'Asrama Al-Azhar', 'aktif']
    );

    console.log('Seeding wali siswa mappings...');
    await connection.query('INSERT INTO wali_siswa_mapping (wali_id, santri_id) VALUES (?, ?)', [wali1Id, s1.insertId]);
    await connection.query('INSERT INTO wali_siswa_mapping (wali_id, santri_id) VALUES (?, ?)', [wali2Id, s2.insertId]);
    await connection.query('INSERT INTO wali_siswa_mapping (wali_id, santri_id) VALUES (?, ?)', [wali3Id, s3.insertId]);
    await connection.query('INSERT INTO wali_siswa_mapping (wali_id, santri_id) VALUES (?, ?)', [wali4Id, s4.insertId]);

    console.log('Seeding kehadiran siswa...');
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().slice(0, 10);

    // Ahmad Fauzi (s1)
    await connection.query(
        'INSERT INTO kehadiran_siswa (santri_id, tahun_ajaran_id, jenis_kegiatan, deskripsi, tanggal, kehadiran) VALUES (?, ?, ?, ?, ?, ?)',
        [s1.insertId, tahunAjaranId, 'Madrasah', 'Pelajaran Fiqih', today, 'hadir']
    );
    await connection.query(
        'INSERT INTO kehadiran_siswa (santri_id, tahun_ajaran_id, jenis_kegiatan, deskripsi, tanggal, kehadiran) VALUES (?, ?, ?, ?, ?, ?)',
        [s1.insertId, tahunAjaranId, 'Pengajian Kitab', 'Kitab Nashaihul Ibad', yesterday, 'hadir']
    );
    await connection.query(
        'INSERT INTO kehadiran_siswa (santri_id, tahun_ajaran_id, jenis_kegiatan, deskripsi, tanggal, kehadiran) VALUES (?, ?, ?, ?, ?, ?)',
        [s1.insertId, tahunAjaranId, 'Madrasah', 'Izin menjenguk nenek sakit', twoDaysAgo, 'izin']
    );

    // Siti Aminah (s2)
    await connection.query(
        'INSERT INTO kehadiran_siswa (santri_id, tahun_ajaran_id, jenis_kegiatan, deskripsi, tanggal, kehadiran) VALUES (?, ?, ?, ?, ?, ?)',
        [s2.insertId, tahunAjaranId, 'Madrasah', 'Ujian Nahwu Shorof', today, 'hadir']
    );
    await connection.query(
        'INSERT INTO kehadiran_siswa (santri_id, tahun_ajaran_id, jenis_kegiatan, deskripsi, tanggal, kehadiran) VALUES (?, ?, ?, ?, ?, ?)',
        [s2.insertId, tahunAjaranId, 'Pengajian Kitab', 'Sakit demam', yesterday, 'sakit']
    );

    // M. Rizky (s3)
    await connection.query(
        'INSERT INTO kehadiran_siswa (santri_id, tahun_ajaran_id, jenis_kegiatan, deskripsi, tanggal, kehadiran) VALUES (?, ?, ?, ?, ?, ?)',
        [s3.insertId, tahunAjaranId, 'Madrasah', 'Pelajaran Hadits Arbain', today, 'hadir']
    );

    // Yusuf Halim (s4)
    await connection.query(
        'INSERT INTO kehadiran_siswa (santri_id, tahun_ajaran_id, jenis_kegiatan, deskripsi, tanggal, kehadiran) VALUES (?, ?, ?, ?, ?, ?)',
        [s4.insertId, tahunAjaranId, 'Madrasah', 'Alpa / Tanpa keterangan', today, 'alpa']
    );

    console.log('Seeding kedisiplinan (violations & permissions)...');
    // Ahmad Fauzi (s1)
    await connection.query(
        'INSERT INTO kedisiplinan (santri_id, tahun_ajaran_id, kategori, nama_kegiatan, poin_pelanggaran, tanggal_kejadian, status_izin) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [s1.insertId, tahunAjaranId, 'pelanggaran', 'Terlambat masuk kelas madrasah', 5, yesterday, 'disetujui']
    );
    await connection.query(
        'INSERT INTO kedisiplinan (santri_id, tahun_ajaran_id, kategori, nama_kegiatan, poin_pelanggaran, tanggal_kejadian, status_izin) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [s1.insertId, tahunAjaranId, 'perizinan', 'Izin pulang untuk pernikahan kakak kandung', 0, today, 'diajukan']
    );

    // M. Rizky (s3)
    await connection.query(
        'INSERT INTO kedisiplinan (santri_id, tahun_ajaran_id, kategori, nama_kegiatan, poin_pelanggaran, tanggal_kejadian, status_izin) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [s3.insertId, tahunAjaranId, 'pelanggaran', 'Membawa smartphone ke asrama', 50, twoDaysAgo, 'disetujui']
    );
    await connection.query(
        'INSERT INTO kedisiplinan (santri_id, tahun_ajaran_id, kategori, nama_kegiatan, poin_pelanggaran, tanggal_kejadian, status_izin) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [s3.insertId, tahunAjaranId, 'perizinan', 'Izin keluar untuk berobat ke dokter gigi', 0, yesterday, 'kembali']
    );



    console.log('Seeding keuangan (SPP billing)...');
    // June 2026 (Unpaid)
    await connection.query(
        'INSERT INTO spp_billing (santri_id, tahun_ajaran_id, bulan, tahun, nominal, status_bayar, tanggal_bayar) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [s1.insertId, tahunAjaranId, 6, 2026, 350000.00, 'belum_lunas', null]
    );
    await connection.query(
        'INSERT INTO spp_billing (santri_id, tahun_ajaran_id, bulan, tahun, nominal, status_bayar, tanggal_bayar) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [s2.insertId, tahunAjaranId, 6, 2026, 350000.00, 'belum_lunas', null]
    );
    await connection.query(
        'INSERT INTO spp_billing (santri_id, tahun_ajaran_id, bulan, tahun, nominal, status_bayar, tanggal_bayar) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [s3.insertId, tahunAjaranId, 6, 2026, 350000.00, 'belum_lunas', null]
    );
    await connection.query(
        'INSERT INTO spp_billing (santri_id, tahun_ajaran_id, bulan, tahun, nominal, status_bayar, tanggal_bayar) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [s4.insertId, tahunAjaranId, 6, 2026, 350000.00, 'belum_lunas', null]
    );

    // May 2026 (Paid)
    await connection.query(
        'INSERT INTO spp_billing (santri_id, tahun_ajaran_id, bulan, tahun, nominal, status_bayar, tanggal_bayar) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [s1.insertId, tahunAjaranId, 5, 2026, 350000.00, 'lunas', '2026-05-05']
    );
    await connection.query(
        'INSERT INTO spp_billing (santri_id, tahun_ajaran_id, bulan, tahun, nominal, status_bayar, tanggal_bayar) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [s2.insertId, tahunAjaranId, 5, 2026, 350000.00, 'lunas', '2026-05-04']
    );
    await connection.query(
        'INSERT INTO spp_billing (santri_id, tahun_ajaran_id, bulan, tahun, nominal, status_bayar, tanggal_bayar) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [s3.insertId, tahunAjaranId, 5, 2026, 350000.00, 'lunas', '2026-05-10']
    );

    console.log('Seeding chat messages...');
    await connection.query(
        'INSERT INTO chat_messages (sender_id, receiver_id, message, is_read) VALUES (?, ?, ?, ?)',
        [wali1Id, adminId, 'Assalamualaikum warahmatullah. Ustadz, bagaimana perkembangan hafalan Ahmad Fauzi minggu ini?', true]
    );
    await connection.query(
        'INSERT INTO chat_messages (sender_id, receiver_id, message, is_read) VALUES (?, ?, ?, ?)',
        [adminId, wali1Id, 'Waalaikumsalam warahmatullah. Alhamdulillah bapak, ananda Ahmad hafalan Al-Mulk nya lancar, hari ini menyetor 10 ayat dengan tajwid yang baik.', true]
    );
    await connection.query(
        'INSERT INTO chat_messages (sender_id, receiver_id, message, is_read) VALUES (?, ?, ?, ?)',
        [wali1Id, adminId, 'Alhamdulillah terima kasih infonya ustadz. Dan untuk izin pulang besok apakah sudah disetujui?', false]
    );

    console.log('Database seeding successfully completed.');
    await connection.end();
}

seed().catch(err => {
    console.error('Error seeding database:', err);
    process.exit(1);
});
