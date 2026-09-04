"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTahunAjaran } from '@/hooks/useTahunAjaran';
import { ClipboardList, Search, Users, AlertCircle, Wallet } from 'lucide-react';

const API_URL = '/api';

export default function TunggakanPage() {
    const { token } = useAuth();
    const { tahunAjaranList, selectedTahunAjaranId, setSelectedTahunAjaranId, loadingTahunAjaran } = useTahunAjaran();
    const [tunggakanList, setTunggakanList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterKelas, setFilterKelas] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchTunggakan = async () => {
        try {
            setLoading(true);
            let query = `${API_URL}/keuangan?status_bayar=belum_lunas&`;
            if (filterKelas) query += `kelas=${filterKelas}&`;
            
            const res = await fetch(query, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setTunggakanList(data);
            } else {
                throw new Error(data.message || 'Gagal memuat data tunggakan.');
            }
        } catch (err) {
            console.error('Error fetching tunggakan:', err);
        } finally {
            setLoading(false);
        }
    };

    const getMonthName = (num) => {
        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        return months[num - 1] || '';
    };

    const formatRupiah = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(val);
    };

    useEffect(() => {
        if (token) {
            fetchTunggakan();
        }
    }, [token, filterKelas]);

    const filteredTunggakan = tunggakanList.filter(item => {
        const searchLower = searchQuery.toLowerCase();
        const matchSearch = 
            (item.nama_siswa || '').toLowerCase().includes(searchLower) ||
            (item.nis || '').toLowerCase().includes(searchLower);
        return matchSearch;
    });

    // Group by TA
    const groupedTunggakan = filteredTunggakan.reduce((acc, bill) => {
        const taId = bill.tahun_ajaran_id || 'unknown';
        if (!acc[taId]) acc[taId] = [];
        acc[taId].push(bill);
        return acc;
    }, {});
    
    // Sort TA (descending)
    const sortedTaIds = Object.keys(groupedTunggakan).sort((a, b) => {
        if (a === 'unknown') return 1;
        if (b === 'unknown') return -1;
        return parseInt(b) - parseInt(a);
    });

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* Header */}
            <div className="mb-8 p-6 bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent rounded-3xl border border-rose-500/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden shadow-sm">
                <div className="relative z-10">
                    <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3">
                        <div className="p-3 bg-white dark:bg-rose-500/20 rounded-2xl shadow-sm border border-rose-100 dark:border-rose-500/30">
                            <ClipboardList className="h-6 w-6 text-rose-500" />
                        </div>
                        Data Tunggakan
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">Rekapitulasi tagihan siswa yang belum dibayar.</p>
                </div>
                <div className="absolute -right-12 -top-12 text-rose-500/5 rotate-12 scale-150 z-0 pointer-events-none">
                    <ClipboardList className="h-48 w-48" />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white dark:bg-[#041610] p-5 rounded-3xl border border-slate-200 dark:border-emerald-500/10 shadow-sm flex items-center gap-4 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                    <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                        <AlertCircle className="h-7 w-7 text-amber-500" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Tagihan</p>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white">{filteredTunggakan.length} <span className="text-sm font-semibold text-slate-500">item</span></h3>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#041610] p-5 rounded-3xl border border-slate-200 dark:border-emerald-500/10 shadow-sm flex items-center gap-4 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                    <div className="h-14 w-14 rounded-2xl bg-rose-500/10 flex items-center justify-center shrink-0">
                        <Wallet className="h-7 w-7 text-rose-500" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Nominal</p>
                        <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400">{formatRupiah(filteredTunggakan.reduce((acc, curr) => acc + parseFloat(curr.nominal), 0))}</h3>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#041610] p-5 rounded-3xl border border-slate-200 dark:border-emerald-500/10 shadow-sm flex items-center gap-4 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                    <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Users className="h-7 w-7 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Siswa Menunggak</p>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white">{new Set(filteredTunggakan.map(t => t.siswa_id)).size} <span className="text-sm font-semibold text-slate-500">siswa</span></h3>
                    </div>
                </div>
            </div>

            {/* Main Content Panel */}
            <div className="w-full mt-4 space-y-6">
                
                {/* Search & Filter Options */}
                <div className="flex flex-wrap gap-4 items-center justify-start pb-2">
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <div className="grid grid-cols-1 gap-3 w-full sm:w-auto">
                            <select
                                value={filterKelas}
                                onChange={(e) => setFilterKelas(e.target.value)}
                                className="w-full sm:min-w-[140px] rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none shadow-sm cursor-pointer"
                            >
                                <option value="">Semua Kelas</option>
                                <option value="VII">Kelas VII</option>
                                <option value="VIII">Kelas VIII</option>
                                <option value="IX">Kelas IX</option>
                            </select>
                        </div>

                        <div className="relative w-full sm:flex-1">
                            <input
                                type="text"
                                placeholder="Cari Nama / NIS Siswa..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none shadow-sm placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                </div>

                {/* Tunggakan Table */}
                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                    </div>
                ) : tunggakanList.length === 0 ? (
                    <div className="text-center py-20 px-6 bg-gradient-to-b from-slate-50 to-white dark:from-[#041610] dark:to-[#020c08] rounded-3xl border border-slate-200 dark:border-emerald-500/10 shadow-sm relative overflow-hidden">
                        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                        <div className="relative z-10 max-w-sm mx-auto">
                            <div className="mx-auto w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6 shadow-inner rotate-3">
                                <ClipboardList className="h-10 w-10 text-emerald-600 dark:text-emerald-400 -rotate-3" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Alhamdulillah!</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">Tidak ada tagihan siswa yang belum dibayar. Semua tagihan sudah lunas.</p>
                        </div>
                    </div>
                ) : filteredTunggakan.length === 0 ? (
                    <div className="text-center py-20 px-6 bg-slate-50 dark:bg-[#041610] rounded-3xl border border-slate-200 dark:border-emerald-500/10">
                        <div className="mx-auto w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 rotate-3">
                            <Search className="h-10 w-10 text-slate-400 -rotate-3" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Data tidak ditemukan</h3>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Tidak ada catatan tunggakan yang cocok dengan pencarian Anda.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {sortedTaIds.map((taId) => {
                            const groupBills = groupedTunggakan[taId];
                            const ta = tahunAjaranList.find(t => t.id.toString() === taId.toString());
                            const taName = ta ? `${ta.nama_tahun} ${ta.semester}` : 'Tahun Ajaran Umum';
                            
                            // Group by bulan
                            const billsByBulan = groupBills.reduce((acc, bill) => {
                                const bId = bill.bulan || 0;
                                if (!acc[bId]) acc[bId] = [];
                                acc[bId].push(bill);
                                return acc;
                            }, {});
                            
                            // Sort bulan descending
                            const sortedBulanIds = Object.keys(billsByBulan).sort((a, b) => parseInt(b) - parseInt(a));

                            return (
                                <div key={taId} className="space-y-6">
                                    <div className="px-1 flex items-center justify-between">
                                        <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Tahun Ajaran: {taName}</h3>
                                    </div>
                                    <div className="space-y-6">
                                        {sortedBulanIds.map(bulanId => {
                                            const monthBills = billsByBulan[bulanId];
                                            return (
                                                <div key={bulanId} className="bg-white dark:bg-[#020c08]/50 rounded-2xl border border-slate-200 dark:border-emerald-500/20 overflow-hidden shadow-sm">
                                                    <div className="bg-slate-50 dark:bg-slate-800/30 px-4 py-2.5 border-b border-slate-200 dark:border-emerald-500/10 text-center">
                                                        <h4 className="font-bold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-widest">BULAN {getMonthName(bulanId)}</h4>
                                                    </div>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap min-w-max border-separate border-spacing-0">
                                                            <thead>
                                                                <tr className="bg-slate-50 dark:bg-[#061e16]">
                                                                    <th className="py-3 px-4 border-b border-r border-slate-200 dark:border-emerald-500/10 text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Siswa</th>
                                                                    <th className="py-3 px-4 border-b border-r border-slate-200 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Jenis Tagihan</th>
                                                                    <th className="py-3 px-4 border-b border-r border-slate-200 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Nominal</th>
                                                                    <th className="py-3 px-4 border-b border-r border-slate-200 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Tanggal Bayar</th>
                                                                    <th className="py-3 px-4 text-center border-b border-slate-200 dark:border-emerald-500/10 text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {monthBills.map((b) => (
                                                                    <tr 
                                                                        key={b.id} 
                                                                        className="hover:bg-slate-50 dark:hover:bg-[#082a1f] transition-colors group"
                                                                    >
                                                                        <td className="py-3 px-4 border-b border-r border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]">
                                                                            <span className="font-bold text-slate-800 dark:text-white block">{b.nama_siswa}</span>
                                                                            <span className="text-[11px] text-slate-500 dark:text-slate-400">Kelas {b.kelas}</span>
                                                                        </td>
                                                                        <td className="py-3 px-4 border-b border-r border-slate-200 dark:border-emerald-500/10 text-center bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]">
                                                                            <div className="font-semibold text-slate-700 dark:text-slate-200">
                                                                                {b.nama_tagihan || 'Tagihan'}
                                                                            </div>
                                                                            <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                                                                                {`${getMonthName(b.bulan)} ${b.tahun}`}
                                                                            </div>
                                                                        </td>
                                                                        <td className="py-3 px-4 border-b border-r border-slate-200 dark:border-emerald-500/10 text-center bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]">
                                                                            <div className="font-bold text-emerald-600 dark:text-emerald-400">
                                                                                {formatRupiah(b.nominal)}
                                                                            </div>
                                                                            <div className="text-[10px] text-slate-500 mt-0.5">
                                                                                Dibuat: {b.created_at ? new Date(b.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                                                                            </div>
                                                                        </td>
                                                                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs font-medium border-b border-r border-slate-200 dark:border-emerald-500/10 text-center bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]">
                                                                            <span className="text-slate-400 dark:text-slate-600">-</span>
                                                                        </td>
                                                                        <td className="py-3 px-4 text-center border-b border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]">
                                                                            <div className="flex justify-center">
                                                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                                                                                    Belum Dibayar
                                                                                </span>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-200 dark:border-emerald-500/10 gap-2">
                            <span className="text-sm font-semibold text-slate-500">
                                Total Tagihan Menunggak: <span className="text-slate-700 dark:text-slate-200">{filteredTunggakan.length} Tagihan</span>
                            </span>
                            <span className="text-sm font-semibold text-slate-500">
                                Estimasi Nilai Tunggakan: <span className="text-rose-600 dark:text-rose-400 font-bold text-lg ml-2">{formatRupiah(filteredTunggakan.reduce((acc, curr) => acc + parseFloat(curr.nominal), 0))}</span>
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
