"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Shield, Plus, Edit2, Trash2, Search, X, Loader2, Info, ChevronDown } from 'lucide-react';

export default function AdminEkstrakurikulerPage() {
    const { token } = useAuth();
    const [ekskul, setEkskul] = useState([]);
    const [gurus, setGurus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedId, setSelectedId] = useState(null);
    const [formData, setFormData] = useState({
        nama_ekskul: '',
        pembina_id: '',
        hari: '',
        jam_mulai: '',
        jam_selesai: '',
        deskripsi: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch ekskul
            const resEkskul = await fetch('/api/ekskul', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const dataEkskul = await resEkskul.json();
            setEkskul(dataEkskul);

            // Fetch gurus for pembina dropdown
            const resGuru = await fetch('/api/auth/users?role=guru', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const dataGuru = await resGuru.json();
            setGurus(dataGuru);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (mode, item = null) => {
        setModalMode(mode);
        if (mode === 'edit' && item) {
            setSelectedId(item.id);
            setFormData({
                nama_ekskul: item.nama_ekskul,
                pembina_id: item.pembina_id || '',
                hari: item.hari || '',
                jam_mulai: item.jam_mulai || '',
                jam_selesai: item.jam_selesai || '',
                deskripsi: item.deskripsi || ''
            });
        } else {
            setSelectedId(null);
            setFormData({ nama_ekskul: '', pembina_id: '', hari: '', jam_mulai: '', jam_selesai: '', deskripsi: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        
        try {
            const url = modalMode === 'add' ? '/api/ekskul' : `/api/ekskul/${selectedId}`;
            const method = modalMode === 'add' ? 'POST' : 'PUT';
            
            const payload = { ...formData };
            if (!payload.pembina_id) payload.pembina_id = null;

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchData();
            } else {
                const errorData = await res.json();
                alert(`Gagal: ${errorData.message}`);
            }
        } catch (err) {
            console.error('Submit error:', err);
            alert('Terjadi kesalahan sistem.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id, nama) => {
        if (!confirm(`Yakin ingin menghapus Ekstrakurikuler ${nama}?`)) return;
        
        try {
            const res = await fetch(`/api/ekskul/${id}`, {
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

    const filteredEkskul = ekskul.filter(e => 
        e.nama_ekskul.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.nama_pembina && e.nama_pembina.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center p-6">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Ekstrakurikuler</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kelola data ekstrakurikuler dan guru pembina</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input 
                            type="text"
                            placeholder="Cari ekskul atau nama pembina..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#020c08]/50 py-2 sm:py-2.5 pl-9 pr-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                    <button 
                        onClick={() => handleOpenModal('add')}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 sm:py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all active:scale-95 shrink-0 w-full sm:w-auto text-sm"
                    >
                        <Plus className="h-4 w-4" /> Tambah Ekskul
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="overflow-x-auto w-full">
                <table className="w-full text-left whitespace-nowrap">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-[#061e16] border-y-2 border-slate-200 dark:border-emerald-500/20">
                            <th className="py-4 px-6 text-sm font-bold text-center text-slate-700 dark:text-slate-200 border-t-2 border-x-2 border-slate-200 dark:border-emerald-500/20">Nama Ekskul</th>
                            <th className="py-4 px-6 text-sm font-bold text-center text-slate-700 dark:text-slate-200 border-t-2 border-r-2 border-slate-200 dark:border-emerald-500/20">Hari</th>
                            <th className="py-4 px-6 text-sm font-bold text-center text-slate-700 dark:text-slate-200 border-t-2 border-r-2 border-slate-200 dark:border-emerald-500/20">Jam</th>
                            <th className="py-4 px-6 text-sm font-bold text-center text-slate-700 dark:text-slate-200 border-t-2 border-r-2 border-slate-200 dark:border-emerald-500/20">Guru Pembina</th>
                            <th className="py-4 px-6 text-sm font-bold text-center text-slate-700 dark:text-slate-200 border-t-2 border-r-2 border-slate-200 dark:border-emerald-500/20">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEkskul.length === 0 ? (
                            <tr className="bg-white dark:bg-[#061e16] border-b-2 border-slate-200 dark:border-emerald-500/20">
                                <td colSpan="5" className="py-12 text-center text-slate-500 font-medium border-x-2 border-slate-200 dark:border-emerald-500/20">Belum ada data ekstrakurikuler.</td>
                            </tr>
                            ) : (
                                filteredEkskul.map((item, index) => (
                                    <tr key={item.id} className="bg-white dark:bg-[#061e16] border-b-2 border-slate-200 dark:border-emerald-500/20 hover:bg-slate-50 dark:hover:bg-[#061e16]/80 transition-colors">
                                        <td className="py-4 px-6 font-bold text-slate-800 dark:text-white border-x-2 border-slate-200 dark:border-emerald-500/20 text-center">
                                            {item.nama_ekskul}
                                            {item.deskripsi && (
                                                <p className="text-xs text-slate-400 font-normal mt-0.5 truncate max-w-[200px]">{item.deskripsi}</p>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 border-r-2 border-slate-200 dark:border-emerald-500/20 text-slate-700 dark:text-slate-300 text-center">
                                            {item.hari ? item.hari : <span className="text-sm text-slate-400 italic">Belum ditentukan</span>}
                                        </td>
                                        <td className="py-4 px-6 border-r-2 border-slate-200 dark:border-emerald-500/20 text-slate-700 dark:text-slate-300 text-center">
                                            {item.jam_mulai && item.jam_selesai ? (
                                                <span>{item.jam_mulai.slice(0,5)} - {item.jam_selesai.slice(0,5)}</span>
                                            ) : (
                                                <span className="text-sm text-slate-400 italic">Belum ditentukan</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 border-r-2 border-slate-200 dark:border-emerald-500/20 text-center">
                                            {item.nama_pembina ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-semibold">
                                                    <Shield className="h-3.5 w-3.5" /> {item.nama_pembina}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-slate-400 italic">Belum ditentukan</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 border-r-2 border-slate-200 dark:border-emerald-500/20">
                                            <div className="flex gap-2 justify-center">
                                                <button onClick={() => window.location.href = `/admin/ekstrakurikuler/${item.id}`} className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors flex items-center gap-1" title="Anggota Ekskul">
                                                    <Shield className="h-4 w-4" /> <span className="text-xs font-bold hidden sm:block">Anggota</span>
                                                </button>
                                                <button onClick={() => handleOpenModal('edit', item)} className="p-2 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-500/10 rounded-lg transition-colors" title="Edit">
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDelete(item.id, item.nama_ekskul)} className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors" title="Hapus">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-[#020c08] rounded-3xl w-full max-w-[520px] shadow-2xl overflow-hidden border border-slate-100 dark:border-emerald-500/20">
                        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-emerald-500/10">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                                {modalMode === 'add' ? 'Tambah Ekskul' : 'Edit Ekskul'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-3">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Ekstrakurikuler *</label>
                                <input 
                                    type="text"
                                    required
                                    value={formData.nama_ekskul}
                                    onChange={(e) => setFormData({...formData, nama_ekskul: e.target.value})}
                                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#061e16] border border-slate-200 dark:border-emerald-500/20 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white"
                                    placeholder="Contoh: Pramuka, PMR..."
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Guru Pembina</label>
                                    <div 
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#061e16] border border-slate-200 dark:border-emerald-500/20 outline-none text-slate-800 dark:text-white cursor-pointer flex justify-between items-center"
                                    >
                                        <span className="truncate pr-2 text-sm">
                                            {formData.pembina_id 
                                                ? gurus.find(g => g.id.toString() === formData.pembina_id.toString())?.nama_lengkap || 'Pilih Pembina'
                                                : 'Pilih Pembina'}
                                        </span>
                                        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                    </div>

                                    {isDropdownOpen && (
                                        <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white dark:bg-[#020c08] border border-slate-200 dark:border-emerald-500/20 rounded-xl shadow-2xl max-h-48 overflow-y-auto animate-fade-in">
                                            <div 
                                                className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-emerald-500/10 cursor-pointer text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-emerald-500/10 text-sm"
                                                onClick={() => {
                                                    setFormData({...formData, pembina_id: ''});
                                                    setIsDropdownOpen(false);
                                                }}
                                            >
                                                Pilih Pembina
                                            </div>
                                            {gurus.map(g => (
                                                <div 
                                                    key={g.id}
                                                    className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-emerald-500/10 cursor-pointer text-slate-700 dark:text-slate-200 text-sm"
                                                    onClick={() => {
                                                        setFormData({...formData, pembina_id: g.id});
                                                        setIsDropdownOpen(false);
                                                    }}
                                                >
                                                    {g.nama_lengkap}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="relative">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Hari</label>
                                    <select
                                        value={formData.hari}
                                        onChange={(e) => setFormData({...formData, hari: e.target.value})}
                                        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#061e16] border border-slate-200 dark:border-emerald-500/20 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white appearance-none cursor-pointer text-sm"
                                    >
                                        <option value="">Pilih Hari</option>
                                        <option value="Senin">Senin</option>
                                        <option value="Selasa">Selasa</option>
                                        <option value="Rabu">Rabu</option>
                                        <option value="Kamis">Kamis</option>
                                        <option value="Jumat">Jumat</option>
                                        <option value="Sabtu">Sabtu</option>
                                        <option value="Minggu">Minggu</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-[38px] h-4 w-4 pointer-events-none text-slate-800 dark:text-white" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Jam Mulai</label>
                                    <input 
                                        type="time"
                                        value={formData.jam_mulai}
                                        onChange={(e) => setFormData({...formData, jam_mulai: e.target.value})}
                                        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#061e16] border border-slate-200 dark:border-emerald-500/20 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Jam Selesai</label>
                                    <input 
                                        type="time"
                                        value={formData.jam_selesai}
                                        onChange={(e) => setFormData({...formData, jam_selesai: e.target.value})}
                                        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#061e16] border border-slate-200 dark:border-emerald-500/20 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Deskripsi / Keterangan</label>
                                <textarea 
                                    value={formData.deskripsi}
                                    onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}
                                    rows={1}
                                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#061e16] border border-slate-200 dark:border-emerald-500/20 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white resize-none text-sm"
                                    placeholder="Opsional..."
                                ></textarea>
                            </div>

                            <div className="pt-2">
                                <button 
                                    type="submit" 
                                    disabled={submitting}
                                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center"
                                >
                                    {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
