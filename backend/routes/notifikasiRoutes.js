const express = require('express');
const router = express.Router();
const notifikasiController = require('../controllers/notifikasiController');
const verifyToken = require('../middleware/authMiddleware');

// Route mendapatkan semua notifikasi
router.get('/', verifyToken, notifikasiController.getNotifikasi);

// Route mengirim notifikasi
router.post('/', verifyToken, notifikasiController.kirimNotifikasi);

// Route tandai dibaca
router.put('/:id/read', verifyToken, notifikasiController.markAsRead);

module.exports = router;
