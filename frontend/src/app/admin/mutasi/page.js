"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Users, GraduationCap, CheckCircle2, RefreshCw, Loader2, X, Info } from 'lucide-react';
import { useLongPress } from '@/hooks/useLongPress';

export default function MutasiSiswaPage() {
    const { token } = useAuth();
    const [kelasList, setKelasList] = useState([]);
    const [siswaList, setSiswaList] = useState([]);
    const [loadingSiswa, setLoadingSiswa] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [kelasAsal, setKelasAsal] = useState('');
    const [selectedSiswaIds, setSelectedSiswaIds] = useState([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [aksiMassal, setAksiMassal] = useState('');

    useEffect(() => {
        if (token) {
            fetchKelas();
        }
    }, [token]);

    const fetchKelas = async () => {
        try {
            const res = await fetch('/api/kelas', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setKelasList(data);
        } catch (err) {
            console.error('Error fetching kelas:', err);
        }
    };

    const fetchSiswa = async (kelasName) => {
        if (!kelasName) {
            setSiswaList([]);
            return;
        }
        setLoadingSiswa(true);
        try {
            // Kita ambil semua siswa, controller siswa biasanya mengembalikan semua
            const res = await fetch('/api/siswa', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            // Filter siswa di kelas tersebut yang masih aktif
            const filtered = data.filter(s => s.kelas === kelasName && s.status_aktif === 'aktif');
            setSiswaList(filtered);
            setSelectedSiswaIds([]); // Reset selection
        } catch (err) {
            console.error('Error fetching siswa:', err);
        } finally {
            setLoadingSiswa(false);
        }
    };

    const handleKelasAsalChange = (e) => {
        const val = e.target.value;
        setKelasAsal(val);
        setAksiMassal('');
        setIsSelectionMode(false);
        fetchSiswa(val);
    };

    const handleLongPress = (e, id) => {
        if (e && e.preventDefault) e.preventDefault();
        setIsSelectionMode(true);
        if (id && !selectedSiswaIds.includes(id)) {
            setSelectedSiswaIds(prev => [...prev, id]);
        }
    };

    const longPressHandlers = useLongPress(handleLongPress, null, { delay: 2000 });

    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedSiswaIds(siswaList.map(s => s.id));
        } else {
            setSelectedSiswaIds([]);
        }
    };

    const toggleSelect = (id) => {
        setSelectedSiswaIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSubmit = async () => {
        if (selectedSiswaIds.length === 0) {
            return alert('Pilih minimal 1 siswa terlebih dahulu.');
        }

        if (!aksiMassal) {
            return alert('Pilih aksi massal (kelas tujuan atau status) terlebih dahulu.');
        }

        const isKelas = aksiMassal.startsWith('kelas_');
        let url = '';
        let payload = {};
        let confirmMsg = '';

        if (isKelas) {
            const kelasTujuan = aksiMassal.replace('kelas_', '');
            url = '/api/mutasi/pindah-kelas';
            payload = { siswa_ids: selectedSiswaIds, target_kelas: kelasTujuan };
            confirmMsg = `Yakin ingin memindahkan ${selectedSiswaIds.length} siswa ke kelas ${kelasTujuan}?`;
        } else {
            // It's status
            let finalStatus = 'lulus';
            if (kelasAsal && !kelasAsal.includes('IX') && !kelasAsal.includes('XII')) {
                finalStatus = 'keluar';
            }
            url = '/api/mutasi/status';
            payload = { siswa_ids: selectedSiswaIds, status: finalStatus };
            confirmMsg = `Yakin ingin mengubah status ${selectedSiswaIds.length} siswa menjadi ${finalStatus === 'lulus' ? 'Lulus' : 'Pindah'}?`;
        }

        if (!confirm(confirmMsg)) return;

        setSubmitting(true);
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const result = await res.json();
            if (res.ok) {
                // Refresh list directly without second alert
                fetchSiswa(kelasAsal);
                // Clear selection
                setSelectedSiswaIds([]);
                setIsSelectionMode(false);
            } else {
                alert('Gagal: ' + result.message);
            }
        } catch (err) {
            console.error('Error processing mutasi:', err);
            alert('Terjadi kesalahan sistem.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Kenaikan Kelas & Mutasi</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Proses kenaikan kelas atau kelulusan siswa secara massal</p>
                </div>
            </div>

            <div className="w-full flex flex-col gap-6">
                
                {/* Control Bar */}
                <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                    
                    {/* Filter Kelas Asal */}
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Pilih Kelas Asal</label>
                        <select 
                            value={kelasAsal}
                            onChange={handleKelasAsalChange}
                            className="w-full px-3 py-2 text-sm rounded-xl bg-white dark:bg-[#061e16] border border-slate-200 dark:border-emerald-500/20 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white shadow-sm"
                        >
                            <option value="">-- Pilih Kelas --</option>
                            {kelasList.map(k => (
                                <option key={k.id} value={k.nama_kelas}>{k.nama_kelas}</option>
                            ))}
                        </select>
                    </div>

                    {/* Divider */}
                    <div className="hidden lg:block w-px h-12 bg-slate-300 dark:bg-emerald-500/20 mx-2 mb-2"></div>

                    {/* Action Controls */}
                    <div className="flex-[2]">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                            <RefreshCw className="h-4 w-4 text-emerald-500" /> Aksi Massal
                        </label>
                        <select 
                            value={aksiMassal}
                            onChange={(e) => {
                                setAksiMassal(e.target.value);
                                if (e.target.value !== '') {
                                    setIsSelectionMode(true);
                                }
                            }}
                            className="w-full sm:w-auto min-w-[250px] px-3 py-2 text-sm rounded-xl bg-white dark:bg-[#061e16] border border-slate-200 dark:border-emerald-500/20 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white shadow-sm"
                        >
                            <option value="">-- Pilih Aksi / Tujuan --</option>
                            {kelasList.filter(k => {
                                if (!kelasAsal) return true;
                                return k.nama_kelas !== kelasAsal;
                            }).map(k => (
                                <option key={k.id} value={`kelas_${k.nama_kelas}`}>Pindah ke {k.nama_kelas}</option>
                            ))}
                            <option value="status_lulus">Lulus / Pindah (Alumni)</option>
                        </select>
                    </div>
                </div>

                {/* Table Siswa */}
                <div className="flex-1 overflow-x-auto w-full">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-[#061e16] border-y-2 border-slate-200 dark:border-emerald-500/20">
                                {isSelectionMode && (
                                    <th className="py-2 px-4 w-12 text-center border-t-2 border-x-2 border-slate-200 dark:border-emerald-500/20 static md:sticky md:left-0 md:z-40 bg-slate-50 dark:bg-[#061e16]">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedSiswaIds.length === siswaList.length && siswaList.length > 0}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                        />
                                    </th>
                                )}
                                <th className={`py-2 px-4 w-12 text-center border-t-2 border-x-2 border-slate-200 dark:border-emerald-500/20 static md:sticky ${isSelectionMode ? 'md:left-12' : 'md:left-0'} md:z-30 bg-slate-50 dark:bg-[#061e16] text-slate-800 dark:text-slate-300 font-extrabold uppercase`}>No</th>
                                <th className={`py-2 px-4 border-t-2 border-r-2 border-slate-200 dark:border-emerald-500/20 text-center static md:sticky ${isSelectionMode ? 'md:left-24' : 'md:left-12'} md:z-30 bg-slate-50 dark:bg-[#061e16] text-slate-800 dark:text-slate-300 font-extrabold uppercase`}>Nama Lengkap</th>
                                <th className="py-2 px-4 w-40 border-t-2 border-r-2 border-slate-200 dark:border-emerald-500/20 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">NIS</th>
                                <th className="py-2 px-4 border-t-2 border-r-2 border-slate-200 dark:border-emerald-500/20 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Kelas</th>
                                <th className="py-2 px-4 border-t-2 border-r-2 border-slate-200 dark:border-emerald-500/20 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Nama Wali/Ortu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingSiswa ? (
                                <tr className="bg-white dark:bg-[#061e16] border-b-2 border-slate-200 dark:border-emerald-500/20">
                                    <td colSpan={isSelectionMode ? "6" : "5"} className="py-12 border-x-2 border-slate-200 dark:border-emerald-500/20">
                                        <div className="flex h-40 items-center justify-center">
                                            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                                        </div>
                                    </td>
                                </tr>
                            ) : siswaList.length === 0 ? (
                                <tr className="bg-white dark:bg-[#061e16] border-b-2 border-slate-200 dark:border-emerald-500/20">
                                    <td colSpan={isSelectionMode ? "6" : "5"} className="py-12 border-x-2 border-slate-200 dark:border-emerald-500/20">
                                        <div className="flex flex-col h-40 items-center justify-center text-slate-400 gap-2">
                                            <Users className="h-8 w-8 opacity-50" />
                                            <span className="text-sm font-medium">Silakan pilih kelas asal atau tidak ada siswa aktif.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                siswaList.map((s, index) => (
                                    <tr 
                                        key={s.id} 
                                        {...longPressHandlers(s.id)}
                                        onClick={() => {
                                            if (!isSelectionMode) setIsSelectionMode(true);
                                            toggleSelect(s.id);
                                        }}
                                        className={`transition-colors group cursor-pointer select-none bg-white dark:bg-[#061e16] border-b-2 border-slate-200 dark:border-emerald-500/20
                                            ${selectedSiswaIds.includes(s.id) 
                                                ? 'bg-emerald-50 dark:bg-emerald-500/10' 
                                                : 'hover:bg-slate-50 dark:hover:bg-[#061e16]/80'}`}
                                    >
                                        {isSelectionMode && (
                                            <td className={`py-2 px-4 text-center border-x-2 border-slate-200 dark:border-emerald-500/20 static md:sticky md:left-0 md:z-20 ${selectedSiswaIds.includes(s.id) ? 'bg-emerald-50 dark:bg-[#06241a]' : 'bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]'}`}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedSiswaIds.includes(s.id)}
                                                    readOnly // handled by tr click
                                                    className="w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500 pointer-events-none"
                                                />
                                            </td>
                                        )}
                                        <td className={`py-2 px-4 text-center border-x-2 border-slate-200 dark:border-emerald-500/20 font-medium text-slate-600 dark:text-slate-300 static md:sticky ${isSelectionMode ? 'md:left-12' : 'md:left-0'} md:z-20 ${selectedSiswaIds.includes(s.id) ? 'bg-emerald-50 dark:bg-[#06241a]' : 'bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]'}`}>{index + 1}</td>
                                        <td className={`py-2 px-4 border-r-2 border-slate-200 dark:border-emerald-500/20 font-extrabold text-slate-850 dark:text-white text-left static md:sticky ${isSelectionMode ? 'md:left-24' : 'md:left-12'} md:z-20 ${selectedSiswaIds.includes(s.id) ? 'bg-emerald-50 dark:bg-[#06241a]' : 'bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]'}`}>{s.nama_lengkap}</td>
                                        <td className={`py-2 px-4 border-r-2 border-slate-200 dark:border-emerald-500/20 font-medium text-slate-600 dark:text-slate-300 text-center ${selectedSiswaIds.includes(s.id) ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]'}`}>{s.nis}</td>
                                        <td className={`py-2 px-4 border-r-2 border-slate-200 dark:border-emerald-500/20 font-medium text-slate-600 dark:text-slate-300 text-center ${selectedSiswaIds.includes(s.id) ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]'}`}>{s.kelas}</td>
                                        <td className={`py-2 px-4 border-r-2 border-slate-200 dark:border-emerald-500/20 font-medium text-slate-600 dark:text-slate-300 text-left ${selectedSiswaIds.includes(s.id) ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]'}`}>{s.nama_wali || <span className="italic text-slate-400">Belum ada</span>}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Footer and Submit */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-2">
                    <div className="flex items-center gap-4">
                        {siswaList.length > 0 && (
                            <div className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                                Terpilih: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedSiswaIds.length}</span> dari {siswaList.length} siswa
                            </div>
                        )}
                        
                        {isSelectionMode && (
                            <button 
                                onClick={() => {
                                    setIsSelectionMode(false);
                                    setSelectedSiswaIds([]);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors text-sm font-medium"
                            >
                                <X className="h-4 w-4" /> Batal Pilih
                            </button>
                        )}
                    </div>

                    <button 
                        onClick={handleSubmit}
                        disabled={submitting || selectedSiswaIds.length === 0}
                        className="w-full sm:w-auto px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center gap-2"
                    >
                        {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                        Proses Data
                    </button>
                </div>
            </div>
        </div>
    );
}
