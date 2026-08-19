const db = require('../config/db');
const webpush = require('../config/webpush');

/**
 * Sends a notification (Socket.IO + Web Push) to the parents of a specific student.
 * 
 * @param {Object} io - The Socket.IO instance (req.app.get('io'))
 * @param {number} siswaId - The ID of the student
 * @param {Object} payload - Notification payload { title, message, type, url }
 */
exports.notifyParents = async (io, siswaId, payload) => {
    try {
        console.log(`[notifyParents] Called for siswa: ${siswaId}, Title: ${payload.title}`);
        const [mappings] = await db.query('SELECT wali_id FROM wali_siswa_mapping WHERE siswa_id = ?', [siswaId]);
        if (mappings.length === 0) return;

        const notifPayload = {
            title: payload.title,
            message: payload.message,
            type: payload.type || 'info',
            created_at: new Date().toISOString()
        };

        const waliIds = [];
        
        // 1. Send via Socket.IO
        if (io) {
            mappings.forEach(m => {
                waliIds.push(m.wali_id);
                io.to(`user_${m.wali_id}`).emit('new_notification', notifPayload);
                console.log(`[notifyParents] Emitted socket to user_${m.wali_id}`);
            });
        } else {
            mappings.forEach(m => waliIds.push(m.wali_id));
        }

        // 2. Send via Web Push
        if (waliIds.length > 0) {
            const [subs] = await db.query('SELECT endpoint, keys_auth, keys_p256dh FROM push_subscriptions WHERE user_id IN (?)', [waliIds]);
            
            const pushPayload = JSON.stringify({
                title: notifPayload.title,
                body: notifPayload.message,
                url: payload.url || '/'
            });

            for (const sub of subs) {
                const pushSubscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        auth: sub.keys_auth,
                        p256dh: sub.keys_p256dh
                    }
                };
                
                try {
                    await webpush.sendNotification(pushSubscription, pushPayload);
                    console.log(`[notifyParents] Web Push sent successfully to ${sub.endpoint}`);
                } catch (err) {
                    console.error('Failed to send Web Push:', err);
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await db.query('DELETE FROM push_subscriptions WHERE endpoint = ?', [sub.endpoint]);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error in notifyParents:', error);
    }
};

/**
 * Sends a notification to specific roles or everyone.
 * 
 * @param {Object} io - Socket.IO instance
 * @param {string} target - 'semua', 'guru', or 'wali_siswa'
 * @param {Object} payload - { title, message, type, url }
 */
exports.notifyRoles = async (io, target, payload) => {
    try {
        console.log(`[notifyRoles] Target: ${target}, Title: ${payload.title}`);
        
        let query = 'SELECT id, role FROM users';
        if (target === 'guru') {
            query += " WHERE role = 'guru'";
        } else if (target === 'wali_siswa') {
            query += " WHERE role = 'wali_siswa'";
        } else {
            query += " WHERE role IN ('guru', 'wali_siswa')";
        }

        const [users] = await db.query(query);
        if (users.length === 0) return;

        const userIds = users.map(u => u.id);
        const notifPayload = {
            title: payload.title,
            message: payload.message,
            type: payload.type || 'info',
            created_at: new Date().toISOString(),
            url: payload.url
        };

        // 1. Send via Socket.IO
        if (io) {
            userIds.forEach(id => {
                io.to(`user_${id}`).emit('new_notification', notifPayload);
            });
            console.log(`[notifyRoles] Emitted socket to ${userIds.length} users`);
        }

        // 2. Send via Web Push
        const [subs] = await db.query('SELECT endpoint, keys_auth, keys_p256dh FROM push_subscriptions WHERE user_id IN (?)', [userIds]);
        
        const pushPayload = JSON.stringify({
            title: notifPayload.title,
            body: notifPayload.message,
            url: payload.url || '/'
        });

        for (const sub of subs) {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    auth: sub.keys_auth,
                    p256dh: sub.keys_p256dh
                }
            };
            
            try {
                await webpush.sendNotification(pushSubscription, pushPayload);
            } catch (err) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await db.query('DELETE FROM push_subscriptions WHERE endpoint = ?', [sub.endpoint]);
                }
            }
        }
        console.log(`[notifyRoles] Web Push sent successfully to ${subs.length} endpoints`);
    } catch (error) {
        console.error('Error in notifyRoles:', error);
    }
};
