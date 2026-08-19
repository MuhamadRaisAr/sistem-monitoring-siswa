const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

router.use(authMiddleware);

const fs = require('fs');

// Set up multer for chat attachments
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/chat';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.get('/history/:contactId', chatController.getChatHistory);
router.delete('/history/:contactId', chatController.deleteChatHistory);
router.post('/archive/:contactId', chatController.archiveChat);
router.post('/unarchive/:contactId', chatController.unarchiveChat);
router.put('/message/:id', chatController.editMessage);
router.put('/message/:id/delete_for_me', chatController.deleteMessageForMe);
router.delete('/message/:id', chatController.deleteMessageForEveryone);
router.get('/contacts', chatController.getContacts);
router.put('/read/:contactId', chatController.markAsRead);
router.post('/upload', upload.single('attachment'), chatController.uploadAttachment);

module.exports = router;
