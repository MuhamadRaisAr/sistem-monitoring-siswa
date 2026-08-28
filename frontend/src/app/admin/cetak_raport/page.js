"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Printer, Search, FileText, X, Download } from 'lucide-react';
import { useTahunAjaran } from '@/hooks/useTahunAjaran';
import { getMapelSortIndex } from '@/utils/mapelHelper';
import RaportContent from '@/components/RaportContent';

export default function CetakRaportAdmin() {
    const { user, token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [selectedStudent, setSelectedStudent] = useState(null);
    const { 
        tahunAjaranList, 
        selectedTahunAjaranId, 
        setSelectedTahunAjaranId,
        loadingTahunAjaran
    } = useTahunAjaran();

    const [kelasOptions, setKelasOptions] = useState([]);
    const [selectedKelas, setSelectedKelas] = useState('');
    
    const [raportData, setRaportData] = useState(null);
    const [kehadiranData, setKehadiranData] = useState({ hadir: 0, izin: 0, sakit: 0, alpa: 0 });
    const [pelanggaranData, setPelanggaranData] = useState([]);
    const [ekskulData, setEkskulData] = useState([]);
    const [mapelKelasList, setMapelKelasList] = useState([]);
    
    const [showModal, setShowModal] = useState(false);
    const [loadingRaport, setLoadingRaport] = useState(false);
    const [zoomScale, setZoomScale] = useState(1);
    const [printAllLoading, setPrintAllLoading] = useState(false);
    const [allStudentsPrintData, setAllStudentsPrintData] = useState([]);
    const [printProgress, setPrintProgress] = useState({ current: 0, total: 0 });
    const [printAllMode, setPrintAllMode] = useState(false);

    const API_URL = '/api';

    useEffect(() => {
        const updateScale = () => {
            const screenWidth = window.innerWidth;
            if (screenWidth < 800) {
                setZoomScale((screenWidth - 64) / 800); // 64 for modal padding
            } else {
                setZoomScale(1);
            }
        };
        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, []);



    useEffect(() => {
        if (!token || user?.role !== 'admin') {
            setLoading(false);
            return;
        }

        const fetchInitialData = async () => {
            try {
                // Fetch Kelas
                const resKelas = await fetch(`${API_URL}/kelas`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const dataKelas = await resKelas.json();
                
                if (Array.isArray(dataKelas) && dataKelas.length > 0) {
                    setKelasOptions(dataKelas);
                }
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [token, user]);

    // Fetch students when kelas changes
    useEffect(() => {
        if (!selectedKelas || !token) {
            setStudents([]);
            return;
        }

        const fetchStudents = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_URL}/siswa?kelas=${selectedKelas}&tahun_ajaran_id=${selectedTahunAjaranId || ''}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                setStudents(Array.isArray(data) ? data.filter(s => s.status_aktif === 'aktif') : []);
            } catch (err) {
                console.error("Error fetching students:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [selectedKelas, token, selectedTahunAjaranId]);

    const handleSelectStudentAndShowModal = async (student) => {
        setSelectedStudent(student);
        setShowModal(true);
        if (!selectedTahunAjaranId) return;
        
        const selectedTA = tahunAjaranList.find(t => t.id.toString() === selectedTahunAjaranId?.toString());
        const currentSemester = selectedTA ? selectedTA.semester : '';

        setLoadingRaport(true);
        try {
            // 1. Fetch Nilai Raport
            const resNilai = await fetch(`${API_URL}/nilai/siswa/${student.id}?semester=${encodeURIComponent(currentSemester)}&tahun_ajaran_id=${selectedTahunAjaranId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const dataNilai = await resNilai.json();
            setRaportData(dataNilai);

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
            setPelanggaranData(Array.isArray(dataKedisiplinan) ? dataKedisiplinan.filter(p => (p.semester || '') === selectedSemester) : []);

            // 4. Fetch Ekskul
            const resEkskul = await fetch(`${API_URL}/nilai-ekskul?siswa_id=${student.id}&tahun_ajaran_id=${selectedTahunAjaranId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const dataEkskul = await resEkskul.json();
            setEkskulData(Array.isArray(dataEkskul) ? dataEkskul : []);


        } catch (err) {
            console.error("Error fetching raport details:", err);
        } finally {
            setLoadingRaport(false);
        }
    };

    const handlePrintAll = async () => {
        if (!selectedTahunAjaranId || filteredStudents.length === 0) return;
        
        const selectedTA = tahunAjaranList.find(t => t.id.toString() === selectedTahunAjaranId?.toString());
        const currentSemester = selectedTA ? selectedTA.semester : '';

        setPrintAllMode(true);
        setPrintAllLoading(true);
        setPrintProgress({ current: 0, total: filteredStudents.length });
        
        try {
            const resJadwal = await fetch(`${API_URL}/jadwal`, { headers: { 'Authorization': `Bearer ${token}` } });
            const dataJadwal = await resJadwal.json();
            const jadwal = Array.isArray(dataJadwal) ? dataJadwal : [];

            const getHariFromDate = (dateStr) => {
                const d = new Date(dateStr);
                const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                return days[d.getDay()];
            };
            const getJamMulai = (log, studentKelas) => {
                const hari = getHariFromDate(log.tanggal);
                const j = jadwal.find(x => x.mata_pelajaran === log.jenis_kegiatan && x.hari === hari && x.kelas === studentKelas);
                return j?.jam_mulai || '23:59:59';
            };

            const allData = [];

            for (let i = 0; i < filteredStudents.length; i++) {
                const student = filteredStudents[i];
                setPrintProgress({ current: i + 1, total: filteredStudents.length });

                const resNilai = await fetch(`${API_URL}/nilai/siswa/${student.id}?semester=${encodeURIComponent(currentSemester)}&tahun_ajaran_id=${selectedTahunAjaranId}`, { headers: { 'Authorization': `Bearer ${token}` } });
                const dataNilai = await resNilai.json();

                const resAkademik = await fetch(`${API_URL}/akademik?siswa_id=${student.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
                const dataAkademik = await resAkademik.json();

                // Fetch Ekskul
                const resEkskul = await fetch(`${API_URL}/nilai-ekskul?siswa_id=${student.id}&tahun_ajaran_id=${selectedTahunAjaranId}`, { headers: { 'Authorization': `Bearer ${token}` } });
                const dataEkskul = await resEkskul.json();
                const ekskulSiswa = Array.isArray(dataEkskul) ? dataEkskul : [];
                
                const mapelKelas = [...new Set(jadwal.filter(j => j.kelas === student.kelas).map(j => j.mata_pelajaran))];
                
                const logsSemester = Array.isArray(dataAkademik) ? dataAkademik.filter(l => (l.semester || '') === currentSemester) : [];
                
                const sortedLogs = [...logsSemester].sort((a,b) => {
                    const dateA = a.tanggal || '';
                    const dateB = b.tanggal || '';
                    if (dateA !== dateB) return dateA.localeCompare(dateB);
                    const jamA = getJamMulai(a, student.kelas);
                    const jamB = getJamMulai(b, student.kelas);
                    if (jamA === jamB) return (a.id || 0) - (b.id || 0);
                    return jamA.localeCompare(jamB);
                });

                const uniqueByDate = {};
                sortedLogs.forEach(log => {
                    const dateStr = log.tanggal;
                    if (!uniqueByDate[dateStr]) uniqueByDate[dateStr] = log;
                });
                
                let h = 0, i_izin = 0, s = 0, a = 0;
                Object.values(uniqueByDate).forEach(l => {
                    if (l.kehadiran === 'hadir') h++;
                    else if (l.kehadiran === 'izin') i_izin++;
                    else if (l.kehadiran === 'sakit') s++;
                    else if (l.kehadiran === 'alpa') a++;
                });
                const dataKehadiran = { hadir: h, izin: i_izin, sakit: s, alpa: a };

                const resKedisiplinan = await fetch(`${API_URL}/kedisiplinan?siswa_id=${student.id}&kategori=pelanggaran`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const dataKedisiplinan = await resKedisiplinan.json();
                const dataPelanggaran = Array.isArray(dataKedisiplinan) ? dataKedisiplinan.filter(p => (p.semester || '') === currentSemester) : [];

                allData.push({
                    studentObj: student,
                    dataRaport: dataNilai,
                    dataKehadiran,
                    dataPelanggaran,
                    dataEkskul: ekskulSiswa,
                    listMapelKelas: mapelKelas
                });
            }

            setAllStudentsPrintData(allData);
            
            setTimeout(() => {
                window.print();
                setPrintAllLoading(false);
            }, 1000);

        } catch (err) {
            console.error('Error fetching bulk print data:', err);
            alert('Gagal mengambil data untuk cetak semua.');
            setPrintAllLoading(false);
            setPrintAllMode(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPdf = async () => {
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const element = document.getElementById('raport-print-area');
            const opt = {
                margin:       [0.5, 0.5, 0.5, 0.5],
                filename:     `Raport_${selectedStudent?.nama_lengkap || 'Siswa'}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
            };
            html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Gagal mengunduh PDF. Pastikan perangkat Anda mendukung fitur ini.");
        }
    };

    const filteredStudents = students.filter(s => 
        s.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.nis.includes(searchTerm)
    );

    if (user?.role !== 'admin') {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="text-center p-8 bg-white dark:bg-[#041610] rounded-3xl text-red-500 border border-slate-200 dark:border-emerald-500/10">
                    <h2 className="text-xl font-bold mb-2">Akses Ditolak</h2>
                    <p>Halaman ini hanya dapat diakses oleh Admin.</p>
                </div>
            </div>
        );
    }

    const selectedTAObj = tahunAjaranList.find(t => t.id.toString() === selectedTahunAjaranId?.toString());
    const selectedSemester = selectedTAObj ? selectedTAObj.semester : '';
    const formattedDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="space-y-6">
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
                        margin: 1cm; /* Slightly smaller margin to give more breathing room */
                    }
                }
            `}</style>
            
            {/* BULK PRINT LOADING OVERLAY */}
            {printAllLoading && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 dark:bg-[#041610]/90 backdrop-blur-sm no-print">
                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mb-4" />
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Menyiapkan Rapor Kelas...</h2>
                    <p className="text-slate-600 dark:text-slate-300 font-semibold text-lg">
                        Memproses {printProgress.current} dari {printProgress.total} siswa
                    </p>
                    <p className="text-sm text-slate-500 mt-2 italic">Mohon tunggu, jendela cetak akan otomatis terbuka.</p>
                </div>
            )}

            {/* MAIN UI (Hidden on Print) */}
            <div className="no-print space-y-6 animate-fade-in">
                {/* Title */}
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Cetak Raport</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Kelola dan cetak raport siswa untuk seluruh kelas</p>
                </div>

                {/* Top Controls (Search, Semester, & Kelas) */}
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full md:w-auto">
                        <div className="flex gap-2 sm:gap-4 w-full">
                            <select
                                value={selectedTahunAjaranId}
                                onChange={(e) => setSelectedTahunAjaranId(e.target.value)}
                                disabled={loadingTahunAjaran}
                                className="flex-1 min-w-0 rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#041610] py-2.5 px-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm text-ellipsis"
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

                            <select
                                value={selectedKelas}
                                onChange={(e) => setSelectedKelas(e.target.value)}
                                className="flex-1 min-w-0 rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#041610] py-2.5 px-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm text-ellipsis"
                            >
                                <option value="">Pilih Kelas</option>
                                {kelasOptions.map(k => (
                                    <option key={k.id} value={k.nama_kelas}>{k.nama_kelas}</option>
                                ))}
                            </select>
                        </div>
                        
                        <button 
                            onClick={handlePrintAll}
                            disabled={printAllLoading || filteredStudents.length === 0}
                            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                            <Printer className="w-4 h-4" />
                            <span className="whitespace-nowrap">Cetak Semua Rapor</span>
                        </button>
                    </div>
                    
                    <div className="relative w-full sm:max-w-sm min-w-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Cari nama siswa atau NIS..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full min-w-0 pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#041610] text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition-colors shadow-sm"
                        />
                    </div>
                </div>

                {/* Student List */}
                <div className="bg-white dark:bg-[#041610] rounded-2xl border border-slate-200 dark:border-emerald-500/10 shadow-sm overflow-hidden min-h-[400px]">
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                            <Search className="h-10 w-10 mb-2 opacity-20" />
                            <p>Tidak ada siswa ditemukan.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left text-sm whitespace-nowrap min-w-max border-b border-slate-200 dark:border-emerald-500/10">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-[#061e16] border-b border-slate-200 dark:border-emerald-500/10">
                                        <th className="py-4 px-4 w-16 border-r border-slate-200 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold align-middle">No</th>
                                        <th className="py-4 px-6 min-w-[150px] border-r border-slate-200 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold align-middle">NIS</th>
                                        <th className="py-4 px-6 min-w-[250px] border-r border-slate-200 dark:border-emerald-500/10 text-slate-800 dark:text-slate-300 font-extrabold text-left align-middle">Nama Siswa</th>
                                        <th className="py-4 px-4 min-w-[180px] border-r border-slate-200 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold align-middle">Kelas</th>
                                        <th className="py-4 px-4 w-[140px] min-w-[140px] max-w-[140px] border-r border-slate-200 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold align-middle">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-emerald-500/10">
                                    {filteredStudents.map((student, idx) => (
                                        <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-[#061e16] transition-colors group">
                                            <td className="py-4 px-4 border-r border-slate-200 dark:border-emerald-500/10 text-center font-semibold text-slate-500 bg-white dark:bg-[#041610] group-hover:bg-slate-50/50 dark:group-hover:bg-[#061e16]">
                                                {idx + 1}
                                            </td>
                                            <td className="py-4 px-6 border-r border-slate-200 dark:border-emerald-500/10 text-center font-mono text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-[#041610] group-hover:bg-slate-50/50 dark:group-hover:bg-[#061e16]">
                                                {student.nis}
                                            </td>
                                            <td className="py-4 px-6 border-r border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#041610] group-hover:bg-slate-50/50 dark:group-hover:bg-[#061e16]">
                                                <div className="flex flex-col justify-center">
                                                    <p className="font-extrabold text-sm text-slate-850 dark:text-white leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{student.nama_lengkap}</p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 border-r border-slate-200 dark:border-emerald-500/10 text-center font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-[#041610] group-hover:bg-slate-50/50 dark:group-hover:bg-[#061e16]">
                                                {student.kelas}
                                            </td>
                                            <td className="py-4 px-4 border-r border-slate-200 dark:border-emerald-500/10 text-center bg-white dark:bg-[#041610] group-hover:bg-slate-50/50 dark:group-hover:bg-[#061e16]">
                                                <button 
                                                    onClick={() => handleSelectStudentAndShowModal(student)}
                                                    className="inline-flex items-center justify-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-sm"
                                                >
                                                    <Printer className="w-3.5 h-3.5" />
                                                    <span>Cetak Raport</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* PREVIEW MODAL (Hidden on Print) */}
            {showModal && selectedStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm no-print animate-fade-in">
                    <div className="bg-white dark:bg-[#041610] rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-emerald-500/10 overflow-hidden">
                        
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-emerald-500/10 bg-slate-50 dark:bg-[#061e16]">
                            <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-white">
                                <FileText className="h-5 w-5 text-emerald-500" />
                                Preview Raport: <span className="text-emerald-600">{selectedStudent.nama_lengkap}</span>
                            </h3>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-slate-200 dark:hover:bg-emerald-500/20 rounded-full transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                            </button>
                        </div>
                        
                        {/* Modal Body with Preview */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-200 dark:bg-[#010806] custom-scrollbar">
                            {loadingRaport ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3 text-emerald-600">
                                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                                    <p className="font-bold animate-pulse">Menyusun raport...</p>
                                </div>
                            ) : (
                                <RaportContent 
                                    studentObj={selectedStudent} 
                                    dataRaport={raportData} 
                                    dataKehadiran={kehadiranData} 
                                    dataPelanggaran={pelanggaranData} 
                                    listMapelKelas={mapelKelasList} 
                                    dataEkskul={ekskulData} tahunAjaranList={tahunAjaranList} selectedTahunAjaranId={selectedTahunAjaranId} zoomScale={zoomScale}
                                />
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-5 border-t border-slate-100 dark:border-emerald-500/10 flex justify-end gap-3 bg-slate-50 dark:bg-[#061e16]">
                            <button 
                                onClick={() => setShowModal(false)} 
                                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer mr-auto"
                            >
                                Tutup
                            </button>
                            <button 
                                onClick={handleDownloadPdf} 
                                disabled={loadingRaport}
                                className="flex items-center justify-center gap-2 bg-emerald-100 dark:bg-emerald-500/10 hover:bg-emerald-200 dark:hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 disabled:opacity-50 px-6 py-2.5 rounded-xl font-bold transition-all cursor-pointer"
                            >
                                <Download className="h-5 w-5" /> Unduh PDF
                            </button>
                            <button 
                                onClick={handlePrint} 
                                disabled={loadingRaport}
                                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                            >
                                <Printer className="h-5 w-5" /> Cetak Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* HIDDEN PRINT TARGET (Only visible during print) */}
            <div className="hidden print:block print-area">
                {printAllMode ? (
                    allStudentsPrintData.map((data, idx) => (
                        <RaportContent 
                            key={idx}
                            studentObj={data.studentObj}
                            dataRaport={data.dataRaport}
                            dataKehadiran={data.dataKehadiran}
                            dataPelanggaran={data.dataPelanggaran}
                            listMapelKelas={data.listMapelKelas}
                            dataEkskul={data.dataEkskul} tahunAjaranList={tahunAjaranList} selectedTahunAjaranId={selectedTahunAjaranId} zoomScale={zoomScale}
                            isBulkPrint={true}
                        />
                    ))
                ) : (
                    !loadingRaport && selectedStudent && (
                        <RaportContent 
                            studentObj={selectedStudent} 
                            dataRaport={raportData} 
                            dataKehadiran={kehadiranData} 
                            dataPelanggaran={pelanggaranData} 
                            listMapelKelas={mapelKelasList} 
                            dataEkskul={ekskulData} tahunAjaranList={tahunAjaranList} selectedTahunAjaranId={selectedTahunAjaranId} zoomScale={zoomScale}
                        />
                    )
                )}
            </div>
            
        </div>
    );
}
