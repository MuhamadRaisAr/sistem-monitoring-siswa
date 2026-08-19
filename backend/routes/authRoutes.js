const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.post('/register', authMiddleware, authController.register);
router.put('/change-password', authMiddleware, authController.changePassword);
router.put('/update-profile', authMiddleware, authController.updateProfile);

// User Management Routes
router.get('/users', authMiddleware, authController.getAllUsers);
router.put('/users/:id/reset-password', authMiddleware, authController.resetUserPassword);
router.put('/users/:id', authMiddleware, authController.updateUser);
router.delete('/users/:id', authMiddleware, authController.deleteUser);

module.exports = router;
