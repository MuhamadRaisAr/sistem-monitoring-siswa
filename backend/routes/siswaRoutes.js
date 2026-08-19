const express = require('express');
const router = express.Router();
const siswaController = require('../controllers/siswaController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Admin operations
router.get('/', siswaController.getAllsiswa);
router.post('/', siswaController.createsiswa);
router.put('/:id', siswaController.updatesiswa);
router.delete('/:id', siswaController.deletesiswa);
router.get('/wali-list', siswaController.getWaliUsers);
router.post('/map-wali', siswaController.mapWali);

// Wali operations
router.get('/my-children', siswaController.getMyChildren);

module.exports = router;
