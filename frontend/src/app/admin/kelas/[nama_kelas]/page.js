"use client";
import React, { useState, useEffect, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Users, ArrowLeft, Search } from 'lucide-react';

export default function DetailKelasPage({ params }) {
    const { token } = useAuth();
    const router = useRouter();
    const [siswaList, setsiswaList] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // params is a Promise in newer Next.js versions
    const resolvedParams = use(params);
    const namaKelas = decodeURIComponent(resolvedParams.nama_kelas);
    const API_URL = '/api';

    useEffect(() => {
        if (token) {
            fetchsiswa();
        }
    }, [token, namaKelas]);

    const fetchsiswa = async () => {
        try {
            const res = await fetch(`${API_URL}/kelas/${encodeURIComponent(namaKelas)}/siswa`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setsiswaList(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching siswa by kelas:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <button 
                            onClick={() => router.push('/admin/kelas')}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                            <Users className="h-6 w-6 text-emerald-500" />
                            Daftar Siswa Kelas {namaKelas}
                        </h1>
                    </div>
                    <p className="text-slate-400 text-sm ml-12">Lihat dan kelola siswa yang tergabung di kelas ini.</p>
                </div>
            </div>

            <div className="glass-panel rounded-3xl p-6">
                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                    </div>
                ) : siswaList.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 bg-transparent rounded-2xl border-2 border-dashed border-emerald-500/20">
                        <div className="flex flex-col items-center justify-center gap-2">
                            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
                                <Search className="h-6 w-6" />
                            </div>
                            <p className="font-medium text-slate-400">Belum ada siswa di kelas ini.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {siswaList.map((s, idx) => (
                            <div key={s.id} className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-[#020c08]/40 border border-emerald-500/10 hover:border-emerald-500/30 transition-all shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-lg shrink-0 border border-emerald-500/20">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-white text-lg">{s.nama_lengkap}</p>
                                        <p className="text-sm text-slate-400">NIS: {s.nis}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${s.status_aktif === 'aktif' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                        {s.status_aktif}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
