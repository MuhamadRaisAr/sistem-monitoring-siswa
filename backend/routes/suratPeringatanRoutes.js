const express = require('express');
const router = express.Router();
const spController = require('../controllers/suratPeringatanController');
const authMiddleware = require('../middleware/authMiddleware');

const isAdminOrGuruBK = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'guru_bk')) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin or Guru BK only.' });
    }
};

router.use(authMiddleware);
router.use(isAdminOrGuruBK);

router.get('/', spController.getAllSP);
router.post('/', spController.createSP);
router.put('/:id', spController.updateSP);
router.delete('/:id', spController.deleteSP);

module.exports = router;
