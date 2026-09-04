import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Printer, X, FileText, Download, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function CetakSPModal({ student, spData, onClose }) {
    const { token } = useAuth();
    const [loadingData, setLoadingData] = useState(false);
    const [pelanggaranData, setPelanggaranData] = useState([]);
    const [fetchError, setFetchError] = useState(null);

    const API_URL = '/api';

    useEffect(() => {
        if (student) {
            fetchPelanggaranData();
        }
    }, [student]);

    const fetchPelanggaranData = async () => {
        setLoadingData(true);
        setFetchError(null);
        try {
            const res = await fetch(`${API_URL}/kedisiplinan?siswa_id=${student.id}&kategori=pelanggaran`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setPelanggaranData(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching pelanggaran:", err);
            setFetchError(err.message || 'Gagal memuat detail pelanggaran');
        } finally {
            setLoadingData(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // Calculate SP level based on jenis_sp if passed, or default logic
    const spNumber = spData?.jenis_sp ? spData.jenis_sp.replace('SP ', '') : '1';
    
    // Determine action text based on SP level
    let actionText = "pemanggilan orang tua/wali siswa ke sekolah";
    if (spNumber === '2') {
        actionText = "skorsing sementara";
    } else if (spNumber === '3') {
        actionText = "dikembalikan kepada orang tua (dikeluarkan dari sekolah)";
    }

    // Determine print date
    const printDate = spData?.tanggal_sp ? new Date(spData.tanggal_sp) : new Date();

    const SPContent = () => (
        <div id="sp-print-area" className="w-[800px] min-h-[1131px] bg-white text-black p-12 mx-auto relative shadow-2xl border border-slate-200" style={{ transformOrigin: 'top center' }}>
            
            {/* KOP SURAT */}
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

            {/* NOMOR SURAT & PERIHAL */}
            <div className="flex justify-between mb-8 text-sm">
                <div>
                    <table className="text-left">
                        <tbody>
                            <tr><td className="w-24 align-top">Nomor</td><td className="w-4 align-top">:</td><td>.../SMP-MDI/BK/{printDate.getFullYear()}</td></tr>
                            <tr><td className="align-top">Lampiran</td><td className="align-top">:</td><td>-</td></tr>
                            <tr><td className="align-top font-bold">Perihal</td><td className="align-top font-bold">:</td><td className="font-bold underline">SURAT PERINGATAN {spNumber}</td></tr>
                        </tbody>
                    </table>
                </div>
                <div className="text-right">
                    Garut, {format(printDate, 'dd MMMM yyyy', { locale: id })}
                </div>
            </div>

            {/* TUJUAN SURAT */}
            <div className="mb-8 text-sm">
                <p>Kepada Yth,</p>
                <p>Bapak/Ibu Orang Tua / Wali Siswa dari:</p>
                <p className="font-bold">{student.nama_lengkap}</p>
                <p>di Tempat</p>
            </div>

            {/* ISI SURAT */}
            <div className="mb-8 text-sm text-justify leading-relaxed">
                <p className="mb-4">
                    Assalamu'alaikum Warahmatullahi Wabarakatuh,
                </p>
                <p className="mb-4">
                    Puji syukur kita panjatkan ke hadirat Allah SWT atas segala limpahan rahmat dan karunia-Nya. Shalawat serta salam senantiasa tercurah kepada Nabi Muhammad SAW.
                </p>
                <p className="mb-4">
                    Melalui surat ini, kami dari pihak Bimbingan dan Konseling (BK) SMP Plus Ma'had Darul Ikhlas memberitahukan bahwa putra/putri Bapak/Ibu:
                </p>
                
                <table className="w-full ml-8 mb-4">
                    <tbody>
                        <tr><td className="w-32 py-1">Nama Siswa</td><td className="w-4">:</td><td className="font-bold">{student.nama_lengkap}</td></tr>
                        <tr><td className="w-32 py-1">NIS</td><td className="w-4">:</td><td>{student.nis}</td></tr>
                        <tr><td className="w-32 py-1">Kelas</td><td className="w-4">:</td><td>{student.kelas}</td></tr>
                    </tbody>
                </table>

                <p className="mb-4">
                    Telah tercatat melakukan pelanggaran tata tertib sekolah. Berikut adalah rincian pelanggaran yang tercatat pada sistem kami:
                </p>

                {/* TABEL PELANGGARAN */}
                <table className="w-full border-collapse border border-black mb-4">
                    <thead>
                        <tr className="bg-slate-100">
                            <th className="border border-black p-2 w-12 text-center">No</th>
                            <th className="border border-black p-2 text-left">Tanggal</th>
                            <th className="border border-black p-2 text-left">Jenis Pelanggaran</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pelanggaranData.slice(0, 5).map((p, idx) => (
                            <tr key={idx}>
                                <td className="border border-black p-2 text-center">{idx + 1}</td>
                                <td className="border border-black p-2">{format(new Date(p.tanggal_kejadian), 'dd/MM/yyyy')}</td>
                                <td className="border border-black p-2">{p.nama_kegiatan}</td>
                            </tr>
                        ))}
                        {pelanggaranData.length > 5 && (
                            <tr>
                                <td colSpan={3} className="border border-black p-2 text-center italic text-slate-600">... dan {pelanggaranData.length - 5} pelanggaran lainnya.</td>
                            </tr>
                        )}
                        {pelanggaranData.length === 0 && (
                            <tr>
                                <td colSpan={3} className="border border-black p-2 text-center italic text-slate-600">Belum ada rincian pelanggaran yang tercatat.</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <p className="mb-4">
                    Sehubungan dengan hal tersebut, pihak sekolah memutuskan untuk memberikan tindakan berupa <span className="font-bold">{actionText}</span>.
                </p>

                {spData?.keterangan && (
                    <div className="mb-4 p-3 border border-black">
                        <p className="font-bold mb-1">Catatan Tambahan:</p>
                        <p>{spData.keterangan}</p>
                    </div>
                )}

                {spNumber === '1' && (
                    <>
                        <p className="mb-4">
                            Untuk itu, kami mengundang Bapak/Ibu untuk hadir ke sekolah guna membicarakan dan mencari solusi terbaik bagi perkembangan putra/putri Bapak/Ibu, pada:
                        </p>

                        <table className="w-full ml-8 mb-4">
                            <tbody>
                                <tr><td className="w-32 py-1">Hari/Tanggal</td><td className="w-4">:</td><td>...........................................................</td></tr>
                                <tr><td className="w-32 py-1">Waktu</td><td className="w-4">:</td><td>08.00 - Selesai</td></tr>
                                <tr><td className="w-32 py-1">Tempat</td><td className="w-4">:</td><td>Ruang BK SMP Plus Ma'had Darul Ikhlas</td></tr>
                            </tbody>
                        </table>

                        <p className="mb-4">
                            Kehadiran Bapak/Ibu sangat kami harapkan. Jika Bapak/Ibu tidak dapat hadir, mohon konfirmasi kepada pihak sekolah melalui wali kelas atau guru BK.
                        </p>
                    </>
                )}
                
                <p className="mb-4">
                    Demikian surat peringatan ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.
                </p>
                <p>
                    Wassalamu'alaikum Warahmatullahi Wabarakatuh.
                </p>
            </div>

            {/* TANDA TANGAN */}
            <div className="mt-12 flex justify-between text-sm">
                <div className="text-center w-48">
                    <p className="mb-20">Mengetahui,<br/>Kepala Sekolah</p>
                    <p className="font-bold underline">(...................................)</p>
                    <p>NIP. </p>
                </div>
                <div className="text-center w-48">
                    <p className="mb-20"><br/>Guru Bimbingan Konseling</p>
                    <p className="font-bold underline">(...................................)</p>
                    <p>NIP. </p>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in no-print">
                <style>{`
                    @media print {
                        body * { visibility: hidden !important; }
                        .print-area, .print-area * { visibility: visible !important; }
                        .print-area { 
                            position: absolute !important; 
                            left: 0 !important; 
                            top: 0 !important; 
                            width: 100% !important; 
                            background: white !important;
                            color: black !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            box-shadow: none !important;
                        }
                        .no-print { display: none !important; }
                        
                        @page {
                            size: A4 portrait;
                            margin: 1cm;
                        }
                    }
                `}</style>
                
                <div className="bg-white dark:bg-[#041610] rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-emerald-500/10 overflow-hidden">
                    
                    {/* Modal Header */}
                    <div className="flex justify-between items-start sm:items-center p-4 sm:p-5 border-b border-slate-100 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#061e16] gap-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            <div className="flex items-center gap-2 shrink-0">
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                <h3 className="font-bold text-sm md:text-base text-slate-800 dark:text-white truncate">
                                    Cetak Surat Peringatan: <span className="text-amber-600">{student.nama_lengkap}</span>
                                </h3>
                            </div>
                        </div>
                        
                        <button 
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                            }}
                            className="p-2 hover:bg-slate-200 dark:hover:bg-emerald-500/20 rounded-full transition-colors cursor-pointer shrink-0 ml-1 self-start sm:self-center"
                        >
                            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                        </button>
                    </div>
                    
                    {/* Modal Body with Preview */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-200 dark:bg-[#010806] custom-scrollbar">
                        {fetchError ? (
                            <div className="flex flex-col items-center justify-center h-full text-red-500">
                                <AlertTriangle className="h-10 w-10 mb-2 opacity-50" />
                                <p>Error: {fetchError}</p>
                            </div>
                        ) : loadingData ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-emerald-600">
                                <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                                <p className="font-bold animate-pulse">Memuat data pelanggaran...</p>
                            </div>
                        ) : (
                            <div className="transform scale-[0.8] origin-top">
                                <SPContent />
                            </div>
                        )}
                    </div>
                    
                    {/* Modal Footer */}
                    <div className="p-5 border-t border-slate-100 dark:border-emerald-500/10 bg-white dark:bg-[#061e16] flex justify-end gap-3">
                        <button 
                            onClick={handlePrint} 
                            disabled={loadingData}
                            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                        >
                            <Printer className="h-5 w-5" /> Cetak Sekarang
                        </button>
                    </div>
                </div>
            </div>

            {/* HIDDEN PRINT TARGET */}
            <div id="sp-hidden-print-container" className="hidden print:block print-area">
                {!loadingData && <SPContent />}
            </div>
        </>
    );
}
