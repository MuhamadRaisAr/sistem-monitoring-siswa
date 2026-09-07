"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Search, AlertTriangle, Printer, Plus, Edit, Trash2, CheckCircle } from 'lucide-react';
import CetakSPModal from '@/components/CetakSPModal';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export default function SuratPeringatanPage() {
    const { token } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [spList, setSpList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionMessage, setActionMessage] = useState('');
    const [tahunAjaranList, setTahunAjaranList] = useState([]);
    const [selectedTahunAjaranId, setSelectedTahunAjaranId] = useState('');
    const [isCurrentYearActive, setIsCurrentYearActive] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);

    // Modal states
    const [isCetakModalOpen, setIsCetakModalOpen] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedSP, setSelectedSP] = useState(null); // For printing/editing
    const [selectedStudent, setSelectedStudent] = useState(null); // For creating SP
    const [allStudents, setAllStudents] = useState([]);

    // Form states
    const [formData, setFormData] = useState({
        jenis_sp: 'SP 1',
        tanggal_sp: format(new Date(), 'yyyy-MM-dd'),
        tanggal_undangan: '',
        keterangan: ''
    });

    const API_URL = '/api';

    useEffect(() => {
        fetchTahunAjaran();
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await fetch(`${API_URL}/siswa`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setAllStudents(data);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    useEffect(() => {
        if (selectedTahunAjaranId) {
            fetchData();
        }
    }, [selectedTahunAjaranId]);

    const fetchTahunAjaran = async () => {
        try {
            const res = await fetch(`${API_URL}/tahun-ajaran`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setTahunAjaranList(data);
                const active = data.find(ta => ta.is_active === 1);
                if (active) {
                    setSelectedTahunAjaranId(active.id);
                } else if (data.length > 0) {
                    setSelectedTahunAjaranId(data[0].id);
                }
            }
        } catch (error) {
            console.error('Error fetching tahun ajaran:', error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Check if current selected year is the active one
            const selectedTA = tahunAjaranList.find(ta => ta.id === parseInt(selectedTahunAjaranId));
            setIsCurrentYearActive(selectedTA ? selectedTA.is_active === 1 : false);

            const res = await fetch(`${API_URL}/sp?tahun_ajaran_id=${selectedTahunAjaranId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setSpList(Array.isArray(data) ? data : []);
            
            setSelectedIds([]); // Clear selection when data is refreshed
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenFormModal = (student, spToEdit = null) => {
        if (spToEdit) {
            setSelectedSP(spToEdit);
            setSelectedStudent(null);
            setFormData({
                jenis_sp: spToEdit.jenis_sp,
                tanggal_sp: spToEdit.tanggal_sp.split('T')[0],
                tanggal_undangan: spToEdit.tanggal_undangan ? spToEdit.tanggal_undangan.split('T')[0] : '',
                keterangan: spToEdit.keterangan || ''
            });
        } else {
            setSelectedSP(null);
            setSelectedStudent(student);
            setFormData({
                jenis_sp: 'SP 1',
                tanggal_sp: format(new Date(), 'yyyy-MM-dd'),
                tanggal_undangan: '',
                keterangan: ''
            });
        }
        setIsFormModalOpen(true);
    };

    const handleSubmitSP = async (e) => {
        e.preventDefault();
        try {
            const url = selectedSP ? `${API_URL}/sp/${selectedSP.id}` : `${API_URL}/sp`;
            const method = selectedSP ? 'PUT' : 'POST';
            const payload = {
                ...formData,
                siswa_id: selectedStudent ? selectedStudent.id : formData.siswa_id, // Only for POST
                tahun_ajaran_id: selectedTahunAjaranId // Only for POST
            };

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Gagal menyimpan SP');
            
            setIsFormModalOpen(false);
            fetchData();
            showActionMessage(selectedSP ? 'SP berhasil diupdate!' : 'SP berhasil dibuat!');
        } catch (error) {
            console.error(error);
            alert('Gagal menyimpan Surat Peringatan');
        }
    };

    const handleDeleteSP = async (id) => {
        if (!confirm('Apakah Anda yakin ingin menghapus Surat Peringatan ini?')) return;
        try {
            const res = await fetch(`${API_URL}/sp/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchData();
                showActionMessage('SP berhasil dihapus!');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} Surat Peringatan yang dipilih?`)) return;
        
        try {
            const res = await fetch(`${API_URL}/sp/bulk-delete`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ids: selectedIds })
            });
            
            if (res.ok) {
                fetchData();
                showActionMessage(`${selectedIds.length} Surat Peringatan berhasil dihapus!`);
            } else {
                const errData = await res.json();
                alert(errData.message || 'Gagal menghapus secara massal');
            }
        } catch (error) {
            console.error(error);
            alert('Terjadi kesalahan saat menghapus data secara massal');
        }
    };

    const showActionMessage = (msg) => {
        setActionMessage(msg);
        setTimeout(() => setActionMessage(''), 3000);
    };

    const handleCetakSP = (sp) => {
        // Prepare student object structure expected by CetakSPModal
        const studentObj = {
            id: sp.siswa_id,
            nis: sp.nis,
            nama_lengkap: sp.nama_lengkap,
            kelas: sp.kelas
        };
        setSelectedStudent(studentObj);
        setSelectedSP(sp);
        setIsCetakModalOpen(true);
    };

    // Filters
    const filteredDaftarSP = spList.filter(sp =>
        sp.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sp.nis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sp.kelas?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
        const nisA = a.nis || '';
        const nisB = b.nis || '';
        if (nisA < nisB) return -1;
        if (nisA > nisB) return 1;
        
        const jenisA = a.jenis_sp || '';
        const jenisB = b.jenis_sp || '';
        if (jenisA < jenisB) return -1;
        if (jenisA > jenisB) return 1;
        
        return 0;
    });

    // Handle selection
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredDaftarSP.map(sp => sp.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelect = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    return (
        <div className="space-y-6">
            {/* Global Success Indicator */}
            {actionMessage && (
                <div className="fixed top-6 right-1/2 translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-sm text-white px-6 py-3 rounded-2xl shadow-2xl shadow-emerald-500/20 border border-emerald-500/20 flex items-center gap-3 animate-slide-down">
                    <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                    <span className="font-medium">{actionMessage}</span>
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6 text-amber-500" />
                        Surat Peringatan
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Kelola data dan pencetakan Surat Peringatan (SP) siswa.
                    </p>
                </div>
                {isCurrentYearActive && (
                    <button 
                        onClick={() => handleOpenFormModal(null)}
                        className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/30 mt-4 sm:mt-0 shrink-0"
                    >
                        <Plus className="h-4 w-4" />
                        Buat SP Baru
                    </button>
                )}
            </div>

            {/* Selectors and Search */}
            <div className="flex flex-col sm:flex-row gap-4 w-full">
                <div className="flex flex-col gap-1.5 w-full sm:w-[220px]">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tahun Ajaran:</label>
                    <select 
                        value={selectedTahunAjaranId} 
                        onChange={e => setSelectedTahunAjaranId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm cursor-pointer"
                    >
                        {tahunAjaranList.map((ta) => (
                            <option key={ta.id} value={ta.id}>
                                {ta.nama_tahun} {ta.semester}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1.5 w-full sm:w-[320px] sm:ml-auto">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cari Siswa:</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                        <input
                            type="text"
                            placeholder="Ketik nama, NIS, atau kelas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm placeholder:text-slate-400 placeholder:font-normal"
                        />
                    </div>
                </div>
            </div>

            {!isCurrentYearActive && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 p-4 rounded-xl flex items-center justify-center gap-2 font-medium text-sm">
                    Mode Arsip (Read-Only). Anda melihat data tahun ajaran lalu.
                </div>
            )}

            <div className="bg-white dark:bg-[#041610] rounded-2xl shadow-sm border border-slate-200 dark:border-emerald-500/10 overflow-hidden">
                {selectedIds.length > 0 && isCurrentYearActive && (
                    <div className="bg-emerald-50 border-b border-emerald-100 p-3 sm:p-4 flex items-center justify-between animate-fade-in">
                        <span className="text-sm font-bold text-emerald-800">
                            {selectedIds.length} catatan dipilih
                        </span>
                        <button 
                            onClick={handleBulkDelete}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors shadow-sm shadow-red-500/20"
                        >
                            <Trash2 className="h-4 w-4" />
                            Hapus Terpilih
                        </button>
                    </div>
                )}
                <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
                            <thead className="bg-slate-50 dark:bg-[#061e16] text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-3 py-2.5 font-semibold text-center w-12 border border-slate-200">
                                        <input 
                                            type="checkbox"
                                            checked={filteredDaftarSP.length > 0 && selectedIds.length === filteredDaftarSP.length}
                                            onChange={handleSelectAll}
                                            className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-3 py-2.5 font-semibold text-center border border-slate-200">Tgl SP</th>
                                    <th className="px-3 py-2.5 font-semibold text-center border border-slate-200">Nama Siswa</th>
                                    <th className="px-3 py-2.5 font-semibold text-center border border-slate-200 w-32">NIS</th>
                                    <th className="px-3 py-2.5 font-semibold text-center border border-slate-200">Kelas</th>
                                    <th className="px-3 py-2.5 font-semibold text-center border border-slate-200">Keterangan / Alasan</th>
                                    <th className="px-3 py-2.5 font-semibold text-center border border-slate-200">Jenis SP</th>
                                    <th className="px-3 py-2.5 font-semibold text-center border border-slate-200">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-700 dark:text-slate-300">
                                {loading ? (
                                    <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-500">Memuat data...</td></tr>
                                ) : filteredDaftarSP.length === 0 ? (
                                    <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-500">Belum ada SP yang diterbitkan.</td></tr>
                                ) : (
                                    filteredDaftarSP.map((sp) => (
                                        <tr key={sp.id} className={`hover:bg-slate-50 dark:hover:bg-[#061e16]/50 transition-colors ${selectedIds.includes(sp.id) ? 'bg-emerald-50/50' : ''}`}>
                                            <td className="px-3 py-2.5 text-center align-middle border border-slate-200">
                                                <input 
                                                    type="checkbox"
                                                    checked={selectedIds.includes(sp.id)}
                                                    onChange={() => handleSelect(sp.id)}
                                                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-3 py-2.5 border border-slate-200">{format(new Date(sp.tanggal_sp), 'dd MMM yyyy', { locale: localeId })}</td>
                                            <td className="px-3 py-2.5 font-medium border border-slate-200">{sp.nama_lengkap}</td>
                                            <td className="px-3 py-2.5 font-mono border border-slate-200">{sp.nis}</td>
                                            <td className="px-3 py-2.5 border border-slate-200">{sp.kelas}</td>
                                            <td className="px-3 py-2.5 border border-slate-200">
                                                <p className="text-xs text-slate-600 whitespace-normal min-w-[200px] max-w-xs">{sp.keterangan || '-'}</p>
                                            </td>
                                            <td className="px-3 py-2.5 border border-slate-200 text-center">
                                                <span className="bg-amber-100 text-amber-700 font-bold px-2.5 py-1 rounded-lg text-xs">
                                                    {sp.jenis_sp}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 border border-slate-200">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleCetakSP(sp)} className="p-1.5 bg-emerald-100 text-emerald-600 hover:bg-emerald-200 rounded-lg transition-colors" title="Cetak SP">
                                                        <Printer className="h-4 w-4" />
                                                    </button>
                                                    {isCurrentYearActive && (
                                                        <>
                                                            <button onClick={() => handleOpenFormModal(null, sp)} className="p-1.5 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors" title="Edit">
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                            <button onClick={() => handleDeleteSP(sp.id)} className="p-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors" title="Hapus">
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                </div>
            </div>

            {/* Modal Form SP */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="font-bold text-lg text-slate-800">
                                {selectedSP ? 'Edit Surat Peringatan' : 'Buat Surat Peringatan'}
                            </h2>
                            <button onClick={() => setIsFormModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                                <Trash2 className="h-4 w-4 opacity-0 hidden" /> {/* Placeholder for X icon if needed, just use text or lucide X */}
                                <span className="font-bold">X</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmitSP} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {!selectedSP && (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Siswa <span className="text-red-500">*</span></label>
                                        {selectedStudent ? (
                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 h-full flex flex-col justify-center">
                                                <p className="font-bold text-sm">{selectedStudent.nama_lengkap} ({selectedStudent.nis})</p>
                                                <p className="text-sm text-slate-600">{selectedStudent.kelas}</p>
                                            </div>
                                        ) : (
                                            <select
                                                value={formData.siswa_id || ''}
                                                onChange={e => setFormData({...formData, siswa_id: e.target.value})}
                                                className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium focus:border-emerald-500 focus:ring-emerald-500"
                                                required
                                            >
                                                <option value="">-- Pilih Siswa --</option>
                                                {allStudents.map(s => (
                                                    <option key={s.id} value={s.id}>{s.nama_lengkap} - {s.kelas} ({s.nis})</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                )}

                                <div className={selectedSP ? "col-span-1 sm:col-span-2" : ""}>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Jenis Surat Peringatan <span className="text-red-500">*</span></label>
                                    <select 
                                        value={formData.jenis_sp}
                                        onChange={e => setFormData({...formData, jenis_sp: e.target.value})}
                                        className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium focus:border-emerald-500 focus:ring-emerald-500"
                                        required
                                    >
                                        <option value="SP 1">Surat Peringatan 1 (SP 1)</option>
                                        <option value="SP 2">Surat Peringatan 2 (SP 2)</option>
                                        <option value="SP 3">Surat Peringatan 3 (SP 3)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Tanggal SP <span className="text-red-500">*</span></label>
                                    <input 
                                        type="date" 
                                        value={formData.tanggal_sp}
                                        onChange={e => setFormData({...formData, tanggal_sp: e.target.value})}
                                        className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium focus:border-emerald-500 focus:ring-emerald-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Tanggal Undangan</label>
                                    <input 
                                        type="date" 
                                        value={formData.tanggal_undangan}
                                        onChange={e => setFormData({...formData, tanggal_undangan: e.target.value})}
                                        className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium focus:border-emerald-500 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Keterangan / Alasan</label>
                                <textarea 
                                    value={formData.keterangan}
                                    onChange={e => setFormData({...formData, keterangan: e.target.value})}
                                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-emerald-500 focus:ring-emerald-500 min-h-[100px] resize-none"
                                    placeholder="Contoh: Sering bolos dan akumulasi pelanggaran berat..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsFormModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Batal</button>
                                <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 transition-all">Simpan SP</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isCetakModalOpen && selectedStudent && selectedSP && (
                <CetakSPModal 
                    student={selectedStudent} 
                    spData={selectedSP}
                    onClose={() => setIsCetakModalOpen(false)} 
                />
            )}
        </div>
    );
}
