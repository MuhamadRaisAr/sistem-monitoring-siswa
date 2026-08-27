"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Printer, Search, FileText, X, Download } from 'lucide-react';
import { useTahunAjaran } from '@/hooks/useTahunAjaran';
import { getMapelSortIndex } from '@/utils/mapelHelper';

export default function CetakRaportGuru() {
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
        if (!token || !user?.is_wali_kelas || !user?.kelas_wali?.length) {
            setLoading(false);
            return;
        }

        const fetchStudents = async () => {
            try {
                const kelas = user.kelas_wali[0].nama_kelas;
                const res = await fetch(`${API_URL}/siswa?kelas=${kelas}&tahun_ajaran_id=${selectedTahunAjaranId || ''}`, {
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
    }, [token, user, selectedTahunAjaranId]);

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

    if (!user?.is_wali_kelas) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="text-center p-8 bg-white dark:bg-[#041610] rounded-3xl text-red-500 border border-slate-200 dark:border-emerald-500/10">
                    <h2 className="text-xl font-bold mb-2">Akses Ditolak</h2>
                    <p>Halaman ini hanya dapat diakses oleh Wali Kelas.</p>
                </div>
            </div>
        );
    }

    const selectedTAObj = tahunAjaranList.find(t => t.id.toString() === selectedTahunAjaranId?.toString());
    const selectedSemester = selectedTAObj ? selectedTAObj.semester : '';
    const formattedDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const RaportContent = ({ 
        studentObj, 
        dataRaport, 
        dataKehadiran, 
        dataPelanggaran, 
        listMapelKelas,
        dataEkskul,
        isBulkPrint = false
    }) => (
        <div className={`w-full flex justify-center overflow-hidden ${isBulkPrint ? 'page-break-after-always' : ''}`}>
            <div style={{ zoom: isBulkPrint ? 1 : zoomScale }} id={isBulkPrint ? undefined : "raport-print-area"} className={`bg-white text-black p-10 shadow-sm border border-slate-200 w-[800px] max-w-[800px] mx-auto print:border-none print:shadow-none print:w-full print:mx-0 print:p-0 ${isBulkPrint ? 'mb-12 print:mb-0' : ''}`}>
                {/* Halaman Cover */}
                <div className="flex flex-col items-center justify-between min-h-[850px] w-full bg-white text-black pb-12 pt-4 text-center" style={{ pageBreakAfter: 'always' }}>
                    <div className="mt-0">
                        <img src="/tut_wuri_handayani.png" alt="Logo Tut Wuri Handayani" className="w-36 h-36 object-contain mx-auto" />
                    </div>
                    <div className="mt-16 mb-20">
                        <h1 className="text-2xl font-bold uppercase tracking-[0.2em] leading-[2.5]">
                            RAPOR<br/>
                            PESERTA DIDIK<br/>
                            SEKOLAH MENEGAH PERTAMA<br/>
                            (SMP)
                        </h1>
                    </div>
                    <div className="w-3/4 mx-auto mt-auto mb-32 space-y-8">
                        <div>
                            <p className="text-[15px] mb-3">Nama Peserta Didik :</p>
                            <div className="border-2 border-black py-2.5 px-4 text-xl uppercase tracking-wide">
                                {studentObj?.nama_lengkap}
                            </div>
                        </div>
                        <div>
                            <p className="text-[15px] mb-3">NIS / NISN</p>
                            <div className="border-2 border-black py-2.5 px-4 text-xl tracking-widest">
                                {studentObj?.nis} / {studentObj?.nisn || '-'}
                            </div>
                        </div>
                    </div>
                    <div className="mt-auto">
                        <h2 className="text-[15px] font-bold uppercase tracking-widest leading-loose">
                            KEMENTERIAN PENDIDIKAN DAN KEBUDAYAAN<br/>
                            REPUBLIK INDONESIA
                        </h2>
                    </div>
                </div>

                {/* Halaman Kedua - Identitas Sekolah */}
                <div className="flex flex-col min-h-[850px] w-full bg-white text-black pt-16 px-12" style={{ pageBreakAfter: 'always' }}>
                    <div className="text-center mb-16">
                        <h1 className="text-[17px] font-bold uppercase tracking-[0.1em] leading-loose">
                            RAPOR<br/>
                            PESERTA DIDIK<br/>
                            SEKOLAH MENEGAH PERTAMA ( SMP )
                        </h1>
                    </div>
                    
                    <div className="w-full max-w-xl mx-auto space-y-3 text-[15px]">
                        <div className="flex">
                            <div className="w-48">Nama Sekolah</div>
                            <div className="w-4">:</div>
                            <div className="flex-1">SMP MA'HAD DARUL IKHLAS</div>
                        </div>
                        <div className="flex">
                            <div className="w-48">NPSN</div>
                            <div className="w-4">:</div>
                            <div className="flex-1">20261940</div>
                        </div>
                        <div className="flex">
                            <div className="w-48">Alamat Sekolah</div>
                            <div className="w-4">:</div>
                            <div className="flex-1">Jl. Cibiuk kp. Gandayayi RT002/RW005</div>
                        </div>
                        <div className="flex">
                            <div className="w-48">Kode Pos</div>
                            <div className="w-4">:</div>
                            <div className="flex-1">44193</div>
                        </div>
                        <div className="flex">
                            <div className="w-48">Desa / Kelurahan</div>
                            <div className="w-4">:</div>
                            <div className="flex-1">Cibiuk Kaler</div>
                        </div>
                        <div className="flex">
                            <div className="w-48">Kecamatan</div>
                            <div className="w-4">:</div>
                            <div className="flex-1">Cibiuk</div>
                        </div>
                        <div className="flex">
                            <div className="w-48">Kabupaten / Kota</div>
                            <div className="w-4">:</div>
                            <div className="flex-1">Garut</div>
                        </div>
                        <div className="flex">
                            <div className="w-48">Provinsi</div>
                            <div className="w-4">:</div>
                            <div className="flex-1">Jawa Barat</div>
                        </div>
                        <div className="flex">
                            <div className="w-48">Website</div>
                            <div className="w-4">:</div>
                            <div className="flex-1"></div>
                        </div>
                        <div className="flex">
                            <div className="w-48">E-mail</div>
                            <div className="w-4">:</div>
                            <div className="flex-1"></div>
                        </div>
                    </div>
                </div>

                {/* Halaman Ketiga - Identitas Peserta Didik */}
                <div className="flex flex-col min-h-[850px] w-full bg-white text-black pt-16 px-12" style={{ pageBreakAfter: 'always' }}>
                    <div className="text-center mb-10">
                        <h1 className="text-lg font-bold uppercase tracking-wider">
                            IDENTITAS PESERTA DIDIK
                        </h1>
                    </div>
                    
                    <div className="w-full max-w-2xl mx-auto space-y-2 text-[15px] leading-relaxed">
                        <div className="flex">
                            <div className="w-56">Nama Peserta Didik</div>
                            <div className="w-4">:</div>
                            <div className="flex-1">{studentObj?.nama_lengkap}</div>
                        </div>
                        <div className="flex">
                            <div className="w-56">NIS / NISN</div>
                            <div className="w-4">:</div>
                            <div className="flex-1">{studentObj?.nis} / {studentObj?.nisn || '-'}</div>
                        </div>
                        <div className="flex">
                            <div className="w-56">Tempat, Tanggal Lahir</div>
                            <div className="w-4">:</div>
                            <div className="flex-1">
                                {studentObj?.tempat_lahir || ''}
                                {studentObj?.tempat_lahir && studentObj?.tanggal_lahir ? ', ' : ''}
                                {studentObj?.tanggal_lahir ? new Date(studentObj.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                            </div>
                        </div>
                        <div className="flex">
                            <div className="w-56">Jenis Kelamin</div>
                            <div className="w-4">:</div>
                            <div className="flex-1">
                                {studentObj?.jenis_kelamin === 'L' ? 'Laki-laki' : studentObj?.jenis_kelamin === 'P' ? 'Perempuan' : '-'}
                            </div>
                        </div>
                        <div className="flex">
                            <div className="w-56">Agama</div>
                            <div className="w-4">:</div>
                            <div className="flex-1">{studentObj?.agama || 'Islam'}</div>
                        </div>
                        <div className="flex">
                            <div className="w-56">Pendidikan sebelumnya</div>
                            <div className="w-4">:</div>
                            <div className="flex-1">{studentObj?.pendidikan_sebelumnya || '-'}</div>
                        </div>
                        <div className="flex">
                            <div className="w-56">Alamat Peserta Didik</div>
                            <div className="w-4">:</div>
                            <div className="flex-1">{studentObj?.alamat_siswa || '-'}</div>
                        </div>

                        <div className="pt-4">
                            <div className="w-56 font-semibold">Nama Orang Tua</div>
                            <div className="flex">
                                <div className="w-56 pl-4">Ayah</div>
                                <div className="w-4">:</div>
                                <div className="flex-1">{studentObj?.nama_ayah || '-'}</div>
                            </div>
                            <div className="flex">
                                <div className="w-56 pl-4">Ibu</div>
                                <div className="w-4">:</div>
                                <div className="flex-1">{studentObj?.nama_ibu || '-'}</div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <div className="w-56 font-semibold">Pekerjaan Orang Tua</div>
                            <div className="flex">
                                <div className="w-56 pl-4">Ayah</div>
                                <div className="w-4">:</div>
                                <div className="flex-1">{studentObj?.pekerjaan_ayah || '-'}</div>
                            </div>
                            <div className="flex">
                                <div className="w-56 pl-4">Ibu</div>
                                <div className="w-4">:</div>
                                <div className="flex-1">{studentObj?.pekerjaan_ibu || '-'}</div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <div className="w-56 font-semibold">Alamat Orang Tua</div>
                            <div className="flex">
                                <div className="w-56 pl-4">Jalan</div>
                                <div className="w-4">:</div>
                                <div className="flex-1">{studentObj?.jalan_ortu || '-'}</div>
                            </div>
                            <div className="flex">
                                <div className="w-56 pl-4">Kelurahan/Desa</div>
                                <div className="w-4">:</div>
                                <div className="flex-1">{studentObj?.kelurahan_ortu || '-'}</div>
                            </div>
                            <div className="flex">
                                <div className="w-56 pl-4">Kecamatan</div>
                                <div className="w-4">:</div>
                                <div className="flex-1">{studentObj?.kecamatan_ortu || '-'}</div>
                            </div>
                            <div className="flex">
                                <div className="w-56 pl-4">Kabupaten / Kota</div>
                                <div className="w-4">:</div>
                                <div className="flex-1">{studentObj?.kabupaten_ortu || '-'}</div>
                            </div>
                            <div className="flex">
                                <div className="w-56 pl-4">Provinsi</div>
                                <div className="w-4">:</div>
                                <div className="flex-1">{studentObj?.provinsi_ortu || '-'}</div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <div className="w-56 font-semibold">Wali Peserta Didik</div>
                            <div className="flex">
                                <div className="w-56 pl-4">Nama</div>
                                <div className="w-4">:</div>
                                <div className="flex-1">{studentObj?.nama_wali || '-'}</div>
                            </div>
                            <div className="flex">
                                <div className="w-56 pl-4">Pekerjaan</div>
                                <div className="w-4">:</div>
                                <div className="flex-1">{studentObj?.pekerjaan_wali || '-'}</div>
                            </div>
                            <div className="flex">
                                <div className="w-56 pl-4">Alamat</div>
                                <div className="w-4">:</div>
                                <div className="flex-1">{studentObj?.alamat_wali || '-'}</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-10 items-end text-[15px]">
                        <div className="col-start-4 col-span-2 flex justify-center">
                            <div style={{ width: '3cm', height: '4cm' }} className="border-2 border-black flex items-center justify-center text-sm text-gray-500 bg-white">
                                Foto<br/>3x4
                            </div>
                        </div>
                        <div className="col-start-7 col-span-4 flex justify-end">
                            <div className="text-center flex flex-col items-center">
                                <p className="flex items-center">
                                    <span>Garut,&nbsp;</span>
                                    <span 
                                        className="outline-none focus:bg-emerald-50 transition-colors cursor-text" 
                                        contentEditable={true} 
                                        suppressContentEditableWarning={true}
                                    >
                                        ......................................
                                    </span>
                                </p>
                                <p className="mb-16 text-[13px] leading-snug mt-1">Kepala Sekolah</p>
                                <p className="font-normal underline">___________________________</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Halaman Keempat - Laporan Hasil Belajar */}
                <div className="w-full bg-white text-black pt-16 px-8" style={{ pageBreakAfter: 'always' }}>
                    <div className="text-center mb-8">
                        <h1 className="text-[15px] font-bold uppercase tracking-wider">
                            LAPORAN HASIL BELAJAR<br/>(RAPOR)
                        </h1>
                    </div>
                    
                    {/* Header Info */}
                    <div className="w-full flex justify-between text-[13px] mb-6">
                        <div className="space-y-1">
                            <div className="flex"><div className="w-36">Nama Peserta Didik</div><div className="w-4">:</div><div className="uppercase">{studentObj?.nama_lengkap}</div></div>
                            <div className="flex"><div className="w-36">NISN</div><div className="w-4">:</div><div>{studentObj?.nisn || '-'}</div></div>
                            <div className="flex"><div className="w-36">Sekolah</div><div className="w-4">:</div><div>SMP MA'HAD DARUL IKHLAS</div></div>
                            <div className="flex"><div className="w-36">Alamat</div><div className="w-4">:</div><div>Jl. Cibiuk kp. Gandayayi RT002/RW005</div></div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex"><div className="w-28">Kelas</div><div className="w-4">:</div><div>{studentObj?.kelas}</div></div>
                            <div className="flex"><div className="w-28">Fase</div><div className="w-4">:</div><div>D</div></div>
                            <div className="flex"><div className="w-28">Semester</div><div className="w-4">:</div><div>{selectedTahunAjaranId ? tahunAjaranList.find(t => t.id.toString() === selectedTahunAjaranId.toString())?.semester : '-'}</div></div>
                            <div className="flex"><div className="w-28">Tahun Pelajaran</div><div className="w-4">:</div><div>{selectedTahunAjaranId ? tahunAjaranList.find(t => t.id.toString() === selectedTahunAjaranId.toString())?.nama_tahun : '-'}</div></div>
                        </div>
                    </div>

                    {/* Table Nilai */}
                    <div className="flex justify-end mb-1 no-print">
                    </div>
                    <table className="w-full border-collapse border border-black text-[13px]">
                        <thead>
                            <tr className="bg-gray-100/50">
                                <th className="border border-black py-2 px-1 w-10 text-center font-semibold">No</th>
                                <th className="border border-black py-2 px-2 w-48 text-center font-semibold">Muatan Pelajaran</th>
                                <th className="border border-black py-2 px-1 w-16 text-center font-semibold">Nilai<br/>Akhir</th>
                                <th className="border border-black py-2 px-3 text-center font-semibold">Capaian Kompetensi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                const processedGrades = {};
                                
                                // Inisialisasi semua mapel dari jadwal
                                listMapelKelas.forEach(mp => {
                                    processedGrades[mp] = { total: 0, count: 0, keterangan: '' };
                                });

                                if (dataRaport && dataRaport.mapels && Array.isArray(dataRaport.mapels)) {
                                    dataRaport.mapels.forEach(item => {
                                        if (!processedGrades[item.mata_pelajaran]) {
                                            processedGrades[item.mata_pelajaran] = { total: 0, count: 0, keterangan: item.keterangan || '' };
                                        }
                                        if (item.rata_rata > 0) {
                                            processedGrades[item.mata_pelajaran].total += Number(item.rata_rata || 0);
                                            processedGrades[item.mata_pelajaran].count += 1;
                                        }
                                        if (item.keterangan && !processedGrades[item.mata_pelajaran].keterangan) {
                                             processedGrades[item.mata_pelajaran].keterangan = item.keterangan;
                                        }
                                    });
                                }
                                
                                const finalGradesList = Object.keys(processedGrades).map(mp => {
                                    const avg = processedGrades[mp].count > 0 ? Math.round(processedGrades[mp].total / processedGrades[mp].count) : '-';
                                    let capaian = processedGrades[mp].keterangan;
                                    if (!capaian && avg !== '-') {
                                        if (avg >= 85) capaian = `Sangat baik dalam memahami dan menguasai materi pembelajaran, serta mampu mengaplikasikan pengetahuannya dengan sangat efektif.`;
                                        else if (avg >= 75) capaian = `Menunjukkan pemahaman yang baik dalam materi pembelajaran dan mampu menyelesaikan tugas dengan hasil yang memuaskan.`;
                                        else capaian = `Menunjukkan pemahaman dasar dalam materi pembelajaran, namun masih memerlukan bimbingan dan peningkatan lebih lanjut.`;
                                    } else if (!capaian) {
                                        capaian = "Belum ada nilai yang diinputkan.";
                                    }
                                    return { mata_pelajaran: mp, nilai: avg, capaian };
                                });

                                finalGradesList.sort((a, b) => getMapelSortIndex(a.mata_pelajaran) - getMapelSortIndex(b.mata_pelajaran));

                                if (finalGradesList.length === 0) {
                                    return (
                                        <tr>
                                            <td colSpan="4" className="border border-black py-8 text-center italic text-gray-500">Belum ada data mata pelajaran (jadwal kelas kosong).</td>
                                        </tr>
                                    );
                                }

                                return finalGradesList.map((item, index) => (
                                    <tr key={index}>
                                        <td className="border border-black py-2 px-1 text-center align-top">{index + 1}</td>
                                        <td className="border border-black py-2 px-2 align-top">{item.mata_pelajaran}</td>
                                        <td className="border border-black py-2 px-1 text-center align-top">{item.nilai}</td>
                                        <td 
                                            className="border border-black py-2 px-3 text-justify align-top leading-tight outline-none focus:bg-emerald-50 transition-colors"
                                            contentEditable={true}
                                            suppressContentEditableWarning={true}
                                        >
                                            <span className={item.nilai === '-' ? 'text-gray-400 italic' : ''}>{item.capaian}</span>
                                        </td>
                                    </tr>
                                ));
                            })()}
                        </tbody>
                    </table>

                    {/* Table Ekstrakurikuler */}
                    <div className="mt-8">
                        <table className="w-full border-collapse border border-black text-[13px]">
                            <thead>
                                <tr className="bg-gray-100/50">
                                    <th className="border border-black py-2 px-1 w-10 text-center font-semibold">No</th>
                                    <th className="border border-black py-2 px-2 w-48 text-center font-semibold">Kegiatan Ekstrakurikuler</th>
                                    <th className="border border-black py-2 px-2 w-16 text-center font-semibold">Predikat</th>
                                    <th className="border border-black py-2 px-3 text-center font-semibold">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ekskulData && ekskulData.length > 0 ? (
                                    ekskulData.map((eks, index) => (
                                        <tr key={index}>
                                            <td className="border border-black py-1 px-1 text-center">{index + 1}</td>
                                            <td className="border border-black py-1 px-2">{eks.nama_ekskul}</td>
                                            <td className="border border-black py-1 px-2 text-center">{eks.predikat || '-'}</td>
                                            <td className="border border-black py-1 px-3">{eks.keterangan || '-'}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="border border-black py-4 text-center italic text-gray-500">Belum ada data ekstrakurikuler</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Ketidakhadiran */}
                    <div className="mt-6 w-[50%]">
                        <table className="w-full border-collapse border border-black text-[13px]">
                            <tbody>
                                <tr>
                                    <td className="border border-black py-1.5 px-3 w-40">Sakit</td>
                                    <td className="border border-black py-1.5 px-3 w-28">: {kehadiranData?.sakit || 0} hari</td>
                                </tr>
                                <tr>
                                    <td className="border border-black py-1.5 px-3">Izin</td>
                                    <td className="border border-black py-1.5 px-3">: {kehadiranData?.izin || 0} hari</td>
                                </tr>
                                <tr>
                                    <td className="border border-black py-1.5 px-3">Tanpa Keterangan</td>
                                    <td className="border border-black py-1.5 px-3">: {kehadiranData?.alpa || 0} hari</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Catatan Wali Kelas */}
                    <div className="mt-6" style={{ pageBreakInside: 'avoid' }}>
                        <div className="flex justify-between items-end mb-1">
                            <p className="font-semibold text-[13px]">Catatan Wali Kelas</p>
                        </div>
                        <div 
                            className="w-full min-h-[60px] border border-black p-3 text-[13px] italic flex items-center outline-none focus:bg-emerald-50 transition-colors"
                            contentEditable={true}
                            suppressContentEditableWarning={true}
                        >
                            Tetap semangat belajar dan tingkatkan terus prestasimu.
                        </div>
                    </div>

                    {/* Signatures */}
                    <div className="mt-6" style={{ pageBreakInside: 'avoid' }}>
                        <div className="flex justify-between text-[13px] px-8">
                            <div className="text-left flex flex-col h-full justify-between">
                                <div>
                                    <p>Mengetahui</p>
                                    <p className="mb-14">Orang Tua/Wali,</p>
                                </div>
                                <div>
                                    <p className="font-normal min-w-[150px] border-b border-black">
                                        {studentObj?.nama_wali || '.............................................'}
                                    </p>
                                    <p className="mt-1 invisible">NIP. ......................................</p>
                                </div>
                            </div>
                             <div className="text-left flex flex-col h-full justify-between">
                                <div>
                                    <p className="flex items-center">
                                        <span>Garut,&nbsp;</span>
                                        <span 
                                            className="outline-none focus:bg-emerald-50 transition-colors cursor-text" 
                                            contentEditable={true} 
                                            suppressContentEditableWarning={true}
                                        >
                                            ......................................
                                        </span>
                                    </p>
                                    <p className="mb-14">Wali Kelas,</p>
                                </div>
                                <div>
                                    <p className="font-bold min-w-[150px] border-b border-black">
                                        {studentObj?.nama_wali_kelas || '___________________________'}
                                    </p>
                                    <p className="mt-1">NIP. ......................................</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex justify-center text-[13px]">
                            <div className="text-center flex flex-col items-center">
                                <p>Mengetahui,</p>
                                <p className="mb-14">Kepala Sekolah</p>
                                <p className="font-bold min-w-[200px] border-b border-black">
                                    ___________________________
                                </p>
                                <p className="mt-1 text-left w-full pl-2">NIP. ......................................</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Halaman Kelima - Buku Induk */}
                <div className="w-full bg-white text-black pt-16 px-8" style={{ pageBreakBefore: 'always' }}>
                    <div className="text-center mb-8">
                        <h1 className="text-[16px] font-bold uppercase tracking-wider">
                            BUKU INDUK
                        </h1>
                    </div>
                    
                    {/* Header Info */}
                    <div className="w-full flex justify-between text-[13px] mb-8">
                        <div className="space-y-1">
                            <div className="flex"><div className="w-36">Nama Peserta Didik</div><div className="w-4">:</div><div className="uppercase">{studentObj?.nama_lengkap}</div></div>
                            <div className="flex"><div className="w-36">NISN</div><div className="w-4">:</div><div>{studentObj?.nisn || '-'}</div></div>
                            <div className="flex"><div className="w-36">Sekolah</div><div className="w-4">:</div><div>SMP MA'HAD DARUL IKHLAS</div></div>
                            <div className="flex"><div className="w-36">Alamat</div><div className="w-4">:</div><div>Jl. Cibiuk kp. Gandayayi RT002/RW005</div></div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex"><div className="w-28">Kelas</div><div className="w-4">:</div><div>{studentObj?.kelas}</div></div>
                            <div className="flex"><div className="w-28">Fase</div><div className="w-4">:</div><div>D</div></div>
                            <div className="flex"><div className="w-28">Semester</div><div className="w-4">:</div><div>{selectedTahunAjaranId ? tahunAjaranList.find(t => t.id.toString() === selectedTahunAjaranId.toString())?.semester : '-'}</div></div>
                            <div className="flex"><div className="w-28">Tahun Pelajaran</div><div className="w-4">:</div><div>{selectedTahunAjaranId ? tahunAjaranList.find(t => t.id.toString() === selectedTahunAjaranId.toString())?.nama_tahun : '-'}</div></div>
                        </div>
                    </div>

                    {/* Table Nilai */}
                    <table className="w-full border-collapse border border-black text-[13px] mb-8">
                        <thead>
                            <tr className="bg-gray-100/50">
                                <th className="border border-black py-2 px-1 w-12 text-center font-semibold">No</th>
                                <th className="border border-black py-2 px-2 text-center font-semibold">Muatan Pelajaran</th>
                                <th className="border border-black py-2 px-1 w-32 text-center font-semibold">Nilai</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                const processedGrades = {};
                                
                                listMapelKelas.forEach(mp => {
                                    processedGrades[mp] = { total: 0, count: 0 };
                                });

                                if (dataRaport && dataRaport.mapels && Array.isArray(dataRaport.mapels)) {
                                    dataRaport.mapels.forEach(item => {
                                        if (!processedGrades[item.mata_pelajaran]) {
                                            processedGrades[item.mata_pelajaran] = { total: 0, count: 0 };
                                        }
                                        if (item.rata_rata > 0) {
                                            processedGrades[item.mata_pelajaran].total += Number(item.rata_rata || 0);
                                            processedGrades[item.mata_pelajaran].count += 1;
                                        }
                                    });
                                }
                                
                                const finalGradesList = Object.keys(processedGrades).map(mp => {
                                    const avg = processedGrades[mp].count > 0 ? Math.round(processedGrades[mp].total / processedGrades[mp].count) : '-';
                                    return { mata_pelajaran: mp, nilai: avg };
                                });

                                finalGradesList.sort((a, b) => getMapelSortIndex(a.mata_pelajaran) - getMapelSortIndex(b.mata_pelajaran));

                                if (finalGradesList.length === 0) {
                                    return (
                                        <tr>
                                            <td colSpan="3" className="border border-black py-8 text-center italic text-gray-500">Belum ada data mata pelajaran (jadwal kelas kosong).</td>
                                        </tr>
                                    );
                                }

                                return finalGradesList.map((item, index) => (
                                    <tr key={index}>
                                        <td className="border border-black py-2 px-1 text-center">{index + 1}</td>
                                        <td className="border border-black py-2 px-3">{item.mata_pelajaran}</td>
                                        <td className="border border-black py-2 px-1 text-center">{item.nilai}</td>
                                    </tr>
                                ));
                            })()}
                        </tbody>
                    </table>

                    {/* Table Ekstrakurikuler */}
                    <table className="w-full border-collapse border border-black text-[13px] mb-8">
                        <thead>
                            <tr className="bg-gray-100/50">
                                <th className="border border-black py-2 px-1 w-12 text-center font-semibold">No</th>
                                <th className="border border-black py-2 px-2 w-56 text-center font-semibold uppercase">Ekstrakurikuler</th>
                                <th className="border border-black py-2 px-2 w-24 text-center font-semibold uppercase">Predikat</th>
                                <th className="border border-black py-2 px-3 text-center font-semibold uppercase">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dataEkskul && dataEkskul.length > 0 ? (
                                dataEkskul.map((eks, index) => (
                                    <tr key={index}>
                                        <td className="border border-black py-1 px-1 text-center">{index + 1}</td>
                                        <td className="border border-black py-1 px-2">{eks.nama_ekskul}</td>
                                        <td className="border border-black py-1 px-2 text-center">{eks.predikat}</td>
                                        <td className="border border-black py-1 px-3">{eks.keterangan || '-'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="border border-black py-4 text-center italic text-gray-500">Belum ada data ekstrakurikuler</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Table Ketidakhadiran */}
                    <div className="w-[60%]">
                        <table className="w-full border-collapse border border-black text-[13px]">
                            <thead>
                                <tr className="bg-gray-100/50">
                                    <th colSpan="4" className="border border-black py-2 px-2 text-center font-semibold uppercase">Ketidakhadiran</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-black py-1.5 px-3 text-center w-12">1</td>
                                    <td className="border border-black py-1.5 px-3 w-40">Sakit</td>
                                    <td className="border border-black py-1.5 px-3 text-center w-16">{dataKehadiran?.sakit || 0}</td>
                                    <td className="border border-black py-1.5 px-3 w-16">hari</td>
                                </tr>
                                <tr>
                                    <td className="border border-black py-1.5 px-3 text-center">2</td>
                                    <td className="border border-black py-1.5 px-3">Izin</td>
                                    <td className="border border-black py-1.5 px-3 text-center">{dataKehadiran?.izin || 0}</td>
                                    <td className="border border-black py-1.5 px-3">hari</td>
                                </tr>
                                <tr>
                                    <td className="border border-black py-1.5 px-3 text-center">3</td>
                                    <td className="border border-black py-1.5 px-3">Tanpa Keterangan</td>
                                    <td className="border border-black py-1.5 px-3 text-center">{dataKehadiran?.alpa || 0}</td>
                                    <td className="border border-black py-1.5 px-3">hari</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );

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
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Kelola dan cetak raport siswa untuk kelas {user.kelas_wali[0]?.nama_kelas}</p>
                </div>

                {/* Top Controls (Search & Semester) */}
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full md:w-auto">
                        <select
                            value={selectedTahunAjaranId}
                            onChange={(e) => setSelectedTahunAjaranId(e.target.value)}
                            disabled={loadingTahunAjaran}
                            className="w-full sm:w-auto sm:min-w-[240px] rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#041610] py-2.5 px-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm text-ellipsis"
                        >
                            {loadingTahunAjaran ? (
                                <option>Memuat...</option>
                            ) : tahunAjaranList.length === 0 ? (
                                <option value="">Tidak ada data</option>
                            ) : (
                                tahunAjaranList.map(ta => (
                                    <option key={ta.id} value={ta.id}>
                                        {ta.nama_tahun} {ta.semester}
                                    </option>
                                ))
                            )}
                        </select>
                        
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
                        <div className="flex flex-col gap-1 p-2">
                            {filteredStudents.map((student, idx) => (
                                <div key={student.id} className="flex items-center justify-between py-2.5 md:py-3.5 px-4 md:px-5 rounded-xl hover:bg-slate-50 dark:hover:bg-[#082a1f] transition-colors group">
                                    <p className="font-extrabold text-sm sm:text-base md:text-lg text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                        {student.nama_lengkap}
                                    </p>
                                    <button 
                                        onClick={() => handleSelectStudentAndShowModal(student)}
                                        className="inline-flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 px-4 py-2 md:py-2.5 rounded-xl font-bold text-[11px] sm:text-xs md:text-sm transition-all shadow-sm shrink-0"
                                    >
                                        <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5" />
                                        <span>Cetak Raport</span>
                                    </button>
                                </div>
                            ))}
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
                                    dataEkskul={ekskulData}
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
                            dataEkskul={data.dataEkskul}
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
                            dataEkskul={ekskulData}
                        />
                    )
                )}
            </div>
            
        </div>
    );
}
