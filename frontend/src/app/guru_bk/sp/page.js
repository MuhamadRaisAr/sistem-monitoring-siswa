"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Search, AlertTriangle, Printer, Plus, Edit, Trash2, CheckCircle } from 'lucide-react';
import CetakSPModal from '@/components/CetakSPModal';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export default function SuratPeringatanPage() {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState('kandidat'); // 'kandidat' or 'daftar_sp'
    
    const [searchTerm, setSearchTerm] = useState('');
    const [spList, setSpList] = useState([]);
    const [rekapData, setRekapData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionMessage, setActionMessage] = useState('');
    const [tahunAjaranList, setTahunAjaranList] = useState([]);
    const [selectedTahunAjaranId, setSelectedTahunAjaranId] = useState('');
    const [isCurrentYearActive, setIsCurrentYearActive] = useState(true);

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
    }, [selectedTahunAjaranId, activeTab]);

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

            if (activeTab === 'daftar_sp') {
                const res = await fetch(`${API_URL}/sp?tahun_ajaran_id=${selectedTahunAjaranId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                setSpList(Array.isArray(data) ? data : []);
            } else {
                const res = await fetch(`${API_URL}/kedisiplinan/rekap-sp?tahun_ajaran_id=${selectedTahunAjaranId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                setRekapData(Array.isArray(data) ? data : []);
            }
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
                keterangan: spToEdit.keterangan || ''
            });
        } else {
            setSelectedSP(null);
            setSelectedStudent(student);
            setFormData({
                jenis_sp: 'SP 1',
                tanggal_sp: format(new Date(), 'yyyy-MM-dd'),
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
    );

    const filteredKandidat = rekapData.filter(student =>
        student.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.nis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.kelas?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-emerald-500/10">
                <button
                    onClick={() => setActiveTab('kandidat')}
                    className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'kandidat' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                    Kandidat SP (Riwayat Pelanggaran)
                </button>
                <button
                    onClick={() => setActiveTab('daftar_sp')}
                    className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'daftar_sp' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                    Daftar SP Dikeluarkan
                </button>
            </div>

            {!isCurrentYearActive && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 p-4 rounded-xl flex items-center justify-center gap-2 font-medium text-sm">
                    Mode Arsip (Read-Only). Anda melihat data tahun ajaran lalu.
                </div>
            )}

            <div className="bg-white dark:bg-[#041610] rounded-2xl shadow-sm border border-slate-200 dark:border-emerald-500/10 overflow-hidden">
                <div className="overflow-x-auto">
                    {activeTab === 'daftar_sp' ? (
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 dark:bg-[#061e16] text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Tgl SP</th>
                                    <th className="px-4 py-3 font-semibold">NIS</th>
                                    <th className="px-4 py-3 font-semibold">Nama Siswa</th>
                                    <th className="px-4 py-3 font-semibold">Kelas</th>
                                    <th className="px-4 py-3 font-semibold">Jenis SP</th>
                                    <th className="px-4 py-3 font-semibold text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-emerald-500/10 text-slate-700 dark:text-slate-300">
                                {loading ? (
                                    <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-500">Memuat data...</td></tr>
                                ) : filteredDaftarSP.length === 0 ? (
                                    <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-500">Belum ada SP yang diterbitkan.</td></tr>
                                ) : (
                                    filteredDaftarSP.map((sp) => (
                                        <tr key={sp.id} className="hover:bg-slate-50 dark:hover:bg-[#061e16]/50 transition-colors">
                                            <td className="px-4 py-3">{format(new Date(sp.tanggal_sp), 'dd MMM yyyy', { locale: localeId })}</td>
                                            <td className="px-4 py-3 font-mono">{sp.nis}</td>
                                            <td className="px-4 py-3 font-medium">{sp.nama_lengkap}</td>
                                            <td className="px-4 py-3">{sp.kelas}</td>
                                            <td className="px-4 py-3">
                                                <span className="bg-amber-100 text-amber-700 font-bold px-2.5 py-1 rounded-lg text-xs">
                                                    {sp.jenis_sp}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
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
                    ) : (
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 dark:bg-[#061e16] text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">NIS</th>
                                    <th className="px-4 py-3 font-semibold">Nama Siswa</th>
                                    <th className="px-4 py-3 font-semibold">Kelas</th>
                                    <th className="px-4 py-3 font-semibold text-center">Total Poin Pelanggaran</th>
                                    <th className="px-4 py-3 font-semibold text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-emerald-500/10 text-slate-700 dark:text-slate-300">
                                {loading ? (
                                    <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-500">Memuat data...</td></tr>
                                ) : filteredKandidat.length === 0 ? (
                                    <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-500">Tidak ada data siswa dengan pelanggaran.</td></tr>
                                ) : (
                                    filteredKandidat.map((student) => (
                                        <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-[#061e16]/50 transition-colors">
                                            <td className="px-4 py-3 font-mono">{student.nis}</td>
                                            <td className="px-4 py-3 font-medium">{student.nama_lengkap}</td>
                                            <td className="px-4 py-3">{student.kelas}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full text-xs">
                                                    {student.total_poin || 0} Poin
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button 
                                                    onClick={() => handleOpenFormModal(student)}
                                                    disabled={!isCurrentYearActive}
                                                    className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white px-3 py-1.5 rounded-xl font-bold text-xs transition-colors shadow-sm"
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                    Buat SP
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
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
                            {!selectedSP && (
                                <div className="mb-4">
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Siswa <span className="text-red-500">*</span></label>
                                    {selectedStudent ? (
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
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

                            <div>
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
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Keterangan / Alasan <span className="text-slate-400 font-normal">(Opsional)</span></label>
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
