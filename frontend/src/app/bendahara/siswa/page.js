"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Search } from 'lucide-react';

export default function BendaharaSiswaPage() {
    const { token } = useAuth();
    const [siswaList, setSiswaList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const API_URL = '/api';

    const fetchSiswa = async () => {
        try {
            const res = await fetch(`${API_URL}/siswa`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            setSiswaList(data);
        } catch (err) {
            console.error('Error fetching data:', err);
        }
    };

    useEffect(() => {
        if (!token) return;
        const init = async () => {
            setLoading(true);
            await fetchSiswa();
            setLoading(false);
        };
        init();
    }, [token]);

    const activeSiswa = siswaList.filter(s => {
        const status = (s.status_aktif || 'aktif').toLowerCase();
        return status !== 'lulus' && status !== 'keluar';
    });

    const getClassWeight = (kelasStr) => {
        if (!kelasStr) return 999;
        const roman = decodeURIComponent(kelasStr).split(' ')[0].toUpperCase();
        const map = { 'I':1, 'II':2, 'III':3, 'IV':4, 'V':5, 'VI':6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 };
        return map[roman] || 999;
    };

    const filteredSiswa = activeSiswa.filter(s => 
        s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nis.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.kelas && s.kelas.toLowerCase().includes(searchQuery.toLowerCase()))
    ).sort((a, b) => {
        const weightA = getClassWeight(a.kelas);
        const weightB = getClassWeight(b.kelas);
        if (weightA !== weightB) {
            return weightA - weightB;
        }
        return (a.nama_lengkap || '').localeCompare(b.nama_lengkap || '');
    });

    return (
        <div className="space-y-6 relative">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Database Siswa</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Lihat kontak dan status siswa.</p>
                </div>
            </div>

            {/* Search and Table Box */}
            <div className="glass-panel rounded-3xl p-6 bg-white dark:bg-[#020c08]/50 border border-slate-200 dark:border-emerald-500/10 shadow-sm">
                {/* Search Bar */}
                <div className="relative max-w-md mb-6">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari siswa berdasarkan Nama, NIS, Kelas..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#020c08] py-2.5 pl-10 pr-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                </div>

                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-emerald-500/10">
                        <table className="w-full text-left text-[10px] md:text-xs whitespace-nowrap min-w-max border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-[#061e16]">
                                    <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center w-10 static md:sticky md:left-0 md:z-30 bg-slate-50 dark:bg-[#061e16] text-slate-800 dark:text-slate-300 font-extrabold uppercase">No</th>
                                    <th className="py-2 px-3 border-b border-r-[3px] border-slate-400 dark:border-emerald-500/30 text-left static md:sticky md:left-10 md:z-30 bg-slate-50 dark:bg-[#061e16] shadow-[4px_0_12px_rgba(0,0,0,0.03)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.2)] text-slate-800 dark:text-slate-300 font-extrabold uppercase">Nama Lengkap</th>
                                    <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Kelas</th>
                                    <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Nama Wali</th>
                                    <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">No Telp</th>
                                    <th className="py-2 px-2 border-b border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSiswa.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-8 text-slate-500 bg-white dark:bg-[#041610] border-b border-slate-300 dark:border-emerald-500/10">
                                            Tidak ada data siswa ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSiswa.map((s, idx) => (
                                        <tr 
                                            key={s.id} 
                                            className="transition-colors group hover:bg-slate-50 dark:hover:bg-[#082a1f]"
                                        >
                                            <td className="py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 font-semibold text-slate-500 text-center static md:sticky md:left-0 md:z-20 bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]">{idx + 1}</td>
                                            <td className="py-1.5 px-3 border-b border-r-[3px] border-slate-400 dark:border-emerald-500/30 font-extrabold text-slate-850 dark:text-white text-left static md:sticky md:left-10 md:z-20 bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f] drop-shadow-md">{s.nama_lengkap}</td>
                                            <td className="py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 font-semibold text-slate-700 dark:text-slate-300 text-center whitespace-nowrap bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]">{s.kelas || '-'}</td>
                                            <td className="py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-left font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]">
                                                {s.nama_wali ? (
                                                    s.nama_wali
                                                ) : (
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">Belum dipetakan</span>
                                                )}
                                            </td>
                                            <td className="py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]">
                                                {s.no_hp ? (
                                                    <a href={`https://wa.me/${s.no_hp.replace(/^0/, '62')}`} target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                                                        {s.no_hp}
                                                    </a>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">-</span>
                                                )}
                                            </td>
                                            <td className="py-1.5 px-2 border-b border-slate-300 dark:border-emerald-500/10 text-center bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]">
                                                <span className={`inline-flex rounded-lg px-2 py-0.5 text-[10px] font-bold tracking-wide leading-none uppercase border
                                                    ${s.status_aktif === 'aktif' ? 'bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-red-100 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'}
                                                `}>
                                                    {s.status_aktif}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
