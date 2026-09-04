import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export function useTahunAjaran() {
    const { token } = useAuth();
    const [tahunAjaranList, setTahunAjaranList] = useState([]);
    const [selectedTahunAjaranIdState, setSelectedTahunAjaranIdState] = useState('');
    const [loadingTahunAjaran, setLoadingTahunAjaran] = useState(true);

    const setSelectedTahunAjaranId = (id) => {
        setSelectedTahunAjaranIdState(id);
        if (typeof window !== 'undefined') {
            localStorage.setItem('selectedTahunAjaranId', id);
        }
    };

    useEffect(() => {
        const fetchTahunAjaran = async () => {
            if (!token) return;
            try {
                setLoadingTahunAjaran(true);
                const res = await fetch('/api/tahun-ajaran', {
                    headers: { 'Authorization': `Bearer ${token}` },
                    cache: 'no-store'
                });
                const data = await res.json();
                if (res.ok) {
                    // Determine current real-world academic year
                    const now = new Date();
                    const currentYear = now.getFullYear();
                    const currentMonth = now.getMonth(); // 0 = Jan, 6 = Jul
                    const currentAcademicStartYear = currentMonth >= 6 ? currentYear : currentYear - 1;

                    const getCategory = (ta) => {
                        const match = (ta.nama_tahun || '').match(/^(\d{4})/);
                        const startYear = match ? parseInt(match[1], 10) : 0;
                        
                        if (startYear === currentAcademicStartYear) return { group: 1, year: startYear }; // Sekarang
                        if (startYear < currentAcademicStartYear) return { group: 2, year: startYear };   // Sebelumnya
                        return { group: 3, year: startYear };                                             // Akan datang
                    };

                    const sorted = [...data].sort((a, b) => {
                        const aActive = (a.is_active === 1 || a.is_active === true);
                        const bActive = (b.is_active === 1 || b.is_active === true);
                        
                        // Rule 1: Active first
                        if (aActive && !bActive) return -1;
                        if (!aActive && bActive) return 1;

                        const catA = getCategory(a);
                        const catB = getCategory(b);

                        // Rule 2: Group (1: Sekarang, 2: Sebelumnya, 3: Akan datang)
                        if (catA.group !== catB.group) {
                            return catA.group - catB.group;
                        }

                        // Rule 3: Sort within group
                        if (catA.group === 2) {
                            // Sebelumnya: sort descending (newest first)
                            if (catA.year !== catB.year) return catB.year - catA.year;
                        } else if (catA.group === 3) {
                            // Akan datang: sort ascending (soonest first)
                            if (catA.year !== catB.year) return catA.year - catB.year;
                        }

                        // Rule 4: Semester fallback based on real-time current semester
                        const semA = (a.semester || '').toLowerCase();
                        const semB = (b.semester || '').toLowerCase();
                        if (semA !== semB) {
                            // Determine expected semester: Month 6-11 (July-Dec) -> Ganjil, else -> Genap
                            const expectedSem = (currentMonth >= 6) ? 'ganjil' : 'genap';
                            
                            if (semA === expectedSem) return -1; // a is expected, put a first
                            if (semB === expectedSem) return 1;  // b is expected, put b first
                            
                            // If neither match perfectly (or fallback), sort by string
                            return semB.localeCompare(semA); 
                        }

                        return 0;
                    });
                    
                    setTahunAjaranList(sorted);
                    // Select the first one in the sorted list (which is the most prioritized)
                    if (sorted.length > 0) {
                        let defaultId = sorted[0].id.toString();
                        if (typeof window !== 'undefined') {
                            const savedId = localStorage.getItem('selectedTahunAjaranId');
                            if (savedId && sorted.some(t => t.id.toString() === savedId)) {
                                defaultId = savedId;
                            }
                        }
                        setSelectedTahunAjaranIdState(defaultId);
                    }
                }
            } catch (err) {
                console.error('Error fetching tahun ajaran:', err);
            } finally {
                setLoadingTahunAjaran(false);
            }
        };

        fetchTahunAjaran();
    }, [token]);

    // To maintain compatibility with components using activeTahunAjaran,
    // we return the selected tahun ajaran IF it is active.
    const currentSelected = tahunAjaranList.find(t => t.id.toString() === selectedTahunAjaranIdState);
    const activeTahunAjaran = (currentSelected && (currentSelected.is_active === 1 || currentSelected.is_active === true)) 
        ? currentSelected 
        : null;

    const activeTahunAjaranList = tahunAjaranList.filter(t => t.is_active === 1 || t.is_active === true);

    return {
        tahunAjaranList,
        activeTahunAjaranList,
        activeTahunAjaran,
        selectedTahunAjaranId: selectedTahunAjaranIdState,
        setSelectedTahunAjaranId,
        loadingTahunAjaran
    };
}
