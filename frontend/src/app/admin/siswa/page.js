"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Plus, Search, Edit2, Trash2, UserCheck, X, Check, CheckCircle, Download } from 'lucide-react';
import { toTitleCase } from '@/utils/textFormatter';
import { useLongPress } from '@/hooks/useLongPress';

export default function AdminsiswaPage() {
    const { token } = useAuth();
    const [siswaList, setsiswaList] = useState([]);
    const [kelasList, setKelasList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modals state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [selectedsiswa, setSelectedsiswa] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);

    const bindLongPress = useLongPress(
        (e, id) => {
            if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) return;
            if (selectedIds.length === 0) {
                handleSelectRow(id);
            }
        },
        (e, id) => {
            if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) return;
            if (selectedIds.length > 0) {
                handleSelectRow(id);
            }
        },
        { delay: 1000, shouldPreventDefault: false }
    );

    // Form fields state
    const [nis, setNis] = useState('');
    const [namaLengkap, setNamaLengkap] = useState('');
    const [kelas, setKelas] = useState('');
    const [namaWali, setNamaWali] = useState('');
    const [noHp, setNoHp] = useState('');
    const [statusAktif, setStatusAktif] = useState('aktif');
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    // Tambahan field untuk cetak raport
    const [nisn, setNisn] = useState('');
    const [tempatLahir, setTempatLahir] = useState('');
    const [tanggalLahir, setTanggalLahir] = useState('');
    const [jenisKelamin, setJenisKelamin] = useState('');
    const [agama, setAgama] = useState('');
    const [pendidikanSebelumnya, setPendidikanSebelumnya] = useState('');
    const [alamatSiswa, setAlamatSiswa] = useState('');
    const [namaAyah, setNamaAyah] = useState('');
    const [namaIbu, setNamaIbu] = useState('');
    const [pekerjaanAyah, setPekerjaanAyah] = useState('');
    const [pekerjaanIbu, setPekerjaanIbu] = useState('');
    const [jalanOrtu, setJalanOrtu] = useState('');
    const [kelurahanOrtu, setKelurahanOrtu] = useState('');
    const [kecamatanOrtu, setKecamatanOrtu] = useState('');
    const [kabupatenOrtu, setKabupatenOrtu] = useState('');
    const [provinsiOrtu, setProvinsiOrtu] = useState('');
    const [pekerjaanWali, setPekerjaanWali] = useState('');
    const [alamatWali, setAlamatWali] = useState('');

    const [activeFormTab, setActiveFormTab] = useState('siswa'); // 'siswa', 'ortu'

    const API_URL = '/api';

    const capitalizeInput = (val) => {
        return val;
    };

    const fetchsiswa = async () => {
        try {
            const [ressiswa, resKelas] = await Promise.all([
                fetch(`${API_URL}/siswa`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/kelas`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            
            const datasiswa = await ressiswa.json();
            const dataKelas = await resKelas.json();
            
            setsiswaList(datasiswa);
            setKelasList(Array.isArray(dataKelas) ? dataKelas : []);
        } catch (err) {
            console.error('Error fetching data:', err);
        }
    };


    useEffect(() => {
        if (!token) return;
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchsiswa()]);
            setLoading(false);
        };
        init();
    }, [token]);

    const openAddModal = () => {
        setModalMode('add');
        setSelectedsiswa(null);
        setNis('');
        setNamaLengkap('');
        setKelas('');
        setNamaWali('');
        setNoHp('');
        setStatusAktif('aktif');
        setNisn('');
        setTempatLahir('');
        setTanggalLahir('');
        setJenisKelamin('');
        setAgama('');
        setPendidikanSebelumnya('');
        setAlamatSiswa('');
        setNamaAyah('');
        setNamaIbu('');
        setPekerjaanAyah('');
        setPekerjaanIbu('');
        setJalanOrtu('');
        setKelurahanOrtu('');
        setKecamatanOrtu('');
        setKabupatenOrtu('');
        setProvinsiOrtu('');
        setPekerjaanWali('');
        setAlamatWali('');
        setActiveFormTab('siswa');
        setFormError('');
        setModalOpen(true);
    };

    const openEditModal = (s) => {
        setModalMode('edit');
        setSelectedsiswa(s);
        setNis(s.nis || '');
        setNamaLengkap(s.nama_lengkap || '');
        setKelas(s.kelas || '');
        setNamaWali(s.nama_wali || '');
        setNoHp(s.no_hp || '');
        setStatusAktif(s.status_aktif || 'aktif');
        setNisn(s.nisn || '');
        setTempatLahir(s.tempat_lahir || '');
        setTanggalLahir(s.tanggal_lahir ? s.tanggal_lahir.substring(0, 10) : '');
        setJenisKelamin(s.jenis_kelamin || '');
        setAgama(s.agama || '');
        setPendidikanSebelumnya(s.pendidikan_sebelumnya || '');
        setAlamatSiswa(s.alamat_siswa || '');
        setNamaAyah(s.nama_ayah || '');
        setNamaIbu(s.nama_ibu || '');
        setPekerjaanAyah(s.pekerjaan_ayah || '');
        setPekerjaanIbu(s.pekerjaan_ibu || '');
        setJalanOrtu(s.jalan_ortu || '');
        setKelurahanOrtu(s.kelurahan_ortu || '');
        setKecamatanOrtu(s.kecamatan_ortu || '');
        setKabupatenOrtu(s.kabupaten_ortu || '');
        setProvinsiOrtu(s.provinsi_ortu || '');
        setPekerjaanWali(s.pekerjaan_wali || '');
        setAlamatWali(s.alamat_wali || '');
        setActiveFormTab('siswa');
        setFormError('');
        setModalOpen(true);
    };


    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        
        const payload = { 
            nis, 
            nama_lengkap: namaLengkap, 
            kelas, 
            status_aktif: statusAktif,
            nama_wali: namaWali,
            no_hp: noHp,
            nisn,
            tempat_lahir: tempatLahir,
            tanggal_lahir: tanggalLahir || null,
            jenis_kelamin: jenisKelamin || null,
            agama,
            pendidikan_sebelumnya: pendidikanSebelumnya,
            alamat_siswa: alamatSiswa,
            nama_ayah: namaAyah,
            nama_ibu: namaIbu,
            pekerjaan_ayah: pekerjaanAyah,
            pekerjaan_ibu: pekerjaanIbu,
            jalan_ortu: jalanOrtu,
            kelurahan_ortu: kelurahanOrtu,
            kecamatan_ortu: kecamatanOrtu,
            kabupaten_ortu: kabupatenOrtu,
            provinsi_ortu: provinsiOrtu,
            pekerjaan_wali: pekerjaanWali,
            alamat_wali: alamatWali
        };
        const url = modalMode === 'add' ? `${API_URL}/siswa` : `${API_URL}/siswa/${selectedsiswa.id}`;
        const method = modalMode === 'add' ? 'POST' : 'PUT';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Operation failed');
            }

            setModalOpen(false);
            fetchsiswa();
            setTimeout(() => {
                setFormSuccess(modalMode === 'add' ? 'Data siswa berhasil ditambahkan!' : 'Data siswa berhasil diperbarui!');
                setTimeout(() => setFormSuccess(''), 3000);
            }, 100);
        } catch (err) {
            setFormError(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Apakah Anda yakin ingin menghapus data siswa ini?')) return;
        try {
            const res = await fetch(`${API_URL}/siswa/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchsiswa();
                setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
            }
        } catch (err) {
            console.error('Error deleting siswa:', err);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} data siswa yang dipilih?`)) return;
        try {
            await Promise.all(
                selectedIds.map(id =>
                    fetch(`${API_URL}/siswa/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                )
            );
            fetchsiswa();
            setSelectedIds([]);
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan saat menghapus data massal.');
        }
    };


    // Filter list by search query and exclude alumni
    const activesiswa = siswaList.filter(s => {
        const status = (s.status_aktif || 'aktif').toLowerCase();
        return status !== 'lulus' && status !== 'keluar';
    });

    const getClassWeight = (kelasStr) => {
        if (!kelasStr) return 999;
        const roman = decodeURIComponent(kelasStr).split(' ')[0].toUpperCase();
        const map = { 'I':1, 'II':2, 'III':3, 'IV':4, 'V':5, 'VI':6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 };
        return map[roman] || 999;
    };

    const filteredsiswa = activesiswa.filter(s => 
        s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nis.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.kelas && s.kelas.toLowerCase().includes(searchQuery.toLowerCase()))
    ).sort((a, b) => {
        const weightA = getClassWeight(a.kelas);
        const weightB = getClassWeight(b.kelas);
        if (weightA !== weightB) {
            return weightA - weightB;
        }
        return (a.nama_lengkap || '').localeCompare(b.nama_lengkap || '');
    });

    const handleDownloadSiswa = () => {
        if (siswaList.length === 0) return alert('Tidak ada data siswa untuk diunduh');
        
        const headers = [
            'NIS', 'NISN', 'Nama Lengkap', 'Kelas', 'Asrama', 'Status Keaktifan',
            'Tempat Lahir', 'Tanggal Lahir', 'Jenis Kelamin', 'Agama', 'Sekolah Sebelumnya', 'Alamat Siswa',
            'Nama Ayah', 'Nama Ibu', 'Pekerjaan Ayah', 'Pekerjaan Ibu',
            'Alamat Ortu (Jalan)', 'Kelurahan Ortu', 'Kecamatan Ortu', 'Kabupaten Ortu', 'Provinsi Ortu',
            'Nama Wali', 'No HP Wali', 'Pekerjaan Wali', 'Alamat Wali'
        ];

        const rows = siswaList.map(s => [
            s.nis || '',
            s.nisn || '',
            s.nama_lengkap || '',
            s.kelas || '',
            s.asrama || '',
            s.status_aktif || '',
            s.tempat_lahir || '',
            s.tanggal_lahir ? s.tanggal_lahir.substring(0, 10) : '',
            s.jenis_kelamin || '',
            s.agama || '',
            s.pendidikan_sebelumnya || '',
            s.alamat_siswa || '',
            s.nama_ayah || '',
            s.nama_ibu || '',
            s.pekerjaan_ayah || '',
            s.pekerjaan_ibu || '',
            s.jalan_ortu || '',
            s.kelurahan_ortu || '',
            s.kecamatan_ortu || '',
            s.kabupaten_ortu || '',
            s.provinsi_ortu || '',
            s.nama_wali || '',
            s.no_hp || '',
            s.pekerjaan_wali || '',
            s.alamat_wali || ''
        ]);

        // Bangun format dokumen Excel XML (.xls) dengan mendefinisikan lebar masing-masing dari 25 kolom
        let xmlTemplate = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Data Siswa">
  <Table>
   <Column ss:Width="60"/>    <!-- NIS -->
   <Column ss:Width="90"/>    <!-- NISN -->
   <Column ss:Width="160"/>   <!-- Nama Lengkap -->
   <Column ss:Width="80"/>    <!-- Kelas -->
   <Column ss:Width="80"/>    <!-- Asrama -->
   <Column ss:Width="90"/>    <!-- Status Keaktifan -->
   <Column ss:Width="100"/>   <!-- Tempat Lahir -->
   <Column ss:Width="90"/>    <!-- Tanggal Lahir -->
   <Column ss:Width="80"/>    <!-- Jenis Kelamin -->
   <Column ss:Width="70"/>    <!-- Agama -->
   <Column ss:Width="130"/>   <!-- Sekolah Sebelumnya -->
   <Column ss:Width="180"/>   <!-- Alamat Siswa -->
   <Column ss:Width="130"/>   <!-- Nama Ayah -->
   <Column ss:Width="130"/>   <!-- Nama Ibu -->
   <Column ss:Width="100"/>   <!-- Pekerjaan Ayah -->
   <Column ss:Width="100"/>   <!-- Pekerjaan Ibu -->
   <Column ss:Width="140"/>   <!-- Alamat Ortu (Jalan) -->
   <Column ss:Width="100"/>   <!-- Kelurahan -->
   <Column ss:Width="100"/>   <!-- Kecamatan -->
   <Column ss:Width="100"/>   <!-- Kabupaten -->
   <Column ss:Width="100"/>   <!-- Provinsi -->
   <Column ss:Width="130"/>   <!-- Nama Wali -->
   <Column ss:Width="100"/>   <!-- No HP Wali -->
   <Column ss:Width="100"/>   <!-- Pekerjaan Wali -->
   <Column ss:Width="185"/>   <!-- Alamat Wali -->
   <Row>`;

        // Tambah header
        headers.forEach(header => {
            xmlTemplate += `\n    <Cell><Data ss:Type="String">${header}</Data></Cell>`;
        });
        xmlTemplate += `\n   </Row>`;

        // Tambah data baris demi baris
        rows.forEach(row => {
            xmlTemplate += `\n   <Row>`;
            row.forEach(val => {
                const escapedVal = String(val)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&apos;');
                xmlTemplate += `\n    <Cell><Data ss:Type="String">${escapedVal}</Data></Cell>`;
            });
            xmlTemplate += `\n   </Row>`;
        });

        xmlTemplate += `\n  </Table>
 </Worksheet>
</Workbook>`;

        // Bikin file blob (.xls) dan download
        const blob = new Blob([xmlTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Data_Siswa_Monitoring_${new Date().getFullYear()}.xls`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredsiswa.map(s => s.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    return (
        <div className="space-y-6 relative">
            {/* Global Toast Alerts (Auto dismiss) */}
            {formSuccess && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 bg-white text-slate-700 rounded-xl shadow-xl animate-fade-in flex items-center gap-3 font-semibold border border-slate-200 w-max max-w-[90vw]">
                    <CheckCircle className="h-5 w-5 text-slate-500 shrink-0" />
                    <span className="whitespace-nowrap">{formSuccess}</span>
                </div>
            )}
            {/* Header and Add button */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Database Siswa</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">kelola data siswa dan hubungkan dengan wali.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari siswa (Nama/NIS/Kelas)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-[#020c08]/50 py-2 sm:py-2.5 pl-9 pr-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
                        />
                    </div>
                    
                    <div className="flex flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        {selectedIds.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-red-600 hover:bg-red-500 py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-white transition-colors shrink-0 shadow-lg shadow-red-500/30"
                            >
                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                Hapus ({selectedIds.length})
                            </button>
                        )}
                        <button
                            onClick={handleDownloadSiswa}
                            className="flex items-center justify-center rounded-xl p-2 sm:p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#061e16] dark:hover:bg-emerald-500/20 text-slate-600 dark:text-emerald-400 transition-colors shrink-0 shadow-sm border border-slate-200 dark:border-emerald-500/20"
                            title="Unduh Template Excel"
                        >
                            <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <button
                            onClick={openAddModal}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all active:scale-95 shrink-0 text-xs sm:text-sm"
                        >
                            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            Tambah Siswa
                        </button>
                    </div>
                </div>
            </div>

            {/* Search and Table Box */}
            <div className="w-full mt-4">
                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto bg-white dark:bg-[#020c08]/50 rounded-2xl border border-slate-200 dark:border-emerald-500/10 shadow-sm">
                        <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap min-w-max border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-[#061e16]">
                                    {selectedIds.length > 0 && (
                                        <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center static md:sticky md:left-0 md:z-40 bg-slate-50 dark:bg-[#061e16]">
                                            <input 
                                                type="checkbox" 
                                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                checked={selectedIds.length === filteredsiswa.length && filteredsiswa.length > 0}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                    )}
                                    <th className={`py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center static md:sticky ${selectedIds.length > 0 ? 'md:left-8' : 'md:left-0'} md:z-30 bg-slate-50 dark:bg-[#061e16] text-slate-800 dark:text-slate-300 font-extrabold uppercase`}>No</th>
                                    <th className={`py-2 px-3 border-b border-r border-slate-400 dark:border-emerald-500/30 text-center static md:sticky ${selectedIds.length > 0 ? 'md:left-16' : 'md:left-8'} md:z-30 bg-slate-50 dark:bg-[#061e16] shadow-[4px_0_12px_rgba(0,0,0,0.03)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.2)] text-slate-800 dark:text-slate-300 font-extrabold uppercase max-w-[200px]`}>Nama Lengkap</th>
                                    <th className="py-2 px-3 border-b border-r-[3px] border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16] w-40 min-w-[160px]">NIS</th>
                                    <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Kelas</th>
                                    <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Nama Wali</th>
                                    <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">No Telp</th>
                                    <th className="py-2 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Status</th>
                                    <th className="py-2 px-2 border-b border-slate-300 dark:border-emerald-500/10 text-center text-slate-800 dark:text-slate-300 font-extrabold uppercase bg-slate-50 dark:bg-[#061e16]">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredsiswa.length === 0 ? (
                                    <tr>
                                        <td colSpan={selectedIds.length > 0 ? "9" : "8"} className="text-center py-8 text-slate-500 bg-white dark:bg-[#041610] border-b border-slate-300 dark:border-emerald-500/10">
                                            Tidak ada data siswa ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredsiswa.map((s, idx) => (
                                        <tr 
                                            key={s.id} 
                                            {...bindLongPress(s.id)}
                                            className={`transition-colors group cursor-pointer select-none ${selectedIds.includes(s.id) ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'hover:bg-slate-50 dark:hover:bg-[#082a1f]'}`}
                                        >
                                            {selectedIds.length > 0 && (
                                                <td className={`py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center static md:sticky md:left-0 md:z-20 ${selectedIds.includes(s.id) ? 'bg-emerald-50 dark:bg-[#06241a]' : 'bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]'}`} onClick={(e) => e.stopPropagation()}>
                                                    <input 
                                                        type="checkbox" 
                                                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                        checked={selectedIds.includes(s.id)}
                                                        onChange={() => handleSelectRow(s.id)}
                                                    />
                                                </td>
                                            )}
                                            <td className={`py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 font-semibold text-slate-500 text-center static md:sticky ${selectedIds.length > 0 ? 'md:left-8' : 'md:left-0'} md:z-20 ${selectedIds.includes(s.id) ? 'bg-emerald-50 dark:bg-[#06241a]' : 'bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]'}`}>{idx + 1}</td>
                                            <td className={`py-1.5 px-3 border-b border-r border-slate-400 dark:border-emerald-500/30 font-extrabold text-slate-850 dark:text-white text-left static md:sticky ${selectedIds.length > 0 ? 'md:left-16' : 'md:left-8'} md:z-20 drop-shadow-md ${selectedIds.includes(s.id) ? 'bg-emerald-50 dark:bg-[#06241a]' : 'bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]'} max-w-[200px] truncate`} title={s.nama_lengkap}>{s.nama_lengkap}</td>
                                            <td className={`py-1.5 px-3 border-b border-r-[3px] border-slate-300 dark:border-emerald-500/10 font-medium text-slate-600 dark:text-slate-300 text-center ${selectedIds.includes(s.id) ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]'}`}>{s.nis || '-'}</td>
                                            <td className={`py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap ${selectedIds.includes(s.id) ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]'}`}>{s.kelas || '-'}</td>
                                            <td className={`py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-left font-medium text-slate-600 dark:text-slate-300 ${selectedIds.includes(s.id) ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]'}`}>
                                                {s.nama_wali ? (
                                                    s.nama_wali
                                                ) : (
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">Belum dipetakan</span>
                                                )}
                                            </td>
                                            <td className={`py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center whitespace-nowrap ${selectedIds.includes(s.id) ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]'}`}>
                                                {s.no_hp ? (
                                                    <a href={`https://wa.me/${s.no_hp.replace(/^0/, '62')}`} target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">
                                                        {s.no_hp}
                                                    </a>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">-</span>
                                                )}
                                            </td>
                                            <td className={`py-1.5 px-2 border-b border-r border-slate-300 dark:border-emerald-500/10 text-center ${selectedIds.includes(s.id) ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]'}`}>
                                                <span className={`inline-flex rounded-lg px-2 py-0.5 text-[10px] font-extrabold tracking-wide leading-none uppercase border
                                                    ${s.status_aktif === 'aktif' ? 'bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-red-100 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'}
                                                `}>
                                                    {s.status_aktif}
                                                </span>
                                            </td>
                                            <td className={`py-1.5 px-2 border-b border-slate-300 dark:border-emerald-500/10 text-center ${selectedIds.includes(s.id) ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-white dark:bg-[#041610] group-hover:bg-slate-50 dark:group-hover:bg-[#082a1f]'}`}>
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); openEditModal(s); }}
                                                        title="Edit Siswa"
                                                        className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/10 hover:bg-amber-200 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-colors"
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                                                        title="Hapus Siswa"
                                                        className="p-1.5 rounded-lg bg-red-100 dark:bg-red-500/10 hover:bg-red-200 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
                    <div className="relative w-full max-w-2xl glass-panel rounded-3xl p-6 my-8 bg-[#041610] text-white border border-slate-200/10 max-h-[90vh] flex flex-col">
                        <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white z-10">
                            <X className="h-6 w-6" />
                        </button>
                        
                        <h2 className="text-xl font-bold text-white mb-4 shrink-0">
                            {modalMode === 'add' ? 'Tambah Siswa Baru' : 'Edit Data Siswa'}
                        </h2>

                        {/* Tabs Navigation */}
                        <div className="flex border-b border-slate-800 mb-4 shrink-0">
                            <button 
                                type="button"
                                onClick={() => setActiveFormTab('siswa')}
                                className={`py-2 px-4 text-xs uppercase tracking-wider font-bold border-b-2 transition-colors ${activeFormTab === 'siswa' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                            >
                                Biodata Siswa
                            </button>
                            <button 
                                type="button"
                                onClick={() => setActiveFormTab('ortu')}
                                className={`py-2 px-4 text-xs uppercase tracking-wider font-bold border-b-2 transition-colors ${activeFormTab === 'ortu' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                            >
                                Orang Tua & Wali
                            </button>
                        </div>
 
                        <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col min-h-0">
                            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                                {formError && (
                                    <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-red-300 text-xs font-semibold">
                                        {formError}
                                    </div>
                                )}

                                {activeFormTab === 'siswa' ? (
                                    <div className="space-y-4">
                                        {/* Row 1: NIS & NISN */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">NIS (Wajib)</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={nis}
                                                    onChange={(e) => setNis(e.target.value)}
                                                    className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-xs"
                                                    placeholder="Contoh: 100201"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">NISN</label>
                                                <input
                                                    type="text"
                                                    value={nisn}
                                                    onChange={(e) => setNisn(e.target.value)}
                                                    className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-xs"
                                                    placeholder="10 digit angka"
                                                />
                                            </div>
                                        </div>

                                        {/* Row 2: Nama & Kelas */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="col-span-2">
                                                <label className="block text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">Nama Lengkap</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={namaLengkap}
                                                    onChange={(e) => setNamaLengkap(e.target.value)}
                                                    className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-xs"
                                                    placeholder="Contoh: Ahmad Fauzi"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">Kelas</label>
                                                <select
                                                    required
                                                    value={kelas}
                                                    onChange={(e) => setKelas(e.target.value)}
                                                    className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-xs h-[34px]"
                                                >
                                                    <option value="" className="bg-[#020c08] text-slate-500">-- Pilih --</option>
                                                    {kelasList.map(k => (
                                                        <option key={k.id} value={k.nama_kelas} className="bg-[#020c08]">
                                                            {k.nama_kelas}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Row 3: TTL & Kelamin */}
                                        <div className="grid grid-cols-4 gap-4">
                                            <div className="col-span-2">
                                                <label className="block text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">Tempat Lahir</label>
                                                <input
                                                    type="text"
                                                    value={tempatLahir}
                                                    onChange={(e) => setTempatLahir(e.target.value)}
                                                    className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-xs"
                                                    placeholder="Contoh: Garut"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">Tgl Lahir</label>
                                                <input
                                                    type="date"
                                                    value={tanggalLahir}
                                                    onChange={(e) => setTanggalLahir(e.target.value)}
                                                    className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-1.5 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-xs h-[34px]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">L/P</label>
                                                <select
                                                    value={jenisKelamin}
                                                    onChange={(e) => setJenisKelamin(e.target.value)}
                                                    className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-xs h-[34px]"
                                                >
                                                    <option value="" className="bg-[#020c08]">--</option>
                                                    <option value="L" className="bg-[#020c08]">Laki-laki</option>
                                                    <option value="P" className="bg-[#020c08]">Perempuan</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Row 4: Agama & Pend. Sebelumnya */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">Agama</label>
                                                <input
                                                    type="text"
                                                    value={agama}
                                                    onChange={(e) => setAgama(e.target.value)}
                                                    className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-xs"
                                                    placeholder="Islam"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">Sekolah Sebelumnya (SD/MI)</label>
                                                <input
                                                    type="text"
                                                    value={pendidikanSebelumnya}
                                                    onChange={(e) => setPendidikanSebelumnya(e.target.value)}
                                                    className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-xs"
                                                    placeholder="SDN 1 Cibiuk"
                                                />
                                            </div>
                                        </div>

                                        {/* Alamat & Status */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="col-span-2">
                                                <label className="block text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">Alamat Lengkap Siswa</label>
                                                <input
                                                    type="text"
                                                    value={alamatSiswa}
                                                    onChange={(e) => setAlamatSiswa(e.target.value)}
                                                    className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-xs"
                                                    placeholder="Kp. Gandayayi RT02/RW05 Garut"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">Status Keaktifan</label>
                                                <select
                                                    value={statusAktif}
                                                    onChange={(e) => setStatusAktif(e.target.value)}
                                                    className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-xs h-[34px]"
                                                >
                                                    <option value="aktif" className="bg-[#020c08]">Aktif</option>
                                                    <option value="lulus" className="bg-[#020c08]">Lulus</option>
                                                    <option value="keluar" className="bg-[#020c08]">Keluar</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">Nama Ayah</label>
                                                <input
                                                    type="text"
                                                    value={namaAyah}
                                                    onChange={(e) => setNamaAyah(e.target.value)}
                                                    className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-xs"
                                                    placeholder="Nama Ayah Kandung"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">Nama Ibu</label>
                                                <input
                                                    type="text"
                                                    value={namaIbu}
                                                    onChange={(e) => setNamaIbu(e.target.value)}
                                                    className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-xs"
                                                    placeholder="Nama Ibu Kandung"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">Pekerjaan Ayah</label>
                                                <input
                                                    type="text"
                                                    value={pekerjaanAyah}
                                                    onChange={(e) => setPekerjaanAyah(e.target.value)}
                                                    className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-xs"
                                                    placeholder="Buruh/PNS/Wiraswasta"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">Pekerjaan Ibu</label>
                                                <input
                                                    type="text"
                                                    value={pekerjaanIbu}
                                                    onChange={(e) => setPekerjaanIbu(e.target.value)}
                                                    className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-xs"
                                                    placeholder="IRT/Guru/Pedagang"
                                                />
                                            </div>
                                        </div>

                                        {/* Alamat Orang Tua */}
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Alamat Lengkap Orang Tua</label>
                                            <div className="grid grid-cols-3 gap-4">
                                                <input
                                                    type="text"
                                                    value={jalanOrtu}
                                                    onChange={(e) => setJalanOrtu(e.target.value)}
                                                    className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-xs col-span-2"
                                                    placeholder="Nama Jalan/Dusun"
                                                />
                                                <input
                                                    type="text"
                                                    value={kelurahanOrtu}
                                                    onChange={(e) => setKelurahanOrtu(e.target.value)}
                                                    className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-xs"
                                                    placeholder="Desa/Kel"
                                                />
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <input
                                                    type="text"
                                                    value={kecamatanOrtu}
                                                    onChange={(e) => setKecamatanOrtu(e.target.value)}
                                                    className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-xs"
                                                    placeholder="Kecamatan"
                                                />
                                                <input
                                                    type="text"
                                                    value={kabupatenOrtu}
                                                    onChange={(e) => setKabupatenOrtu(e.target.value)}
                                                    className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-xs"
                                                    placeholder="Kabupaten"
                                                />
                                                <input
                                                    type="text"
                                                    value={provinsiOrtu}
                                                    onChange={(e) => setProvinsiOrtu(e.target.value)}
                                                    className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-xs"
                                                    placeholder="Provinsi"
                                                />
                                            </div>
                                        </div>

                                        {/* Data Wali & WhatsApp Akun */}
                                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/30">
                                            <div>
                                                <label className="block text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">Nama Wali Siswa</label>
                                                <input
                                                    type="text"
                                                    value={namaWali}
                                                    onChange={(e) => setNamaWali(e.target.value)}
                                                    className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-xs"
                                                    placeholder="Nama Wali (Untuk login)"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">No. WhatsApp/No. HP Wali</label>
                                                <input
                                                    type="text"
                                                    value={noHp}
                                                    onChange={(e) => setNoHp(e.target.value)}
                                                    className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-xs"
                                                    placeholder="Format: 081234567890"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">Pekerjaan Wali</label>
                                                <input
                                                    type="text"
                                                    value={pekerjaanWali}
                                                    onChange={(e) => setPekerjaanWali(e.target.value)}
                                                    className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-xs"
                                                    placeholder="Pekerjaan Wali"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">Alamat Wali</label>
                                                <input
                                                    type="text"
                                                    value={alamatWali}
                                                    onChange={(e) => setAlamatWali(e.target.value)}
                                                    className="w-full rounded-xl border border-emerald-500/10 bg-[#020c08]/50 py-2 px-3 text-slate-100 focus:border-emerald-500 focus:outline-none text-xs"
                                                    placeholder="Alamat lengkap Wali"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex justify-between gap-3 shrink-0 border-t border-slate-800/80 mt-4">
                                <span className="text-[10px] text-slate-500 italic flex items-center">
                                    {modalMode === 'add' ? 'Akun wali otomatis dibuat: User = NIS, Pass = password123' : ''}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setModalOpen(false)}
                                        className="rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/25 py-2.5 px-4 text-xs font-semibold text-red-400 transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 px-6 text-xs font-semibold text-white transition-all shadow-md"
                                    >
                                        Simpan Data
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}


        </div>
    );
}
