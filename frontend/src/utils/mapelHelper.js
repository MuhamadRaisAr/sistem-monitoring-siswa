export const getAbbreviatedMapel = (mapelName) => {
    if (!mapelName) return '-';
    const name = mapelName.toLowerCase().trim();
    if (name.includes('pendidikan agama islam') || name === 'pai') return 'PAI';
    if (name.includes('pendidikan pancasila') || name === 'ppkn' || name === 'pkn') return 'PPKn';
    if (name.includes('bahasa indonesia') || name === 'b. ind' || name === 'b ind' || name === 'bind') return 'B. Ind';
    if (name.includes('matematika') || name === 'mtk') return 'MTK';
    if (name.includes('alam') || name === 'ipa') return 'IPA';
    if (name.includes('sosial') || name === 'ips') return 'IPS';
    if (name.includes('bahasa inggris') || name === 'b. ing' || name === 'b ing' || name === 'bing') return 'B. Ing';
    if (name.includes('pendidikan jasmani') || name === 'pjok' || name === 'penjas' || name.includes('olahraga')) return 'PJOK';
    if (name.includes('informatika') || name === 'tik') return 'TIK';
    if (name.includes('seni dan prakarya') || name.includes('seni budaya') || name === 'seni' || name.includes('sbd') || name.includes('sbk')) return 'SBK';
    if (name.includes('muatan lokal') || name.includes('mulok')) return 'Mulok';
    if (name.includes('sunda') || name.includes('b. sunda') || name.includes('bahasa sunda')) return 'B. Sunda';
    if (name.includes('prakarya')) return 'Prakarya';
    if (name.includes('sejarah')) return 'Sejarah';
    if (name.includes('geografi') || name === 'geo') return 'Geografi';
    if (name.includes('ekonomi') || name === 'eko') return 'Ekonomi';
    if (name.includes('sosiologi') || name === 'sos') return 'Sosiologi';
    
    // Mata Pelajaran Madrasah (Agama Spesifik)
    if (name.includes('qur') || name.includes('hadis') || name.includes('qurdis')) return 'Qurdis';
    if (name.includes('akidah') || name.includes('akhlak') || name.includes('aqidah')) return 'Akidah';
    if (name.includes('fikih') || name.includes('fiqih')) return 'Fikih';
    if (name.includes('sejarah kebudayaan islam') || name.includes('ski')) return 'SKI';
    if (name.includes('bahasa arab') || name === 'b. arab' || name === 'b arab' || name === 'barab') return 'B. Arab';
    
    // Auto-capitalize very short names (like "IPS", "IPA", "TIK" if not caught above)
    if (name.length <= 4) {
        return name.toUpperCase();
    }
    
    // Capitalize each word for unknown mapels
    return mapelName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

export const STANDARD_MAPEL_ORDER = [
    "Pendidikan Agama", "PAI", 
    "Pancasila", "PPKn", "PKN", 
    "Bahasa Indonesia", 
    "Matematika", 
    "Alam", "IPA", 
    "Sosial", "IPS", 
    "Bahasa Inggris", 
    "SBK", "Seni", 
    "Jasmani", "PJOK", "Olahraga", 
    "Prakarya", "Informatika", 
    "Sunda", "Muatan Lokal",
    "Qurdis", "Akidah", "Fikih", "SKI", "Bahasa Arab"
];

export const getMapelSortIndex = (mp) => {
    if (!mp) return 999;
    for (let i = 0; i < STANDARD_MAPEL_ORDER.length; i++) {
        if (mp.toLowerCase().includes(STANDARD_MAPEL_ORDER[i].toLowerCase())) {
            return i;
        }
    }
    return 999;
};
