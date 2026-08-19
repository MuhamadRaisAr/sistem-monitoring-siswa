const express = require('express');
const router = express.Router();
const bimbinganKonselingController = require('../controllers/bimbinganKonselingController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', bimbinganKonselingController.getAllBimbingan);
router.post('/', bimbinganKonselingController.createBimbingan);
router.put('/:id', bimbinganKonselingController.updateBimbingan);
router.delete('/:id', bimbinganKonselingController.deleteBimbingan);

module.exports = router;
