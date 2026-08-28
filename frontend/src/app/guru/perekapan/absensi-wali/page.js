"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
    BookOpen, Calendar, ZoomIn, X, CheckCircle2, Clock, XCircle, 
    Info, Search, Loader2, ChevronDown, Trash2, Users
} from 'lucide-react';
import { useTahunAjaran } from '@/hooks/useTahunAjaran';
import { getAbbreviatedMapel } from '@/utils/mapelHelper';

export default function RekapAbsensiPage() {
    const { token, user } = useAuth();
    const isWaliKelas = !!user?.is_wali_kelas;
    const waliKelasName = isWaliKelas && user?.kelas_wali?.length > 0 ? user.kelas_wali[0].nama_kelas : null;

    // Loading states
    const [loading, setLoading] = useState(true);
    const [loadingLogs, setLoadingLogs] = useState(false);

    // Metadata lists
    const [siswaList, setsiswaList] = useState([]);
    const [kelasOptions, setKelasOptions] = useState([]);
    const [selectedKelas, setSelectedKelas] = useState('');
    const [selectedBulan, setSelectedBulan] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const { tahunAjaranList, selectedTahunAjaranId, setSelectedTahunAjaranId, loadingTahunAjaran } = useTahunAjaran();

    const [waliLogs, setWaliLogs] = useState([]);
    const [jadwal, setJadwal] = useState([]);
    const [detailModalAct, setDetailModalAct] = useState(null);
    const [detailStudent, setDetailStudent] = useState(null); // Added for student detail view
    const [lightboxSrc, setLightboxSrc] = useState(null);

    const API_URL = '/api';

    // 1. Initial Load: siswa and Class options
    useEffect(() => {
        if (!token) return;

        const init = async () => {
            setLoading(true);
            try {
                const ressiswa = await fetch(`${API_URL}/siswa`, { headers: { 'Authorization': `Bearer ${token}` } });
                const resJadwal = await fetch(`${API_URL}/jadwal`, { headers: { 'Authorization': `Bearer ${token}` } });
                const siswaData = await ressiswa.json();
                const jadwalData = await resJadwal.json();
                let activesiswa = Array.isArray(siswaData) ? siswaData.filter(s => s.status_aktif === 'aktif') : [];
                
                setsiswaList(activesiswa);

                const sortRoman = (arr) => {
                    const romanMap = {
                        'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6,
                        'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12
                    };
                    const getVal = (str) => {
                        if (!str) return 0;
                        const match = str.trim().split(/[\s()]/)[0].toUpperCase();
                        return romanMap[match] || 999;
                    };
                    return [...arr].sort((a, b) => {
                        const valA = getVal(a);
                        const valB = getVal(b);
                        if (valA !== valB) return valA - valB;
                        return a.localeCompare(b);
                    });
                };

                const uniqueK = sortRoman(Array.from(new Set(activesiswa.map(s => s.kelas).filter(Boolean))));
                
                let allowedClasses = new Set();
                if (user?.kelas_wali) {
                    user.kelas_wali.forEach(k => allowedClasses.add(k.nama_kelas));
                }
                
                let finalKelasOptions = sortRoman(Array.from(allowedClasses));
                
                setKelasOptions(finalKelasOptions);
                setJadwal(Array.isArray(jadwalData) ? jadwalData : []);
                if (finalKelasOptions.length === 1) {
                    setSelectedKelas(finalKelasOptions[0]);
                }
            } catch (err) {
                console.error("Init error:", err);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [token, isWaliKelas, user]);



    // 2. Fetch Logs and Schedules when Selected Kelas changes
    useEffect(() => {
        if (!token || !selectedKelas || !selectedTahunAjaranId) return;

        const fetchClassLogs = async () => {
            setLoadingLogs(true);
            try {
                const resLogs = await fetch(`${API_URL}/akademik?kelas=${encodeURIComponent(selectedKelas)}&tahun_ajaran_id=${selectedTahunAjaranId}`, { 
                    headers: { 'Authorization': `Bearer ${token}` } 
                });
                const logsData = await resLogs.json();
                setWaliLogs(Array.isArray(logsData) ? logsData : []);
            } catch (err) {
                console.error("Fetch logs error:", err);
            } finally {
                setLoadingLogs(false);
            }
        };

        fetchClassLogs();
    }, [selectedKelas, token, selectedTahunAjaranId]);

    const handleDeleteLog = async (logId) => {
        if (!confirm("Apakah Anda yakin ingin menghapus data absensi ini?")) return;
        setLoadingLogs(true);
        try {
            const res = await fetch(`${API_URL}/akademik/${logId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const resLogs = await fetch(`${API_URL}/akademik?kelas=${encodeURIComponent(selectedKelas)}&tahun_ajaran_id=${selectedTahunAjaranId}`, { 
                    headers: { 'Authorization': `Bearer ${token}` } 
                });
                const logsData = await resLogs.json();
                setWaliLogs(Array.isArray(logsData) ? logsData : []);
                
                // Update current modal state if open
                if (detailModalAct) {
                    const updatedLogs = (Array.isArray(logsData) ? logsData : []).filter(l => l.jenis_kegiatan === detailModalAct.id);
                    if (updatedLogs.length === 0) {
                        setDetailModalAct(null);
                    } else {
                        const total = updatedLogs.length;
                        const hadir = updatedLogs.filter(l => l.kehadiran === 'hadir').length;
                        const izinSakit = updatedLogs.filter(l => l.kehadiran === 'izin' || l.kehadiran === 'sakit').length;
                        const skor = hadir + (izinSakit * 0.5);
                        const persentase = total > 0 ? (skor / total) * 100 : 0;
                        setDetailModalAct({
                            ...detailModalAct,
                            logs: updatedLogs,
                            persentase
                        });
                    }
                }
            } else {
                const errData = await res.json();
                alert(errData.message || 'Gagal menghapus data absensi.');
            }
        } catch (err) {
            console.error("Delete error:", err);
            alert("Terjadi kesalahan saat menghapus data.");
        } finally {
            setLoadingLogs(false);
        }
    };

    const [editLogModal, setEditLogModal] = useState(null);

    const handleUpdateKehadiran = async (newKehadiran) => {
        if (!editLogModal) return;
        setLoadingLogs(true);
        try {
            const formData = new FormData();
            formData.append('siswa_id', editLogModal.siswa_id);
            formData.append('jenis_kegiatan', editLogModal.jenis_kegiatan);
            formData.append('tanggal', editLogModal.tanggal);
            formData.append('kehadiran', newKehadiran);
            if (editLogModal.deskripsi) formData.append('deskripsi', editLogModal.deskripsi);
            if (editLogModal.semester) formData.append('semester', editLogModal.semester);

            const res = await fetch(`${API_URL}/akademik/${editLogModal.id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                const resLogs = await fetch(`${API_URL}/akademik?kelas=${encodeURIComponent(selectedKelas)}&tahun_ajaran_id=${selectedTahunAjaranId}`, { 
                    headers: { 'Authorization': `Bearer ${token}` } 
                });
                const logsData = await resLogs.json();
                setWaliLogs(Array.isArray(logsData) ? logsData : []);
                
                if (detailModalAct) {
                    const updatedLogs = (Array.isArray(logsData) ? logsData : []).filter(l => l.jenis_kegiatan === detailModalAct.id);
                    const total = updatedLogs.length;
                    const hadir = updatedLogs.filter(l => l.kehadiran === 'hadir').length;
                    const izinSakit = updatedLogs.filter(l => l.kehadiran === 'izin' || l.kehadiran === 'sakit').length;
                    const skor = hadir + (izinSakit * 0.5);
                    const persentase = total > 0 ? (skor / total) * 100 : 0;
                    setDetailModalAct({
                        ...detailModalAct,
                        logs: updatedLogs,
                        persentase
                    });
                }
                setEditLogModal(null);
            } else {
                const errData = await res.json();
                alert(errData.message || 'Gagal mengubah data absensi.');
            }
        } catch (err) {
            console.error("Update error:", err);
            alert("Terjadi kesalahan saat mengubah data.");
        } finally {
            setLoadingLogs(false);
        }
    };

    // Filter students by selected class and search query
    const availableStudents = useMemo(() => {
        if (!selectedKelas) return [];
        let filtered = siswaList.filter(s => s.kelas === selectedKelas);
        
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(s => 
                s.nama_lengkap.toLowerCase().includes(q) || 
                (s.nis && s.nis.toLowerCase().includes(q)) || 
                (s.nisn && s.nisn.toLowerCase().includes(q))
            );
        }
        
        return filtered;
    }, [selectedKelas, siswaList, searchQuery]);

    // Helper untuk mendapatkan jam mulai mapel pada hari tertentu
    const getHariFromDate = (dateStr) => {
        const d = new Date(dateStr);
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        return days[d.getDay()];
    };

    const getJamMulai = (log, jadwalArr) => {
        const hari = getHariFromDate(log.tanggal);
        const j = jadwalArr.find(x => x.mata_pelajaran === log.jenis_kegiatan && x.hari === hari);
        return j?.jam_mulai || '23:59:59';
    };

    const availableMonths = useMemo(() => {
        if (!selectedTahunAjaranId || tahunAjaranList.length === 0) return [];
        const ta = tahunAjaranList.find(t => t.id.toString() === selectedTahunAjaranId.toString());
        if (!ta) return [];

        const years = ta.nama_tahun.split('/');
        if (years.length !== 2) return [];

        const startYear = parseInt(years[0], 10);
        const endYear = parseInt(years[1], 10);
        
        const months = [];
        if (ta.semester.toLowerCase() === 'ganjil') {
            for (let i = 7; i <= 12; i++) {
                months.push(`${startYear}-${String(i).padStart(2, '0')}`);
            }
        } else {
            for (let i = 1; i <= 6; i++) {
                months.push(`${endYear}-${String(i).padStart(2, '0')}`);
            }
        }
        return months;
    }, [selectedTahunAjaranId, tahunAjaranList]);

    useEffect(() => {
        if (availableMonths.length > 0 && (!selectedBulan || !availableMonths.includes(selectedBulan))) {
            const currentMonthStr = new Date().toISOString().substring(0, 7);
            if (availableMonths.includes(currentMonthStr)) {
                setSelectedBulan(currentMonthStr);
            } else {
                setSelectedBulan(availableMonths[0]);
            }
        }
    }, [availableMonths, selectedBulan]);

    const { firstLogDate, lastLogDate } = useMemo(() => {
        if (!selectedKelas || !selectedBulan) return { firstLogDate: null, lastLogDate: null };
        const logs = waliLogs.filter(l => l.tanggal && l.tanggal.startsWith(selectedBulan));
        if (logs.length === 0) return { firstLogDate: null, lastLogDate: null };
        
        const sortedDates = logs.map(l => l.tanggal).sort();
        return {
            firstLogDate: sortedDates[0],
            lastLogDate: sortedDates[sortedDates.length - 1]
        };
    }, [waliLogs, selectedKelas, selectedBulan]);

    const uniqueDates = useMemo(() => {
        if (!selectedKelas || !selectedBulan) return [];
        
        const [year, month] = selectedBulan.split('-');
        const numDays = new Date(year, month, 0).getDate();
        
        const dates = [];
        for (let i = 1; i <= numDays; i++) {
            const dateStr = `${year}-${month}-${String(i).padStart(2, '0')}`;
            dates.push(dateStr);
        }
        return dates;
    }, [selectedKelas, selectedBulan]);

    // Class-wide Recap Stats Matrix
    const kelasStatsRows = useMemo(() => {
        if (!selectedKelas || availableStudents.length === 0) return [];

        return availableStudents.map(student => {
            const studentLogs = waliLogs.filter(l => l.siswa_id === student.id);
            let filteredLogs = studentLogs;

            const logsByDate = {};
            filteredLogs.forEach(log => {
                if (!log.tanggal) return;
                const d = new Date(log.tanggal);
                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                
                if (!logsByDate[dateStr]) {
                    logsByDate[dateStr] = log;
                } else {
                    const currentJamMulai = getJamMulai(logsByDate[dateStr], jadwal);
                    const newJamMulai = getJamMulai(log, jadwal);
                    
                    if (newJamMulai < currentJamMulai) {
                        logsByDate[dateStr] = log;
                    }
                }
            });

            return {
                ...student,
                logsByDate
            };
        });
    }, [waliLogs, availableStudents, selectedKelas, jadwal]);



    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                    Rekap Absensi Wali Kelas
                </h1>
                {selectedKelas ? (
                    <div className="mt-1">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            Rekap Kehadiran Kelas {selectedKelas} | {(() => {
                                const ta = tahunAjaranList.find(t => t.id.toString() === selectedTahunAjaranId?.toString());
                                return ta ? `${ta.nama_tahun} ${ta.semester}` : '-';
                            })()}
                        </p>
                    </div>
                ) : (
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Laporan akumulasi absensi siswa
                    </p>
                )}
            </div>

            {/* Selectors */}
            <div className="flex flex-col gap-4 animate-fade-in">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4 w-full">
                    <div className="grid grid-cols-2 sm:flex sm:flex-row w-full sm:w-auto gap-3 sm:gap-4">
                    {/* Tahun Ajaran */}
                    <div className="flex flex-col gap-1.5 w-full sm:w-[200px]">
                        <label className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Tahun Ajaran:</label>
                        <select 
                            value={selectedTahunAjaranId} 
                            onChange={e => setSelectedTahunAjaranId(e.target.value)}
                            disabled={loadingTahunAjaran}
                            className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#061e16] py-2.5 px-3 sm:px-4 text-[12px] sm:text-sm font-semibold text-slate-700 dark:text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-sm text-ellipsis overflow-hidden disabled:opacity-50"
                        >
                            {loadingTahunAjaran ? (
                                <option>Memuat...</option>
                            ) : tahunAjaranList.length === 0 ? (
                                <option value="">Tidak ada data</option>
                            ) : (
                                tahunAjaranList.map(ta => (
                                    <option key={ta.id} value={ta.id}>
                                        {ta.nama_tahun} {ta.semester}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                    
                    {/* Kelas */}
                    {kelasOptions.length > 1 && (
                        <div className="flex flex-col gap-1.5 w-full sm:w-[200px]">
                            <label className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Kelas:</label>
                            <select
                                value={selectedKelas}
                                onChange={(e) => setSelectedKelas(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#061e16] py-2.5 px-3 sm:px-4 text-[12px] sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:outline-none cursor-pointer text-ellipsis shadow-sm"
                            >
                                <option value="">-- Pilih Kelas --</option>
                                {kelasOptions.map(k => (
                                    <option key={k} value={k}>
                                        Kelas {k.replace(/\s*\(.*\)/g, '')}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    
                    {/* Bulan */}
                    {availableMonths.length > 0 && (
                        <div className="flex flex-col gap-1.5 w-full sm:w-[200px]">
                            <label className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Bulan:</label>
                            <select
                                value={selectedBulan}
                                onChange={(e) => setSelectedBulan(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#061e16] py-2.5 px-3 sm:px-4 text-[12px] sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:outline-none cursor-pointer text-ellipsis shadow-sm"
                            >
                                {availableMonths.map(m => {
                                    const dateObj = new Date(m + '-01');
                                    const monthName = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                                    return (
                                        <option key={m} value={m}>
                                            {monthName}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    )}

                    </div>

                    {/* Search Bar */}
                    <div className="flex flex-col gap-1.5 w-full sm:w-[350px] mt-3 sm:mt-0">
                        <label className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Cari Siswa:</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Ketik nama atau NIS..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#061e16] pl-10 pr-3 sm:pr-4 py-2.5 text-[12px] sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>



            {selectedKelas ? (
                <>
                    {/* Class Table */}
                    <div className="bg-white dark:bg-[#041610] rounded-2xl border border-slate-200 dark:border-emerald-500/10 shadow-sm overflow-hidden animate-fade-in">

                        {loadingLogs ? (
                            <div className="flex h-40 items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-500" />
                            </div>
                        ) : kelasStatsRows.length === 0 ? (
                            <div className="text-center py-16 text-slate-500 flex flex-col items-center gap-3">
                                <BookOpen className="h-10 w-10 opacity-30" />
                                <p className="text-sm font-medium">Tidak ada data siswa di kelas ini.</p>
                            </div>

                        ) : (
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left text-xs whitespace-nowrap min-w-max border-separate border-spacing-0">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-[#061e16] border-b border-slate-300 dark:border-emerald-500/10">
                                            <th className="py-2 px-1 md:px-2 w-8 md:w-10 min-w-[32px] md:min-w-[40px] static md:sticky md:left-0 md:z-20 bg-slate-50 dark:bg-[#061e16] border-b border-r border-slate-300 dark:border-emerald-500/10 text-slate-800 dark:text-slate-300 font-extrabold text-center text-xs align-middle" rowSpan={2}>No</th>
                                            <th className="py-2 px-2 md:px-3 min-w-[150px] md:min-w-[180px] w-[150px] md:w-[180px] static md:sticky md:left-8 md:left-10 md:z-20 bg-slate-50 dark:bg-[#061e16] border-b border-slate-300 border-r-[3px] border-slate-400 dark:border-emerald-500/30 text-slate-800 dark:text-slate-300 font-extrabold text-left text-[10px] md:text-xs align-middle drop-shadow-md" rowSpan={2}>Nama Siswa</th>
                                            <th className="py-1.5 text-center text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#061e16]" colSpan={uniqueDates.length || 1}>
                                                Bulan {selectedBulan ? new Date(selectedBulan + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : ''}
                                            </th>
                                            <th className="py-1.5 px-2 text-center text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 border-b border-l-[3px] border-slate-400 dark:border-emerald-500/30 bg-slate-50 dark:bg-[#061e16]" colSpan={3}>
                                                Jumlah
                                            </th>
                                        </tr>
                                        <tr className="bg-slate-50 dark:bg-[#061e16] border-b border-slate-300 dark:border-emerald-500/10">
                                            {uniqueDates.length > 0 ? uniqueDates.map((date, idx) => {
                                                const title = new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                                                const dObj = new Date(date);
                                                const dateLabel = `${String(dObj.getDate()).padStart(2, '0')}`;
                                                
                                                const isSunday = dObj.getDay() === 0;
                                                const hasLog = waliLogs.some(l => {
                                                    if (!l.tanggal) return false;
                                                    const logD = new Date(l.tanggal);
                                                    const logDateStr = `${logD.getFullYear()}-${String(logD.getMonth() + 1).padStart(2, '0')}-${String(logD.getDate()).padStart(2, '0')}`;
                                                    return logDateStr === date;
                                                });
                                                
                                                let isLibur = false;
                                                if (isSunday) {
                                                    isLibur = true;
                                                } else if (!hasLog && firstLogDate && lastLogDate) {
                                                    if (date >= firstLogDate && date <= lastLogDate) {
                                                        isLibur = true;
                                                    }
                                                }
                                                
                                                return (
                                                    <th key={idx} className={`py-1 md:py-2 px-0 text-center text-[9px] md:text-[10px] w-[18px] md:w-[22px] min-w-[18px] md:min-w-[22px] align-middle border-b border-l border-slate-300 dark:border-emerald-500/10 ${isLibur ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`} title={title}>
                                                        <div className={`flex justify-center font-extrabold mx-auto ${isLibur ? 'text-red-500 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                                            {dateLabel}
                                                        </div>
                                                    </th>
                                                );
                                            }) : (
                                                <th className="py-1 px-1 text-center text-[10px] min-w-[32px] align-middle border-l border-slate-300 dark:border-emerald-500/10">
                                                    
                                                </th>
                                            )}
                                            <th className="py-1 md:py-2 px-0 w-[24px] md:w-[28px] min-w-[24px] md:min-w-[28px] max-w-[24px] md:max-w-[28px] text-center text-[9px] md:text-[10px] font-extrabold text-amber-500 bg-amber-50/50 dark:bg-amber-900/10 border-b border-l-[3px] border-slate-400 dark:border-emerald-500/30">S</th>
                                            <th className="py-1 md:py-2 px-0 w-[24px] md:w-[28px] min-w-[24px] md:min-w-[28px] max-w-[24px] md:max-w-[28px] text-center text-[9px] md:text-[10px] font-extrabold text-cyan-600 bg-cyan-50/50 dark:bg-cyan-900/10 border-b border-l border-slate-300 dark:border-emerald-500/10">I</th>
                                            <th className="py-1 md:py-2 px-0 w-[24px] md:w-[28px] min-w-[24px] md:min-w-[28px] max-w-[24px] md:max-w-[28px] text-center text-[9px] md:text-[10px] font-extrabold text-rose-600 bg-rose-50/50 dark:bg-rose-900/10 border-b border-l border-slate-300 dark:border-emerald-500/10">A</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-300 dark:divide-emerald-500/10">
                                        {kelasStatsRows.map((s, idx) => (
                                            <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                                <td className="py-1.5 px-1 md:px-2 static md:sticky md:left-0 md:z-20 bg-white dark:bg-[#041610] border-b border-r border-slate-300 dark:border-emerald-500/10 text-center font-semibold text-slate-500 text-[10px] md:text-xs w-8 md:w-10 min-w-[32px] md:min-w-[40px]">
                                                    {idx + 1}
                                                </td>
                                                <td className="py-1.5 px-2 md:px-3 static md:sticky md:left-8 md:left-10 md:z-20 bg-white dark:bg-[#041610] border-b border-slate-300 border-r-[3px] border-slate-400 dark:border-emerald-500/30 drop-shadow-md group-hover:bg-slate-50/50 dark:group-hover:bg-white/[0.02] min-w-[150px] md:min-w-[180px] w-[150px] md:w-[180px]">
                                                    <p className="font-extrabold text-[10px] md:text-[11px] text-slate-850 dark:text-white leading-tight truncate w-full" title={s.nama_lengkap}>{s.nama_lengkap}</p>
                                                </td>
                                                {uniqueDates.length > 0 ? uniqueDates.map((date, idx) => {
                                                    const log = s.logsByDate[date];
                                                    const isSunday = new Date(date).getDay() === 0;
                                                    const hasLog = waliLogs.some(l => l.tanggal === date);
                                                    
                                                    let isLibur = false;
                                                    if (isSunday) {
                                                        isLibur = true;
                                                    } else if (!hasLog && firstLogDate && lastLogDate) {
                                                        if (date >= firstLogDate && date <= lastLogDate) {
                                                            isLibur = true;
                                                        }
                                                    }
                                                    
                                                    let badge = '';
                                                    let bg = '';
                                                    
                                                    if (log) {
                                                        if (log.kehadiran === 'hadir') { badge = 'H'; bg = 'bg-emerald-500 text-white shadow-sm'; }
                                                        else if (log.kehadiran === 'sakit') { badge = 'S'; bg = 'bg-amber-400 text-white shadow-sm'; }
                                                        else if (log.kehadiran === 'izin') { badge = 'I'; bg = 'bg-cyan-500 text-white shadow-sm'; }
                                                        else if (log.kehadiran === 'alpa') { badge = 'A'; bg = 'bg-rose-500 text-white shadow-sm'; }
                                                    }

                                                    return (
                                                        <td key={idx} className={`py-1 md:py-2 px-0 text-center w-[18px] md:w-[22px] min-w-[18px] md:min-w-[22px] border-b border-l border-slate-300 dark:border-emerald-500/10 ${isLibur ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                                                            {badge ? (
                                                                <div 
                                                                    className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-full mx-auto flex items-center justify-center text-[7px] md:text-[8px] font-bold ${bg}`}
                                                                    title={log.kehadiran.toUpperCase()}
                                                                >
                                                                    {badge}
                                                                </div>
                                                            ) : (
                                                                <div className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-full mx-auto flex items-center justify-center text-[7px] font-bold bg-slate-100/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 ${isLibur ? 'opacity-50' : ''}`} title={isLibur ? 'Libur / Tidak Ada KBM' : 'Belum Diabsen'}>
                                                                    
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                }) : (
                                                    <td className="py-1 px-1 text-center min-w-[32px] border-l border-slate-300 dark:border-emerald-500/10">
                                                        
                                                    </td>
                                                )}
                                                {(() => {
                                                    const totalH = Object.values(s.logsByDate).filter(l => l && l.kehadiran === 'hadir').length;
                                                    const totalS = Object.values(s.logsByDate).filter(l => l && l.kehadiran === 'sakit').length;
                                                    const totalI = Object.values(s.logsByDate).filter(l => l && l.kehadiran === 'izin').length;
                                                    const totalA = Object.values(s.logsByDate).filter(l => l && l.kehadiran === 'alpa').length;
                                                    return (
                                                        <>
                                                            <td className="py-1 md:py-2 px-0 w-[24px] md:w-[28px] min-w-[24px] md:min-w-[28px] max-w-[24px] md:max-w-[28px] text-center font-extrabold text-[9px] md:text-[10px] text-amber-500 bg-amber-50/30 dark:bg-amber-900/10 border-b border-slate-300 border-l-[3px] border-slate-400 dark:border-emerald-500/30">{totalS || ''}</td>
                                                            <td className="py-1 md:py-2 px-0 w-[24px] md:w-[28px] min-w-[24px] md:min-w-[28px] max-w-[24px] md:max-w-[28px] text-center font-extrabold text-[9px] md:text-[10px] text-cyan-600 bg-cyan-50/30 dark:bg-cyan-900/10 border-b border-l border-slate-300 dark:border-emerald-500/10">{totalI || ''}</td>
                                                            <td className="py-1 md:py-2 px-0 w-[24px] md:w-[28px] min-w-[24px] md:min-w-[28px] max-w-[24px] md:max-w-[28px] text-center font-extrabold text-[9px] md:text-[10px] text-rose-600 bg-rose-50/30 dark:bg-rose-900/10 border-b border-l border-slate-300 dark:border-emerald-500/10">{totalA || ''}</td>
                                                        </>
                                                    );
                                                })()}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        
                        {/* Legend */}
                        {kelasStatsRows.length > 0 && uniqueDates.length > 0 && (
                            <div className="p-4 border-t border-slate-200 dark:border-emerald-500/10 flex flex-wrap gap-4 items-center bg-slate-50/50 dark:bg-[#020c08]/50">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Keterangan:</span>
                                <div className="flex flex-wrap gap-3">
                                    <span className="flex items-center gap-1.5 text-xs font-semibold"><span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">H</span> Hadir</span>
                                    <span className="flex items-center gap-1.5 text-xs font-semibold"><span className="w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center text-[9px] font-bold">S</span> Sakit</span>
                                    <span className="flex items-center gap-1.5 text-xs font-semibold"><span className="w-5 h-5 rounded-full bg-cyan-500 text-white flex items-center justify-center text-[9px] font-bold">I</span> Izin</span>
                                    <span className="flex items-center gap-1.5 text-xs font-semibold"><span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[9px] font-bold">A</span> Alfa</span>
                                    <span className="flex items-center gap-1.5 text-xs font-semibold"><span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center text-[9px] font-bold"></span> Belum Diabsen</span>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="bg-white dark:bg-[#041610] rounded-3xl p-16 text-center border border-slate-200 dark:border-emerald-500/10 shadow-sm flex flex-col items-center justify-center gap-3 animate-fade-in">
                    <Users className="h-12 w-12 text-slate-400 dark:text-emerald-500/40" />
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                        Pilih Kelas Terlebih Dahulu
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                        Silakan pilih kelas pada dropdown untuk memuat rekapitulasi absensi siswa.
                    </p>
                </div>
            )}

            {/* Detail Modal */}
            {detailModalAct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setDetailModalAct(null)}>
                    <div className="bg-white dark:bg-[#020c08] w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        
                        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-emerald-500/10">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Detail Absensi Mata Pelajaran</h2>
                            <button onClick={() => setDetailModalAct(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50 dark:bg-[#010806]">
                            <div className="bg-white dark:bg-[#041610] border border-slate-200 dark:border-emerald-500/20 rounded-xl p-5 mb-8 flex justify-between items-center shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl border-2 border-dashed border-sky-300 dark:border-emerald-500/50 flex items-center justify-center bg-sky-50 dark:bg-emerald-500/10">
                                        <Info className="h-6 w-6 text-sky-500 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">{getAbbreviatedMapel(detailModalAct.label)}</h3>
                                        <p className="text-sm text-slate-400 font-medium">Total {detailModalAct.logs.length} Pertemuan</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xl font-bold text-slate-500 dark:text-slate-400">Total: {detailModalAct.logs.length} Hari</span>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-4 mt-2 justify-start">
                                {(() => {
                                    const isWaliForThisClass = user?.kelas_wali?.some(k => k.nama_kelas === selectedKelas);
                                    const isGuruForThisSubject = jadwal.some(j => j.mata_pelajaran === detailModalAct.label && Number(j.guru_id) === Number(user?.id));
                                    const canEdit = user?.role === 'admin' || isWaliForThisClass || isGuruForThisSubject;

                                    return detailModalAct.logs.sort((a,b) => {
                                        const dateA = a.tanggal || '';
                                        const dateB = b.tanggal || '';
                                        return dateA.localeCompare(dateB);
                                    }).map((log, idx) => {
                                        const dateObj = new Date(log.tanggal);
                                        const day = dateObj.getDate();
                                        const monthStr = dateObj.toLocaleDateString('id-ID', { month: 'short' });
                                        
                                        let boxColor = '';
                                        if (log.kehadiran === 'hadir') boxColor = 'bg-emerald-100 text-emerald-700 border-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)] dark:bg-emerald-900/40 dark:border-emerald-500/50 dark:text-emerald-400';
                                        else if (log.kehadiran === 'izin') boxColor = 'bg-amber-100 text-amber-700 border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)] dark:bg-amber-900/40 dark:border-amber-500/50 dark:text-amber-400';
                                        else if (log.kehadiran === 'sakit') boxColor = 'bg-cyan-100 text-cyan-700 border-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)] dark:bg-cyan-900/40 dark:border-cyan-500/50 dark:text-cyan-400';
                                        else boxColor = 'bg-rose-100 text-rose-700 border-rose-300 shadow-[0_0_10px_rgba(225,29,72,0.2)] dark:bg-rose-900/40 dark:border-rose-500/50 dark:text-rose-400';

                                        return (
                                            <div key={log.id} className="relative group/bubble">
                                                <div 
                                                    onClick={(e) => {
                                                        if (log.bukti_foto) {
                                                            e.stopPropagation(); 
                                                            setLightboxSrc(`${log.bukti_foto}`);
                                                        }
                                                    }}
                                                    title={`Pertemuan ${idx + 1}: ${dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} - ${log.kehadiran.toUpperCase()}`} 
                                                    className={`relative flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border ${boxColor} transition-all duration-300 hover:scale-105 hover:-translate-y-1 ${log.bukti_foto ? 'cursor-pointer' : ''}`}
                                                >
                                                    <span className="text-[10px] sm:text-xs font-bold opacity-80 uppercase tracking-widest">{monthStr}</span>
                                                    <span className="text-3xl sm:text-4xl font-black leading-none mt-1 mb-1">{day}</span>
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <span className="text-[9px] font-bold opacity-60 uppercase">P.{idx+1}</span>
                                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white/40 dark:bg-black/20 uppercase">{log.kehadiran}</span>
                                                    </div>
                                                    
                                                    {log.bukti_foto && (
                                                        <div className="absolute -bottom-2 -left-2 bg-slate-800 text-white rounded-full p-1.5 shadow-lg shadow-black/20 animate-bounce z-20">
                                                            <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {canEdit && (
                                                    <>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setEditLogModal(log); }}
                                                            className="absolute -top-2 -right-2 bg-sky-500 hover:bg-sky-600 text-white rounded-full p-1.5 shadow-md opacity-100 md:opacity-0 md:group-hover/bubble:opacity-100 transition-opacity z-10 cursor-pointer"
                                                            title="Edit Absensi"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
                                                        </button>
                                                        
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteLog(log.id); }}
                                                            className="absolute -bottom-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md opacity-100 md:opacity-0 md:group-hover/bubble:opacity-100 transition-opacity z-10 cursor-pointer"
                                                            title="Hapus Absensi"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Absensi Modal */}
            {editLogModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setEditLogModal(null)}>
                    <div className="bg-white dark:bg-[#020c08] w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-emerald-500/10 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 dark:text-white">Edit Absensi</h3>
                            <button onClick={() => setEditLogModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-5 flex flex-col gap-3">
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-2">
                                Ubah status kehadiran untuk tanggal <br/>
                                <strong className="text-slate-700 dark:text-emerald-400">{new Date(editLogModal.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                {['hadir', 'sakit', 'izin', 'alpa'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => handleUpdateKehadiran(status)}
                                        className={`py-2.5 rounded-xl text-sm font-bold capitalize transition-colors ${
                                            editLogModal.kehadiran === status 
                                            ? 'bg-slate-800 text-white dark:bg-emerald-500 dark:text-slate-900 border-2 border-slate-800 dark:border-emerald-500' 
                                            : 'bg-slate-50 text-slate-600 border-2 border-slate-200 hover:border-slate-400 dark:bg-[#061e16] dark:border-emerald-500/20 dark:text-emerald-400 dark:hover:border-emerald-500/50'
                                        }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox for Bukti Foto */}
            {lightboxSrc && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 cursor-zoom-out animate-fade-in"
                    onClick={() => setLightboxSrc(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-xl border border-white/10 shadow-2xl">
                        <img 
                            src={lightboxSrc} 
                            alt="Bukti Kehadiran" 
                            className="max-w-full max-h-[85vh] object-contain rounded-lg"
                        />
                        <button 
                            onClick={() => setLightboxSrc(null)}
                            className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors cursor-pointer"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
