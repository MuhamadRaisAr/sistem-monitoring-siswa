import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export function useTahunAjaran() {
    const { token } = useAuth();
    const [tahunAjaranList, setTahunAjaranList] = useState([]);
    const [selectedTahunAjaranId, setSelectedTahunAjaranId] = useState('');
    const [loadingTahunAjaran, setLoadingTahunAjaran] = useState(true);

    useEffect(() => {
        const fetchTahunAjaran = async () => {
            if (!token) return;
            try {
                setLoadingTahunAjaran(true);
                const res = await fetch('/api/tahun-ajaran', {
                    headers: { 'Authorization': `Bearer ${token}` }
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

                        // Rule 4: Semester fallback (Genap > Ganjil if descending, Ganjil > Genap if ascending)
                        const semA = (a.semester || '').toLowerCase();
                        const semB = (b.semester || '').toLowerCase();
                        if (semA !== semB) {
                            return semB.localeCompare(semA); // Just a simple fallback
                        }

                        return 0;
                    });
                    
                    setTahunAjaranList(sorted);
                    // Select the first one in the sorted list (which is the most prioritized)
                    if (sorted.length > 0) {
                        setSelectedTahunAjaranId(sorted[0].id.toString());
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
    const currentSelected = tahunAjaranList.find(t => t.id.toString() === selectedTahunAjaranId);
    const activeTahunAjaran = (currentSelected && (currentSelected.is_active === 1 || currentSelected.is_active === true)) 
        ? currentSelected 
        : null;

    return {
        tahunAjaranList,
        activeTahunAjaran,
        selectedTahunAjaranId,
        setSelectedTahunAjaranId,
        loadingTahunAjaran
    };
}
