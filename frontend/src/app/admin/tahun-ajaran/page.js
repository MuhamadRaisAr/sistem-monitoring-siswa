"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Plus, Edit2, Trash2, CheckCircle, X, Check, Calendar, AlertCircle, XCircle, Search } from 'lucide-react';

export default function AdminTahunAjaranPage() {
    const { token } = useAuth();
    const [tahunAjaran, setTahunAjaran] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modals
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [pageSuccess, setPageSuccess] = useState('');

    // Form fields
    const [tahun, setTahun] = useState('');
    const [semester, setSemester] = useState('Ganjil');
    const [statusAktif, setStatusAktif] = useState(0);
    const [isCopyJadwal, setIsCopyJadwal] = useState(false);
    const [copyFromId, setCopyFromId] = useState('');

    const API_URL = '/api/tahun-ajaran';

    const fetchTahunAjaran = async () => {
        try {
            setLoading(true);
            const res = await fetch(API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setTahunAjaran(data);
            }
        } catch (err) {
            console.error('Error fetching tahun ajaran:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchTahunAjaran();
        }
    }, [token]);

    const openAddModal = () => {
        setSelectedItem(null);
        setTahun('');
        setSemester('Ganjil');
        setStatusAktif(0);
        setIsCopyJadwal(false);
        setCopyFromId('');
        setFormError('');
        setPageSuccess('');
        setModalOpen(true);
    };

    const openEditModal = (item) => {
        setSelectedItem(item);
        setTahun(item.nama_tahun || item.tahun || '');
        setSemester(item.semester || 'Ganjil');
        setStatusAktif(item.is_active || item.status_aktif || 0);
        setIsCopyJadwal(false);
        setCopyFromId(''); // Reset when opening edit, user explicitly selects if they want to copy during edit
        setFormError('');
        setPageSuccess('');
        setModalOpen(true);
    };

    const openDeleteModal = (item) => {
        setSelectedItem(item);
        setFormError('');
        setDeleteModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setPageSuccess('');
        setIsSubmitting(true);

        const payload = {
            nama_tahun: tahun,
            semester,
            set_active: statusAktif,
            copy_from_id: isCopyJadwal && copyFromId ? parseInt(copyFromId) : null
        };

        const url = selectedItem ? `${API_URL}/${selectedItem.id}` : API_URL;
        const method = selectedItem ? 'PUT' : 'POST';

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

            if (!res.ok) {
                throw new Error(data.message || 'Terjadi kesalahan.');
            }

            setPageSuccess(selectedItem ? 'Data berhasil diperbarui!' : 'Data berhasil ditambahkan!');
            fetchTahunAjaran();
            setModalOpen(false);
            
            setTimeout(() => setPageSuccess(''), 3000);
        } catch (err) {
            setFormError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsSubmitting(true);
        setFormError('');

        try {
            const res = await fetch(`${API_URL}/${selectedItem.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Gagal menghapus data.');
            }

            fetchTahunAjaran();
            setDeleteModalOpen(false);
        } catch (err) {
            setFormError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSetActive = async (id) => {
        try {
            const res = await fetch(`${API_URL}/${id}/active`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (res.ok) {
                fetchTahunAjaran();
            } else {
                const data = await res.json();
                alert(data.message || 'Gagal mengaktifkan tahun ajaran.');
            }
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan saat mengaktifkan tahun ajaran.');
        }
    };

    const filteredTahunAjaran = tahunAjaran.filter(item => {
        const query = searchQuery.toLowerCase();
        const namaTahun = (item.nama_tahun || item.tahun || '').toLowerCase();
        const smt = (item.semester || '').toLowerCase();
        return namaTahun.includes(query) || smt.includes(query);
    });

    const availableTahunAjaran = tahunAjaran.filter(ta => ta.id !== selectedItem?.id);

    return (
        <div className="space-y-6 w-full min-w-0">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Tahun Ajaran</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Kelola daftar tahun ajaran dan semester aktif.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari tahun ajaran..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#020c08]/50 py-2 sm:py-2.5 pl-9 pr-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 sm:py-2.5 text-sm font-semibold text-white transition-all shadow-md whitespace-nowrap shrink-0 cursor-pointer w-full sm:w-auto justify-center"
                    >
                        <Plus className="h-4 w-4" />
                        Tambah Tahun Ajaran
                    </button>
                </div>
            </div>

            {/* Page Success Notification */}
            {pageSuccess && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 bg-white text-slate-700 rounded-xl shadow-xl animate-fade-in flex items-center gap-3 font-semibold border border-slate-200 w-max max-w-[90vw]">
                    <CheckCircle className="h-5 w-5 text-slate-500 shrink-0" />
                    <span className="whitespace-nowrap">{pageSuccess}</span>
                </div>
            )}

            {/* Table Box */}
            <div className="w-full min-w-0 animate-fade-in">
                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                    </div>
                ) : (
                    <div className="w-full min-w-0 overflow-x-auto bg-white dark:bg-[#020c08]/50 rounded-xl border border-slate-200 dark:border-emerald-500/10 shadow-sm">
                        <table className="w-full text-center text-sm whitespace-nowrap min-w-max border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-[#061e16]">
                                    <th className="py-2 px-3 w-[35%] border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[10px] align-middle">Tahun</th>
                                    <th className="py-2 px-3 w-[25%] border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[10px] align-middle">Semester</th>
                                    <th className="py-2 px-3 w-[25%] border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[10px] align-middle">Status Aktif</th>
                                    <th className="py-2 px-3 w-[15%] border-b border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[10px] align-middle">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTahunAjaran.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-8 text-slate-500 bg-white dark:bg-[#041610] border-b border-slate-300 dark:border-emerald-500/10">
                                            {searchQuery ? 'Tidak ada data tahun ajaran ditemukan.' : 'Tidak ada data tahun ajaran.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTahunAjaran.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-[#082a1f] transition-colors group cursor-pointer">
                                            <td className="py-1.5 px-3 border-b border-r border-slate-300 dark:border-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400 text-center text-[11px] bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f] transition-colors">
                                                {item.nama_tahun || item.tahun}
                                            </td>
                                            <td className="py-1.5 px-3 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f] transition-colors">
                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                                    item.semester === 'Ganjil' 
                                                    ? 'bg-amber-100 text-amber-600 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' 
                                                    : 'bg-blue-100 text-blue-600 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                                                }`}>
                                                    {item.semester}
                                                </span>
                                            </td>
                                            <td className="py-1.5 px-3 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f] transition-colors">
                                                {(item.is_active || item.status_aktif) === 1 ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[9px] bg-emerald-100 dark:bg-emerald-500/10 px-1.5 py-0.5 border border-emerald-200 dark:border-emerald-500/20 rounded">
                                                        <CheckCircle className="w-2.5 h-2.5" />
                                                        Aktif
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 font-bold text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded">
                                                        <XCircle className="w-2.5 h-2.5" />
                                                        Tidak Aktif
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-1.5 px-3 border-b border-slate-300 dark:border-emerald-500/10 text-center bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f] transition-colors">
                                                <div className="flex justify-center gap-1.5">
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        className="p-1 rounded bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/20 transition-colors border border-emerald-200 dark:border-emerald-500/20"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="h-3 w-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteModal(item)}
                                                        className="p-1 rounded bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/20 transition-colors border border-red-200 dark:border-red-500/20"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
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

                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-emerald-500" />
                            {selectedItem ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {formError && (
                                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-300 text-xs font-semibold">
                                    {formError}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Tahun Ajaran</label>
                                <input
                                    type="text"
                                    required
                                    value={tahun}
                                    onChange={(e) => setTahun(e.target.value)}
                                    placeholder="Contoh: 2023/2024"
                                    className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Semester</label>
                                <select
                                    value={semester}
                                    onChange={(e) => setSemester(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm cursor-pointer"
                                >
                                    <option value="Ganjil">Ganjil</option>
                                    <option value="Genap">Genap</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Status</label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={statusAktif === 1 || statusAktif === true} 
                                        onChange={(e) => setStatusAktif(e.target.checked ? 1 : 0)}
                                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                                    />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Set sebagai Tahun Ajaran Aktif</span>
                                </label>
                            </div>

                            <div className="border-t border-slate-100 dark:border-emerald-500/10 pt-4 mt-2">
                                <label className="flex items-center gap-2 cursor-pointer mb-3">
                                    <input 
                                        type="checkbox" 
                                        checked={isCopyJadwal} 
                                        onChange={(e) => {
                                            setIsCopyJadwal(e.target.checked);
                                            if (!e.target.checked) {
                                                setCopyFromId('');
                                            } else if (availableTahunAjaran.length === 1) {
                                                setCopyFromId(availableTahunAjaran[0].id.toString());
                                            }
                                        }}
                                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                                    />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Copy jadwal pelajaran dari tahun ajaran lain (Opsional)</span>
                                </label>

                                {isCopyJadwal && availableTahunAjaran.length > 0 && (
                                    <div className="pl-6 animate-fade-in">
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                                            {availableTahunAjaran.length === 1 ? 'Tahun Ajaran yang Disalin' : 'Pilih Tahun Ajaran'}
                                        </label>
                                        
                                        {availableTahunAjaran.length === 1 ? (
                                            <div className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 text-sm font-semibold">
                                                {availableTahunAjaran[0].nama_tahun} Semester {availableTahunAjaran[0].semester}
                                            </div>
                                        ) : (
                                            <select
                                                value={copyFromId}
                                                onChange={(e) => setCopyFromId(e.target.value)}
                                                className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm cursor-pointer"
                                                required={isCopyJadwal}
                                            >
                                                <option value="" disabled>-- Pilih Tahun Ajaran --</option>
                                                {availableTahunAjaran.map(ta => (
                                                    <option key={ta.id} value={ta.id}>
                                                        {ta.nama_tahun} Semester {ta.semester}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                        <p className="text-[10px] text-slate-500 mt-1.5">
                                            Fitur ini akan menyalin seluruh jadwal pelajaran dari tahun ajaran yang dipilih ke tahun ajaran ini.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-emerald-500/10 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="rounded-xl border border-slate-250 dark:border-emerald-500/20 py-2.5 px-4 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#061e16] transition-all cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 py-2.5 px-6 text-sm font-semibold text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {isSubmitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div> : <Check className="h-4 w-4" />}
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Hapus */}
            {deleteModalOpen && selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-sm glass-panel rounded-3xl p-6 overflow-hidden bg-white dark:bg-[#041610] text-slate-800 dark:text-white border border-slate-200 dark:border-emerald-500/10 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 mb-4 animate-pulse">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-bold mb-2">Hapus Tahun Ajaran?</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                            Anda yakin ingin menghapus tahun ajaran <span className="font-bold text-red-500">{selectedItem.nama_tahun || selectedItem.tahun} Semester {selectedItem.semester}</span>? 
                            <br />Data yang terkait mungkin tidak dapat diakses lagi.
                        </p>

                        {formError && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-300 text-xs font-semibold">
                                {formError}
                            </div>
                        )}

                        <div className="flex justify-center gap-3">
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => setDeleteModalOpen(false)}
                                className="rounded-xl border border-slate-200 dark:border-emerald-500/20 py-2 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#061e16] transition-all cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={handleDelete}
                                className="rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-red-800 py-2 px-6 text-xs font-semibold text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {isSubmitting && <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>}
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
