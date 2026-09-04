import React, { useRef, useState } from 'react';
import { X, Printer, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const CetakSlipGajiModal = ({ isOpen, onClose, honorData, tahunAjaranList }) => {
    const printRef = useRef(null);
    const [isDownloading, setIsDownloading] = useState(false);

    if (!isOpen || !honorData) return null;

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        if (!printRef.current) return;
        setIsDownloading(true);
        const element = printRef.current;
        const opt = {
            margin: 0.5,
            filename: `Slip_Gaji_${honorData.nama_lengkap.replace(/\s+/g, '_')}_${honorData.bulan}_${honorData.tahun}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        try {
            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error("PDF generation error:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    const getBulanName = (bln) => {
        const bulanArr = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return bulanArr[bln - 1] || bln;
    };

    const formatRupiah = (angka) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);
    };

    const getTahunAjaranText = () => {
        if (!tahunAjaranList || !honorData.tahun_ajaran_id) return '';
        const ta = tahunAjaranList.find(t => t.id.toString() === honorData.tahun_ajaran_id.toString());
        if (ta) {
            const startYear = parseInt(ta.nama_tahun.substring(0, 4));
            return `${startYear}/${startYear + 1}`;
        }
        return '';
    };

    const singkatMapel = (mapelStr) => {
        if (!mapelStr) return '-';
        const kamusSingkatan = {
            'PENDIDIKAN AGAMA ISLAM DAN BUDI PEKERTI': 'PAI & BP',
            'PENDIDIKAN PANCASILA DAN KEWARGANEGARAAN': 'PPKN',
            'PENDIDIKAN JASMANI OLAHRAGA DAN KESEHATAN': 'PJOK',
            'ILMU PENGETAHUAN ALAM': 'IPA',
            'ILMU PENGETAHUAN SOSIAL': 'IPS',
            'TEKNOLOGI INFORMASI DAN KOMUNIKASI': 'TIK',
            'BAHASA INDONESIA': 'B. INDONESIA',
            'BAHASA INGGRIS': 'B. INGGRIS',
            'BAHASA SUNDA': 'B. SUNDA',
            'BAHASA ARAB': 'B. ARAB'
        };

        let result = mapelStr.toUpperCase();
        for (const [panjang, singkatan] of Object.entries(kamusSingkatan)) {
            result = result.replace(new RegExp(panjang, 'g'), singkatan);
        }
        return result;
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in print:p-0 print:bg-transparent print:backdrop-blur-none">
            <style>{`
                @media print {
                    body * { visibility: hidden !important; }
                    .print-area, .print-area * { visibility: visible !important; }
                    .print-area { 
                        position: absolute !important; 
                        left: 0 !important; 
                        top: 0 !important; 
                        width: 100% !important; 
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    .no-print { display: none !important; }
                    @page { size: A4 portrait; margin: 1cm; }
                }
            `}</style>
            
            <div className="bg-white dark:bg-[#041610] rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-emerald-500/10 overflow-hidden print:shadow-none print:border-none print:rounded-none print:h-auto">
                
                {/* Modal Header */}
                <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-100 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#061e16] no-print">
                    <h3 className="font-bold text-sm md:text-base text-slate-800 dark:text-white">
                        Cetak Slip Gaji: <span className="text-emerald-600">{honorData.nama_lengkap}</span>
                    </h3>
                    <div className="flex items-center gap-2">
                        <button 
                            type="button"
                            onClick={handleDownloadPDF}
                            disabled={isDownloading}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg disabled:opacity-50"
                        >
                            <Download className="w-4 h-4" />
                            {isDownloading ? 'Mendownload...' : 'Download PDF'}
                        </button>
                        <button 
                            type="button"
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/30 no-print"
                        >
                            <Printer className="w-4 h-4" />
                            Cetak
                        </button>
                        <button 
                            type="button"
                            onClick={onClose}
                            className="p-2 hover:bg-slate-200 dark:hover:bg-emerald-500/20 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Modal Body with Preview */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-200 dark:bg-[#010806] custom-scrollbar flex justify-center items-start">
                    <div ref={printRef} className="print-area h-max w-[800px] min-w-[800px] print:w-full print:min-w-0 bg-white text-black p-8 sm:p-10 shadow-sm border border-slate-200 rounded-2xl print:border-none print:shadow-none print:rounded-none print:mx-0 print:p-0">
                        
                        {/* Kop Surat */}
                        <div className="border-b-4 border-black pb-3 mb-8">
                            <div className="flex items-center justify-between gap-4">
                                <div className="shrink-0 w-28 h-20 flex items-center justify-center">
                                    <img src="/logo_mdi.png" alt="Logo" className="w-full h-full object-contain" onError={e => { e.target.style.display='none'; }} />
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

                        <h2 className="text-xl font-bold text-center underline mb-8 tracking-widest text-black uppercase">SLIP GAJI GURU</h2>

                        {/* Identitas Guru */}
                        <div className="flex justify-between items-start mb-8 text-sm font-semibold text-black">
                            <table className="w-1/2 text-black">
                                <tbody>
                                    <tr><td className="w-36 py-1.5 align-top">Nama Guru</td><td className="w-4 align-top">:</td><td className="align-top uppercase font-bold">{honorData.nama_lengkap}</td></tr>
                                    <tr><td className="py-1.5 align-top">Username / NIP</td><td className="align-top">:</td><td className="align-top font-mono">{honorData.username || '-'}</td></tr>
                                </tbody>
                            </table>
                            <table className="w-5/12 text-black">
                                <tbody>
                                    <tr><td className="w-32 py-1.5 align-top">Mapel</td><td className="w-4 align-top">:</td><td className="align-top font-bold uppercase">{singkatMapel(honorData.mapel)}</td></tr>
                                    <tr><td className="py-1.5 align-top">Tahun Ajaran</td><td className="align-top">:</td><td className="align-top">{getTahunAjaranText()}</td></tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Rincian Honor */}
                        <div className="mb-10">
                            <h3 className="font-bold text-base mb-3 text-black">A. RINCIAN HONOR</h3>
                            <table className="w-full border-collapse border border-black text-sm text-center text-black">
                                <thead className="bg-gray-100 font-bold">
                                    <tr>
                                        <th className="border border-black py-2.5 px-3">Bulan / Tagihan</th>
                                        <th className="border border-black py-2.5 px-3 w-32">Jumlah Pertemuan</th>
                                        <th className="border border-black py-2.5 px-3 w-36">Tarif / Pertemuan</th>
                                        <th className="border border-black py-2.5 px-3 w-36">Total Honor</th>
                                        <th className="border border-black py-2.5 px-3 w-32">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-black py-2.5 px-3 text-left">
                                            <span className="font-semibold">Honor Mengajar</span> - <span className="text-[13px]">{`${getBulanName(honorData.bulan)} ${honorData.tahun}`}</span>
                                        </td>
                                        <td className="border border-black py-2.5 px-3">{honorData.total_jam_mengajar} Pertemuan</td>
                                        <td className="border border-black py-2.5 px-3">{formatRupiah(honorData.tarif_per_jam)}</td>
                                        <td className="border border-black py-2.5 px-3 font-bold">{formatRupiah(honorData.total_honor)}</td>
                                        <td className="border border-black py-2.5 px-3 uppercase text-xs font-bold" style={{ color: honorData.status_pembayaran === 'dibayar' ? '#16a34a' : '#dc2626' }}>
                                            {honorData.status_pembayaran === 'dibayar' ? 'LUNAS' : 'BELUM DIBAYAR'}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Tanda Tangan */}
                        <div className="mt-16 flex justify-end text-sm text-black">
                            <div className="text-center w-64">
                                <p>Garut, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                <p className="mb-20">Bagian Tata Usaha / Keuangan</p>
                                <div className="border-b border-black w-full"></div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default CetakSlipGajiModal;
