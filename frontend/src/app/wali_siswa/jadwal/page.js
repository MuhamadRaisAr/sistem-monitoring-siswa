"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChild } from '@/context/ChildContext';
import { CalendarDays, Search } from 'lucide-react';
import { getAbbreviatedMapel } from '@/utils/mapelHelper';
import { useTahunAjaran } from '@/hooks/useTahunAjaran';

const HARI_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const HARI_BADGE = {
    Senin:   'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    Selasa:  'bg-purple-500/15 text-purple-400 border border-purple-500/20',
    Rabu:    'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    Kamis:   'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    Jumat:   'bg-rose-500/15 text-rose-400 border border-rose-500/20',
    Sabtu:   'bg-teal-500/15 text-teal-400 border border-teal-500/20',
};

export default function WaliJadwalPage() {
    const { token } = useAuth();
    const { selectedChild } = useChild();

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

    useEffect(() => {
        if (!token || !selectedChild) return;
        const fetchJadwal = async () => {
            setLoading(true);
            try {
                const kelas = encodeURIComponent(selectedChild.kelas);
                const res = await fetch(`${API_URL}/jadwal?kelas=${kelas}&tahun_ajaran_id=${selectedTahunAjaranId || ''}&siswa_id=${selectedChild.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                const raw = Array.isArray(data) ? data : [];
                // Deduplicate: same hari + jam_mulai + jam_selesai + mata_pelajaran
                const seen = new Set();
                const unique = raw.filter(j => {
                    const key = `${j.hari}|${j.jam_mulai}|${j.jam_selesai}|${j.mata_pelajaran}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
                setJadwalList(unique);
            } catch (err) {
                console.error('Error fetching jadwal:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchJadwal();
    }, [token, selectedChild, selectedTahunAjaranId]);

    if (!selectedChild) {
        return (
            <div className="glass-panel rounded-3xl p-8 text-center text-slate-500">
                Pilih siswa terlebih dahulu di bagian atas.
            </div>
        );
    }

    const getKelasValue = (kelasString) => {
        const k = typeof kelasString === 'string' ? decodeURIComponent(kelasString).toUpperCase() : '';
        if (k.includes('IX')) return 9;
        if (k.includes('VIII')) return 8;
        if (k.includes('VII')) return 7;
        return 99;
    };

    // Sort by hari order then by jam
    const sorted = [...jadwalList]
        .filter(j =>
            j.hari?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            j.mata_pelajaran?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            j.nama_guru?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            const hariDiff = HARI_ORDER.indexOf(a.hari) - HARI_ORDER.indexOf(b.hari);
            if (hariDiff !== 0) return hariDiff;

            const kelasA = getKelasValue(a.kelas || selectedChild.kelas);
            const kelasB = getKelasValue(b.kelas || selectedChild.kelas);
            if (kelasA !== kelasB) return kelasA - kelasB;

            return (a.jam_mulai || '').localeCompare(b.jam_mulai || '');
        });

    // Group by hari
    const groupedJadwal = {};
    sorted.forEach(j => {
        if (!groupedJadwal[j.hari]) groupedJadwal[j.hari] = [];
        groupedJadwal[j.hari].push(j);
    });

    return (
        <div className="space-y-6 w-full min-w-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">Jadwal Pelajaran</h1>
                    <p className="text-slate-400 text-sm">
                        {selectedChild.nama_lengkap} <span className="text-emerald-400 font-bold">Kelas {selectedChild.kelas}</span>
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="w-full sm:w-48">
                        <select
                            value={selectedTahunAjaranId}
                            onChange={(e) => setSelectedTahunAjaranId(e.target.value)}
                            disabled={loadingTahunAjaran}
                            className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-white/5 py-2.5 px-3 text-sm text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none transition-all cursor-pointer disabled:opacity-50"
                        >
                            {loadingTahunAjaran ? (
                                <option>Memuat...</option>
                            ) : tahunAjaranList.length === 0 ? (
                                <option value="">Tidak ada data</option>
                            ) : (
                                tahunAjaranList.map((ta) => (
                                    <option key={ta.id} value={ta.id} className="text-slate-800">
                                        {ta.nama_tahun} {ta.semester}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                    <div className="relative sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Cari mapel atau guru..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Tabel per Hari */}
            <div className="space-y-6 w-full">
                {loading ? (
                    <div className="glass-panel rounded-3xl p-16 flex justify-center items-center w-full">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                    </div>
                ) : sorted.length === 0 ? (
                    <div className="glass-panel rounded-3xl p-16 flex flex-col items-center justify-center gap-3 w-full border border-slate-200 dark:border-emerald-500/10">
                        <CalendarDays className="h-12 w-12 text-slate-400 dark:text-slate-600 opacity-50" />
                        <p className="text-slate-500 text-sm font-medium">Belum ada jadwal pelajaran.</p>
                    </div>
                ) : (
                    HARI_ORDER.filter(hari => groupedJadwal[hari]).map((hari) => (
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
                                            <th className="py-2 sm:py-3 px-2 sm:px-5 border-b border-r border-slate-200 dark:border-emerald-500/10 w-1/3">Guru</th>
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
                                                {/* Guru */}
                                                <td className="py-2 sm:py-3 px-2 sm:px-5 border-r border-slate-200 dark:border-emerald-500/10 text-slate-700 dark:text-slate-300 font-medium align-middle break-words text-xs sm:text-sm">
                                                    {j.nama_guru || <span className="text-slate-400 dark:text-slate-600 italic text-xs">—</span>}
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
                    ))
                )}
            </div>
        </div>
    );
}
