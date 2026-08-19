const mysql = require('mysql2/promise');
async function run() {
    const con = await mysql.createConnection({host:'localhost', user:'root', password:'root', database:'monitoring_santri'});
    await con.query(`ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'guru', 'wali_siswa', 'bendahara') NOT NULL;`);
    console.log('Enum updated');
    process.exit(0);
}
run();
