const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const pengumumanController = require('../controllers/pengumumanController');

// All routes require authentication
router.use(authMiddleware);

router.get('/', pengumumanController.getAllPengumuman);
router.post('/', pengumumanController.createPengumuman);
router.put('/:id', pengumumanController.updatePengumuman);
router.delete('/:id', pengumumanController.deletePengumuman);

module.exports = router;
