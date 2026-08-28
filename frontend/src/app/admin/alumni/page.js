"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Search, GraduationCap, Users, Archive, CheckCircle, RefreshCcw, Eye, Download, X, FileText } from 'lucide-react';
import CetakRaportAlumniModal from '@/components/CetakRaportAlumniModal';
import { useSearchParams } from 'next/navigation';

export default function AdminAlumniPage() {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');
    
    const { token } = useAuth();
    const [siswaAlumni, setSiswaAlumni] = useState([]);
    const [guruAlumni, setGuruAlumni] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('siswa'); // 'siswa' or 'guru'
    
    useEffect(() => {
        if (tabParam === 'siswa' || tabParam === 'guru') {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    const [selectedSiswaIds, setSelectedSiswaIds] = useState([]);
    const [selectedGuruIds, setSelectedGuruIds] = useState([]);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [activeDetailTab, setActiveDetailTab] = useState('siswa');
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [showRaportModal, setShowRaportModal] = useState(false);

    const API_URL = '/api';

    const [actionMessage, setActionMessage] = useState('');

    const fetchAlumni = async () => {
        try {
            const [ressiswa, resGuru] = await Promise.all([
                fetch(`${API_URL}/siswa`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/auth/users`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            
            const datasiswa = await ressiswa.json();
            const dataUsers = await resGuru.json();
            
            // Filter Lulus/Keluar for Siswa
            const alumniSiswa = (Array.isArray(datasiswa) ? datasiswa : []).filter(s => {
                const status = (s.status_aktif || 'aktif').toLowerCase();
                return status === 'lulus' || status === 'keluar' || status === 'non-aktif';
            });
            
            // Filter Lulus/Keluar for Guru
            const alumniGuru = (Array.isArray(dataUsers) ? dataUsers : []).filter(u => {
                const status = (u.status_aktif || 'aktif').toLowerCase();
                return u.role === 'guru' && (status === 'lulus' || status === 'keluar' || status === 'non-aktif');
            });
            
            setSiswaAlumni(alumniSiswa);
            setGuruAlumni(alumniGuru);
        } catch (err) {
            console.error('Error fetching alumni data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchAlumni();
    }, [token]);

    const handleRestoreSiswa = async (s) => {
        if (!confirm(`Apakah Anda yakin ingin memulihkan status siswa ${s.nama_lengkap} menjadi Aktif?`)) return;
        try {
            const res = await fetch(`${API_URL}/mutasi/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    siswa_ids: [s.id],
                    status: 'aktif'
                })
            });
            if (res.ok) {
                setActionMessage(`Siswa ${s.nama_lengkap} berhasil dipulihkan!`);
                setTimeout(() => setActionMessage(''), 3000);
                fetchAlumni();
            } else {
                const errData = await res.json();
                alert(`Gagal memulihkan siswa: ${errData.message || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Error restoring siswa:', err);
        }
    };

    const handleRestoreSiswaMassal = async () => {
        if (selectedSiswaIds.length === 0) return;
        if (!confirm(`Apakah Anda yakin ingin memulihkan status ${selectedSiswaIds.length} siswa menjadi Aktif?`)) return;
        try {
            const res = await fetch(`${API_URL}/mutasi/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    siswa_ids: selectedSiswaIds,
                    status: 'aktif'
                })
            });
            if (res.ok) {
                setActionMessage(`${selectedSiswaIds.length} siswa berhasil dipulihkan!`);
                setSelectedSiswaIds([]);
                setTimeout(() => setActionMessage(''), 3000);
                fetchAlumni();
            } else {
                const errData = await res.json();
                alert(`Gagal memulihkan siswa: ${errData.message || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Error restoring siswa massal:', err);
        }
    };

    const handleRestoreGuru = async (u) => {
        if (!confirm(`Apakah Anda yakin ingin memulihkan status guru ${u.nama_lengkap} menjadi Aktif?`)) return;
        try {
            const payload = { ...u, status_aktif: 'aktif' };
            const res = await fetch(`${API_URL}/auth/users/${u.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setActionMessage(`Guru ${u.nama_lengkap} berhasil dipulihkan!`);
                setTimeout(() => setActionMessage(''), 3000);
                fetchAlumni();
            } else {
                const errData = await res.json();
                alert(`Gagal memulihkan guru: ${errData.message || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Error restoring guru:', err);
        }
    };

    const handleRestoreGuruMassal = async () => {
        if (selectedGuruIds.length === 0) return;
        if (!confirm(`Apakah Anda yakin ingin memulihkan status ${selectedGuruIds.length} guru menjadi Aktif?`)) return;
        try {
            let successCount = 0;
            for (const id of selectedGuruIds) {
                const guru = guruAlumni.find(g => g.id === id);
                if (!guru) continue;
                const payload = { ...guru, status_aktif: 'aktif' };
                const res = await fetch(`${API_URL}/auth/users/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
                if (res.ok) successCount++;
            }
            if (successCount > 0) {
                setActionMessage(`${successCount} guru berhasil dipulihkan!`);
                setSelectedGuruIds([]);
                setTimeout(() => setActionMessage(''), 3000);
                fetchAlumni();
            }
        } catch (err) {
            console.error('Error restoring guru massal:', err);
        }
    };

    const handleDownloadCSV = () => {
        let data = [];
        if (activeTab === 'siswa') {
            data = filteredSiswa.map((s, i) => ({
                No: i + 1,
                NIS: s.nis || '-',
                'Nama Lengkap': s.nama_lengkap,
                'Kelas Terakhir': s.kelas || '-',
                'Nama Wali': s.nama_wali || '-',
                'No HP': s.no_hp || '-',
                Status: s.status_aktif === 'keluar' ? 'Pindah' : (s.status_aktif ? s.status_aktif.toUpperCase() : '-')
            }));
        } else {
            data = filteredGuru.map((g, i) => ({
                No: i + 1,
                'Nama Lengkap': g.nama_lengkap,
                'L/P': g.jenis_kelamin === 'L' ? 'Laki-laki' : g.jenis_kelamin === 'P' ? 'Perempuan' : '-',
                'No HP': g.no_hp || '-',
                Status: g.status_aktif === 'keluar' ? 'Pindah' : (g.status_aktif ? g.status_aktif.toUpperCase() : '-')
            }));
        }

        if (data.length === 0) return alert('Tidak ada data untuk diunduh');

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Data_Alumni_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const filteredSiswa = siswaAlumni.filter(s => 
        s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.nis && s.nis.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredGuru = guruAlumni.filter(u => 
        u.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.nip && u.nip.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            {/* Global Toast Alerts (Auto dismiss) */}
            {actionMessage && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 bg-white text-slate-700 rounded-xl shadow-xl animate-fade-in flex items-center gap-3 font-semibold border border-slate-200 w-max max-w-[90vw]">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span className="whitespace-nowrap">{actionMessage}</span>
                </div>
            )}
            
            <div className="flex flex-col gap-4 no-print">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                        <Archive className="h-7 w-7 text-emerald-600" />
                        {activeTab === 'siswa' ? 'Data Siswa Alumni' : 'Data Guru Non-aktif'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        {activeTab === 'siswa' ? 'Menampilkan daftar siswa alumni.' : 'Menampilkan daftar guru non-aktif.'}
                    </p>
                </div></div>

            {/* Controls (Tabs & Search) */}
            <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4 mb-4">
                
                {/* Actions: Restore, Search & Download */}
                <div className="flex flex-col-reverse sm:flex-row items-center gap-2 w-full sm:w-auto">
                    
                    {/* Action Bar (Visible only when items are selected) */}
                    {activeTab === 'siswa' && selectedSiswaIds.length > 0 && (
                        <button
                            onClick={handleRestoreSiswaMassal}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm w-full sm:w-auto justify-center whitespace-nowrap animate-fade-in"
                        >
                            <RefreshCcw className="h-4 w-4 shrink-0" />
                            Pulihkan ({selectedSiswaIds.length})
                        </button>
                    )}
                    
                    {activeTab === 'guru' && selectedGuruIds.length > 0 && (
                        <button
                            onClick={handleRestoreGuruMassal}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm w-full sm:w-auto justify-center whitespace-nowrap animate-fade-in"
                        >
                            <RefreshCcw className="h-4 w-4 shrink-0" />
                            Pulihkan ({selectedGuruIds.length})
                        </button>
                    )}

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-[300px]">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder={`Cari ${activeTab === 'siswa' ? 'siswa' : 'guru'}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#020c08]/50 py-2.5 pl-10 pr-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all shadow-sm"
                            />
                        </div>
                        {activeTab === 'siswa' && (
                        <button
                            onClick={handleDownloadCSV}
                            title="Unduh Data CSV"
                            className="bg-white dark:bg-[#020c08]/50 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-emerald-500/20 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 p-2.5 rounded-xl transition-colors shadow-sm shrink-0"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="w-full">
                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto w-full border-2 border-slate-200 dark:border-emerald-500/10 rounded-xl overflow-hidden">
                        {activeTab === 'siswa' ? (
                            <table className="w-full text-left text-xs whitespace-nowrap min-w-max border-separate border-spacing-0">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-[#061e16]">
                                        <th className="py-2 px-3 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center bg-slate-50 dark:bg-[#061e16] w-10">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                checked={filteredSiswa.length > 0 && selectedSiswaIds.length === filteredSiswa.length}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedSiswaIds(filteredSiswa.map(s => s.id));
                                                    else setSelectedSiswaIds([]);
                                                }}
                                            />
                                        </th>
                                        <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center bg-slate-50 dark:bg-[#061e16] text-slate-800 dark:text-slate-300 font-extrabold uppercase">No</th>
                                        <th className="py-2 px-3 border-b border-r-[3px] border-slate-400 dark:border-emerald-500/30 text-left bg-slate-50 dark:bg-[#061e16] text-slate-800 dark:text-slate-300 font-extrabold uppercase">Nama Lengkap</th>
                                        <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Kelas Terakhir</th>
                                        <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Nama Wali</th>
                                        <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">No Telp</th>
                                        <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Status</th>
                                        <th className="py-2 px-2 border-b border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSiswa.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="text-center py-8 text-slate-500 bg-white dark:bg-[#041610] border-b border-slate-300 dark:border-emerald-500/10">
                                                Tidak ada data alumni siswa ditemukan.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredSiswa.map((s, idx) => (
                                            <tr key={s.id} className={`transition-colors group hover:bg-slate-50 dark:hover:bg-[#082a1f] ${selectedSiswaIds.includes(s.id) ? 'bg-emerald-50/50 dark:bg-[#06241a]' : 'bg-white dark:bg-[#041610]'}`}>
                                                <td className="py-1.5 px-3 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center">
                                                    <input 
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                        checked={selectedSiswaIds.includes(s.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setSelectedSiswaIds([...selectedSiswaIds, s.id]);
                                                            else setSelectedSiswaIds(selectedSiswaIds.filter(id => id !== s.id));
                                                        }}
                                                    />
                                                </td>
                                                <td className="py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center font-semibold text-slate-500">{idx + 1}</td>
                                                <td className="py-1.5 px-3 border-b border-r-[3px] border-slate-400 dark:border-emerald-500/30 text-left font-extrabold text-slate-850 dark:text-white">{s.nama_lengkap}</td>
                                                <td className="py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center font-medium text-slate-600 dark:text-slate-300">{s.kelas || '-'}</td>
                                                <td className="py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-left font-medium text-slate-600 dark:text-slate-300">
                                                    {s.nama_wali ? s.nama_wali : <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">Belum dipetakan</span>}
                                                </td>
                                                <td className="py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center font-medium text-slate-600 dark:text-slate-300">
                                                    {s.no_hp ? (
                                                        <a href={`https://wa.me/${s.no_hp.replace(/^0/, '62')}`} target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                                                            {s.no_hp}
                                                        </a>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">-</span>
                                                    )}
                                                </td>
                                                <td className="py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center">
                                                    <span className={`inline-flex rounded-lg px-2 py-0.5 text-[10px] font-extrabold tracking-wide leading-none uppercase border
                                                        ${s.status_aktif === 'lulus' ? 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' : 'bg-orange-100 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20'}
                                                    `}>
                                                        {s.status_aktif === 'keluar' ? 'Pindah' : s.status_aktif}
                                                    </span>
                                                </td>
                                                <td className="py-1.5 px-2 text-center border-b border-slate-300 dark:border-emerald-500/10">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            onClick={() => { setSelectedDetail(s); setDetailModalOpen(true); }}
                                                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-500/20 transition-colors"
                                                            title="Detail"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => { setSelectedDetail(s); setShowRaportModal(true); }}
                                                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-500/20 transition-colors"
                                                            title="Cetak Raport"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRestoreSiswa(s)}
                                                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/20 transition-colors"
                                                            title="Pulihkan"
                                                        >
                                                            <RefreshCcw className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full text-left text-xs whitespace-nowrap min-w-max border-separate border-spacing-0">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-[#061e16]">
                                        <th className="py-2 px-3 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center bg-slate-50 dark:bg-[#061e16] w-10">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                checked={filteredGuru.length > 0 && selectedGuruIds.length === filteredGuru.length}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedGuruIds(filteredGuru.map(g => g.id));
                                                    else setSelectedGuruIds([]);
                                                }}
                                            />
                                        </th>
                                        <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center bg-slate-50 dark:bg-[#061e16] text-slate-800 dark:text-slate-300 font-extrabold uppercase">No</th>
                                        <th className="py-2 px-3 border-b border-r-[3px] border-slate-400 dark:border-emerald-500/30 text-left bg-slate-50 dark:bg-[#061e16] text-slate-800 dark:text-slate-300 font-extrabold uppercase">Nama Lengkap</th>
                                        <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">L/P</th>
                                        <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">No. HP</th>
                                        <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Status</th>
                                        <th className="py-2 px-2 border-b border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredGuru.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-8 text-slate-500 bg-white dark:bg-[#041610] border-b border-slate-300 dark:border-emerald-500/10">
                                                Tidak ada data guru keluar/non-aktif ditemukan.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredGuru.map((u, idx) => (
                                            <tr key={u.id} className={`transition-colors group hover:bg-slate-50 dark:hover:bg-[#082a1f] ${selectedGuruIds.includes(u.id) ? 'bg-emerald-50/50 dark:bg-[#06241a]' : 'bg-white dark:bg-[#041610]'}`}>
                                                <td className="py-1.5 px-3 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center">
                                                    <input 
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                        checked={selectedGuruIds.includes(u.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setSelectedGuruIds([...selectedGuruIds, u.id]);
                                                            else setSelectedGuruIds(selectedGuruIds.filter(id => id !== u.id));
                                                        }}
                                                    />
                                                </td>
                                                <td className="py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center font-semibold text-slate-500">{idx + 1}</td>
                                                <td className="py-1.5 px-3 border-b border-r-[3px] border-slate-400 dark:border-emerald-500/30 text-left font-extrabold text-slate-850 dark:text-white">{u.nama_lengkap}</td>
                                                <td className="py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center font-medium text-slate-600 dark:text-slate-300">
                                                    {u.jenis_kelamin === 'L' ? 'Laki-laki' : u.jenis_kelamin === 'P' ? 'Perempuan' : '-'}
                                                </td>
                                                <td className="py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center font-medium text-slate-600 dark:text-slate-300">
                                                    {u.no_hp ? (
                                                        <a href={`https://wa.me/${u.no_hp.replace(/^0/, '62')}`} target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                                                            {u.no_hp}
                                                        </a>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">-</span>
                                                    )}
                                                </td>
                                                <td className="py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center">
                                                    <span className={`inline-flex rounded-lg px-2 py-0.5 text-[10px] font-extrabold tracking-wide leading-none uppercase border
                                                        ${u.status_aktif === 'lulus' ? 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' : 'bg-orange-100 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20'}
                                                    `}>
                                                        {u.status_aktif === 'keluar' ? 'Pindah' : u.status_aktif}
                                                    </span>
                                                </td>
                                                <td className="py-1.5 px-2 text-center border-b border-slate-300 dark:border-emerald-500/10">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            onClick={() => { setSelectedDetail(u); setDetailModalOpen(true); }}
                                                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-500/20 transition-colors"
                                                            title="Detail"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRestoreGuru(u)}
                                                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/20 transition-colors"
                                                            title="Pulihkan"
                                                        >
                                                            <RefreshCcw className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {detailModalOpen && selectedDetail && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
                    <div className="bg-white dark:bg-[#061e16] rounded-[24px] w-full max-w-sm sm:max-w-md shadow-2xl overflow-hidden border border-slate-200/60 dark:border-emerald-500/20 animate-fade-in-up">
                        
                        {/* Header with Gradient */}
                        <div className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-400/5 to-transparent"></div>
                            
                            <div className="px-6 pt-6 pb-4 relative z-10 flex flex-col items-center text-center">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md ring-2 ring-white dark:ring-[#061e16] mb-3">
                                    {selectedDetail.nama_lengkap.charAt(0)}
                                </div>
                                <h3 className="font-extrabold text-lg text-slate-800 dark:text-white leading-tight mb-2">
                                    {selectedDetail.nama_lengkap}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-bold tracking-wide">
                                        {activeTab === 'siswa' ? 'SISWA ALUMNI' : 'GURU NON-AKTIF'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Body Details */}
                        <div className="px-6 pb-6 pt-1 bg-slate-50/50 dark:bg-[#041610]">
                            <div className="bg-white dark:bg-[#061e16] rounded-xl border border-slate-100 dark:border-emerald-500/10 shadow-sm p-2 text-sm">
                                {activeTab === 'siswa' ? (
                                    <div className="flex flex-col max-h-[50vh]">
                                        {/* Tabs */}
                                        <div className="flex gap-6 px-6 pt-2 border-b border-slate-100 dark:border-emerald-500/10">
                                            <button 
                                                type="button"
                                                onClick={() => setActiveDetailTab('siswa')}
                                                className={`py-2 px-4 text-xs uppercase tracking-wider font-bold border-b-2 transition-colors ${activeDetailTab === 'siswa' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                            >
                                                Biodata Siswa
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setActiveDetailTab('ortu')}
                                                className={`py-2 px-4 text-xs uppercase tracking-wider font-bold border-b-2 transition-colors ${activeDetailTab === 'ortu' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                            >
                                                Orang Tua & Wali
                                            </button>
                                        </div>
                                        
                                        <div className="flex-1 overflow-y-auto overscroll-contain p-5">
                                            {activeDetailTab === 'siswa' ? (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">NIS (Wajib)</label>
                                                            <div className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#020c08]/50 py-2 px-3 text-slate-700 dark:text-slate-200 text-xs font-medium">{selectedDetail.nis || '-'}</div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">NISN</label>
                                                            <div className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#020c08]/50 py-2 px-3 text-slate-700 dark:text-slate-200 text-xs font-medium">{selectedDetail.nisn || '-'}</div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div className="col-span-2">
                                                            <label className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Nama Lengkap</label>
                                                            <div className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#020c08]/50 py-2 px-3 text-slate-700 dark:text-slate-200 text-xs font-medium">{selectedDetail.nama_lengkap || '-'}</div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Kelas Terakhir</label>
                                                            <div className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#020c08]/50 py-2 px-3 text-slate-700 dark:text-slate-200 text-xs font-medium">{selectedDetail.kelas || '-'}</div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div>
                                                            <label className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Tempat Lahir</label>
                                                            <div className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#020c08]/50 py-2 px-3 text-slate-700 dark:text-slate-200 text-xs font-medium">{selectedDetail.tempat_lahir || '-'}</div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Tgl Lahir</label>
                                                            <div className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#020c08]/50 py-2 px-3 text-slate-700 dark:text-slate-200 text-xs font-medium">{selectedDetail.tanggal_lahir ? new Date(selectedDetail.tanggal_lahir).toLocaleDateString('id-ID') : '-'}</div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">L/P</label>
                                                            <div className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#020c08]/50 py-2 px-3 text-slate-700 dark:text-slate-200 text-xs font-medium">{selectedDetail.jenis_kelamin === 'L' ? 'Laki-laki' : selectedDetail.jenis_kelamin === 'P' ? 'Perempuan' : '-'}</div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Agama</label>
                                                            <div className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#020c08]/50 py-2 px-3 text-slate-700 dark:text-slate-200 text-xs font-medium">{selectedDetail.agama || '-'}</div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Sekolah Sebelumnya (SD/MI)</label>
                                                            <div className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#020c08]/50 py-2 px-3 text-slate-700 dark:text-slate-200 text-xs font-medium">{selectedDetail.pendidikan_sebelumnya || '-'}</div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div className="col-span-2">
                                                            <label className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Alamat Lengkap Siswa</label>
                                                            <div className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#020c08]/50 py-2 px-3 text-slate-700 dark:text-slate-200 text-xs font-medium min-h-[34px]">{selectedDetail.alamat_siswa || '-'}</div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Status Keaktifan</label>
                                                            <div className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#020c08]/50 py-2 px-3 text-slate-700 dark:text-slate-200 text-xs font-medium">{selectedDetail.status_aktif === 'keluar' ? 'Pindah' : (selectedDetail.status_aktif || '-')}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Nama Ayah</label>
                                                            <div className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#020c08]/50 py-2 px-3 text-slate-700 dark:text-slate-200 text-xs font-medium">{selectedDetail.nama_ayah || '-'}</div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Pekerjaan Ayah</label>
                                                            <div className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#020c08]/50 py-2 px-3 text-slate-700 dark:text-slate-200 text-xs font-medium">{selectedDetail.pekerjaan_ayah || '-'}</div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Nama Ibu</label>
                                                            <div className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#020c08]/50 py-2 px-3 text-slate-700 dark:text-slate-200 text-xs font-medium">{selectedDetail.nama_ibu || '-'}</div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Pekerjaan Ibu</label>
                                                            <div className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#020c08]/50 py-2 px-3 text-slate-700 dark:text-slate-200 text-xs font-medium">{selectedDetail.pekerjaan_ibu || '-'}</div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Kelurahan Ortu</label>
                                                            <div className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#020c08]/50 py-2 px-3 text-slate-700 dark:text-slate-200 text-xs font-medium">{selectedDetail.kelurahan_ortu || '-'}</div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Kecamatan Ortu</label>
                                                            <div className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#020c08]/50 py-2 px-3 text-slate-700 dark:text-slate-200 text-xs font-medium">{selectedDetail.kecamatan_ortu || '-'}</div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Kab/Kota Ortu</label>
                                                            <div className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#020c08]/50 py-2 px-3 text-slate-700 dark:text-slate-200 text-xs font-medium">{selectedDetail.kabupaten_ortu || '-'}</div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Provinsi Ortu</label>
                                                            <div className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#020c08]/50 py-2 px-3 text-slate-700 dark:text-slate-200 text-xs font-medium">{selectedDetail.provinsi_ortu || '-'}</div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Nama Wali</label>
                                                            <div className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#020c08]/50 py-2 px-3 text-slate-700 dark:text-slate-200 text-xs font-medium">{selectedDetail.nama_wali || '-'}</div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">No HP</label>
                                                            <div className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#020c08]/50 py-2 px-3 text-slate-700 dark:text-slate-200 text-xs font-medium">{selectedDetail.no_hp || '-'}</div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="col-span-1">
                                                            <label className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Alamat Lengkap Wali</label>
                                                            <div className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#020c08]/50 py-2 px-3 text-slate-700 dark:text-slate-200 text-xs font-medium min-h-[34px]">{selectedDetail.alamat_wali || '-'}</div>
                                                        </div>
                                                        <div className="col-span-1">
                                                            <label className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Pekerjaan Wali</label>
                                                            <div className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#020c08]/50 py-2 px-3 text-slate-700 dark:text-slate-200 text-xs font-medium min-h-[34px]">{selectedDetail.pekerjaan_wali || '-'}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100 dark:divide-emerald-500/5">
                                        <div className="flex gap-2 py-2 px-3 hover:bg-slate-50 dark:hover:bg-emerald-500/5 rounded-lg transition-colors items-center">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium w-28 flex justify-between shrink-0">
                                                <span>NIP</span>
                                                <span>:</span>
                                            </span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200">{selectedDetail.nip || '-'}</span>
                                        </div>
                                        <div className="flex gap-2 py-2 px-3 hover:bg-slate-50 dark:hover:bg-emerald-500/5 rounded-lg transition-colors items-center">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium w-28 flex justify-between shrink-0">
                                                <span>Jenis Kelamin</span>
                                                <span>:</span>
                                            </span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200">{selectedDetail.jenis_kelamin === 'L' ? 'Laki-laki' : selectedDetail.jenis_kelamin === 'P' ? 'Perempuan' : '-'}</span>
                                        </div>
                                        <div className="flex gap-2 py-2 px-3 hover:bg-slate-50 dark:hover:bg-emerald-500/5 rounded-lg transition-colors items-center">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium w-28 flex justify-between shrink-0">
                                                <span>No HP</span>
                                                <span>:</span>
                                            </span>
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedDetail.no_hp || '-'}</span>
                                        </div>
                                        <div className="flex gap-2 py-2 px-3 hover:bg-slate-50 dark:hover:bg-emerald-500/5 rounded-lg transition-colors items-center">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium w-28 flex justify-between shrink-0">
                                                <span>Status Akhir</span>
                                                <span>:</span>
                                            </span>
                                            <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-extrabold tracking-wide uppercase border
                                                ${selectedDetail.status_aktif === 'lulus' ? 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' : 'bg-orange-100 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20'}
                                            `}>
                                                {selectedDetail.status_aktif === 'keluar' ? 'Pindah' : selectedDetail.status_aktif}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-emerald-500/10 bg-white dark:bg-[#061e16] flex justify-end">
                            <button
                                onClick={() => setDetailModalOpen(false)}
                                className="px-6 py-2 bg-slate-100 dark:bg-[#020c08] text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-[#041610] font-bold text-sm transition-all shadow-sm"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showRaportModal && selectedDetail && activeTab === 'siswa' && (
                <CetakRaportAlumniModal 
                    student={selectedDetail} 
                    onClose={() => setShowRaportModal(false)} 
                />
            )}
        </div>
    );
}


