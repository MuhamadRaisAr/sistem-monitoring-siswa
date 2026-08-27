import React from 'react';
import { getMapelSortIndex } from '@/utils/mapelHelper';
    const RaportContent = ({ 
        studentObj, 
        dataRaport, 
        dataKehadiran, 
        dataPelanggaran, 
        listMapelKelas,
        dataEkskul,
        isBulkPrint = false,
        tahunAjaranList = [],
        selectedTahunAjaranId = null,
        zoomScale = 1
    }) => (
        <div className={`w-full flex justify-center overflow-hidden print:overflow-visible ${isBulkPrint ? 'page-break-after-always' : ''}`}>
            <div style={{ zoom: isBulkPrint ? 1 : zoomScale }} id={isBulkPrint ? undefined : "raport-print-area"} className={`bg-white text-black p-10 shadow-sm border  w-[800px] max-w-[800px] mx-auto print:border-none print:shadow-none print:w-full print:mx-0 print:p-0 ${isBulkPrint ? 'mb-12 print:mb-0' : ''}`}>
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
                            <div className="flex-1"></div>
                        </div>
                        <div className="flex">
                            <div className="w-56">Jenis Kelamin</div>
                            <div className="w-4">:</div>
                            <div className="flex-1"></div>
                        </div>
                        <div className="flex">
                            <div className="w-56">Agama</div>
                            <div className="w-4">:</div>
                            <div className="flex-1"></div>
                        </div>
                        <div className="flex">
                            <div className="w-56">Pendidikan sebelumnya</div>
                            <div className="w-4">:</div>
                            <div className="flex-1"></div>
                        </div>
                        <div className="flex">
                            <div className="w-56">Alamat Peserta Didik</div>
                            <div className="w-4">:</div>
                            <div className="flex-1"></div>
                        </div>

                        <div className="pt-4">
                            <div className="w-56">Nama Orang Tua</div>
                            <div className="flex">
                                <div className="w-56 pl-4">Ayah</div>
                                <div className="w-4">:</div>
                                <div className="flex-1"></div>
                            </div>
                            <div className="flex">
                                <div className="w-56 pl-4">Ibu</div>
                                <div className="w-4">:</div>
                                <div className="flex-1"></div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <div className="w-56">Pekerjaan Orang Tua</div>
                            <div className="flex">
                                <div className="w-56 pl-4">Ayah</div>
                                <div className="w-4">:</div>
                                <div className="flex-1"></div>
                            </div>
                            <div className="flex">
                                <div className="w-56 pl-4">Ibu</div>
                                <div className="w-4">:</div>
                                <div className="flex-1"></div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <div className="w-56">Alamat Orang Tua</div>
                            <div className="flex">
                                <div className="w-56 pl-4">Jalan</div>
                                <div className="w-4">:</div>
                                <div className="flex-1"></div>
                            </div>
                            <div className="flex">
                                <div className="w-56 pl-4">Kelurahan/Desa</div>
                                <div className="w-4">:</div>
                                <div className="flex-1"></div>
                            </div>
                            <div className="flex">
                                <div className="w-56 pl-4">Kecamatan</div>
                                <div className="w-4">:</div>
                                <div className="flex-1"></div>
                            </div>
                            <div className="flex">
                                <div className="w-56 pl-4">Kabupaten / Kota</div>
                                <div className="w-4">:</div>
                                <div className="flex-1"></div>
                            </div>
                            <div className="flex">
                                <div className="w-56 pl-4">Provinsi</div>
                                <div className="w-4">:</div>
                                <div className="flex-1"></div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <div className="w-56">Wali Peserta Didik</div>
                            <div className="flex">
                                <div className="w-56 pl-4">Nama</div>
                                <div className="w-4">:</div>
                                <div className="flex-1">{studentObj?.nama_wali || ''}</div>
                            </div>
                            <div className="flex">
                                <div className="w-56 pl-4">Pekerjaan</div>
                                <div className="w-4">:</div>
                                <div className="flex-1"></div>
                            </div>
                            <div className="flex">
                                <div className="w-56 pl-4">Alamat</div>
                                <div className="w-4">:</div>
                                <div className="flex-1"></div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-10 items-end text-[15px]">
                        <div className="col-start-4 col-span-2 flex justify-center">
                            <div style={{ width: '3cm', height: '4cm' }} className="border-2 border-black flex items-center justify-center text-sm  bg-white">
                                Foto<br/>3x4
                            </div>
                        </div>
                        <div className="col-start-7 col-span-4 flex justify-end">
                            <div className="text-center flex flex-col items-center">
                                <p className="flex items-center">
                                    <span>Garut,&nbsp;</span>
                                    <span 
                                        className="outline-none focus: transition-colors cursor-text" 
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
                    <table className="w-full border-collapse text-[13px]">
                        <thead>
                            <tr className="">
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
                                            <td colSpan="4" className="border border-black py-8 text-center italic ">Belum ada data mata pelajaran (jadwal kelas kosong).</td>
                                        </tr>
                                    );
                                }

                                return finalGradesList.map((item, index) => (
                                    <tr key={index}>
                                        <td className="border border-black py-2 px-1 text-center align-top">{index + 1}</td>
                                        <td className="border border-black py-2 px-2 align-top">{item.mata_pelajaran}</td>
                                        <td className="border border-black py-2 px-1 text-center align-top">{item.nilai}</td>
                                        <td 
                                            className="border border-black py-2 px-3 text-justify align-top leading-tight outline-none focus: transition-colors"
                                            contentEditable={true}
                                            suppressContentEditableWarning={true}
                                        >
                                            <span className={item.nilai === '-' ? ' italic' : ''}>{item.capaian}</span>
                                        </td>
                                    </tr>
                                ));
                            })()}
                        </tbody>
                    </table>

                    {/* Table Ekstrakurikuler */}
                    <div className="mt-8">
                        <table className="w-full border-collapse text-[13px]">
                            <thead>
                                <tr className="">
                                    <th className="border border-black py-2 px-1 w-10 text-center font-semibold">No</th>
                                    <th className="border border-black py-2 px-2 w-48 text-center font-semibold">Kegiatan Ekstrakurikuler</th>
                                    <th className="border border-black py-2 px-2 w-16 text-center font-semibold">Predikat</th>
                                    <th className="border border-black py-2 px-3 text-center font-semibold">Keterangan</th>
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
                                        <td colSpan="4" className="border border-black py-4 text-center italic ">Belum ada data ekstrakurikuler</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Ketidakhadiran */}
                    <div className="mt-6 w-[50%]">
                        <table className="w-full border-collapse text-[13px]">
                            <tbody>
                                <tr>
                                    <td className="border border-black py-1.5 px-3 w-40">Sakit</td>
                                    <td className="border border-black py-1.5 px-3 w-28">: {dataKehadiran?.sakit || 0} hari</td>
                                </tr>
                                <tr>
                                    <td className="border border-black py-1.5 px-3">Izin</td>
                                    <td className="border border-black py-1.5 px-3">: {dataKehadiran?.izin || 0} hari</td>
                                </tr>
                                <tr>
                                    <td className="border border-black py-1.5 px-3">Tanpa Keterangan</td>
                                    <td className="border border-black py-1.5 px-3">: {dataKehadiran?.alpa || 0} hari</td>
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
                            className="w-full min-h-[60px] border border-black p-3 text-[13px] italic flex items-center outline-none focus: transition-colors"
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
                                            className="outline-none focus: transition-colors cursor-text" 
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
                    <table className="w-full border-collapse text-[13px] mb-8">
                        <thead>
                            <tr className="">
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
                                            <td colSpan="3" className="border border-black py-8 text-center italic ">Belum ada data mata pelajaran (jadwal kelas kosong).</td>
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
                    <table className="w-full border-collapse text-[13px] mb-8">
                        <thead>
                            <tr className="">
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
                                    <td colSpan="4" className="border border-black py-4 text-center italic ">Belum ada data ekstrakurikuler</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Table Ketidakhadiran */}
                    <div className="w-[60%]">
                        <table className="w-full border-collapse text-[13px]">
                            <thead>
                                <tr className="">
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
export default RaportContent;





