const fs = require('fs');
const path = require('path');

const historyPath = 'C:\\Users\\basma\\AppData\\Roaming\\Code\\User\\History';
const targetBaseDir = 'D:\\ITG 2025 semester 7\\SKRIPSI\\monitoring-siswa';

if (!fs.existsSync(historyPath)) {
  console.log('History not found');
  process.exit(1);
}

const folders = fs.readdirSync(historyPath);
let recoveredCount = 0;

for (const folder of folders) {
  const folderPath = path.join(historyPath, folder);
  if (!fs.statSync(folderPath).isDirectory()) continue;

  const entriesPath = path.join(folderPath, 'entries.json');
  if (fs.existsSync(entriesPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(entriesPath, 'utf8'));
      if (data && data.resource && typeof data.resource === 'string') {
        const res = decodeURIComponent(data.resource);

        // We only care about files in monitoring-siswa/frontend
        if (res.toLowerCase().includes('monitoring-siswa/frontend/') || res.toLowerCase().includes('monitoring-siswa\\frontend\\')) {

          // Construct original local path
          // res is usually file:///d%3A/ITG%202025%20semester%207/SKRIPSI/monitoring-siswa/frontend/src/app/...
          let relativePath = res.substring(res.toLowerCase().indexOf('monitoring-siswa') + 'monitoring-siswa'.length + 1);
          relativePath = relativePath.replace(/\//g, '\\');

          const targetPath = path.join(targetBaseDir, relativePath);

          // Find the latest entry
          if (data.entries && data.entries.length > 0) {
            const latestEntry = data.entries[data.entries.length - 1];
            const sourceFile = path.join(folderPath, latestEntry.id);

            if (fs.existsSync(sourceFile)) {
              // Ensure directory exists
              fs.mkdirSync(path.dirname(targetPath), { recursive: true });

              // Only overwrite if target doesn't exist, OR if the target is from the Aug 18 backup
              // We'll just overwrite everything since the VSCode history is the most recent
              fs.copyFileSync(sourceFile, targetPath);
              console.log('Recovered from VS Code History:', targetPath);
              recoveredCount++;
            }
          }
        }
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  }
}

console.log('Total files recovered from VS Code History:', recoveredCount);
