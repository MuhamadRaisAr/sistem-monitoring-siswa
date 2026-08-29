"use client";
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import { 
    BookOpen, Calendar, ZoomIn, X, CheckCircle2, Clock, XCircle, 
    Info, Search, Loader2, ChevronDown, ChevronLeft, Trash2, Users, Filter
} from 'lucide-react';
import { useTahunAjaran } from '@/hooks/useTahunAjaran';
import { getAbbreviatedMapel, getMapelSortIndex } from '@/utils/mapelHelper';

const KEHADIRAN_OPTIONS = [
    { key: 'hadir', label: 'Hadir', activeBg: 'bg-emerald-600 text-white border-emerald-600', inactiveBg: 'bg-white text-emerald-600 border-slate-300 hover:bg-emerald-50' },
    { key: 'sakit', label: 'Sakit', activeBg: 'bg-cyan-500 text-white border-cyan-500',   inactiveBg: 'bg-white text-cyan-500 border-slate-300 hover:bg-cyan-50' },
    { key: 'izin',  label: 'Izin',  activeBg: 'bg-amber-500 text-white border-amber-500',     inactiveBg: 'bg-white text-amber-500 border-slate-300 hover:bg-amber-50' },
    { key: 'alpa',  label: 'Alfa',  activeBg: 'bg-rose-500 text-white border-rose-500',     inactiveBg: 'bg-white text-rose-500 border-slate-300 hover:bg-rose-50' },
];

const PAGE_SIZE = 20;
const todayStr = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);


function GuruInputAbsensiContent() {
    const searchParams = useSearchParams();
    const { token } = useAuth();
    const [allLogs, setAllLogs] = useState({ today: [], all: [] });
    const [siswaList, setsiswaList] = useState([]);
    const [loading, setLoading] = useState(true);

    const [today, setToday] = useState(todayStr());
    const [searchName, setSearchName] = useState('');
    const [selectedKelas, setSelectedKelas] = useState('');
    const [selectedMapel, setSelectedMapel] = useState('');

    const mapelQuery = searchParams.get('mapel');

    // Load saved selections from sessionStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedKelas = sessionStorage.getItem('guruAbsensi_kelas');
            if (savedKelas) setSelectedKelas(savedKelas);
        }
    }, []);

    useEffect(() => {
        if (mapelQuery) {
            setSelectedMapel(mapelQuery);
        }
    }, [mapelQuery]);

    // Reset draft AND kelas AND date immediately when switching mapel
    useEffect(() => {
        setDraftKehadiran({});
        setSelectedKelas('');
    }, [selectedMapel]);

    // Save selections whenever they change
    useEffect(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('guruAbsensi_mapel', selectedMapel);
        }
    }, [selectedMapel]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('guruAbsensi_kelas', selectedKelas);
        }
    }, [selectedKelas]);
    const { 
        tahunAjaranList, 
        activeTahunAjaranList,
        activeTahunAjaran,
        selectedTahunAjaranId, 
        setSelectedTahunAjaranId,
        loadingTahunAjaran
    } = useTahunAjaran();

    const isCurrentYearActive = activeTahunAjaran?.id?.toString() === selectedTahunAjaranId;
    const [mapelList, setMapelList] = useState([]);
    const [rawJadwal, setRawJadwal] = useState([]);
    
    // State untuk mode input
    const [draftKehadiran, setDraftKehadiran] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const API_URL = '/api';

    // Fetch logs when date or tahun ajaran changes
    useEffect(() => {
        if (token && !loading && selectedTahunAjaranId) {
            fetchLogs(today);
        }
    }, [today, selectedTahunAjaranId]);

    const fetchLogs = async (dateOverride) => {
        try {
            const date = dateOverride ?? today;
            let url = `${API_URL}/akademik?start_date=${date}&end_date=${date}`;
            if (selectedTahunAjaranId) url += `&tahun_ajaran_id=${selectedTahunAjaranId}`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            const todayData = await res.json();
            
            // Just store all logs for today, we will filter by selectedMapel in a useEffect
            const todayLogsParsed = Array.isArray(todayData) ? todayData : [];
            setAllLogs({ today: todayLogsParsed, all: [] });

        } catch (err) { console.error(err); }
    };

    // Update draftKehadiran whenever selectedMapel, selectedKelas, or todayLogs changes
    useEffect(() => {
        if (!selectedMapel || !allLogs.today || !selectedKelas) {
            setDraftKehadiran({});
            return;
        }

        const classStudentIds = new Set(siswaList.filter(s => s.kelas === selectedKelas).map(s => s.id));
        
        const logsForMapel = allLogs.today.filter(l => 
            l.jenis_kegiatan === selectedMapel && classStudentIds.has(l.siswa_id)
        );
        const initialDraft = {};
        logsForMapel.forEach(log => {
            initialDraft[log.siswa_id] = log.kehadiran;
        });
        setDraftKehadiran(initialDraft);
    }, [selectedMapel, allLogs.today, selectedKelas, siswaList]);

    // Auto-update date when tahun ajaran changes
    useEffect(() => {
        if (!selectedTahunAjaranId || tahunAjaranList.length === 0) return;
        const selected = tahunAjaranList.find(t => t.id.toString() === selectedTahunAjaranId);
        if (selected) {
            if (selected.is_active === 1 || selected.is_active === true) {
                setToday(todayStr());
            } else {
                const match = (selected.nama_tahun || '').match(/^(\d{4})/);
                if (match) {
                    const startYear = match[1];
                    setToday(`${startYear}-08-01`); // Set default ke awal Agustus di tahun ajaran tsb
                }
            }
        }
    }, [selectedTahunAjaranId, tahunAjaranList]);

    const fetchsiswa = async () => {
        try {
            const res = await fetch(`${API_URL}/siswa?strict_jadwal=true`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            setsiswaList(Array.isArray(data) ? data.filter(s => s.status_aktif === 'aktif') : []);
        } catch (err) { console.error(err); }
    };

    const fetchJadwal = async (tahunId) => {
        if (!tahunId) return;
        try {
            const res = await fetch(`${API_URL}/jadwal/my-jadwal?tahun_ajaran_id=${tahunId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (Array.isArray(data)) {
                setRawJadwal(data);
            }
        } catch (err) { console.error('Gagal memuat jadwal guru', err); }
    };

    useEffect(() => {
        if (rawJadwal.length === 0) return;
        
        let filtered = rawJadwal;
        if (selectedKelas) {
            filtered = rawJadwal.filter(j => j.kelas === selectedKelas);
        }
        
        const mapels = Array.from(new Set(filtered.map(j => j.mata_pelajaran).filter(Boolean)));
        setMapelList(mapels);
    }, [rawJadwal, selectedKelas]);

    const allMapelOptions = useMemo(() => {
        return Array.from(new Set(rawJadwal.map(j => j.mata_pelajaran).filter(Boolean)))
            .sort((a, b) => getMapelSortIndex(a) - getMapelSortIndex(b));
    }, [rawJadwal]);

    useEffect(() => {
        // Auto-select if exactly 1 mapel is taught
        if (allMapelOptions.length === 1 && !selectedMapel) {
            setSelectedMapel(allMapelOptions[0]);
        }
    }, [allMapelOptions, selectedMapel]);

    const isSelectingMapel = allMapelOptions.length > 1 && !selectedMapel;

    useEffect(() => {
        if (!token) return;
        const init = async () => { setLoading(true); await Promise.all([fetchLogs(), fetchsiswa()]); setLoading(false); };
        init();
    }, [token]);

    // Refetch jadwal whenever tahun ajaran changes
    useEffect(() => {
        if (token && selectedTahunAjaranId) {
            fetchJadwal(selectedTahunAjaranId);
        }
    }, [token, selectedTahunAjaranId]);

    const todayLogs = allLogs.today ?? [];

    const handleSelectDraft = (siswaId, status) => {
        setDraftKehadiran(prev => {
            // Jika mengklik status yang sudah aktif, maka toggle-off (jadikan 'hapus')
            if (prev[siswaId] === status) {
                return { ...prev, [siswaId]: 'hapus' };
            }
            return {
                ...prev,
                [siswaId]: status
            };
        });
    };

    const handleSimpanSemua = async () => {
        if (!selectedMapel) {
            alert('Silakan pilih Mata Pelajaran terlebih dahulu!');
            return;
        }

        setIsSaving(true);
        try {
            const requests = Object.entries(draftKehadiran).map(async ([siswaId, kehadiran]) => {
                const existingLog = todayLogs.find(l => l.siswa_id === parseInt(siswaId) && l.jenis_kegiatan === selectedMapel);
                if (existingLog && existingLog.kehadiran === kehadiran) {
                    return Promise.resolve();
                }

                if (existingLog) {
                    await fetch(`${API_URL}/akademik/${existingLog.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                }

                if (kehadiran === 'hapus') {
                    return Promise.resolve();
                }

                const payload = {
                    siswa_id: parseInt(siswaId),
                    jenis_kegiatan: selectedMapel,
                    tanggal: today,
                    kehadiran: kehadiran,
                    deskripsi: '',
                    tahun_ajaran_id: selectedTahunAjaranId
                };

                return fetch(`${API_URL}/akademik`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            });

            await Promise.all(requests);
            await fetchLogs();
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan saat menyimpan absensi.');
        } finally {
            setIsSaving(false);
        }
    };

    const uniqueKelas = useMemo(() => {
        if (!selectedMapel) return [];
        let classesForMapel = new Set(rawJadwal.filter(j => j.mata_pelajaran === selectedMapel).map(j => j.kelas));

        const kelasSet = new Set(siswaList.map(s => s.kelas).filter(Boolean));
        let arr = Array.from(kelasSet);
        arr = arr.filter(k => classesForMapel.has(k));

        const romanMap = {
            'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6,
            'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12
        };
        const getVal = (str) => {
            if (!str) return 0;
            const match = str.trim().split(/[\s()]/)[0].toUpperCase();
            return romanMap[match] || 999;
        };
        return arr.sort((a, b) => {
            const valA = getVal(a);
            const valB = getVal(b);
            if (valA !== valB) return valA - valB;
            return a.localeCompare(b);
        });
    }, [siswaList, rawJadwal, selectedMapel]);

    useEffect(() => {
        if (uniqueKelas.length === 1) {
            setSelectedKelas(uniqueKelas[0]);
        } else if (selectedKelas && !uniqueKelas.includes(selectedKelas)) {
            setSelectedKelas('');
        }
    }, [uniqueKelas, selectedKelas]);

    const filteredsiswa = useMemo(() => {
        return siswaList.filter(s => {
            const matchName = !searchName || s.nama_lengkap.toLowerCase().includes(searchName.toLowerCase());
            const matchKelas = !selectedKelas || s.kelas === selectedKelas;
            return matchName && matchKelas;
        });
    }, [siswaList, searchName, selectedKelas]);

    const absensiRows = filteredsiswa.map(siswa => ({ siswa }));

    const getDayName = (dateStr) => {
        if (!dateStr) return null;
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        return days[new Date(dateStr).getDay()];
    };

    const scheduleDay = selectedMapel && selectedKelas ? rawJadwal.find(j => j.mata_pelajaran === selectedMapel && j.kelas === selectedKelas)?.hari : null;
    const selectedDateDay = today ? getDayName(today) : null;
    const isCorrectDay = (scheduleDay && scheduleDay !== '-' && selectedDateDay) ? scheduleDay === selectedDateDay : true;
    const isInputLocked = !isCurrentYearActive || !isCorrectDay;

    return (
        <div className="space-y-6">
            {/* Toast Notification */}
            <div className={`fixed inset-x-0 top-8 z-[9999] flex justify-center transition-all duration-500 ease-in-out ${
                saveSuccess ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'
            }`}>
                <div className="flex items-center gap-3 bg-white text-slate-700 px-6 py-4 rounded-2xl shadow-xl border border-slate-200">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-slate-500" />
                    <p className="font-bold text-sm">Absensi Berhasil Disimpan!</p>
                </div>
            </div>
            <div className="w-full">
                <div className="mb-4">
                    <h1 className="text-2xl font-extrabold text-[#0a2351] tracking-tight mb-1">Input Absensi Harian</h1>
                    {selectedMapel && (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-slate-500 text-sm md:text-base mt-2">
                            <span>Mata Pelajaran: <span className="font-bold text-[#0a2351]">{selectedMapel}</span></span>
                            <span className="hidden sm:inline text-slate-300">|</span>
                            <span className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                <span>
                                    Jadwal: <span className="font-bold text-[#0a2351]">
                                        {(() => {
                                            const schedules = rawJadwal.filter(j => j.mata_pelajaran === selectedMapel && (!selectedKelas || j.kelas === selectedKelas));
                                            const uniqueDays = Array.from(new Set(schedules.map(s => s.hari).filter(Boolean)));
                                            return uniqueDays.length > 0 ? uniqueDays.join(', ') : '-';
                                        })()}
                                    </span>
                                </span>
                                
                                <input 
                                    type="date"
                                    value={today}
                                    max={todayStr()}
                                    onChange={(e) => setToday(e.target.value)}
                                    className="rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-sm font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none cursor-pointer shadow-sm"
                                    title="Pilih Tanggal Absensi"
                                />
                            </span>
                        </div>
                    )}
                </div>
                
                <div className="flex flex-col gap-4 animate-fade-in">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4 w-full">
                        {/* Tahun Ajaran & Kelas Group */}
                        <div className="grid grid-cols-2 sm:flex sm:flex-row w-full sm:w-auto gap-3 sm:gap-4">
                            {/* Tahun Ajaran */}
                            <div className="flex flex-col gap-1.5 w-full sm:w-[200px]">
                                <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Tahun Ajaran:</label>
                                {activeTahunAjaranList && activeTahunAjaranList.length === 1 ? (
                                    <div className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 sm:px-4 text-[12px] sm:text-sm font-semibold text-slate-800 flex items-center whitespace-nowrap overflow-hidden text-ellipsis shadow-sm">
                                        {activeTahunAjaranList[0].nama_tahun} {activeTahunAjaranList[0].semester}
                                    </div>
                                ) : (
                                    <select
                                        value={selectedTahunAjaranId}
                                        onChange={(e) => setSelectedTahunAjaranId(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 sm:px-4 text-[12px] sm:text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none cursor-pointer text-ellipsis shadow-sm"
                                    >
                                        {loadingTahunAjaran ? (
                                            <option>Memuat...</option>
                                        ) : !activeTahunAjaranList || activeTahunAjaranList.length === 0 ? (
                                            <option value="">Tidak ada tahun ajaran aktif</option>
                                        ) : (
                                            activeTahunAjaranList.map((ta) => (
                                                <option key={ta.id} value={ta.id}>
                                                    {ta.nama_tahun} {ta.semester}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                )}
                            </div>

                            {/* Kelas */}
                            {rawJadwal.length > 0 && (
                                <>
                                    {uniqueKelas.length > 1 ? (
                                        <div className="flex flex-col gap-1.5 w-full sm:w-[200px]">
                                            <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Kelas:</label>
                                            <select
                                                value={selectedKelas}
                                                onChange={(e) => setSelectedKelas(e.target.value)}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 sm:px-4 text-[12px] sm:text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none cursor-pointer text-ellipsis shadow-sm"
                                            >
                                                <option value="">-- Pilih Kelas --</option>
                                                {uniqueKelas.map(k => (
                                                    <option key={k} value={k}>{k}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : uniqueKelas.length === 1 && (
                                        <div className="flex flex-col gap-1.5 w-full sm:w-[200px]">
                                            <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Kelas:</label>
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
                        {rawJadwal.length > 0 && (
                            <div className="flex flex-col gap-1.5 w-full sm:w-[350px] mt-3 sm:mt-0">
                                <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Cari Siswa:</label>
                                <div className="relative w-full">
                                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                    <input type="text" placeholder="Cari nama..." value={searchName} onChange={e => setSearchName(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-[13px] sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none shadow-sm" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {!isCurrentYearActive && !loadingTahunAjaran && selectedTahunAjaranId && rawJadwal.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 p-4 rounded-xl flex items-center justify-center gap-2 font-medium text-sm animate-fade-in w-full mt-4">
                        Mode Arsip (Read-Only). Tahun Ajaran ini sudah tidak aktif, data tidak dapat diubah.
                    </div>
                )}

            </div>


            {rawJadwal.length === 0 && !loading && !loadingTahunAjaran ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 flex flex-col items-center justify-center gap-4 text-center mt-6">
                    <BookOpen className="h-16 w-16 text-slate-300" />
                    <h2 className="text-xl font-bold text-slate-700">Belum Ada Jadwal Mengajar</h2>
                    <p className="text-slate-500 max-w-md text-sm">
                        Anda belum ditugaskan untuk mengajar pada tahun ajaran ini. Silakan hubungi admin akademik untuk informasi lebih lanjut.
                    </p>
                </div>
            ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in mt-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap min-w-max border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="py-2 px-2 md:py-3 md:px-3 border-b border-r border-slate-200 text-center text-slate-500 font-bold uppercase tracking-wider text-[10px] md:text-xs static md:sticky md:left-0 md:z-10 bg-slate-50 w-8 md:w-12">No</th>
                                <th className="py-2 px-2 md:py-3 md:px-4 border-b border-r-[3px] border-slate-300 text-left text-slate-500 font-bold uppercase tracking-wider text-[10px] md:text-xs static md:sticky md:left-12 md:z-10 bg-slate-50 shadow-[4px_0_12px_rgba(0,0,0,0.03)] min-w-[140px] md:min-w-[180px]">Nama Siswa</th>
                                <th className="py-2 px-2 md:py-3 md:px-3 border-b border-r border-slate-200 text-center text-slate-500 font-bold uppercase tracking-wider text-[10px] md:text-xs bg-slate-50 w-20 md:w-28">Kelas</th>
                                <th className="py-2 px-2 md:py-3 md:px-3 border-b border-slate-200 text-center text-slate-500 font-bold uppercase tracking-wider text-[10px] md:text-xs bg-slate-50 min-w-[280px] md:min-w-[360px]">Status Kehadiran</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="py-16 text-center border-b border-slate-200">
                                        <div className="flex h-full w-full items-center justify-center">
                                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                                        </div>
                                    </td>
                                </tr>
                            ) : !selectedMapel ? (
                                <tr>
                                    <td colSpan={4} className="py-16 text-center text-slate-500 border-b border-slate-200">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <BookOpen className="h-10 w-10 opacity-30" />
                                            <p>Silakan pilih Mata Pelajaran dari menu sidebar terlebih dahulu.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : uniqueKelas.length > 1 && !selectedKelas ? (
                                <tr>
                                    <td colSpan={4} className="py-16 text-center text-slate-500 border-b border-slate-200">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <Users className="h-10 w-10 opacity-30" />
                                            <p>Silakan pilih kelas terlebih dahulu.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredsiswa.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-16 text-center text-slate-500 border-b border-slate-200">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <BookOpen className="h-10 w-10 opacity-30" />
                                            <p className="text-sm">Tidak ada siswa ditemukan.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                absensiRows.map(({ siswa }, idx) => {
                                    const currentStatus = draftKehadiran[siswa.id];
                                    const globalIndex = idx + 1;

                                    return (
                                            <tr key={siswa.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="py-1.5 px-2 md:py-2.5 md:px-3 border-b border-r border-slate-200 text-slate-500 font-medium text-center text-xs md:text-sm static md:sticky md:left-0 md:z-[5] bg-white group-hover:bg-slate-50">{globalIndex}</td>
                                                <td className="py-1.5 px-2 md:py-2.5 md:px-4 border-b border-r-[3px] border-slate-300 static md:sticky md:left-12 md:z-[5] bg-white group-hover:bg-slate-50 drop-shadow-sm">
                                                    <p className="font-bold text-slate-800 text-xs md:text-sm truncate max-w-[140px] md:max-w-none">{siswa.nama_lengkap}</p>
                                                </td>
                                                <td className="py-1.5 px-2 md:py-2.5 md:px-3 border-b border-r border-slate-200 text-slate-600 text-center font-bold text-xs md:text-sm">Kelas {siswa.kelas}</td>
                                                <td className="py-1.5 px-2 md:py-2.5 md:px-3 border-b border-slate-200">
                                                    {!isCorrectDay ? (
                                                        <p className="text-center text-xs md:text-sm italic text-slate-400">Silahkan pilih hari sesuai jadwal</p>
                                                    ) : (
                                                    <div className="flex justify-center gap-1.5 md:gap-2">
                                                        {KEHADIRAN_OPTIONS.map(opt => {
                                                            const isActive = currentStatus === opt.key;
                                                            const btnStyle = isActive ? opt.activeBg : opt.inactiveBg;
                                                            return (
                                                                <button
                                                                    key={opt.key}
                                                                    onClick={() => handleSelectDraft(siswa.id, opt.key)}
                                                                    disabled={isInputLocked}
                                                                    className={`w-[54px] md:w-[72px] py-1 md:py-1.5 text-[10px] md:text-xs font-bold rounded-md md:rounded-lg border transition-all shadow-sm ${isInputLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'} ${btnStyle}`}
                                                                >
                                                                    {opt.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer: Save Button */}
                        {!loading && selectedMapel && !(uniqueKelas.length > 1 && !selectedKelas) && filteredsiswa.length > 0 && (
                            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50">
                            <p className="text-xs text-slate-500">
                                <span className="font-bold text-slate-700">{Object.keys(draftKehadiran).length}</span> dari <span className="font-bold text-slate-700">{filteredsiswa.length}</span> siswa sudah diisi
                            </p>
                            {!isInputLocked && (
                                <button 
                                    onClick={handleSimpanSemua}
                                    disabled={isSaving || Object.keys(draftKehadiran).length === 0 || saveSuccess}
                                    className={`px-4 py-2 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md flex items-center justify-center whitespace-nowrap gap-2 transition-colors cursor-pointer ${saveSuccess ? 'bg-emerald-500' : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300'}`}
                                >
                                    {isSaving ? (
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    ) : saveSuccess ? (
                                        <CheckCircle2 className="h-4 w-4" />
                                    ) : null}
                                    {saveSuccess ? 'Berhasil Disimpan!' : 'Simpan Absensi'}
                                </button>
                            )}
                        </div>
                        )}
            </div>
        )}
        </div>
    );
}

export default function GuruInputAbsensiPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>}>
            <GuruInputAbsensiContent />
        </Suspense>
    );
}

