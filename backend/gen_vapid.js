const webpush = require('web-push');
const fs = require('fs');
const keys = webpush.generateVAPIDKeys();
fs.appendFileSync('.env', `\nVAPID_PUBLIC_KEY=${keys.publicKey}\nVAPID_PRIVATE_KEY=${keys.privateKey}\n`);
console.log('VAPID Keys generated and appended to .env');
