const webpush = require('web-push');
require('dotenv').config();

const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

webpush.setVapidDetails(
    'mailto:admin@monitoring-siswa.com',
    publicVapidKey,
    privateVapidKey
);

module.exports = webpush;
