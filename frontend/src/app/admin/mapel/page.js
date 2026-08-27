"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Search, Plus, Edit2, Trash2, X, BookOpen, AlertCircle } from 'lucide-react';
import { toTitleCase } from '@/utils/textFormatter';

export default function AdminMapelPage() {
    const { token } = useAuth();
    const [mapelList, setMapelList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedMapel, setSelectedMapel] = useState(null);
    const [formError, setFormError] = useState('');

    // Form fields
    const [namaPelajaran, setNamaPelajaran] = useState('');

    const API_URL = '/api';

    const fetchData = async () => {
        try {
            const res = await fetch(`${API_URL}/mapel`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            setMapelList(Array.isArray(data) ? data : []);
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
        setNamaPelajaran('');
        setFormError('');
        setModalOpen(true);
    };

    const openEditModal = (m) => {
        setModalMode('edit');
        setSelectedMapel(m);
        setNamaPelajaran(m.nama_pelajaran);
        setFormError('');
        setModalOpen(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        const payload = { nama_pelajaran: namaPelajaran };
        const url = modalMode === 'add' ? `${API_URL}/mapel` : `${API_URL}/mapel/${selectedMapel.id}`;
        const method = modalMode === 'add' ? 'POST' : 'PUT';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Gagal menyimpan mata pelajaran');

            setModalOpen(false);
            fetchData();
        } catch (err) {
            setFormError(err.message);
        }
    };

    const handleDelete = async (id, nama) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus mata pelajaran ${nama}?`)) return;
        try {
            const res = await fetch(`${API_URL}/mapel/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchData();
            } else {
                const data = await res.json();
                alert(data.message || 'Gagal menghapus mata pelajaran');
            }
        } catch (err) {
            console.error('Error deleting mapel:', err);
        }
    };

    const filteredMapel = mapelList.filter(m => 
        m.nama_pelajaran.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Mata Pelajaran</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Kelola master mata pelajaran.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari mata pelajaran..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#020c08]/50 py-2 sm:py-2.5 pl-9 pr-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                    <button onClick={openAddModal} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2 sm:py-2.5 px-4 sm:px-5 text-sm font-semibold text-white transition-colors shrink-0 w-full sm:w-auto">
                        <Plus className="h-4 w-4" /> Tambah Pelajaran
                    </button>
                </div>
            </div>

            <div className="glass-panel rounded-3xl p-6">


                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                        {filteredMapel.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-slate-500 bg-transparent rounded-2xl border-2 border-dashed border-emerald-500/20">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
                                        <Search className="h-6 w-6" />
                                    </div>
                                    <p className="font-medium text-slate-400">Tidak ada data pelajaran ditemukan.</p>
                                </div>
                            </div>
                        ) : (
                            filteredMapel.map((m) => (
                                <div key={m.id} className="relative flex flex-col sm:flex-row items-center text-center sm:text-left gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#020c08]/40 border border-emerald-500/10 hover:border-emerald-500/30 hover:bg-slate-50 dark:hover:bg-[#020c08]/60 transition-all group shadow-sm pt-8 sm:pt-5">
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-lg p-0.5 sm:bg-transparent sm:backdrop-blur-none">
                                        <button onClick={() => openEditModal(m)} title="Edit Pelajaran" className="p-1 sm:p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                                        <button onClick={() => handleDelete(m.id, m.nama_pelajaran)} title="Hapus Pelajaran" className="p-1 sm:p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                                    </div>
                                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-emerald-500/10 flex shrink-0 items-center justify-center text-emerald-500">
                                        <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
                                    </div>
                                    <h3 className="text-sm sm:text-lg font-bold text-slate-800 dark:text-white leading-tight px-1 sm:px-0 sm:pr-6 line-clamp-2">{m.nama_pelajaran}</h3>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Modal Tambah/Edit */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 overflow-hidden bg-white dark:bg-[#041610] text-slate-800 dark:text-white border border-slate-200 dark:border-emerald-500/10">
                        <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                            <X className="h-6 w-6" />
                        </button>

                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-emerald-500" />
                            {modalMode === 'add' ? 'Tambah Pelajaran Baru' : 'Edit Pelajaran'}
                        </h2>

                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            {formError && (
                                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-300 text-xs font-semibold">
                                    {formError}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Nama Mata Pelajaran</label>
                                <input
                                    type="text"
                                    value={namaPelajaran}
                                    onChange={(e) => setNamaPelajaran(e.target.value)}
                                    required
                                    placeholder="Contoh: Matematika"
                                    className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm"
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 dark:border-emerald-500/20 py-2.5 px-4 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#061e16] transition-all cursor-pointer">
                                    Batal
                                </button>
                                <button type="submit" className="rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 px-6 text-sm font-semibold text-white transition-all shadow-md cursor-pointer">
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
