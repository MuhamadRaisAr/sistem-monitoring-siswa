"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTahunAjaran } from '@/hooks/useTahunAjaran';
import { ClipboardList, Search } from 'lucide-react';

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
            if (selectedTahunAjaranId) query += `tahun_ajaran_id=${selectedTahunAjaranId}&`;
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
        if (token && selectedTahunAjaranId) {
            fetchTunggakan();
        }
    }, [token, selectedTahunAjaranId, filterKelas]);

    const filteredTunggakan = tunggakanList.filter(item => {
        const searchLower = searchQuery.toLowerCase();
        const matchSearch = 
            (item.nama_siswa || '').toLowerCase().includes(searchLower) ||
            (item.nis || '').toLowerCase().includes(searchLower);
        return matchSearch;
    });

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <ClipboardList className="h-8 w-8 text-rose-500" />
                        Data Tunggakan
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">Rekapitulasi tagihan siswa yang belum dibayar.</p>
                </div>
            </div>

            {/* Main Content Panel */}
            <div className="w-full mt-4 space-y-6">
                
                {/* Search & Filter Options */}
                <div className="flex flex-wrap gap-4 items-center justify-start pb-2">
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                            <select
                                value={selectedTahunAjaranId}
                                onChange={(e) => setSelectedTahunAjaranId(e.target.value)}
                                disabled={loadingTahunAjaran}
                                className="w-full sm:min-w-[180px] rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none shadow-sm cursor-pointer disabled:opacity-50"
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
                    <div className="text-center py-12 text-slate-500 text-sm bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-100 dark:border-white/5">
                        <div className="mx-auto w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-3">
                            <ClipboardList className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        Alhamdulillah, tidak ada tagihan siswa yang belum dibayar.
                    </div>
                ) : filteredTunggakan.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-sm bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-100 dark:border-white/5">
                        Tidak ada catatan tunggakan ditemukan untuk pencarian ini.
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="overflow-x-auto bg-white dark:bg-[#020c08]/50 rounded-2xl border border-slate-200 dark:border-emerald-500/10 shadow-sm">
                            <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap min-w-max border-separate border-spacing-0">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-[#061e16]">
                                        <th className="py-3 px-4 border-b border-r border-slate-300 dark:border-emerald-500/10 text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Siswa</th>
                                        <th className="py-3 px-4 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Jenis Tagihan</th>
                                        <th className="py-3 px-4 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Nominal</th>
                                        <th className="py-3 px-4 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Tanggal Bayar</th>
                                        <th className="py-3 px-4 text-center border-b border-slate-300 dark:border-emerald-500/10 text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Aksi Konfirmasi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTunggakan.map((b) => (
                                        <tr 
                                            key={b.id} 
                                            className="hover:bg-slate-50 dark:hover:bg-[#082a1f] transition-colors group"
                                        >
                                            <td className="py-3 px-4 border-b border-slate-300 dark:border-emerald-500/10 bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]">
                                                <span className="font-bold text-slate-800 dark:text-white block">{b.nama_siswa}</span>
                                                <span className="text-[11px] text-slate-500 dark:text-slate-400">Kelas {b.kelas}</span>
                                            </td>
                                            <td className="py-3 px-4 border-b border-slate-300 dark:border-emerald-500/10 text-center bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]">
                                                <div className="font-semibold text-slate-700 dark:text-slate-200">
                                                    {b.nama_tagihan || 'Tagihan'}
                                                </div>
                                                <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                                                    {`${getMonthName(b.bulan)} ${b.tahun}`}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 border-b border-slate-300 dark:border-emerald-500/10 text-center bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]">
                                                <div className="font-bold text-emerald-600 dark:text-emerald-400">
                                                    {formatRupiah(b.nominal)}
                                                </div>
                                                <div className="text-[10px] text-slate-500 mt-0.5">
                                                    Dibuat: {b.created_at ? new Date(b.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs font-medium border-b border-slate-300 dark:border-emerald-500/10 text-center bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]">
                                                <span className="text-slate-400 dark:text-slate-600">-</span>
                                            </td>
                                            <td className="py-3 px-4 text-center border-b border-slate-300 dark:border-emerald-500/10 bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]">
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
