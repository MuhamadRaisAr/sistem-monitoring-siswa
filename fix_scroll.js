const fs = require('fs');
let file = 'frontend/src/app/guru/perekapan/absensi/page.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<div className="overflow-x-auto custom-scrollbar">/g, '<div className="w-full overflow-hidden">');
content = content.replace(/<table className="w-full text-left text-xs whitespace-nowrap min-w-max border-separate border-spacing-0">/g, '<table className="w-full text-left text-xs border-separate border-spacing-0 table-fixed">');

fs.writeFileSync(file, content);
console.log('Fixed scroll in guru/perekapan/absensi/page.js');
