"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Search, Edit2, Key, X, Check, CheckCircle, ShieldAlert, User, Phone, ShieldCheck, UserPlus, Plus } from 'lucide-react';

export default function AdminUsersPage() {
    const { token, user: currentUser, refreshUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('Semua');
    const [globalSuccess, setGlobalSuccess] = useState('');

    // Modals
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [resetModalOpen, setResetModalOpen] = useState(false);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Form fields for Add User
    const [addRole, setAddRole] = useState('bendahara');
    const [addUsername, setAddUsername] = useState('');
    const [addNamaLengkap, setAddNamaLengkap] = useState('');
    const [addNoHp, setAddNoHp] = useState('');
    const [addPassword, setAddPassword] = useState('');
    const [addFormError, setAddFormError] = useState('');
    const [addFormSuccess, setAddFormSuccess] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // Form fields for Edit User
    const [username, setUsername] = useState('');
    const [namaLengkap, setNamaLengkap] = useState('');
    const [noHp, setNoHp] = useState('');
    const [customPassword, setCustomPassword] = useState('');
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form fields for Reset Password
    const [isResetting, setIsResetting] = useState(false);
    const [resetSuccess, setResetSuccess] = useState('');

    const API_URL = '/api';

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/auth/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setUsers(data);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchUsers();
        }
    }, [token]);

    const openEditModal = (u) => {
        setSelectedUser(u);
        setUsername(u.username);
        setNamaLengkap(u.nama_lengkap);
        setNoHp(u.no_hp || '');
        setCustomPassword('');
        setFormError('');
        setFormSuccess('');
        setEditModalOpen(true);
    };

    const openResetModal = (u) => {
        setSelectedUser(u);
        setResetSuccess('');
        setResetModalOpen(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormSuccess('');
        setIsSubmitting(true);

        const payload = {
            username,
            nama_lengkap: namaLengkap,
            no_hp: noHp,
            ...(customPassword ? { password: customPassword } : {})
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

            setEditModalOpen(false);
            setGlobalSuccess(customPassword 
                ? 'Profil dan password pengguna berhasil diperbarui!' 
                : 'Profil pengguna berhasil diperbarui!'
            );
            fetchUsers();
            if (selectedUser.id === currentUser?.id) {
                await refreshUser();
            }
            setTimeout(() => setGlobalSuccess(''), 3000);
        } catch (err) {
            setFormError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setAddFormError('');
        setAddFormSuccess('');
        setIsAdding(true);

        const payload = {
            username: addUsername,
            nama_lengkap: addNamaLengkap,
            no_hp: addNoHp,
            password: addPassword,
            role: addRole
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
                throw new Error(data.message || 'Gagal menambahkan pengguna.');
            }

            setAddModalOpen(false);
            setGlobalSuccess('Pengguna berhasil ditambahkan!');
            fetchUsers();
            
            setAddUsername('');
            setAddNamaLengkap('');
            setAddNoHp('');
            setAddPassword('');
            
            setTimeout(() => setGlobalSuccess(''), 3000);
        } catch (err) {
            setAddFormError(err.message);
        } finally {
            setIsAdding(false);
        }
    };

    const handleResetPassword = async () => {
        setIsResetting(true);
        setResetSuccess('');

        try {
            const res = await fetch(`${API_URL}/auth/users/${selectedUser.id}/reset-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ newPassword: 'password123' })
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Gagal mereset password.');
            }

            setResetModalOpen(false);
            setGlobalSuccess('Password berhasil direset ke "password123"!');
            fetchUsers();
            setTimeout(() => setGlobalSuccess(''), 3000);
        } catch (err) {
            console.error(err);
        } finally {
            setIsResetting(false);
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.nama_siswa && u.nama_siswa.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (u.no_hp && u.no_hp.includes(searchQuery));
        
        const matchesRole = roleFilter === 'Semua' || u.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    return (
        <div className="space-y-6 w-full min-w-0 relative">
            {/* Global Toast Alerts (Auto dismiss) */}
            {globalSuccess && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 bg-white text-slate-700 rounded-xl shadow-xl animate-fade-in flex items-center gap-3 font-semibold border border-slate-200 w-max max-w-[90vw]">
                    <CheckCircle className="h-5 w-5 text-slate-500 shrink-0" />
                    <span className="whitespace-nowrap">{globalSuccess}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">Kelola Pengguna</h1>
                    <p className="text-slate-400 text-sm">Lihat akun terdaftar, perbarui data login, atau atur ulang password akun Wali Siswa, Guru, dan Admin.</p>
                </div>
                <button
                    onClick={() => {
                        setAddRole('admin');
                        setAddUsername('');
                        setAddNamaLengkap('');
                        setAddNoHp('');
                        setAddPassword('');
                        setAddFormError('');
                        setAddFormSuccess('');
                        setAddModalOpen(true);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-all shadow-md whitespace-nowrap shrink-0 cursor-pointer"
                >
                    <UserPlus className="h-4 w-4" />
                    Tambah Pengguna
                </button>
            </div>

            {/* Table Box */}
            <div className="glass-panel rounded-3xl p-4 sm:p-6 w-full min-w-0 overflow-hidden">
                {/* Search Bar & Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4 sm:mb-6 w-full min-w-0">
                    <div className="relative w-full sm:flex-1 min-w-0">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-5 w-5 text-slate-500" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari user berdasarkan Nama, Username (NIS), atau No. HP..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                        />
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                        {['Semua', 'admin', 'bendahara', 'guru_bk', 'guru', 'wali_siswa'].map(role => (
                            <button
                                key={role}
                                onClick={() => setRoleFilter(role)}
                                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                                    roleFilter === role 
                                        ? 'bg-emerald-100 text-emerald-600 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 shadow-sm' 
                                        : 'bg-white dark:bg-[#020c08]/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-emerald-500/5 hover:bg-slate-50 dark:hover:bg-emerald-500/10'
                                }`}
                            >
                                {role === 'Semua' ? 'Semua' : role === 'admin' ? 'Admin' : role === 'bendahara' ? 'Bendahara' : role === 'guru_bk' ? 'Guru BK' : role === 'guru' ? 'Guru' : 'Wali Siswa'}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                    </div>
                ) : (
                    <div className="w-full max-w-full overflow-x-auto bg-white dark:bg-[#020c08]/50 rounded-xl border border-slate-200 dark:border-emerald-500/10">
                        <table className="w-full text-left text-xs whitespace-nowrap min-w-max border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-[#061e16]">
                                    <th className="py-2 px-3 border-b border-r-[3px] border-slate-400 dark:border-emerald-500/30 text-slate-800 dark:text-slate-300 font-extrabold align-middle static md:sticky md:left-0 md:z-30 bg-slate-50 dark:bg-[#061e16] shadow-[4px_0_12px_rgba(0,0,0,0.03)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.2)]">Nama Pengguna</th>
                                    <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-slate-800 dark:text-slate-300 font-extrabold align-middle bg-slate-50 dark:bg-[#061e16]">Username</th>
                                    <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-slate-800 dark:text-slate-300 font-extrabold align-middle bg-slate-50 dark:bg-[#061e16]">Nama Siswa</th>
                                    <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-slate-800 dark:text-slate-300 font-extrabold align-middle bg-slate-50 dark:bg-[#061e16]">Peran / Role</th>
                                    <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-slate-800 dark:text-slate-300 font-extrabold align-middle bg-slate-50 dark:bg-[#061e16]">No. HP</th>
                                    <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-slate-800 dark:text-slate-300 font-extrabold align-middle bg-slate-50 dark:bg-[#061e16]">Tanggal Dibuat</th>
                                    <th className="py-2 px-2 border-b border-slate-300 dark:border-emerald-500/10 text-right text-slate-800 dark:text-slate-300 font-extrabold align-middle bg-slate-50 dark:bg-[#061e16]">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-8 text-slate-500 bg-white dark:bg-[#041610] border-b border-slate-300 dark:border-emerald-500/10">
                                            Tidak ada pengguna ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((u) => {
                                        const isSelf = u.id === currentUser?.id;
                                        return (
                                            <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-[#082a1f] transition-colors group">
                                                <td className="py-1.5 px-3 border-b border-r-[3px] border-slate-400 dark:border-emerald-500/30 font-extrabold text-slate-850 dark:text-white static md:sticky md:left-0 md:z-20 bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f] transition-colors drop-shadow-md">
                                                    {u.nama_lengkap}
                                                    {isSelf && (
                                                        <span className="ml-2 inline-flex items-center rounded-md bg-emerald-100 dark:bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 ring-1 ring-inset ring-emerald-200 dark:ring-emerald-500/20">
                                                            Anda
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f] transition-colors">
                                                    <span className="inline-flex items-center font-mono text-xs bg-slate-100 dark:bg-emerald-900/30 text-slate-700 dark:text-emerald-300 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-emerald-500/20">
                                                        {u.username}
                                                    </span>
                                                </td>
                                                <td className="py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f] transition-colors">
                                                    {u.role === 'wali_siswa' ? (u.nama_siswa || <span className="text-slate-400 dark:text-slate-500 italic">Belum diset</span>) : <span className="text-slate-300 dark:text-slate-600">-</span>}
                                                </td>
                                                <td className="py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f] transition-colors">
                                                    <span className={`inline-flex rounded-lg px-2 py-0.5 text-[10px] font-bold leading-none uppercase border
                                                        ${u.role === 'admin' 
                                                            ? 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' 
                                                            : u.role === 'bendahara'
                                                            ? 'bg-purple-100 text-purple-600 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20'
                                                            : u.role === 'guru_bk'
                                                            ? 'bg-pink-100 text-pink-600 border-pink-200 dark:bg-pink-500/10 dark:text-pink-400 dark:border-pink-500/20'
                                                            : u.role === 'guru'
                                                            ? 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                                                            : 'bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                                        }
                                                    `}>
                                                        {u.role === 'admin' ? 'Admin' : u.role === 'bendahara' ? 'Bendahara' : u.role === 'guru_bk' ? 'Guru BK' : u.role === 'guru' ? 'Guru' : 'Wali Siswa'}
                                                    </span>
                                                </td>
                                                <td className="py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-slate-600 dark:text-slate-300 bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f] transition-colors">
                                                    {u.no_hp || <span className="text-slate-400 dark:text-slate-600 italic">Tidak ada</span>}
                                                </td>
                                                <td className="py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-slate-500 dark:text-slate-400 bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f] transition-colors">
                                                    {new Date(u.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </td>
                                                <td className="py-1.5 px-2 border-b border-slate-300 dark:border-emerald-500/10 text-right bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f] transition-colors">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => openEditModal(u)}
                                                            title="Edit Detail / Atur Password"
                                                            className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/20 transition-colors border border-emerald-200 dark:border-emerald-500/20 cursor-pointer"
                                                        >
                                                            <Edit2 className="h-3 w-3" />
                                                        </button>
                                                        {!isSelf && (
                                                            <button
                                                                onClick={() => openResetModal(u)}
                                                                title="Reset Password ke Default"
                                                                className="p-1 rounded-lg bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-500/20 transition-colors border border-amber-200 dark:border-amber-500/20 cursor-pointer"
                                                            >
                                                                <Key className="h-3 w-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit User Modal */}
            {editModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 overflow-hidden bg-white dark:bg-[#041610] text-slate-800 dark:text-white border border-slate-200 dark:border-emerald-500/10">
                        <button onClick={() => setEditModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                            <X className="h-6 w-6" />
                        </button>

                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <User className="h-5 w-5 text-emerald-500" />
                            Edit Pengguna
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Perbarui profil atau setel password baru untuk <span className="font-bold text-emerald-500">{selectedUser.nama_lengkap}</span>.</p>

                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            {/* Hack to prevent browser autofill */}
                            <input type="text" style={{display: 'none'}} autoComplete="username" />
                            <input type="password" style={{display: 'none'}} autoComplete="current-password" />
                            
                            {formError && (
                                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-300 text-xs font-semibold">
                                    {formError}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Username</label>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    autoComplete="off"
                                    className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm font-mono"
                                    placeholder={selectedUser.role === 'guru' ? 'Isi dengan NIP guru' : selectedUser.role === 'wali_siswa' ? 'Isi dengan NIS siswa' : 'Username'}
                                />
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                                    {selectedUser.role === 'guru' && 'ℹ️ Gunakan NIP sebagai username agar mudah diingat.'}
                                    {selectedUser.role === 'wali_siswa' && 'ℹ️ Gunakan NIS siswa sebagai username.'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    required
                                    value={namaLengkap}
                                    onChange={(e) => setNamaLengkap(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm"
                                    placeholder="Nama Lengkap"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-emerald-400 uppercase tracking-wider mb-1">No. HP (WhatsApp)</label>
                                <input
                                    type="text"
                                    value={noHp}
                                    onChange={(e) => setNoHp(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm"
                                    placeholder="Contoh: 0812345678"
                                />
                            </div>

                            <div className="pt-2 border-t border-slate-150 dark:border-emerald-500/5">
                                <label className="block text-xs font-semibold text-slate-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Setel Password Baru (Opsional)</label>
                                <input
                                    type="password"
                                    value={customPassword}
                                    onChange={(e) => setCustomPassword(e.target.value)}
                                    autoComplete="new-password"
                                    className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm"
                                    placeholder="Kosongkan jika tidak ingin diubah"
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditModalOpen(false)}
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
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reset Password Confirmation Modal */}
            {resetModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-sm glass-panel rounded-3xl p-6 overflow-hidden bg-white dark:bg-[#041610] text-slate-800 dark:text-white border border-slate-200 dark:border-emerald-500/10 text-center">
                        <button onClick={() => setResetModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                            <X className="h-6 w-6" />
                        </button>

                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 mb-4 animate-pulse">
                            <ShieldAlert className="h-6 w-6" />
                        </div>

                        <h3 className="text-lg font-bold mb-2">Reset Password?</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                            Apakah Anda yakin ingin mengatur ulang password akun <span className="font-semibold text-amber-500">{selectedUser.nama_lengkap} (@{selectedUser.username})</span>?
                            <br />
                            <span className="block mt-2 font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#020c08]/50 p-2 rounded-xl border border-slate-100 dark:border-emerald-500/5">
                                Password akan diset kembali ke default: <span className="text-emerald-500">password123</span>
                            </span>
                        </p>

                        <div className="flex justify-center gap-3">
                            <button
                                type="button"
                                disabled={isResetting}
                                onClick={() => setResetModalOpen(false)}
                                className="rounded-xl border border-slate-200 dark:border-emerald-500/20 py-2 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#061e16] transition-all cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={isResetting}
                                onClick={handleResetPassword}
                                className="rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 py-2 px-6 text-xs font-semibold text-white transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                            >
                                {isResetting && <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent"></div>}
                                Ya, Reset Password
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Add User Modal */}
            {addModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 overflow-hidden bg-white dark:bg-[#041610] text-slate-800 dark:text-white border border-slate-200 dark:border-emerald-500/10 max-h-[90vh] overflow-y-auto hide-scrollbar">
                        <button onClick={() => setAddModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                            <X className="h-6 w-6" />
                        </button>

                        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-emerald-500" />
                            Tambah Pengguna Baru
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Buat akun baru untuk Bendahara, Admin, Guru, atau Wali Siswa.</p>

                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            {/* Hack to prevent browser autofill */}
                            <input type="text" style={{display: 'none'}} autoComplete="username" />
                            <input type="password" style={{display: 'none'}} autoComplete="new-password" />

                            {addFormError && (
                                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-300 text-xs font-semibold">
                                    {addFormError}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Peran / Role</label>
                                <select
                                    value={addRole}
                                    onChange={(e) => setAddRole(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm cursor-pointer"
                                >
                                    <option value="admin">Admin</option>
                                    <option value="bendahara">Bendahara</option>
                                    <option value="guru_bk">Guru BK</option>
                                    <option value="guru">Guru</option>
                                    <option value="wali_siswa">Wali Siswa</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Username</label>
                                <input
                                    type="text"
                                    required
                                    value={addUsername}
                                    onChange={(e) => setAddUsername(e.target.value)}
                                    autoComplete="off"
                                    className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm font-mono"
                                    placeholder={addRole === 'guru' ? 'NIP Guru' : addRole === 'wali_siswa' ? 'NIS Siswa' : 'Username'}
                                />
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                                    {addRole === 'guru' && 'ℹ️ Disarankan menggunakan NIP sebagai username.'}
                                    {addRole === 'wali_siswa' && 'ℹ️ Disarankan menggunakan NIS siswa.'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    required
                                    value={addNamaLengkap}
                                    onChange={(e) => setAddNamaLengkap(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm"
                                    placeholder="Nama Lengkap"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-emerald-400 uppercase tracking-wider mb-1">No. HP (WhatsApp)</label>
                                <input
                                    type="text"
                                    value={addNoHp}
                                    onChange={(e) => setAddNoHp(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm"
                                    placeholder="Contoh: 0812345678"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    value={addPassword}
                                    onChange={(e) => setAddPassword(e.target.value)}
                                    autoComplete="new-password"
                                    className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm"
                                    placeholder="Buat Password"
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3 pb-2 mt-4 border-t border-slate-100 dark:border-emerald-500/10">
                                <button
                                    type="button"
                                    onClick={() => setAddModalOpen(false)}
                                    className="rounded-xl border border-slate-250 dark:border-emerald-500/20 py-2.5 px-4 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#061e16] transition-all cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isAdding}
                                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 py-2.5 px-6 text-sm font-semibold text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {isAdding ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div> : <Plus className="h-4 w-4" />}
                                    Tambah
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
