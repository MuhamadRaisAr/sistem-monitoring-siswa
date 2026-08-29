"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { CircleDollarSign, Plus, Check, Undo2, X, Eye, Trash2, CheckCircle, Search } from 'lucide-react';
import { useTahunAjaran } from '@/hooks/useTahunAjaran';

export default function BendaharaKeuanganPage() {
    const { token } = useAuth();
    const pathname = usePathname();
    const [bills, setBills] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [siswaList, setsiswaList] = useState([]);
    const [loading, setLoading] = useState(true);

    const filteredBills = bills.filter(b => {
        const searchLower = searchQuery.toLowerCase();
        const matchSearch = 
            (b.nama_siswa || '').toLowerCase().includes(searchLower) ||
            (b.nis || '').toLowerCase().includes(searchLower);
        return matchSearch;
    });

    const groupedBills = filteredBills.reduce((acc, bill) => {
        const taId = bill.tahun_ajaran_id || 'unknown';
        if (!acc[taId]) acc[taId] = [];
        acc[taId].push(bill);
        return acc;
    }, {});
    
    const sortedTaIds = Object.keys(groupedBills).sort((a, b) => {
        if (a === 'unknown') return 1;
        if (b === 'unknown') return -1;
        return parseInt(b) - parseInt(a);
    });

    const [buktiModalOpen, setBuktiModalOpen] = useState(false);
    const [selectedBuktiUrl, setSelectedBuktiUrl] = useState('');

    const [selectedBills, setSelectedBills] = useState([]);
    
    const { 
        tahunAjaranList, 
        activeTahunAjaran,
        activeTahunAjaranList,
        selectedTahunAjaranId, 
        setSelectedTahunAjaranId,
        loadingTahunAjaran
    } = useTahunAjaran();

    const isCurrentYearActive = activeTahunAjaran?.id?.toString() === selectedTahunAjaranId;

    const handleSelectBill = (id) => {
        setSelectedBills(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
    };

    const handleSelectAllBills = () => {
        if (selectedBills.length === filteredBills.length && filteredBills.length > 0) {
            setSelectedBills([]);
        } else {
            setSelectedBills(filteredBills.map(b => b.id));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedBills.length === 0) return;
        if (!confirm(`Yakin ingin menghapus ${selectedBills.length} tagihan terpilih?`)) return;

        try {
            setLoading(true);
            for (const id of selectedBills) {
                await fetch(`${API_URL}/keuangan/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
            setSelectedBills([]);
            setShowCheckboxes(false);
            fetchBills();
        } catch (err) {
            console.error('Error bulk delete:', err);
        } finally {
            setLoading(false);
        }
    };

    const [filterKelas, setFilterKelas] = useState('');
    const [filterStatus, setFilterStatus] = useState('belum_lunas');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const saved = sessionStorage.getItem('keu_filterKelas');
        if (saved && saved !== 'null' && saved !== 'undefined') {
            setFilterKelas(saved);
        }
        
        if (pathname.includes('/validasi')) setFilterStatus('menunggu_verifikasi');
        else if (pathname.includes('/riwayat')) setFilterStatus('lunas');
        else if (pathname.endsWith('/keuangan')) setFilterStatus('belum_lunas');
    }, [pathname]);
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('keu_filterKelas', filterKelas);
        }
    }, [filterKelas]);

    // Generate state
    const [generateModalOpen, setGenerateModalOpen] = useState(false);
    const [genTargetType, setGenTargetType] = useState('semua');
    const [genTargetValue, setGenTargetValue] = useState('');
    const [genBulan, setGenBulan] = useState((new Date().getMonth() + 1).toString());
    const [genTahun, setGenTahun] = useState(new Date().getFullYear().toString());
    const [genNominal, setGenNominal] = useState('');
    const [genNamaTagihan, setGenNamaTagihan] = useState('');
    const [generating, setGenerating] = useState(false);
    const [genSuccess, setGenSuccess] = useState('');
    const [genError, setGenError] = useState('');

    const availableYears = React.useMemo(() => {
        let yearsSet = new Set();
        
        if (activeTahunAjaranList && activeTahunAjaranList.length > 0) {
            activeTahunAjaranList.forEach(ta => {
                if (ta.nama_tahun) {
                    const parts = ta.nama_tahun.split('/');
                    parts.forEach(p => {
                        if (p) yearsSet.add(p);
                    });
                }
            });
        }
        
        // Fallback jika tidak ada tahun ajaran aktif
        if (yearsSet.size === 0) {
            yearsSet.add(new Date().getFullYear().toString());
            yearsSet.add((new Date().getFullYear() + 1).toString());
        }

        // Urutkan tahun agar rapi (ascending)
        return Array.from(yearsSet).sort((a, b) => parseInt(a) - parseInt(b));
    }, [activeTahunAjaranList]);

    useEffect(() => {
        if (availableYears.length > 0 && !availableYears.includes(genTahun)) {
            setGenTahun(availableYears[0]);
        }
    }, [availableYears, genTahun]);

    const [showCheckboxes, setShowCheckboxes] = useState(false);
    const pressTimer = React.useRef(null);

    const handlePressStart = () => {
        pressTimer.current = setTimeout(() => {
            setShowCheckboxes(true);
        }, 1000);
    };

    const handlePressEnd = () => {
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
        }
    };

    const API_URL = '/api';

    const fetchBills = async () => {
        try {
            setLoading(true);
            let query = `${API_URL}/keuangan?`;
            if (filterKelas) query += `kelas=${filterKelas}&`;
            if (filterStatus) query += `status_bayar=${filterStatus}&`;
            if (selectedTahunAjaranId && pathname.endsWith('/keuangan')) {
                query += `tahun_ajaran_id=${selectedTahunAjaranId}&`;
            }

            const res = await fetch(query, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setBills(data);
        } catch (err) {
            console.error('Error fetching SPP bills:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchsiswa = async () => {
        try {
            const res = await fetch(`${API_URL}/siswa`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setsiswaList(Array.isArray(data) ? data.filter(s => s.status_aktif === 'aktif') : []);
        } catch (err) {
            console.error('Error fetching active siswa:', err);
        }
    };

    useEffect(() => {
        if (!token || !selectedTahunAjaranId) return;
        const init = async () => {
            await fetchsiswa();
        };
        init();
    }, [token, selectedTahunAjaranId]);

    useEffect(() => {
        if (token && selectedTahunAjaranId) {
            fetchBills();
        }
    }, [token, filterKelas, filterStatus, selectedTahunAjaranId]);

    const handlePayBill = async (id, status) => {
        try {
            const res = await fetch(`${API_URL}/keuangan/${id}/pay`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    status_bayar: status
                })
            });

            if (res.ok) {
                fetchBills();
            } else {
                const data = await res.json();
                alert(data.message || 'Gagal merubah status pembayaran.');
            }
        } catch (err) {
            console.error('Error paying bill:', err);
        }
    };

    const handleGenerateSubmit = async (e) => {
        e.preventDefault();
        setGenError('');
        setGenSuccess('');
        setGenerating(true);

        const payload = {
            bulan: parseInt(genBulan),
            tahun: parseInt(genTahun),
            nominal: parseFloat(genNominal.toString().replace(/[^0-9]/g, '')),
            nama_tagihan: genNamaTagihan || null,
            target_type: genTargetType,
            target_value: genTargetValue,
            tahun_ajaran_id: selectedTahunAjaranId
        };

        try {
            const res = await fetch(`${API_URL}/keuangan/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Gagal men-generate tagihan.');
            }

            setGenerateModalOpen(false);
            fetchBills();
            
            // Tampilkan toast success setelah modal tertutup
            setTimeout(() => {
                setGenSuccess('Tagihan berhasil dibuat.');
                setTimeout(() => {
                    setGenSuccess('');
                }, 3000);
            }, 100);
        } catch (err) {
            setGenError(err.message);
        } finally {
            setGenerating(false);
        }
    };

    const getMonthName = (num) => {
        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        return months[num - 1] || '';
    };

    const formatRupiah = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(val);
    };

    return (
        <div className="space-y-6 relative">
            {/* Global Toast Alerts (Auto dismiss, no OK button needed) */}
            {genSuccess && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 bg-white text-slate-700 rounded-xl shadow-xl animate-fade-in flex items-center gap-3 font-semibold border border-slate-200 w-max max-w-[90vw]">
                    <CheckCircle className="h-5 w-5 text-slate-500 shrink-0" />
                    <span className="whitespace-nowrap">{genSuccess}</span>
                </div>
            )}
            {/* Header Toolbar */}
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        {pathname.includes('/validasi') ? 'Menunggu Validasi' : pathname.includes('/riwayat') ? 'Riwayat Pembayaran' : 'Keuangan Siswa'}
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">Kelola tagihan keuangan siswa secara kolektif.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {isCurrentYearActive && showCheckboxes && (
                        <>
                            <button
                                onClick={() => {
                                    setShowCheckboxes(false);
                                    setSelectedBills([]);
                                }}
                                className="flex items-center justify-center gap-2 rounded-xl bg-slate-700 hover:bg-slate-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors shrink-0 w-full sm:w-auto animate-fade-in"
                            >
                                <X className="h-5 w-5" /> Batal Pilih
                            </button>
                            {selectedBills.length > 0 && (
                                <button
                                    onClick={handleBulkDelete}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors shrink-0 w-full sm:w-auto animate-fade-in"
                                >
                                    <Trash2 className="h-5 w-5" /> Hapus Terpilih ({selectedBills.length})
                                </button>
                            )}
                        </>
                    )}
                    {isCurrentYearActive && pathname.endsWith('/keuangan') && (
                        <button
                            onClick={() => setGenerateModalOpen(true)}
                            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors shrink-0 w-full sm:w-auto"
                        >
                            <Plus className="h-5 w-5" /> Buat Tagihan Baru
                        </button>
                    )}
                </div>
            </div>

            {!isCurrentYearActive && !loadingTahunAjaran && selectedTahunAjaranId && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 p-4 rounded-xl flex items-center justify-center gap-2 font-medium text-sm animate-fade-in">
                    Mode Arsip (Read-Only). Tahun Ajaran ini sudah tidak aktif, data tidak dapat diubah.
                </div>
            )}

            {/* Main Billing Log */}
            <div className="glass-panel rounded-3xl p-6 space-y-6">
                
                {/* Search & Filter Options */}
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4 w-full border-b border-emerald-500/10 pb-5">
                    <div className="grid grid-cols-1 sm:flex sm:flex-row w-full sm:w-auto gap-3 sm:gap-4">


                        {/* Kelas */}
                        <div className="flex flex-col gap-1.5 w-full sm:w-[160px]">
                            <span className="text-[10px] sm:text-xs text-slate-500 font-bold dark:text-slate-400 uppercase tracking-wider truncate">Kelas:</span>
                            <select
                                value={filterKelas}
                                onChange={(e) => setFilterKelas(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#061e16] py-2.5 px-3 sm:px-4 text-[12px] sm:text-sm text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer text-ellipsis overflow-hidden shadow-sm"
                            >
                                <option value="">Semua Kelas</option>
                                <option value="VII">Kelas VII</option>
                                <option value="VIII">Kelas VIII</option>
                                <option value="IX">Kelas IX</option>
                            </select>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="flex flex-col gap-1.5 w-full sm:w-[350px] mt-3 sm:mt-0">
                        <span className="text-[10px] sm:text-xs text-slate-500 font-bold dark:text-slate-400 uppercase tracking-wider truncate">Cari Siswa:</span>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Ketik nama atau NIS..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#061e16] pl-10 pr-3 sm:pr-4 py-2.5 text-[12px] sm:text-sm text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 truncate shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Billing Table */}
                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                    </div>
                ) : Object.keys(groupedBills).length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-sm">
                        Tidak ada catatan tagihan ditemukan untuk kriteria filter ini.
                    </div>
                ) : (
                    <div className="space-y-8">
                        {sortedTaIds.map((taId) => {
                            const groupBills = groupedBills[taId];
                            const ta = tahunAjaranList.find(t => t.id.toString() === taId.toString());
                            const taName = ta ? `${ta.nama_tahun} ${ta.semester}` : 'Tahun Ajaran Umum';
                            
                            // Group by bulan
                            const billsByBulan = groupBills.reduce((acc, bill) => {
                                const bId = bill.bulan || 0;
                                if (!acc[bId]) acc[bId] = [];
                                acc[bId].push(bill);
                                return acc;
                            }, {});
                            
                            // Sort bulan descending (terbaru di atas)
                            const sortedBulanIds = Object.keys(billsByBulan).sort((a, b) => parseInt(b) - parseInt(a));

                            return (
                                <div key={taId} className="space-y-6">
                                    {!pathname.endsWith('/keuangan') && (
                                        <div className="px-1 flex items-center justify-between">
                                            <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Tahun Ajaran: {taName}</h3>
                                        </div>
                                    )}
                                    <div className="space-y-6">
                                        {sortedBulanIds.map(bulanId => {
                                            const monthBills = billsByBulan[bulanId];
                                            return (
                                                <div key={bulanId} className="bg-white dark:bg-[#020c08]/50 rounded-2xl border border-slate-200 dark:border-emerald-500/20 overflow-hidden shadow-sm">
                                                    <div className="bg-slate-50 dark:bg-slate-800/30 px-4 py-2.5 border-b border-slate-200 dark:border-emerald-500/10 text-center">
                                                        <h4 className="font-bold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-widest">BULAN {getMonthName(bulanId)}</h4>
                                                    </div>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left text-xs border-separate border-spacing-0">
                                                            <thead>
                                                                <tr className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-50/80 dark:bg-[#061e16]">
                                                                    {isCurrentYearActive && showCheckboxes && (
                                                                        <th className="py-3 px-3 w-10 text-center border-b border-slate-200 dark:border-emerald-500/10">
                                                                            <input 
                                                                                type="checkbox" 
                                                                                className="rounded border-slate-300 dark:border-slate-600 bg-transparent text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                                                                                checked={monthBills.length > 0 && monthBills.every(b => selectedBills.includes(b.id))}
                                                                                onChange={(e) => {
                                                                                    if (e.target.checked) {
                                                                                        const newSelected = [...selectedBills, ...monthBills.map(b => b.id).filter(id => !selectedBills.includes(id))];
                                                                                        setSelectedBills(newSelected);
                                                                                    } else {
                                                                                        setSelectedBills(selectedBills.filter(id => !monthBills.map(b => b.id).includes(id)));
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </th>
                                                                    )}
                                                                    <th className="py-3 px-4 border-b border-r border-slate-200 dark:border-emerald-500/10">Nama Siswa</th>
                                                                    <th className="py-3 px-4 border-b border-r border-slate-200 dark:border-emerald-500/10 text-center">Kelas</th>
                                                                    <th className="py-3 px-4 border-b border-r border-slate-200 dark:border-emerald-500/10 text-center">Jenis Tagihan</th>
                                                                    <th className="py-3 px-4 border-b border-r border-slate-200 dark:border-emerald-500/10 text-center">Nominal</th>
                                                                    <th className="py-3 px-4 border-b border-r border-slate-200 dark:border-emerald-500/10 text-center">Tanggal Bayar</th>
                                                                    <th className="py-3 px-4 text-center border-b border-slate-200 dark:border-emerald-500/10">Aksi Konfirmasi</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50 text-sm">
                                                                {monthBills.map((b) => (
                                                            <tr 
                                                                key={b.id} 
                                                                className="hover:bg-slate-50/50 dark:hover:bg-[#082a1f] transition-colors select-none group"
                                                                onMouseDown={handlePressStart}
                                                                onMouseUp={handlePressEnd}
                                                                onMouseLeave={handlePressEnd}
                                                                onTouchStart={handlePressStart}
                                                                onTouchEnd={handlePressEnd}
                                                                onContextMenu={(e) => {
                                                                    e.preventDefault();
                                                                    setShowCheckboxes(true);
                                                                }}
                                                            >
                                                                {isCurrentYearActive && showCheckboxes && (
                                                                    <td className="py-3 px-3 text-center border-b border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]">
                                                                        <input 
                                                                            type="checkbox" 
                                                                            className="rounded border-slate-300 dark:border-slate-600 bg-transparent text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                                                                            checked={selectedBills.includes(b.id)}
                                                                            onChange={() => handleSelectBill(b.id)}
                                                                        />
                                                                    </td>
                                                                )}
                                                                <td className="py-3 px-4 border-b border-r border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]">
                                                                    <span className="font-bold text-slate-800 dark:text-white block">{b.nama_siswa}</span>
                                                                </td>
                                                                <td className="py-3 px-4 border-b border-r border-slate-200 dark:border-emerald-500/10 text-center bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]">
                                                                    <span className="inline-block px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md text-[11px] font-semibold">
                                                                        {b.kelas}
                                                                    </span>
                                                                </td>
                                                                <td className="py-3 px-4 border-b border-r border-slate-200 dark:border-emerald-500/10 text-center bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]">
                                                                    <div className="font-semibold text-slate-700 dark:text-slate-200">
                                                                        {b.nama_tagihan || 'Tagihan'}
                                                                    </div>
                                                                    <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                                                                        {`${getMonthName(b.bulan)} ${b.tahun}`}
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 px-4 border-b border-r border-slate-200 dark:border-emerald-500/10 text-center bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]">
                                                                    <div className="font-bold text-emerald-600 dark:text-emerald-400">
                                                                        {formatRupiah(b.nominal)}
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-500 mt-0.5">
                                                                        Dibuat: {b.created_at ? new Date(b.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs font-medium border-b border-r border-slate-200 dark:border-emerald-500/10 text-center bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]">
                                                                    {b.tanggal_bayar ? (
                                                                        <div className="flex flex-col items-center justify-center leading-tight">
                                                                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                                                {new Date(b.tanggal_bayar).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })}
                                                                            </span>
                                                                            <span className="text-[10px] text-slate-400 mt-0.5">
                                                                                {new Date(b.tanggal_bayar).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).replace(/\./g, ':')} WIB
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-slate-400 dark:text-slate-600">-</span>
                                                                    )}
                                                                </td>
                                                                <td className="py-3 px-4 text-center border-b border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]">
                                                                    {b.status_bayar === 'menunggu_verifikasi' ? (
                                                                        <div className="flex justify-center gap-2">
                                                                            {b.bukti_bayar && (
                                                                                <button
                                                                                    onClick={() => { setSelectedBuktiUrl(b.bukti_bayar); setBuktiModalOpen(true); }}
                                                                                    className="inline-flex items-center gap-1 text-[11px] font-bold rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 py-1.5 px-3 transition-all"
                                                                                >
                                                                                    <Eye className="h-3.5 w-3.5" /> Lihat Bukti
                                                                                </button>
                                                                            )}
                                                                            {(activeTahunAjaran?.id?.toString() === b.tahun_ajaran_id?.toString()) && (
                                                                                <button
                                                                                    onClick={() => handlePayBill(b.id, 'lunas')}
                                                                                    className="inline-flex items-center gap-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 px-3 shadow-md transition-all"
                                                                                >
                                                                                    <Check className="h-3.5 w-3.5" /> Setujui
                                                                                </button>
                                                                            )}
                                                                            {(activeTahunAjaran?.id?.toString() === b.tahun_ajaran_id?.toString()) && (
                                                                                <button
                                                                                    onClick={() => handlePayBill(b.id, 'belum_lunas')}
                                                                                    className="inline-flex items-center gap-1 text-[11px] font-bold rounded-lg bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-500/25 py-1.5 px-2.5 transition-all"
                                                                                    title="Tolak Pembayaran"
                                                                                >
                                                                                    <X className="h-3.5 w-3.5" /> Tolak
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    ) : b.status_bayar === 'belum_lunas' ? (
                                                                        <div className="flex justify-center gap-2">
                                                                            {(activeTahunAjaran?.id?.toString() === b.tahun_ajaran_id?.toString()) && (
                                                                                <button
                                                                                    onClick={() => handlePayBill(b.id, 'lunas')}
                                                                                    className="inline-flex items-center gap-1.5 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 px-3 shadow-md transition-all"
                                                                                >
                                                                                    <Check className="h-3.5 w-3.5" /> Konfirmasi Bayar
                                                                                </button>
                                                                            )}
                                                                            {(activeTahunAjaran?.id?.toString() === b.tahun_ajaran_id?.toString()) && (
                                                                                <button
                                                                                    onClick={async () => {
                                                                                        if (confirm('Yakin ingin menghapus tagihan ini?')) {
                                                                                            try {
                                                                                                const res = await fetch(`${API_URL}/keuangan/${b.id}`, {
                                                                                                    method: 'DELETE',
                                                                                                    headers: { Authorization: `Bearer ${token}` }
                                                                                                });
                                                                                                if (res.ok) {
                                                                                                    fetchBills();
                                                                                                } else {
                                                                                                    const data = await res.json();
                                                                                                    alert(data.message || 'Gagal menghapus tagihan');
                                                                                                }
                                                                                            } catch(e) {
                                                                                                alert('Terjadi kesalahan jaringan');
                                                                                            }
                                                                                        }
                                                                                    }}
                                                                                    className="inline-flex items-center gap-1.5 text-[11px] font-bold rounded-lg bg-red-600 hover:bg-red-500 text-white py-1.5 px-3 shadow-md transition-all"
                                                                                    title="Hapus Tagihan"
                                                                                >
                                                                                    <Trash2 className="h-3.5 w-3.5" /> Hapus
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        (activeTahunAjaran?.id?.toString() === b.tahun_ajaran_id?.toString()) ? (
                                                                            <button
                                                                                onClick={() => handlePayBill(b.id, 'belum_lunas')}
                                                                                className="inline-flex items-center gap-1.5 text-[11px] font-bold rounded-lg bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-500/25 py-1.5 px-2.5 transition-all"
                                                                                title="Batalkan pembayaran"
                                                                            >
                                                                                <Undo2 className="h-3.5 w-3.5" /> Batal Bayar
                                                                            </button>
                                                                        ) : (
                                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                                                                b.status_bayar === 'lunas' 
                                                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                                                    : b.status_bayar === 'ditolak'
                                                                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                                                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                                            }`}>
                                                                                {b.status_bayar === 'lunas' ? 'Lunas' : 
                                                                                 b.status_bayar === 'ditolak' ? 'Ditolak' : 'Belum Diketahui'}
                                                                            </span>
                                                                        )
                                                                    )}
                                                                </td>
                                                            </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Bulk Generate Modal */}
            {generateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                    <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 overflow-hidden">
                        <button onClick={() => setGenerateModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                            <X className="h-6 w-6" />
                        </button>
                        
                        <h2 className="text-xl font-bold text-white mb-2">Buat Tagihan Massal</h2>
                        <p className="text-xs text-slate-400 mb-6">Buat tagihan massal untuk seluruh siswa, per kelas, atau siswa tertentu.</p>

                        <form onSubmit={handleGenerateSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Target Tagihan</label>
                                <div className={`grid gap-2 sm:gap-3 ${genTargetType === 'semua' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                    <select
                                        value={genTargetType}
                                        onChange={(e) => {
                                            setGenTargetType(e.target.value);
                                            setGenTargetValue('');
                                        }}
                                        className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2.5 px-2 sm:px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-[11px] sm:text-sm cursor-pointer"
                                    >
                                        <option value="semua">Semua Siswa Aktif</option>
                                        <option value="kelas">Berdasarkan Kelas</option>
                                        <option value="siswa">Pilih Siswa Spesifik</option>
                                    </select>
                                    
                                    {genTargetType === 'kelas' && (
                                        <select
                                            required
                                            value={genTargetValue}
                                            onChange={(e) => setGenTargetValue(e.target.value)}
                                            className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2.5 px-2 sm:px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-[11px] sm:text-sm cursor-pointer"
                                        >
                                            <option value="">-- Pilih Kelas --</option>
                                            {[...new Set(siswaList.map(s => s.kelas))]
                                                .filter(Boolean)
                                                .sort((a, b) => {
                                                    const getVal = (c) => c.includes('IX') ? 9 : c.includes('VIII') ? 8 : c.includes('VII') ? 7 : 0;
                                                    return getVal(a) - getVal(b) || a.localeCompare(b);
                                                })
                                                .map(k => (
                                                <option key={k} value={k}>Kelas {k}</option>
                                            ))}
                                        </select>
                                    )}
                                    
                                    {genTargetType === 'siswa' && (
                                        <select
                                            required
                                            value={genTargetValue}
                                            onChange={(e) => setGenTargetValue(e.target.value)}
                                            className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2.5 px-2 sm:px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-[11px] sm:text-sm cursor-pointer"
                                        >
                                            <option value="">-- Pilih Siswa --</option>
                                            {siswaList.map(s => (
                                                <option key={s.id} value={s.id}>{s.nama_lengkap} (Kelas {s.kelas})</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>
                            {genError && (
                                <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-red-300 text-xs font-semibold">
                                    {genError}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Bulan</label>
                                    <select
                                        value={genBulan}
                                        onChange={(e) => setGenBulan(e.target.value)}
                                        className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2.5 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-sm"
                                    >
                                        {[...Array(12)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Tahun</label>
                                    <select
                                        value={genTahun}
                                        onChange={(e) => setGenTahun(e.target.value)}
                                        className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2.5 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-sm"
                                    >
                                        {availableYears.map(yr => (
                                            <option key={yr} value={yr}>{yr}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Nama Tagihan (Opsional)</label>
                                <input
                                    type="text"
                                    value={genNamaTagihan}
                                    onChange={(e) => setGenNamaTagihan(e.target.value)}
                                    className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2.5 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-sm placeholder-slate-600"
                                    placeholder="Kosongkan jika ini untuk Tagihan Bulanan"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Nominal (Rupiah)</label>
                                <input
                                    type="text"
                                    required
                                    value={genNominal}
                                    onChange={(e) => {
                                        let val = e.target.value.replace(/[^0-9]/g, '');
                                        if (val) {
                                            val = parseInt(val, 10).toLocaleString('id-ID');
                                        }
                                        setGenNominal(val);
                                    }}
                                    className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2.5 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-sm font-bold text-white"
                                    placeholder="Contoh: 350.000"
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setGenerateModalOpen(false)}
                                    className="rounded-xl border border-emerald-500/20 py-2.5 px-4 text-sm font-semibold text-slate-300 hover:bg-[#061e16] transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={generating}
                                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 px-6 text-sm font-semibold text-white transition-all shadow-md disabled:opacity-50"
                                >
                                    {generating ? 'Membuat...' : 'Buat Tagihan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bukti Pembayaran Modal */}
            {buktiModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setBuktiModalOpen(false)}>
                    <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setBuktiModalOpen(false)}
                            className="absolute -top-12 right-0 p-2 text-white hover:text-emerald-400 transition-colors bg-black/50 rounded-full"
                        >
                            <X className="h-6 w-6" />
                        </button>
                        <img 
                            src={`${selectedBuktiUrl}`} 
                            alt="Bukti Pembayaran" 
                            className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10 bg-black" 
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
