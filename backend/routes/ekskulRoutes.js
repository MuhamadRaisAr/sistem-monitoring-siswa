const express = require('express');
const router = express.Router();
const ekskulController = require('../controllers/ekskulController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', ekskulController.getAllEkskul);
router.post('/', ekskulController.createEkskul);
router.put('/:id', ekskulController.updateEkskul);
router.delete('/:id', ekskulController.deleteEkskul);

module.exports = router;
