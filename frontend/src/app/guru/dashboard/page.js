"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { 
    Users, HeartPulse, ShieldAlert, CircleDollarSign, 
    BookOpen, PlusCircle, ArrowUpRight, ChevronRight, Zap, Calendar, Megaphone, X, Bell
} from 'lucide-react';

export default function AdminDashboard() {
    const { token, user } = useAuth();
    const [stats, setStats] = useState({
        totalsiswa: 0,
        totalJadwal: 0,
        kelasMengajar: [],
        jadwalHariIni: [],
        hariIni: ''
    });
    const [pengumuman, setPengumuman] = useState([]);
    const [selectedPengumuman, setSelectedPengumuman] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_URL = '/api';

    useEffect(() => {
        if (!token) return;

        const fetchData = async () => {
            try {
                // Fetch Total Siswa
                const ressiswa = await fetch(`${API_URL}/siswa`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const siswa = await ressiswa.json();

                // Fetch Jadwal Mengajar Guru
                const resJadwal = await fetch(`${API_URL}/jadwal/my-jadwal`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const jadwalData = await resJadwal.json();
                
                // Ekstrak unik kelas yang diajar
                const uniqueKelas = Array.isArray(jadwalData) 
                    ? Array.from(new Set(jadwalData.map(j => j.kelas).filter(Boolean))).sort()
                    : [];
                
                const kelasWithCount = uniqueKelas.map(namaKelas => {
                    const count = Array.isArray(siswa) 
                        ? siswa.filter(s => s.kelas === namaKelas).length 
                        : 0;
                    return { nama: namaKelas, count };
                });
                
                // Fetch Pengumuman
                const resPeng = await fetch(`${API_URL}/pengumuman`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const pengLogs = await resPeng.json();

                const hariMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                const hariIni = hariMap[new Date().getDay()];
                const jadwalHariIni = Array.isArray(jadwalData) 
                    ? jadwalData.filter(j => j.hari === hariIni) 
                    : [];

                setStats({
                    totalsiswa: siswa.length || 0,
                    totalJadwal: Array.isArray(jadwalData) ? jadwalData.length : 0,
                    kelasMengajar: kelasWithCount,
                    jadwalHariIni: jadwalHariIni,
                    hariIni: hariIni
                });
                
                setPengumuman(Array.isArray(pengLogs) ? pengLogs.slice(0, 4) : []);
            } catch (err) {
                console.error('Error fetching dashboard stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token]);

    const formatRupiah = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(val);
    };

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

    return (
        <div className="space-y-6 sm:space-y-8 animate-fade-in">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-500 p-6 sm:p-8 text-white shadow-lg shadow-emerald-500/20">
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-[22px] sm:text-2xl font-extrabold tracking-tight mb-2 leading-tight" title={`Selamat datang\n${user?.nama_lengkap || 'Guru'}! 👋`}>
                            Selamat datang <br />
                            {user?.nama_lengkap || 'Guru'}<span className="whitespace-nowrap">! 👋</span>
                        </h1>
                        <p className="text-emerald-50 max-w-2xl text-sm font-medium leading-relaxed opacity-90">
                            Anda log in sebagai <span className="font-bold bg-white/20 px-2 py-0.5 rounded-md">
                                {user?.is_wali_kelas && user?.kelas_wali?.length > 0 ? (
                                    (() => {
                                        const digitMap = {
                                            'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5', 'VI': '6',
                                            'VII': '7', 'VIII': '8', 'IX': '9', 'X': '10', 'XI': '11', 'XII': '12'
                                        };
                                        const spelledMap = {
                                            'I': 'Satu', 'II': 'Dua', 'III': 'Tiga', 'IV': 'Empat', 'V': 'Lima', 'VI': 'Enam',
                                            'VII': 'Tujuh', 'VIII': 'Delapan', 'IX': 'Sembilan', 'X': 'Sepuluh', 'XI': 'Sebelas', 'XII': 'Dua Belas'
                                        };
                                        const namaKelas = user.kelas_wali[0].nama_kelas.trim();
                                        const match = namaKelas.split(/[\s()]/)[0].toUpperCase();
                                        const suffix = namaKelas.replace(new RegExp(`^${match}`, 'i'), '').replace(/\s*\([^)]*\)/g, '').trim();
                                        
                                        const digit = digitMap[match] || match;
                                        
                                        return `Wali Kelas ${digit}${suffix ? ' ' + suffix : ''}`.trim();
                                    })()
                                ) : 'Guru'}
                            </span>.
                        </p>
                    </div>
                </div>
                {/* Decorative background shapes */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white opacity-10 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 right-10 -mb-16 h-32 w-32 rounded-full bg-teal-300 opacity-20 blur-2xl pointer-events-none"></div>
            </div>

            {/* Informasi Kelas Mengajar */}
            <div className="pt-2">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 text-white">
                        <BookOpen className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                        Kelas yang Anda Ajar
                    </h2>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-6">
                    {stats.kelasMengajar.length > 0 ? (
                        stats.kelasMengajar.map((kelas, idx) => {
                            const colors = [
                                { bg: 'bg-emerald-500', text: 'text-emerald-500', glow: 'bg-emerald-400', icon: <Users className="h-6 w-6 text-white" /> },
                                { bg: 'bg-blue-500', text: 'text-blue-500', glow: 'bg-blue-400', icon: <BookOpen className="h-6 w-6 text-white" /> },
                                { bg: 'bg-orange-500', text: 'text-orange-500', glow: 'bg-orange-400', icon: <Zap className="h-6 w-6 text-white" /> },
                                { bg: 'bg-rose-500', text: 'text-rose-500', glow: 'bg-rose-400', icon: <HeartPulse className="h-6 w-6 text-white" /> },
                            ];
                            const style = colors[idx % colors.length];

                            return (
                                <div key={idx} className="bg-white dark:bg-[#041610] rounded-xl sm:rounded-[24px] p-2.5 sm:p-8 border border-slate-100 dark:border-slate-800/60 shadow-sm hover:shadow-md transition-all relative overflow-hidden group flex flex-col justify-between">
                                    {/* Faint Glow */}
                                    <div className={`absolute top-0 right-0 -mr-10 -mt-10 h-16 w-16 sm:h-48 sm:w-48 rounded-full blur-3xl opacity-[0.07] pointer-events-none ${style.glow}`}></div>
                                    
                                    <div className="flex justify-between items-start mb-2 sm:mb-8 relative z-10">
                                        <div className="flex-1 min-w-0 pr-1 sm:pr-2">
                                            <p className="text-[7px] sm:text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5 sm:mb-1.5">
                                                KELAS
                                            </p>
                                            <h3 className="text-[11px] sm:text-lg md:text-xl font-black text-slate-800 dark:text-white whitespace-nowrap tracking-tighter" title={kelas.nama}>
                                                {kelas.nama.replace(/\s*\([^)]*\)/g, '')}
                                            </h3>
                                        </div>
                                        <div className={`h-6 w-6 sm:h-14 sm:w-14 rounded-md sm:rounded-2xl flex items-center justify-center shadow-lg ${style.bg} shadow-${style.bg}/30 shrink-0`}>
                                            <div className="scale-[0.4] sm:scale-100">{style.icon}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="border-t border-slate-100 dark:border-slate-800/60 pt-2 sm:pt-5 flex flex-col relative z-10">
                                        <div className="flex items-center justify-center gap-1 px-1.5 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg bg-slate-50 dark:bg-[#061e16] text-slate-600 dark:text-slate-300 text-[8px] sm:text-[11px] font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group-hover:text-emerald-600 dark:group-hover:text-emerald-400 w-full">
                                            Detail <ArrowUpRight className="h-2 w-2 sm:h-3 sm:w-3" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full flex items-center justify-center p-12 rounded-[24px] font-medium text-sm bg-slate-50 dark:bg-[#041610] text-slate-500 border border-slate-200 dark:border-slate-800 border-dashed">
                            Belum ada jadwal mengajar yang ditugaskan.
                        </div>
                    )}
                </div>
            </div>

            {/* Seksi Pengumuman (Selalu Tampil) */}
            <div className="mt-12 pb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        Pengumuman
                    </h2>
                    <Link href="/guru/pengumuman" className="text-sm font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        Lainnya
                    </Link>
                </div>
                
                {pengumuman.length > 0 ? (
                    <div className="flex flex-nowrap overflow-x-auto gap-6 pb-6 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {pengumuman.map((item, idx) => (
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
