"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Search, Edit2, Trash2, X, Check, CheckCircle, ShieldAlert, User, Plus, GraduationCap } from 'lucide-react';
import { toTitleCase } from '@/utils/textFormatter';
import { useLongPress } from '@/hooks/useLongPress';

export default function AdminGuruPage() {
    const { token, user: currentUser, refreshUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [kelasOptions, setKelasOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modals
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);

    const bindLongPress = useLongPress(
        (e, id) => {
            if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) return;
            if (selectedIds.length === 0) {
                handleSelectRow(id);
            }
        },
        (e, id) => {
            if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) return;
            if (selectedIds.length > 0) {
                handleSelectRow(id);
            }
        },
        { delay: 1000, shouldPreventDefault: false }
    );

    // Form fields
    const [namaLengkap, setNamaLengkap] = useState('');
    const [noHp, setNoHp] = useState('');
    const [nip, setNip] = useState('');
    const [jenisKelamin, setJenisKelamin] = useState('');
    const [statusAktif, setStatusAktif] = useState('aktif');
    const [kelasDiajar, setKelasDiajar] = useState([]);
    const [kelasWali, setKelasWali] = useState('');
    const [password, setPassword] = useState('');
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const API_URL = '/api';

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API_URL}/auth/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                // Filter only Guru
                setUsers(data.filter(u => u.role === 'guru'));
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchKelas = async () => {
        try {
            const res = await fetch(`${API_URL}/kelas`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setKelasOptions(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Error fetching kelas:', err);
        }
    };

    useEffect(() => {
        if (token) {
            const init = async () => {
                await Promise.all([fetchUsers(), fetchKelas()]);
                setLoading(false);
            };
            init();
        }
    }, [token]);

    const openAddModal = () => {
        setNamaLengkap('');
        setNoHp('');
        setNip('');
        setJenisKelamin('');
        setStatusAktif('aktif');
        setKelasDiajar([]);
        setKelasWali('');
        setPassword('');
        setFormError('');
        setFormSuccess('');
        setAddModalOpen(true);
    };

    const openEditModal = (u) => {
        setSelectedUser(u);
        setNamaLengkap(u.nama_lengkap);
        setNoHp(u.no_hp || '');
        setNip(u.nip || '');
        setJenisKelamin(u.jenis_kelamin || '');
        setStatusAktif(u.status_aktif || 'aktif');
        setKelasDiajar(u.kelas_diajar ? u.kelas_diajar.split(',') : []);
        setKelasWali(u.kelas_wali || '');
        setPassword('');
        setFormError('');
        setFormSuccess('');
        setEditModalOpen(true);
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!nip || !namaLengkap || !noHp) {
            setFormError('NIP, Nama lengkap, dan No. HP wajib diisi.');
            return;
        }
        setFormError('');
        setFormSuccess('');
        setIsSubmitting(true);

        const payload = {
            username: nip,
            nama_lengkap: namaLengkap,
            no_hp: noHp,
            nip: nip,
            jenis_kelamin: jenisKelamin,
            status_aktif: statusAktif,
            kelas_diajar: kelasDiajar,
            kelas_wali: kelasWali,
            password: password || 'password123',
            role: 'guru'
        };

        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Gagal menambahkan guru.');
            }

            fetchUsers();
            setAddModalOpen(false);
            setFormSuccess('Akun guru berhasil ditambahkan!');
            setTimeout(() => {
                setFormSuccess('');
            }, 3000);
        } catch (err) {
            setFormError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormSuccess('');
        setIsSubmitting(true);

        const payload = {
            username: nip,
            nama_lengkap: namaLengkap,
            no_hp: noHp,
            nip: nip,
            jenis_kelamin: jenisKelamin,
            status_aktif: statusAktif,
            kelas_diajar: kelasDiajar,
            kelas_wali: kelasWali,
            ...(password ? { password: password } : {})
        };

        try {
            const res = await fetch(`${API_URL}/auth/users/${selectedUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Gagal memperbarui pengguna.');
            }

            fetchUsers();
            if (selectedUser.id === currentUser?.id) {
                await refreshUser();
            }
            setEditModalOpen(false);
            setFormSuccess('Profil guru berhasil diperbarui!');
            setTimeout(() => {
                setFormSuccess('');
            }, 3000);
        } catch (err) {
            setFormError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Apakah Anda yakin ingin menghapus guru ini?')) return;
        try {
            const res = await fetch(`${API_URL}/auth/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchUsers();
                setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
            } else {
                const data = await res.json();
                alert(data.message || 'Gagal menghapus pengguna.');
            }
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan saat menghapus pengguna.');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} guru yang dipilih?`)) return;
        try {
            await Promise.all(
                selectedIds.map(id =>
                    fetch(`${API_URL}/auth/users/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                )
            );
            fetchUsers();
            setSelectedIds([]);
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan saat menghapus data massal.');
        }
    };

    const activeUsers = users.filter(u => {
        const status = (u.status_aktif || 'aktif').toLowerCase();
        return status !== 'lulus' && status !== 'keluar';
    });

    const filteredUsers = activeUsers.filter(u => 
        u.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.no_hp && u.no_hp.includes(searchQuery)) ||
        (u.kelas_diajar && u.kelas_diajar.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredUsers.map(u => u.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

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
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">Data Guru</h1>
                    <p className="text-slate-400 text-sm">Kelola akun guru SMP Ma'had Darul Ikhlas.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari guru (Nama/No.HP/Kelas)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#020c08]/50 py-2 sm:py-2.5 pl-9 pr-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 py-2 sm:py-2.5 px-4 text-sm font-semibold text-white transition-colors shrink-0 w-full sm:w-auto shadow-lg shadow-red-500/30"
                        >
                            <Trash2 className="h-4 w-4" />
                            Hapus Terpilih ({selectedIds.length})
                        </button>
                    )}
                    <button
                        onClick={openAddModal}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 sm:py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all active:scale-95 shrink-0 w-full sm:w-auto text-sm"
                    >
                        <Plus className="h-4 w-4" />
                        Tambah Guru
                    </button>
                </div>
            </div>

            <div className="glass-panel rounded-3xl p-4 sm:p-6">
                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto bg-white dark:bg-[#020c08]/50 rounded-xl border border-slate-200 dark:border-emerald-500/10">
                        <table className="w-full text-left text-xs whitespace-nowrap min-w-max border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-[#061e16]">
                                    {selectedIds.length > 0 && (
                                        <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center static md:sticky md:left-0 md:z-40 bg-slate-50 dark:bg-[#061e16]">
                                            <input 
                                                type="checkbox" 
                                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                checked={selectedIds.length === filteredUsers.length && filteredUsers.length > 0}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                    )}
                                    <th className={`py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center static md:sticky ${selectedIds.length > 0 ? 'md:left-8' : 'md:left-0'} md:z-30 bg-slate-50 dark:bg-[#061e16] text-slate-800 dark:text-slate-300 font-extrabold uppercase`}>No</th>
                                    <th className={`py-2 px-3 border-b border-r border-slate-400 dark:border-emerald-500/30 text-center static md:sticky ${selectedIds.length > 0 ? 'md:left-16' : 'md:left-8'} md:z-30 bg-slate-50 dark:bg-[#061e16] shadow-[4px_0_12px_rgba(0,0,0,0.03)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.2)] text-slate-800 dark:text-slate-300 font-extrabold uppercase max-w-[200px]`}>Nama Lengkap</th>
                                    <th className="py-2 px-3 border-b border-r-[3px] border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16] w-40 min-w-[160px]">NIP</th>
                                    <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">L/P</th>
                                    <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">No. HP</th>
                                    <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Status</th>
                                    <th className="py-2 px-2 border-b border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={selectedIds.length > 0 ? "8" : "7"} className="text-center py-8 text-slate-500 bg-white dark:bg-[#041610] border-b border-slate-300 dark:border-emerald-500/10">
                                            Tidak ada data guru ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((u, idx) => (
                                        <tr 
                                            key={u.id} 
                                            {...bindLongPress(u.id)}
                                            className={`transition-colors group cursor-pointer select-none ${selectedIds.includes(u.id) ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'hover:bg-slate-50 dark:hover:bg-[#082a1f]'}`}
                                        >
                                            {selectedIds.length > 0 && (
                                                <td className={`py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center static md:sticky md:left-0 md:z-20 ${selectedIds.includes(u.id) ? 'bg-emerald-50 dark:bg-[#06241a]' : 'bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]'}`} onClick={(e) => e.stopPropagation()}>
                                                    <input 
                                                        type="checkbox" 
                                                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                        checked={selectedIds.includes(u.id)}
                                                        onChange={() => handleSelectRow(u.id)}
                                                    />
                                                </td>
                                            )}
                                            <td className={`py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 font-semibold text-slate-500 text-center static md:sticky ${selectedIds.length > 0 ? 'md:left-8' : 'md:left-0'} md:z-20 ${selectedIds.includes(u.id) ? 'bg-emerald-50 dark:bg-[#06241a]' : 'bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]'}`}>{idx + 1}</td>
                                            <td className={`py-1.5 px-3 border-b border-r border-slate-400 dark:border-emerald-500/30 font-extrabold text-slate-850 dark:text-white text-left static md:sticky ${selectedIds.length > 0 ? 'md:left-16' : 'md:left-8'} md:z-20 drop-shadow-md ${selectedIds.includes(u.id) ? 'bg-emerald-50 dark:bg-[#06241a]' : 'bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]'} max-w-[200px] truncate`} title={u.nama_lengkap}>{u.nama_lengkap}</td>
                                            <td className={`py-1.5 px-3 border-b border-r-[3px] border-slate-300 dark:border-emerald-500/10 font-medium text-slate-600 dark:text-slate-300 text-center ${selectedIds.includes(u.id) ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]'}`}>{u.nip || '-'}</td>
                                            <td className={`py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center font-medium text-slate-600 dark:text-slate-300 ${selectedIds.includes(u.id) ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]'}`}>
                                                {u.jenis_kelamin === 'L' ? 'Laki-laki' : u.jenis_kelamin === 'P' ? 'Perempuan' : '-'}
                                            </td>
                                            <td className={`py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap ${selectedIds.includes(u.id) ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]'}`}>{u.no_hp || '-'}</td>
                                            <td className={`py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center ${selectedIds.includes(u.id) ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]'}`}>
                                                <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-extrabold rounded-lg border ${u.status_aktif === 'aktif' ? 'bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-red-100 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'}`}>
                                                    {u.status_aktif === 'aktif' ? 'Aktif' : 'Non-aktif'}
                                                </span>
                                            </td>
                                            <td className={`py-1.5 px-2 border-b border-slate-300 dark:border-emerald-500/10 text-center ${selectedIds.includes(u.id) ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]'}`}>
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); openEditModal(u); }}
                                                        className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/20 transition-colors border border-emerald-200 dark:border-emerald-500/20"
                                                        title="Edit Guru"
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(u.id); }}
                                                        className="p-1.5 rounded-lg bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/20 transition-colors border border-red-200 dark:border-red-500/20"
                                                        title="Hapus Guru"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
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

            {(addModalOpen || editModalOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
                    <div className="relative w-full max-w-2xl glass-panel rounded-3xl p-6 overflow-hidden bg-white dark:bg-[#041610] text-slate-800 dark:text-white border border-slate-200 dark:border-emerald-500/10 my-8">
                        <button onClick={() => { setAddModalOpen(false); setEditModalOpen(false); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                            <X className="h-6 w-6" />
                        </button>

                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            {addModalOpen ? <GraduationCap className="h-5 w-5 text-emerald-500" /> : <User className="h-5 w-5 text-emerald-500" />}
                            {addModalOpen ? 'Tambah Guru Baru' : 'Edit Data Guru'}
                        </h2>

                        <form onSubmit={addModalOpen ? handleAddSubmit : handleEditSubmit} className="space-y-4" autoComplete="off">
                            {formError && (
                                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-300 text-xs font-semibold">
                                    {formError}
                                </div>
                            )}


                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-emerald-400 uppercase tracking-wider mb-1">NIP / ID Guru</label>
                                    <input
                                        type="text"
                                        required
                                        value={nip}
                                        onChange={(e) => setNip(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm"
                                        placeholder="Contoh: 198001012005011001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        required
                                        value={namaLengkap}
                                        onChange={(e) => setNamaLengkap(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm"
                                        placeholder="Nama Lengkap beserta gelar"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Jenis Kelamin</label>
                                    <select
                                        value={jenisKelamin}
                                        onChange={(e) => setJenisKelamin(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm"
                                    >
                                        <option value="">Pilih...</option>
                                        <option value="L">Laki-laki</option>
                                        <option value="P">Perempuan</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-emerald-400 uppercase tracking-wider mb-1">No. HP (WhatsApp)</label>
                                    <input
                                        type="text"
                                        required
                                        value={noHp}
                                        onChange={(e) => setNoHp(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm"
                                        placeholder="Contoh: 0812345678"
                                    />
                                </div>
                            </div>

                                <div className="mb-4">
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Status Keaktifan</label>
                                    <select
                                        value={statusAktif}
                                        onChange={(e) => setStatusAktif(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm"
                                    >
                                        <option value="aktif">Aktif</option>
                                        <option value="keluar">Keluar (Resign / Pindah)</option>
                                        <option value="non-aktif">Non-aktif (Pensiun / Cuti)</option>
                                    </select>
                                </div>



                            <div className="pt-2 border-t border-slate-150 dark:border-emerald-500/5">
                                <label className="block text-xs font-semibold text-slate-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                                    {addModalOpen ? 'PASSWORD DEFAULT: PASSWORD123' : 'Setel Password Baru (Opsional)'}
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm"
                                    placeholder={addModalOpen ? "password123" : "Kosongkan jika tidak ingin diubah"}
                                    autoComplete="new-password"
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setAddModalOpen(false); setEditModalOpen(false); }}
                                    className="rounded-xl border border-slate-250 dark:border-emerald-500/20 py-2.5 px-4 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#061e16] transition-all cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 py-2.5 px-6 text-sm font-semibold text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {isSubmitting && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>}
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
