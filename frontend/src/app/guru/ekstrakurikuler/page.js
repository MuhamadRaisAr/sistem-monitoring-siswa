"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTahunAjaran } from '@/hooks/useTahunAjaran';
import { Users, Search, Plus, Save, Trash2, X, Activity, Award } from 'lucide-react';

export default function NilaiEkstrakurikulerPage() {
    const { user, token } = useAuth();
    const { activeTahunAjaran, loadingTahunAjaran } = useTahunAjaran();
    
    const [kelasWali, setKelasWali] = useState(null);
    const [siswaList, setSiswaList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    
    const [selectedSiswa, setSelectedSiswa] = useState(null);
    const [nilaiEkskulSiswa, setNilaiEkskulSiswa] = useState([]);
    const [masterEkskul, setMasterEkskul] = useState([]);
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState({
        ekskul_id: '',
        predikat: 'Baik',
        keterangan: ''
    });

    useEffect(() => {
        if (!user || !token || loadingTahunAjaran) return;
        
        if (activeTahunAjaran) {
            if (user?.is_wali_kelas && user?.kelas_wali?.length > 0) {
                const kelas = user.kelas_wali[0];
                setKelasWali(kelas);
                fetchSiswa(kelas.nama_kelas);
            } else {
                setLoading(false);
            }
            fetchMasterEkskul();
        } else {
            setLoading(false);
        }
    }, [user, token, activeTahunAjaran, loadingTahunAjaran]);

    const fetchMasterEkskul = async () => {
        try {
            const res = await fetch('/api/ekskul', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setMasterEkskul(data);
        } catch (error) {
            console.error('Error fetching master ekskul:', error);
        }
    };

    const fetchSiswa = async (namaKelas) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/siswa?kelas=${namaKelas}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setSiswaList(Array.isArray(data) ? data.filter(s => s.status_aktif === 'aktif') : []);
        } catch (error) {
            console.error('Error fetching siswa:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchNilaiEkskul = async (siswa) => {
        setSelectedSiswa(siswa);
        try {
            const res = await fetch(`/api/nilai-ekskul?siswa_id=${siswa.id}&tahun_ajaran_id=${activeTahunAjaran.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setNilaiEkskulSiswa(data);
            }
        } catch (error) {
            console.error('Error fetching nilai ekskul:', error);
        }
    };

    const handleSaveNilai = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/nilai-ekskul', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    siswa_id: selectedSiswa.id,
                    tahun_ajaran_id: activeTahunAjaran.id,
                    ekskul_id: modalData.ekskul_id,
                    predikat: modalData.predikat,
                    keterangan: modalData.keterangan
                })
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchNilaiEkskul(selectedSiswa);
                setModalData({ ekskul_id: '', predikat: 'Baik', keterangan: '' });
            } else {
                const data = await res.json();
                alert(data.message || 'Gagal menyimpan nilai');
            }
        } catch (error) {
            console.error('Error saving nilai:', error);
        }
    };

    const handleDeleteNilai = async (id) => {
        if (!confirm('Yakin ingin menghapus nilai ekskul ini?')) return;
        try {
            const res = await fetch(`/api/nilai-ekskul/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchNilaiEkskul(selectedSiswa);
            }
        } catch (error) {
            console.error('Error deleting nilai:', error);
        }
    };

    const filteredSiswa = siswaList.filter(s => 
        s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nisn.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!user?.is_wali_kelas) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-slate-500">
                <Activity className="h-16 w-16 mb-4 text-emerald-500/50" />
                <h2 className="text-xl font-bold">Akses Ditolak</h2>
                <p>Hanya Wali Kelas yang dapat mengakses halaman ini.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                        <Award className="h-8 w-8 text-emerald-500" />
                        Nilai Ekstrakurikuler
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Input nilai ekstrakurikuler siswa untuk kelas perwalian
                    </p>
                </div>
            </div>

            {kelasWali ? (
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Panel Kiri: Daftar Siswa */}
                    <div className="lg:col-span-1 glass-panel rounded-2xl p-4 sm:p-6 bg-white dark:bg-[#041610] border border-slate-200 dark:border-emerald-500/10 h-[calc(100vh-12rem)] flex flex-col">
                        <div className="mb-4">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                <Users className="h-5 w-5 text-emerald-500" />
                                Kelas {kelasWali.nama_kelas}
                            </h2>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Cari siswa..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#020c08]/50 text-sm focus:outline-none focus:border-emerald-500 transition-colors text-slate-800 dark:text-white"
                                />
                                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {filteredSiswa.map(siswa => (
                                <button
                                    key={siswa.id}
                                    onClick={() => fetchNilaiEkskul(siswa)}
                                    className={`w-full text-left p-3 rounded-xl transition-all ${selectedSiswa?.id === siswa.id ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 shadow-sm' : 'hover:bg-slate-50 dark:hover:bg-[#061e16] border border-transparent'}`}
                                >
                                    <div className={`font-bold text-sm truncate ${selectedSiswa?.id === siswa.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {siswa.nama_lengkap}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5">NISN: {siswa.nisn}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Panel Kanan: Detail Nilai Ekskul */}
                    <div className="lg:col-span-2 glass-panel rounded-2xl p-4 sm:p-6 bg-white dark:bg-[#041610] border border-slate-200 dark:border-emerald-500/10 min-h-[400px]">
                        {selectedSiswa ? (
                            <div>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-emerald-500/10">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{selectedSiswa.nama_lengkap}</h3>
                                        <p className="text-sm text-slate-500 mt-1">NIS: {selectedSiswa.nis} | NISN: {selectedSiswa.nisn}</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setModalData({ ekskul_id: '', predikat: 'Baik', keterangan: '' });
                                            setIsModalOpen(true);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-md transition-colors"
                                    >
                                        <Plus className="h-4 w-4" /> Tambah Ekskul
                                    </button>
                                </div>

                                {nilaiEkskulSiswa.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="h-16 w-16 bg-slate-100 dark:bg-[#061e16] rounded-full flex items-center justify-center mb-4">
                                            <Activity className="h-8 w-8 text-slate-400 dark:text-emerald-500/50" />
                                        </div>
                                        <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">Belum Ada Data Ekstrakurikuler</h4>
                                        <p className="text-sm text-slate-500 mt-2 max-w-sm">Siswa ini belum memiliki data nilai ekstrakurikuler. Silakan tambahkan melalui tombol di atas.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {nilaiEkskulSiswa.map(nilai => (
                                            <div key={nilai.id} className="p-4 rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#020c08]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-bold text-slate-800 dark:text-white">{nilai.nama_ekskul}</h4>
                                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                                            nilai.predikat === 'Sangat Baik' ? 'bg-emerald-100 text-emerald-700' :
                                                            nilai.predikat === 'Baik' ? 'bg-blue-100 text-blue-700' :
                                                            nilai.predikat === 'Cukup' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-rose-100 text-rose-700'
                                                        }`}>
                                                            {nilai.predikat}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{nilai.keterangan || '-'}"</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            setModalData({
                                                                ekskul_id: nilai.ekskul_id,
                                                                predikat: nilai.predikat,
                                                                keterangan: nilai.keterangan
                                                            });
                                                            setIsModalOpen(true);
                                                        }}
                                                        className="px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 rounded-lg transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteNilai(nilai.id)}
                                                        className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-lg transition-colors flex items-center justify-center"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-slate-500 text-center">
                                <Users className="h-12 w-12 mb-3 text-slate-300 dark:text-slate-700" />
                                <p>Pilih siswa dari daftar di samping untuk melihat atau mengisi nilai ekskul.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="glass-panel p-8 rounded-2xl text-center text-slate-500 border border-slate-200 dark:border-emerald-500/10">
                    <p>Anda belum terdaftar sebagai wali kelas di tahun ajaran aktif.</p>
                </div>
            )}

            {/* Modal Tambah/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="relative w-full max-w-md bg-white dark:bg-[#041610] rounded-3xl p-6 border border-slate-200 dark:border-emerald-500/20 shadow-2xl animate-fade-in">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                            <X className="h-6 w-6" />
                        </button>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Input Nilai Ekstrakurikuler</h3>
                        
                        <form onSubmit={handleSaveNilai} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-emerald-400 uppercase mb-2">Kegiatan Ekstrakurikuler</label>
                                <select 
                                    required
                                    value={modalData.ekskul_id}
                                    onChange={(e) => setModalData({...modalData, ekskul_id: e.target.value})}
                                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-emerald-500/20 bg-slate-50 dark:bg-[#020c08] text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                                >
                                    <option value="">-- Pilih Ekskul --</option>
                                    {masterEkskul.map(e => (
                                        <option key={e.id} value={e.id}>{e.nama_ekskul}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-emerald-400 uppercase mb-2">Predikat</label>
                                <select 
                                    required
                                    value={modalData.predikat}
                                    onChange={(e) => setModalData({...modalData, predikat: e.target.value})}
                                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-emerald-500/20 bg-slate-50 dark:bg-[#020c08] text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                                >
                                    <option value="Sangat Baik">Sangat Baik (A)</option>
                                    <option value="Baik">Baik (B)</option>
                                    <option value="Cukup">Cukup (C)</option>
                                    <option value="Kurang">Kurang (D)</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-emerald-400 uppercase mb-2">Keterangan / Deskripsi</label>
                                <textarea 
                                    rows="3"
                                    required
                                    value={modalData.keterangan}
                                    onChange={(e) => setModalData({...modalData, keterangan: e.target.value})}
                                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-emerald-500/20 bg-slate-50 dark:bg-[#020c08] text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                                    placeholder="Contoh: Mengikuti kegiatan dengan sangat antusias dan disiplin."
                                ></textarea>
                            </div>
                            
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Batal</button>
                                <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-colors">
                                    <Save className="h-4 w-4" /> Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
