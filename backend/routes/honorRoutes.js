const express = require('express');
const router = express.Router();
const honorController = require('../controllers/honorController');
const verifyToken = require('../middleware/authMiddleware');

router.get('/unpaid', verifyToken, honorController.getUnpaidHonor);
router.post('/pay', verifyToken, honorController.payHonor);
router.get('/riwayat', verifyToken, honorController.getRiwayatHonor);
router.delete('/riwayat/:id', verifyToken, honorController.deleteRiwayatHonor);

module.exports = router;
