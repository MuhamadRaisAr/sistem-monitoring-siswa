const db = require('./config/db');
async function fixAll() {
  try {
    const [tables] = await db.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    let totalFixed = 0;
    
    for (const t of tableNames) {
        const [columns] = await db.execute(`SHOW COLUMNS FROM ${t}`);
        const colNames = columns.map(c => c.Field);
        
        for (const col of colNames) {
            if (col.includes('kelas') || col.includes('nama_kelas')) {
                // Not all tables might have an id column, so we just get primary key, or just update directly if we match the old value
                const [rows] = await db.execute(`SELECT * FROM ${t}`);
                if (rows.length > 0) {
                    for (const r of rows) {
                        if (typeof r[col] === 'string' && r[col].includes('%20')) {
                            let fixed = decodeURIComponent(r[col]);
                            while(fixed.includes('%')) fixed = decodeURIComponent(fixed);
                            await db.execute(`UPDATE ${t} SET ${col} = ? WHERE ${col} = ?`, [fixed, r[col]]);
                            totalFixed++;
                            console.log(`Fixed ${t}.${col} from ${r[col]} to ${fixed}`);
                        }
                    }
                }
            }
        }
    }
    console.log('Done! Total fixed globally:', totalFixed);
  } catch (e) {
    console.error(e);
  }
  process.exit();
}
fixAll();
