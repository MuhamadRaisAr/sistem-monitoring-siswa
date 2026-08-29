"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChild } from '@/context/ChildContext';
import { ShieldAlert, Plus, Check, X, Calendar, AlertTriangle, Shield, CheckCircle2, Clock, Trash2, Award, Search } from 'lucide-react';
import { useTahunAjaran } from '@/hooks/useTahunAjaran';

export default function WaliKedisiplinanPage() {
    const { token } = useAuth();
    const { selectedChild } = useChild();
    
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const { 
        tahunAjaranList, 
        selectedTahunAjaranId, 
        setSelectedTahunAjaranId,
        loadingTahunAjaran
    } = useTahunAjaran();
    
    const [selectedPelanggaran, setSelectedPelanggaran] = useState(null);
    const [activeTab, setActiveTab] = useState('terkini');
    const [selectedBulan, setSelectedBulan] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const API_URL = '/api';

    const fetchRecords = async () => {
        if (!selectedChild || !selectedTahunAjaranId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/kedisiplinan?siswa_id=${selectedChild.id}&tahun_ajaran_id=${selectedTahunAjaranId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setRecords(data);
        } catch (err) {
            console.error('Error fetching child discipline records:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token || !selectedChild || !selectedTahunAjaranId) return;
        fetchRecords();
    }, [token, selectedChild, selectedTahunAjaranId]);


    const availableMonths = React.useMemo(() => {
        const ta = tahunAjaranList.find(t => t.id.toString() === selectedTahunAjaranId);
        if (!ta || !ta.nama_tahun) return [];
        
        const years = ta.nama_tahun.split('/');
        if (years.length !== 2) return [];

        const startYear = parseInt(years[0], 10);
        const endYear = parseInt(years[1], 10);
        
        const monthsList = [];
        if (ta.semester.toLowerCase() === 'ganjil') {
            for (let i = 7; i <= 12; i++) {
                monthsList.push(`${startYear}-${String(i).padStart(2, '0')}`);
            }
        } else {
            for (let i = 1; i <= 6; i++) {
                monthsList.push(`${endYear}-${String(i).padStart(2, '0')}`);
            }
        }
        return monthsList;
    }, [selectedTahunAjaranId, tahunAjaranList]);

    useEffect(() => {
        if (availableMonths.length > 0 && selectedBulan && !availableMonths.includes(selectedBulan)) {
            setSelectedBulan('');
        }
    }, [availableMonths, selectedBulan]);

    const allViolations = records.filter(r => r.kategori === 'pelanggaran');
    const latestGlobalDate = allViolations.length > 0 ? new Date(allViolations[0].tanggal_kejadian).toDateString() : null;

    const violations = records.filter(r => {
        const matchKategori = r.kategori === 'pelanggaran';
        const matchBulan = !selectedBulan || r.tanggal_kejadian.startsWith(selectedBulan);
        const matchSearch = !searchQuery || 
                            (r.nama_kegiatan && r.nama_kegiatan.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (r.nama_pelapor && r.nama_pelapor.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchKategori && matchBulan && matchSearch;
    });
    const terkiniList = violations.filter(v => new Date(v.tanggal_kejadian).toDateString() === latestGlobalDate);
    
    if (!selectedChild) {
        return (
            <div className="glass-panel rounded-3xl p-8 text-center text-slate-500">
                Pilih siswa terlebih dahulu di bagian atas.
            </div>
        );
    }

    return (
        <div className="space-y-8 w-full min-w-0">
            {/* ── Header ───────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">Kedisiplinan</h1>
                    <p className="text-slate-400 text-sm mt-1">Lihat riwayat dan catatan pelanggaran siswa.</p>
                </div>
            </div>

            <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4 w-full items-start sm:items-center">
                    <div className="flex flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                        <div className="flex flex-col gap-1.5 flex-1 sm:flex-none sm:w-[220px]">
                            <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Tahun Ajaran:</label>
                            <select 
                                value={selectedTahunAjaranId}
                                onChange={(e) => setSelectedTahunAjaranId(e.target.value)}
                                disabled={loadingTahunAjaran}
                                className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#041610] py-2.5 px-3 sm:px-4 text-[12px] sm:text-sm font-semibold text-slate-700 dark:text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-sm text-ellipsis overflow-hidden disabled:opacity-50"
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

                        <div className="flex flex-col gap-1.5 flex-1 sm:flex-none sm:w-[180px]">
                            <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Bulan:</label>
                            <select
                                value={selectedBulan}
                                onChange={(e) => setSelectedBulan(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#041610] py-2.5 px-3 sm:px-4 text-[12px] sm:text-sm font-semibold text-slate-700 dark:text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-sm text-ellipsis overflow-hidden"
                            >
                                <option value="">Semua Bulan</option>
                                {availableMonths.map(m => {
                                    const dateObj = new Date(m + '-01');
                                    const monthName = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                                    return <option key={m} value={m}>{monthName}</option>;
                                })}
                            </select>
                        </div>
                    </div>
                    
                    {/* Pencarian */}
                    <div className="w-full sm:w-auto sm:ml-auto self-end sm:self-center">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-emerald-500" />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari pelanggaran..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full sm:w-[240px] pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#041610] text-[12px] sm:text-sm font-semibold text-slate-700 dark:text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm placeholder:text-slate-400 placeholder:font-normal"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Tabs ─────────────────────────────────────────────── */}
            <div className="flex w-full gap-2 mb-4">
                {['terkini', 'riwayat'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2.5 px-2 rounded-xl text-[13px] sm:text-sm font-bold whitespace-nowrap transition-all ${
                            activeTab === tab 
                            ? 'bg-emerald-600 text-white shadow-md' 
                            : 'bg-emerald-500/5 text-slate-500 hover:bg-emerald-500/10 hover:text-slate-400'
                        }`}
                    >
                        {tab === 'terkini' ? 'Pelanggaran Terkini' : 'Riwayat Pelanggaran'}
                    </button>
                ))}
            </div>

            {/* ── Pelanggaran Layout ─────────────────────────────────── */}
            <div className="animate-fade-in w-full min-w-0">
                {loading ? (
                    <div className="flex h-52 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                    </div>
                ) : violations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
                        <ShieldAlert className="h-10 w-10 opacity-30" />
                        <p className="text-sm font-medium text-center">Alhamdulillah, tidak ada pelanggaran kedisiplinan tercatat.</p>
                    </div>
                ) : activeTab === 'terkini' ? (
                    terkiniList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
                            <ShieldAlert className="h-10 w-10 opacity-30" />
                            <p className="text-sm font-medium text-center">Tidak ada pelanggaran terkini di bulan ini.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 sm:gap-4 w-full">
                            {terkiniList.map((r) => (
                                <div 

                                key={r.id}
                                onClick={() => setSelectedPelanggaran(r)}
                                className="bg-white dark:bg-[#041610] rounded-2xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex items-center gap-3 sm:gap-4 group w-full"
                            >
                                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-inner">
                                    <span className="text-base sm:text-lg font-black text-white">
                                        {r.nama_siswa ? r.nama_siswa.charAt(0).toUpperCase() : '?'}
                                    </span>
                                </div>
                                <div className="flex-1 grid grid-cols-[1fr_1fr_auto] sm:grid-cols-[1.2fr_1fr_auto] items-center gap-2 sm:gap-4 min-w-0">
                                    <div className="min-w-0 pr-1">
                                        <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white truncate">
                                            {r.nama_siswa || 'Siswa tidak ditemukan'}
                                        </h3>
                                        <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                                            {r.nama_pelapor ? `oleh ${r.nama_pelapor}` : 'oleh -'}
                                        </p>
                                    </div>
                                    <div className="min-w-0 pl-2 sm:pl-4">
                                        <p className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                                            {r.nama_kegiatan || 'Pelanggaran'}
                                        </p>
                                        <div className="flex items-center gap-1 mt-0.5 text-[9px] sm:text-[10px] text-slate-400 font-semibold">
                                            <Clock className="h-3 w-3 shrink-0" />
                                            <span className="truncate">{new Date(r.tanggal_kejadian).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                    <div className="flex flex-col gap-3 sm:gap-4 w-full">
                        {violations.map((r) => (
                            <div 
                                key={r.id} 
                                onClick={() => setSelectedPelanggaran(r)}
                                className="bg-white dark:bg-[#041610] rounded-2xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex items-center gap-3 sm:gap-4 group w-full"
                            >
                                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-inner">
                                    <span className="text-base sm:text-lg font-black text-white">
                                        {r.nama_siswa ? r.nama_siswa.charAt(0).toUpperCase() : '?'}
                                    </span>
                                </div>
                                <div className="flex-1 grid grid-cols-[1fr_1fr_auto] sm:grid-cols-[1.2fr_1fr_auto] items-center gap-2 sm:gap-4 min-w-0">
                                    <div className="min-w-0 pr-1">
                                        <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white truncate">
                                            {r.nama_siswa || 'Siswa tidak ditemukan'}
                                        </h3>
                                        <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                                            {r.nama_pelapor ? `oleh ${r.nama_pelapor}` : 'oleh -'}
                                        </p>
                                    </div>
                                    <div className="min-w-0 pl-2 sm:pl-4">
                                        <p className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                                            {r.nama_kegiatan || 'Pelanggaran'}
                                        </p>
                                        <div className="flex items-center gap-1 mt-0.5 text-[9px] sm:text-[10px] text-slate-400 font-semibold">
                                            <Clock className="h-3 w-3 shrink-0" />
                                            <span className="truncate">{new Date(r.tanggal_kejadian).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Detail Pelanggaran */}
            {selectedPelanggaran && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedPelanggaran(null)}>
                    <div 
                        className="bg-slate-50 dark:bg-[#020c08] rounded-xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 bg-white dark:bg-[#041610] border-b border-slate-200 dark:border-emerald-500/10 shrink-0">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-amber-500" />
                                Rincian Pelanggaran
                            </h2>
                            <button 
                                onClick={() => setSelectedPelanggaran(null)}
                                className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-slate-500 dark:text-slate-400 rounded-full transition-colors cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <div className="flex flex-col items-center mb-4">
                                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-2 shadow-lg">
                                    <span className="text-2xl font-black text-white">
                                        {selectedPelanggaran.nama_siswa ? selectedPelanggaran.nama_siswa.charAt(0).toUpperCase() : '?'}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white text-center">
                                    {selectedPelanggaran.nama_siswa || 'Siswa tidak ditemukan'}
                                </h3>
                            </div>
                            
                            <div className="bg-white dark:bg-[#041610] border border-slate-100 dark:border-emerald-500/10 rounded-2xl p-3 shadow-sm mb-2">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Kasus Pelanggaran</p>
                                <p className="text-base font-bold text-slate-800 dark:text-white">{selectedPelanggaran.nama_kegiatan}</p>
                            </div>

                            <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2">
                                <div className="bg-white dark:bg-[#041610] border border-slate-100 dark:border-emerald-500/10 rounded-2xl p-3 shadow-sm">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Tanggal</p>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                        {new Date(selectedPelanggaran.tanggal_kejadian).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="bg-white dark:bg-[#041610] border border-slate-100 dark:border-emerald-500/10 rounded-2xl p-3 shadow-sm">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Dilaporkan Oleh</p>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 line-clamp-2">
                                        {selectedPelanggaran.nama_pelapor || 'Admin/Guru'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
