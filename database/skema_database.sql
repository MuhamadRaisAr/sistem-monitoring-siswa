-- Skema Database Sistem Informasi Monitoring Santri
-- Database: monitoring_santri

CREATE DATABASE IF NOT EXISTS monitoring_santri;
USE monitoring_santri;

-- Drop existing tables to ensure schema updates are applied
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS spp_billing;
DROP TABLE IF EXISTS kedisiplinan;
DROP TABLE IF EXISTS nilai_siswa;
DROP TABLE IF EXISTS kehadiran_siswa;
DROP TABLE IF EXISTS jadwal_pelajaran;
DROP TABLE IF EXISTS wali_siswa_mapping;
DROP TABLE IF EXISTS tahun_ajaran;
DROP TABLE IF EXISTS siswa;
DROP TABLE IF EXISTS users;

-- 0. Tabel Tahun Ajaran
CREATE TABLE IF NOT EXISTS tahun_ajaran (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_tahun VARCHAR(20) NOT NULL,
    semester ENUM('Ganjil', 'Genap') NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



-- 1. Tabel Users (Untuk Admin Pesantren dan Wali Siswa)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nama_lengkap VARCHAR(100) NOT NULL,
    role ENUM('admin', 'guru', 'wali_siswa', 'bendahara') NOT NULL,
    no_hp VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabel Siswa (Data siswa yang dimonitoring)
CREATE TABLE IF NOT EXISTS siswa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nis VARCHAR(20) NOT NULL UNIQUE,
    nama_lengkap VARCHAR(100) NOT NULL,
    kelas VARCHAR(20) NOT NULL,
    asrama VARCHAR(50) NOT NULL,
    status_aktif ENUM('aktif', 'lulus', 'keluar') DEFAULT 'aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabel Relasi Wali Siswa (Menghubungkan user wali_siswa dengan siswa)
CREATE TABLE IF NOT EXISTS wali_siswa_mapping (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wali_id INT NOT NULL,
    siswa_id INT NOT NULL,
    FOREIGN KEY (wali_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabel Kehadiran Siswa (Menggantikan Kegiatan Akademik)
CREATE TABLE IF NOT EXISTS kehadiran_siswa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siswa_id INT NOT NULL,
    tahun_ajaran_id INT NULL,
    jenis_kegiatan VARCHAR(100) NOT NULL, -- Contoh: Pengajian, Sekolah
    deskripsi TEXT, -- Catatan tambahan
    tanggal DATE NOT NULL,
    kehadiran ENUM('hadir', 'izin', 'sakit', 'alpa') DEFAULT 'hadir',
    bukti_foto VARCHAR(255), -- Path penyimpanan foto absensi
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
    FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Tabel Kedisiplinan (Pelanggaran & Perizinan Keluar Asrama)
CREATE TABLE IF NOT EXISTS kedisiplinan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siswa_id INT NOT NULL,
    tahun_ajaran_id INT NULL,
    kategori ENUM('pelanggaran', 'perizinan') NOT NULL,
    nama_kegiatan VARCHAR(100) NOT NULL, -- Nama pelanggaran atau alasan izin keluar
    poin_pelanggaran INT DEFAULT 0, -- Poin minus jika pelanggaran
    tanggal_kejadian DATE NOT NULL,
    status_izin ENUM('diajukan', 'disetujui', 'ditolak', 'kembali') DEFAULT 'disetujui', -- Khusus perizinan
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
    FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



-- 7. Tabel Tagihan SPP (Rekapitulasi Keuangan Bulanan)
CREATE TABLE IF NOT EXISTS spp_billing (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siswa_id INT NOT NULL,
    tahun_ajaran_id INT NULL,
    bulan INT NOT NULL, -- 1 s/d 12
    tahun INT NOT NULL,
    nama_tagihan VARCHAR(255) DEFAULT NULL,
    nominal DECIMAL(10,2) NOT NULL,
    status_bayar ENUM('belum_lunas', 'lunas') DEFAULT 'belum_lunas',
    tanggal_bayar DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
    FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Tabel Chat Messages (Komunikasi Real-time Wali Siswa <=> Admin)
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    message TEXT,
    file_url VARCHAR(255) DEFAULT NULL,
    file_type VARCHAR(50) DEFAULT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Tabel Jadwal Pelajaran
CREATE TABLE IF NOT EXISTS jadwal_pelajaran (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tahun_ajaran_id INT NULL,
    hari ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu') NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    mata_pelajaran VARCHAR(255) NOT NULL,
    kelas VARCHAR(50) NOT NULL,
    guru_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guru_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Tabel Nilai Siswa
CREATE TABLE IF NOT EXISTS nilai_siswa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siswa_id INT NOT NULL,
    tahun_ajaran_id INT NULL,
    mata_pelajaran VARCHAR(255) NOT NULL,
    jenis_nilai VARCHAR(50) NOT NULL,
    nilai DECIMAL(5,2) NOT NULL,
    semester ENUM('Ganjil', 'Genap') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
    FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
