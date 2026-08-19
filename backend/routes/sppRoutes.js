const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sppController = require('../controllers/sppController');
const authMiddleware = require('../middleware/authMiddleware');

// Configure multer
const uploadDir = path.join(__dirname, '../uploads/bukti_bayar');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.use(authMiddleware);

router.get('/', sppController.getBills);
router.get('/tunggakan', sppController.getTunggakan);
router.post('/', sppController.createBill);
router.post('/generate', sppController.bulkGenerateBills);
router.post('/:id/upload-bukti', upload.single('bukti_bayar'), sppController.uploadBuktiBayar);
router.put('/:id/pay', sppController.payBill);
router.put('/:id', sppController.updateBill);
router.delete('/:id', sppController.deleteBill);

module.exports = router;
