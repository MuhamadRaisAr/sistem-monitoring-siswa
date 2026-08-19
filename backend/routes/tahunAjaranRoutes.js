const express = require('express');
const router = express.Router();
const tahunAjaranController = require('../controllers/tahunAjaranController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, tahunAjaranController.getAllTahunAjaran);
router.get('/active', authMiddleware, tahunAjaranController.getActiveTahunAjaran);
router.post('/', authMiddleware, tahunAjaranController.createTahunAjaran);
router.put('/:id', authMiddleware, tahunAjaranController.updateTahunAjaran);
router.put('/:id/active', authMiddleware, tahunAjaranController.setActive);
router.delete('/:id', authMiddleware, tahunAjaranController.deleteTahunAjaran);

module.exports = router;
