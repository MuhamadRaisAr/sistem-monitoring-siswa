"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTahunAjaran } from '@/hooks/useTahunAjaran';
import { Search, Plus, Edit, Trash2, Calendar, FileText, X } from 'lucide-react';

export default function GuruBkKonselingPage() {
    const { token, user } = useAuth();
    const { tahunAjaranList, activeTahunAjaranList, selectedTahunAjaranId, setSelectedTahunAjaranId, loadingTahunAjaran } = useTahunAjaran();
    
    const [records, setRecords] = useState([]);
    const [siswaList, setSiswaList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedKelas, setSelectedKelas] = useState('');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const getLocalYYYYMMDD = (dateVal) => {
        const d = dateVal ? new Date(dateVal) : new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [formData, setFormData] = useState({
        siswa_id: '',
        tanggal: getLocalYYYYMMDD(),
        topik: '',
        hasil_konseling: '',
        tindak_lanjut: ''
    });
    const [formKelas, setFormKelas] = useState('');

    const API_URL = '/api';

    const fetchData = async () => {
        if (!selectedTahunAjaranId) return;
        try {
            setLoading(true);
            const [resBk, resSiswa] = await Promise.all([
                fetch(`${API_URL}/bimbingan-konseling?tahun_ajaran_id=${selectedTahunAjaranId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/siswa?tahun_ajaran_id=${selectedTahunAjaranId}`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            
            const [dataBk, dataSiswa] = await Promise.all([resBk.json(), resSiswa.json()]);
            setRecords(Array.isArray(dataBk) ? dataBk : []);
            setSiswaList(Array.isArray(dataSiswa) ? dataSiswa.filter(s => s.status_aktif === 'aktif') : []);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && selectedTahunAjaranId) {
            fetchData();
        }
    }, [token, selectedTahunAjaranId]);

    const kelasOptions = useMemo(() => {
        const classes = new Set(siswaList.map(s => s.kelas).filter(Boolean));
        const romanMap = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 };
        return Array.from(classes).sort((a, b) => {
            const valA = romanMap[a.split(' ')[0]] || 99;
            const valB = romanMap[b.split(' ')[0]] || 99;
            if (valA !== valB) return valA - valB;
            return a.localeCompare(b);
        });
    }, [siswaList]);

    const filteredRecords = useMemo(() => {
        return records.filter(r => {
            const matchSearch = r.nama_siswa?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                   r.nis?.includes(searchQuery) ||
                   r.topik?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchKelas = selectedKelas ? r.kelas === selectedKelas : true;
            return matchSearch && matchKelas;
        }).sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    }, [records, searchQuery, selectedKelas]);

    const handleOpenModal = (record = null) => {
        if (record) {
            const student = siswaList.find(s => s.id === record.siswa_id);
            setFormKelas(student ? student.kelas : '');
            setEditingId(record.id);
            setFormData({
                siswa_id: record.siswa_id,
                tanggal: getLocalYYYYMMDD(record.tanggal),
                topik: record.topik,
                hasil_konseling: record.hasil_konseling || '',
                tindak_lanjut: record.tindak_lanjut || ''
            });
        } else {
            setEditingId(null);
            setFormKelas('');
            setFormData({
                siswa_id: '',
                tanggal: getLocalYYYYMMDD(),
                topik: '',
                hasil_konseling: '',
                tindak_lanjut: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingId ? `${API_URL}/bimbingan-konseling/${editingId}` : `${API_URL}/bimbingan-konseling`;
            const method = editingId ? 'PUT' : 'POST';
            
            const payload = { ...formData, tahun_ajaran_id: selectedTahunAjaranId };
            
            const res = await fetch(url, {
                method,
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (res.ok) {
                setIsModalOpen(false);
                fetchData();
            } else {
                const errData = await res.json();
                alert(errData.message || 'Terjadi kesalahan');
            }
        } catch (err) {
            console.error(err);
            alert('Gagal menyimpan data');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus catatan konseling ini?')) return;
        try {
            const res = await fetch(`${API_URL}/bimbingan-konseling/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchData();
            }
        } catch (err) {
            console.error(err);
            alert('Gagal menghapus data');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Catatan Konseling</h1>
                    <p className="text-slate-500 text-sm mt-1">Kelola riwayat bimbingan dan konseling siswa.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4 w-full items-start sm:items-center">
                    <div className="flex flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                        <div className="flex flex-col gap-1.5 flex-1 sm:flex-none sm:w-[220px]">
                            <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Tahun Ajaran:</label>
                            <select 
                                value={selectedTahunAjaranId} 
                                onChange={e => setSelectedTahunAjaranId(e.target.value)}
                                disabled={loadingTahunAjaran || activeTahunAjaranList.length <= 1}
                                className={`w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 sm:px-4 text-[12px] sm:text-sm font-bold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm disabled:opacity-50 ${(activeTahunAjaranList?.length || 0) <= 1 ? 'appearance-none cursor-default bg-none' : 'cursor-pointer'}`}
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

                        <div className="flex flex-col gap-1.5 flex-1 sm:flex-none sm:w-[180px]">
                            <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Kelas:</label>
                            <select 
                                value={selectedKelas} 
                                onChange={e => setSelectedKelas(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 sm:px-4 text-[12px] sm:text-sm font-bold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-sm"
                            >
                                <option value="">Semua Kelas</option>
                                {kelasOptions.map((k, idx) => (
                                    <option key={idx} value={k}>{k}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5 w-full sm:w-[320px] sm:ml-auto">
                        <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Cari Siswa / Topik:</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-emerald-500" />
                            </div>
                            <input
                                type="text"
                                placeholder="Ketik nama atau topik..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[12px] sm:text-sm font-bold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm placeholder:text-slate-400 placeholder:font-normal"
                            />
                        </div>
                    </div>
                </div>

                {/* Add Button */}
                <div className="w-full mt-2">
                    <button 
                        onClick={() => handleOpenModal()}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all active:scale-95 h-[42px]"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Tambah Catatan</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex h-52 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
                        <FileText className="h-10 w-10 opacity-30" />
                        <p className="text-sm font-medium">Belum ada catatan konseling.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto pb-8">
                        <table className="w-full text-left text-xs whitespace-nowrap min-w-max border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                    <th className="py-4 px-5 w-16 text-center border border-slate-200">No</th>
                                    <th className="py-4 px-5 border border-slate-200 w-32">Tanggal</th>
                                    <th className="py-4 px-5 border border-slate-200 w-[30%] text-center">Nama Siswa</th>
                                    <th className="py-4 px-5 border border-slate-200">Topik Konseling</th>
                                    <th className="py-4 px-5 border border-slate-200 text-center w-24">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filteredRecords.map((r, idx) => (
                                    <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="py-4 px-5 text-center text-slate-500 font-black text-xs border border-slate-200">{idx + 1}</td>
                                        <td className="py-4 px-5 border border-slate-200">
                                            <p className="font-semibold text-slate-800">
                                                {new Date(r.tanggal).toLocaleDateString('id-ID', {
                                                    day: 'numeric', month: 'long', year: 'numeric'
                                                })}
                                            </p>
                                        </td>
                                        <td className="py-4 px-5 border border-slate-200">
                                            <p className="font-bold text-slate-800">{r.nama_siswa}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">Kelas: {r.kelas}</p>
                                        </td>
                                        <td className="py-4 px-5 border border-slate-200">
                                            <p className="font-bold text-slate-700">{r.topik}</p>
                                            <div className="text-xs text-slate-500 mt-1 whitespace-normal min-w-[250px] max-w-sm line-clamp-2">
                                                {r.hasil_konseling || <span className="italic">Belum ada hasil</span>}
                                            </div>
                                        </td>
                                        <td className="py-4 px-5 border border-slate-200 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={() => handleOpenModal(r)}
                                                    className="p-2 rounded-lg bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors"
                                                    title="Edit Catatan"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(r.id)}
                                                    className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                                    title="Hapus Catatan"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-800">
                                {editingId ? 'Edit Catatan Konseling' : 'Tambah Catatan Konseling'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Kelas</label>
                                    <select 
                                        value={formKelas}
                                        onChange={e => {
                                            setFormKelas(e.target.value);
                                            setFormData({...formData, siswa_id: ''});
                                        }}
                                        className="w-full rounded-xl border border-slate-200 py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-medium text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    >
                                        <option value="">Semua Kelas</option>
                                        {kelasOptions.map(k => (
                                            <option key={k} value={k}>{k}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Siswa</label>
                                    <select 
                                        required
                                        value={formData.siswa_id}
                                        onChange={e => setFormData({...formData, siswa_id: e.target.value})}
                                        className="w-full rounded-xl border border-slate-200 py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-medium text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    >
                                        <option value="">-- Pilih Siswa --</option>
                                        {siswaList.filter(s => formKelas ? s.kelas === formKelas : true).map(s => (
                                            <option key={s.id} value={s.id}>{s.nama_lengkap} {formKelas ? '' : `(Kelas ${s.kelas})`}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Tanggal</label>
                                    <input 
                                        type="date" required
                                        value={formData.tanggal}
                                        onChange={e => setFormData({...formData, tanggal: e.target.value})}
                                        className="w-full rounded-xl border border-slate-200 py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-medium text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Topik Konseling</label>
                                    <input 
                                        type="text" required placeholder="Contoh: Motivasi Belajar, Karir, dll"
                                        value={formData.topik}
                                        onChange={e => setFormData({...formData, topik: e.target.value})}
                                        className="w-full rounded-xl border border-slate-200 py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-medium text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">Catatan <span className="text-[10px] text-slate-400 normal-case font-normal capitalize">(Opsional)</span></label>
                                <textarea 
                                    rows="3" placeholder="Tuliskan hasil pembicaraan..."
                                    value={formData.hasil_konseling}
                                    onChange={e => setFormData({...formData, hasil_konseling: e.target.value})}
                                    className="w-full rounded-xl border border-slate-200 py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                                />
                            </div>


                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                                    Batal
                                </button>
                                <button type="submit" className="flex-1 py-3 px-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30">
                                    Simpan Catatan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
