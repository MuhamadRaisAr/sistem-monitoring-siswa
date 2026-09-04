// frontend/src/utils/holidays.js
// Daftar hari libur nasional Indonesia yang tanggalnya berubah-ubah (format YYYY-MM-DD)
export const DYNAMIC_HOLIDAYS = [
  // 2024
  "2024-02-08", // Isra Mikraj
  "2024-02-09", // Cuti Bersama Imlek
  "2024-02-10", // Tahun Baru Imlek
  "2024-03-11", // Hari Suci Nyepi
  "2024-03-12", // Cuti Bersama Nyepi
  "2024-03-29", // Wafat Yesus Kristus
  "2024-03-31", // Hari Paskah
  "2024-04-08", // Cuti Bersama Idul Fitri
  "2024-04-09", // Cuti Bersama Idul Fitri
  "2024-04-10", // Hari Raya Idul Fitri
  "2024-04-11", // Hari Raya Idul Fitri
  "2024-04-12", // Cuti Bersama Idul Fitri
  "2024-04-15", // Cuti Bersama Idul Fitri
  "2024-05-09", // Kenaikan Yesus Kristus
  "2024-05-10", // Cuti Bersama Kenaikan
  "2024-05-23", // Hari Raya Waisak
  "2024-05-24", // Cuti Bersama Waisak
  "2024-06-17", // Hari Raya Idul Adha
  "2024-06-18", // Cuti Bersama Idul Adha
  "2024-07-07", // Tahun Baru Islam
  "2024-09-16", // Maulid Nabi Muhammad SAW
  "2024-12-26", // Cuti Bersama Natal

  // 2025
  "2025-01-27", // Isra Mikraj
  "2025-01-29", // Tahun Baru Imlek
  "2025-03-29", // Hari Suci Nyepi
  "2025-03-31", // Hari Raya Idul Fitri
  "2025-04-01", // Hari Raya Idul Fitri
  "2025-04-18", // Wafat Yesus Kristus
  "2025-04-20", // Hari Paskah
  "2025-05-12", // Hari Raya Waisak
  "2025-05-29", // Kenaikan Yesus Kristus
  "2025-06-06", // Hari Raya Idul Adha
  "2025-06-27", // Tahun Baru Islam
  "2025-09-05", // Maulid Nabi Muhammad SAW
  "2025-12-26", // Cuti Bersama Natal

  // 2026
  "2026-01-13", // Isra Mikraj
  "2026-02-17", // Tahun Baru Imlek
  "2026-03-19", // Hari Suci Nyepi
  "2026-03-20", // Hari Raya Idul Fitri
  "2026-03-21", // Hari Raya Idul Fitri
  "2026-04-03", // Wafat Yesus Kristus
  "2026-04-05", // Hari Paskah
  "2026-05-14", // Kenaikan Yesus Kristus
  "2026-05-27", // Hari Raya Idul Adha
  "2026-05-31", // Hari Raya Waisak
  "2026-06-16", // Tahun Baru Islam
  "2026-08-25", // Maulid Nabi Muhammad SAW
  "2026-12-26"  // Cuti Bersama Natal
];

// Hari libur yang tanggalnya selalu sama setiap tahun (MM-DD)
export const FIXED_HOLIDAYS = [
  "01-01", // Tahun Baru Masehi
  "05-01", // Hari Buruh Internasional
  "06-01", // Hari Lahir Pancasila
  "08-17", // Hari Kemerdekaan RI
  "12-25"  // Hari Raya Natal
];

/**
 * Mengecek apakah suatu tanggal adalah hari libur nasional
 * @param {string} dateStr Format YYYY-MM-DD
 * @returns {boolean}
 */
export const isNationalHoliday = (dateStr) => {
    if (!dateStr) return false;
    
    // Cek apakah itu adalah hari libur tetap (seperti 17 Agustus atau 1 Januari)
    const monthDay = dateStr.substring(5); // Ambil MM-DD (misal "08-17")
    if (FIXED_HOLIDAYS.includes(monthDay)) {
        return true;
    }

    // Jika bukan hari libur tetap, cek di daftar hari libur dinamis (Idul Fitri, dll)
    return DYNAMIC_HOLIDAYS.includes(dateStr);
};
