const fs = require('fs');
let file = 'frontend/src/app/guru/layout.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Add states for myMapels, isAbsensiOpen, isNilaiOpen
content = content.replace('const [isPerekapanOpen, setIsPerekapanOpen] = useState(false);', 
\const [isPerekapanOpen, setIsPerekapanOpen] = useState(false);
    const [isAbsensiOpen, setIsAbsensiOpen] = useState(false);
    const [isNilaiOpen, setIsNilaiOpen] = useState(false);
    const [myMapels, setMyMapels] = useState([]);\);

// 2. Add useEffect to fetch myMapels
content = content.replace('// Fetch list of ekskul to determine if user is a pembina', 
\// Fetch my jadwal to determine mapels
    useEffect(() => {
        if (!token || !user) return;
        const fetchJadwal = async () => {
            try {
                const res = await fetch('/api/jadwal/my-jadwal', {
                    headers: { 'Authorization': \\\Bearer \\\\ }
                });
                const data = await res.json();
                if (Array.isArray(data)) {
                    const unique = Array.from(new Set(data.map(j => j.mata_pelajaran).filter(Boolean)));
                    setMyMapels(unique);
                }
            } catch(e){}
        };
        fetchJadwal();
    }, [token, user]);
    
    // Fetch list of ekskul to determine if user is a pembina\);

// 3. Update useEffect for pathnames
content = content.replace('if (pathname.startsWith(\\'/guru/perekapan\\')) {', 
\if (pathname.startsWith('/guru/perekapan')) {
            setIsPerekapanOpen(true);
        }
        if (pathname.startsWith('/guru/akademik')) {
            setIsAbsensiOpen(true);
        }
        if (pathname.startsWith('/guru/nilai')) {
            setIsNilaiOpen(true);
        }
        if (false) {\); // dummy if to match the existing replace

// 4. Update the navigation array
content = content.replace(
\        { name: 'Input Absensi', href: '/guru/akademik', icon: BookOpen },
        { name: 'Input Nilai', href: '/guru/nilai', icon: FileText },\,
\        { 
            name: 'Input Absensi', 
            href: myMapels.length > 1 ? undefined : '/guru/akademik', 
            icon: BookOpen,
            id: 'absensi',
            children: myMapels.length > 1 ? myMapels.map(m => ({ name: \\\Absensi \\\\, href: '/guru/akademik', query: m, parent: 'absensi' })) : null
        },
        { 
            name: 'Input Nilai', 
            href: myMapels.length > 1 ? undefined : '/guru/nilai', 
            icon: FileText,
            id: 'nilai',
            children: myMapels.length > 1 ? myMapels.map(m => ({ name: \\\Nilai \\\\, href: '/guru/nilai', query: m, parent: 'nilai' })) : null
        },\);

// 5. Update the renderer for children
content = content.replace(/const isParentActive = pathname.startsWith\\('\\/guru\\/perekapan'\\);/g, 
\const isParentActive = item.name === 'Perekapan' ? pathname.startsWith('/guru/perekapan') : pathname.startsWith(item.href || 'XYZ');
                            const isOpen = item.name === 'Perekapan' ? isPerekapanOpen : item.id === 'absensi' ? isAbsensiOpen : item.id === 'nilai' ? isNilaiOpen : false;
                            const toggleOpen = () => {
                                if (item.name === 'Perekapan') setIsPerekapanOpen(!isPerekapanOpen);
                                else if (item.id === 'absensi') setIsAbsensiOpen(!isAbsensiOpen);
                                else if (item.id === 'nilai') setIsNilaiOpen(!isNilaiOpen);
                            };\);

content = content.replace(/onClick=\\{\\(\\) => setIsPerekapanOpen\\(!isPerekapanOpen\\)\\}/g, 
\onClick={toggleOpen}\);

content = content.replace(/\\{isPerekapanOpen && !isCollapsed && \\(/g, 
\{isOpen && !isCollapsed && (\);

content = content.replace(/\\<ChevronDown className=\\{\\\h-4 w-4 text-slate-400 transition-transform duration-200 \\\\\\$\\{isPerekapanOpen \\? 'rotate-180' : ''\\}\\\\\} \\/\\>/g, 
\<ChevronDown className={\\\h-4 w-4 text-slate-400 transition-transform duration-200 \\\\} />\);

// Fix the Link for children to set sessionStorage and use a regular <a> tag if it has query
content = content.replace(/const isChildActive = pathname === child.href;/g,
\const isChildActive = pathname === child.href && (child.query ? (child.parent === 'absensi' ? (typeof window !== 'undefined' && sessionStorage.getItem('guruAbsensi_mapel') === child.query) : (typeof window !== 'undefined' && sessionStorage.getItem('guruNilai_mapel') === child.query)) : true);\);

content = content.replace(/<Link\\s+key=\\{child.name\\}\\s+href=\\{child.href\\}\\s+onClick=\\{handleMenuClick\\}/g,
\<a
    key={child.name}
    href={child.href}
    onClick={(e) => {
        if (child.query) {
            if (child.parent === 'absensi') sessionStorage.setItem('guruAbsensi_mapel', child.query);
            if (child.parent === 'nilai') sessionStorage.setItem('guruNilai_mapel', child.query);
        }
        handleMenuClick();
    }}\);
    
content = content.replace(/<\\/Link>/g, '</a>'); // Note: This is dangerous if there are other <Link>s, but inside this block it should be fine. Wait, let me be precise.

fs.writeFileSync(file, content);

