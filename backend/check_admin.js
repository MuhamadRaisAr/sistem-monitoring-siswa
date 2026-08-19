const db = require('./config/db');

async function checkAdmin() {
    try {
        const [admins] = await db.query('SELECT * FROM users WHERE role = "admin"');
        console.log("Admins before deletion:", admins);
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

checkAdmin();
