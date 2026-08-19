const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const mapelController = require('../controllers/mapelController');

// All routes require authentication
router.use(authMiddleware);

router.get('/', mapelController.getAllMapel);
router.post('/', mapelController.createMapel);
router.put('/:id', mapelController.updateMapel);
router.delete('/:id', mapelController.deleteMapel);

module.exports = router;
