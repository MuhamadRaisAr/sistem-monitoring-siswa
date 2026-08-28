"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ClipboardList, Loader2, AlertCircle, Users, BookOpen } from 'lucide-react';
import { useTahunAjaran } from '@/hooks/useTahunAjaran';
import { getAbbreviatedMapel, getMapelSortIndex } from '@/utils/mapelHelper';

export default function RekapNilaiAdmin() {
    const { token } = useAuth();
    const [kelasList, setKelasList] = useState([]);
    const [selectedKelas, setSelectedKelas] = useState('');
    
    const { 
        tahunAjaranList, 
        selectedTahunAjaranId, 
        setSelectedTahunAjaranId,
        loadingTahunAjaran
    } = useTahunAjaran();
    
    const [rekapData, setRekapData] = useState([]);
    const [mapels, setMapels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const API_URL = '/api';


    useEffect(() => {
        if (!token) return;
        const fetchKelas = async () => {
            try {
                const res = await fetch(`${API_URL}/kelas`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                setKelasList(data);
                // auto-select dihapus agar defaultnya 'Pilih Kelas'
            } catch (err) {
                console.error('Error fetching kelas:', err);
            }
        };
        fetchKelas();
    }, [token]);

    const fetchRekap = async () => {
        if (!selectedKelas || !selectedTahunAjaranId) return;
        const selectedTA = tahunAjaranList.find(t => t.id === parseInt(selectedTahunAjaranId));
        if (!selectedTA) return;
        
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/nilai/rekap-kelas?kelas=${encodeURIComponent(selectedKelas)}&semester=${encodeURIComponent(selectedTA.semester)}&tahun_ajaran_id=${selectedTahunAjaranId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Gagal mengambil data rekap nilai');
            const result = await res.json();
            const sortedMapels = (result.mapels || []).sort((a, b) => getMapelSortIndex(a) - getMapelSortIndex(b));
            setMapels(sortedMapels);
            setRekapData(result.data || []);
            setRekapData(result.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch when Class or Semester changes
    useEffect(() => {
        if (token && selectedKelas && selectedTahunAjaranId && tahunAjaranList.length > 0) {
            fetchRekap();
        } else {
            setRekapData([]);
            setMapels([]);
        }
    }, [selectedKelas, selectedTahunAjaranId, token, tahunAjaranList]);


    // Calculate class summary
    const totalSiswa = rekapData.length;
    const avgKelas = totalSiswa > 0 
        ? (rekapData.reduce((acc, curr) => acc + curr.rata_rata, 0) / totalSiswa).toFixed(2) 
        : 0;
    const bestStudent = totalSiswa > 0 
        ? (rekapData.find(s => s.peringkat === 1)?.nama_lengkap || '-') 
        : '-';

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2">
                <div className="flex flex-col gap-1.5">
                    <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                        <ClipboardList className="h-6 w-6 text-emerald-500" />
                        Rekap Nilai Siswa
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Pilih tahun ajaran dan kelas untuk melihat rekap nilai.</p>
                </div>
                
                {/* Selectors */}
                <div className="flex flex-row gap-3 w-full md:w-auto">
                    <div className="flex-1 min-w-0">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1 truncate">Tahun Ajaran</label>
                        <select
                            value={selectedTahunAjaranId}
                            onChange={(e) => setSelectedTahunAjaranId(e.target.value)}
                            disabled={loadingTahunAjaran}
                            className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm cursor-pointer shadow-sm transition-all disabled:opacity-50"
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
                    <div className="flex-1 min-w-0">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1 truncate">Kelas</label>
                        <select
                            value={selectedKelas}
                            onChange={(e) => setSelectedKelas(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm cursor-pointer shadow-sm transition-all"
                        >
                            <option value="">Pilih Kelas</option>
                            {kelasList.map(k => (
                                <option key={k.id} value={k.nama_kelas}>{k.nama_kelas}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {/* Main Content Area */}
            <div className="relative">
                {/* Smooth Loading Overlay */}
                {loading && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-black/40 backdrop-blur-[1px] z-50 flex items-center justify-center rounded-3xl min-h-[250px] transition-all">
                        <div className="flex flex-col items-center gap-2 bg-white dark:bg-[#041610] px-6 py-4 rounded-2xl shadow-lg border border-slate-200 dark:border-emerald-500/10">
                            <Loader2 className="h-6 w-6 animate-spin text-emerald-600 dark:text-emerald-500" />
                            <span className="text-xs font-bold text-slate-500">Memuat data...</span>
                        </div>
                    </div>
                )}

                <div className={`space-y-6 transition-all duration-200 ${loading ? 'opacity-40 blur-[0.5px] pointer-events-none' : 'opacity-100'}`}>
                    {rekapData.length === 0 ? (
                        <div className="bg-white dark:bg-[#041610] rounded-3xl p-16 text-center border border-slate-200 dark:border-emerald-500/10 shadow-sm flex flex-col items-center justify-center gap-3">
                            <Users className="h-12 w-12 text-slate-400 dark:text-emerald-500/40" />
                            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Belum Ada Data</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                                Silakan pilih Tahun Ajaran dan Kelas untuk melihat matriks rekapitulasi nilai.
                            </p>
                        </div>
                    ) : (
                        <>

                    <div className="bg-white dark:bg-[#041610] rounded-3xl border border-slate-200 dark:border-emerald-500/10 shadow-sm overflow-hidden mt-6">
                        <div className="p-5 border-b border-slate-200 dark:border-emerald-500/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between">
                            <h2 className="text-sm font-bold text-slate-855 dark:text-white">Rincian Rekap Nilai Kelas</h2>
                            <div className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                                {rekapData.length} Siswa
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto custom-scrollbar pb-2">
                            <table className="w-full text-left text-xs border-separate border-spacing-0 min-w-max md:min-w-full md:table-fixed">
                                <thead className="bg-slate-50 dark:bg-[#061e16] text-slate-800 dark:text-slate-350 font-extrabold border-b border-slate-200 dark:border-emerald-500/10">
                                    <tr>
                                        <th className="py-2 px-1 md:px-2 w-[30px] md:w-[40px] text-center text-[10px] md:text-xs bg-slate-50 dark:bg-[#061e16] border-r border-slate-200 dark:border-emerald-500/10">No</th>
                                        <th className="py-2 px-2 md:px-3 w-[140px] md:w-[180px] max-w-[140px] md:max-w-[180px] text-[10px] md:text-xs bg-slate-50 dark:bg-[#061e16] border-r-[3px] border-slate-300 dark:border-emerald-500/30 drop-shadow-sm truncate">Nama Siswa</th>
                                        
                                        {/* Kolom Mapel Dinamis */}
                                        {mapels.map((mp, idx) => (
                                            <th key={idx} className="py-2 px-2 md:px-0 min-w-[50px] md:min-w-0 text-center text-[10px] md:text-xs border-r border-slate-200 dark:border-emerald-500/10 overflow-hidden" title={mp}>
                                                <div className="flex flex-col items-center gap-1 cursor-help truncate px-1 md:px-0.5">
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold" title={getAbbreviatedMapel(mp)}>{getAbbreviatedMapel(mp)}</span>
                                                </div>
                                            </th>
                                        ))}
                                        
                                        <th className="py-2 px-2 md:px-1 w-[50px] md:w-[45px] text-center text-[10px] md:text-xs border-l-[3px] border-slate-300 dark:border-emerald-500/30 border-r border-slate-200 dark:border-emerald-500/10">Total</th>
                                        <th className="py-2 px-2 md:px-1 w-[50px] md:w-[50px] text-center text-[10px] md:text-xs border-r border-slate-200 dark:border-emerald-500/10">Rata</th>
                                        <th className="py-2 px-2 md:px-1 w-[50px] md:w-[45px] text-center text-[10px] md:text-xs">Rank</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-emerald-500/10">
                                    {rekapData.map((student, idx) => (
                                        <tr key={student.siswa_id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] group">
                                            <td className="py-1.5 px-1 md:px-2 w-[30px] md:w-[40px] text-center text-slate-400 text-[10px] md:text-xs font-bold bg-white dark:bg-[#041610] group-hover:bg-slate-100 dark:group-hover:bg-[#0a241a] border-b border-r border-slate-200 dark:border-emerald-500/10 transition-colors">
                                                {idx + 1}
                                            </td>
                                            <td className="py-1.5 px-2 md:px-3 w-[140px] md:w-[180px] max-w-[140px] md:max-w-[180px] bg-white dark:bg-[#041610] group-hover:bg-slate-100 dark:group-hover:bg-[#0a241a] border-b border-r-[3px] border-slate-300 dark:border-emerald-500/30 drop-shadow-sm transition-colors">
                                                <p className="font-bold text-[10px] md:text-[11px] text-slate-800 dark:text-slate-200 whitespace-nowrap w-full truncate" title={student.nama_lengkap}>{student.nama_lengkap}</p>
                                            </td>
                                            
                                            {/* Nilai Mapel */}
                                            {mapels.map((mp, mIdx) => {
                                                const nilaiAkhir = student.mapel_nilai[mp]?.akhir || '';
                                                const isNilaiValid = nilaiAkhir && nilaiAkhir !== '-';
                                                return (
                                                    <td key={mIdx} className="py-2 md:py-1.5 px-2 md:px-0 text-center text-[11px] md:text-xs font-semibold text-slate-600 dark:text-slate-400 border-b border-r border-slate-200 dark:border-emerald-500/10 overflow-hidden truncate">
                                                        {isNilaiValid ? (
                                                            <span className={parseFloat(nilaiAkhir) < 70 ? "text-red-500" : ""}>{nilaiAkhir}</span>
                                                        ) : ''}
                                                    </td>
                                                );
                                            })}
                                            
                                            <td className="py-2 md:py-1.5 px-2 md:px-0 text-center text-[11px] md:text-xs font-extrabold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-[#061e16] group-hover:bg-slate-200 dark:group-hover:bg-[#0c2e22] border-b border-l-[3px] border-slate-300 dark:border-emerald-500/30 border-r border-slate-200 dark:border-emerald-500/10 transition-colors">{student.total_nilai && student.total_nilai !== '-' ? student.total_nilai : ''}</td>
                                            <td className="py-2 md:py-1.5 px-2 md:px-0 text-center text-[11px] md:text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-slate-50 dark:bg-[#061e16] group-hover:bg-slate-200 dark:group-hover:bg-[#0c2e22] border-b border-r border-slate-200 dark:border-emerald-500/10 transition-colors">{student.rata_rata && student.rata_rata !== '-' ? student.rata_rata : ''}</td>
                                            <td className="py-2 md:py-1.5 px-2 md:px-0 text-center border-b border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#061e16] group-hover:bg-slate-200 dark:group-hover:bg-[#0c2e22] transition-colors">
                                                <div className="flex justify-center items-center">
                                                    <span className={`inline-flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full text-[10px] md:text-xs font-extrabold ${student.peringkat && student.peringkat <= 3 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400'}`}>
                                                        {student.peringkat || ''}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
