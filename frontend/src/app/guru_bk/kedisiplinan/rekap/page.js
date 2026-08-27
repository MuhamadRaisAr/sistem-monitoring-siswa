"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, Shield, Calendar, Search, Trash2, CheckCircle, Edit, X, Save } from 'lucide-react';
import { useTahunAjaran } from '@/hooks/useTahunAjaran';

export default function AdminKedisiplinanPage() {
    const { token } = useAuth();
    const [records, setRecords] = useState([]);
    const [siswaList, setSiswaList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBulan, setSelectedBulan] = useState('');
    const [globalSuccess, setGlobalSuccess] = useState('');
    
    // Context Menu & Edit State
    const [contextMenu, setContextMenu] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editRecord, setEditRecord] = useState(null);
    const [editNamaKegiatan, setEditNamaKegiatan] = useState('');
    const getLocalYYYYMMDD = (dateVal) => {
        const d = dateVal ? new Date(dateVal) : new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [editTanggalKejadian, setEditTanggalKejadian] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const { 
        tahunAjaranList, 
        activeTahunAjaran,
        selectedTahunAjaranId, 
        setSelectedTahunAjaranId,
        loadingTahunAjaran
    } = useTahunAjaran();

    const isCurrentYearActive = activeTahunAjaran?.id?.toString() === selectedTahunAjaranId;



    const API_URL = '/api';

    const fetchSiswa = async () => {
        try {
            const res = await fetch(`${API_URL}/siswa`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) setSiswaList(data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        if (token) fetchSiswa();
    }, [token]);

    const fetchRecords = async () => {
        if (!selectedTahunAjaranId) return;
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/kedisiplinan?kategori=pelanggaran&tahun_ajaran_id=${selectedTahunAjaranId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setRecords(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (!token || !selectedTahunAjaranId) return;
        fetchRecords();
    }, [token, selectedTahunAjaranId]);

    useEffect(() => {
        if (!contextMenu) return;
        const handleClick = () => setContextMenu(null);
        // Delay attaching the listener to prevent instant close from the triggering event
        const timer = setTimeout(() => window.addEventListener('click', handleClick), 50);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('click', handleClick);
        };
    }, [contextMenu]);

    const handleDeleteRecord = async (id) => {
        if (!confirm('Hapus catatan ini?')) return;
        try {
            const res = await fetch(`${API_URL}/kedisiplinan/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchRecords();
                setGlobalSuccess('Catatan berhasil dihapus!');
                setTimeout(() => setGlobalSuccess(''), 3000);
            }
        } catch (err) { console.error(err); }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/kedisiplinan/${editRecord.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    siswa_id: editRecord.siswa_id,
                    tahun_ajaran_id: editRecord.tahun_ajaran_id,
                    kategori: editRecord.kategori,
                    nama_kegiatan: editNamaKegiatan,
                    tanggal_kejadian: editTanggalKejadian,
                    status_izin: editRecord.status_izin
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Gagal mengedit catatan.');
            
            fetchRecords();
            setGlobalSuccess('Catatan berhasil diedit!');
            setIsEditModalOpen(false);
            setTimeout(() => setGlobalSuccess(''), 3000);
        } catch (err) {
            setFormError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredRecords = records.filter(r => {
        // Search filter
        const matchesSearch = r.nama_siswa.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (r.nis && r.nis.toLowerCase().includes(searchQuery.toLowerCase()));
        
        // Month filter
        let matchesBulan = true;
        if (selectedBulan) {
            const rMonth = new Date(r.tanggal_kejadian).getMonth() + 1; // 1-12
            matchesBulan = rMonth === parseInt(selectedBulan);
        }

        return matchesSearch && matchesBulan;
    });

    const months = [
        { id: '1', name: 'Januari' }, { id: '2', name: 'Februari' }, { id: '3', name: 'Maret' },
        { id: '4', name: 'April' }, { id: '5', name: 'Mei' }, { id: '6', name: 'Juni' },
        { id: '7', name: 'Juli' }, { id: '8', name: 'Agustus' }, { id: '9', name: 'September' },
        { id: '10', name: 'Oktober' }, { id: '11', name: 'November' }, { id: '12', name: 'Desember' }
    ];

    return (
        <div className="space-y-8 relative">
            {/* Global Toast Alerts */}
            {globalSuccess && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 bg-white text-slate-700 rounded-xl shadow-xl animate-fade-in flex items-center gap-3 font-semibold border border-slate-200 w-max max-w-[90vw]">
                    <CheckCircle className="h-5 w-5 text-slate-500 shrink-0" />
                    <span className="whitespace-nowrap">{globalSuccess}</span>
                </div>
            )}

            {/* -- Header --------------------------------------------- */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Rekap Pelanggaran</h1>
                    <p className="text-slate-500 text-sm mt-1">Rekapitulasi catatan pelanggaran siswa.</p>
                </div>
            </div>

            {/* Selectors */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4 w-full items-start sm:items-center">
                    <div className="flex flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                        {/* Tahun Ajaran */}
                        <div className="flex flex-col gap-1.5 flex-1 sm:flex-none sm:w-[220px]">
                            <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Tahun Ajaran:</label>
                            <select 
                                value={selectedTahunAjaranId} 
                                onChange={e => setSelectedTahunAjaranId(e.target.value)}
                                disabled={loadingTahunAjaran}
                                className="w-full rounded-xl border border-emerald-100 bg-white py-2.5 px-3 sm:px-4 text-[12px] sm:text-sm font-bold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-sm disabled:opacity-50"
                            >
                                {loadingTahunAjaran ? (
                                    <option>Memuat...</option>
                                ) : tahunAjaranList.length === 0 ? (
                                    <option value="">Tidak ada data</option>
                                ) : (
                                    tahunAjaranList.map((ta) => (
                                        <option key={ta.id} value={ta.id}>
                                            {ta.nama_tahun} {ta.semester}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

                        {/* Bulan */}
                        <div className="flex flex-col gap-1.5 flex-1 sm:flex-none sm:w-[180px]">
                            <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Bulan:</label>
                            <select
                                value={selectedBulan}
                                onChange={(e) => setSelectedBulan(e.target.value)}
                                className="w-full rounded-xl border border-emerald-100 bg-white py-2.5 px-3 sm:px-4 text-[12px] sm:text-sm font-bold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-sm"
                            >
                                <option value="">Semua</option>
                                {months.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Cari Siswa */}
                    <div className="flex flex-col gap-1.5 w-full sm:w-[260px] sm:ml-auto">
                        <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Cari Siswa:</label>
                        <div className="relative w-full">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-emerald-500" />
                            </div>
                            <input
                                type="text"
                                placeholder="Ketik nama atau NIS..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-emerald-100 bg-white text-[12px] sm:text-sm font-bold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm placeholder:text-slate-400 placeholder:font-normal"
                            />
                        </div>
                    </div>
                </div>
            </div>
            {!isCurrentYearActive && !loadingTahunAjaran && selectedTahunAjaranId && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 p-4 rounded-xl flex items-center justify-center gap-2 font-medium text-sm animate-fade-in">
                    Mode Arsip (Read-Only). Tahun Ajaran ini sudah tidak aktif, data tidak dapat diubah.
                </div>
            )}
            {/* -- Rekap Table ----------------------------------- */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
                {loading ? (
                    <div className="flex h-52 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
                        <ShieldAlert className="h-10 w-10 opacity-30" />
                        <p className="text-sm font-medium text-center px-4">Belum ada pelanggaran kedisiplinan yang cocok dengan pencarian.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto pb-8">
                        <table className="w-full text-left text-xs whitespace-nowrap min-w-max border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                                    <th className="py-2 px-3 w-10 text-center border border-slate-200">No</th>
                                    <th className="py-2 px-3 border border-slate-200">Tanggal</th>
                                    <th className="py-2 px-3 border border-slate-200">Siswa</th>
                                    <th className="py-2 px-3 border border-slate-200">Kelas</th>
                                    <th className="py-2 px-3 border border-slate-200">Pelanggaran / Tindakan</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filteredRecords.map((r, idx) => (
                                    <tr 
                                        key={r.id}
                                        className="hover:bg-slate-50 transition-colors group cursor-context-menu"
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            if (!isCurrentYearActive) return;
                                            setContextMenu({ x: e.clientX, y: e.clientY, record: r });
                                        }}
                                    >
                                        <td className="py-2 px-3 text-center text-slate-500 font-black text-xs border border-slate-200">
                                            {idx + 1}
                                        </td>
                                        <td className="py-2 px-3 border border-slate-200">
                                            <p className="font-semibold text-xs text-slate-800">
                                                {new Date(r.tanggal_kejadian).toLocaleDateString('id-ID', {
                                                    day: 'numeric', month: 'long', year: 'numeric'
                                                })}
                                            </p>
                                        </td>
                                        <td className="py-2 px-3 border border-slate-200">
                                            <p className="font-bold text-xs text-slate-800">{r.nama_siswa}</p>
                                        </td>
                                        <td className="py-2 px-3 border border-slate-200">
                                            <span className="inline-flex rounded-lg bg-slate-100 text-slate-600 font-semibold px-2 py-1 text-[10px]">
                                                {r.kelas || '-'}
                                            </span>
                                        </td>
                                        <td className="py-2 px-3 border border-slate-200">
                                            <p className="text-slate-700 text-xs whitespace-normal min-w-[200px]">{r.nama_kegiatan}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div 
                    className="fixed z-[9999] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden min-w-[160px] animate-fade-in"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <button
                        onClick={() => {
                            setEditRecord(contextMenu.record);
                            setEditNamaKegiatan(contextMenu.record.nama_kegiatan);
                            setEditTanggalKejadian(getLocalYYYYMMDD(contextMenu.record.tanggal_kejadian));
                            setIsEditModalOpen(true);
                            setContextMenu(null);
                        }}
                        className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-100"
                    >
                        <Edit className="h-4 w-4 text-blue-500" /> Edit Data
                    </button>
                    <button
                        onClick={() => {
                            handleDeleteRecord(contextMenu.record.id);
                            setContextMenu(null);
                        }}
                        className="w-full text-left px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                        <Trash2 className="h-4 w-4" /> Hapus Data
                    </button>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && editRecord && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl animate-slide-up overflow-hidden">
                        <button 
                            onClick={() => setIsEditModalOpen(false)} 
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1 rounded-full cursor-pointer transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="mb-6 pr-8">
                            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                                <Edit className="h-6 w-6 text-emerald-500" /> Edit Catatan
                            </h2>
                            <p className="text-xs text-slate-500 mt-1 font-medium">Ubah catatan pelanggaran untuk <span className="font-bold text-emerald-600">{editRecord.nama_siswa}</span></p>
                        </div>

                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            {formError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold">
                                    {formError}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Tanggal Kejadian</label>
                                <input
                                    type="date"
                                    required
                                    value={editTanggalKejadian}
                                    onChange={(e) => setEditTanggalKejadian(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Catatan Pelanggaran / Tindakan</label>
                                <textarea
                                    required
                                    value={editNamaKegiatan}
                                    onChange={(e) => setEditNamaKegiatan(e.target.value)}
                                    placeholder="Tuliskan bentuk pelanggaran atau tindakan..."
                                    rows="4"
                                    className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                            >
                                {isSubmitting ? (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                ) : (
                                    <>
                                        <Save className="h-5 w-5" /> Simpan Perubahan
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
