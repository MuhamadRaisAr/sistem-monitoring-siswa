const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const kelasController = require('../controllers/kelasController');

// All routes require authentication
router.use(authMiddleware);

// Get guru list for dropdown
router.get('/guru-list', kelasController.getGuruList);

router.get('/', kelasController.getAllKelas);
router.post('/', kelasController.createKelas);
router.put('/:id', kelasController.updateKelas);
router.delete('/:id', kelasController.deleteKelas);
router.get('/:nama_kelas/siswa', kelasController.getsiswaByKelas);

module.exports = router;
