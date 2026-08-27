"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, Calendar, Bell, RotateCcw, ShieldCheck } from 'lucide-react';
import { useTahunAjaran } from '@/hooks/useTahunAjaran';

const JENIS_CONFIG = {
    pengajian_pagi:  { label: 'Pengajian Pagi',  emoji: '🌅' },
    pengajian_sore:  { label: 'Pengajian Sore',  emoji: '🌇' },
    pengajian_malam: { label: 'Pengajian Malam', emoji: '🌙' },
    ekstrakurikuler: { label: 'Ekstrakurikuler', emoji: '⚽' },
    kegiatan_lain:   { label: 'Kegiatan Lain',   emoji: '🎯' },
};

export default function AdminAkademikPage() {
    const { token } = useAuth();
    const [allLogs, setAllLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedAct, setExpandedAct] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const { tahunAjaranList, activeTahunAjaran, selectedTahunAjaranId, setSelectedTahunAjaranId, loadingTahunAjaran } = useTahunAjaran();
    const isCurrentYearActive = activeTahunAjaran?.id?.toString() === selectedTahunAjaranId;

    const API_URL = '/api';

    const fetchLogs = async () => {
        if (!selectedTahunAjaranId) return;
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/akademik?tahun_ajaran_id=${selectedTahunAjaranId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            setAllLogs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching academic logs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token || !selectedTahunAjaranId) return;
        fetchLogs();
    }, [token, selectedTahunAjaranId]);

    const handleResetSemester = async () => {
        if (!confirm('PERINGATAN!\n\nAnda akan menghapus PERMANEN seluruh data rekap absensi. Data tidak dapat dikembalikan.\n\nLanjutkan reset semester?')) return;
        setSubmitting(true);
        try {
            await fetch(`${API_URL}/akademik/reset/all`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            fetchLogs();
            alert('Data rekap semester berhasil di-reset.');
        } catch (err) { console.error(err); alert('Gagal reset data.'); } 
        finally { setSubmitting(false); }
    };

    // Mengelompokkan log berdasarkan jenis kegiatan
    const groupMap = {};
    Object.keys(JENIS_CONFIG).forEach(k => {
        groupMap[k] = { id: k, label: JENIS_CONFIG[k].label, emoji: JENIS_CONFIG[k].emoji, logs: [] };
    });

    const filteredLogs = allLogs;

    filteredLogs.forEach(l => {
        // filter out 'kehadiran_harian' if it's not a specific 'kegiatan' we want to track in detail,
        // but for now let's assume 'kehadiran_harian' is mapped to something, or we just map everything.
        const k = l.jenis_kegiatan || 'kegiatan_lain';
        if (groupMap[k]) {
            groupMap[k].logs.push(l);
        } else {
            if(!groupMap['lainnya']) groupMap['lainnya'] = { id: 'lainnya', label: 'Kegiatan Lainnya', emoji: '📝', logs: [] };
            groupMap['lainnya'].logs.push(l);
        }
    });

    // Menghitung persentase kehadiran dan menyiapkan statistik harian
    const activities = Object.values(groupMap).filter(g => g.logs.length > 0);
    activities.forEach(a => {
        const total = a.logs.length;
        const hadir = a.logs.filter(l => l.kehadiran === 'hadir').length;
        a.persentase = total > 0 ? (hadir / total) * 100 : 0;

        // Kelompokkan per tanggal untuk Detail Executive Summary
        const dateMap = {};
        a.logs.forEach(l => {
            const dateStr = l.tanggal ? l.tanggal.slice(0, 10) : 'Tanpa Tanggal';
            if (!dateMap[dateStr]) {
                dateMap[dateStr] = { date: dateStr, hadir: 0, izin: 0, sakit: 0, alpa: 0, total: 0 };
            }
            if (dateMap[dateStr][l.kehadiran] !== undefined) {
                dateMap[dateStr][l.kehadiran]++;
            }
            dateMap[dateStr].total++;
        });
        a.dates = Object.values(dateMap).sort((d1, d2) => d2.date.localeCompare(d1.date));
    });

    // Semester dikontrol oleh dropdown user

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Title & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Akademik</h1>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">Rekap Absen</p>
                </div>
                {isCurrentYearActive && (
                    <button onClick={handleResetSemester} disabled={submitting}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-red-500/20 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 text-sm font-bold transition-all cursor-pointer disabled:opacity-50 shadow-sm">
                        <RotateCcw className="h-4 w-4" /> Reset Semester
                    </button>
                )}
            </div>

            {!isCurrentYearActive && !loadingTahunAjaran && selectedTahunAjaranId && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 p-4 rounded-xl flex items-center justify-center gap-2 font-medium text-sm animate-fade-in">
                    Mode Arsip (Read-Only). Tahun Ajaran ini sudah tidak aktif, data tidak dapat diubah.
                </div>
            )}

            {/* Banner Peringatan */}
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 p-4 rounded-xl flex items-center gap-3 shadow-sm">
                <Bell className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">Data di bawah ini merupakan Ringkasan Eksekutif dari seluruh siswa aktif. Proses sinkronisasi data dilakukan secara rutin.</p>
            </div>

            {/* Area Rekap Absensi Global */}
            <div className="bg-white dark:bg-[#041610] rounded-2xl border border-slate-200 dark:border-emerald-500/10 shadow-sm overflow-hidden">
                {/* Card Header */}
                <div className="p-5 flex justify-between items-center border-b border-slate-200 dark:border-emerald-500/10">
                    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2">
                        <Calendar className="h-4 w-4 text-emerald-600" />
                        <select 
                            value={selectedTahunAjaranId} 
                            onChange={e => setSelectedTahunAjaranId(e.target.value)}
                            disabled={loadingTahunAjaran}
                            className="text-sm font-bold text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer disabled:opacity-50 w-full"
                        >
                            {loadingTahunAjaran ? (
                                <option>Memuat...</option>
                            ) : tahunAjaranList.length === 0 ? (
                                <option value="">Tidak ada data</option>
                            ) : (
                                tahunAjaranList.map(ta => (
                                    <option key={ta.id} value={ta.id}>{ta.nama_tahun} {ta.semester}</option>
                                ))
                            )}
                        </select>
                    </div>
                </div>
                
                {loading ? (
                    <div className="flex h-52 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                    </div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 flex flex-col items-center gap-3">
                        <BookOpen className="h-10 w-10 opacity-30" />
                        <p className="text-sm font-medium">Belum ada riwayat kegiatan tercatat di sistem.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs whitespace-nowrap min-w-max border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-[#061e16] text-slate-800 dark:text-slate-300 font-extrabold uppercase">
                                    <th className="py-2 px-3 border-b border-r border-slate-200 dark:border-emerald-500/10 text-center w-16">No</th>
                                    <th className="py-2 px-3 border-b border-r border-slate-200 dark:border-emerald-500/10">Mata Pelajaran / Kegiatan</th>
                                    <th className="py-2 px-3 border-b border-r border-slate-200 dark:border-emerald-500/10 w-48 md:w-64">Persentase Kumulatif</th>
                                    <th className="py-2 px-3 border-b border-slate-200 dark:border-emerald-500/10 text-center w-32">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activities.map((act, idx) => (
                                    <React.Fragment key={act.id}>
                                        <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                            <td className="py-2 px-3 border-b border-r border-slate-200 dark:border-emerald-500/10 font-medium text-slate-600 dark:text-slate-400 text-center">{idx + 1}</td>
                                            <td className="py-2 px-3 border-b border-r border-slate-200 dark:border-emerald-500/10">
                                                <p className="font-bold text-slate-800 dark:text-white leading-tight">{act.label}</p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">{act.emoji} Total {act.logs.length} Data Absen</p>
                                            </td>
                                            <td className="py-2 px-3 border-b border-r border-slate-200 dark:border-emerald-500/10">
                                                <p className="font-extrabold text-slate-800 dark:text-white mb-1.5">{act.persentase.toFixed(2)} %</p>
                                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                                                    <div className={`h-full transition-all duration-1000 ${act.persentase >= 80 ? 'bg-emerald-500' : act.persentase >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${act.persentase}%` }}></div>
                                                </div>
                                            </td>
                                            <td className="py-2 px-3 border-b border-slate-200 dark:border-emerald-500/10 text-center">
                                                <button 
                                                    onClick={() => setExpandedAct(expandedAct === act.id ? null : act.id)}
                                                    className="bg-slate-100 dark:bg-[#061e16] text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-[#082a1f] transition-colors border border-slate-200 dark:border-emerald-500/20 whitespace-nowrap"
                                                >
                                                    Detail
                                                </button>
                                            </td>
                                        </tr>
                                        {/* Dropdown Rincian (Executive Summary per Date) */}
                                        {expandedAct === act.id && (
                                            <tr>
                                                <td colSpan={4} className="p-0 bg-slate-50 dark:bg-[#061e16] border-b border-slate-200 dark:border-emerald-500/10 shadow-inner">
                                                    <div className="p-6 md:p-8">
                                                        <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-5 flex items-center gap-2">
                                                            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Ringkasan Harian ({act.label})
                                                        </h4>
                                                        
                                                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-emerald-500/10">
                                                            <table className="w-full text-left text-xs bg-white dark:bg-[#041610] border-separate border-spacing-0">
                                                                <thead>
                                                                    <tr className="bg-slate-100 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-extrabold uppercase">
                                                                        <th className="py-2 px-3 border-b border-r border-slate-200 dark:border-emerald-500/10">Tanggal</th>
                                                                        <th className="py-2 px-3 border-b border-r border-slate-200 dark:border-emerald-500/10 text-center">✅ Hadir</th>
                                                                        <th className="py-2 px-3 border-b border-r border-slate-200 dark:border-emerald-500/10 text-center">🟡 Izin</th>
                                                                        <th className="py-2 px-3 border-b border-r border-slate-200 dark:border-emerald-500/10 text-center">🔵 Sakit</th>
                                                                        <th className="py-2 px-3 border-b border-r border-slate-200 dark:border-emerald-500/10 text-center">🔴 Alpa</th>
                                                                        <th className="py-2 px-3 border-b border-slate-200 dark:border-emerald-500/10 text-center">Total Siswa</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {act.dates.length === 0 ? (
                                                                        <tr>
                                                                            <td colSpan={6} className="py-4 text-center text-slate-500 border-b border-slate-200 dark:border-emerald-500/10">Tidak ada data harian.</td>
                                                                        </tr>
                                                                    ) : act.dates.map(d => (
                                                                        <tr key={d.date} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                                                            <td className="py-1.5 px-3 border-b border-r border-slate-200 dark:border-emerald-500/10 font-bold text-slate-700 dark:text-slate-300">
                                                                                {new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                                                                            </td>
                                                                            <td className="py-1.5 px-3 border-b border-r border-slate-200 dark:border-emerald-500/10 text-center font-extrabold text-emerald-600 dark:text-emerald-400">{d.hadir}</td>
                                                                            <td className="py-1.5 px-3 border-b border-r border-slate-200 dark:border-emerald-500/10 text-center font-extrabold text-amber-600 dark:text-amber-400">{d.izin}</td>
                                                                            <td className="py-1.5 px-3 border-b border-r border-slate-200 dark:border-emerald-500/10 text-center font-extrabold text-blue-600 dark:text-blue-400">{d.sakit}</td>
                                                                            <td className="py-1.5 px-3 border-b border-r border-slate-200 dark:border-emerald-500/10 text-center font-extrabold text-rose-600 dark:text-rose-400">{d.alpa}</td>
                                                                            <td className="py-1.5 px-3 border-b border-slate-200 dark:border-emerald-500/10 text-center text-[10px] font-bold text-slate-400">{d.total}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                        
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
