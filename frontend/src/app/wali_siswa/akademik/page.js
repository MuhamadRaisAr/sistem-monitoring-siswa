"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChild } from '@/context/ChildContext';
import { BookOpen, Calendar, CalendarDays, ZoomIn, X, Clock, CheckCircle2, XCircle, Info, AlertCircle } from 'lucide-react';
import { useTahunAjaran } from '@/hooks/useTahunAjaran';
import { getAbbreviatedMapel, getMapelSortIndex } from '@/utils/mapelHelper';

export default function WaliAkademikPage() {
    const { token } = useAuth();
    const { selectedChild } = useChild();
    const [logs, setLogs] = useState([]);
    const [jadwal, setJadwal] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBulan, setSelectedBulan] = useState('');
    const [lightboxSrc, setLightboxSrc] = useState(null);
    const { 
        tahunAjaranList, 
        selectedTahunAjaranId, 
        setSelectedTahunAjaranId,
        loadingTahunAjaran
    } = useTahunAjaran();

    const API_URL = '/api';

    const fetchLogs = async () => {
        if (!selectedChild || !selectedTahunAjaranId) return;
        try {
            const res = await fetch(`${API_URL}/akademik?siswa_id=${selectedChild.id}&tahun_ajaran_id=${selectedTahunAjaranId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            setLogs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching academic logs:', err);
        }
    };

    const fetchJadwal = async () => {
        if (!selectedChild) return;
        try {
            const res = await fetch(`${API_URL}/jadwal`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (Array.isArray(data)) {
                const jadwalSiswa = data.filter(j => j.kelas === selectedChild.kelas);
                setJadwal(jadwalSiswa);
            }
        } catch (err) {
            console.error('Error fetching jadwal:', err);
        }
    };


    useEffect(() => {
        if (!token || !selectedChild || !selectedTahunAjaranId) return;
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchLogs(), fetchJadwal()]);
            setLoading(false);
        };
        init();
    }, [token, selectedChild, selectedTahunAjaranId]);

    // Mendapatkan daftar bulan yang tersedia berdasarkan Tahun Ajaran terpilih
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

    // Set Default Bulan
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

    // Dapatkan semua tanggal di bulan terpilih (format: YYYY-MM-DD)
    const uniqueDates = useMemo(() => {
        if (!selectedBulan) return [];
        const [year, month] = selectedBulan.split('-');
        const numDays = new Date(year, month, 0).getDate();
        
        const dates = [];
        for (let i = 1; i <= numDays; i++) {
            const dateStr = `${year}-${month}-${String(i).padStart(2, '0')}`;
            dates.push(dateStr);
        }
        return dates;
    }, [selectedBulan]);

    // Mendapatkan tanggal pertama dan terakhir dari log absensi yang ada
    const { firstLogDate, lastLogDate } = useMemo(() => {
        if (!selectedBulan || logs.length === 0) return { firstLogDate: null, lastLogDate: null };
        const monthLogs = logs.filter(l => l.tanggal && l.tanggal.startsWith(selectedBulan));
        if (monthLogs.length === 0) return { firstLogDate: null, lastLogDate: null };
        
        const sortedDates = monthLogs.map(l => {
            const d = new Date(l.tanggal);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }).sort();
        
        return {
            firstLogDate: sortedDates[0],
            lastLogDate: sortedDates[sortedDates.length - 1]
        };
    }, [logs, selectedBulan]);

    // Helper to get earliest schedule for sorting
    const getEarliestSchedule = (jadwalList) => {
        const dayMap = { 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6, 'Minggu': 7 };
        if (!jadwalList || jadwalList.length === 0) return { day: 99, time: '23:59:59' };
        let minDay = 99, minTime = '23:59:59';
        jadwalList.forEach(j => {
            const dVal = dayMap[j.hari] || 99;
            if (dVal < minDay) { minDay = dVal; minTime = j.jam_mulai || '23:59:59'; }
            else if (dVal === minDay && (j.jam_mulai || '23:59:59') < minTime) { minTime = j.jam_mulai; }
        });
        return { day: minDay, time: minTime };
    };

    // Build activities list from jadwal + logs
    const activities = useMemo(() => {
        const uniqueMapels = Array.from(new Set(jadwal.map(j => j.mata_pelajaran).filter(Boolean)));
        return uniqueMapels.map(m => {
            const mapelLogs = logs.filter(l => l.jenis_kegiatan === m && l.tanggal && l.tanggal.startsWith(selectedBulan));
            const logsByDateMap = {};
            mapelLogs.forEach(log => {
                const d = new Date(log.tanggal);
                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                logsByDateMap[dateStr] = log;
            });
            return {
                id: m,
                label: m,
                jadwalList: jadwal.filter(j => j.mata_pelajaran === m),
                logsByDate: logsByDateMap
            };
        }).sort((a, b) => {
            const aSched = getEarliestSchedule(a.jadwalList);
            const bSched = getEarliestSchedule(b.jadwalList);
            if (aSched.day !== bSched.day) return aSched.day - bSched.day;
            return aSched.time.localeCompare(bSched.time);
        });
    }, [jadwal, logs, selectedBulan]);

    // Build per-date schedule map including ALL dates in month
    const dateScheduleMap = useMemo(() => {
        if (!selectedBulan) return {};
        const [year, month] = selectedBulan.split('-');
        const numDays = new Date(year, month, 0).getDate();
        const dayNamesArr = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
        const map = {};

        // Index actual logs by date → { mapel → log } (keep last entry per mapel per date)
        const logsByDateMapel = {};
        logs.forEach(log => {
            if (!log.tanggal || !log.jenis_kegiatan) return;
            const d = new Date(log.tanggal);
            const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            if (!ds.startsWith(selectedBulan)) return;
            if (!logsByDateMapel[ds]) logsByDateMapel[ds] = {};
            // Last log per mapel per date wins (terbaru)
            logsByDateMapel[ds][log.jenis_kegiatan] = log;
        });

        for (let i = 1; i <= numDays; i++) {
            const dateStr = `${year}-${month}-${String(i).padStart(2, '0')}`;
            const dObj = new Date(dateStr);
            const dayName = dayNamesArr[dObj.getDay()];
            const isSunday = dObj.getDay() === 0;

            if (isSunday) {
                map[dateStr] = { isSunday: true, items: [] };
                continue;
            }

            const dateLogsMap = logsByDateMapel[dateStr] || {};

            // If no logs at all for this date, consider it a holiday or non-school day
            if (Object.keys(dateLogsMap).length === 0) {
                map[dateStr] = { isSunday: false, isHoliday: true, items: [] };
                continue;
            }

            const jadwalHari = jadwal.filter(j => j.hari === dayName);
            const seenMapel = new Set();
            const uniqueJadwalHari = [...jadwalHari].reverse().filter(j => {
                if (!j.mata_pelajaran || seenMapel.has(j.mata_pelajaran)) return false;
                seenMapel.add(j.mata_pelajaran);
                return true;
            }).reverse();

            // 1. Tampilkan semua jadwal hari ini (isi log jika ada, biarkan null jika belum diabsen)
            let items = uniqueJadwalHari.map(j => {
                const log = dateLogsMap[j.mata_pelajaran] || null;
                return {
                    mapel: j.mata_pelajaran,
                    namaGuru: j.nama_guru || '',
                    log: log
                };
            });

            // 2. Tambahkan absensi (log) yang mungkin mapel-nya tidak ada di jadwal saat ini (misal jadwal berubah / kelas pengganti)
            Object.entries(dateLogsMap).forEach(([mapelName, log]) => {
                const exists = items.find(i => i.mapel === mapelName);
                if (!exists) {
                    const j = jadwal.find(jd => jd.mata_pelajaran === mapelName);
                    const namaGuru = j?.nama_guru || '';
                    items.push({ mapel: mapelName, namaGuru, log });
                }
            });

            map[dateStr] = { isSunday: false, items };
        }
        return map;
    }, [selectedBulan, jadwal, logs]);


    const sortedDates = useMemo(() => Object.keys(dateScheduleMap).sort(), [dateScheduleMap]);


    if (!selectedChild) {
        return (
            <div className="bg-white dark:bg-[#041610] border border-slate-200 dark:border-emerald-500/10 rounded-3xl p-8 text-center text-slate-500 shadow-sm">
                Pilih siswa terlebih dahulu di bagian atas.
            </div>
        );
    }

    const KEHADIRAN_STYLE = {
        hadir: { label: 'Hadir', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400', icon: CheckCircle2 },
        sakit: { label: 'Sakit', bg: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', icon: AlertCircle },
        izin:  { label: 'Izin',  bg: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400', icon: Info },
        alpa:  { label: 'Alpa',  bg: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400', icon: XCircle },
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Rekap Absensi Harian</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Laporan kehadiran siswa per mata pelajaran</p>
                </div>
                <div className="flex flex-row gap-3">
                    {/* Tahun Ajaran */}
                    <div className="flex flex-col gap-1 w-[160px] md:w-[220px]">
                        <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Tahun Ajaran:</label>
                        <select
                            value={selectedTahunAjaranId}
                            onChange={(e) => setSelectedTahunAjaranId(e.target.value)}
                            disabled={loadingTahunAjaran}
                            className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#061e16] py-2 px-3 md:py-2.5 md:px-4 text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-200 focus:border-emerald-500 focus:outline-none cursor-pointer shadow-sm"
                        >
                            {loadingTahunAjaran ? (
                                <option>Memuat...</option>
                            ) : (
                                tahunAjaranList.map((ta) => (
                                    <option key={ta.id} value={ta.id}>{ta.nama_tahun} {ta.semester}</option>
                                ))
                            )}
                        </select>
                    </div>
                    {/* Bulan */}
                    {availableMonths.length > 0 && (
                        <div className="flex flex-col gap-1 w-[140px] md:w-[180px]">
                            <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Bulan:</label>
                            <select
                                value={selectedBulan}
                                onChange={(e) => setSelectedBulan(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#061e16] py-2 px-3 md:py-2.5 md:px-4 text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-200 focus:border-emerald-500 focus:outline-none cursor-pointer shadow-sm"
                            >
                                {availableMonths.map(m => {
                                    const dateObj = new Date(m + '-01');
                                    const monthName = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                                    return <option key={m} value={m}>{monthName}</option>;
                                })}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                </div>
            ) : sortedDates.length === 0 ? (
                <div className="glass-panel rounded-3xl p-16 flex flex-col items-center justify-center gap-3 w-full border border-slate-200 dark:border-emerald-500/10">
                    <CalendarDays className="h-12 w-12 text-slate-400 dark:text-slate-600 opacity-50" />
                    <p className="text-slate-500 text-sm font-medium">Belum ada data kehadiran pada bulan ini.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {sortedDates.map(date => {
                        const dObj = new Date(date);
                        const dayLabel = dObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                        const entry = dateScheduleMap[date] || { isSunday: false, items: [] };

                        return (
                            <div key={date} className={`glass-panel rounded-3xl overflow-hidden border shadow-sm ${entry.isSunday ? 'border-red-200 dark:border-red-500/20 opacity-60' : 'border-slate-200 dark:border-emerald-500/10'}`}>
                                {/* Date Header */}
                                <div className={`border-b px-3.5 py-2.5 flex items-center gap-1.5 ${entry.isSunday ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-500/20' : 'bg-slate-50/80 dark:bg-emerald-900/10 border-slate-200 dark:border-emerald-500/10'}`}>
                                    <CalendarDays className={`h-3.5 w-3.5 flex-shrink-0 ${entry.isSunday ? 'text-red-400' : 'text-emerald-500'}`} />
                                    <span className={`text-xs font-extrabold ${entry.isSunday ? 'text-red-500 dark:text-red-400' : 'text-slate-800 dark:text-white'}`}>{dayLabel}</span>
                                </div>

                                {/* Content */}
                                {entry.isSunday ? (
                                    <div className="px-3.5 py-6 flex items-center justify-center min-h-[100px] bg-white dark:bg-[#020c08]/50">
                                        <span className="text-[10px] font-semibold text-red-400 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-500/20">
                                            🔴 Libur (Minggu)
                                        </span>
                                    </div>
                                ) : entry.isHoliday ? (
                                    <div className="px-3.5 py-6 flex items-center justify-center min-h-[100px] bg-white dark:bg-[#020c08]/50">
                                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                                            Libur
                                        </span>
                                    </div>
                                ) : entry.items.length === 0 ? (
                                    <div className="px-3.5 py-6 flex items-center justify-center min-h-[100px] bg-white dark:bg-[#020c08]/50">
                                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full">
                                            Tidak ada jadwal
                                        </span>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100 dark:divide-emerald-500/10 bg-white dark:bg-[#020c08]/50">
                                        {entry.items.map((item, idx) => {
                                            const style = item.log?.kehadiran ? KEHADIRAN_STYLE[item.log.kehadiran] : null;
                                            const StatusIcon = style?.icon;
                                            return (
                                                <div key={idx} className="px-3.5 py-2 flex items-center justify-between gap-2">
                                                    {/* Mapel + Guru */}
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-xs text-slate-800 dark:text-white truncate">{getAbbreviatedMapel(item.mapel)}</p>
                                                        {item.namaGuru && (
                                                            <p className="text-[10px] text-slate-400 mt-0.5 truncate">{item.namaGuru}</p>
                                                        )}
                                                    </div>
                                                    {/* Status inline */}
                                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                                        {style ? (
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${style.bg}`}>
                                                                {StatusIcon && <StatusIcon className="h-3 w-3" />}
                                                                {style.label}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500">
                                                                <Clock className="h-3 w-3" />
                                                                Belum Diabsen
                                                            </span>
                                                        )}
                                                        {item.log?.bukti_foto && (
                                                            <button
                                                                onClick={() => setLightboxSrc(item.log.bukti_foto)}
                                                                className="inline-flex items-center text-[10px] text-sky-500 hover:text-sky-600"
                                                            >
                                                                <ZoomIn className="h-3 w-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );

                    })}
                </div>
            )}


            {/* Lightbox Modal untuk Bukti Foto */}
            {lightboxSrc && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setLightboxSrc(null)}>
                    <div className="relative max-w-4xl w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <img src={lightboxSrc} alt="Bukti Kehadiran" className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl object-contain" />
                        <button onClick={() => setLightboxSrc(null)} className="absolute -top-4 -right-4 md:-right-12 h-10 w-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-colors">
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
