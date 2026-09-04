"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, Trash2, Shield, Calendar, Plus, X, Search, CheckCircle, Edit, Save } from 'lucide-react';
import { useTahunAjaran } from '@/hooks/useTahunAjaran';

export default function CatatPelanggaranPage() {
    const { token } = useAuth();
    const [records, setRecords] = useState([]);
    const [siswaList, setSiswaList] = useState([]);
    const [loading, setLoading] = useState(true);

    const { 
        tahunAjaranList, 
        activeTahunAjaranList,
        activeTahunAjaran,
        selectedTahunAjaranId, 
        setSelectedTahunAjaranId,
        loadingTahunAjaran
    } = useTahunAjaran();

    const isCurrentYearActive = activeTahunAjaran?.id?.toString() === selectedTahunAjaranId;

    const API_URL = '/api';

    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [globalSuccess, setGlobalSuccess] = useState('');

    const getLocalYYYYMMDD = (dateVal) => {
        const d = dateVal ? new Date(dateVal) : new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Form states
    const [addSiswaId, setAddSiswaId] = useState('');
    const [addSelectedKelas, setAddSelectedKelas] = useState('');
    const [addNamaKegiatan, setAddNamaKegiatan] = useState('');
    const [addTanggalKejadian, setAddTanggalKejadian] = useState(getLocalYYYYMMDD());
    // Context Menu & Edit state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editRecord, setEditRecord] = useState(null);
    const [editNamaKegiatan, setEditNamaKegiatan] = useState('');
    const [editTanggalKejadian, setEditTanggalKejadian] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

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

    const fetchSiswa = async () => {
        try {
            const res = await fetch(`${API_URL}/siswa`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setSiswaList(data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        if (token) {
            fetchSiswa();
        }
    }, [token]);

    useEffect(() => {
        if (!token || !selectedTahunAjaranId) return;
        fetchRecords();
    }, [token, selectedTahunAjaranId]);

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

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setIsSubmitting(true);

        try {
            const payload = {
                siswa_id: addSiswaId,
                kategori: 'pelanggaran',
                nama_kegiatan: addNamaKegiatan,
                tanggal_kejadian: addTanggalKejadian,
                tahun_ajaran_id: selectedTahunAjaranId
            };

            const res = await fetch(`${API_URL}/kedisiplinan`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Gagal menyimpan catatan pelanggaran.');
            }

            setGlobalSuccess('Catatan pelanggaran berhasil disimpan!');
            setIsAddModalOpen(false);
            setAddSiswaId('');
            setAddSelectedKelas('');
            setAddNamaKegiatan('');
            fetchRecords();
            
            setTimeout(() => setGlobalSuccess(''), 3000);

        } catch (err) {
            setFormError(err.message);
        } finally {
            setIsSubmitting(false);
        }
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

    const romanToNum = {
        'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
        'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10,
        'XI': 11, 'XII': 12
    };

    const sortKelas = (a, b) => {
        const getNum = (str) => {
            const match = str.match(/^([IVX]+)/i);
            if (match && romanToNum[match[1].toUpperCase()]) {
                return romanToNum[match[1].toUpperCase()];
            }
            return 999;
        };
        const numA = getNum(a);
        const numB = getNum(b);
        if (numA !== numB) return numA - numB;
        return a.localeCompare(b);
    };

    const modalSiswaList = (addSelectedKelas 
        ? siswaList.filter(s => s.kelas === addSelectedKelas)
        : siswaList).sort((a, b) => a.nama_lengkap.localeCompare(b.nama_lengkap));

    const displayedRecords = records.filter(r => {
        const isToday = new Date(r.tanggal_kejadian).toDateString() === new Date().toDateString();
        const matchesSearch = r.nama_siswa.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (r.nis && r.nis.toLowerCase().includes(searchQuery.toLowerCase()));
        return isToday && matchesSearch;
    });

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
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Catat Pelanggaran</h1>
                    <p className="text-slate-500 text-sm mt-1">Kelola dan tambah catatan riwayat pelanggaran siswa.</p>
                </div>
            </div>

            {/* Selectors and Actions */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 w-full lg:items-end">
                    {/* Tahun Ajaran */}
                    <div className="flex flex-col gap-1.5 flex-1 sm:flex-none sm:w-[220px]">
                        <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Tahun Ajaran:</label>
                        <select 
                            value={selectedTahunAjaranId} 
                            onChange={e => setSelectedTahunAjaranId(e.target.value)}
                            disabled={loadingTahunAjaran || activeTahunAjaranList.length <= 1}
                            className={`w-full rounded-xl border border-emerald-100 bg-white py-2.5 px-3 sm:px-4 text-[12px] sm:text-sm font-bold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm disabled:opacity-50 ${(activeTahunAjaranList?.length || 0) <= 1 ? 'appearance-none cursor-default bg-none' : 'cursor-pointer'}`}
                        >
                            {loadingTahunAjaran ? (
                                <option>Memuat...</option>
                            ) : activeTahunAjaranList.length === 0 ? (
                                <option value="">Tidak ada data</option>
                            ) : (
                                activeTahunAjaranList.map((ta) => (
                                    <option key={ta.id} value={ta.id}>
                                        {ta.nama_tahun} {ta.semester}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    {/* Search and Add Button */}
                    <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 w-full lg:w-auto lg:ml-auto items-end">
                        {/* Cari Siswa */}
                        <div className="flex flex-col gap-1.5 w-full sm:w-[320px]">
                            <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Cari Siswa:</label>
                            <div className="relative">
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

                        {/* Add Button */}
                        {isCurrentYearActive && (
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-all shadow-md shrink-0 cursor-pointer h-[42px]"
                            >
                                <Plus className="h-4 w-4" />
                                Tambah Catatan
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {!isCurrentYearActive && !loadingTahunAjaran && selectedTahunAjaranId && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 p-4 rounded-xl flex items-center justify-center gap-2 font-medium text-sm animate-fade-in">
                    Mode Arsip (Read-Only). Tahun Ajaran ini sudah tidak aktif, data tidak dapat diubah atau ditambahkan.
                </div>
            )}

            {/* -- Flat Table ----------------------------------- */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
                {loading ? (
                    <div className="flex h-52 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                    </div>
                ) : displayedRecords.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
                        <ShieldAlert className="h-10 w-10 opacity-30" />
                        <p className="text-sm font-medium text-center px-4">Belum ada pelanggaran kedisiplinan tercatat hari ini.</p>
                    </div>
                ) : (
                    <div>
                        <table className="w-full table-fixed text-left text-xs border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                    <th className="py-3 px-3 w-10 text-center border border-slate-200">No</th>
                                    <th className="py-3 px-3 w-36 border border-slate-200">Tanggal</th>
                                    <th className="py-3 px-3 w-44 border border-slate-200">Siswa</th>
                                    <th className="py-3 px-3 w-32 border border-slate-200">Kelas</th>
                                    <th className="py-3 px-3 border border-slate-200">Pelanggaran / Tindakan</th>
                                    <th className="py-3 px-3 w-20 text-center border border-slate-200">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {displayedRecords.map((r, idx) => (
                                    <tr 
                                        key={r.id}
                                        className="hover:bg-slate-50 transition-colors group"
                                    >
                                        <td className="py-3 px-3 text-center align-middle text-slate-500 font-black text-xs border border-slate-200">
                                            {idx + 1}
                                        </td>
                                        <td className="py-3 px-3 align-middle border border-slate-200">
                                            <p className="font-semibold text-slate-800 text-xs whitespace-nowrap">
                                                {new Date(r.tanggal_kejadian).toLocaleDateString('id-ID', {
                                                    day: 'numeric', month: 'long', year: 'numeric'
                                                })}
                                            </p>
                                        </td>
                                        <td className="py-3 px-3 align-middle border border-slate-200">
                                            <p className="font-bold text-slate-800 text-xs">{r.nama_siswa}</p>
                                        </td>
                                        <td className="py-3 px-3 align-middle border border-slate-200">
                                            <span className="inline-flex rounded-lg bg-slate-100 text-slate-600 font-semibold px-2 py-1 text-xs">
                                                {r.kelas || '-'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 align-middle border border-slate-200">
                                            <p className="text-slate-700 text-xs break-words whitespace-normal">{r.nama_kegiatan}</p>
                                        </td>
                                        <td className="py-3 px-3 align-middle text-center border border-slate-200">
                                            {isCurrentYearActive && (
                                                <div className="flex justify-center gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            setEditRecord(r);
                                                            setEditNamaKegiatan(r.nama_kegiatan);
                                                            setEditTanggalKejadian(getLocalYYYYMMDD(r.tanggal_kejadian));
                                                            setIsEditModalOpen(true);
                                                        }}
                                                        className="p-1.5 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                                                        title="Edit"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteRecord(r.id)}
                                                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>



            {/* Modal Edit Catatan */}
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

            {/* Modal Tambah Catatan */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl animate-slide-up overflow-hidden">
                        <button 
                            onClick={() => setIsAddModalOpen(false)} 
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1 rounded-full cursor-pointer transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <h2 className="text-xl font-bold mb-1 flex items-center gap-2 text-slate-800">
                            <ShieldAlert className="h-5 w-5 text-emerald-500" />
                            Catat Pelanggaran
                        </h2>
                        <p className="text-xs text-slate-500 mb-6">Tambahkan catatan pelanggaran ke dalam riwayat siswa.</p>

                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            {formError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold">
                                    {formError}
                                </div>
                            )}

                            <div className="flex flex-row gap-2 sm:gap-4">
                                <div className="flex-1">
                                    <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kelas</label>
                                    <select
                                        value={addSelectedKelas}
                                        onChange={(e) => {
                                            setAddSelectedKelas(e.target.value);
                                            setAddSiswaId(''); // reset nama saat kelas diganti
                                        }}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                                    >
                                        <option value="">Semua Kelas</option>
                                        {[...new Set(siswaList.map(s => s.kelas))].filter(Boolean).sort(sortKelas).map(k => (
                                            <option key={k} value={k}>Kelas {k}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex-1">
                                    <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Siswa</label>
                                    <select
                                        value={addSiswaId}
                                        onChange={(e) => setAddSiswaId(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                                    >
                                        <option value="">-- Pilih Siswa --</option>
                                        {modalSiswaList.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.nama_lengkap} {!addSelectedKelas && s.kelas ? ` - Kelas ${s.kelas}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Tanggal Kejadian</label>
                                <input
                                    type="date"
                                    required
                                    value={addTanggalKejadian}
                                    max={getLocalYYYYMMDD()}
                                    onChange={(e) => setAddTanggalKejadian(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Tindakan / Pelanggaran</label>
                                <textarea
                                    required
                                    rows="3"
                                    value={addNamaKegiatan}
                                    onChange={(e) => setAddNamaKegiatan(e.target.value)}
                                    placeholder="Contoh: Terlambat datang upacara bendera hari Senin..."
                                    className="w-full rounded-xl border border-slate-200 py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none resize-none"
                                ></textarea>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !addSiswaId}
                                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Catatan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
