"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTahunAjaran } from '@/hooks/useTahunAjaran';
import { ArrowLeft, UserPlus, Trash2, Search, Loader2, Shield } from 'lucide-react';

export default function DetailEkskulPage() {
    const { id: ekskulId } = useParams();
    const router = useRouter();
    const { token } = useAuth();
    const { tahunAjaranList, selectedTahunAjaranId, setSelectedTahunAjaranId, loadingTahunAjaran } = useTahunAjaran();

    const [ekskul, setEkskul] = useState(null);
    const [anggota, setAnggota] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchAnggota, setSearchAnggota] = useState('');

    // Modal Add Student
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [allSiswa, setAllSiswa] = useState([]);
    const [searchSiswaModal, setSearchSiswaModal] = useState('');
    const [loadingSiswa, setLoadingSiswa] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (token && ekskulId && selectedTahunAjaranId) {
            fetchData();
        }
    }, [token, ekskulId, selectedTahunAjaranId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Ekskul Detail (From all ekskuls)
            const resEkskul = await fetch('/api/ekskul', { headers: { 'Authorization': `Bearer ${token}` } });
            const dataEkskul = await resEkskul.json();
            const currentEkskul = dataEkskul.find(e => e.id.toString() === ekskulId);
            setEkskul(currentEkskul);

            // Fetch Anggota Ekskul
            const resAnggota = await fetch(`/api/nilai-ekskul/anggota?ekskul_id=${ekskulId}&tahun_ajaran_id=${selectedTahunAjaranId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const dataAnggota = await resAnggota.json();
            setAnggota(Array.isArray(dataAnggota) ? dataAnggota : []);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllSiswa = async () => {
        setLoadingSiswa(true);
        try {
            const res = await fetch('/api/siswa?status=Aktif', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            setAllSiswa(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching siswa:', err);
        } finally {
            setLoadingSiswa(false);
        }
    };

    const handleOpenModal = () => {
        setIsModalOpen(true);
        if (allSiswa.length === 0) {
            fetchAllSiswa();
        }
    };

    const handleAddSiswa = async (siswaId) => {
        setSubmitting(true);
        try {
            const res = await fetch('/api/nilai-ekskul/anggota', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    siswa_id: siswaId,
                    ekskul_id: ekskulId,
                    tahun_ajaran_id: selectedTahunAjaranId
                })
            });
            const data = await res.json();
            if (res.ok) {
                fetchData(); // Refresh anggota
            } else {
                alert(`Gagal menambahkan: ${data.message}`);
            }
        } catch (err) {
            console.error('Add error:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteAnggota = async (nilaiEkskulId, namaSiswa) => {
        if (!confirm(`Yakin ingin mengeluarkan ${namaSiswa} dari ekskul ini?`)) return;
        try {
            const res = await fetch(`/api/nilai-ekskul/${nilaiEkskulId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchData();
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const filteredAnggota = anggota.filter(a => 
        a.nama_lengkap?.toLowerCase().includes(searchAnggota.toLowerCase()) ||
        a.nis?.includes(searchAnggota)
    );

    const filteredAllSiswa = allSiswa.filter(s => 
        s.nama_lengkap?.toLowerCase().includes(searchSiswaModal.toLowerCase()) ||
        s.nis?.includes(searchSiswaModal)
    );

    if (loading || loadingTahunAjaran) {
        return (
            <div className="flex h-full items-center justify-center p-6">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    if (!ekskul) {
        return (
            <div className="p-8 text-center text-slate-500">
                Ekstrakurikuler tidak ditemukan.
                <button onClick={() => router.push('/admin/ekstrakurikuler')} className="block mx-auto mt-4 text-emerald-500 underline">Kembali</button>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in max-w-7xl mx-auto">
            {/* Header & Back Button */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/admin/ekstrakurikuler')}
                        className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#061e16] dark:hover:bg-emerald-500/20 text-slate-600 dark:text-emerald-400 rounded-xl transition-colors shrink-0"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                            Anggota {ekskul.nama_ekskul}
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                            <Shield className="h-4 w-4" /> Pembina: {ekskul.nama_pembina || 'Belum ada'}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={handleOpenModal}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all active:scale-95 shrink-0 w-full sm:w-auto"
                >
                    <UserPlus className="h-5 w-5" /> Tambah Anggota
                </button>
            </div>

            {/* Filter & Actions */}
            {/* Filter & Search */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end w-full">
                <div className="flex flex-col gap-1 w-full sm:w-[250px]">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tahun Ajaran:</label>
                    <select 
                        value={selectedTahunAjaranId}
                        onChange={(e) => setSelectedTahunAjaranId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#061e16] py-2.5 px-3 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:border-emerald-500 focus:outline-none cursor-pointer shadow-sm shadow-slate-200/50 dark:shadow-none"
                    >
                        {tahunAjaranList.map((ta) => (
                            <option key={ta.id} value={ta.id}>{ta.nama_tahun} {ta.semester}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col gap-1 w-full sm:w-[300px]">
                    <div className="relative w-full shadow-sm shadow-slate-200/50 dark:shadow-none rounded-xl">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input 
                            type="text"
                            placeholder="Cari anggota (Nama/NIS)..."
                            value={searchAnggota}
                            onChange={(e) => setSearchAnggota(e.target.value)}
                            className="block w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#061e16] py-2.5 pl-9 pr-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                </div>
            </div>

            {/* Table Anggota */}
            <div className="overflow-x-auto w-full">
                <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-[#061e16] border-y-2 border-slate-200 dark:border-emerald-500/20">
                                <th className="py-4 px-6 text-sm font-bold text-center text-slate-700 dark:text-slate-200 border-t-2 border-x-2 border-slate-200 dark:border-emerald-500/20">No</th>
                                <th className="py-4 px-6 text-sm font-bold text-center text-slate-700 dark:text-slate-200 border-t-2 border-r-2 border-slate-200 dark:border-emerald-500/20">Nama Siswa</th>
                                <th className="py-4 px-6 text-sm font-bold text-center text-slate-700 dark:text-slate-200 border-t-2 border-r-2 border-slate-200 dark:border-emerald-500/20 w-48 lg:w-64">NIS</th>
                                <th className="py-4 px-6 text-sm font-bold text-center text-slate-700 dark:text-slate-200 border-t-2 border-r-2 border-slate-200 dark:border-emerald-500/20">Kelas</th>
                                <th className="py-4 px-6 text-sm font-bold text-center text-slate-700 dark:text-slate-200 border-t-2 border-r-2 border-slate-200 dark:border-emerald-500/20">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAnggota.length === 0 ? (
                                <tr className="bg-white dark:bg-[#061e16] border-b-2 border-slate-200 dark:border-emerald-500/20">
                                    <td colSpan="5" className="py-12 text-center text-slate-500 font-medium border-x-2 border-slate-200 dark:border-emerald-500/20">Belum ada anggota terdaftar.</td>
                                </tr>
                            ) : (
                                filteredAnggota.map((item, index) => (
                                    <tr key={item.nilai_ekskul_id} className="bg-white dark:bg-[#061e16] border-b-2 border-slate-200 dark:border-emerald-500/20 hover:bg-slate-50 dark:hover:bg-[#061e16]/80 transition-colors">
                                        <td className="py-4 px-6 font-semibold text-slate-500 dark:text-slate-400 border-x-2 border-slate-200 dark:border-emerald-500/20 w-12 text-center">
                                            {index + 1}
                                        </td>
                                        <td className="py-4 px-6 font-bold text-slate-800 dark:text-white border-r-2 border-slate-200 dark:border-emerald-500/20">
                                            {item.nama_lengkap}
                                        </td>
                                        <td className="py-4 px-6 font-medium text-slate-600 dark:text-slate-300 border-r-2 border-slate-200 dark:border-emerald-500/20">
                                            {item.nis || '-'}
                                        </td>
                                        <td className="py-4 px-6 font-bold text-emerald-600 dark:text-emerald-400 border-r-2 border-slate-200 dark:border-emerald-500/20">
                                            {item.kelas || '-'}
                                        </td>
                                        <td className="py-4 px-6 border-r-2 border-slate-200 dark:border-emerald-500/20 text-center">
                                            <button 
                                                onClick={() => handleDeleteAnggota(item.nilai_ekskul_id, item.nama_lengkap)} 
                                                className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors" 
                                                title="Keluarkan Anggota"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
            </div>

            {/* Modal Tambah Anggota */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-[#020c08] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-emerald-500/20 flex flex-col max-h-[85vh]">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-emerald-500/10">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Tambah Anggota Ekskul</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Cari dan pilih siswa untuk ditambahkan ke ekskul ini</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full">
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 border-b border-slate-100 dark:border-emerald-500/10 bg-slate-50/50 dark:bg-emerald-950/5">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input 
                                    type="text"
                                    placeholder="Cari siswa (Nama/NIS)..."
                                    value={searchSiswaModal}
                                    onChange={(e) => setSearchSiswaModal(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#061e16] border border-slate-200 dark:border-emerald-500/20 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-700 dark:text-slate-200"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2">
                            {loadingSiswa ? (
                                <div className="flex h-32 items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                                </div>
                            ) : (
                                <table className="w-full text-left whitespace-nowrap">
                                    <tbody>
                                        {filteredAllSiswa.slice(0, 50).map(s => {
                                            const isMember = anggota.some(a => a.siswa_id === s.id);
                                            return (
                                                <tr key={s.id} className="border-b border-slate-100 dark:border-emerald-500/5 hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                                                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-white">
                                                        {s.nama_lengkap}
                                                        <div className="text-xs text-slate-500 font-normal mt-0.5">{s.nis || '-'} • Kelas {s.kelas || '-'}</div>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        {isMember ? (
                                                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg">
                                                                Sudah Terdaftar
                                                            </span>
                                                        ) : (
                                                            <button 
                                                                onClick={() => handleAddSiswa(s.id)}
                                                                disabled={submitting}
                                                                className="px-4 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg shadow-md shadow-sky-500/30 transition-all active:scale-95 disabled:opacity-50"
                                                            >
                                                                Tambah
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filteredAllSiswa.length === 0 && (
                                            <tr>
                                                <td colSpan="2" className="py-8 text-center text-slate-500 text-sm">Tidak ada siswa ditemukan.</td>
                                            </tr>
                                        )}
                                        {filteredAllSiswa.length > 50 && (
                                            <tr>
                                                <td colSpan="2" className="py-4 text-center text-slate-400 text-xs italic">Menampilkan 50 data teratas. Gunakan pencarian untuk hasil spesifik.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
