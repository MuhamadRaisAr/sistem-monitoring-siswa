import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Printer, X, FileText, Download } from 'lucide-react';
import { useTahunAjaran } from '@/hooks/useTahunAjaran';
import RaportContent from '@/components/RaportContent';

export default function CetakRaportAlumniModal({ student, onClose }) {
    const { token } = useAuth();
    const { tahunAjaranList, loadingTahunAjaran } = useTahunAjaran();
    
    const [selectedTahunAjaranId, setSelectedTahunAjaranId] = useState('');
    const [loadingRaport, setLoadingRaport] = useState(false);
    
    const [raportData, setRaportData] = useState(null);
    const [kehadiranData, setKehadiranData] = useState({ hadir: 0, izin: 0, sakit: 0, alpa: 0 });
    const [pelanggaranData, setPelanggaranData] = useState([]);
    const [mapelKelasList, setMapelKelasList] = useState([]);
    const [ekskulData, setEkskulData] = useState([]);
    const [fetchError, setFetchError] = useState(null);
    
    const [debugState, setDebugState] = useState("idle");
    
    const API_URL = '/api';
    const zoomScale = 0.8;

    useEffect(() => {
        if (tahunAjaranList.length > 0 && !selectedTahunAjaranId) {
            setSelectedTahunAjaranId(tahunAjaranList[0].id.toString());
        }
    }, [tahunAjaranList, selectedTahunAjaranId]);
    
    // Auto Fetch
    useEffect(() => {
        if (selectedTahunAjaranId && student) {
            fetchRaportData();
        }
    }, [selectedTahunAjaranId, student]);

    const fetchRaportData = async () => { try {
        setDebugState("started");
        if (!selectedTahunAjaranId || !student) { setDebugState("returned_early"); return; }
        setDebugState("passed_early_return");
        
        const selectedTA = tahunAjaranList.find(t => t.id.toString() === selectedTahunAjaranId.toString());
        const currentSemester = selectedTA ? selectedTA.semester : '';

        setDebugState("about_to_set_loading");
        setLoadingRaport(true);
        setDebugState("set_loading_true");
        setFetchError(null);
        try {
            // 1. Fetch Nilai Raport
            const resNilai = await fetch(`${API_URL}/nilai/siswa/${student.id}?semester=${encodeURIComponent(currentSemester)}&tahun_ajaran_id=${selectedTahunAjaranId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const dataNilai = await resNilai.json();
            setRaportData(dataNilai);
        setDebugState("set_raport_data");

            // 2. Fetch Kehadiran (Logs Akademik) & Jadwal
            const [resAkademik, resJadwal] = await Promise.all([
                fetch(`${API_URL}/akademik?siswa_id=${student.id}&tahun_ajaran_id=${selectedTahunAjaranId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/jadwal`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            const dataAkademik = await resAkademik.json();
            const dataJadwal = await resJadwal.json();
            const jadwal = Array.isArray(dataJadwal) ? dataJadwal : [];
            
            const mapelKelas = [...new Set(jadwal.filter(j => j.kelas === student.kelas).map(j => j.mata_pelajaran))];
            setMapelKelasList(mapelKelas);
            
            const logsSemester = Array.isArray(dataAkademik) ? dataAkademik : [];
            
            const getHariFromDate = (dateStr) => {
                const d = new Date(dateStr);
                const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                return days[d.getDay()];
            };
            const getJamMulai = (log, jadwalArr) => {
                const hari = getHariFromDate(log.tanggal);
                const j = jadwalArr.find(x => 
                    x.mata_pelajaran?.toLowerCase() === log.jenis_kegiatan?.toLowerCase() && 
                    x.hari?.toLowerCase() === hari.toLowerCase() && 
                    x.kelas === student.kelas
                );
                return j?.jam_mulai || log.waktu || '23:59:59';
            };

            const sortedLogs = [...logsSemester].sort((a,b) => {
                const dateA = a.tanggal || '';
                const dateB = b.tanggal || '';
                if (dateA !== dateB) return dateA.localeCompare(dateB);
                
                const jamA = getJamMulai(a, jadwal);
                const jamB = getJamMulai(b, jadwal);
                
                if (jamA === jamB) return (a.id || 0) - (b.id || 0);
                return jamA.localeCompare(jamB);
            });

            const uniqueByDate = {};
            sortedLogs.forEach(log => {
                if (!log.tanggal) return;
                const d = new Date(log.tanggal);
                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                
                if (!uniqueByDate[dateStr]) {
                    uniqueByDate[dateStr] = log;
                }
            });
            
            let h = 0, i = 0, s = 0, a = 0;
            Object.values(uniqueByDate).forEach(l => {
                if (l.kehadiran === 'hadir') h++;
                else if (l.kehadiran === 'izin') i++;
                else if (l.kehadiran === 'sakit') s++;
                else if (l.kehadiran === 'alpa') a++;
            });
            setKehadiranData({ hadir: h, izin: i, sakit: s, alpa: a });

            // 3. Fetch Pelanggaran
            const resKedisiplinan = await fetch(`${API_URL}/kedisiplinan?siswa_id=${student.id}&kategori=pelanggaran`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const dataKedisiplinan = await resKedisiplinan.json();
            setPelanggaranData(Array.isArray(dataKedisiplinan) ? dataKedisiplinan.filter(p => (p.semester || '') === currentSemester) : []);

            // 4. Fetch Ekskul
            const resEkskul = await fetch(`${API_URL}/nilai-ekskul?siswa_id=${student.id}&tahun_ajaran_id=${selectedTahunAjaranId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const dataEkskul = await resEkskul.json();
            setEkskulData(Array.isArray(dataEkskul) ? dataEkskul : []);

        } catch (err) {
            setDebugState("caught_error_inside: " + err.message);
            console.error("Error fetching raport details:", err);
            setFetchError(err.message || 'Unknown error occurred');
        } finally {
            setDebugState(prev => prev + " -> finally");
            setLoadingRaport(false);
        }
    } catch (globalErr) {
        setDebugState("global_error: " + globalErr.message);
    }
};

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPdf = async () => {
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            
            // Get the hidden print container and temporarily show it off-screen
            const printContainer = document.getElementById('alumni-hidden-print-container');
            if (printContainer) {
                printContainer.classList.remove('hidden');
                printContainer.style.display = 'block';
                printContainer.style.position = 'absolute';
                printContainer.style.top = '-9999px';
                printContainer.style.left = '-9999px';
            }

            // We must wait a tiny bit for the browser to recalculate layout
            await new Promise(resolve => setTimeout(resolve, 50));

            // Grab the actual raport content (the INNER div with the border class)
            const wrapper = printContainer.firstElementChild;
            const element = wrapper ? (wrapper.querySelector('#raport-print-area') || wrapper.firstElementChild) : document.getElementById('raport-print-area');
            
            // Override with strict print-like styles for html2pdf so it doesn't get cut off
            const originalCssText = element.style.cssText;
            element.style.width = '800px';
            element.style.margin = '0';
            element.style.padding = '0'; 
            element.style.border = 'none'; 
            element.style.boxShadow = 'none';
            
            const opt = {
                margin:       40, 
                filename:     `Raport_${student?.nama_lengkap || 'Siswa'}.pdf`,
                image:        { type: 'jpeg', quality: 1 },
                html2canvas:  { scale: 2, useCORS: true, letterRendering: true, windowWidth: 800 },
                jsPDF:        { unit: 'px', format: [880, 1245], orientation: 'portrait' }, 
                pagebreak:    { mode: ['css', 'legacy'], avoid: 'tr' }
            };
            
            await html2pdf().set(opt).from(element).save();

            // Restore styling
            element.style.cssText = originalCssText;

            // Restore hidden state
            if (printContainer) {
                printContainer.classList.add('hidden');
                printContainer.style.display = '';
                printContainer.style.position = '';
                printContainer.style.top = '';
                printContainer.style.left = '';
            }
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Gagal mengunduh PDF. Pastikan perangkat Anda mendukung fitur ini.");
        }
    };

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
                    <div className="flex flex-col sm:flex-row justify-between items-center p-5 border-b border-slate-100 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#061e16] gap-4">
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-emerald-500" />
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                                Riwayat Raport: <span className="text-emerald-600">{student.nama_lengkap}</span>
                            </h3>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <select
                                value={selectedTahunAjaranId}
                                onChange={(e) => setSelectedTahunAjaranId(e.target.value)}
                                disabled={loadingTahunAjaran || loadingRaport}
                                className="rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#041610] py-2 px-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm text-ellipsis"
                            >
                                {loadingTahunAjaran ? (
                                    <option>Memuat...</option>
                                ) : tahunAjaranList.length === 0 ? (
                                    <option value="">Tidak ada data TA</option>
                                ) : (
                                    tahunAjaranList.map(ta => (
                                        <option key={ta.id} value={ta.id}>
                                            {ta.nama_tahun} {ta.semester}
                                        </option>
                                    ))
                                )}
                            </select>
                            
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-slate-200 dark:hover:bg-emerald-500/20 rounded-full transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                            </button>
                        </div>
                    </div>
                    
                    {/* Modal Body with Preview */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-200 dark:bg-[#010806] custom-scrollbar">
                        {fetchError ? (
                            <div className="flex flex-col items-center justify-center h-full text-red-500">
                                <FileText className="h-10 w-10 mb-2 opacity-50" />
                                <p>Error: {fetchError}</p>
                            </div>
                        ) : !raportData && !loadingRaport ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                <FileText className="h-10 w-10 mb-2 opacity-20" />
                                <p>Memuat data raport...</p>
                            </div>
                        ) : loadingRaport ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-emerald-600">
                                <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                                <p className="font-bold animate-pulse">Menyusun raport...</p>
                            </div>
                        ) : (
                            <RaportContent 
                                studentObj={student} 
                                dataRaport={raportData} 
                                dataKehadiran={kehadiranData} 
                                dataPelanggaran={pelanggaranData} 
                                listMapelKelas={mapelKelasList} 
                                dataEkskul={ekskulData} 
                                tahunAjaranList={tahunAjaranList} 
                                selectedTahunAjaranId={selectedTahunAjaranId} 
                                zoomScale={zoomScale}
                            />
                        )}
                    </div>
                    
                    {/* Modal Footer */}
                    <div className="p-5 border-t border-slate-100 dark:border-emerald-500/10 bg-white dark:bg-[#061e16] flex justify-end gap-3">
                                                <button 
                            onClick={handleDownloadPdf} 
                            disabled={loadingRaport || !raportData}
                            className="flex items-center justify-center gap-2 bg-emerald-100 dark:bg-emerald-500/10 hover:bg-emerald-200 dark:hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 disabled:opacity-50 px-6 py-2.5 rounded-xl font-bold transition-all cursor-pointer mr-auto"
                        >
                            <Download className="h-5 w-5" /> Unduh PDF
                        </button>
                        <button 
                            onClick={handlePrint} 
                            disabled={loadingRaport || !raportData}
                            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                        >
                            <Printer className="h-5 w-5" /> Cetak Sekarang
                        </button>
                    </div>
                </div>
            </div>

                        {/* HIDDEN PRINT TARGET (Only visible during print OR PDF generation) */}
            <div id="alumni-hidden-print-container" className="hidden print:block print-area">
                {!loadingRaport && raportData && (
                    <RaportContent 
                        studentObj={student} 
                        dataRaport={raportData} 
                        dataKehadiran={kehadiranData} 
                        dataPelanggaran={pelanggaranData} 
                        listMapelKelas={mapelKelasList} 
                        dataEkskul={ekskulData} 
                        tahunAjaranList={tahunAjaranList} 
                        selectedTahunAjaranId={selectedTahunAjaranId} 
                        zoomScale={1}
                    />
                )}
            </div>
        </>
    );
}



































