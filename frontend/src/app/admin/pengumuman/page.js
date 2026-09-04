"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Search, Plus, Edit2, Trash2, X, Megaphone, Calendar, CheckCircle } from 'lucide-react';

export default function AdminPengumumanPage() {
    const { token } = useAuth();
    const [pengumumanList, setPengumumanList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedPengumuman, setSelectedPengumuman] = useState(null);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    // Form fields
    const [judul, setJudul] = useState('');
    const [isiPengumuman, setIsiPengumuman] = useState('');
    const [tanggal, setTanggal] = useState('');
    const [target, setTarget] = useState('semua');

    const API_URL = '/api';

    const fetchData = async () => {
        try {
            const res = await fetch(`${API_URL}/pengumuman`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            setPengumumanList(Array.isArray(data) ? data : []);
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
        setJudul('');
        setIsiPengumuman('');
        setTanggal(new Date().toISOString().split('T')[0]); // Default today
        setTarget('semua');
        setFormError('');
        setModalOpen(true);
    };

    const openEditModal = (p) => {
        setModalMode('edit');
        setSelectedPengumuman(p);
        setJudul(p.judul);
        setIsiPengumuman(p.isi_pengumuman);
        setTarget(p.target || 'semua');
        
        // Format date properly for input type="date"
        let formattedDate = '';
        if (p.tanggal) {
            const d = new Date(p.tanggal);
            formattedDate = d.toISOString().split('T')[0];
        }
        setTanggal(formattedDate);
        
        setFormError('');
        setModalOpen(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        const payload = { judul, isi_pengumuman: isiPengumuman, tanggal, target };
        const url = modalMode === 'add' ? `${API_URL}/pengumuman` : `${API_URL}/pengumuman/${selectedPengumuman.id}`;
        const method = modalMode === 'add' ? 'POST' : 'PUT';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Gagal menyimpan pengumuman');

            setModalOpen(false);
            fetchData();
            setTimeout(() => {
                setFormSuccess(modalMode === 'add' ? 'Pengumuman berhasil ditambahkan!' : 'Pengumuman berhasil diperbarui!');
                setTimeout(() => setFormSuccess(''), 3000);
            }, 100);
        } catch (err) {
            setFormError(err.message);
        }
    };

    const handleDelete = async (id, title) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus pengumuman "${title}"?`)) return;
        try {
            const res = await fetch(`${API_URL}/pengumuman/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchData();
            } else {
                const data = await res.json();
                alert(data.message || 'Gagal menghapus pengumuman');
            }
        } catch (err) {
            console.error('Error deleting pengumuman:', err);
        }
    };

    const filteredPengumuman = pengumumanList.filter(p => 
        p.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.isi_pengumuman.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 relative">
            {/* Global Toast Alerts (Auto dismiss) */}
            {formSuccess && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 bg-white text-slate-700 rounded-xl shadow-xl animate-fade-in flex items-center gap-3 font-semibold border border-slate-200 w-max max-w-[90vw]">
                    <CheckCircle className="h-5 w-5 text-slate-500 shrink-0" />
                    <span className="whitespace-nowrap">{formSuccess}</span>
                </div>
            )}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Pengumuman</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Kelola informasi dan pengumuman sekolah.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari pengumuman..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#020c08]/50 py-2 sm:py-2.5 pl-9 pr-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                    <button onClick={openAddModal} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2 sm:py-2.5 px-4 sm:px-5 text-sm font-semibold text-white transition-colors shrink-0 w-full sm:w-auto">
                        <Plus className="h-4 w-4" /> Buat Pengumuman
                    </button>
                </div>
            </div>

            <div className="glass-panel rounded-3xl p-6">


                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredPengumuman.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-slate-500 bg-transparent rounded-2xl border-2 border-dashed border-emerald-500/20">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
                                        <Search className="h-6 w-6" />
                                    </div>
                                    <p className="font-medium text-slate-400">Tidak ada pengumuman ditemukan.</p>
                                </div>
                            </div>
                        ) : (
                            filteredPengumuman.map((p) => (
                                <div key={p.id} className="relative flex flex-col p-6 rounded-2xl bg-white dark:bg-[#020c08]/40 border border-emerald-500/10 hover:border-emerald-500/30 hover:bg-slate-50 dark:hover:bg-[#020c08]/60 transition-all group shadow-sm">
                                    <div className="absolute top-3 right-3 flex gap-1 opacity-100 transition-opacity bg-white/80 dark:bg-black/50 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none p-1 sm:p-0 rounded-xl">
                                        <button onClick={() => openEditModal(p)} title="Edit Pengumuman" className="p-1.5 rounded-lg text-emerald-600 sm:text-emerald-400 hover:bg-emerald-500/10 transition-colors"><Edit2 className="h-4 w-4" /></button>
                                        <button onClick={() => handleDelete(p.id, p.judul)} title="Hapus Pengumuman" className="p-1.5 rounded-lg text-red-600 sm:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-emerald-500 mb-1">
                                        <Megaphone className="h-5 w-5" />
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight pr-16">{p.judul}</h3>
                                    </div>
                                    <div className="mb-3">
                                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${p.target === 'guru' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : p.target === 'wali_siswa' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                                            Target: {p.target === 'guru' ? 'Guru' : p.target === 'wali_siswa' ? 'Wali Siswa' : 'Semua'}
                                        </span>
                                    </div>
                                    
                                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 whitespace-pre-line line-clamp-3">
                                        {p.isi_pengumuman}
                                    </p>
                                    
                                    <div className="mt-auto pt-4 border-t border-slate-200 dark:border-emerald-500/10 flex items-center gap-2 text-xs font-semibold text-slate-500">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {new Date(p.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Modal Tambah/Edit */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-lg glass-panel rounded-3xl p-6 overflow-hidden bg-white dark:bg-[#041610] text-slate-800 dark:text-white border border-slate-200 dark:border-emerald-500/10">
                        <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                            <X className="h-6 w-6" />
                        </button>

                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Megaphone className="h-5 w-5 text-emerald-500" />
                            {modalMode === 'add' ? 'Buat Pengumuman Baru' : 'Edit Pengumuman'}
                        </h2>

                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            {formError && (
                                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-300 text-xs font-semibold">
                                    {formError}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Judul Pengumuman</label>
                                <input
                                    type="text"
                                    value={judul}
                                    onChange={(e) => setJudul(e.target.value)}
                                    required
                                    placeholder="Contoh: Jadwal Ujian Tengah Semester"
                                    className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm"
                                />
                            </div>



                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Ditujukan Kepada (Target)</label>
                                <select
                                    value={target}
                                    onChange={(e) => setTarget(e.target.value)}
                                    required
                                    className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm cursor-pointer"
                                >
                                    <option value="semua">Semua (Wali Siswa & Guru)</option>
                                    <option value="guru">Khusus Guru</option>
                                    <option value="wali_siswa">Khusus Wali Siswa</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Isi Pengumuman</label>
                                <textarea
                                    value={isiPengumuman}
                                    onChange={(e) => setIsiPengumuman(e.target.value)}
                                    required
                                    rows="5"
                                    placeholder="Tulis detail pengumuman di sini..."
                                    className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm resize-none"
                                ></textarea>
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
