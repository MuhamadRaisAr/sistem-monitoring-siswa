const fs = require('fs');
const file = 'frontend/src/app/wali_siswa/akademik/page.js';
let content = fs.readFileSync(file, 'utf8');

const regex1 = /<div className=\{\`flex flex-col items-center justify-center font-extrabold mx-auto \$\{isLibur \? 'text-red-500 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'\}\`\}>\s*<span className="text-\[8px\] md:text-\[9px\] opacity-60 uppercase font-bold leading-none mb-0\.5">\{dayLabel\}<\/span>\s*<span className="leading-none text-\[10px\] md:text-xs">\{dateLabel\}<\/span>\s*<\/div>/g;

content = content.replace(regex1, `<div className={\`flex justify-center font-extrabold mx-auto \${isLibur ? 'text-red-500 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}\`}>
                                                      {dateLabel}
                                                  </div>`);

const regex2 = /<div className=\{\`w-5 h-5 md:w-7 md:h-7 rounded-full mx-auto flex items-center justify-center text-\[10px\] font-bold bg-slate-100\/50 dark:bg-slate-800\/50 text-slate-400 dark:text-slate-500 \$\{isLibur \? 'opacity-50' : ''\}\`\} title=\{isLibur \? 'Libur \/ Tidak Ada KBM' : 'Belum Diabsen'\}>\s*-\s*<\/div>/g;

content = content.replace(regex2, `<div className={\`w-5 h-5 md:w-7 md:h-7 rounded-full mx-auto flex items-center justify-center text-[10px] font-bold bg-slate-100/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 \${isLibur ? 'opacity-50' : ''}\`} title={isLibur ? 'Libur / Tidak Ada KBM' : 'Belum Diabsen'}>
                                                              
                                                          </div>`);

content = content.replace(/border-r-\[3px\] border-slate-300/g, 'border-r-[3px] border-slate-400');
content = content.replace(/border-l border-slate-200/g, 'border-l border-slate-300');
content = content.replace(/divide-slate-200/g, 'divide-slate-300');

fs.writeFileSync(file, content);
console.log('Fixed wali_siswa/akademik/page.js');
