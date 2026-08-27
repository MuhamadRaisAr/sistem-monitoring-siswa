"use client";
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import { FileText, Save, Users, Filter, CheckCircle, Edit3, BookOpen, Search, ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useTahunAjaran } from '@/hooks/useTahunAjaran';
import { getAbbreviatedMapel, getMapelSortIndex } from '@/utils/mapelHelper';

function InputNilaiContent() {
    const searchParams = useSearchParams();
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // State
    const [jadwalList, setJadwalList] = useState([]);
    const [mapelOptions, setMapelOptions] = useState([]);
    const [kelasOptions, setKelasOptions] = useState([]);
    
    const { 
        tahunAjaranList, 
        activeTahunAjaran,
        selectedTahunAjaranId, 
        setSelectedTahunAjaranId,
        loadingTahunAjaran
    } = useTahunAjaran();

    const isCurrentYearActive = activeTahunAjaran?.id?.toString() === selectedTahunAjaranId;

    // Selected Filters
    const [selectedMapel, setSelectedMapel] = useState('');
    const [selectedKelas, setSelectedKelas] = useState('');
    const [searchName, setSearchName] = useState('');

    const mapelQuery = searchParams.get('mapel');

    // Load saved selections from sessionStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedKelas = sessionStorage.getItem('guruNilai_kelas');
            if (savedKelas) setSelectedKelas(savedKelas);
        }
    }, []);

    useEffect(() => {
        if (mapelQuery) {
            setSelectedMapel(mapelQuery);
        }
    }, [mapelQuery]);

    // Reset kelas and data immediately when switching mapel
    useEffect(() => {
        setSelectedKelas('');
        setDataNilai([]);
    }, [selectedMapel]);

    // Save selections whenever they change
    useEffect(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('guruNilai_mapel', selectedMapel);
        }
    }, [selectedMapel]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('guruNilai_kelas', selectedKelas);
        }
    }, [selectedKelas]);

    // Data
    const [dataNilai, setDataNilai] = useState([]);

    const API_URL = '/api';

    const fetchJadwal = async (tahunId) => {
        if (!tahunId) return;
        setLoading(true);
        try {
            // Fetch Jadwal to get Kelas and Mapel
            const resJadwal = await fetch(`${API_URL}/jadwal/my-jadwal?tahun_ajaran_id=${tahunId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const jadwalData = await resJadwal.json();
            
            if (Array.isArray(jadwalData)) {
                setJadwalList(jadwalData);
            }
        } catch (err) {
            console.error('Error fetching init data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && selectedTahunAjaranId) {
            fetchJadwal(selectedTahunAjaranId);
        }
    }, [token, selectedTahunAjaranId]);

    // All unique mapels across all classes
    const allMapelOptions = useMemo(() => {
        return Array.from(new Set(
            jadwalList.map(j => j.mata_pelajaran).filter(Boolean)
        )).sort((a, b) => getMapelSortIndex(a) - getMapelSortIndex(b));
    }, [jadwalList]);

    // Classes that are taught for the selected Mapel
    const uniqueKelas = useMemo(() => {
        if (!selectedMapel) return [];
        return Array.from(new Set(
            jadwalList
                .filter(j => j.mata_pelajaran === selectedMapel)
                .map(j => j.kelas)
                .filter(Boolean)
        )).sort((a, b) => {
            const romanMap = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 };
            const getVal = (str) => {
                const match = str.trim().split(/[\s()]/)[0].toUpperCase();
                return romanMap[match] || 999;
            };
            const valA = getVal(a);
            const valB = getVal(b);
            if (valA !== valB) return valA - valB;
            return a.localeCompare(b);
        });
    }, [selectedMapel, jadwalList]);

    useEffect(() => {
        if (uniqueKelas.length === 1) {
            setSelectedKelas(uniqueKelas[0]);
        } else if (!uniqueKelas.includes(selectedKelas)) {
            setSelectedKelas('');
        }
    }, [uniqueKelas, selectedKelas]);

    useEffect(() => {
        if (allMapelOptions.length === 1 && !selectedMapel) {
            setSelectedMapel(allMapelOptions[0]);
        }
    }, [allMapelOptions, selectedMapel]);

    const isSelectingMapel = allMapelOptions.length > 1 && !selectedMapel;

    useEffect(() => {
        let ignore = false;

        if (!selectedKelas || !selectedMapel || !selectedTahunAjaranId) {
            setDataNilai([]);
            return;
        }

        const fetchNilai = async () => {
            setLoading(true);
            setSaveSuccess(false);
            try {
                const selectedTa = tahunAjaranList.find(t => t.id.toString() === selectedTahunAjaranId?.toString());
                const semester = selectedTa ? selectedTa.semester : '';

                const query = new URLSearchParams({
                    kelas: selectedKelas,
                    mata_pelajaran: selectedMapel,
                    tahun_ajaran_id: selectedTahunAjaranId,
                    semester: semester
                });
                const res = await fetch(`${API_URL}/nilai?${query.toString()}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                
                if (ignore) return;

                const cleanedData = (Array.isArray(data) ? data : []).map(item => {
                    const cleanVal = (val) => {
                        if (val === null || val === undefined || val === '') return '';
                        return Number(val).toString();
                    };
                    return {
                        ...item,
                        Tugas: cleanVal(item.Tugas),
                        Praktik: cleanVal(item.Praktik),
                        UTS: cleanVal(item.UTS),
                        UAS: cleanVal(item.UAS)
                    };
                });
                setDataNilai(cleanedData);
            } catch (err) {
                if (!ignore) console.error('Error fetching nilai data:', err);
            } finally {
                if (!ignore) setLoading(false);
            }
        };

        fetchNilai();
        return () => { ignore = true; };
    }, [selectedKelas, selectedMapel, selectedTahunAjaranId, tahunAjaranList, token]);

    const handleInputChange = (siswaId, field, value) => {
        setDataNilai(prev => prev.map(item => {
            if (item.siswa_id === siswaId) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const handleSimpan = async () => {
        if (dataNilai.length === 0) return;

        setIsSaving(true);
        try {
            const selectedTa = tahunAjaranList.find(t => t.id.toString() === selectedTahunAjaranId?.toString());
            const semester = selectedTa ? selectedTa.semester : '';

            const payload = {
                mata_pelajaran: selectedMapel,
                tahun_ajaran_id: selectedTahunAjaranId,
                semester: semester,
                dataNilai: dataNilai.map(d => ({
                    siswa_id: d.siswa_id,
                    Tugas: d.Tugas || '',
                    Praktik: d.Praktik || '',
                    UTS: d.UTS || '',
                    UAS: d.UAS || ''
                }))
            };

            const res = await fetch(`${API_URL}/nilai/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Gagal menyimpan nilai');
            
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
            
        } catch (err) {
            console.error('Error saving nilai:', err);
            alert('Gagal menyimpan data nilai.');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredDataNilai = useMemo(() => {
        return dataNilai.filter(d => 
            !searchName || 
            (d.nama_lengkap && d.nama_lengkap.toLowerCase().includes(searchName.toLowerCase()))
        );
    }, [dataNilai, searchName]);

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="mb-6">
                <h1 className="text-xl md:text-2xl font-extrabold text-[#0a2351] dark:text-white tracking-tight mb-1">Kelola Nilai Siswa</h1>
                {selectedMapel && (
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-slate-500 text-sm md:text-base">
                        <span>Mata Pelajaran: <span className="font-bold text-[#0a2351] dark:text-white">{selectedMapel}</span></span>
                        {selectedKelas && <span className="hidden sm:inline text-slate-300">|</span>}
                        {selectedKelas && (
                            <span className="w-full sm:w-auto">
                                Kelas <span className="font-bold text-[#0a2351] dark:text-white">{selectedKelas.replace(/\s*\([^)]*\)/g, '')}</span>
                            </span>
                        )}
                    </div>
                )}
            </div>

                <div className="flex flex-col gap-4 animate-fade-in">
                    <div className="flex flex-col sm:flex-row items-end gap-3 sm:gap-4 w-full">
                        {/* Tahun Ajaran & Kelas Group */}
                        <div className="flex flex-row w-full sm:w-auto gap-3 sm:gap-4">
                            {/* Tahun Ajaran */}
                            <div className="flex flex-col gap-1.5 flex-1 sm:flex-none sm:w-[200px]">
                                <label className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Tahun Ajaran:</label>
                                <select 
                                    value={selectedTahunAjaranId} 
                                    onChange={(e) => setSelectedTahunAjaranId(e.target.value)}
                                    disabled={loadingTahunAjaran}
                                    className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#061e16] py-2.5 px-3 sm:px-4 text-[12px] sm:text-sm font-semibold text-slate-700 dark:text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-sm text-ellipsis overflow-hidden disabled:opacity-50"
                                >
                                    {loadingTahunAjaran ? (
                                        <option>Memuat...</option>
                                    ) : tahunAjaranList.length === 0 ? (
                                        <option value="">Tidak ada data</option>
                                    ) : (
                                        tahunAjaranList.map((ta) => (
                                            <option key={ta.id} value={ta.id}>
                                                {ta.nama_tahun} {ta.semester}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                            
                            {/* Kelas */}
                            {jadwalList.length > 0 && (
                                <>
                            {uniqueKelas.length > 1 ? (
                                <div className="flex flex-col gap-1.5 flex-1 sm:flex-none sm:w-[200px]">
                                    <label className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Kelas:</label>
                                    <select 
                                        value={selectedKelas} 
                                        onChange={(e) => setSelectedKelas(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#061e16] py-2.5 px-3 sm:px-4 text-[12px] sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:outline-none cursor-pointer text-ellipsis shadow-sm"
                                    >
                                        <option value="">-- Pilih Kelas --</option>
                                        {uniqueKelas.map(k => <option key={k} value={k}>{k}</option>)}
                                    </select>
                                </div>
                            ) : uniqueKelas.length === 1 && (
                                <div className="flex flex-col gap-1.5 flex-1 sm:flex-none sm:w-[200px]">
                                    <label className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Kelas:</label>
                                    <div className="w-full rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 font-bold py-2.5 px-3 sm:px-4 text-[12px] sm:text-sm shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
                                        <Users className="h-4 w-4 shrink-0 text-emerald-600" />
                                        <span className="truncate">{uniqueKelas[0]}</span>
                                    </div>
                                </div>
                            )}
                            </>
                            )}
                        </div>

                        {/* Search */}
                        {jadwalList.length > 0 && (
                            <div className="flex flex-col gap-1.5 flex-1 sm:flex-none sm:w-[350px] w-full mt-3 sm:mt-0">
                                <label className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Cari Siswa:</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                    <input 
                                        type="text" 
                                        placeholder="Cari nama..." 
                                        value={searchName} 
                                        onChange={(e) => setSearchName(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#061e16] pl-10 pr-3 sm:pr-4 py-2.5 text-[12px] sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            {/* Notification Toast */}
            {saveSuccess && (
                <div className="fixed inset-x-0 top-8 z-[9999] flex justify-center">
                    <div className="bg-white text-slate-700 px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-200 animate-fade-in">
                        <CheckCircle className="h-5 w-5 text-slate-500 shrink-0" />
                        <p className="font-bold text-sm">Data nilai berhasil disimpan!</p>
                    </div>
                </div>
            )}

            {!isCurrentYearActive && !loadingTahunAjaran && selectedTahunAjaranId && dataNilai.length > 0 && jadwalList.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 p-4 rounded-xl flex items-center justify-center gap-2 font-medium text-sm animate-fade-in mt-6">
                    Mode Arsip (Read-Only). Tahun Ajaran ini sudah tidak aktif, data tidak dapat diubah.
                </div>
            )}

            {/* Area Data Nilai */}
            {jadwalList.length === 0 && !loading && !loadingTahunAjaran ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 flex flex-col items-center justify-center gap-4 text-center mt-6">
                    <BookOpen className="h-16 w-16 text-slate-300" />
                    <h2 className="text-xl font-bold text-slate-700">Belum Ada Jadwal Mengajar</h2>
                    <p className="text-slate-500 max-w-md text-sm">
                        Anda belum ditugaskan untuk mengajar pada tahun ajaran ini. Silakan hubungi admin akademik untuk informasi lebih lanjut.
                    </p>
                </div>
            ) : !selectedKelas ? (
                <div className="bg-white dark:bg-[#041610] rounded-3xl p-16 text-center border border-slate-200 dark:border-emerald-500/10 shadow-sm flex flex-col items-center justify-center gap-3 animate-fade-in mt-6">
                    <BookOpen className="h-12 w-12 text-slate-400 dark:text-emerald-500/40" />
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                        Pilih Kelas Terlebih Dahulu
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                        Silakan pilih kelas pada dropdown untuk memuat data nilai siswa.
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-[#041610] rounded-3xl border border-slate-200 dark:border-emerald-500/10 shadow-sm overflow-hidden animate-fade-in-up mt-6">
                    <div className="overflow-x-auto p-4">
                        <table className="w-full text-left text-xs whitespace-nowrap min-w-max border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="py-2 md:py-3 px-2 md:px-4 border-b border-r border-slate-200 text-center text-slate-500 font-bold uppercase tracking-wider static md:sticky md:left-0 md:z-30 bg-slate-50 w-12 md:w-16 min-w-[48px] md:min-w-[64px]">No</th>
                                    <th className="py-2 md:py-3 px-3 md:px-5 border-b border-r-[3px] border-slate-300 text-left text-slate-500 font-bold uppercase tracking-wider static md:sticky md:left-16 md:z-30 bg-slate-50 shadow-[4px_0_12px_rgba(0,0,0,0.03)] min-w-[200px] md:min-w-[250px]">Nama Siswa</th>
                                    <th className="py-2 px-2 border-b border-r border-slate-200 text-center text-slate-500 font-bold uppercase tracking-wider bg-slate-50 min-w-[80px]">Tugas</th>
                                    <th className="py-2 px-2 border-b border-r border-slate-200 text-center text-slate-500 font-bold uppercase tracking-wider bg-slate-50 min-w-[80px]">Praktik</th>
                                    <th className="py-2 px-2 border-b border-r border-slate-200 text-center text-slate-500 font-bold uppercase tracking-wider bg-slate-50 min-w-[80px]">UTS</th>
                                    <th className="py-2 px-2 border-b border-slate-200 text-center text-slate-500 font-bold uppercase tracking-wider bg-slate-50 min-w-[80px]">UAS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDataNilai.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center text-slate-500 border-b border-slate-200">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <BookOpen className="h-10 w-10 opacity-30" />
                                                <p className="text-sm">Tidak ada siswa ditemukan.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDataNilai.map((item, idx) => (
                                        <tr key={item.siswa_id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-1.5 md:py-2.5 px-2 md:px-4 w-12 md:w-16 min-w-[48px] md:min-w-[64px] border-b border-r border-slate-200 text-slate-500 font-medium text-center text-xs md:text-sm static md:sticky md:left-0 md:z-20 bg-white group-hover:bg-slate-50">
                                            {idx + 1}
                                        </td>
                                        <td className="py-1.5 md:py-2.5 px-3 md:px-5 min-w-[200px] md:min-w-[250px] border-b border-r-[3px] border-slate-300 static md:sticky md:left-16 md:z-20 bg-white group-hover:bg-slate-50 drop-shadow-sm">
                                            <p className="font-bold text-slate-800 text-xs md:text-sm">{item.nama_lengkap}</p>
                                        </td>


                                        <td className="py-1.5 md:py-2.5 px-2 border-b border-r border-slate-200">
                                            <input 
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                value={item.Tugas}
                                                onChange={(e) => handleInputChange(item.siswa_id, 'Tugas', e.target.value)}
                                                disabled={!isCurrentYearActive}
                                                className="w-full min-w-[80px] bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2 py-1.5 md:py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold disabled:opacity-50 text-xs md:text-sm shadow-sm"
                                            />
                                        </td>
                                        <td className="py-1.5 md:py-2.5 px-2 border-b border-r border-slate-200">
                                            <input 
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                value={item.Praktik}
                                                onChange={(e) => handleInputChange(item.siswa_id, 'Praktik', e.target.value)}
                                                disabled={!isCurrentYearActive}
                                                className="w-full min-w-[80px] bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2 py-1.5 md:py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold disabled:opacity-50 text-xs md:text-sm shadow-sm"
                                            />
                                        </td>
                                        <td className="py-1.5 md:py-2.5 px-2 border-b border-r border-slate-200">
                                            <input 
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                value={item.UTS}
                                                onChange={(e) => handleInputChange(item.siswa_id, 'UTS', e.target.value)}
                                                disabled={!isCurrentYearActive}
                                                className="w-full min-w-[80px] bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2 py-1.5 md:py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold disabled:opacity-50 text-xs md:text-sm shadow-sm"
                                            />
                                        </td>
                                        <td className="py-1.5 md:py-2.5 px-2 border-b border-r border-slate-200">
                                            <input 
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                value={item.UAS}
                                                onChange={(e) => handleInputChange(item.siswa_id, 'UAS', e.target.value)}
                                                disabled={!isCurrentYearActive}
                                                className="w-full min-w-[80px] bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2 py-1.5 md:py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold disabled:opacity-50 text-xs md:text-sm shadow-sm"
                                            />
                                        </td>
                                    </tr>
                                )))}
                            </tbody>
                        </table>
                    </div>
                    
                    {!loading && isCurrentYearActive && (
                        <div className="p-6 pt-2 flex justify-end">
                            <button 
                                onClick={handleSimpan}
                                disabled={isSaving}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50 shadow-md shadow-emerald-600/20"
                            >
                                {isSaving ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                ) : saveSuccess ? (
                                    <CheckCircle className="h-4 w-4" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                {isSaving ? 'Menyimpan...' : saveSuccess ? 'Tersimpan!' : 'Simpan'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function InputNilaiPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>}>
            <InputNilaiContent />
        </Suspense>
    );
}
