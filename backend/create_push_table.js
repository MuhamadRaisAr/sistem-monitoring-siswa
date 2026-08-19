const db = require('./config/db');

const query = `
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wali_id INT NOT NULL,
    endpoint TEXT NOT NULL,
    keys_auth VARCHAR(255) NOT NULL,
    keys_p256dh VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wali_id) REFERENCES users(id) ON DELETE CASCADE
)`;

db.query(query).then(() => {
    console.log('Table push_subscriptions created successfully');
    process.exit(0);
}).catch(e => {
    console.error('Error creating table:', e);
    process.exit(1);
});
