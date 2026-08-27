"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChild } from '@/context/ChildContext';
import { BookOpen, GraduationCap, Trophy, ChevronDown, Star, Calendar } from 'lucide-react';
import { useTahunAjaran } from '@/hooks/useTahunAjaran';
import { getAbbreviatedMapel, getMapelSortIndex } from '@/utils/mapelHelper';

export default function WaliNilaiPage() {
    const { token } = useAuth();
    const { selectedChild } = useChild();
    
    const [mapels, setMapels] = useState([]);
    const [nilaiEkskul, setNilaiEkskul] = useState([]);
    const [totalNilai, setTotalNilai] = useState(0);
    const [rataRata, setRataRata] = useState(0);
    const [loading, setLoading] = useState(false);
    
    const { 
        tahunAjaranList, 
        selectedTahunAjaranId, 
        setSelectedTahunAjaranId,
        loadingTahunAjaran
    } = useTahunAjaran();

    const API_URL = '/api';

    const fetchNilai = async () => {
        if (!selectedChild || !selectedTahunAjaranId) return;
        setLoading(true);
        try {
            const selectedTa = tahunAjaranList.find(t => t.id.toString() === selectedTahunAjaranId?.toString());
            const semester = selectedTa ? selectedTa.semester : '';
            const res = await fetch(`${API_URL}/nilai/siswa/${selectedChild.id}?semester=${encodeURIComponent(semester)}&tahun_ajaran_id=${selectedTahunAjaranId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-store'
            });
            const data = await res.json();
            if (res.ok) {
                const sortedMapels = (data.mapels || []).sort((a, b) => getMapelSortIndex(a.mata_pelajaran) - getMapelSortIndex(b.mata_pelajaran));
                setMapels(sortedMapels);
                setTotalNilai(data.total_nilai || 0);
                setRataRata(data.rata_rata_keseluruhan || 0);
            } else {
                setMapels([]);
            }
        } catch (err) {
            console.error('Error fetching child grades:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchNilaiEkskul = async () => {
        if (!selectedChild || !selectedTahunAjaranId) return;
        try {
            const res = await fetch(`${API_URL}/nilai-ekskul?siswa_id=${selectedChild.id}&tahun_ajaran_id=${selectedTahunAjaranId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setNilaiEkskul(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching nilai ekskul:', err);
        }
    };

    useEffect(() => {
        if (!token || !selectedChild || !selectedTahunAjaranId) {
            setMapels([]);
            setNilaiEkskul([]);
            return;
        }
        fetchNilai();
        fetchNilaiEkskul();
    }, [token, selectedChild, selectedTahunAjaranId]);

    if (!selectedChild) {
        return (
            <div className="glass-panel rounded-3xl p-8 text-center text-slate-500">
                Pilih siswa terlebih dahulu di bagian atas.
            </div>
        );
    }


    return (
        <div className="space-y-8 animate-fade-in">
            {/* ── Header ───────────────────────────────────────────── */}
            <div>
                <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Nilai Akademik</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-6">Pantau Performa Nilai Akademik Anak Anda.</p>
                
                <div className="flex flex-col gap-1.5 w-[260px] sm:w-[260px]">
                    <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Tahun Ajaran:</label>
                    <select 
                        value={selectedTahunAjaranId}
                        onChange={(e) => setSelectedTahunAjaranId(e.target.value)}
                        disabled={loadingTahunAjaran}
                        className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#061e16] py-2.5 px-3 sm:px-4 text-[12px] sm:text-sm font-semibold text-slate-700 dark:text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-sm text-ellipsis overflow-hidden disabled:opacity-50"
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
                </div>
            </div>


            {/* ── Table ─────────────────────────────────── */}
            <div className="bg-white dark:bg-[#041610] border border-slate-200 dark:border-emerald-500/10 rounded-3xl overflow-hidden shadow-xl shadow-emerald-500/5">

                
                {loading ? (
                    <div className="flex h-52 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                    </div>
                ) : mapels.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
                        <BookOpen className="h-10 w-10 opacity-30" />
                        <p className="text-sm font-medium">Belum ada data nilai akademik yang diinput untuk semester ini.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[10px] sm:text-xs border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-[#061e16]">
                                    <th className="py-2 px-1.5 sm:px-3 border-b border-r-[3px] border-slate-400 dark:border-emerald-500/30 text-left static md:sticky md:left-0 md:z-30 bg-slate-50 dark:bg-[#061e16] shadow-[4px_0_12px_rgba(0,0,0,0.03)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.2)] text-slate-800 dark:text-slate-300 font-extrabold uppercase">Mapel</th>
                                    <th className="py-2 px-1 sm:px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Tugas</th>
                                    <th className="py-2 px-1 sm:px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Praktik</th>
                                    <th className="py-2 px-1 sm:px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">UTS</th>
                                    <th className="py-2 px-1 sm:px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">UAS</th>
                                    <th className="py-2 px-1 sm:px-2 border-b border-slate-300 dark:border-emerald-500/10 text-center text-emerald-600 dark:text-emerald-400 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Akhir</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mapels.map((m, idx) => {
                                    const tugas = m.rincian?.Tugas ? Number(m.rincian.Tugas).toString() : '';
                                    const uts = m.rincian?.UTS ? Number(m.rincian.UTS).toString() : '';
                                    const uas = m.rincian?.UAS ? Number(m.rincian.UAS).toString() : '';
                                    const praktik = m.rincian?.Praktik ? Number(m.rincian.Praktik).toString() : '';
                                    const akhir = m.rata_rata > 0 ? Number(m.rata_rata).toString() : '';

                                    return (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-[#082a1f] transition-colors group">
                                            <td className="py-1.5 px-1.5 sm:px-3 border-b border-r-[3px] border-slate-400 dark:border-emerald-500/30 font-extrabold text-slate-850 dark:text-white text-left static md:sticky md:left-0 md:z-20 bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f] drop-shadow-md">
                                                <div className="flex items-center gap-1.5 sm:gap-2">
                                                    <div className="hidden sm:flex h-6 w-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 items-center justify-center group-hover:bg-emerald-500/20 transition-colors shrink-0">
                                                        <BookOpen className="h-3 w-3 text-emerald-500" />
                                                    </div>
                                                    <span className="truncate">{getAbbreviatedMapel(m.mata_pelajaran)}</span>
                                                </div>
                                            </td>
                                            <td className="py-1.5 px-1 sm:px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 font-semibold text-slate-600 dark:text-slate-400 text-center bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f] transition-colors">{tugas}</td>
                                            <td className="py-1.5 px-1 sm:px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 font-semibold text-slate-600 dark:text-slate-400 text-center bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f] transition-colors">{praktik}</td>
                                            <td className="py-1.5 px-1 sm:px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 font-semibold text-slate-600 dark:text-slate-400 text-center bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f] transition-colors">{uts}</td>
                                            <td className="py-1.5 px-1 sm:px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 font-semibold text-slate-600 dark:text-slate-400 text-center bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f] transition-colors">{uas}</td>
                                            <td className="py-1.5 px-1 sm:px-2 border-b border-slate-300 dark:border-emerald-500/10 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/20 dark:bg-emerald-500/[0.02] group-hover:bg-emerald-50/40 dark:group-hover:bg-emerald-500/[0.05] transition-colors">
                                                {akhir}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Tabel Nilai Kegiatan Ekstrakurikuler */}
            {nilaiEkskul.length > 0 && (
                <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <Star className="h-5 w-5 text-emerald-500" />
                        <h3 className="text-base font-bold text-slate-800 dark:text-white">Nilai Kegiatan Ekstrakurikuler</h3>
                    </div>
                    <div className="bg-white dark:bg-[#041610] border border-slate-200 dark:border-emerald-500/10 rounded-3xl overflow-hidden shadow-xl shadow-emerald-500/5">
                        <div className="overflow-x-auto bg-white dark:bg-[#041610]">
                        <table className="w-full text-left text-[10px] sm:text-xs border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-[#061e16]">
                                    <th className="py-2 px-1.5 sm:px-3 border-b border-r-[3px] border-slate-400 dark:border-emerald-500/30 text-left static md:sticky md:left-0 md:z-30 bg-slate-50 dark:bg-[#061e16] shadow-[4px_0_12px_rgba(0,0,0,0.03)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.2)] text-slate-800 dark:text-slate-300 font-extrabold uppercase">Ekskul</th>
                                    <th className="py-2 px-1 sm:px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16] w-16 sm:w-32">Predikat</th>
                                    <th className="py-2 px-1.5 sm:px-2 border-b border-slate-300 dark:border-emerald-500/10 text-left text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {nilaiEkskul.map((ne, idx) => (
                                    <tr key={ne.id} className="hover:bg-slate-50 dark:hover:bg-[#082a1f] transition-colors group">
                                        <td className="py-1.5 px-1.5 sm:px-3 border-b border-r-[3px] border-slate-400 dark:border-emerald-500/30 font-extrabold text-slate-850 dark:text-white text-left static md:sticky md:left-0 md:z-20 bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f] drop-shadow-md break-all sm:break-normal line-clamp-2">{ne.nama_ekskul}</td>
                                        <td className="py-1.5 px-1 sm:px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]">
                                            <span className={`inline-flex rounded-lg px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold leading-none uppercase ${ne.predikat ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}>
                                                {ne.predikat || '-'}
                                            </span>
                                        </td>
                                        <td className="py-1.5 px-1.5 sm:px-2 border-b border-slate-300 dark:border-emerald-500/10 text-slate-600 dark:text-slate-300 leading-relaxed font-medium bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f] text-[9px] sm:text-[10px] line-clamp-3">
                                            {ne.keterangan || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                </div>
            )}
        </div>
    );
}
