const db = require('./config/db');

async function removePoinPelanggaran() {
    console.log('Memulai migrasi untuk menghapus kolom poin_pelanggaran...');

    try {
        // Cek apakah kolom poin_pelanggaran ada
        const [columns] = await db.query(`SHOW COLUMNS FROM kedisiplinan LIKE 'poin_pelanggaran'`);
        
        if (columns.length > 0) {
            console.log('Kolom poin_pelanggaran ditemukan. Sedang menghapus (DROP)...');
            await db.query(`ALTER TABLE kedisiplinan DROP COLUMN poin_pelanggaran;`);
            console.log('✅ Kolom poin_pelanggaran berhasil dihapus.');
        } else {
            console.log('ℹ️ Kolom poin_pelanggaran sudah tidak ada di tabel kedisiplinan.');
        }

        console.log('🎉 Migrasi selesai!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Terjadi kesalahan saat migrasi:', error);
        process.exit(1);
    }
}

removePoinPelanggaran();
