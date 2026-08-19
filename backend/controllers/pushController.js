const db = require('../config/db');

exports.subscribe = async (req, res) => {
    try {
        const { subscription } = req.body;
        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ message: 'Invalid subscription object.' });
        }

        const user_id = req.user.id;
        if (req.user.role !== 'wali_siswa' && req.user.role !== 'guru') {
            return res.status(403).json({ message: 'Only parents and teachers can subscribe to push notifications.' });
        }

        const { endpoint, keys } = subscription;
        const keys_auth = keys?.auth || '';
        const keys_p256dh = keys?.p256dh || '';

        // Check if endpoint already exists
        const [existing] = await db.query('SELECT id FROM push_subscriptions WHERE endpoint = ? AND user_id = ?', [endpoint, user_id]);
        
        if (existing.length === 0) {
            await db.query(
                'INSERT INTO push_subscriptions (user_id, endpoint, keys_auth, keys_p256dh) VALUES (?, ?, ?, ?)',
                [user_id, endpoint, keys_auth, keys_p256dh]
            );
        }

        res.status(201).json({ message: 'Subscribed to push notifications.' });
    } catch (err) {
        console.error('Push subscribe error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.unsubscribe = async (req, res) => {
    try {
        const { endpoint } = req.body;
        if (!endpoint) {
            return res.status(400).json({ message: 'Endpoint is required.' });
        }
        
        const user_id = req.user.id;
        await db.query('DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?', [endpoint, user_id]);
        
        res.status(200).json({ message: 'Unsubscribed from push notifications.' });
    } catch (err) {
        console.error('Push unsubscribe error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getVapidPublicKey = (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};
