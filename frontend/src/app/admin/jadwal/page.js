"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Search, Edit2, Trash2, X, Plus, Clock, Building, User, CheckCircle, Filter } from 'lucide-react';
import { useLongPress } from '@/hooks/useLongPress';
import { useTahunAjaran } from '@/hooks/useTahunAjaran';
import { getAbbreviatedMapel } from '@/utils/mapelHelper';

const HARI_OPTIONS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export default function AdminJadwalPage() {
    const { token } = useAuth();
    const [jadwalList, setJadwalList] = useState([]);
    const [guruList, setGuruList] = useState([]);
    const [kelasList, setKelasList] = useState([]);
    const [mapelList, setMapelList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedHariTab, setSelectedHariTab] = useState('Senin');
    const [selectedIds, setSelectedIds] = useState([]);

    const { 
        tahunAjaranList, 
        activeTahunAjaran,
        selectedTahunAjaranId, 
        setSelectedTahunAjaranId,
        loadingTahunAjaran
    } = useTahunAjaran();

    const isCurrentYearActive = activeTahunAjaran?.id?.toString() === selectedTahunAjaranId;

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

    const getSubjectColor = (subjectName) => {
        if (!subjectName) return 'text-slate-400';
        const colors = [
            'text-emerald-500', 'text-blue-500', 'text-purple-500',
            'text-rose-500', 'text-amber-500', 'text-cyan-500',
            'text-indigo-500', 'text-fuchsia-500', 'text-orange-500', 'text-teal-500',
            'text-lime-500', 'text-sky-500', 'text-pink-500'
        ];
        let hash = 0;
        for (let i = 0; i < subjectName.length; i++) {
            hash = subjectName.charCodeAt(i) + ((hash << 5) - hash) + i;
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const [modalOpen, setModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedJadwal, setSelectedJadwal] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Form fields
    const [hari, setHari] = useState('Senin');
    const [jamMulai, setJamMulai] = useState('');
    const [jamSelesai, setJamSelesai] = useState('');
    const [mataPelajaran, setMataPelajaran] = useState('');
    const [kelas, setKelas] = useState('');
    const [guruId, setGuruId] = useState('');
    
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    const API_URL = '/api';

    const fetchJadwal = async () => {
        if (!selectedTahunAjaranId) return;
        try {
            const res = await fetch(`${API_URL}/jadwal?tahun_ajaran_id=${selectedTahunAjaranId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            setJadwalList(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching jadwal:', err);
        }
    };

    const fetchGuru = async () => {
        try {
            const res = await fetch(`${API_URL}/auth/users`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (res.ok) {
                setGuruList(data.filter(u => u.role === 'guru'));
            }
        } catch (err) {
            console.error('Error fetching guru:', err);
        }
    };

    const fetchKelas = async () => {
        try {
            const res = await fetch(`${API_URL}/kelas`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            setKelasList(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching kelas:', err);
        }
    };

    const fetchMapel = async () => {
        try {
            const res = await fetch(`${API_URL}/mapel`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            setMapelList(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching mapel:', err);
        }
    };

    useEffect(() => {
        if (token && selectedTahunAjaranId) {
            const init = async () => {
                setLoading(true);
                await Promise.all([fetchJadwal(), fetchGuru(), fetchKelas(), fetchMapel()]);
                setLoading(false);
            };
            init();
        }
    }, [token, selectedTahunAjaranId]);

    const openAddModal = () => {
        setIsEditing(false);
        setSelectedJadwal(null);
        setHari('Senin');
        setJamMulai('');
        setJamSelesai('');
        setMataPelajaran('');
        setKelas('');
        setGuruId('');
        setFormError('');
        setFormSuccess('');
        setModalOpen(true);
    };

    const openEditModal = (j) => {
        setIsEditing(true);
        setSelectedJadwal(j);
        setHari(j.hari || 'Senin');
        setJamMulai(j.jam_mulai ? j.jam_mulai.slice(0, 5) : '');
        setJamSelesai(j.jam_selesai ? j.jam_selesai.slice(0, 5) : '');
        setMataPelajaran(j.mata_pelajaran || '');
        setKelas(j.kelas || '');
        setGuruId(j.guru_id || '');
        setFormError('');
        setFormSuccess('');
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormSuccess('');
        setSubmitting(true);

        const payload = {
            hari,
            jam_mulai: jamMulai,
            jam_selesai: jamSelesai,
            mata_pelajaran: mataPelajaran,
            kelas,
            guru_id: guruId,
            tahun_ajaran_id: selectedTahunAjaranId
        };

        try {
            const url = isEditing ? `${API_URL}/jadwal/${selectedJadwal.id}` : `${API_URL}/jadwal`;
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Gagal menyimpan jadwal.');

            setModalOpen(false);
            fetchJadwal();
            
            setTimeout(() => {
                setFormSuccess(isEditing ? 'Jadwal berhasil diperbarui!' : 'Jadwal berhasil ditambahkan!');
                setTimeout(() => setFormSuccess(''), 3000);
            }, 100);
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return;
        try {
            const res = await fetch(`${API_URL}/jadwal/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                fetchJadwal();
                setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
            }
        } catch (err) {
            console.error('Error deleting jadwal:', err);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} jadwal yang dipilih?`)) return;
        try {
            await Promise.all(
                selectedIds.map(id =>
                    fetch(`${API_URL}/jadwal/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                )
            );
            fetchJadwal();
            setSelectedIds([]);
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan saat menghapus data massal.');
        }
    };

    const getMapelAcronym = (namaMapel) => {
        if (!namaMapel) return '';
        // Ambil huruf pertama dari tiap kata, abaikan spasi berlebih
        return namaMapel.trim().split(/\s+/).map(word => word[0]).join('').toLowerCase();
    };

    const mapelAliases = {
        'mtk': 'matematika',
        'pai': 'pendidikan agama islam',
        'pjok': 'pendidikan jasmani',
        'penjas': 'pendidikan jasmani',
        'pkn': 'pendidikan kewarganegaraan',
        'ppkn': 'pendidikan pancasila',
        'bing': 'bahasa inggris',
        'inggris': 'bahasa inggris',
        'indo': 'bahasa indonesia',
        'bindo': 'bahasa indonesia',
        'tik': 'teknologi informasi',
        'sbd': 'seni budaya',
        'sbk': 'seni budaya'
    };

    const filteredJadwal = jadwalList.filter(j => {
        const matchHariTab = searchQuery ? true : j.hari === selectedHariTab;
        const q = searchQuery.toLowerCase().trim();

        if (!q) return matchHariTab;

        const matchHari = j.hari.toLowerCase().includes(q);
        const matchKelas = j.kelas.toLowerCase().includes(q);
        const matchGuru = j.nama_guru && j.nama_guru.toLowerCase().includes(q);
        const matchMapelStr = j.mata_pelajaran.toLowerCase().includes(q);

        // 1. Cek singkatan otomatis (contoh: Ilmu Pengetahuan Alam -> ipa)
        const mapelAcronym = getMapelAcronym(j.mata_pelajaran);
        const matchAcronym = mapelAcronym === q || mapelAcronym.includes(q);

        // 2. Cek kamus manual (contoh: q = 'mtk' -> translated = 'matematika')
        let matchAlias = false;
        // Cari di keys alias yang mengandung text pencarian
        for (const [aliasKey, aliasValue] of Object.entries(mapelAliases)) {
            // Jika kata kunci persis dengan alias (mtk) ATAU nilai alias mengandung kata kunci
            if (aliasKey === q || aliasKey.includes(q)) {
                if (j.mata_pelajaran.toLowerCase().includes(aliasValue)) {
                    matchAlias = true;
                    break;
                }
            }
        }

        const matchSearch = matchHari || matchMapelStr || matchKelas || matchGuru || matchAcronym || matchAlias;
        
        return matchHariTab && matchSearch;
    });

    const HARI_ORDER = { 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6, 'Minggu': 7 };
    
    const getKelasValue = (kelasString) => {
        const k = typeof kelasString === 'string' ? decodeURIComponent(kelasString).toUpperCase() : '';
        if (k.includes('IX')) return 9;
        if (k.includes('VIII')) return 8;
        if (k.includes('VII')) return 7;
        return 99;
    };

    const sortedFilteredJadwal = [...filteredJadwal].sort((a, b) => {
        // 1. Sort by Hari
        const hariA = HARI_ORDER[a.hari] || 99;
        const hariB = HARI_ORDER[b.hari] || 99;
        if (hariA !== hariB) return hariA - hariB;

        // 2. Sort by Kelas
        const kelasA = getKelasValue(a.kelas);
        const kelasB = getKelasValue(b.kelas);
        if (kelasA !== kelasB) return kelasA - kelasB;

        // 3. Sort by Jam Mulai
        const jamA = a.jam_mulai || '99:99';
        const jamB = b.jam_mulai || '99:99';
        return jamA.localeCompare(jamB);
    });

    const jadwalGroups = [];
    let currentGroup = null;

    sortedFilteredJadwal.forEach(j => {
        const groupKey = `${j.hari} - Kelas ${decodeURIComponent(j.kelas)}`;
        if (!currentGroup || currentGroup.key !== groupKey) {
            currentGroup = { key: groupKey, items: [] };
            jadwalGroups.push(currentGroup);
        }
        currentGroup.items.push(j);
    });

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
                    <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Jadwal Pelajaran</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">kelola jadwal pelajaran untuk guru dan siswa.</p>
                </div>
            </div>

            {!isCurrentYearActive && !loadingTahunAjaran && selectedTahunAjaranId && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 p-4 rounded-xl flex items-center justify-center gap-2 font-medium text-sm animate-fade-in">
                    Mode Arsip (Read-Only). Tahun Ajaran ini sudah tidak aktif, data tidak dapat diubah.
                </div>
            )}

            <div className="w-full mt-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full mb-6">
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-72 shrink-0">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Filter className="h-4 w-4 text-slate-400" />
                            </div>
                            <select
                                value={selectedTahunAjaranId}
                                onChange={(e) => setSelectedTahunAjaranId(e.target.value)}
                                disabled={loadingTahunAjaran}
                                className="block w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#020c08]/50 py-2 sm:py-2.5 pl-9 pr-10 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm appearance-none cursor-pointer disabled:opacity-50"
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
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        <div className="relative w-full sm:w-[400px]">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search className="h-4 w-4 text-slate-400" />
                            </div>
                            <input type="text" placeholder="Cari hari, mata pelajaran, kelas, atau guru..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#020c08]/50 py-2 sm:py-2.5 pl-9 pr-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                        {isCurrentYearActive && selectedIds.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-red-600 hover:bg-red-500 py-2 sm:py-2.5 px-4 text-xs sm:text-sm font-semibold text-white transition-colors shrink-0 shadow-lg shadow-red-500/30 w-full sm:w-auto"
                            >
                                <Trash2 className="h-4 w-4" />
                                Hapus Terpilih ({selectedIds.length})
                            </button>
                        )}
                        {isCurrentYearActive && (
                            <button onClick={openAddModal} className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2 sm:py-2.5 px-4 text-xs sm:text-sm font-semibold text-white transition-colors shrink-0 shadow-lg shadow-emerald-500/30 w-full sm:w-auto">
                                <Plus className="h-4 w-4" /> Tambah Jadwal
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                    </div>
                ) : (
                    <>
                        {/* Tabs Hari */}
                        {!searchQuery && (
                            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 mb-4">
                                {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(hari => (
                                    <button
                                        key={hari}
                                        onClick={() => setSelectedHariTab(hari)}
                                        className={`py-2 px-4 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                                            selectedHariTab === hari 
                                                ? 'bg-emerald-600 text-white shadow-md' 
                                                : 'bg-white dark:bg-[#041610] text-slate-500 hover:bg-slate-50 dark:hover:bg-[#051a13] border border-slate-200 dark:border-emerald-500/10'
                                        }`}
                                    >
                                        {hari}
                                    </button>
                                ))}
                            </div>
                        )}

                        {jadwalGroups.length === 0 ? (
                            <div className="bg-white dark:bg-[#020c08]/50 rounded-xl border border-slate-200 dark:border-emerald-500/10 p-8 text-center text-slate-500">
                                Tidak ada jadwal pelajaran ditemukan.
                            </div>
                        ) : (
                            jadwalGroups.map((group) => (
                                <div key={group.key} className="mb-8 last:mb-0">
                                    <h3 className="font-bold text-slate-700 dark:text-emerald-400 text-[13px] uppercase tracking-widest mb-3 pl-2 flex items-center gap-2 border-l-4 border-emerald-500 bg-slate-50/50 dark:bg-emerald-500/5 py-1.5 w-max pr-4 rounded-r-lg">
                                        {group.key}
                                    </h3>
                                    <div className="overflow-x-auto bg-white dark:bg-[#020c08]/50 rounded-xl border border-slate-200 dark:border-emerald-500/10 shadow-sm">
                                        <table className="w-full text-center text-xs whitespace-nowrap min-w-max border-separate border-spacing-0">
                                            <thead>
                                                <tr className="bg-slate-50 dark:bg-[#061e16]">
                                                    {isCurrentYearActive && selectedIds.length > 0 && (
                                                        <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center static md:sticky md:left-0 md:z-40 bg-slate-50 dark:bg-[#061e16]">
                                                            <input 
                                                                type="checkbox" 
                                                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                                checked={group.items.every(item => selectedIds.includes(item.id))}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        const newIds = [...new Set([...selectedIds, ...group.items.map(i => i.id)])];
                                                                        setSelectedIds(newIds);
                                                                    } else {
                                                                        const groupItemIds = group.items.map(i => i.id);
                                                                        setSelectedIds(selectedIds.filter(id => !groupItemIds.includes(id)));
                                                                    }
                                                                }}
                                                            />
                                                        </th>
                                                    )}
                                                    <th className={`py-2 px-3 border-b border-r-[3px] border-slate-400 dark:border-emerald-500/30 text-center static md:sticky ${isCurrentYearActive && selectedIds.length > 0 ? 'md:left-8' : 'md:left-0'} md:z-30 bg-slate-50 dark:bg-[#061e16] shadow-[4px_0_12px_rgba(0,0,0,0.03)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.2)] text-slate-800 dark:text-slate-300 font-extrabold uppercase w-28 min-w-[112px]`}>Hari</th>
                                                    <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16] w-32 min-w-[128px]">Jam</th>
                                                    <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16] w-40 min-w-[160px]">Guru</th>
                                                    <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16] w-32 min-w-[128px]">Kelas</th>
                                                    <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16] w-auto min-w-[160px]">Mata Pelajaran</th>
                                                    {isCurrentYearActive && (
                                                        <th className="py-2 px-2 border-b border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16] w-20 min-w-[80px]">Aksi</th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {group.items.map((j) => (
                                                    <tr 
                                                        key={j.id} 
                                                        {...bindLongPress(j.id)}
                                                        className={`transition-colors group cursor-pointer select-none ${selectedIds.includes(j.id) ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'hover:bg-slate-50 dark:hover:bg-[#082a1f]'}`}
                                                    >
                                                        {isCurrentYearActive && selectedIds.length > 0 && (
                                                            <td className={`py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center static md:sticky md:left-0 md:z-20 ${selectedIds.includes(j.id) ? 'bg-emerald-50 dark:bg-[#06241a]' : 'bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]'}`} onClick={(e) => e.stopPropagation()}>
                                                                <input 
                                                                    type="checkbox" 
                                                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                                    checked={selectedIds.includes(j.id)}
                                                                    onChange={() => handleSelectRow(j.id)}
                                                                />
                                                            </td>
                                                        )}
                                                        <td className={`py-1.5 px-3 border-b border-r-[3px] border-slate-400 dark:border-emerald-500/30 font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap uppercase tracking-wider text-left static md:sticky ${isCurrentYearActive && selectedIds.length > 0 ? 'md:left-8' : 'md:left-0'} md:z-20 drop-shadow-md ${selectedIds.includes(j.id) ? 'bg-emerald-50 dark:bg-[#06241a]' : 'bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]'}`}>{j.hari}</td>
                                                        <td className={`py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap text-center ${selectedIds.includes(j.id) ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]'}`}>
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                                {j.jam_mulai.slice(0, 5)} - {j.jam_selesai.slice(0, 5)}
                                                            </div>
                                                        </td>
                                                        <td className={`py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-slate-600 dark:text-slate-300 text-left ${selectedIds.includes(j.id) ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]'}`}>{j.nama_guru || <span className="text-[10px] text-slate-400 italic">Belum diatur</span>}</td>
                                                        <td className={`py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-slate-600 dark:text-slate-300 whitespace-nowrap text-left ${selectedIds.includes(j.id) ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]'}`}>Kelas {decodeURIComponent(j.kelas)}</td>
                                                        <td className={`py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 font-extrabold ${getSubjectColor(j.mata_pelajaran)} text-left ${selectedIds.includes(j.id) ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]'}`}>{j.mata_pelajaran}</td>
                                                        {isCurrentYearActive && (
                                                            <td className={`py-1.5 px-2 border-b border-slate-300 dark:border-emerald-500/10 text-center ${selectedIds.includes(j.id) ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]'}`}>
                                                                <div className="flex justify-center gap-2">
                                                                    <button onClick={(e) => { e.stopPropagation(); openEditModal(j); }} className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/20 transition-colors border border-emerald-200 dark:border-emerald-500/20" title="Edit Jadwal"><Edit2 className="h-3.5 w-3.5" /></button>
                                                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(j.id); }} className="p-1.5 rounded-lg bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/20 transition-colors border border-red-200 dark:border-red-500/20" title="Hapus Jadwal"><Trash2 className="h-3.5 w-3.5" /></button>
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))
                        )}
                    </>
                )}
            </div>

            {/* Modal Tambah/Edit */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 overflow-hidden bg-white dark:bg-[#041610] text-slate-800 dark:text-white border border-slate-200 dark:border-emerald-500/10">
                        <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                            <X className="h-6 w-6" />
                        </button>

                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-emerald-500" />
                            {isEditing ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {formError && <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-300 text-xs font-semibold">{formError}</div>}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Hari</label>
                                    <select value={hari} onChange={e => setHari(e.target.value)} required className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm">
                                        {HARI_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Mata Pelajaran</label>
                                    <select value={mataPelajaran} onChange={e => setMataPelajaran(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm">
                                        <option value="">Pilih Pelajaran...</option>
                                        {mapelList.map(m => <option key={m.id} value={m.nama_pelajaran}>{m.nama_pelajaran}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Jam Mulai</label>
                                    <input type="time" lang="id-ID" value={jamMulai} onChange={e => setJamMulai(e.target.value)} required
                                        className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Jam Selesai</label>
                                    <input type="time" lang="id-ID" value={jamSelesai} onChange={e => setJamSelesai(e.target.value)} required
                                        className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Kelas</label>
                                    <select value={kelas} onChange={e => setKelas(e.target.value)} required className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm">
                                        <option value="">Pilih Kelas...</option>
                                        {kelasList.map(k => <option key={k.id} value={k.nama_kelas}>{decodeURIComponent(k.nama_kelas)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Guru Pengajar</label>
                                    <select value={guruId} onChange={e => setGuruId(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm">
                                        <option value="">Pilih Guru...</option>
                                        {guruList
                                            .filter(g => (g.status_aktif || 'aktif') === 'aktif' || g.id.toString() === guruId.toString())
                                            .map(g => (
                                                <option key={g.id} value={g.id}>
                                                    {g.nama_lengkap} {(g.status_aktif && g.status_aktif !== 'aktif') ? '(Non-aktif)' : ''}
                                                </option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-250 dark:border-emerald-500/20 py-2.5 px-4 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#061e16] transition-all cursor-pointer">Batal</button>
                                <button type="submit" disabled={submitting} className="rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 py-2.5 px-6 text-sm font-semibold text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer">
                                    {submitting && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>}
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
