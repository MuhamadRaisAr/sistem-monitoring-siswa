"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { 
    Users, ShieldAlert, CircleDollarSign, 
    BookOpen, ArrowUpRight, Zap, GraduationCap, Building,
    BookOpenCheck, Calendar, Megaphone, UserCog, X, Clock
} from 'lucide-react';

export default function BendaharaDashboard() {
    const { token, user } = useAuth();
    const [stats, setStats] = useState({
        totalTagihanBaru: 0,
        menungguValidasi: 0,
        siswaNunggak: 0,
        estimasiTunggakan: 0,
        tagihanLunas: 0
    });
    const [recentValidasi, setRecentValidasi] = useState([]);
    const [loading, setLoading] = useState(true);

    const API_URL = '/api';

    useEffect(() => {
        if (!token) return;

        const fetchData = async () => {
            try {
                // Fetch Keuangan (all bills)
                const resKeuangan = await fetch(`${API_URL}/keuangan`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const keuanganData = await resKeuangan.json();
                
                const tagihanBaru = Array.isArray(keuanganData) ? keuanganData.filter(k => k.status_bayar === 'belum_dibayar').length : 0;
                
                const validasiData = Array.isArray(keuanganData) ? keuanganData.filter(k => k.status_bayar === 'menunggu_verifikasi') : [];
                const menungguValidasi = validasiData.length;

                // Ambil 6 tagihan terbaru yang menunggu validasi
                const latestValidasi = validasiData.sort((a, b) => new Date(b.tanggal_bayar || b.created_at || 0) - new Date(a.tanggal_bayar || a.created_at || 0)).slice(0, 6);
                setRecentValidasi(latestValidasi);

                // Fetch Tunggakan
                const resTunggakan = await fetch(`${API_URL}/keuangan/tunggakan`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const tunggakanData = await resTunggakan.json();
                const siswaNunggak = Array.isArray(tunggakanData) ? tunggakanData.length : 0;
                const estimasiTunggakan = Array.isArray(tunggakanData) ? tunggakanData.reduce((acc, curr) => acc + parseFloat(curr.total_tunggakan), 0) : 0;

                const tagihanLunas = Array.isArray(keuanganData) ? keuanganData.filter(k => k.status_bayar === 'lunas').length : 0;

                setStats({
                    totalTagihanBaru: tagihanBaru,
                    menungguValidasi: menungguValidasi,
                    siswaNunggak: siswaNunggak,
                    estimasiTunggakan: estimasiTunggakan,
                    tagihanLunas: tagihanLunas
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
            title: 'Tagihan Baru',
            value: stats.totalTagihanBaru,
            subtitle: 'Total tagihan belum lunas',
            icon: CircleDollarSign,
            color: 'from-emerald-400 to-teal-500',
            iconColor: 'text-white',
            linkColor: 'text-emerald-600 dark:text-emerald-400',
            link: '/bendahara/keuangan'
        },
        {
            title: 'Menunggu Validasi',
            value: stats.menungguValidasi,
            subtitle: 'Bukti transfer perlu dicek',
            icon: BookOpenCheck,
            color: 'from-amber-400 to-orange-500',
            iconColor: 'text-white',
            linkColor: 'text-amber-600 dark:text-amber-400',
            link: '/bendahara/keuangan/validasi'
        },
        {
            title: 'Tagihan Lunas',
            value: stats.tagihanLunas,
            subtitle: 'Total tagihan dibayar',
            icon: CircleDollarSign,
            color: 'from-indigo-400 to-violet-500',
            iconColor: 'text-white',
            linkColor: 'text-indigo-600 dark:text-indigo-400',
            link: '/bendahara/keuangan/riwayat'
        },
        {
            title: 'Siswa Nunggak',
            value: stats.siswaNunggak,
            subtitle: 'Siswa belum bayar SPP',
            icon: ShieldAlert,
            color: 'from-rose-400 to-red-500',
            iconColor: 'text-white',
            linkColor: 'text-rose-600 dark:text-rose-400',
            link: '/bendahara/keuangan/tunggakan'
        }
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-500 p-8 sm:p-10 text-white shadow-xl shadow-emerald-500/20">
                <div className="relative z-10">
                    <h1 className="text-[22px] sm:text-3xl font-extrabold tracking-tight mb-2 sm:mb-3 leading-tight" title={`Selamat datang\n${user?.nama_lengkap || 'Admin'}! 👋`}>
                        Selamat datang <br />
                        {user?.nama_lengkap || 'Bendahara'}<span className="whitespace-nowrap">! 👋</span>
                    </h1>
                    <p className="text-emerald-50 max-w-2xl text-sm sm:text-base font-medium leading-relaxed opacity-90">
                        Anda login sebagai Bendahara.
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
                                <Link href={card.link} className={`flex items-center justify-center gap-1 w-full sm:w-auto ${card.linkColor} hover:opacity-80 transition-opacity bg-slate-50 dark:bg-[#061e16] px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-md sm:rounded-lg`}>
                                    Detail <ArrowUpRight className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Seksi Validasi Terkini */}
            <div className="pb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <BookOpenCheck className="h-5 w-5 text-amber-500" />
                        Menunggu Validasi Terkini
                    </h2>
                    <Link href="/bendahara/keuangan/validasi" className="text-sm font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        Lihat Semua
                    </Link>
                </div>
                
                {recentValidasi.length > 0 ? (
                    <div className="flex flex-col gap-3 sm:gap-4">
                        {recentValidasi.map((item) => (
                            <Link 
                                href="/bendahara/keuangan/validasi"
                                key={item.id} 
                                className="bg-white dark:bg-[#041610] rounded-2xl p-4 border border-slate-100 dark:border-emerald-500/10 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 group"
                            >
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-inner">
                                    <span className="text-lg font-black text-white">
                                        {item.nama_siswa ? item.nama_siswa.charAt(0).toUpperCase() : '?'}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0 flex items-center justify-between gap-3 sm:gap-6">
                                    <div className="flex-1 sm:flex-1 min-w-[100px] flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2">
                                        <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white truncate">
                                            {item.nama_siswa || 'Siswa'}
                                        </h3>
                                        <span className="hidden sm:block text-slate-300 dark:text-slate-600 font-bold">•</span>
                                        <p className="text-[10px] sm:text-sm text-slate-500 dark:text-slate-400 font-medium truncate">
                                            Kelas {item.kelas || '-'}
                                        </p>
                                    </div>
                                    <div className="flex-1 sm:flex-[1.5] min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between border-l border-slate-100 dark:border-emerald-500/10 pl-3 sm:pl-0 sm:border-l-0 gap-1 sm:gap-6">
                                        <div className="flex-1 min-w-[80px] sm:border-l sm:border-slate-100 sm:dark:border-emerald-500/10 sm:pl-6">
                                            <p className="text-xs sm:text-base font-bold text-emerald-600 dark:text-emerald-400 truncate">
                                                Rp {parseFloat(item.nominal).toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                        <div className="flex-[1.5] min-w-[120px] sm:border-l sm:border-slate-100 sm:dark:border-emerald-500/10 sm:pl-6">
                                            <div className="flex items-start sm:items-center gap-1 sm:gap-1.5 text-[10px] sm:text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">
                                                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500 shrink-0 mt-[1px] sm:mt-0" />
                                                <span className="truncate whitespace-normal sm:whitespace-nowrap leading-snug sm:leading-normal">
                                                    {item.nama_tagihan || 'SPP'} - {item.bulan ? new Date(2000, item.bulan - 1).toLocaleString('id-ID', { month: 'short' }) : ''} {item.tahun}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-50 dark:bg-[#041610] rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center">
                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-[#061e16] shadow-sm mb-4">
                            <BookOpenCheck className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Tidak Ada Validasi</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-2 max-w-sm mx-auto">
                            Semua tagihan sudah tervalidasi dengan baik.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
