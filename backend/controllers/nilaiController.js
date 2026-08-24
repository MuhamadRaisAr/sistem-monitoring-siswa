const db = require('../config/db');

// Mengambil data nilai (dan daftar siswa)
exports.getNilai = async (req, res) => {
    try {
        const { kelas, mata_pelajaran, semester, tahun_ajaran_id } = req.query;

        if (!kelas || !mata_pelajaran || !semester || !tahun_ajaran_id) {
            return res.status(400).json({ message: 'Missing required filters.' });
        }

        // Ambil data siswa aktif di kelas tersebut
        const [siswa] = await db.query(
            'SELECT id, nama_lengkap, nis FROM siswa WHERE kelas = ? AND status_aktif = "aktif" ORDER BY nama_lengkap ASC',
            [kelas]
        );

        if (siswa.length === 0) {
            return res.json([]);
        }

        const siswaIds = siswa.map(s => s.id);

        // Ambil SEMUA data nilai untuk siswa-siswa tersebut
        const [nilaiList] = await db.query(
            'SELECT * FROM nilai_siswa WHERE siswa_id IN (?) AND mata_pelajaran = ? AND semester = ? AND tahun_ajaran_id = ? AND jenis_nilai IN ("Tugas", "Praktik", "UTS", "UAS")',
            [siswaIds, mata_pelajaran, semester, tahun_ajaran_id]
        );

        // Ambil data absensi harian untuk perhitungan persentase kehadiran
        const [kehadiranList] = await db.query(
            'SELECT siswa_id, kehadiran FROM kehadiran_siswa WHERE siswa_id IN (?) AND jenis_kegiatan = "kehadiran_harian" AND tahun_ajaran_id = ?',
            [siswaIds, tahun_ajaran_id]
        );

        // Gabungkan data siswa dengan nilainya (Tugas, UTS, UAS, Praktik) dan Persentase Kehadiran
        const result = siswa.map(s => {
            const nTugas = nilaiList.find(nl => nl.siswa_id === s.id && nl.jenis_nilai === 'Tugas');
            const nPraktik = nilaiList.find(nl => nl.siswa_id === s.id && nl.jenis_nilai === 'Praktik');
            const nUTS = nilaiList.find(nl => nl.siswa_id === s.id && nl.jenis_nilai === 'UTS');
            const nUAS = nilaiList.find(nl => nl.siswa_id === s.id && nl.jenis_nilai === 'UAS');

            // Hitung persentase kehadiran berdasarkan jumlah riil pertemuan (log harian)
            // Rumus adil: (Total Hadir / Total Pertemuan) * 100
            // Sakit/Izin dihitung sebagai setengah hadir (0.5) agar tidak terlalu menjatuhkan, atau bisa juga 1 (hadir penuh)
            // Disini kita hitung: Hadir Penuh = 1, Izin/Sakit = 0.5, Alpa = 0
            const logAbsen = kehadiranList.filter(k => k.siswa_id === s.id);
            let persenKehadiran = 100;
            
            if (logAbsen.length > 0) {
                const totalPertemuan = logAbsen.length;
                let skorKehadiran = 0;
                
                logAbsen.forEach(log => {
                    if (log.kehadiran === 'hadir') {
                        skorKehadiran += 1;
                    } else if (log.kehadiran === 'izin' || log.kehadiran === 'sakit') {
                        // Kebijakan: Izin/Sakit tidak sepenuhnya alpa, beri bobot setengah atau sesuai kebijakan. 
                        // Kita beri bobot 0.5 (atau bisa 1 jika dianggap tidak mempengaruhi persentase).
                        skorKehadiran += 0.5; 
                    } else {
                        // Alpa = 0
                        skorKehadiran += 0;
                    }
                });
                
                // Menggunakan total pertemuan riil sejauh ini agar saat UTS persentase tetap bisa 100%
                persenKehadiran = (skorKehadiran / totalPertemuan) * 100;
            } else {
                persenKehadiran = 100; // Jika belum ada absen sama sekali, default ke 100%
            }
            
            // Batasi persentase maksimal 100%
            if (persenKehadiran > 100) persenKehadiran = 100;
            
            // Dibulatkan menjadi bilangan bulat terdekat
            persenKehadiran = Math.round(persenKehadiran);

            return {
                siswa_id: s.id,
                nama_lengkap: s.nama_lengkap,
                nis: s.nis,
                UTS: nUTS ? parseFloat(nUTS.nilai).toFixed(2) : '',
                UAS: nUAS ? parseFloat(nUAS.nilai).toFixed(2) : '',
                Tugas: nTugas ? parseFloat(nTugas.nilai).toFixed(2) : '',
                Praktik: nPraktik ? parseFloat(nPraktik.nilai).toFixed(2) : '',
                Kehadiran: persenKehadiran
            };
        });

        return res.json(result);
    } catch (err) {
        console.error('Get nilai error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Menyimpan nilai secara massal
exports.saveNilaiBulk = async (req, res) => {
    try {
        if (!['admin', 'guru'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        const { mata_pelajaran, semester, tahun_ajaran_id, dataNilai } = req.body;

        if (!mata_pelajaran || !semester || !tahun_ajaran_id || !Array.isArray(dataNilai)) {
            return res.status(400).json({ message: 'Invalid payload.' });
        }

        const jenisNilaiList = ['Tugas', 'Praktik', 'UTS', 'UAS'];

        for (const item of dataNilai) {
            const { siswa_id } = item;
            
            for (const jn of jenisNilaiList) {
                const nilaiVal = item[jn];
                // Cek apakah nilai sudah ada
                const [exist] = await db.query(
                    'SELECT id FROM nilai_siswa WHERE siswa_id = ? AND mata_pelajaran = ? AND jenis_nilai = ? AND semester = ? AND tahun_ajaran_id = ?',
                    [siswa_id, mata_pelajaran, jn, semester, tahun_ajaran_id]
                );

                if (nilaiVal === undefined || nilaiVal === null || nilaiVal === '') {
                    // Jika nilai dikosongkan dan data sudah ada di DB, maka HAPUS datanya
                    if (exist.length > 0) {
                        await db.query('DELETE FROM nilai_siswa WHERE id = ?', [exist[0].id]);
                    }
                    continue; // Skip the insert/update
                }

                if (exist.length > 0) {
                    // Update
                    await db.query(
                        'UPDATE nilai_siswa SET nilai = ? WHERE id = ?',
                        [nilaiVal, exist[0].id]
                    );
                } else {
                    // Insert
                    await db.query(
                        'INSERT INTO nilai_siswa (siswa_id, mata_pelajaran, jenis_nilai, nilai, semester, tahun_ajaran_id) VALUES (?, ?, ?, ?, ?, ?)',
                        [siswa_id, mata_pelajaran, jn, nilaiVal, semester, tahun_ajaran_id]
                    );
                }
            }
        }

        return res.json({ message: 'Data nilai berhasil disimpan.' });
    } catch (err) {
        console.error('Save bulk nilai error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Mengambil rekap nilai untuk satu kelas (Cetak Raport/Rekap Kelas)
exports.getRekapKelas = async (req, res) => {
    try {
        const { kelas, semester, tahun_ajaran_id } = req.query;

        if (!kelas || !semester || !tahun_ajaran_id) {
            return res.status(400).json({ message: 'Kelas, semester, dan tahun ajaran diperlukan.' });
        }

        // Ambil data siswa aktif di kelas tersebut
        const [siswa] = await db.query(
            'SELECT id, nama_lengkap, nis FROM siswa WHERE kelas = ? AND status_aktif = "aktif" ORDER BY nama_lengkap ASC',
            [kelas]
        );

        if (siswa.length === 0) {
            return res.json({ mapels: [], data: [] });
        }

        const siswaIds = siswa.map(s => s.id);

        // Ambil SEMUA data nilai untuk siswa-siswa tersebut pada semester ini
        const [nilaiList] = await db.query(
            'SELECT * FROM nilai_siswa WHERE siswa_id IN (?) AND semester = ? AND tahun_ajaran_id = ? AND jenis_nilai IN ("Tugas", "UTS", "UAS", "Praktik")',
            [siswaIds, semester, tahun_ajaran_id]
        );

        // Ambil list mata pelajaran dari jadwal kelas tersebut
        const [jadwalMapels] = await db.query(
            'SELECT DISTINCT mata_pelajaran FROM jadwal_pelajaran WHERE kelas = ? AND tahun_ajaran_id = ?',
            [kelas, tahun_ajaran_id]
        );
        const mapelsFromJadwal = jadwalMapels.map(j => j.mata_pelajaran).filter(Boolean);
        const mapelsFromNilai = [...new Set(nilaiList.map(n => n.mata_pelajaran))].filter(Boolean);

        // Mapel list diambil dari jadwal dan juga dari data nilai yang sudah ada
        const mapels = [...new Set([...mapelsFromJadwal, ...mapelsFromNilai])].sort();

        const result = siswa.map(s => {
            const row = {
                siswa_id: s.id,
                nama_lengkap: s.nama_lengkap,
                nis: s.nis,
                mapel_nilai: {},
                total_nilai: 0,
                rata_rata: 0
            };

            let sumTotal = 0;
            let countMapel = 0;

            mapels.forEach(mp => {
                // Semua nilai siswa untuk mapel ini
                const nMapel = nilaiList.filter(nl => nl.siswa_id === s.id && nl.mata_pelajaran === mp);
                
                const tugasVal = nMapel.find(n => n.jenis_nilai === 'Tugas')?.nilai;
                const utsVal = nMapel.find(n => n.jenis_nilai === 'UTS')?.nilai;
                const uasVal = nMapel.find(n => n.jenis_nilai === 'UAS')?.nilai;
                const praktikVal = nMapel.find(n => n.jenis_nilai === 'Praktik')?.nilai;

                if (nMapel.length > 0) {
                    const totalVal = nMapel.reduce((acc, curr) => acc + parseFloat(curr.nilai), 0);
                    const avgVal = totalVal / nMapel.length; // rata-rata dari semua jenis nilai yang ada
                    row.mapel_nilai[mp] = {
                        tugas: tugasVal ? parseFloat(tugasVal).toFixed(1) : '-',
                        uts: utsVal ? parseFloat(utsVal).toFixed(1) : '-',
                        uas: uasVal ? parseFloat(uasVal).toFixed(1) : '-',
                        praktik: praktikVal ? parseFloat(praktikVal).toFixed(1) : '-',
                        akhir: avgVal.toFixed(1)
                    };
                    sumTotal += avgVal;
                    countMapel++;
                } else {
                    row.mapel_nilai[mp] = {
                        tugas: '-',
                        uts: '-',
                        uas: '-',
                        praktik: '-',
                        akhir: '-'
                    };
                }
            });

            row.total_nilai = Math.round(sumTotal);
            row.rata_rata = countMapel > 0 ? parseFloat((sumTotal / countMapel).toFixed(2)) : 0;
            return row;
        });

        // Pisahkan siswa yang memiliki nilai (total_nilai > 0) dan tidak memiliki nilai (total_nilai === 0)
        const studentsWithGrades = result.filter(r => r.total_nilai > 0);
        const studentsWithoutGrades = result.filter(r => r.total_nilai === 0);

        // Urutkan siswa yang memiliki nilai berdasarkan total_nilai descending
        studentsWithGrades.sort((a, b) => b.total_nilai - a.total_nilai);

        // Berikan peringkat hanya untuk siswa yang memiliki nilai
        studentsWithGrades.forEach((r, idx) => {
            r.peringkat = idx + 1;
        });

        // Set peringkat menjadi '-' untuk siswa yang tidak memiliki nilai
        studentsWithoutGrades.forEach(r => {
            r.peringkat = '-';
        });

        const finalResult = [...studentsWithGrades, ...studentsWithoutGrades];

        return res.json({ mapels, data: finalResult });
    } catch (err) {
        console.error('Get rekap kelas error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Mengambil rekap nilai untuk satu siswa (Orang Tua / Wali Siswa)
exports.getNilaisiswa = async (req, res) => {
    try {
        const { siswa_id } = req.params;
        const { semester, tahun_ajaran_id } = req.query;

        if (!siswa_id || !semester || !tahun_ajaran_id) {
            return res.status(400).json({ message: 'siswa ID, semester, and tahun_ajaran are required.' });
        }

        // Security check for parents
        if (req.user.role === 'wali_siswa') {
            const [mapping] = await db.query(
                'SELECT id FROM wali_siswa_mapping WHERE wali_id = ? AND siswa_id = ?',
                [req.user.id, siswa_id]
            );
            if (mapping.length === 0) {
                return res.status(403).json({ message: "Access denied. You can only view your children's academic records." });
            }
        }

        // Ambil data siswa
        const [siswa] = await db.query(
            'SELECT id, nama_lengkap, nis, kelas FROM siswa WHERE id = ?',
            [siswa_id]
        );

        if (siswa.length === 0) {
            return res.status(404).json({ message: 'siswa not found.' });
        }

        // Ambil data nilai
        const [nilaiList] = await db.query(
            'SELECT mata_pelajaran, jenis_nilai, nilai FROM nilai_siswa WHERE siswa_id = ? AND semester = ? AND tahun_ajaran_id = ? AND jenis_nilai IN ("UTS", "UAS", "Tugas", "Praktik")',
            [siswa_id, semester, tahun_ajaran_id]
        );

        // Ambil data jadwal mapel untuk kelas ini agar semua mapel tampil
        const [jadwalMapels] = await db.query(
            'SELECT DISTINCT mata_pelajaran FROM jadwal_pelajaran WHERE kelas = ? AND tahun_ajaran_id = ?',
            [siswa[0].kelas, tahun_ajaran_id]
        );

        // Hitung rata-rata per mata pelajaran dan simpan rinciannya
        const mapelMap = {};
        
        // Inisialisasi mapelMap dengan SEMUA mapel dari jadwal
        jadwalMapels.forEach(j => {
            if (j.mata_pelajaran) {
                mapelMap[j.mata_pelajaran] = { total: 0, count: 0, rincian: {} };
            }
        });

        nilaiList.forEach(n => {
            // Hanya tampilkan nilai jika mata pelajaran tersebut masih ada di jadwal kelas (aktif)
            if (mapelMap[n.mata_pelajaran]) {
                mapelMap[n.mata_pelajaran].total += parseFloat(n.nilai);
                mapelMap[n.mata_pelajaran].count += 1;
                
                // Simpan rincian nilai berdasarkan jenis_nilai (contoh: Tugas, UTS, UAS, Praktik)
                if (!mapelMap[n.mata_pelajaran].rincian[n.jenis_nilai]) {
                    mapelMap[n.mata_pelajaran].rincian[n.jenis_nilai] = [];
                }
                mapelMap[n.mata_pelajaran].rincian[n.jenis_nilai].push(parseFloat(n.nilai));
            }
        });

        const mapels = [];
        let sumTotal = 0;
        let subjectsWithGradesCount = 0;
        
        for (const [mapel, data] of Object.entries(mapelMap)) {
            const avg = data.count > 0 ? data.total / data.count : 0;
            
            // Hitung rata-rata per jenis nilai jika ada multiple
            const rincianFormatted = {};
            for (const [jenis, arrNilai] of Object.entries(data.rincian)) {
                const totalJenis = arrNilai.reduce((a, b) => a + b, 0);
                rincianFormatted[jenis] = parseFloat((totalJenis / arrNilai.length).toFixed(2));
            }

            mapels.push({
                mata_pelajaran: mapel,
                rata_rata: parseFloat(avg.toFixed(2)),
                rincian: rincianFormatted
            });
            
            if (data.count > 0) {
                sumTotal += avg;
                subjectsWithGradesCount++;
            }
        }

        const rata_rata_keseluruhan = subjectsWithGradesCount > 0 ? parseFloat((sumTotal / subjectsWithGradesCount).toFixed(2)) : 0;

        // Urutkan berdasarkan nama mata pelajaran secara alfabetis (A-Z)
        mapels.sort((a, b) => a.mata_pelajaran.localeCompare(b.mata_pelajaran));

        return res.json({
            siswa: siswa[0],
            semester,
            mapels,
            total_nilai: parseFloat(sumTotal.toFixed(2)),
            rata_rata_keseluruhan
        });

    } catch (err) {
        console.error('Get nilai siswa error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
