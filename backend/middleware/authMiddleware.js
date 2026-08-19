const jwt = require('jsonwebtoken');
const db = require('../config/db');

module.exports = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized. No token provided.' });
        }

        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'monitoring_siswa_secret_key_123';
        
        const decoded = jwt.verify(token, secret);
        
        // Fetch user from DB
        const [rows] = await db.query(
            'SELECT id, username, nama_lengkap, role, no_hp FROM users WHERE id = ?',
            [decoded.id]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Unauthorized. User no longer exists.' });
        }

        req.user = rows[0]; // Attach user profile to request object
        next();
    } catch (err) {
        console.error('Auth middleware error:', err.message);
        return res.status(401).json({ message: 'Unauthorized. Invalid or expired token.' });
    }
};
