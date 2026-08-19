const express = require('express');
const router = express.Router();
const jadwalController = require('../controllers/jadwalController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/my-jadwal', authMiddleware, jadwalController.getMyJadwal);
router.get('/', authMiddleware, jadwalController.getAllJadwal);
router.get('/:id', authMiddleware, jadwalController.getJadwalById);
router.post('/', authMiddleware, jadwalController.createJadwal);
router.put('/:id', authMiddleware, jadwalController.updateJadwal);
router.delete('/:id', authMiddleware, jadwalController.deleteJadwal);

module.exports = router;
