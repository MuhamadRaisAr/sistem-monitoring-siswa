const express = require('express');
const router = express.Router();
const honorController = require('../controllers/honorController');
const authMiddleware = require('../middleware/authMiddleware');

// Custom role checks
const isAdminOrBendahara = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'bendahara')) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin or Bendahara only.' });
    }
};

const isGuru = (req, res, next) => {
    if (req.user && req.user.role === 'guru') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Guru only.' });
    }
};

// === Routes untuk Bendahara ===

// Mendapatkan daftar guru beserta tarif per jam
router.get('/guru-list', authMiddleware, isAdminOrBendahara, honorController.getGuruList);

// Mengupdate tarif per jam seorang guru
router.put('/guru-tarif/:id', authMiddleware, isAdminOrBendahara, honorController.updateTarif);

// Mendapatkan data honor berdasarkan bulan & tahun (Untuk Tab Riwayat)
router.get('/bulanan', authMiddleware, isAdminOrBendahara, honorController.getHonorByBulan);

// Mendapatkan akumulasi honor yang belum dibayar (Untuk Tab Gaji Bulanan)
router.get('/pending', authMiddleware, isAdminOrBendahara, honorController.getPendingHonor);

// Generate/Hitung otomatis honor untuk bulan tertentu berdasarkan jadwal
router.post('/generate', authMiddleware, isAdminOrBendahara, honorController.generateHonor);

// Update manual jumlah jam atau nominal
router.put('/manual/:id', authMiddleware, isAdminOrBendahara, honorController.updateManualHonor);

// Bayar Honor
router.put('/pay/:id', authMiddleware, isAdminOrBendahara, honorController.payHonor);

// Batalkan Pembayaran Honor
router.put('/cancel/:id', authMiddleware, isAdminOrBendahara, honorController.cancelHonor);


// === Routes untuk Guru ===

// Mendapatkan data honor untuk diri sendiri (Role Guru)
router.get('/my-honor', authMiddleware, isGuru, honorController.getMyHonor);

module.exports = router;
