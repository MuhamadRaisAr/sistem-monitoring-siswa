"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { 
    Users, ShieldAlert, CircleDollarSign, 
    BookOpen, ArrowUpRight, Zap, GraduationCap, Building,
    BookOpenCheck, Calendar, Megaphone, UserCog, X, Clock
} from 'lucide-react';

export default function AdminDashboard() {
    const { token, user } = useAuth();
    const [stats, setStats] = useState({
        totalsiswa: 0,
        totalGuru: 0,
        totalKelas: 0,
        totalPelanggaran: 0
    });

    const [recentPelanggaran, setRecentPelanggaran] = useState([]);
    const [selectedPelanggaran, setSelectedPelanggaran] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_URL = '/api';

    useEffect(() => {
        if (!token) return;

        const fetchData = async () => {
            try {
                const ressiswa = await fetch(`${API_URL}/siswa`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const siswa = await ressiswa.json();

                const resGuru = await fetch(`${API_URL}/auth/users`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const allUsers = await resGuru.json();
                const guruList = Array.isArray(allUsers) ? allUsers.filter(u => u.role === 'guru') : [];

                const resKelas = await fetch(`${API_URL}/kelas`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const kelasData = await resKelas.json();

                const resKedisiplinan = await fetch(`${API_URL}/kedisiplinan`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const kedisiplinanData = await resKedisiplinan.json();
                
                const now = new Date();
                const oneDayMs = 24 * 60 * 60 * 1000;
                
                const latestKedisiplinan = Array.isArray(kedisiplinanData)
                    ? kedisiplinanData.filter(item => {
                        const violationDate = new Date(item.tanggal_kejadian);
                        return (now - violationDate) <= oneDayMs;
                    }).sort((a, b) => b.id - a.id).slice(0, 6)
                    : [];
                setRecentPelanggaran(latestKedisiplinan);

                setStats({
                    totalsiswa: siswa.length || 0,
                    totalGuru: Array.isArray(guruList) ? guruList.length : 0,
                    totalKelas: Array.isArray(kelasData) ? kelasData.length : 0,
                    totalPelanggaran: Array.isArray(kedisiplinanData) ? kedisiplinanData.length : 0
                });
            } catch (err) {
                console.error('Error fetching dashboard stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token]);

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                    <p className="text-slate-400 font-medium">Memuat Ringkasan...</p>
                </div>
            </div>
        );
    }

    const cards = [
        {
            title: 'Total Siswa',
            value: stats.totalsiswa,
            subtitle: 'Siswa aktif terdaftar',
            icon: Users,
            color: 'from-emerald-400 to-teal-500',
            iconColor: 'text-white',
            linkColor: 'text-emerald-600 dark:text-emerald-400',
            link: '/admin/siswa'
        },
        {
            title: 'Total Guru',
            value: stats.totalGuru,
            subtitle: 'Guru aktif mengajar',
            icon: GraduationCap,
            color: 'from-indigo-400 to-violet-500',
            iconColor: 'text-white',
            linkColor: 'text-indigo-600 dark:text-indigo-400',
            link: '/admin/guru'
        },
        {
            title: 'Total Kelas',
            value: stats.totalKelas,
            subtitle: 'Kelas aktif terdaftar',
            icon: Building,
            color: 'from-sky-400 to-blue-500',
            iconColor: 'text-white',
            linkColor: 'text-sky-600 dark:text-sky-400',
            link: '/admin/kelas'
        },
        {
            title: 'Pelanggaran',
            value: stats.totalPelanggaran !== undefined ? stats.totalPelanggaran : 0,
            subtitle: 'Catatan tata tertib',
            icon: ShieldAlert,
            color: 'from-amber-400 to-orange-500',
            iconColor: 'text-white',
            linkColor: 'text-amber-600 dark:text-amber-400',
            link: null
        }
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-500 p-8 sm:p-10 text-white shadow-xl shadow-emerald-500/20">
                <div className="relative z-10">
                    <h1 className="text-[22px] sm:text-3xl font-extrabold tracking-tight mb-2 sm:mb-3 leading-tight" title={`Selamat datang\n${user?.nama_lengkap || 'Admin'}! 👋`}>
                        Selamat datang <br />
                        {user?.nama_lengkap || 'Admin'}<span className="whitespace-nowrap">! 👋</span>
                    </h1>
                    <p className="text-emerald-50 max-w-2xl text-sm sm:text-base font-medium leading-relaxed opacity-90">
                        Anda login sebagai Admin.
                    </p>
                </div>
                <div className="absolute top-0 right-0 -mr-20 -mt-20 h-72 w-72 rounded-full bg-white opacity-10 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 right-20 -mb-20 h-40 w-40 rounded-full bg-teal-300 opacity-20 blur-2xl pointer-events-none"></div>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
                {cards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <div 
                            key={i} 
                            className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-[#041610] border border-slate-100 dark:border-emerald-500/10 p-3 sm:p-8 shadow-lg shadow-slate-200/50 dark:shadow-none hover:-translate-y-2 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
                        >
                            <div className={`absolute top-0 right-0 -mr-8 -mt-8 h-20 w-20 sm:h-32 sm:w-32 rounded-full bg-gradient-to-br ${card.color} opacity-10 dark:opacity-20 blur-2xl transition-all duration-500 group-hover:scale-150`}></div>
                            <div className="relative z-10 flex justify-between items-start">
                                <div className="space-y-0.5 sm:space-y-1">
                                    <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider line-clamp-1">{card.title}</span>
                                    <h3 className="text-xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tight leading-none">{card.value}</h3>
                                </div>
                                <div className={`h-8 w-8 sm:h-14 sm:w-14 rounded-lg sm:rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-inner shadow-white/20 transform group-hover:rotate-6 transition-transform duration-300 shrink-0`}>
                                    <Icon className={`h-4 w-4 sm:h-7 sm:w-7 ${card.iconColor}`} />
                                </div>
                            </div>
                            <div className="relative z-10 mt-4 sm:mt-8 flex flex-col sm:flex-row sm:items-center justify-between text-[9px] sm:text-xs font-semibold border-t border-slate-100 dark:border-emerald-500/10 pt-2.5 sm:pt-4 gap-1.5 sm:gap-0">
                                <span className="text-slate-500 dark:text-slate-400 line-clamp-1">{card.subtitle}</span>
                                {card.link ? (
                                    <Link href={card.link} className={`flex items-center justify-center gap-1 w-full sm:w-auto ${card.linkColor} hover:opacity-80 transition-opacity bg-slate-50 dark:bg-[#061e16] px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-md sm:rounded-lg`}>
                                        Detail <ArrowUpRight className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
                                    </Link>
                                ) : (
                                    <div className="h-[26px] sm:h-[30px]"></div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Seksi Pelanggaran Terkini — gaya kartu horizontal scroll seperti Pengumuman */}
            <div className="pb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                        Pelanggaran Terkini
                    </h2>
                </div>
                
                {recentPelanggaran.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                        {recentPelanggaran.map((item) => (
                            <div 
                                key={item.id} 
                                onClick={() => setSelectedPelanggaran(item)}
                                className="bg-white dark:bg-[#041610] rounded-2xl p-4 border border-slate-100 dark:border-emerald-500/10 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex items-center gap-4 group"
                            >
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-inner">
                                    <span className="text-lg font-black text-white">
                                        {item.nama_siswa ? item.nama_siswa.charAt(0).toUpperCase() : '?'}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0 flex items-center justify-between gap-3 sm:gap-4">
                                    <div className="min-w-[100px] flex-1">
                                        <h3 className="text-sm font-bold text-slate-800 dark:text-white break-words whitespace-normal leading-snug">
                                            {item.nama_siswa || 'Siswa tidak ditemukan'}
                                        </h3>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium break-words whitespace-normal leading-snug mt-0.5">
                                            {item.nama_pelapor ? `oleh ${item.nama_pelapor}` : 'oleh -'}
                                        </p>
                                    </div>
                                    <div className="flex-1 min-w-0 border-l border-slate-100 dark:border-emerald-500/10 pl-3 sm:pl-4">
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 break-words whitespace-normal leading-snug">
                                            {item.nama_kegiatan || 'Pelanggaran'}
                                        </p>
                                        <div className="flex items-start gap-1 mt-0.5 text-[10px] text-slate-400 font-semibold">
                                            <Clock className="h-3 w-3 shrink-0 mt-[1px]" />
                                            <span className="break-words whitespace-normal leading-snug">{new Date(item.tanggal_kejadian).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-50 dark:bg-[#041610] rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center">
                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-[#061e16] shadow-sm mb-4">
                            <ShieldAlert className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Tidak Ada Pelanggaran</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-2 max-w-sm mx-auto">
                            Tidak ada catatan pelanggaran terbaru.
                        </p>
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
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Detail Pelanggaran</h2>
                            <button onClick={() => setSelectedPelanggaran(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
                            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-5 text-white flex items-center gap-4">
                                <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-black text-white shrink-0">
                                    {selectedPelanggaran.nama_siswa ? selectedPelanggaran.nama_siswa.charAt(0).toUpperCase() : '?'}
                                </div>
                                <div>
                                    <p className="font-extrabold text-lg leading-snug">{selectedPelanggaran.nama_siswa || '-'}</p>
                                    <p className="text-amber-100 text-sm">Kelas {selectedPelanggaran.kelas || '-'}</p>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#041610] rounded-xl border border-slate-200 dark:border-emerald-500/10 divide-y divide-slate-100 dark:divide-emerald-500/10">
                                <div className="p-4 flex justify-between items-start gap-4">
                                    <span className="text-sm text-slate-500 shrink-0">Jenis Pelanggaran</span>
                                    <span className="text-sm font-bold text-slate-800 dark:text-white text-right">{selectedPelanggaran.nama_kegiatan || 'Pelanggaran'}</span>
                                </div>
                                <div className="p-4 flex justify-between items-start gap-4">
                                    <span className="text-sm text-slate-500 shrink-0">Tanggal</span>
                                    <span className="text-sm font-bold text-slate-800 dark:text-white text-right">
                                        {new Date(selectedPelanggaran.tanggal_kejadian).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                                {selectedPelanggaran.nama_pelapor && (
                                    <div className="p-4 flex justify-between items-start gap-4">
                                        <span className="text-sm text-slate-500 shrink-0">Dilaporkan Oleh</span>
                                        <span className="text-sm font-bold text-slate-800 dark:text-white text-right">
                                            {selectedPelanggaran.nama_pelapor}
                                        </span>
                                    </div>
                                )}
                                {selectedPelanggaran.keterangan && (
                                    <div className="p-4">
                                        <p className="text-sm text-slate-500 mb-1">Keterangan</p>
                                        <p className="text-sm font-medium text-slate-800 dark:text-white whitespace-pre-wrap">{selectedPelanggaran.keterangan}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
