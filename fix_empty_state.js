const fs = require('fs');

function fixEmptyState(file) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    
    // Check if it already has allMapelOptions.length === 0
    if (content.includes('allMapelOptions.length === 0 && !loading ?')) return;

    content = content.replace(/\{isSelectingMapel \? \(/g, 
`{allMapelOptions.length === 0 && !loading ? (
                <div className="bg-white dark:bg-[#041610] rounded-3xl p-12 border border-slate-200 dark:border-emerald-500/10 shadow-sm flex flex-col items-center justify-center gap-4 text-center animate-fade-in mt-6">
                    <BookOpen className="h-16 w-16 text-slate-300 dark:text-slate-600" />
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">
                        Anda belum memiliki penugasan mengajar
                    </h2>
                </div>
            ) : isSelectingMapel ? (`);
    
    fs.writeFileSync(file, content);
    console.log('Fixed empty state in ' + file);
}

fixEmptyState('frontend/src/app/guru/nilai/page.js');
fixEmptyState('frontend/src/app/guru/perekapan/nilai-mapel/page.js');
fixEmptyState('frontend/src/app/guru/perekapan/absensi/page.js');
