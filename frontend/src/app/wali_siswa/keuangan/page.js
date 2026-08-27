"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChild } from '@/context/ChildContext';
import { CircleDollarSign, CheckCircle2, AlertCircle, Clock, Upload, Printer, X, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTahunAjaran } from '@/hooks/useTahunAjaran';

export default function WaliKeuanganPage() {
    const router = useRouter();
    const { token } = useAuth();
    const { selectedChild } = useChild();
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const { 
        tahunAjaranList, 
        selectedTahunAjaranId, 
        setSelectedTahunAjaranId,
        loadingTahunAjaran
    } = useTahunAjaran();
    const [uploadingId, setUploadingId] = useState(null);
    const [buktiModalOpen, setBuktiModalOpen] = useState(false);
    const [selectedBuktiUrl, setSelectedBuktiUrl] = useState('');
    const [filterStatus, setFilterStatus] = useState('semua');
    const fileInputRefs = React.useRef({});

    const API_URL = '/api';

    const fetchBills = async () => {
        if (!selectedChild || !selectedTahunAjaranId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/keuangan?siswa_id=${selectedChild.id}&tahun_ajaran_id=${selectedTahunAjaranId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setBills(data);
        } catch (err) {
            console.error('Error fetching child financial bills:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token || !selectedChild || !selectedTahunAjaranId) return;
        fetchBills();
    }, [token, selectedChild, selectedTahunAjaranId]);

    const handleUpload = async (id, file) => {
        if (!file) return;
        setUploadingId(id);
        const formData = new FormData();
        formData.append('bukti_bayar', file);
        try {
            const res = await fetch(`${API_URL}/keuangan/${id}/upload-bukti`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                fetchBills();
            } else {
                const data = await res.json();
                alert(data.message || 'Gagal mengupload bukti bayar.');
            }
        } catch (err) {
            alert('Terjadi kesalahan jaringan.');
        } finally {
            setUploadingId(null);
        }
    };

    const getMonthName = (num) => {
        const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
        return months[num - 1] || '';
    };

    const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    if (!selectedChild) {
        return (
            <div className="glass-panel rounded-3xl p-8 text-center text-slate-500">
                Pilih siswa terlebih dahulu di bagian atas.
            </div>
        );
    }

    const totalTagihan    = bills.reduce((s, b) => s + Number(b.nominal || 0), 0);
    const totalLunas      = bills.filter(b => b.status_bayar === 'lunas').reduce((s, b) => s + Number(b.nominal || 0), 0);
    const totalBelumLunas = bills.filter(b => b.status_bayar !== 'lunas').reduce((s, b) => s + Number(b.nominal || 0), 0);

    return (
        <>

            {/* ── MAIN UI ── */}
            <div className="space-y-6 w-full min-w-0">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-white tracking-tight">Daftar Tagihan</h1>
                        <p className="text-slate-400 text-sm">Lihat rekapitulasi pembayaran tagihan.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <select
                            value={selectedTahunAjaranId}
                            onChange={(e) => setSelectedTahunAjaranId(e.target.value)}
                            disabled={loadingTahunAjaran}
                            className="w-full sm:w-auto rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-2.5 px-3 text-sm font-semibold text-white focus:border-emerald-500 focus:outline-none cursor-pointer disabled:opacity-50"
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
                        <button
                            onClick={() => router.push('/wali_siswa/keuangan/cetak')}
                            className="inline-flex items-center justify-center w-full sm:w-auto gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-5 text-sm font-bold transition-all shadow-lg shadow-emerald-900/20 shrink-0 cursor-pointer"
                        >
                            <Printer className="h-4 w-4" />
                            Cetak Tagihan
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <div className="glass-panel rounded-2xl p-3 sm:p-4 text-center min-w-0">
                        <p className="text-[9px] sm:text-xs text-slate-400 mb-0.5 sm:mb-1 truncate w-full">Belum Lunas</p>
                        <p className="text-[11px] sm:text-sm font-extrabold text-red-400 truncate w-full">{formatRupiah(totalBelumLunas)}</p>
                    </div>
                    <div className="glass-panel rounded-2xl p-3 sm:p-4 text-center min-w-0">
                        <p className="text-[9px] sm:text-xs text-slate-400 mb-0.5 sm:mb-1 truncate w-full">Sudah Lunas</p>
                        <p className="text-[11px] sm:text-sm font-extrabold text-emerald-400 truncate w-full">{formatRupiah(totalLunas)}</p>
                    </div>
                    <div className="glass-panel rounded-2xl p-3 sm:p-4 text-center min-w-0">
                        <p className="text-[9px] sm:text-xs text-slate-400 mb-0.5 sm:mb-1 truncate w-full">Total Tagihan</p>
                        <p className="text-[11px] sm:text-sm font-extrabold text-white truncate w-full">{formatRupiah(totalTagihan)}</p>
                    </div>
                </div>

                {/* Bills list */}
                <div className="glass-panel rounded-3xl p-6 space-y-4">


                    {loading ? (
                        <div className="flex h-40 items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-4 pb-2">
                                {['semua', 'belum_lunas', 'lunas'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold text-center transition-all leading-tight flex items-center justify-center ${
                                            filterStatus === status 
                                            ? 'bg-emerald-600 text-white shadow-md' 
                                            : 'bg-emerald-500/5 text-slate-400 hover:bg-emerald-500/10 hover:text-slate-300'
                                        }`}
                                    >
                                        {status === 'semua' ? 'Semua Tagihan' : status === 'belum_lunas' ? 'Belum Bayar' : 'Sudah Lunas'}
                                    </button>
                                ))}
                            </div>
                            
                            {(() => {
                                const displayedBills = bills.filter(b => {
                                    if (filterStatus === 'semua') return true;
                                    if (filterStatus === 'belum_lunas') return b.status_bayar === 'belum_lunas' || b.status_bayar === 'menunggu_verifikasi';
                                    return b.status_bayar === filterStatus;
                                });
                                if (displayedBills.length === 0) {
                                    return <div className="text-center py-12 text-slate-500 text-sm">Tidak ada tagihan dengan status ini.</div>;
                                }
                                return (
                        <>
                        {/* DESKTOP TABLE */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left text-xs md:text-sm border-separate border-spacing-0">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-[#061e16]">
                                        <th className="py-2 px-3 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16] static md:sticky md:left-0 md:z-30 shadow-[4px_0_12px_rgba(0,0,0,0.03)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.2)]">Tagihan</th>
                                        <th className="py-2 px-3 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Nominal</th>
                                        <th className="py-2 px-3 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Status</th>
                                        <th className="py-2 px-3 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Tanggal Bayar</th>
                                        <th className="py-2 px-3 border-b border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedBills.map((b) => {
                                        const isLunas    = b.status_bayar === 'lunas';
                                        const isMenunggu = b.status_bayar === 'menunggu_verifikasi';
                                        return (
                                            <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-[#082a1f] transition-colors group">
                                                <td className="py-2 px-3 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f] transition-colors static md:sticky md:left-0 md:z-20 drop-shadow-md">
                                                    <div className="flex flex-col items-center justify-center leading-tight">
                                                        <span className="font-extrabold text-sm text-slate-850 dark:text-white">{b.nama_tagihan || 'SPP'}</span>
                                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{`${getMonthName(b.bulan)} ${b.tahun}`}</span>
                                                    </div>
                                                </td>
                                                <td className="py-2 px-3 border-b border-r border-slate-300 dark:border-emerald-500/10 font-extrabold text-emerald-600 dark:text-emerald-400 text-center bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f] transition-colors">
                                                    {formatRupiah(b.nominal)}
                                                </td>
                                                <td className="py-2 px-3 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f] transition-colors">
                                                    <span className={`inline-flex items-center gap-1 text-[10px] md:text-xs font-black uppercase tracking-wide whitespace-nowrap px-2 py-1 rounded-lg border
                                                        ${isLunas ? 'bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : isMenunggu ? 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' : 'bg-red-100 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'}`}>
                                                        {isLunas ? <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4" /> : isMenunggu ? <Clock className="h-3 w-3 md:h-4 md:w-4" /> : <AlertCircle className="h-3 w-3 md:h-4 md:w-4" />}
                                                        {isLunas ? 'Lunas' : isMenunggu ? 'Menunggu' : 'Belum Bayar'}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3 border-b border-r border-slate-300 dark:border-emerald-500/10 text-slate-500 dark:text-slate-400 font-medium text-center bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f] transition-colors">
                                                    {isLunas && b.tanggal_bayar ? (
                                                        <div className="flex flex-col items-center justify-center leading-tight">
                                                            <span className="text-sm">{new Date(b.tanggal_bayar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' })}</span>
                                                            <span className="text-xs text-slate-400 font-normal mt-0.5">{new Date(b.tanggal_bayar).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).replace(/\./g, ':')} WIB</span>
                                                        </div>
                                                    ) : '-'}
                                                </td>
                                                <td className="py-2 px-3 border-b border-slate-300 dark:border-emerald-500/10 text-center bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f] transition-colors">
                                                    <div className="flex justify-center items-center gap-2">
                                                        {b.bukti_bayar && (
                                                            <button 
                                                                onClick={() => { setSelectedBuktiUrl(b.bukti_bayar); setBuktiModalOpen(true); }}
                                                                className="inline-flex items-center gap-1 rounded-lg bg-blue-100 hover:bg-blue-200 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 py-1.5 px-3 text-xs font-bold transition-all cursor-pointer border border-blue-200 dark:border-blue-500/20"
                                                            >
                                                                <Eye className="h-4 w-4" /> Bukti
                                                            </button>
                                                        )}
                                                        {!isLunas && !isMenunggu && (
                                                            <>
                                                                <input type="file" accept="image/*" className="hidden"
                                                                    ref={el => fileInputRefs.current[b.id] = el}
                                                                    onChange={(e) => handleUpload(b.id, e.target.files[0])} />
                                                                <button
                                                                    onClick={() => fileInputRefs.current[b.id].click()}
                                                                    disabled={uploadingId === b.id}
                                                                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 px-3 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md">
                                                                    {uploadingId === b.id
                                                                        ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                                        : <Upload className="h-4 w-4" />}
                                                                    Upload
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* MOBILE CARD LIST */}
                        <div className="block md:hidden flex flex-col gap-3">
                            {displayedBills.map((b) => {
                                const isLunas    = b.status_bayar === 'lunas';
                                const isMenunggu = b.status_bayar === 'menunggu_verifikasi';
                                return (
                                    <div key={b.id} className="bg-white dark:bg-[#061e16] rounded-2xl p-4 border border-slate-200 dark:border-emerald-500/20 shadow-sm flex flex-col gap-3">
                                        <div className="flex justify-between items-start gap-2">
                                            <div>
                                                <h3 className="font-extrabold text-sm text-slate-800 dark:text-white leading-tight">{b.nama_tagihan || 'SPP'}</h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{`${getMonthName(b.bulan)} ${b.tahun}`}</p>
                                            </div>
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-lg border ${isLunas ? 'bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : isMenunggu ? 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' : 'bg-red-100 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'}`}>
                                                {isLunas ? <CheckCircle2 className="h-3 w-3" /> : isMenunggu ? <Clock className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                                {isLunas ? 'Lunas' : isMenunggu ? 'Menunggu' : 'Belum'}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-end">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Nominal</span>
                                                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">{formatRupiah(b.nominal)}</span>
                                            </div>
                                            
                                            {isLunas && b.tanggal_bayar && (
                                                <div className="flex flex-col items-end text-right">
                                                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Tgl Bayar</span>
                                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{new Date(b.tanggal_bayar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-3 mt-1 border-t border-slate-100 dark:border-emerald-500/10 flex justify-end gap-2">
                                            {b.bukti_bayar && (
                                                <button 
                                                    onClick={() => { setSelectedBuktiUrl(b.bukti_bayar); setBuktiModalOpen(true); }}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-blue-100 hover:bg-blue-200 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 py-1.5 px-3 text-xs font-bold transition-all cursor-pointer border border-blue-200 dark:border-blue-500/20"
                                                >
                                                    <Eye className="h-3 w-3" /> Bukti
                                                </button>
                                            )}
                                            {!isLunas && !isMenunggu && (
                                                <>
                                                    <input type="file" accept="image/*" className="hidden"
                                                        ref={el => fileInputRefs.current[b.id] = el}
                                                        onChange={(e) => handleUpload(b.id, e.target.files[0])} />
                                                    <button
                                                        onClick={() => fileInputRefs.current[b.id].click()}
                                                        disabled={uploadingId === b.id}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 px-3 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md">
                                                        {uploadingId === b.id
                                                            ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                            : <Upload className="h-3 w-3" />}
                                                        Upload Bukti
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        </>
                                );
                            })()}
                        </>
                    )}
                </div>
            </div>



            {/* Bukti Pembayaran Modal */}
            {buktiModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setBuktiModalOpen(false)}>
                    <div className="relative max-w-3xl w-full mx-auto" onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setBuktiModalOpen(false)}
                            className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors cursor-pointer"
                        >
                            <X className="w-8 h-8" />
                        </button>
                        <img 
                            src={`${selectedBuktiUrl}`} 
                            alt="Bukti Pembayaran" 
                            className="w-full h-auto max-h-[85vh] object-contain rounded-2xl shadow-2xl bg-white/5"
                        />
                    </div>
                </div>
            )}
        </>
    );
}
