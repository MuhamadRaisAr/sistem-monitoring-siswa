"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { Wallet, Check, Undo2, X, History, Clock } from 'lucide-react';

const API_URL = '/api';
export default function HonorGuruPage() {
    const { token } = useAuth();
    const pathname = usePathname();
    const [unpaidList, setUnpaidList] = useState([]);
    const [riwayatList, setRiwayatList] = useState([]);
    const [loading, setLoading] = useState(true);
    const activeTab = pathname.includes('/riwayat') ? 'riwayat' : 'unpaid';

    // Nominal per pertemuan state (can be changed by bendahara)
    const [nominalMap, setNominalMap] = useState({});

    // Fetch data
    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch unpaid
            const resUnpaid = await fetch(`${API_URL}/bendahara/honor/unpaid`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const dataUnpaid = await resUnpaid.json();
            
            // Initialize nominal default to empty if not set
            const initialNominal = {};
            if (Array.isArray(dataUnpaid)) {
                dataUnpaid.forEach((item, idx) => {
                    initialNominal[`${item.guru_id}_${item.mapel}`] = '';
                });
            }
            setNominalMap(prev => ({ ...initialNominal, ...prev }));
            setUnpaidList(Array.isArray(dataUnpaid) ? dataUnpaid : []);

            // Fetch riwayat
            const resRiwayat = await fetch(`${API_URL}/bendahara/honor/riwayat`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const dataRiwayat = await resRiwayat.json();
            setRiwayatList(Array.isArray(dataRiwayat) ? dataRiwayat : []);
            
        } catch (err) {
            console.error('Error fetching honor data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]);

    const handleNominalChange = (guru_id, mapel, value) => {
        setNominalMap(prev => ({
            ...prev,
            [`${guru_id}_${mapel}`]: value
        }));
    };

    const handleBayar = async (guru_id, mapel, jumlah_pertemuan) => {
        const nominal = nominalMap[`${guru_id}_${mapel}`] || 0;
        const total = jumlah_pertemuan * nominal;
        
        if (!confirm(`Bayar honor untuk ${mapel}?\nJumlah Pertemuan: ${jumlah_pertemuan}\nNominal per Pertemuan: Rp ${nominal.toLocaleString('id-ID')}\nTotal Bayar: Rp ${total.toLocaleString('id-ID')} ?`)) {
            return;
        }

        try {
            const res = await fetch(`${API_URL}/bendahara/honor/pay`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ guru_id, mapel, nominal_per_pertemuan: nominal })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            fetchData(); // Refresh data
        } catch (err) {
            alert('Gagal membayar: ' + err.message);
        }
    };

    const handleBatalkan = async (id, nama_guru) => {
        if (!confirm(`Batalkan pembayaran untuk guru ${nama_guru}? Data pertemuan akan kembali menjadi belum dibayar.`)) {
            return;
        }

        try {
            const res = await fetch(`${API_URL}/bendahara/honor/riwayat/${id}`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            fetchData(); // Refresh data
        } catch (err) {
            alert('Gagal membatalkan: ' + err.message);
        }
    };

    return (
        <div className="p-4 sm:p-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3">
                        <Wallet className="h-8 w-8 text-emerald-500" />
                        {activeTab === 'riwayat' ? 'Riwayat Pembayaran Honor' : 'Penggajian Guru Mapel'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm sm:text-base">
                        Kelola pencairan honor berdasarkan rekap absensi pertemuan KBM.
                    </p>
                </div>
            </div>
            {loading ? (
                <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                </div>
            ) : (
                <div className="bg-white dark:bg-[#041610] rounded-2xl border border-slate-200 dark:border-emerald-500/10 shadow-sm overflow-hidden">
                    {activeTab === 'unpaid' && (
                        unpaidList.length === 0 ? (
                            <div className="text-center py-16 text-slate-500 flex flex-col items-center gap-3">
                                <Wallet className="h-12 w-12 text-emerald-500 opacity-50" />
                                <p className="text-sm font-medium">Belum ada guru mata pelajaran yang dijadwalkan.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs whitespace-nowrap min-w-max border-separate border-spacing-0">
                                    <thead className="bg-slate-50 dark:bg-[#061e16] border-b border-slate-200 dark:border-emerald-500/10 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                                        <tr className="divide-x divide-slate-200 dark:divide-emerald-500/10">
                                            <th className="py-4 px-6">Guru</th>
                                            <th className="py-4 px-6">Mata Pelajaran</th>
                                            <th className="py-4 px-6 text-center">Pertemuan (Unpaid)</th>
                                            <th className="py-4 px-6">Nominal / Pertemuan</th>
                                            <th className="py-4 px-6 text-right">Total Tagihan</th>
                                            <th className="py-4 px-6 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-emerald-500/10">
                                        {unpaidList.map((item, idx) => {
                                            const rawNominal = nominalMap[`${item.guru_id}_${item.mapel}`];
                                            const nominalValue = rawNominal === '' ? 0 : (rawNominal || 0);
                                            const total = item.jumlah_pertemuan_belum_dibayar * nominalValue;
                                            return (
                                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] divide-x divide-slate-100 dark:divide-emerald-500/10">
                                                    <td className="py-3 px-6 font-semibold text-slate-700 dark:text-slate-200">
                                                        {item.nama_guru}
                                                    </td>
                                                    <td className="py-3 px-6 text-slate-600 dark:text-slate-300">
                                                        {item.mapel}
                                                    </td>
                                                    <td className="py-3 px-6 text-center">
                                                        <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full font-bold">
                                                            {item.jumlah_pertemuan_belum_dibayar}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-6">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-slate-400 font-medium">Rp</span>
                                                            <input 
                                                                type="number"
                                                                value={rawNominal === '' ? '' : nominalValue}
                                                                onChange={(e) => handleNominalChange(item.guru_id, item.mapel, e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                                                                placeholder="0"
                                                                className="w-24 bg-white dark:bg-[#020c08] border border-slate-300 dark:border-emerald-500/20 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-6 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                                                        Rp {total.toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="py-3 px-6 text-center">
                                                        <button
                                                            onClick={() => handleBayar(item.guru_id, item.mapel, item.jumlah_pertemuan_belum_dibayar)}
                                                            disabled={item.jumlah_pertemuan_belum_dibayar === 0}
                                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${item.jumlah_pertemuan_belum_dibayar === 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
                                                        >
                                                            <Check className="h-4 w-4" />
                                                            {item.jumlah_pertemuan_belum_dibayar === 0 ? 'Lunas' : 'Bayar'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}

                    {activeTab === 'riwayat' && (
                        riwayatList.length === 0 ? (
                            <div className="text-center py-16 text-slate-500 flex flex-col items-center gap-3">
                                <History className="h-12 w-12 opacity-30" />
                                <p className="text-sm font-medium">Belum ada riwayat pembayaran honor.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs whitespace-nowrap min-w-max border-separate border-spacing-0">
                                    <thead className="bg-slate-50 dark:bg-[#061e16] border-b border-slate-200 dark:border-emerald-500/10 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                                        <tr className="divide-x divide-slate-200 dark:divide-emerald-500/10">
                                            <th className="py-4 px-6">Tanggal Bayar</th>
                                            <th className="py-4 px-6">Guru</th>
                                            <th className="py-4 px-6">Mata Pelajaran</th>
                                            <th className="py-4 px-6 text-center">Pertemuan Dibayar</th>
                                            <th className="py-4 px-6 text-right">Total Nominal</th>
                                            <th className="py-4 px-6 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-emerald-500/10">
                                        {riwayatList.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] divide-x divide-slate-100 dark:divide-emerald-500/10">
                                                <td className="py-3 px-6 text-slate-500 dark:text-slate-400">
                                                    {new Date(item.tanggal_bayar).toLocaleString('id-ID', {
                                                        day: 'numeric', month: 'short', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </td>
                                                <td className="py-3 px-6 font-semibold text-slate-700 dark:text-slate-200">
                                                    {item.nama_guru}
                                                </td>
                                                <td className="py-3 px-6 text-slate-600 dark:text-slate-300">
                                                    {item.mapel}
                                                </td>
                                                <td className="py-3 px-6 text-center">
                                                    <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full font-bold">
                                                        {item.jumlah_pertemuan}x
                                                    </span>
                                                </td>
                                                <td className="py-3 px-6 text-right font-bold text-slate-700 dark:text-slate-200">
                                                    Rp {parseFloat(item.total_bayar).toLocaleString('id-ID')}
                                                </td>
                                                <td className="py-3 px-6 text-center">
                                                    <button
                                                        onClick={() => handleBatalkan(item.id, item.nama_guru)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 rounded-lg text-xs font-bold transition-colors"
                                                    >
                                                        <Undo2 className="h-4 w-4" />
                                                        Batalkan
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
}
