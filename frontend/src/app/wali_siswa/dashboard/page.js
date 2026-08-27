"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChild } from '@/context/ChildContext';
import Link from 'next/link';
import { 
    Users, HeartPulse, ShieldAlert, CircleDollarSign, 
    BookOpen, Calendar, ArrowUpRight, MessageSquare, Zap,
    CheckCircle2, Clock, XCircle, Megaphone, X, Bell
} from 'lucide-react';

export default function WaliDashboard() {
    const { token, user } = useAuth();
    const { selectedChild, loadingChildren } = useChild();
    const [loadingStats, setLoadingStats] = useState(false);
    const [selectedPengumuman, setSelectedPengumuman] = useState(null);
    
    const [stats, setStats] = useState({
        totalHadir: 0,
        totalSakit: 0,
        totalIzin: 0,
        totalAlpa: 0,
        totalMeeting: 0,
        totalPengumuman: 0,
        totalViolationsCount: 0,
        totalViolationPoints: 0,
        unpaidSppCount: 0,
        unpaidSppNominal: 0
    });

    const [recentLogs, setRecentLogs] = useState({
        academic: null,
        discipline: null,
        pengumuman: []
    });

    const API_URL = '/api';

    useEffect(() => {
        if (!token || !selectedChild) return;

        const fetchChildStats = async () => {
            setLoadingStats(true);
            try {
                // 1. Fetch Academic logs
                const resAcad = await fetch(`${API_URL}/akademik?siswa_id=${selectedChild.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const acadLogs = await resAcad.json();
                
                // Calculate total presence
                const totalHadir = acadLogs.filter(l => l.kehadiran.toLowerCase() === 'hadir').length;
                const totalSakit = acadLogs.filter(l => l.kehadiran.toLowerCase() === 'sakit').length;
                const totalIzin = acadLogs.filter(l => l.kehadiran.toLowerCase() === 'izin').length;
                const totalAlpa = acadLogs.filter(l => l.kehadiran.toLowerCase() === 'alpa').length;
                const totalPertemuan = acadLogs.length;
                
                // Fetch Discipline logs
                const resDis = await fetch(`${API_URL}/kedisiplinan?siswa_id=${selectedChild.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const disLogs = await resDis.json();
                const violations = disLogs.filter(d => d.kategori === 'pelanggaran');

                // Fetch Financial spp
                const resSpp = await fetch(`${API_URL}/keuangan?siswa_id=${selectedChild.id}&status_bayar=belum_lunas`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const sppLogs = await resSpp.json();
                const unpaidSum = sppLogs.reduce((acc, curr) => acc + parseFloat(curr.nominal), 0);

                // Fetch Pengumuman
                const resPeng = await fetch(`${API_URL}/pengumuman`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const pengLogs = await resPeng.json();
                const totalPengumuman = Array.isArray(pengLogs) ? pengLogs.length : 0;

                setStats({
                    totalHadir,
                    totalSakit,
                    totalIzin,
                    totalAlpa,
                    totalMeeting: totalPertemuan,
                    totalPengumuman,
                    totalViolationsCount: violations.length,
                    unpaidSppCount: sppLogs.length,
                    unpaidSppNominal: unpaidSum
                });

                // Recent summaries
                setRecentLogs({
                    academic: acadLogs[0] || null,
                    discipline: violations[0] || null,
                    pengumuman: Array.isArray(pengLogs) ? pengLogs.slice(0, 4) : []
                });

            } catch (err) {
                console.error('Error fetching child dashboard stats:', err);
            } finally {
                setLoadingStats(false);
            }
        };

        fetchChildStats();
    }, [token, selectedChild]);

    const formatRupiah = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(val);
    };

    if (loadingChildren) {
        return (
            <div className="flex h-[40vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!selectedChild) {
        return (
            <div className="glass-panel rounded-3xl p-8 text-center text-slate-500 space-y-3">
                <span className="text-4xl block">👦</span>
                <h3 className="font-bold text-white text-lg">Belum Ada Pemetaan Siswa</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">
                    Hubungi administrator SMP Ma'had Darul Ikhlas untuk mengaitkan akun wali Anda dengan data siswa ananda.
                </p>
            </div>
        );
    }

    // Konstanta Navigasi Cepat dihapus

    const cards = [
        {
            title: 'Riwayat Pelanggaran',
            value: `${stats.totalViolationsCount} Kali`,
            subtitle: `Pelanggaran tata tertib`,
            icon: ShieldAlert,
            color: stats.totalViolationsCount === 0 ? 'from-emerald-400 to-teal-500' : 'from-amber-400 to-orange-500',
            iconColor: 'text-white',
            linkColor: stats.totalViolationsCount === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
            link: '/wali_siswa/kedisiplinan'
        },
        {
            title: 'Sisa Tagihan',
            value: formatRupiah(stats.unpaidSppNominal),
            subtitle: `${stats.unpaidSppCount} bulan belum lunas`,
            icon: CircleDollarSign,
            color: stats.unpaidSppCount === 0 ? 'from-emerald-400 to-teal-500' : 'from-sky-400 to-blue-500',
            iconColor: 'text-white',
            linkColor: stats.unpaidSppCount === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-sky-600 dark:text-sky-400',
            link: '/wali_siswa/keuangan'
        }
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-500 p-8 sm:p-10 text-white shadow-xl shadow-emerald-500/20">
                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
                    <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-full bg-white/20 border-4 border-white/30 backdrop-blur-md flex items-center justify-center text-4xl sm:text-5xl shadow-lg overflow-hidden">
                        {user?.avatar ? (
                            <img src={user.avatar} alt="Profil Wali" className="h-full w-full object-cover" />
                        ) : (
                            "👦"
                        )}
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-[22px] sm:text-3xl font-extrabold tracking-tight mb-2 sm:mb-3 leading-tight" title={`Selamat datang ${user?.nama_lengkap || 'Wali Siswa'}! 👋`}>
                            Selamat datang <br />
                            {user?.nama_lengkap || 'Wali Siswa'}<span className="whitespace-nowrap">! 👋</span>
                        </h1>
                        <p className="text-emerald-50 max-w-2xl text-sm sm:text-base font-medium leading-relaxed opacity-90">
                            Anda login sebagai Wali Siswa.
                        </p>
                    </div>
                </div>
                {/* Decorative background shapes */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 h-72 w-72 rounded-full bg-white opacity-10 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 right-20 -mb-20 h-40 w-40 rounded-full bg-teal-300 opacity-20 blur-2xl pointer-events-none"></div>
            </div>

            {loadingStats ? (
                <div className="flex h-[30vh] items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                        <p className="text-slate-400 font-medium">Memuat Data Ananda...</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
                        {cards.map((card, i) => {
                            const Icon = card.icon;
                            return (
                                <div 
                                    key={i} 
                                    className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-[#041610] border border-slate-100 dark:border-emerald-500/10 p-3 sm:p-8 shadow-lg shadow-slate-200/50 dark:shadow-none hover:-translate-y-2 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
                                >
                                    <div className={`absolute top-0 right-0 -mr-8 -mt-8 h-20 w-20 sm:h-32 sm:w-32 rounded-full bg-gradient-to-br ${card.color} opacity-10 dark:opacity-20 blur-2xl transition-all duration-500 group-hover:scale-150`}></div>
                                    
                                    <div className="relative z-10 flex justify-between items-start mb-4 sm:mb-8">
                                        <div className="space-y-0.5 sm:space-y-1 pr-1 sm:pr-2">
                                            <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider line-clamp-1">{card.title}</span>
                                            <h3 className="text-lg sm:text-4xl font-black text-slate-800 dark:text-white tracking-tight leading-none truncate" title={card.value}>{card.value}</h3>
                                        </div>
                                        <div className={`h-8 w-8 sm:h-14 sm:w-14 rounded-lg sm:rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-inner shadow-white/20 transform group-hover:rotate-6 transition-transform duration-300 shrink-0`}>
                                            <Icon className={`h-4 w-4 sm:h-7 sm:w-7 ${card.iconColor}`} />
                                        </div>
                                    </div>
                                    
                                    <div className="relative z-10 mt-auto flex flex-col sm:flex-row sm:items-center justify-between text-[9px] sm:text-xs font-semibold border-t border-slate-100 dark:border-emerald-500/10 pt-2.5 sm:pt-4 gap-1.5 sm:gap-0">
                                        <span className="text-slate-500 dark:text-slate-400 line-clamp-1">{card.subtitle}</span>
                                        <Link href={card.link} className={`flex items-center justify-center gap-1 w-full sm:w-auto ${card.linkColor} hover:opacity-80 transition-opacity bg-slate-50 dark:bg-[#061e16] px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-md sm:rounded-lg`}>
                                            Detail <ArrowUpRight className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {/* Seksi Pengumuman (Selalu Tampil) */}
                    <div className="mt-12 pb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                Pengumuman
                            </h2>
                            <Link href="/wali_siswa/pengumuman" className="text-sm font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                Lainnya
                            </Link>
                        </div>
                        
                        {recentLogs.pengumuman.length > 0 ? (
                            <div className="flex flex-nowrap overflow-x-auto gap-6 pb-6 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                {recentLogs.pengumuman.map((item, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => setSelectedPengumuman(item)}
                                        className="bg-white dark:bg-[#041610] rounded-2xl border border-slate-100 dark:border-emerald-500/10 shadow-sm overflow-hidden group hover:shadow-md transition-shadow w-[280px] sm:w-[320px] shrink-0 snap-start cursor-pointer"
                                    >
                                        <div className="p-3">
                                            <div className="bg-[#0f4c9c] h-28 rounded-xl flex items-center justify-center p-4 text-center">
                                                <p className="text-white text-xs font-semibold leading-relaxed line-clamp-3">
                                                    {item.judul}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="p-4 pt-1 flex items-start gap-3">
                                            <div className="mt-1 shrink-0">
                                                <Megaphone className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 line-clamp-2 leading-snug mb-1">
                                                    {item.judul}
                                                </h3>
                                                <p className="text-xs text-slate-400">
                                                    {item.tanggal ? item.tanggal.substring(0, 10) : '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-50 dark:bg-[#041610] rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center">
                                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-[#061e16] shadow-sm mb-4">
                                    <Megaphone className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Belum Ada Pengumuman</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-500 mt-2 max-w-sm mx-auto">
                                    Saat ini belum ada pengumuman terbaru dari pihak sekolah.
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Modal Detail Pengumuman */}
            {selectedPengumuman && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedPengumuman(null)}>
                    <div 
                        className="bg-slate-50 dark:bg-[#020c08] rounded-xl w-full max-w-lg sm:max-w-xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header Modal */}
                        <div className="flex items-center justify-between p-4 bg-white dark:bg-[#041610] border-b border-slate-200 dark:border-emerald-500/10 shrink-0">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                                Detail Pengumuman
                            </h2>
                            <button 
                                onClick={() => setSelectedPengumuman(null)} 
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <div className="p-4 sm:p-6 overflow-y-auto">
                            {/* Kotak Judul */}
                            <div className="bg-white dark:bg-[#041610] p-4 rounded-xl border border-slate-200 dark:border-emerald-500/10 shadow-sm flex items-center gap-4 mb-6">
                                <div className="h-12 w-12 rounded-xl border-2 border-dashed border-teal-300 dark:border-teal-500/50 flex items-center justify-center bg-teal-50/50 dark:bg-teal-500/10 shrink-0">
                                    <Megaphone className="h-6 w-6 text-slate-800 dark:text-white" fill="currentColor" />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-800 dark:text-white leading-snug">
                                        {selectedPengumuman.judul}
                                    </h3>
                                </div>
                            </div>
                            
                            {/* Kotak Konten Biru */}
                            <div className="bg-gradient-to-b from-[#0e3b7d] to-[#1656a8] rounded-xl p-6 sm:p-8 text-white relative shadow-inner">
                                <h4 className="text-center font-bold text-xl tracking-wider mb-6">
                                    PENGUMUMAN
                                </h4>
                                <div className="text-sm sm:text-[15px] leading-relaxed space-y-4 whitespace-pre-wrap text-white/90">
                                    {selectedPengumuman.isi_pengumuman}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
