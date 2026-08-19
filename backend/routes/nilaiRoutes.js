const express = require('express');
const router = express.Router();
const nilaiController = require('../controllers/nilaiController');
const verifyToken = require('../middleware/authMiddleware');

// Get nilai data
router.get('/', verifyToken, nilaiController.getNilai);

// Save bulk nilai
router.post('/bulk', verifyToken, nilaiController.saveNilaiBulk);

// Get rekap nilai kelas
router.get('/rekap-kelas', verifyToken, nilaiController.getRekapKelas);

// Get rekap nilai siswa (Untuk Wali Siswa)
router.get('/siswa/:siswa_id', verifyToken, nilaiController.getNilaisiswa);

module.exports = router;
