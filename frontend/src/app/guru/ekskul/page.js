"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Activity, Save, Users, CheckCircle, Search, Loader2 } from 'lucide-react';
import { useTahunAjaran } from '@/hooks/useTahunAjaran';

export default function InputNilaiEkskulPage() {
    const { token, user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // State
    const [ekskulList, setEkskulList] = useState([]);
    const [siswaList, setSiswaList] = useState([]);
    
    const { 
        tahunAjaranList, 
        activeTahunAjaranList,
        activeTahunAjaran,
        selectedTahunAjaranId, 
        setSelectedTahunAjaranId,
        loadingTahunAjaran
    } = useTahunAjaran();

    const isCurrentYearActive = activeTahunAjaran?.id?.toString() === selectedTahunAjaranId;

    // Filters
    const [selectedEkskul, setSelectedEkskul] = useState('');
    const [searchName, setSearchName] = useState('');

    // Data Nilai
    const [nilaiEkskulMap, setNilaiEkskulMap] = useState({});

    const API_URL = '/api';

    // 1. Fetch Ekskul (Only those assigned to the current teacher)
    useEffect(() => {
        if (!token || !user) return;
        const fetchEkskul = async () => {
            try {
                const res = await fetch(`${API_URL}/ekskul`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (Array.isArray(data)) {
                    const myEkskul = data.filter(e => e.pembina_id?.toString() === user.id?.toString());
                    setEkskulList(myEkskul);
                    if (myEkskul.length > 0) {
                        setSelectedEkskul(myEkskul[0].id.toString());
                    }
                }
            } catch (err) {
                console.error('Error fetching ekskul:', err);
            }
        };
        fetchEkskul();
    }, [token, user]);

    // 2. Fetch Enrolled Students for the selected Ekskul & Tahun Ajaran
    useEffect(() => {
        if (!token || !selectedEkskul || !selectedTahunAjaranId) {
            setSiswaList([]);
            setNilaiEkskulMap({});
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setSaveSuccess(false);
            try {
                // Get all members of the selected ekskul for the active tahun ajaran
                const res = await fetch(`${API_URL}/nilai-ekskul/anggota?ekskul_id=${selectedEkskul}&tahun_ajaran_id=${selectedTahunAjaranId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                
                if (Array.isArray(data)) {
                    setSiswaList(data);

                    const tempMap = {};
                    data.forEach(s => {
                        tempMap[s.siswa_id] = {
                            predikat: s.predikat || '',
                            keterangan: s.keterangan || '',
                            existingId: s.nilai_ekskul_id
                        };
                    });
                    setNilaiEkskulMap(tempMap);
                } else {
                    setSiswaList([]);
                    setNilaiEkskulMap({});
                }
            } catch (err) {
                console.error('Error loading nilai ekskul:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, selectedEkskul, selectedTahunAjaranId]);

    // Handle input changes
    const handleGradeChange = (siswaId, value) => {
        setNilaiEkskulMap(prev => ({
            ...prev,
            [siswaId]: {
                ...prev[siswaId],
                predikat: value
            }
        }));
    };

    const handleKeteranganChange = (siswaId, value) => {
        setNilaiEkskulMap(prev => ({
            ...prev,
            [siswaId]: {
                ...prev[siswaId],
                keterangan: value
            }
        }));
    };

    // Save Data
    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveSuccess(false);

        try {
            const promises = Object.keys(nilaiEkskulMap)
                .filter(siswaId => nilaiEkskulMap[siswaId].predikat !== '') // Only save if grade is selected
                .map(siswaId => {
                    const data = {
                        siswa_id: parseInt(siswaId, 10),
                        ekskul_id: parseInt(selectedEkskul, 10),
                        tahun_ajaran_id: parseInt(selectedTahunAjaranId, 10),
                        predikat: nilaiEkskulMap[siswaId].predikat,
                        keterangan: nilaiEkskulMap[siswaId].keterangan
                    };

                    return fetch(`${API_URL}/nilai-ekskul`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(data)
                    });
                });

            await Promise.all(promises);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            console.error('Error saving nilai ekskul:', err);
            alert('Gagal menyimpan nilai ekstrakurikuler.');
        } finally {
            setIsSaving(false);
        }
    };

    // Search filter
    const filteredStudents = useMemo(() => {
        return siswaList.filter(s => 
            s.nama_lengkap?.toLowerCase().includes(searchName.toLowerCase()) ||
            s.nis?.toLowerCase().includes(searchName.toLowerCase())
        );
    }, [siswaList, searchName]);

    if (ekskulList.length === 0) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="text-center p-8 bg-white dark:bg-[#041610] rounded-3xl text-red-500 border border-slate-200 dark:border-emerald-500/10 max-w-md shadow-lg">
                    <Activity className="h-12 w-12 text-red-500/40 mx-auto mb-4 animate-pulse" />
                    <h2 className="text-xl font-bold mb-2">Akses Terbatas</h2>
                    <p className="text-slate-400 text-sm">Anda tidak ditugaskan sebagai pembina kegiatan ekstrakurikuler oleh Admin.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                        <Activity className="h-7 w-7 text-emerald-500" />
                        Nilai Kegiatan Ekstrakurikuler
                        {ekskulList.length === 1 && (
                            <span className="text-sm font-normal text-slate-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                {ekskulList[0].nama_ekskul}
                            </span>
                        )}
                    </h1>
                    <p className="text-slate-400 text-sm">Input nilai untuk siswa yang terdaftar di ekskul Anda.</p>
                </div>
            </div>

            {/* Filters panel */}
            <div className="bg-white dark:bg-[#041610] rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-emerald-500/10 shadow-sm flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4 w-full">
                <div className="flex flex-row w-full sm:w-auto gap-3 sm:gap-4 flex-wrap">
                    {/* Tahun Ajaran */}
                    <div className="flex flex-col gap-1.5 flex-1 sm:flex-none sm:w-[200px]">
                        <label className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Tahun Ajaran:</label>
                        {loadingTahunAjaran ? (
                            <div className="h-[38px] bg-slate-850/20 animate-pulse rounded-xl" />
                        ) : activeTahunAjaranList && activeTahunAjaranList.length === 1 ? (
                            <div className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-slate-50 dark:bg-[#061e16] py-2.5 px-3 sm:px-4 text-[12px] sm:text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center whitespace-nowrap overflow-hidden text-ellipsis shadow-sm">
                                {activeTahunAjaranList[0].nama_tahun} {activeTahunAjaranList[0].semester}
                            </div>
                        ) : (
                            <select
                                value={selectedTahunAjaranId}
                                onChange={(e) => setSelectedTahunAjaranId(e.target.value)}
                                disabled={loadingTahunAjaran}
                                className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#061e16] py-2.5 px-3 sm:px-4 text-[12px] sm:text-sm font-semibold text-slate-700 dark:text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-sm text-ellipsis overflow-hidden disabled:opacity-50"
                            >
                                {!activeTahunAjaranList || activeTahunAjaranList.length === 0 ? (
                                    <option value="">Tidak ada tahun ajaran aktif</option>
                                ) : (
                                    activeTahunAjaranList.map((ta) => (
                                        <option key={ta.id} value={ta.id} className="bg-[#020c08] text-white">
                                            {ta.nama_tahun} {ta.semester}
                                        </option>
                                    ))
                                )}
                            </select>
                        )}
                    </div>

                    {/* Ekskul Options */}
                    {ekskulList.length > 1 && (
                        <div className="flex flex-col gap-1.5 flex-1 sm:flex-none sm:w-[200px]">
                            <label className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Pilih Ekskul:</label>
                            <select
                                value={selectedEkskul}
                                onChange={(e) => setSelectedEkskul(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#061e16] py-2.5 px-3 sm:px-4 text-[12px] sm:text-sm font-semibold text-slate-700 dark:text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-sm"
                            >
                                {ekskulList.map(e => (
                                    <option key={e.id} value={e.id} className="bg-[#020c08] text-white">{e.nama_ekskul}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Search */}
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:flex-1">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Cari nama siswa..."
                            value={searchName}
                            onChange={(e) => setSearchName(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-slate-50 dark:bg-[#061e16] py-2.5 pl-9 pr-4 text-[13px] sm:text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Input Form Panel */}
            <form onSubmit={handleSave} className="glass-panel rounded-3xl p-6">
                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="overflow-x-auto rounded-xl border border-emerald-500/10">
                            <table className="w-full text-left text-xs whitespace-nowrap min-w-max border-separate border-spacing-0">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-[#061e16]">
                                        <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center w-10 static md:sticky md:left-0 md:z-30 bg-slate-50 dark:bg-[#061e16] text-slate-800 dark:text-slate-300 font-extrabold uppercase">No</th>
                                        <th className="py-2 px-3 border-b border-r-[3px] border-slate-400 dark:border-emerald-500/30 text-left static md:sticky md:left-10 md:z-30 bg-slate-50 dark:bg-[#061e16] shadow-[4px_0_12px_rgba(0,0,0,0.03)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.2)] text-slate-800 dark:text-slate-300 font-extrabold uppercase">Nama Lengkap</th>
                                        <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Kelas</th>
                                        <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Predikat / Grade</th>
                                        <th className="py-2 px-2 border-b border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Keterangan / Ketercapaian Kegiatan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="text-center py-8 text-slate-500 bg-white dark:bg-[#041610] border-b border-slate-300 dark:border-emerald-500/10">
                                                <Users className="h-10 w-10 text-emerald-500/40 mx-auto mb-2 opacity-50" />
                                                <p>Belum ada siswa yang didaftarkan ke ekskul ini pada tahun ajaran ini.</p>
                                                <p className="text-[10px] mt-1">Minta Admin untuk mendaftarkan siswa ke Ekskul.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map((s, idx) => {
                                            const nVal = nilaiEkskulMap[s.siswa_id] || { predikat: '', keterangan: '' };
                                            return (
                                                <tr key={s.siswa_id} className="hover:bg-slate-50 dark:hover:bg-[#082a1f] transition-colors group">
                                                    <td className="py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 font-semibold text-slate-500 text-center static md:sticky md:left-0 md:z-20 bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]">{idx + 1}</td>
                                                    <td className="py-1.5 px-3 border-b border-r-[3px] border-slate-400 dark:border-emerald-500/30 font-extrabold text-slate-850 dark:text-white text-left static md:sticky md:left-10 md:z-20 bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f] drop-shadow-md">{s.nama_lengkap}</td>
                                                    <td className="py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400 text-center whitespace-nowrap bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]">{s.kelas || '-'}</td>
                                                    <td className="py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]">
                                                        <select
                                                            value={nVal.predikat}
                                                            onChange={(e) => handleGradeChange(s.siswa_id, e.target.value)}
                                                            className="w-full min-w-[120px] max-w-[150px] mx-auto rounded-lg border border-slate-200 dark:border-emerald-500/20 bg-slate-50 dark:bg-[#020c08]/50 py-1 px-2 text-slate-700 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-[10px] sm:text-xs font-semibold cursor-pointer shadow-sm"
                                                        >
                                                            <option value="" className="bg-white dark:bg-[#020c08] text-slate-400">Pilih Grade...</option>
                                                            <option value="Sangat Baik" className="bg-white dark:bg-[#020c08] text-emerald-600 dark:text-white">Sangat Baik</option>
                                                            <option value="Baik" className="bg-white dark:bg-[#020c08] text-emerald-600 dark:text-white">Baik</option>
                                                            <option value="Cukup" className="bg-white dark:bg-[#020c08] text-amber-600 dark:text-white">Cukup</option>
                                                            <option value="Kurang" className="bg-white dark:bg-[#020c08] text-red-600 dark:text-white">Kurang</option>
                                                        </select>
                                                    </td>
                                                    <td className="py-1.5 px-2 border-b border-slate-300 dark:border-emerald-500/10 bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]">
                                                        <input
                                                            type="text"
                                                            value={nVal.keterangan}
                                                            onChange={(e) => handleKeteranganChange(s.siswa_id, e.target.value)}
                                                            placeholder="Opsional (Catatan prestasi)"
                                                            className="w-full min-w-[200px] rounded-lg border border-slate-200 dark:border-emerald-500/20 bg-slate-50 dark:bg-[#020c08]/50 py-1 px-3 text-slate-700 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:border-emerald-500 focus:outline-none text-[10px] sm:text-xs shadow-sm"
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Submit Button */}
                        {filteredStudents.length > 0 && (
                            <div className="flex items-center justify-between border-t border-emerald-500/10 pt-4">
                                <div>
                                    {saveSuccess && (
                                        <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold animate-pulse">
                                            <CheckCircle className="h-4 w-4" /> Nilai Ekstrakurikuler berhasil disimpan!
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSaving || !isCurrentYearActive}
                                    className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 py-2.5 px-6 text-sm font-semibold text-white transition-colors shadow-lg shadow-emerald-500/30"
                                >
                                    <Save className="h-5 w-5" />
                                    {isSaving ? 'Menyimpan...' : 'Simpan Nilai'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </form>
        </div>
    );
}
