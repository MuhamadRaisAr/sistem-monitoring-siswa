const express = require('express');
const router = express.Router();
const kedisiplinanController = require('../controllers/kedisiplinanController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Get records (Admin or parent for their kids)
router.get('/', kedisiplinanController.getRecords);

// Admin-only operations
router.post('/', kedisiplinanController.createRecord);
router.put('/:id', kedisiplinanController.updateRecord);
router.put('/status/:id', kedisiplinanController.updatePermissionStatus);
router.delete('/:id', kedisiplinanController.deleteRecord);

// Parent operations
router.post('/izin', kedisiplinanController.requestPermission);

module.exports = router;
