"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useChild } from '@/context/ChildContext';
import { Download, Printer, ArrowLeft, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

export default function CetakKartuSPP() {
    const router = useRouter();
    const { token } = useAuth();
    const { selectedChild } = useChild();
    
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const controlsTimeoutRef = React.useRef(null);

    const API_URL = '/api';

    useEffect(() => {
        return () => {
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, []);

    const showZoomControlsTemp = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 3000);
    };

    useEffect(() => {
        if (!token || !selectedChild) return;
        const fetchBills = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_URL}/keuangan?siswa_id=${selectedChild.id}`, {
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
        fetchBills();
    }, [token, selectedChild]);

    const getMonthName = (num) => {
        const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
        return months[num - 1] || '';
    };

    const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    const handleDownloadPdf = async () => {
        try {
            setDownloading(true);
            const html2pdf = (await import('html2pdf.js')).default;
            const element = document.getElementById('kartu-spp-print-area');
            const opt = {
                margin:      [0.5, 0.5, 0.5, 0.5],
                filename:    `Kartu_SPP_${selectedChild?.nama_lengkap || 'Siswa'}.pdf`,
                image:       { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF:       { unit: 'in', format: 'a4', orientation: 'portrait' }
            };
            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            alert('Gagal mengunduh PDF.');
        } finally {
            setDownloading(false);
        }
    };

    const handlePrint = () => window.print();

    if (!selectedChild) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-[#020c08]">
                <div className="glass-panel rounded-3xl p-8 text-center text-slate-500">
                    Pilih siswa terlebih dahulu.
                    <br />
                    <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl">Kembali</button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-[#020c08]">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
            </div>
        );
    }

    const billsByYear = bills.reduce((acc, b) => {
        const year = b.tahun || new Date().getFullYear();
        if (!acc[year]) acc[year] = [];
        acc[year].push(b);
        return acc;
    }, {});
    const sortedYears = Object.keys(billsByYear).sort((a, b) => b - a);

    return (
        <div className="min-h-screen bg-slate-200 dark:bg-[#010806] py-8 px-4 sm:px-8">
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #kartu-spp-print-area, #kartu-spp-print-area * { visibility: visible; }
                    #kartu-spp-print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; border: none; box-shadow: none; }
                }
            `}</style>
            
            <div className="max-w-4xl mx-auto flex flex-col gap-6">
                
                {/* Action Bar (Not Printed) */}
                <div className="print:hidden flex items-center justify-between gap-4 bg-white dark:bg-[#041610] p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-emerald-500/10">
                    <button 
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold transition-colors cursor-pointer"
                    >
                        <ArrowLeft className="h-5 w-5" /> 
                        <span className="text-sm sm:text-base">Kembali</span>
                    </button>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            onClick={handleDownloadPdf}
                            disabled={downloading}
                            title="Unduh PDF"
                            className="flex items-center justify-center gap-2 bg-emerald-100 dark:bg-emerald-500/10 hover:bg-emerald-200 dark:hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 disabled:opacity-50 px-3 sm:px-5 py-2.5 rounded-xl font-bold transition-all cursor-pointer"
                        >
                            {downloading
                                ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                                : <Download className="h-4 w-4" />}
                            <span className="hidden sm:inline">Unduh</span>
                        </button>
                        <button
                            onClick={handlePrint}
                            title="Cetak Sekarang"
                            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3 sm:px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                        >
                            <Printer className="h-4 w-4" /> 
                            <span className="hidden sm:inline">Cetak</span>
                        </button>
                    </div>
                </div>

                {/* Print Area with Pinch-to-Zoom */}
                <div className="w-full h-[calc(100vh-180px)] min-h-[600px] border border-slate-200 dark:border-emerald-500/10 rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#020c08] relative print:h-auto print:border-none print:bg-transparent print:min-h-0 print:overflow-visible">
                    <TransformWrapper
                        initialScale={0.9}
                        minScale={0.3}
                        maxScale={3}
                        centerOnInit={true}
                        wheel={{ step: 0.1 }}
                        pinch={{ step: 5 }}
                        onZoom={showZoomControlsTemp}
                        onPanning={showZoomControlsTemp}
                    >
                        {({ zoomIn, zoomOut, resetTransform }) => (
                            <React.Fragment>
                                {/* Floating controls */}
                                <div 
                                    className={`absolute top-4 right-4 z-10 flex flex-col gap-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-1 shadow-md border border-slate-200 dark:border-slate-700 print:hidden transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                                    onMouseEnter={() => {
                                        setShowControls(true);
                                        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
                                    }}
                                    onMouseLeave={() => {
                                        controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
                                    }}
                                >
                                    <button onClick={() => { zoomIn(); showZoomControlsTemp(); }} className="p-2 text-slate-600 hover:text-emerald-600 transition-colors bg-transparent border-none cursor-pointer" title="Perbesar">
                                        <ZoomIn className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => { resetTransform(); showZoomControlsTemp(); }} className="p-2 text-slate-600 hover:text-emerald-600 transition-colors bg-transparent border-none cursor-pointer border-y border-slate-200 dark:border-slate-700" title="Reset">
                                        <RotateCcw className="w-4 h-4 mx-auto" />
                                    </button>
                                    <button onClick={() => { zoomOut(); showZoomControlsTemp(); }} className="p-2 text-slate-600 hover:text-emerald-600 transition-colors bg-transparent border-none cursor-pointer" title="Perkecil">
                                        <ZoomOut className="w-5 h-5" />
                                    </button>
                                </div>

                                <TransformComponent wrapperClass="!w-full !h-full cursor-grab active:cursor-grabbing print:!transform-none print:!w-full print:!h-auto print:!overflow-visible" contentClass="print:!transform-none print:!w-full print:!h-auto">
                                    <div id="kartu-spp-print-area" className="w-[800px] min-w-[800px] print:w-full print:min-w-0 bg-transparent py-4 sm:py-8 print:py-0">
                        {sortedYears.length > 0 ? sortedYears.map((year, yearIndex) => {
                            const yearBills = billsByYear[year];
                            const totalTagihanYear = yearBills.reduce((s, b) => s + Number(b.nominal || 0), 0);

                            return (
                                <div key={year} className={`bg-white text-black p-8 sm:p-10 shadow-sm border border-slate-200 rounded-2xl print:border-none print:shadow-none print:rounded-none print:mx-0 print:p-0 ${yearIndex < sortedYears.length - 1 ? 'mb-8 print:mb-0' : ''}`} style={yearIndex < sortedYears.length - 1 ? { pageBreakAfter: 'always' } : {}}>
                                    {/* Kop Surat */}
                                    <div className="border-b-4 border-black pb-3 mb-8">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="shrink-0 w-28 h-20 flex items-center justify-center">
                                                <img src="/logo_mdi.png" alt="Logo MDI" className="w-full h-full object-contain" onError={e => { e.target.style.display='none'; }} />
                                            </div>
                                            <div className="flex-1 text-center">
                                                <p className="text-base font-bold uppercase text-black tracking-wide whitespace-nowrap">YAYASAN PENDIDIKAN MA'HAD DARUL IKHLAS</p>
                                                <p className="text-[11px] text-black mt-0.5 whitespace-nowrap">Akta Notaris Tanti Sulistyo Wirdati, SH - NO – 3X-A-2005</p>
                                                <p className="text-xl font-black uppercase text-black tracking-widest mt-1 whitespace-nowrap">SMP PLUS MA'HAD DARUL IKHLAS</p>
                                                <p className="text-[11px] text-black mt-0.5 whitespace-nowrap">Alamat : Kp. Gandayayi Rt.02 Rw05 Desa Cibiuk Kaler Kec. Cibiuk Kab. Garut</p>
                                            </div>
                                            <div className="shrink-0 w-28 h-20 flex items-center justify-center">
                                                <img src="/logo_lambang.png" alt="Lambang" className="w-full h-full object-contain" onError={e => { e.target.style.display='none'; }} />
                                            </div>
                                        </div>
                                    </div>

                                    <h2 className="text-xl font-bold text-center underline mb-8 tracking-widest text-black">KARTU PEMBAYARAN SPP</h2>

                                    {/* Identitas Siswa */}
                                    <div className="flex justify-between items-start mb-8 text-sm font-semibold text-black">
                                        <table className="w-1/2 text-black">
                                            <tbody>
                                                <tr><td className="w-36 py-1.5 align-top">Nama Siswa</td><td className="w-4 align-top">:</td><td className="align-top uppercase font-bold">{selectedChild?.nama_lengkap}</td></tr>
                                                <tr><td className="py-1.5 align-top">NISN</td><td className="align-top">:</td><td className="align-top font-mono">{selectedChild?.nis || selectedChild?.nisn}</td></tr>
                                            </tbody>
                                        </table>
                                        <table className="w-5/12 text-black">
                                            <tbody>
                                                <tr><td className="w-32 py-1.5 align-top">Kelas</td><td className="w-4 align-top">:</td><td className="align-top font-bold uppercase">{selectedChild?.kelas}</td></tr>
                                                <tr><td className="py-1.5 align-top">Tahun Ajaran</td><td className="align-top">:</td><td className="align-top">{year}/{parseInt(year) + 1}</td></tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Tabel SPP */}
                                    <div className="mb-10">
                                        <h3 className="font-bold text-base mb-3 text-black">A. RINCIAN TAGIHAN</h3>
                                        <table className="w-full border-collapse border border-black text-sm text-center text-black">
                                            <thead className="bg-gray-100 font-bold">
                                                <tr>
                                                    <th className="border border-black py-2.5 px-3 w-12">No</th>
                                                    <th className="border border-black py-2.5 px-3 text-left">Bulan / Tagihan</th>
                                                    <th className="border border-black py-2.5 px-3 w-36">Nominal</th>
                                                    <th className="border border-black py-2.5 px-3 w-28">Status</th>
                                                    <th className="border border-black py-2.5 px-3 w-40 whitespace-nowrap">Tanggal Bayar</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {yearBills.map((b, idx) => (
                                                    <tr key={b.id}>
                                                        <td className="border border-black py-2.5 px-3">{idx + 1}</td>
                                                        <td className="border border-black py-2.5 px-3 text-left">
                                                            <span className="font-semibold">{b.nama_tagihan || 'SPP'}</span> - <span className="text-[13px]">{`${getMonthName(b.bulan)} ${b.tahun}`}</span>
                                                        </td>
                                                        <td className="border border-black py-2.5 px-3">{formatRupiah(b.nominal)}</td>
                                                        <td className="border border-black py-2.5 px-3 uppercase text-xs font-bold" style={{ color: b.status_bayar === 'lunas' ? '#16a34a' : '#dc2626' }}>
                                                            {b.status_bayar.replace(/_/g, ' ')}
                                                        </td>
                                                        <td className="border border-black py-2.5 px-3 whitespace-nowrap">
                                                            {b.tanggal_bayar && b.status_bayar === 'lunas'
                                                                ? new Date(b.tanggal_bayar).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                                                                : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-gray-50 font-bold">
                                                    <td colSpan="2" className="border border-black py-3 px-3 text-right uppercase">Total Keseluruhan :</td>
                                                    <td className="border border-black py-3 px-3">{formatRupiah(totalTagihanYear)}</td>
                                                    <td colSpan="2" className="border border-black py-3 px-3"></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Tanda Tangan */}
                                    <div className="flex justify-end text-sm text-black">
                                        <div className="text-center">
                                            <p>Garut, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                            <p className="mt-1">Bagian Tata Usaha / Keuangan</p>
                                            <div className="mt-20 font-bold underline">____________________________</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="bg-white text-black p-8 sm:p-10 shadow-sm border border-slate-200 rounded-2xl print:border-none print:shadow-none print:rounded-none print:mx-0 print:p-0">
                                {/* Kop Surat */}
                                <div className="border-b-4 border-black pb-3 mb-8">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="shrink-0 w-28 h-20 flex items-center justify-center">
                                            <img src="/logo_mdi.png" alt="Logo MDI" className="w-full h-full object-contain" onError={e => { e.target.style.display='none'; }} />
                                        </div>
                                        <div className="flex-1 text-center">
                                            <p className="text-base font-bold uppercase text-black tracking-wide whitespace-nowrap">YAYASAN PENDIDIKAN MA'HAD DARUL IKHLAS</p>
                                            <p className="text-[11px] text-black mt-0.5 whitespace-nowrap">Akta Notaris Tanti Sulistyo Wirdati, SH - NO – 3X-A-2005</p>
                                            <p className="text-xl font-black uppercase text-black tracking-widest mt-1 whitespace-nowrap">SMP PLUS MA'HAD DARUL IKHLAS</p>
                                            <p className="text-[11px] text-black mt-0.5 whitespace-nowrap">Alamat : Kp. Gandayayi Rt.02 Rw05 Desa Cibiuk Kaler Kec. Cibiuk Kab. Garut</p>
                                        </div>
                                        <div className="shrink-0 w-28 h-20 flex items-center justify-center">
                                            <img src="/logo_lambang.png" alt="Lambang" className="w-full h-full object-contain" onError={e => { e.target.style.display='none'; }} />
                                        </div>
                                    </div>
                                </div>

                                <h2 className="text-xl font-bold text-center underline mb-8 tracking-widest text-black">KARTU PEMBAYARAN SPP</h2>

                                {/* Identitas Siswa */}
                                <div className="flex justify-between items-start mb-8 text-sm font-semibold text-black">
                                    <table className="w-1/2 text-black">
                                        <tbody>
                                            <tr><td className="w-36 py-1.5 align-top">Nama Siswa</td><td className="w-4 align-top">:</td><td className="align-top uppercase font-bold">{selectedChild?.nama_lengkap}</td></tr>
                                            <tr><td className="py-1.5 align-top">NISN</td><td className="align-top">:</td><td className="align-top font-mono">{selectedChild?.nis || selectedChild?.nisn}</td></tr>
                                        </tbody>
                                    </table>
                                    <table className="w-5/12 text-black">
                                        <tbody>
                                            <tr><td className="w-32 py-1.5 align-top">Kelas</td><td className="w-4 align-top">:</td><td className="align-top font-bold uppercase">{selectedChild?.kelas}</td></tr>
                                            <tr><td className="py-1.5 align-top">Tahun Ajaran</td><td className="align-top">:</td><td className="align-top">{new Date().getFullYear()}/{new Date().getFullYear() + 1}</td></tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Tabel SPP */}
                                <div className="mb-10">
                                    <h3 className="font-bold text-base mb-3 text-black">A. RINCIAN TAGIHAN</h3>
                                    <table className="w-full border-collapse border border-black text-sm text-center text-black">
                                        <thead className="bg-gray-100 font-bold">
                                            <tr>
                                                <th className="border border-black py-2.5 px-3 w-12">No</th>
                                                <th className="border border-black py-2.5 px-3 text-left">Bulan / Tagihan</th>
                                                <th className="border border-black py-2.5 px-3 w-36">Nominal</th>
                                                <th className="border border-black py-2.5 px-3 w-28">Status</th>
                                                <th className="border border-black py-2.5 px-3 w-40 whitespace-nowrap">Tanggal Bayar</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr><td colSpan="5" className="border border-black py-6 italic text-gray-500">Belum ada data tagihan.</td></tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Tanda Tangan */}
                                <div className="flex justify-end text-sm text-black">
                                    <div className="text-center">
                                        <p>Garut, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                        <p className="mt-1">Bagian Tata Usaha / Keuangan</p>
                                        <div className="mt-20 font-bold underline">____________________________</div>
                                    </div>
                                </div>
                            </div>
                        )}
                                    </div>
                                </TransformComponent>
                            </React.Fragment>
                        )}
                    </TransformWrapper>
                </div>
            </div>
        </div>
    );
}
