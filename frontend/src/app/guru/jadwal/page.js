"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Search, Clock } from 'lucide-react';
import { useTahunAjaran } from '@/hooks/useTahunAjaran';
import { getAbbreviatedMapel } from '@/utils/mapelHelper';

export default function GuruJadwalPage() {
    const { token } = useAuth();
    const [jadwalList, setJadwalList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { 
        tahunAjaranList, 
        selectedTahunAjaranId, 
        setSelectedTahunAjaranId,
        loadingTahunAjaran
    } = useTahunAjaran();

    const getSubjectColor = (subjectName) => {
        if (!subjectName) return 'text-slate-400';
        const colors = [
            'text-emerald-500', 'text-blue-500', 'text-purple-500',
            'text-rose-500', 'text-amber-500', 'text-cyan-500',
            'text-indigo-500', 'text-fuchsia-500', 'text-orange-500', 'text-teal-500',
            'text-lime-500', 'text-sky-500', 'text-pink-500'
        ];
        let hash = 0;
        for (let i = 0; i < subjectName.length; i++) {
            hash = subjectName.charCodeAt(i) + ((hash << 5) - hash) + i;
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const API_URL = '/api';

    const fetchJadwal = async () => {
        if (!selectedTahunAjaranId) return;
        try {
            const res = await fetch(`${API_URL}/jadwal/my-jadwal?tahun_ajaran_id=${selectedTahunAjaranId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            setJadwalList(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching jadwal:', err);
        }
    };

    useEffect(() => {
        if (token && selectedTahunAjaranId) {
            const init = async () => {
                setLoading(true);
                await fetchJadwal();
                setLoading(false);
            };
            init();
        }
    }, [token, selectedTahunAjaranId]);

    const HARI_ORDER = { 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6, 'Minggu': 7 };
    const getKelasValue = (kelasString) => {
        const k = typeof kelasString === 'string' ? decodeURIComponent(kelasString).toUpperCase() : '';
        if (k.includes('IX')) return 9;
        if (k.includes('VIII')) return 8;
        if (k.includes('VII')) return 7;
        return 99;
    };

    const filteredJadwal = jadwalList.filter(j => 
        j.hari.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.mata_pelajaran.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.kelas.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
        const hariA = HARI_ORDER[a.hari] || 99;
        const hariB = HARI_ORDER[b.hari] || 99;
        if (hariA !== hariB) return hariA - hariB;

        const timeDiff = (a.jam_mulai || '').localeCompare(b.jam_mulai || '');
        if (timeDiff !== 0) return timeDiff;

        const kelasA = getKelasValue(a.kelas);
        const kelasB = getKelasValue(b.kelas);
        return kelasA - kelasB;
    });

    const groupedJadwal = {};
    filteredJadwal.forEach(j => {
        if (!groupedJadwal[j.hari]) groupedJadwal[j.hari] = [];
        groupedJadwal[j.hari].push(j);
    });

    const HARI_BADGE = {
        'Senin': 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
        'Selasa': 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
        'Rabu': 'bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400',
        'Kamis': 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400',
        'Jumat': 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
        'Sabtu': 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
        'Minggu': 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
    };

    return (
        <div className="space-y-6 w-full min-w-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Jadwal Mengajar</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Lihat jadwal pelajaran yang ditugaskan kepada Anda.</p>
                </div>
            </div>

            <div className="glass-panel rounded-3xl p-6 bg-white dark:bg-[#041610] border border-slate-200 dark:border-emerald-500/10 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="w-full sm:w-64 shrink-0">
                        <select
                            value={selectedTahunAjaranId}
                            onChange={(e) => setSelectedTahunAjaranId(e.target.value)}
                            disabled={loadingTahunAjaran}
                            className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#020c08]/50 py-2.5 px-3 text-sm text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {loadingTahunAjaran ? (
                                <option>Memuat Tahun Ajaran...</option>
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

                    <div className="relative flex-1 max-w-md">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input type="text" placeholder="Cari hari, mata pelajaran, atau kelas..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#020c08]/50 py-2.5 pl-10 pr-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                    </div>
                ) : filteredJadwal.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 border border-slate-200 dark:border-emerald-500/10 rounded-3xl">
                        Anda belum memiliki penugasan mengajar atau tidak ada yang cocok dengan pencarian.
                    </div>
                ) : (
                    <div className="space-y-6 w-full">
                        {Object.keys(HARI_ORDER).filter(hari => groupedJadwal[hari]).map((hari) => (
                            <div key={hari} className="glass-panel rounded-3xl overflow-hidden w-full border border-slate-200 dark:border-emerald-500/10 shadow-sm">
                                <div className="bg-slate-50/80 dark:bg-emerald-900/10 border-b border-slate-200 dark:border-emerald-500/10 px-5 py-3.5 flex items-center gap-3">
                                    <span className={`inline-block text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg ${HARI_BADGE[hari] || 'bg-slate-100 text-slate-500'}`}>
                                        {hari}
                                    </span>
                                </div>
                                <div className="w-full bg-white dark:bg-[#020c08]/50">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/30 dark:bg-emerald-500/5 text-slate-500 dark:text-emerald-400 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest">
                                                <th className="py-2 sm:py-3 px-2 sm:px-5 border-b border-r border-slate-200 dark:border-emerald-500/10 w-1/4">Jam</th>
                                                <th className="py-2 sm:py-3 px-2 sm:px-5 border-b border-r border-slate-200 dark:border-emerald-500/10 w-1/3">Kelas</th>
                                                <th className="py-2 sm:py-3 px-2 sm:px-5 border-b border-slate-200 dark:border-emerald-500/10">Mapel</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-emerald-500/10 text-sm">
                                            {groupedJadwal[hari].map((j, idx) => (
                                                <tr key={j.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-emerald-500/5 transition-colors">
                                                    {/* Jam */}
                                                    <td className="py-2 sm:py-3 px-2 sm:px-5 border-r border-slate-200 dark:border-emerald-500/10 font-bold text-slate-700 dark:text-slate-300 font-mono align-middle text-xs sm:text-sm whitespace-nowrap">
                                                        {j.jam_mulai?.slice(0, 5)} – {j.jam_selesai?.slice(0, 5)}
                                                    </td>
                                                    {/* Kelas */}
                                                    <td className="py-2 sm:py-3 px-2 sm:px-5 border-r border-slate-200 dark:border-emerald-500/10 text-slate-700 dark:text-slate-300 font-medium align-middle break-words text-xs sm:text-sm">
                                                        Kelas {decodeURIComponent(j.kelas)}
                                                    </td>
                                                    {/* Mapel */}
                                                    <td className={`py-2 sm:py-3 px-2 sm:px-5 font-bold align-middle break-words text-xs sm:text-sm ${getSubjectColor(j.mata_pelajaran)}`}>
                                                        {getAbbreviatedMapel(j.mata_pelajaran)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
