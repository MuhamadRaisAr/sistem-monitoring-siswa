"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTahunAjaran } from '@/hooks/useTahunAjaran';
import { Calendar, Search, Users, Activity, Eye, X } from 'lucide-react';

export default function GuruBkAbsensiPage() {
    const { token } = useAuth();
    const { tahunAjaranList, activeTahunAjaranList, selectedTahunAjaranId, setSelectedTahunAjaranId, loadingTahunAjaran } = useTahunAjaran();
    
    const [siswaList, setSiswaList] = useState([]);
    const [allLogs, setAllLogs] = useState([]);
    const [jadwalList, setJadwalList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedKelas, setSelectedKelas] = useState('');
    
    // Modal state
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = async () => {
        if (!selectedTahunAjaranId) return;
        try {
            setLoading(true);
            const [resSiswa, resLogs, resJadwal] = await Promise.all([
                fetch(`/api/siswa?tahun_ajaran_id=${selectedTahunAjaranId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`/api/akademik?tahun_ajaran_id=${selectedTahunAjaranId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`/api/jadwal?tahun_ajaran_id=${selectedTahunAjaranId}`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            
            const [dataSiswa, dataLogs, dataJadwal] = await Promise.all([resSiswa.json(), resLogs.json(), resJadwal.json()]);
            setSiswaList(Array.isArray(dataSiswa) ? dataSiswa : []);
            setAllLogs(Array.isArray(dataLogs) ? dataLogs : []);
            setJadwalList(Array.isArray(dataJadwal) ? dataJadwal : []);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token || !selectedTahunAjaranId) return;
        fetchData();
    }, [token, selectedTahunAjaranId]);

    // Group logs by student and calculate totals
    const studentRecaps = useMemo(() => {
        const recaps = {};
        
        // Initialize all active students
        siswaList.forEach(s => {
            recaps[s.id] = {
                id: s.id,
                nama: s.nama_lengkap,
                nis: s.nis,
                kelas: s.kelas,
                hadir: 0,
                sakit: 0,
                izin: 0,
                alpa: 0,
                total_kegiatan: 0,
                logs: []
            };
        });

        // Helper functions to determine the first mapel of the day
        const getHariFromDate = (dateStr) => {
            const d = new Date(dateStr);
            const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            return days[d.getDay()];
        };

        const getJamMulai = (log, jadwalArr) => {
            const hari = getHariFromDate(log.tanggal);
            const j = jadwalArr.find(x => x.mata_pelajaran === log.jenis_kegiatan && x.hari === hari);
            return j?.jam_mulai || '23:59:59';
        };

        // Filter `allLogs` to only keep the earliest log of the day per student
        const logsByStudentAndDate = {};
        allLogs.forEach(log => {
            // Normalize date format
            const dateStr = log.tanggal.split('T')[0];
            const key = `${log.siswa_id}_${dateStr}`;
            
            if (!logsByStudentAndDate[key]) {
                logsByStudentAndDate[key] = log;
            } else {
                const currentJamMulai = getJamMulai(logsByStudentAndDate[key], jadwalList);
                const newJamMulai = getJamMulai(log, jadwalList);
                
                if (newJamMulai < currentJamMulai) {
                    logsByStudentAndDate[key] = log;
                }
            }
        });
        
        const morningLogs = Object.values(logsByStudentAndDate);

        // Tally the morning logs
        morningLogs.forEach(log => {
            if (recaps[log.siswa_id]) {
                const status = log.kehadiran?.toLowerCase();
                if (['hadir', 'sakit', 'izin', 'alpa'].includes(status)) {
                    recaps[log.siswa_id][status] += 1;
                    recaps[log.siswa_id].total_kegiatan += 1;
                    recaps[log.siswa_id].logs.push(log);
                }
            }
        });

        // Convert to array and calculate percentage
        return Object.values(recaps).map(r => {
            const persentase = r.total_kegiatan > 0 
                ? Math.round((r.hadir / r.total_kegiatan) * 100) 
                : 0;
            return { ...r, persentase };
        });
    }, [siswaList, allLogs]);

    const kelasOptions = useMemo(() => {
        const classes = new Set(siswaList.map(s => s.kelas).filter(Boolean));
        // Sort Roman Numerals roughly
        const romanMap = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 };
        return Array.from(classes).sort((a, b) => {
            const valA = romanMap[a.split(' ')[0]] || 99;
            const valB = romanMap[b.split(' ')[0]] || 99;
            if (valA !== valB) return valA - valB;
            return a.localeCompare(b);
        });
    }, [siswaList]);

    const filteredRecaps = useMemo(() => {
        const romanMap = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 };
        
        return studentRecaps.filter(r => {
            const matchSearch = r.nama?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                   r.nis?.includes(searchQuery) ||
                   r.kelas?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchKelas = selectedKelas ? r.kelas === selectedKelas : true;
            return matchSearch && matchKelas;
        }).sort((a, b) => {
            const valA = romanMap[a.kelas?.split(' ')[0]] || 99;
            const valB = romanMap[b.kelas?.split(' ')[0]] || 99;
            if (valA !== valB) return valA - valB;
            return a.nama.localeCompare(b.nama);
        });
    }, [studentRecaps, searchQuery, selectedKelas]);

    const handleViewDetail = (studentId) => {
        setSelectedStudentId(studentId);
        setIsModalOpen(true);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'hadir': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'sakit': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'izin': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'alpa': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const selectedStudent = studentRecaps.find(r => r.id === selectedStudentId);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Rekapitulasi Absensi</h1>
                    <p className="text-slate-500 text-sm mt-1">Pantau total kehadiran dan tingkat kedisiplinan siswa.</p>
                </div>
            </div>

            <div className="flex flex-col gap-4 mb-2">
                <div className="flex flex-col sm:flex-row gap-4 w-full items-start sm:items-center">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full sm:w-auto">
                        <div className="flex flex-col gap-1.5 w-full sm:w-[260px]">
                            <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Tahun Ajaran:</label>
                            <select 
                                value={selectedTahunAjaranId} 
                                onChange={e => setSelectedTahunAjaranId(e.target.value)}
                                disabled={loadingTahunAjaran || activeTahunAjaranList.length <= 1}
                                className={`w-full rounded-xl border border-emerald-100 bg-white py-2.5 px-3 sm:px-4 text-[12px] sm:text-sm font-bold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm disabled:opacity-50 ${(activeTahunAjaranList?.length || 0) <= 1 ? 'appearance-none cursor-default bg-none' : 'cursor-pointer'}`}
                            >
                                {loadingTahunAjaran ? (
                                    <option>Memuat...</option>
                                ) : activeTahunAjaranList.length === 0 ? (
                                    <option value="">Tidak ada data</option>
                                ) : (
                                    activeTahunAjaranList.map((ta) => (
                                        <option key={ta.id} value={ta.id}>
                                            {ta.nama_tahun} {ta.semester}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1.5 w-full sm:w-[180px]">
                            <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Kelas:</label>
                            <select 
                                value={selectedKelas} 
                                onChange={e => setSelectedKelas(e.target.value)}
                                className="w-full rounded-xl border border-emerald-100 bg-white py-2.5 px-3 sm:px-4 text-[12px] sm:text-sm font-bold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-sm"
                            >
                                <option value="">Semua Kelas</option>
                                {kelasOptions.map((k, idx) => (
                                    <option key={idx} value={k}>{k}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5 w-full sm:w-[320px] sm:ml-auto">
                        <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Cari Siswa/Kelas:</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-emerald-500" />
                            </div>
                            <input
                                type="text"
                                placeholder="Ketik nama, NIS, atau kelas..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-emerald-100 bg-white text-[12px] sm:text-sm font-bold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm placeholder:text-slate-400 placeholder:font-normal"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white overflow-hidden">
                {loading ? (
                    <div className="flex h-52 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                    </div>
                ) : filteredRecaps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
                        <Users className="h-10 w-10 opacity-30" />
                        <p className="text-sm font-medium">Belum ada data siswa ditemukan.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto pb-8 pt-2">
                        <table className="w-full text-left text-[10px] sm:text-xs whitespace-nowrap min-w-max border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                                    <th className="py-2.5 px-3 sm:px-4 w-12 text-center border-t border-b border-l border-r border-slate-200">No</th>
                                    <th className="py-2.5 px-3 sm:px-4 border-t border-b border-r border-slate-200 text-left w-[200px] sm:w-[250px] max-w-[250px]">Nama Siswa</th>
                                    <th className="py-2.5 px-3 sm:px-4 border-t border-b border-r border-slate-200 text-center w-20 sm:w-24">Kelas</th>
                                    <th className="py-2.5 px-3 sm:px-4 border-t border-b border-r border-slate-200 text-center w-20 sm:w-24">Hadir</th>
                                    <th className="py-2.5 px-3 sm:px-4 border-t border-b border-r border-slate-200 text-center w-20 sm:w-24">Sakit</th>
                                    <th className="py-2.5 px-3 sm:px-4 border-t border-b border-r border-slate-200 text-center w-20 sm:w-24">Izin</th>
                                    <th className="py-2.5 px-3 sm:px-4 border-t border-b border-r border-slate-200 text-center w-20 sm:w-24">Alpa</th>
                                    <th className="py-2.5 px-3 sm:px-4 border-t border-b border-r border-slate-200 text-center w-28 sm:w-32">Detail</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecaps.map((r, idx) => (
                                    <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="py-2.5 px-3 sm:px-4 text-center text-slate-500 font-bold border-b border-l border-r border-slate-200">{idx + 1}</td>
                                        <td className="py-2.5 px-3 sm:px-4 border-b border-r border-slate-200">
                                            <p className="font-bold text-slate-800 truncate max-w-[180px] sm:max-w-[230px]">{r.nama}</p>
                                        </td>
                                        <td className="py-2.5 px-3 sm:px-4 border-b border-r border-slate-200 text-center">
                                            <span className="font-bold text-slate-600">{r.kelas}</span>
                                        </td>
                                        <td className="py-2.5 px-3 sm:px-4 border-b border-r border-slate-200 text-center">
                                            <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">{r.hadir}</span>
                                        </td>
                                        <td className="py-2.5 px-3 sm:px-4 border-b border-r border-slate-200 text-center">
                                            <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">{r.sakit}</span>
                                        </td>
                                        <td className="py-2.5 px-3 sm:px-4 border-b border-r border-slate-200 text-center">
                                            <span className="font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">{r.izin}</span>
                                        </td>
                                        <td className="py-2.5 px-3 sm:px-4 border-b border-r border-slate-200 text-center">
                                            <span className={`font-extrabold px-2 py-0.5 rounded-lg border ${r.alpa > 0 ? 'text-red-600 bg-red-50 border-red-100' : 'text-slate-400 bg-slate-50 border-slate-100'}`}>
                                                {r.alpa}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 sm:px-4 border-b border-r border-slate-200 text-center">
                                            <button 
                                                onClick={() => handleViewDetail(r.id)}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-semibold text-[10px] sm:text-xs transition-colors"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                Detail
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Detail Absensi Siswa */}
            {isModalOpen && selectedStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Detail Kehadiran</h2>
                                <p className="text-sm text-slate-500 mt-1">{selectedStudent.nama} • Kelas {selectedStudent.kelas}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-4 gap-3 mb-6">
                                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                                    <p className="text-xs font-bold text-emerald-600 uppercase">Hadir</p>
                                    <p className="text-xl font-black text-emerald-700 mt-1">{selectedStudent.hadir}</p>
                                </div>
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                                    <p className="text-xs font-bold text-blue-600 uppercase">Sakit</p>
                                    <p className="text-xl font-black text-blue-700 mt-1">{selectedStudent.sakit}</p>
                                </div>
                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                                    <p className="text-xs font-bold text-amber-600 uppercase">Izin</p>
                                    <p className="text-xl font-black text-amber-700 mt-1">{selectedStudent.izin}</p>
                                </div>
                                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                                    <p className="text-xs font-bold text-red-600 uppercase">Alpa</p>
                                    <p className="text-xl font-black text-red-700 mt-1">{selectedStudent.alpa}</p>
                                </div>
                            </div>

                            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <Activity className="h-4 w-4 text-emerald-500" />
                                Riwayat Log Harian
                            </h3>

                            {selectedStudent.logs.length === 0 ? (
                                <p className="text-center text-slate-500 py-8 bg-slate-50 rounded-xl">Belum ada riwayat absensi.</p>
                            ) : (
                                <div className="space-y-3">
                                    {selectedStudent.logs.sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal)).map(log => (
                                        <div key={log.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-slate-100 p-2 rounded-lg">
                                                    <Calendar className="h-5 w-5 text-slate-500" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-800">
                                                        {new Date(log.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </p>
                                                    <p className="text-xs text-slate-500 capitalize">{log.jenis_kegiatan?.replace(/_/g, ' ')}</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                <span className={`inline-flex rounded-lg px-2 py-1 text-[10px] font-bold tracking-wide uppercase border ${getStatusStyle(log.kehadiran)}`}>
                                                    {log.kehadiran}
                                                </span>
                                                {log.deskripsi && (
                                                    <p className="text-[10px] text-slate-500 mt-1 italic max-w-[150px] truncate">{log.deskripsi}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
