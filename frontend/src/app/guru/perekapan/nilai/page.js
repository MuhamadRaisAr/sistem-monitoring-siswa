"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Users, BookOpen, Search } from 'lucide-react';
import { useTahunAjaran } from '@/hooks/useTahunAjaran';
import { getAbbreviatedMapel, getMapelSortIndex } from '@/utils/mapelHelper';

export default function RekapNilaiKelasPage() {
    const { token, user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [rekapNilaiData, setRekapNilaiData] = useState([]);
    const [rekapNilaiMapels, setRekapNilaiMapels] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const { 
        tahunAjaranList, 
        selectedTahunAjaranId, 
        setSelectedTahunAjaranId,
        loadingTahunAjaran
    } = useTahunAjaran();

    const API_URL = '/api';

    const loadData = async () => {
        if (!selectedTahunAjaranId) return;
        const selectedTA = tahunAjaranList.find(t => t.id.toString() === selectedTahunAjaranId.toString());
        if (!selectedTA) return;

        setLoading(true);
        try {
            if (user?.is_wali_kelas && user?.kelas_wali && user?.kelas_wali.length > 0) {
                const waliKelasName = user.kelas_wali[0].nama_kelas;
                const res = await fetch(`${API_URL}/nilai/rekap-kelas?kelas=${encodeURIComponent(waliKelasName)}&semester=${encodeURIComponent(selectedTA.semester)}&tahun_ajaran_id=${selectedTahunAjaranId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await res.json();
                const sortedMapels = (result.mapels || []).sort((a, b) => getMapelSortIndex(a) - getMapelSortIndex(b));
                setRekapNilaiMapels(sortedMapels);
                setRekapNilaiData(result.data || []);
            }
        } catch (err) {
            console.error('Fetch rekap nilai error:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredRekapNilai = useMemo(() => {
        if (!searchQuery) return rekapNilaiData;
        const q = searchQuery.toLowerCase();
        return rekapNilaiData.filter(s => 
            s.nama_lengkap?.toLowerCase().includes(q) || 
            s.nis?.toLowerCase().includes(q) || 
            s.nisn?.toLowerCase().includes(q)
        );
    }, [rekapNilaiData, searchQuery]);

    useEffect(() => {
        if (token && selectedTahunAjaranId && tahunAjaranList.length > 0) {
            loadData();
        } else {
            setRekapNilaiData([]);
            setRekapNilaiMapels([]);
        }
    }, [selectedTahunAjaranId, token, tahunAjaranList]);

    if (!user?.is_wali_kelas) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="text-center p-8 bg-white dark:bg-[#041610] rounded-3xl text-red-500 border border-slate-200 dark:border-emerald-500/10">
                    <h2 className="text-xl font-bold mb-2">Akses Ditolak</h2>
                    <p>Halaman ini hanya dapat diakses oleh Wali Kelas.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                    Rekap Nilai Wali Kelas
                </h1>
                {user.kelas_wali?.[0]?.nama_kelas ? (
                    <div className="mt-1">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            Rekap Nilai Kelas {user.kelas_wali[0].nama_kelas.split(' ')[0]} | {(() => {
                                const ta = tahunAjaranList.find(t => t.id.toString() === selectedTahunAjaranId?.toString());
                                return ta ? `${ta.nama_tahun} ${ta.semester}` : '-';
                            })()}
                        </p>
                    </div>
                ) : (
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Laporan rekapitulasi seluruh mata pelajaran pada semester terpilih.
                    </p>
                )}
            </div>

            {/* Selectors */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center">
                <div className="w-[280px] flex flex-col gap-1 self-start sm:self-center">
                    <span className="text-xs text-slate-500 font-bold dark:text-slate-400">Tahun Ajaran:</span>
                    <select
                        value={selectedTahunAjaranId}
                        onChange={(e) => setSelectedTahunAjaranId(e.target.value)}
                        disabled={loadingTahunAjaran}
                        className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-slate-50 dark:bg-[#061e16] py-2.5 px-3 sm:px-4 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer truncate"
                    >
                        {loadingTahunAjaran ? (
                            <option>Memuat...</option>
                        ) : tahunAjaranList.length === 0 ? (
                            <option value="">Tidak ada data</option>
                        ) : (
                            tahunAjaranList.map(ta => (
                                <option key={ta.id} value={ta.id}>
                                    {ta.nama_tahun} {ta.semester}
                                </option>
                            ))
                        )}
                    </select>
                </div>

                {/* Search Bar */}
                <div className="flex flex-col gap-1.5 flex-1 sm:flex-none sm:w-[350px] w-full mt-3 sm:mt-0">
                    <span className="text-xs text-slate-500 font-bold dark:text-slate-400">Cari Siswa:</span>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Ketik nama atau NIS..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-slate-50 dark:bg-[#061e16] pl-10 pr-3 sm:pr-4 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 truncate"
                        />
                    </div>
                </div>
            </div>
            {/* Main Content Area */}
            <div className="relative">
                {/* Smooth Loading Overlay to prevent blinking */}
                {loading && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-black/40 backdrop-blur-[1px] z-50 flex items-center justify-center rounded-3xl min-h-[250px] transition-all">
                        <div className="flex flex-col items-center gap-2 bg-white dark:bg-[#041610] px-6 py-4 rounded-2xl shadow-lg border border-slate-200 dark:border-emerald-500/10">
                            <Loader2 className="h-6 w-6 animate-spin text-emerald-600 dark:text-emerald-500" />
                            <span className="text-xs font-bold text-slate-500">Memuat data...</span>
                        </div>
                    </div>
                )}

                <div className={`space-y-6 transition-all duration-200 ${loading ? 'opacity-40 blur-[0.5px] pointer-events-none' : 'opacity-100'}`}>
                    {/* Matrix Table */}
                    <div className="bg-white dark:bg-[#041610] rounded-3xl border border-slate-200 dark:border-emerald-500/10 shadow-sm overflow-hidden">

                        {rekapNilaiData.length === 0 ? (
                            <div className="text-center py-16 text-slate-550 flex flex-col items-center gap-3">
                                <Users className="h-10 w-10 opacity-30" />
                                <p className="text-sm font-medium">Belum ada data siswa atau nilai untuk tahun ajaran ini.</p>
                            </div>
                        ) : (
                            <div className="w-full">
                                <table className="w-full text-left text-xs border-separate border-spacing-0 table-fixed">
                                    <thead className="bg-slate-50 dark:bg-[#061e16] text-slate-800 dark:text-slate-350 font-extrabold border-b border-slate-200 dark:border-emerald-500/10">
                                        <tr>
                                            <th className="py-2 px-1 md:px-2 w-[30px] md:w-[40px] text-center text-[10px] md:text-xs bg-slate-50 dark:bg-[#061e16] border-r border-b border-slate-200 dark:border-emerald-500/10">No</th>
                                            <th className="py-2 px-2 md:px-3 w-[140px] md:w-[180px] max-w-[140px] md:max-w-[180px] text-[10px] md:text-xs bg-slate-50 dark:bg-[#061e16] border-r-[3px] border-b border-slate-300 dark:border-emerald-500/30 drop-shadow-sm truncate">Nama Siswa</th>
                                            
                                            {/* Kolom Mapel Dinamis */}
                                            {rekapNilaiMapels.map((mp, idx) => (
                                                <th key={idx} className="py-2 px-0 text-center text-[8px] md:text-[9px] border-r border-b border-slate-200 dark:border-emerald-500/10 overflow-hidden" title={mp}>
                                                    <div className="flex flex-col items-center gap-1 cursor-help truncate px-0.5">
                                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold" title={getAbbreviatedMapel(mp)}>{getAbbreviatedMapel(mp)}</span>
                                                    </div>
                                                </th>
                                            ))}
                                            
                                            <th className="py-2 px-1 w-[35px] md:w-[45px] text-center text-[9px] md:text-[10px] border-l-[3px] border-b border-slate-300 dark:border-emerald-500/30 border-r border-slate-200 dark:border-emerald-500/10">Total</th>
                                            <th className="py-2 px-1 w-[40px] md:w-[50px] text-center text-[9px] md:text-[10px] border-r border-b border-slate-200 dark:border-emerald-500/10" title="Rata-Rata">Rata</th>
                                            <th className="py-2 px-1 w-[35px] md:w-[45px] text-center text-[9px] md:text-[10px] border-b border-slate-200 dark:border-emerald-500/10">Rank</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-emerald-500/10">
                                        {filteredRekapNilai.length === 0 ? (
                                            <tr>
                                                <td colSpan={rekapNilaiMapels.length + 5} className="text-center py-8 text-slate-500 dark:text-slate-400 font-semibold text-xs">
                                                    Tidak ada data siswa yang cocok dengan pencarian.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredRekapNilai.map((student, idx) => (
                                                <tr key={student.siswa_id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] group">
                                                    <td className="py-1.5 px-1 md:px-2 w-[30px] md:w-[40px] text-center text-slate-400 text-[10px] md:text-xs font-bold bg-white dark:bg-[#041610] group-hover:bg-slate-100 dark:group-hover:bg-[#0a241a] border-b border-r border-slate-200 dark:border-emerald-500/10 transition-colors">
                                                        {idx + 1}
                                                    </td>
                                                <td className="py-1.5 px-2 md:px-3 w-[140px] md:w-[180px] max-w-[140px] md:max-w-[180px] bg-white dark:bg-[#041610] group-hover:bg-slate-100 dark:group-hover:bg-[#0a241a] border-b border-r-[3px] border-slate-300 dark:border-emerald-500/30 drop-shadow-sm transition-colors">
                                                    <p className="font-bold text-[10px] md:text-[11px] text-slate-800 dark:text-slate-200 whitespace-nowrap w-full truncate" title={student.nama_lengkap}>{student.nama_lengkap}</p>
                                                </td>
                                                
                                                {/* Nilai Mapel */}
                                                {rekapNilaiMapels.map((mp, mIdx) => {
                                                    const nilaiAkhir = student.mapel_nilai[mp]?.akhir || '';
                                                    const isNilaiValid = nilaiAkhir && nilaiAkhir !== '-';
                                                    return (
                                                        <td key={mIdx} className="py-1.5 px-0 text-center text-[10px] md:text-xs font-semibold text-slate-600 dark:text-slate-400 border-b border-r border-slate-200 dark:border-emerald-500/10 overflow-hidden truncate">
                                                            {isNilaiValid ? (
                                                                <span className={parseFloat(nilaiAkhir) < 70 ? "text-red-500" : ""}>{nilaiAkhir}</span>
                                                            ) : ''}
                                                        </td>
                                                    );
                                                })}
                                                
                                                <td className="py-1.5 px-0 w-[35px] md:w-[45px] text-center text-[10px] md:text-[11px] font-black text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/20 border-b border-l-[3px] border-slate-300 dark:border-emerald-500/30 border-r border-slate-200 dark:border-emerald-500/10 truncate">{student.total_nilai && student.total_nilai !== '-' ? student.total_nilai : ''}</td>
                                                <td className="py-1.5 px-0 w-[40px] md:w-[50px] text-center text-[10px] md:text-[11px] font-black text-emerald-600 dark:text-emerald-500 bg-emerald-50/30 dark:bg-emerald-500/10 border-b border-r border-slate-200 dark:border-emerald-500/10 truncate">{student.rata_rata && student.rata_rata !== '-' ? student.rata_rata : ''}</td>
                                                <td className="py-1.5 px-0 w-[35px] md:w-[45px] text-center text-[10px] md:text-[11px] font-black text-amber-500 bg-amber-50/30 dark:bg-amber-900/20 border-b border-slate-200 dark:border-emerald-500/10">
                                                    {student.peringkat && student.peringkat !== '-' ? (
                                                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full font-bold text-[10px] ${
                                                            student.peringkat <= 3 
                                                                ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' 
                                                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                                        }`}>
                                                            {student.peringkat}
                                                        </span>
                                                    ) : ''}
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
            </div>
        </div>
    );
}
