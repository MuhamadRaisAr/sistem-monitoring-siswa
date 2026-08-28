"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Search, Plus, Edit2, Trash2, X, Users, Eye } from 'lucide-react';

export default function AdminKelasPage() {
    const { token } = useAuth();
    const router = useRouter();
    const [kelasList, setKelasList] = useState([]);
    const [guruList, setGuruList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedKelas, setSelectedKelas] = useState(null);
    const [formError, setFormError] = useState('');

    // Form fields
    const [namaKelas, setNamaKelas] = useState('');
    const [waliKelasId, setWaliKelasId] = useState('');

    const API_URL = '/api';

    const fetchData = async () => {
        try {
            const [resKelas, resGuru] = await Promise.all([
                fetch(`${API_URL}/kelas`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/kelas/guru-list`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            
            const dataKelas = await resKelas.json();
            const dataGuru = await resGuru.json();
            
            setKelasList(Array.isArray(dataKelas) ? dataKelas : []);
            setGuruList(Array.isArray(dataGuru) ? dataGuru : []);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]);

    const openAddModal = () => {
        setModalMode('add');
        setNamaKelas('');
        setWaliKelasId('');
        setFormError('');
        setModalOpen(true);
    };

    const openEditModal = (k) => {
        setModalMode('edit');
        setSelectedKelas(k);
        setNamaKelas(k.nama_kelas);
        setWaliKelasId(k.wali_kelas_id || '');
        setFormError('');
        setModalOpen(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        const payload = {
            nama_kelas: namaKelas,
            wali_kelas_id: waliKelasId ? parseInt(waliKelasId) : null
        };

        const url = modalMode === 'add' ? `${API_URL}/kelas` : `${API_URL}/kelas/${selectedKelas.id}`;
        const method = modalMode === 'add' ? 'POST' : 'PUT';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Gagal menyimpan kelas');

            setModalOpen(false);
            fetchData();
        } catch (err) {
            setFormError(err.message);
        }
    };

    const handleDelete = async (id, nama) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus kelas ${nama}?`)) return;
        try {
            const res = await fetch(`${API_URL}/kelas/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchData();
            } else {
                const data = await res.json();
                alert(data.message || 'Gagal menghapus kelas');
            }
        } catch (err) {
            console.error('Error deleting kelas:', err);
        }
    };

    const opensiswaModal = (k) => {
        router.push(`/admin/kelas/${encodeURIComponent(k.nama_kelas)}`);
    };

    const getRomanValue = (str) => {
        if (!str) return 0;
        const match = str.trim().split(/[\s()]/)[0].toUpperCase();
        const romanMap = {
            'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6,
            'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12
        };
        return romanMap[match] || 999;
    };

    const filteredKelas = [...kelasList]
        .sort((a, b) => {
            const valA = getRomanValue(a.nama_kelas);
            const valB = getRomanValue(b.nama_kelas);
            if (valA !== valB) return valA - valB;
            return a.nama_kelas.localeCompare(b.nama_kelas);
        })
        .filter(k => 
            k.nama_kelas.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (k.wali_kelas_nama && k.wali_kelas_nama.toLowerCase().includes(searchQuery.toLowerCase()))
        );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Data Kelas</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Kelola master data kelas dan wali kelas.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari kelas atau wali..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#020c08]/50 py-2 sm:py-2.5 pl-9 pr-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                    <button
                        onClick={openAddModal}
                        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2 sm:py-2.5 px-4 sm:px-5 text-sm font-semibold text-white transition-colors shrink-0 w-full sm:w-auto"
                    >
                        <Plus className="h-4 w-4" />
                        Tambah Kelas
                    </button>
                </div>
            </div>

            <div className="w-full mt-4">


                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredKelas.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-slate-500 bg-[#020c08]/20 rounded-2xl border border-emerald-500/5">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
                                        <Search className="h-6 w-6" />
                                    </div>
                                    <p className="font-medium text-slate-400">Tidak ada data kelas ditemukan.</p>
                                </div>
                            </div>
                        ) : (
                            filteredKelas.map((k) => (
                                <div key={k.id} className="relative flex flex-col items-center p-6 rounded-2xl bg-white dark:bg-[#020c08]/40 border border-emerald-500/10 hover:border-emerald-500/30 hover:bg-slate-50 dark:hover:bg-[#020c08]/60 transition-all group shadow-sm">
                                    <div className="absolute top-3 right-3 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-lg p-0.5 sm:bg-transparent sm:backdrop-blur-none">
                                        <button onClick={() => openEditModal(k)} title="Edit Kelas" className="p-1.5 sm:p-2 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors"><Edit2 className="h-4 w-4 sm:h-5 sm:w-5" /></button>
                                        <button onClick={() => handleDelete(k.id, k.nama_kelas)} title="Hapus Kelas" className="p-1.5 sm:p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"><Trash2 className="h-4 w-4 sm:h-5 sm:w-5" /></button>
                                    </div>
                                    <div className="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
                                        <Users className="h-7 w-7" />
                                    </div>
                                    <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mb-1 w-full text-center truncate px-2" title={decodeURIComponent(k.nama_kelas)}>
                                        {decodeURIComponent(k.nama_kelas)}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 text-center w-full truncate px-2" title={`Wali: ${k.wali_kelas_nama || 'Belum diatur'}`}>
                                        Wali: <span className="font-medium text-emerald-600 dark:text-emerald-400">{k.wali_kelas_nama || 'Belum diatur'}</span>
                                    </p>
                                    <button 
                                        onClick={() => opensiswaModal(k)}
                                        className="w-full py-2.5 rounded-xl border border-slate-600 hover:border-emerald-500 hover:bg-emerald-500/10 text-sm font-semibold text-slate-300 hover:text-emerald-400 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Eye className="h-4 w-4" /> Lihat Daftar Siswa
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Modal Tambah/Edit */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                    <div className="relative w-full max-w-lg glass-panel rounded-3xl p-6 overflow-hidden">
                        <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                            <X className="h-6 w-6" />
                        </button>
                        
                        <h2 className="text-xl font-bold text-white mb-6">
                            {modalMode === 'add' ? 'Tambah Kelas Baru' : 'Edit Data Kelas'}
                        </h2>

                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            {formError && (
                                <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-red-300 text-xs font-semibold">
                                    {formError}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Nama Kelas</label>
                                <input
                                    type="text"
                                    required
                                    value={namaKelas}
                                    onChange={(e) => setNamaKelas(e.target.value)}
                                    className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2.5 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-sm"
                                    placeholder="Misal: 7-A atau VII-A"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Wali Kelas</label>
                                <select
                                    value={waliKelasId}
                                    onChange={(e) => setWaliKelasId(e.target.value)}
                                    className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2.5 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-sm"
                                >
                                    <option value="" className="bg-[#020c08] text-slate-500">-- Pilih Wali Kelas --</option>
                                    {guruList.map(g => (
                                        <option key={g.id} value={g.id} className="bg-[#020c08]">
                                            {g.nama_lengkap}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-slate-500 mt-1">Hanya pengguna dengan role Guru yang muncul di sini.</p>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="rounded-xl border border-emerald-500/20 py-2.5 px-4 text-sm font-semibold text-slate-300 hover:bg-[#061e16] transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 px-6 text-sm font-semibold text-white transition-all shadow-md"
                                >
                                    Simpan Data
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
