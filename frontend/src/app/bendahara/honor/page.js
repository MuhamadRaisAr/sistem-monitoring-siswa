"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTahunAjaran } from '@/hooks/useTahunAjaran';
import { Wallet, Settings, Search, Edit2, CheckCircle2, AlertCircle, FileText, Download, CalendarClock, X, Trash2 } from 'lucide-react';
import CetakSlipGajiModal from '@/components/CetakSlipGajiModal';

export default function HonorBendaharaPage() {
    const { token } = useAuth();
    const { tahunAjaranList, selectedTahunAjaranId, loadingTahunAjaran } = useTahunAjaran();
    
    const [activeTab, setActiveTab] = useState('bulanan'); // 'bulanan' | 'riwayat'
    
    // States for Bulanan (Current Month)
    const currentBulan = new Date().getMonth() + 1;
    const [honorsBulanan, setHonorsBulanan] = useState([]);
    const [loadingBulanan, setLoadingBulanan] = useState(false);
    const [nominalInput, setNominalInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // States for Riwayat
    const [honorsRiwayat, setHonorsRiwayat] = useState([]);
    const [loadingRiwayat, setLoadingRiwayat] = useState(false);
    const [selectedRiwayatBulan, setSelectedRiwayatBulan] = useState(currentBulan);
    const [selectedRiwayatTA, setSelectedRiwayatTA] = useState('');

    // States for Cetak Modal
    const [showCetakModal, setShowCetakModal] = useState(false);
    const [selectedHonorPrint, setSelectedHonorPrint] = useState(null);

    // State checkbox untuk bayar massal
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Toast State
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    // Sync default TA for riwayat
    useEffect(() => {
        if (selectedTahunAjaranId && !selectedRiwayatTA) {
            setSelectedRiwayatTA(selectedTahunAjaranId);
        }
    }, [selectedTahunAjaranId, selectedRiwayatTA]);

    // Helpers to calculate year
    const getCalculatedTahun = (bulan, taId) => {
        const ta = tahunAjaranList.find(t => t.id.toString() === taId?.toString());
        let tahun = new Date().getFullYear();
        if (ta && ta.nama_tahun) {
            const startYear = parseInt(ta.nama_tahun.substring(0, 4));
            if (bulan >= 7) {
                tahun = startYear;
            } else {
                tahun = startYear + 1;
            }
        }
        return tahun;
    };

    const fetchHonorBulanan = useCallback(async (restoreScroll = false) => {
        const scrollEl = restoreScroll ? document.getElementById('main-scroll-area') : null;
        const scrollY = scrollEl ? scrollEl.scrollTop : 0;
        try {
            setLoadingBulanan(true);
            const res = await fetch(`/api/honor/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setHonorsBulanan(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingBulanan(false);
            if (scrollEl) requestAnimationFrame(() => { scrollEl.scrollTop = scrollY; });
        }
    }, [token]);

    const fetchHonorRiwayat = useCallback(async (restoreScroll = false) => {
        if (!selectedRiwayatTA) return;
        const scrollEl = restoreScroll ? document.getElementById('main-scroll-area') : null;
        const scrollY = scrollEl ? scrollEl.scrollTop : 0;
        try {
            setLoadingRiwayat(true);
            const res = await fetch(`/api/honor/riwayat?tahun_ajaran_id=${selectedRiwayatTA}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setHonorsRiwayat(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingRiwayat(false);
            if (scrollEl) requestAnimationFrame(() => { scrollEl.scrollTop = scrollY; });
        }
    }, [selectedRiwayatTA, token]);

    useEffect(() => {
        if (activeTab === 'bulanan') fetchHonorBulanan();
        if (activeTab === 'riwayat') fetchHonorRiwayat();
    }, [activeTab, fetchHonorBulanan, fetchHonorRiwayat]);

    const handleNominalChange = (e) => {
        let val = e.target.value.replace(/[^0-9]/g, '');
        if (val) {
            setNominalInput(parseInt(val, 10).toLocaleString('id-ID'));
        } else {
            setNominalInput('');
        }
    };

    const handleGenerateHonor = async () => {
        const rawNominal = nominalInput.replace(/\./g, '');
        if (!rawNominal) {
            showToast('Silakan masukkan nominal per pertemuan terlebih dahulu!', 'error');
            return;
        }
        
        try {
            setIsGenerating(true);
            const tahun = getCalculatedTahun(currentBulan, selectedTahunAjaranId);
            const res = await fetch('/api/honor/generate', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({
                    bulan: currentBulan,
                    tahun: tahun,
                    tahun_ajaran_id: selectedTahunAjaranId,
                    nominal: rawNominal
                })
            });
            const data = await res.json();
            if (res.ok) {
                showToast(data.message, 'success');
                fetchHonorBulanan();
                setNominalInput('');
            } else {
                showToast(data.message || 'Gagal generate', 'error');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePayHonor = async (id, isRiwayat = false) => {
        if (!confirm('Yakin ingin membayar honor ini? Pastikan jumlah dan tarif sudah sesuai sebelum melanjutkan.')) return;
        try {
            const res = await fetch(`/api/honor/pay/${id}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                showToast('Honor berhasil dibayar! ✓', 'success');
                if (isRiwayat) fetchHonorRiwayat(true);
                else fetchHonorBulanan(true);
            } else {
                showToast('Gagal membayar honor', 'error');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleCancelHonor = async (id) => {
        if (!confirm('Yakin ingin membatalkan pembayaran honor ini? Absensi yang terkait akan kembali ke status "belum dibayar".')) return;
        try {
            const res = await fetch(`/api/honor/cancel/${id}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                showToast('Pembayaran berhasil dibatalkan', 'success');
                fetchHonorRiwayat(true);
                fetchHonorBulanan(true);
            } else {
                showToast(data.message || 'Gagal membatalkan', 'error');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteHonor = async (id) => {
        if (!confirm('Yakin ingin menghapus riwayat honor ini? Data yang dihapus tidak bisa dikembalikan.')) return;
        try {
            const res = await fetch(`/api/honor/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                showToast('Riwayat honor berhasil dihapus', 'success');
                fetchHonorRiwayat(true);
                fetchHonorBulanan(true);
            } else {
                showToast(data.message || 'Gagal menghapus riwayat', 'error');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleBulkPay = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Yakin ingin membayar ${selectedIds.size} honor sekaligus? Pastikan semua tarif sudah sesuai.`)) return;
        try {
            const res = await fetch('/api/honor/pay-bulk', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ids: Array.from(selectedIds) })
            });
            const data = await res.json();
            if (res.ok) {
                showToast(data.message || 'Honor berhasil dibayar sekaligus! ✓', 'success');
                setSelectedIds(new Set());
                fetchHonorBulanan(true);
            } else {
                showToast(data.message || 'Gagal membayar', 'error');
            }
        } catch (error) {
            console.error(error);
        }
    };



    const handleUpdateTarifInline = async (honor, newTarifFormatted) => {
        if (honor.status_pembayaran === 'dibayar') return;
        const tarif = parseInt(newTarifFormatted.replace(/\./g, '')) || 0;
        
        // Jika belum digenerate, perbarui default tarif di tabel users
        if (!honor.id) {
            if (tarif === honor.default_tarif) return;
            try {
                const res = await fetch(`/api/honor/tarif/${honor.guru_id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ tarif_per_jam: tarif })
                });
                if (res.ok) fetchHonorBulanan();
                else showToast('Gagal mengupdate tarif default', 'error');
            } catch (err) { console.error(err); }
            return;
        }

        // Jika sudah digenerate, perbarui tarif di tabel honor_guru
        if (tarif === honor.tarif_per_jam) return;
        try {
            const res = await fetch(`/api/honor/manual/${honor.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ tarif_per_jam: tarif })
            });
            if (res.ok) {
                showToast('Tarif berhasil diupdate', 'success');
                fetchHonorBulanan();
            } else {
                showToast('Gagal mengupdate tarif', 'error');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const cetakSlipGaji = (honor) => {
        setSelectedHonorPrint(honor);
        setShowCetakModal(true);
    };

    const getBulanName = (bln) => {
        const bulanArr = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return bulanArr[bln - 1];
    };

    const renderTable = (data, isLoading, isRiwayat = false, selIds = selectedIds, setSelIds = setSelectedIds, onBulkPay = handleBulkPay) => {
        // Baris yang bisa dicentang: punya id, belum dibayar, pertemuan > 0
        const payableRows = data.filter(h =>
            h.id && h.status_pembayaran === 'belum_dibayar' &&
            (h.id ? h.total_jam_mengajar : (h.computed_pertemuan || 0)) > 0
        );
        const allChecked = payableRows.length > 0 && payableRows.every(h => selIds.has(h.id));
        const someChecked = payableRows.some(h => selIds.has(h.id));

        const toggleAll = () => {
            if (allChecked) {
                setSelIds(prev => {
                    const next = new Set(prev);
                    payableRows.forEach(h => next.delete(h.id));
                    return next;
                });
            } else {
                setSelIds(prev => {
                    const next = new Set(prev);
                    payableRows.forEach(h => next.add(h.id));
                    return next;
                });
            }
        };

        const toggleOne = (id) => {
            setSelIds(prev => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id); else next.add(id);
                return next;
            });
        };

        return (
        <div className="overflow-x-auto">
            {/* Tombol Bayar Terpilih */}
            {!isRiwayat && selIds.size > 0 && (
                <div className="mb-3 flex items-center gap-3">
                    <span className="text-sm text-slate-500 dark:text-slate-400">{selIds.size} guru dipilih</span>
                    <button
                        onClick={onBulkPay}
                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        Bayar Terpilih ({selIds.size})
                    </button>
                    <button
                        onClick={() => setSelIds(new Set())}
                        className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        Batal Pilih
                    </button>
                </div>
            )}
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300 border-collapse border border-slate-200 dark:border-slate-700">
                <thead className="bg-slate-50 dark:bg-emerald-950/20 text-slate-700 dark:text-slate-200 font-bold">
                    <tr>
                        {!isRiwayat && (
                            <th className="px-3 py-3 border border-slate-200 dark:border-slate-700 w-10 text-center">
                                <input
                                    type="checkbox"
                                    checked={allChecked}
                                    ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                                    onChange={toggleAll}
                                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                                    title="Pilih semua"
                                />
                            </th>
                        )}
                        <th className="px-4 py-3 border border-slate-200 dark:border-slate-700">Nama Guru</th>
                        {isRiwayat && (
                            <th className="px-4 py-3 border border-slate-200 dark:border-slate-700">Periode Honor</th>
                        )}
                        <th className="px-4 py-3 border border-slate-200 dark:border-slate-700">Jml Pertemuan</th>
                        <th className="px-4 py-3 border border-slate-200 dark:border-slate-700">Tarif/Pertemuan</th>
                        <th className="px-4 py-3 border border-slate-200 dark:border-slate-700">Total Honor</th>
                        <th className="px-4 py-3 border border-slate-200 dark:border-slate-700">Status</th>
                        <th className="px-4 py-3 border border-slate-200 dark:border-slate-700 text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        <tr><td colSpan={isRiwayat ? 7 : 7} className="text-center py-8">Memuat data...</td></tr>
                    ) : data.length === 0 ? (
                        <tr><td colSpan={isRiwayat ? 7 : 7} className="text-center py-8">Belum ada data riwayat honor.</td></tr>
                    ) : (
                        data.map((h) => (
                            <tr key={h.guru_id} className="hover:bg-slate-50 dark:hover:bg-[#061e16]/50">
                                {!isRiwayat && (() => {
                                    const pertemuan = h.id ? h.total_jam_mengajar : (h.computed_pertemuan || 0);
                                    const isPayable = h.id && h.status_pembayaran === 'belum_dibayar' && pertemuan > 0;
                                    return (
                                        <td className="px-3 py-3 border border-slate-200 dark:border-slate-700 text-center">
                                            {isPayable ? (
                                                <input
                                                    type="checkbox"
                                                    checked={selIds.has(h.id)}
                                                    onChange={() => toggleOne(h.id)}
                                                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                                                />
                                            ) : <span className="text-slate-200 dark:text-slate-700">—</span>}
                                        </td>
                                    );
                                })()}
                                <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700">{h.nama_lengkap}</td>
                                {isRiwayat && (
                                    <td className="px-4 py-3 border border-slate-200 dark:border-slate-700">
                                        <span className="font-semibold text-emerald-700 dark:text-emerald-500">{getBulanName(h.bulan)} {h.tahun}</span>
                                    </td>
                                )}
                                <td className="px-4 py-3 border border-slate-200 dark:border-slate-700">
                                    {h.id ? (
                                        <span>{h.total_jam_mengajar}x Pertemuan</span>
                                    ) : (
                                        <span className="font-semibold text-amber-600 dark:text-amber-500">{h.computed_pertemuan || 0}x Pertemuan</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 border border-slate-200 dark:border-slate-700">
                                    {/* Jika pertemuan 0 dan belum tersimpan, jangan tampilkan input tarif */}
                                    {(() => {
                                        const pertemuan = h.id ? h.total_jam_mengajar : (h.computed_pertemuan || 0);
                                        if (pertemuan === 0 && h.status_pembayaran !== 'dibayar' && !isRiwayat) return <span className="text-slate-300 dark:text-slate-600">-</span>;
                                        if (!isRiwayat && h.status_pembayaran !== 'dibayar') return (
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-500 font-bold">Rp</span>
                                                <input 
                                                    type="text" 
                                                    defaultValue={(() => {
                                                        const val = h.id ? h.tarif_per_jam : (h.default_tarif || nominalInput.replace(/\./g, ''));
                                                        return val && parseInt(val) > 0 ? parseInt(val).toLocaleString('id-ID') : '';
                                                    })()}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                                        e.target.value = val ? parseInt(val, 10).toLocaleString('id-ID') : '';
                                                    }}
                                                    onBlur={(e) => handleUpdateTarifInline(h, e.target.value)}
                                                    className="w-24 rounded-lg border border-slate-200 dark:border-slate-700 py-1 px-2 text-sm focus:outline-none focus:border-emerald-500 dark:bg-[#020c08]"
                                                />
                                            </div>
                                        );
                                        return `Rp ${parseInt(h.tarif_per_jam || 0).toLocaleString('id-ID')}`;
                                    })()}
                                </td>
                                <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">
                                    {(() => {
                                        const pertemuan = h.id ? h.total_jam_mengajar : (h.computed_pertemuan || 0);
                                        if (pertemuan === 0 && h.status_pembayaran !== 'dibayar' && !isRiwayat) return <span className="text-slate-300 dark:text-slate-600">-</span>;
                                        return h.id ? `Rp ${parseInt(h.total_honor).toLocaleString('id-ID')}` : `Rp ${parseInt((h.computed_pertemuan || 0) * (h.default_tarif || nominalInput.replace(/\./g, '') || 0)).toLocaleString('id-ID')}`;
                                    })()}
                                </td>
                                <td className="px-4 py-3 border border-slate-200 dark:border-slate-700">
                                    {(() => {
                                        const pertemuan = h.id ? h.total_jam_mengajar : (h.computed_pertemuan || 0);
                                        if (pertemuan === 0 && h.status_pembayaran !== 'dibayar' && !isRiwayat) return <span className="text-slate-300 dark:text-slate-600">-</span>;
                                        if (h.id) return h.status_pembayaran === 'dibayar' ? (
                                            <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-md text-xs font-bold">
                                                <CheckCircle2 className="h-3 w-3" /> Dibayar
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-md text-xs font-bold">
                                                <AlertCircle className="h-3 w-3" /> Menunggu
                                            </span>
                                        );
                                        return (
                                            <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-md text-xs font-bold">
                                                Belum Tersimpan
                                            </span>
                                        );
                                    })()}
                                </td>
                                <td className="px-4 py-3 border border-slate-200 dark:border-slate-700 text-right">
                                    {(() => {
                                        const pertemuan = h.id ? h.total_jam_mengajar : (h.computed_pertemuan || 0);
                                        // Jika 0 pertemuan dan belum/tidak dibayar, tidak ada aksi
                                        if (pertemuan === 0 && h.status_pembayaran !== 'dibayar' && !isRiwayat) return <span className="text-slate-300 dark:text-slate-600">-</span>;
                                        if (!h.id) return <span className="text-xs text-slate-400 italic">Generate untuk simpan</span>;
                                        return (
                                            <div className="flex items-center justify-end gap-2">
                                                {!isRiwayat && h.status_pembayaran === 'belum_dibayar' && (
                                                    <div className="flex gap-2 justify-end">
                                                        <button 
                                                            onClick={() => handlePayHonor(h.id, isRiwayat)}
                                                            className="text-xs bg-emerald-500 hover:bg-emerald-400 text-white px-3 py-1.5 rounded-lg font-semibold"
                                                        >
                                                            Bayar
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteHonor(h.id)}
                                                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-500 text-red-600 hover:text-white dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white transition-colors border border-red-200 dark:border-red-800"
                                                            title="Hapus data honor"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )}
                                                {h.status_pembayaran === 'dibayar' && (
                                                    <button 
                                                        onClick={() => cetakSlipGaji(h)}
                                                        className="text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#0a2e22]"
                                                        title="Cetak Slip Gaji"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {isRiwayat && h.status_pembayaran === 'dibayar' && (
                                                    <button 
                                                        onClick={() => handleCancelHonor(h.id)}
                                                        className="text-xs bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg font-semibold border border-red-200 dark:border-red-800 transition-colors"
                                                        title="Batalkan pembayaran"
                                                    >
                                                        Batalkan
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#041610] p-6 rounded-2xl border border-slate-200 dark:border-emerald-500/10 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <Wallet className="h-8 w-8 text-emerald-500" />
                        Penggajian Guru
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Kelola absensi pertemuan dan proses pembayaran honor.
                    </p>
                </div>
                <div className="flex bg-slate-100 dark:bg-[#061e16] p-1 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('bulanan')}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'bulanan' ? 'bg-white dark:bg-[#0a2e22] text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Gaji Bulanan
                    </button>
                    <button 
                        onClick={() => setActiveTab('riwayat')}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'riwayat' ? 'bg-white dark:bg-[#0a2e22] text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Riwayat Honor
                    </button>
                </div>
            </div>

            {/* TAB: BULANAN */}
            {activeTab === 'bulanan' && (
                <div className="bg-white dark:bg-[#041610] rounded-2xl border border-slate-200 dark:border-emerald-500/10 shadow-sm p-6 space-y-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                        <div>
                            <h3 className="font-bold text-emerald-800 dark:text-emerald-400">Daftar Honor Guru</h3>
                            <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">Generate honor otomatis dengan memasukkan nominal tarif per pertemuan.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">Rp</span>
                                <input 
                                    type="text"
                                    value={nominalInput}
                                    onChange={handleNominalChange}
                                    placeholder="Nominal per pertemuan"
                                    className="pl-9 pr-3 py-2 w-48 rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#020c08] text-sm focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100"
                                />
                            </div>
                            <button 
                                onClick={handleGenerateHonor}
                                disabled={isGenerating || !selectedTahunAjaranId}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {isGenerating ? 'Memproses...' : 'Generate Honor'}
                            </button>
                        </div>
                    </div>

                    {renderTable(honorsBulanan, loadingBulanan, false)}
                </div>
            )}

            {/* TAB: RIWAYAT HONOR */}
            {activeTab === 'riwayat' && (
                <div className="bg-white dark:bg-[#041610] rounded-2xl border border-slate-200 dark:border-emerald-500/10 shadow-sm p-6 space-y-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Tahun Ajaran</label>
                                <select 
                                    value={selectedRiwayatTA}
                                    onChange={(e) => setSelectedRiwayatTA(e.target.value)}
                                    disabled={loadingTahunAjaran}
                                    className="rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-slate-50 dark:bg-[#061e16] py-2 px-3 text-sm focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100 disabled:opacity-50"
                                >
                                    <option value="">Pilih Tahun Ajaran</option>
                                    {tahunAjaranList.map(ta => (
                                        <option key={ta.id} value={ta.id}>
                                            {ta.nama_tahun} - {ta.semester}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {renderTable(honorsRiwayat, loadingRiwayat, true)}
                </div>
            )}
            
            <CetakSlipGajiModal 
                isOpen={showCetakModal} 
                onClose={() => setShowCetakModal(false)} 
                honorData={selectedHonorPrint} 
                tahunAjaranList={tahunAjaranList} 
            />

            {/* Toast Notification */}
            {toast.show && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-white dark:bg-[#041610] border border-slate-100 dark:border-emerald-500/20 shadow-xl z-[100] flex items-center gap-3 animate-fade-in">
                    {toast.type === 'success' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">{toast.message}</p>
                </div>
            )}
        </div>
    );
}
