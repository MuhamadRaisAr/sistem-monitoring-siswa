"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, Search } from 'lucide-react';
import { useTahunAjaran } from '@/hooks/useTahunAjaran';

export default function PelanggaranKelasPage() {
    const { token, user } = useAuth();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    const { 
        activeTahunAjaranList,
        activeTahunAjaran,
        selectedTahunAjaranId, 
        setSelectedTahunAjaranId,
        loadingTahunAjaran
    } = useTahunAjaran();

    const isCurrentYearActive = activeTahunAjaran?.id?.toString() === selectedTahunAjaranId;
    const API_URL = '/api';
    const [searchQuery, setSearchQuery] = useState('');

    const kelasWaliName = user?.is_wali_kelas && user?.kelas_wali?.length > 0 
        ? user.kelas_wali[0].nama_kelas 
        : null;

    const fetchRecords = async () => {
        if (!selectedTahunAjaranId || !kelasWaliName) return;
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/kedisiplinan?kategori=pelanggaran&tahun_ajaran_id=${selectedTahunAjaranId}&kelas=${encodeURIComponent(kelasWaliName)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setRecords(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (!token || !selectedTahunAjaranId || !kelasWaliName) return;
        fetchRecords();
    }, [token, selectedTahunAjaranId, kelasWaliName]);

    const displayedRecords = records.filter(r => {
        const matchesSearch = r.nama_siswa.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (r.nis && r.nis.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
    });

    if (!kelasWaliName) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
                <ShieldAlert className="h-10 w-10 opacity-30" />
                <p className="text-sm font-medium text-center px-4">Anda bukan wali kelas.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 relative">
            {/* -- Header --------------------------------------------- */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Pelanggaran Kelas {kelasWaliName}</h1>
                    <p className="text-slate-500 text-sm mt-1">Lihat catatan riwayat pelanggaran siswa di kelas perwalian Anda.</p>
                </div>
            </div>

            {/* Selectors */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-row gap-3 sm:gap-4 w-full">
                    {/* Tahun Ajaran */}
                    <div className="flex flex-col gap-1.5 w-[260px] sm:w-[220px]">
                        <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Tahun Ajaran:</label>
                        <select 
                            value={selectedTahunAjaranId} 
                            onChange={e => setSelectedTahunAjaranId(e.target.value)}
                            disabled={loadingTahunAjaran || activeTahunAjaranList.length <= 1}
                            className={`w-full rounded-xl border border-emerald-100 bg-white py-2.5 px-3 sm:px-4 text-[12px] sm:text-sm font-bold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm disabled:opacity-50 ${(activeTahunAjaranList?.length || 0) <= 1 ? 'appearance-none cursor-default bg-none' : 'cursor-pointer'}`}
                        >
                            {loadingTahunAjaran ? (
                                <option>Memuat...</option>
                            ) : activeTahunAjaranList.length === 0 ? (
                                <option value="">Tidak ada data</option>
                            ) : (
                                activeTahunAjaranList.map((ta) => (
                                    <option key={ta.id} value={ta.id}>
                                        {ta.nama_tahun} {ta.semester}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    {/* Cari Siswa */}
                    <div className="flex flex-col gap-1.5 w-[260px] sm:w-[260px]">
                        <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Cari Siswa:</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-emerald-500" />
                            </div>
                            <input
                                type="text"
                                placeholder="Ketik nama atau NIS..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-emerald-100 bg-white text-[12px] sm:text-sm font-bold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm placeholder:text-slate-400 placeholder:font-normal"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* -- Flat Table ----------------------------------- */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
                {loading ? (
                    <div className="flex h-52 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                    </div>
                ) : displayedRecords.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
                        <ShieldAlert className="h-10 w-10 opacity-30" />
                        <p className="text-sm font-medium text-center px-4">Belum ada pelanggaran kedisiplinan tercatat untuk kelas {kelasWaliName}.</p>
                    </div>
                ) : (
                    <div>
                        <table className="w-full table-fixed text-left text-xs border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                    <th className="py-3 px-3 w-10 text-center border border-slate-200">No</th>
                                    <th className="py-3 px-3 w-36 border border-slate-200">Tanggal</th>
                                    <th className="py-3 px-3 w-44 border border-slate-200">Siswa</th>
                                    <th className="py-3 px-3 w-32 border border-slate-200">Kelas</th>
                                    <th className="py-3 px-3 border border-slate-200">Pelanggaran / Tindakan</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {displayedRecords.map((r, idx) => (
                                    <tr 
                                        key={r.id}
                                        className="hover:bg-slate-50 transition-colors group"
                                    >
                                        <td className="py-3 px-3 text-center align-middle text-slate-500 font-black text-xs border border-slate-200">
                                            {idx + 1}
                                        </td>
                                        <td className="py-3 px-3 align-middle border border-slate-200">
                                            <p className="font-semibold text-slate-800 text-xs whitespace-nowrap">
                                                {new Date(r.tanggal_kejadian).toLocaleDateString('id-ID', {
                                                    day: 'numeric', month: 'long', year: 'numeric'
                                                })}
                                            </p>
                                        </td>
                                        <td className="py-3 px-3 align-middle border border-slate-200">
                                            <p className="font-bold text-slate-800 text-xs">{r.nama_siswa}</p>
                                        </td>
                                        <td className="py-3 px-3 align-middle border border-slate-200">
                                            <span className="inline-flex rounded-lg bg-slate-100 text-slate-600 font-semibold px-2 py-1 text-xs">
                                                {r.kelas || '-'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 align-middle border border-slate-200">
                                            <p className="text-slate-700 text-xs break-words whitespace-normal">{r.nama_kegiatan}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
