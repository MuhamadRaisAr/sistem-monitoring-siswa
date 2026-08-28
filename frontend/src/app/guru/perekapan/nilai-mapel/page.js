"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Users, BookOpen, Search, FileText, ChevronLeft } from 'lucide-react';
import { useTahunAjaran } from '@/hooks/useTahunAjaran';
import { getAbbreviatedMapel } from '@/utils/mapelHelper';
import Link from 'next/link';

export default function RekapNilaiMapelPage() {
    const { token, user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [dataNilai, setDataNilai] = useState([]);
    
    // Selectors
    const [rawJadwal, setRawJadwal] = useState([]);
    const [kelasOptions, setKelasOptions] = useState([]);
    const [allMapelOptions, setAllMapelOptions] = useState([]);
    const [selectedKelas, setSelectedKelas] = useState('');
    const [selectedMapel, setSelectedMapel] = useState('');
    const [searchName, setSearchName] = useState('');

    const isSelectingMapel = allMapelOptions.length > 1 && !selectedMapel;

    const { 
        tahunAjaranList, 
        selectedTahunAjaranId, 
        setSelectedTahunAjaranId,
        loadingTahunAjaran
    } = useTahunAjaran();

    const API_URL = '/api';

    // 1. Initial Load: Fetch Jadwal to get Mapel and Kelas options
    useEffect(() => {
        if (!token || !user || !selectedTahunAjaranId) return;

        const init = async () => {
            setLoading(true);
            try {
                const resJadwal = await fetch(`${API_URL}/jadwal?tahun_ajaran_id=${selectedTahunAjaranId}`, { 
                    headers: { 'Authorization': `Bearer ${token}` } 
                });
                const jadwalData = await resJadwal.json();
                
                // Get unique mapel from jadwal
                const myJadwal = Array.isArray(jadwalData) ? jadwalData.filter(j => Number(j.guru_id) === Number(user.id)) : [];
                const uniqueMapels = Array.from(new Set(myJadwal.map(j => j.mata_pelajaran).filter(Boolean)));
                setAllMapelOptions(uniqueMapels);

                setRawJadwal(myJadwal);

                // Auto select if only one option available
                if (uniqueMapels.length === 1 && !selectedMapel) {
                    setSelectedMapel(uniqueMapels[0]);
                }
            } catch (err) {
                console.error("Init error:", err);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [token, user, selectedTahunAjaranId]);

    // Update kelasOptions whenever selectedMapel changes
    useEffect(() => {
        if (!selectedMapel) {
            setKelasOptions([]);
            return;
        }

        const sortRoman = (arr) => {
            const romanMap = {
                'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6,
                'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12
            };
            const getVal = (str) => {
                if (!str) return 0;
                const match = str.trim().split(/[\s()]/)[0].toUpperCase();
                return romanMap[match] || 999;
            };
            return [...arr].sort((a, b) => {
                const valA = getVal(a);
                const valB = getVal(b);
                if (valA !== valB) return valA - valB;
                return a.localeCompare(b);
            });
        };

        const classesForMapel = new Set();
        rawJadwal.forEach(j => {
            if (j.mata_pelajaran === selectedMapel && j.kelas) {
                classesForMapel.add(j.kelas);
            }
        });

        const finalKelasOptions = sortRoman(Array.from(classesForMapel));
        setKelasOptions(finalKelasOptions);

        if (!finalKelasOptions.includes(selectedKelas)) {
            setSelectedKelas('');
        }
    }, [selectedMapel, rawJadwal]);

    // 2. Fetch Nilai
    useEffect(() => {
        if (!selectedKelas || !selectedMapel || !selectedTahunAjaranId || !token) {
            setDataNilai([]);
            return;
        }

        const fetchNilai = async () => {
            setLoading(true);
            try {
                const selectedTa = tahunAjaranList.find(t => t.id.toString() === selectedTahunAjaranId?.toString());
                const semester = selectedTa ? selectedTa.semester : '';

                const query = new URLSearchParams({
                    kelas: selectedKelas,
                    mata_pelajaran: selectedMapel,
                    tahun_ajaran_id: selectedTahunAjaranId,
                    semester: semester
                });
                const res = await fetch(`${API_URL}/nilai?${query.toString()}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                
                // Format the numbers properly
                const cleanedData = (Array.isArray(data) ? data : []).map(item => {
                    const cleanVal = (val) => {
                        if (val === null || val === undefined || val === '') return '';
                        return Number(val).toString();
                    };
                    
                    const t = parseFloat(item.Tugas);
                    const p = parseFloat(item.Praktik);
                    const uts = parseFloat(item.UTS);
                    const uas = parseFloat(item.UAS);
                    
                    let nilaiAkhir = '';
                    if (!isNaN(t) || !isNaN(p) || !isNaN(uts) || !isNaN(uas)) {
                        const finalT = isNaN(t) ? 0 : t;
                        const finalP = isNaN(p) ? 0 : p;
                        const finalUTS = isNaN(uts) ? 0 : uts;
                        const finalUAS = isNaN(uas) ? 0 : uas;
                        
                        if (item.nilai_akhir) {
                            nilaiAkhir = parseFloat(item.nilai_akhir).toFixed(1);
                        } else {
                            let total = 0;
                            let count = 0;
                            if (!isNaN(t)) { total += t; count++; }
                            if (!isNaN(p)) { total += p; count++; }
                            if (!isNaN(uts)) { total += uts; count++; }
                            if (!isNaN(uas)) { total += uas; count++; }
                            
                            if (count > 0) {
                                nilaiAkhir = (total / count).toFixed(1);
                            } else {
                                nilaiAkhir = '';
                            }
                        }
                    }

                    return {
                        ...item,
                        Tugas: cleanVal(item.Tugas),
                        Praktik: cleanVal(item.Praktik),
                        UTS: cleanVal(item.UTS),
                        UAS: cleanVal(item.UAS),
                        NilaiAkhir: nilaiAkhir.replace(/\.0$/, '') // Remove trailing .0
                    };
                });
                
                // Sort by name
                cleanedData.sort((a, b) => a.nama_lengkap?.localeCompare(b.nama_lengkap));
                
                setDataNilai(cleanedData);
            } catch (err) {
                console.error('Error fetching nilai data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchNilai();
    }, [selectedKelas, selectedMapel, selectedTahunAjaranId, tahunAjaranList, token]);

    const filteredDataNilai = useMemo(() => {
        return dataNilai.filter(d => 
            !searchName || 
            (d.nama_lengkap && d.nama_lengkap.toLowerCase().includes(searchName.toLowerCase()))
        );
    }, [dataNilai, searchName]);


    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col gap-1 mb-6">
                <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Rekap Nilai Mapel</h1>
                {selectedKelas && selectedMapel ? (
                    <div className="mt-1">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            Data Nilai Kelas {selectedKelas} - {getAbbreviatedMapel(selectedMapel)} | {(() => {
                                const ta = tahunAjaranList.find(t => t.id.toString() === selectedTahunAjaranId?.toString());
                                return ta ? `${ta.nama_tahun} ${ta.semester}` : '-';
                            })()}
                        </p>
                    </div>
                ) : (
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        <Link href="/guru/dashboard" className="hover:text-emerald-500 transition-colors">Dashboard</Link> / Rekap Nilai Mapel
                    </p>
                )}
            </div>



                    <div className="flex flex-col gap-4 animate-fade-in">
                        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4 w-full">
                            <div className="grid grid-cols-2 sm:flex sm:flex-row w-full sm:w-auto gap-3 sm:gap-4">
                                {/* Tahun Ajaran */}
                                <div className="flex flex-col gap-1.5 w-full sm:w-[200px]">
                                    <span className="text-[10px] sm:text-xs text-slate-500 font-bold dark:text-slate-400 uppercase tracking-wider truncate">Tahun Ajaran:</span>
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
                                            tahunAjaranList.map(ta => (
                                                <option key={ta.id} value={ta.id}>
                                                    {ta.nama_tahun} {ta.semester}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>
                
                                {rawJadwal.length > 0 && (
                                    <>
                                        {/* Mata Pelajaran */}
                                        {allMapelOptions.length > 1 && (
                                            <div className="flex flex-col gap-1.5 w-full sm:w-[200px]">
                                                <span className="text-[10px] sm:text-xs text-slate-500 font-bold dark:text-slate-400 uppercase tracking-wider truncate">Mata Pelajaran:</span>
                                                <select
                                                    value={selectedMapel}
                                                    onChange={(e) => { setSelectedMapel(e.target.value); setSelectedKelas(''); }}
                                                    className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#061e16] py-2.5 px-3 sm:px-4 text-[12px] sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:outline-none cursor-pointer text-ellipsis shadow-sm"
                                                >
                                                    <option value="">-- Pilih Mapel --</option>
                                                    {allMapelOptions.map(m => (
                                                        <option key={m} value={m}>{getAbbreviatedMapel(m)}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </>
                                )}
                                {/* Kelas */}
                                {rawJadwal.length > 0 && (
                                    <>
                                        {kelasOptions.length > 0 && (
                                            <div className="flex flex-col gap-1.5 w-full sm:w-[200px]">
                                                <span className="text-[10px] sm:text-xs text-slate-500 font-bold dark:text-slate-400 uppercase tracking-wider truncate">Kelas:</span>
                                                <select
                                                    value={selectedKelas}
                                                    onChange={(e) => setSelectedKelas(e.target.value)}
                                                    className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#061e16] py-2.5 px-3 sm:px-4 text-[12px] sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:outline-none cursor-pointer text-ellipsis shadow-sm"
                                                >
                                                    <option value="">-- Kelas --</option>
                                                    {kelasOptions.map((k, idx) => (
                                                        <option key={idx} value={k}>{k}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                            
                            {/* Search Bar */}
                            {rawJadwal.length > 0 && (
                                <div className="flex flex-col gap-1.5 w-full sm:w-[350px] mt-3 sm:mt-0">
                                    <span className="text-[10px] sm:text-xs text-slate-500 font-bold dark:text-slate-400 uppercase tracking-wider truncate">Cari Siswa:</span>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Ketik nama..."
                                            value={searchName}
                                            onChange={(e) => setSearchName(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#061e16] pl-10 pr-3 sm:pr-4 py-2.5 text-[12px] sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

            {/* Main Content Area */}
            <div className="relative mt-6">
                {/* Loader */}
                {loading && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-black/40 backdrop-blur-[1px] z-50 flex items-center justify-center rounded-3xl min-h-[250px] transition-all">
                        <div className="flex flex-col items-center gap-2 bg-white dark:bg-[#041610] px-6 py-4 rounded-2xl shadow-lg border border-slate-200 dark:border-emerald-500/10">
                            <Loader2 className="h-6 w-6 animate-spin text-emerald-600 dark:text-emerald-500" />
                            <span className="text-xs font-bold text-slate-500">Memuat data...</span>
                        </div>
                    </div>
                )}

                <div className={`space-y-6 transition-all duration-200 ${loading ? 'opacity-40 blur-[0.5px] pointer-events-none' : 'opacity-100'}`}>
                    
                    {/* Prompt Selection */}
                    {rawJadwal.length === 0 && !loading && !loadingTahunAjaran ? (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 flex flex-col items-center justify-center gap-4 text-center mt-6">
                            <BookOpen className="h-16 w-16 text-slate-300" />
                            <h2 className="text-xl font-bold text-slate-700">Belum Ada Jadwal Mengajar</h2>
                            <p className="text-slate-500 max-w-md text-sm">
                                Anda belum ditugaskan untuk mengajar pada tahun ajaran ini. Silakan hubungi admin akademik untuk informasi lebih lanjut.
                            </p>
                        </div>
                    ) : !selectedKelas || !selectedMapel ? (
                        <div className="bg-white dark:bg-[#041610] rounded-3xl p-16 text-center border border-slate-200 dark:border-emerald-500/10 shadow-sm flex flex-col items-center justify-center gap-3 animate-fade-in mt-6">
                            <BookOpen className="h-12 w-12 text-slate-400 dark:text-emerald-500/40" />
                            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                                Pilih Kelas Terlebih Dahulu
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                                Silakan pilih kelas pada dropdown untuk memuat rekapitulasi nilai siswa.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-[#041610] rounded-3xl border border-slate-200 dark:border-emerald-500/10 shadow-sm overflow-hidden">
                            {filteredDataNilai.length === 0 ? (
                                <div className="text-center py-16 text-slate-550 flex flex-col items-center gap-3">
                                    <Users className="h-10 w-10 opacity-30" />
                                    <p className="text-sm font-medium">
                                        {searchName ? 'Tidak ada siswa yang cocok dengan pencarian.' : 'Belum ada data siswa atau nilai di kelas ini.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="w-full overflow-x-auto">
                                    <table className="w-full text-left text-xs border-separate border-spacing-0 min-w-max">
                                        <thead className="bg-slate-50 dark:bg-[#061e16]">
                                            <tr>
                                                <th className="py-2 md:py-3 px-2 md:px-4 text-center text-slate-800 dark:text-slate-300 font-extrabold border-b border-r border-slate-300 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#061e16]">No</th>
                                                <th className="py-2 md:py-3 px-3 md:px-5 text-slate-800 dark:text-slate-300 font-extrabold border-b border-r-[3px] border-slate-400 dark:border-emerald-500/30 bg-slate-50 dark:bg-[#061e16] shadow-[4px_0_12px_rgba(0,0,0,0.03)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.2)]">Nama Siswa</th>
                                                <th className="py-2 md:py-3 px-2 text-center text-slate-800 dark:text-slate-300 font-extrabold border-r border-b border-slate-300 dark:border-emerald-500/10">Tugas</th>
                                                <th className="py-2 md:py-3 px-2 text-center text-slate-800 dark:text-slate-300 font-extrabold border-r border-b border-slate-300 dark:border-emerald-500/10">Praktik</th>
                                                <th className="py-2 md:py-3 px-2 text-center text-slate-800 dark:text-slate-300 font-extrabold border-r border-b border-slate-300 dark:border-emerald-500/10">UTS</th>
                                                <th className="py-2 md:py-3 px-2 text-center text-slate-800 dark:text-slate-300 font-extrabold border-r border-b border-slate-300 dark:border-emerald-500/10">UAS</th>
                                                <th className="py-2 md:py-3 px-2 text-center text-emerald-700 dark:text-emerald-400 font-black border-b border-slate-300 dark:border-emerald-500/10 bg-emerald-50/50 dark:bg-emerald-900/10">Nilai Akhir</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredDataNilai.map((item, idx) => (
                                                <tr key={item.siswa_id} className="hover:bg-slate-50 dark:hover:bg-[#082a1f] transition-colors group">
                                                    <td className="py-1.5 md:py-2.5 px-2 md:px-4 text-center font-semibold text-xs md:text-sm text-slate-500 border-b border-r border-slate-300 dark:border-emerald-500/10 bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f] transition-colors">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="py-1.5 md:py-2.5 px-3 md:px-5 font-extrabold text-xs md:text-sm text-slate-850 dark:text-white border-b border-r-[3px] border-slate-400 dark:border-emerald-500/30 bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f] transition-colors drop-shadow-md truncate">
                                                        {item.nama_lengkap}
                                                    </td>
                                                    <td className="py-1.5 md:py-2.5 px-2 text-center font-semibold text-xs md:text-sm text-slate-700 dark:text-slate-300 border-b border-r border-slate-300 dark:border-emerald-500/10">
                                                        <span className={item.Tugas !== '' && parseFloat(item.Tugas) < 70 ? "text-red-500 font-bold" : ""}>{item.Tugas}</span>
                                                    </td>
                                                    <td className="py-1.5 md:py-2.5 px-2 text-center font-semibold text-xs md:text-sm text-slate-700 dark:text-slate-300 border-b border-r border-slate-300 dark:border-emerald-500/10">
                                                        <span className={item.Praktik !== '' && parseFloat(item.Praktik) < 70 ? "text-red-500 font-bold" : ""}>{item.Praktik}</span>
                                                    </td>
                                                    <td className="py-1.5 md:py-2.5 px-2 text-center font-semibold text-xs md:text-sm text-slate-700 dark:text-slate-300 border-b border-r border-slate-300 dark:border-emerald-500/10">
                                                        <span className={item.UTS !== '' && parseFloat(item.UTS) < 70 ? "text-red-500 font-bold" : ""}>{item.UTS}</span>
                                                    </td>
                                                    <td className="py-1.5 md:py-2.5 px-2 text-center font-semibold text-xs md:text-sm text-slate-700 dark:text-slate-300 border-b border-r border-slate-300 dark:border-emerald-500/10">
                                                        <span className={item.UAS !== '' && parseFloat(item.UAS) < 70 ? "text-red-500 font-bold" : ""}>{item.UAS}</span>
                                                    </td>
                                                    <td className="py-1.5 md:py-2.5 px-2 text-center font-black text-xs md:text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/5 border-b border-slate-300 dark:border-emerald-500/10">
                                                        <span className={item.NilaiAkhir !== '' && parseFloat(item.NilaiAkhir) < 70 ? "text-red-500" : ""}>{item.NilaiAkhir}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
