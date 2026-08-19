const express = require('express');
const router = express.Router();
const mutasiController = require('../controllers/mutasiController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/pindah-kelas', mutasiController.pindahKelas);
router.post('/status', mutasiController.ubahStatus);

module.exports = router;
