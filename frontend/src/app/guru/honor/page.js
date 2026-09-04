"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTahunAjaran } from '@/hooks/useTahunAjaran';
import { Wallet, CheckCircle2, AlertCircle, Download, History } from 'lucide-react';
import CetakSlipGajiModal from '@/components/CetakSlipGajiModal';

export default function GuruHonorPage() {
    const { user, token } = useAuth();
    const { tahunAjaranList } = useTahunAjaran();
    
    const [honors, setHonors] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // States for Cetak Modal
    const [showCetakModal, setShowCetakModal] = useState(false);
    const [selectedHonorPrint, setSelectedHonorPrint] = useState(null);

    useEffect(() => {
        const fetchMyHonor = async () => {
            if (!token) return;
            try {
                setLoading(true);
                const res = await fetch(`/api/honor/my-honor`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) setHonors(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchMyHonor();
    }, [token]);

    const getBulanName = (bln) => {
        const bulanArr = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return bulanArr[bln - 1];
    };

    const cetakSlipGaji = (honor) => {
        if(honor.status_pembayaran !== 'dibayar') {
            alert('Slip gaji hanya bisa dicetak jika status sudah DIBAYAR.');
            return;
        }
        setSelectedHonorPrint(honor);
        setShowCetakModal(true);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-black opacity-10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                            <Wallet className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-wide">Gaji Saya</h1>
                    </div>
                    <p className="text-emerald-50 text-sm max-w-xl leading-relaxed">
                        Riwayat penerimaan honor mengajar bulanan Anda.
                    </p>
                </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-[#041610] rounded-2xl border border-slate-200 dark:border-emerald-500/10 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                    <History className="h-5 w-5 text-slate-400" />
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Riwayat Honor</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                        <thead className="bg-slate-50 dark:bg-emerald-950/20 text-slate-700 dark:text-slate-200 font-bold">
                            <tr>
                                <th className="px-4 py-3 rounded-l-xl">Periode</th>
                                <th className="px-4 py-3">Total Jam</th>
                                <th className="px-4 py-3">Total Honor</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 rounded-r-xl text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-8">Memuat data...</td></tr>
                            ) : honors.filter(h => h.status_pembayaran === 'dibayar').length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-12">
                                        <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                                            <Wallet className="h-12 w-12 mb-3 opacity-20" />
                                            <p>Belum ada riwayat penggajian.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                honors.filter(h => h.status_pembayaran === 'dibayar').map((h) => (
                                    <tr key={h.id} className="border-b border-slate-100 dark:border-emerald-500/5 hover:bg-slate-50 dark:hover:bg-[#061e16]/50 transition-colors">
                                        <td className="px-4 py-4 font-bold text-slate-800 dark:text-slate-100">
                                            {getBulanName(h.bulan)} {h.tahun}
                                        </td>
                                        <td className="px-4 py-4">{h.total_jam_mengajar} Jam</td>
                                        <td className="px-4 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                                            Rp {parseInt(h.total_honor).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-4 py-4">
                                            {h.status_pembayaran === 'dibayar' ? (
                                                <div className="flex flex-col">
                                                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                                                        <CheckCircle2 className="h-4 w-4" /> DIBAYAR
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 mt-0.5">
                                                        {new Date(h.tanggal_bayar).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-amber-500 font-bold text-xs">
                                                    <AlertCircle className="h-4 w-4" /> BELUM DIBAYAR
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <button 
                                                onClick={() => cetakSlipGaji(h)}
                                                disabled={h.status_pembayaran !== 'dibayar'}
                                                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all
                                                    ${h.status_pembayaran === 'dibayar' 
                                                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50' 
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-50'
                                                    }
                                                `}
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                                Slip Gaji
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Cetak Slip Gaji */}
            <CetakSlipGajiModal 
                isOpen={showCetakModal} 
                onClose={() => setShowCetakModal(false)} 
                honorData={selectedHonorPrint} 
                tahunAjaranList={tahunAjaranList}
            />
        </div>
    );
}
