"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, User, ShieldAlert, Sun, Moon, GraduationCap } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { theme, toggleTheme } = useTheme();

    const { login, user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            if (user.role === 'admin') {
                router.replace('/admin/dashboard');
            } else if (user.role === 'guru') {
                router.replace('/guru/dashboard');
            } else if (user.role === 'bendahara') {
                router.replace('/bendahara/dashboard');
            } else if (user.role === 'guru_bk') {
                router.replace('/guru_bk/dashboard');
            } else {
                router.replace('/wali_siswa/dashboard');
            }
        }
    }, [user, loading, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            await login(username, password);
        } catch (err) {
            setError(err.message || 'Username atau password salah.');
            setSubmitting(false);
        }
    };

    if (loading || user) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-[#020c08] text-slate-800 dark:text-slate-100 transition-colors duration-300">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                    <p className="text-emerald-500 font-medium">Memuat halaman...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-transparent overflow-hidden transition-colors duration-500">
            <style>{`
                input:-webkit-autofill,
                input:-webkit-autofill:hover, 
                input:-webkit-autofill:focus, 
                input:-webkit-autofill:active {
                    -webkit-box-shadow: 0 0 0 30px #f8fafc inset !important;
                    -webkit-text-fill-color: #0f172a !important;
                }
                .dark input:-webkit-autofill,
                .dark input:-webkit-autofill:hover, 
                .dark input:-webkit-autofill:focus, 
                .dark input:-webkit-autofill:active {
                    -webkit-box-shadow: 0 0 0 30px #0f172a inset !important;
                    -webkit-text-fill-color: #f1f5f9 !important;
                }
            `}</style>

            {/* Background Gradient Blobs */}
            <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-400 bg-opacity-20 dark:bg-emerald-900 dark:bg-opacity-20 blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-400 bg-opacity-20 dark:bg-cyan-900 dark:bg-opacity-20 blur-3xl pointer-events-none"></div>

            {/* Theme Toggle Button */}
            <div className="absolute top-6 right-6 z-50">
                <button 
                    onClick={toggleTheme}
                    title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-105 hover:shadow-lg transition-all duration-300 cursor-pointer shadow-sm"
                >
                    {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
            </div>

            <div className="w-full max-w-lg z-10 px-4 sm:px-6">
                {/* Login Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-8 sm:p-10 shadow-xl border border-slate-200 dark:border-slate-700">
                    
                    {/* Header Logo & Title */}
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="h-16 w-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg mb-5 transform -rotate-3 hover:rotate-0 transition-transform duration-300 ring-4 ring-slate-50 dark:ring-slate-900">
                            <GraduationCap className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Sistem Akademik
                        </h2>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
                            SMP Plus Ma'had Darul Ikhlas
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 text-sm text-red-600 dark:text-red-400">
                                <ShieldAlert className="h-5 w-5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                                    Username
                                </label>
                                <div className="relative flex items-center">
                                    <div className="absolute left-4 z-10 flex items-center justify-center">
                                        <User className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        style={{ paddingLeft: '3rem' }}
                                        className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 py-3.5 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm transition-all"
                                        placeholder="Masukkan username Anda"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                                    Password
                                </label>
                                <div className="relative flex items-center">
                                    <div className="absolute left-4 z-10 flex items-center justify-center">
                                        <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        style={{ paddingLeft: '3rem' }}
                                        className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 py-3.5 pr-12 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm transition-all"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex w-full justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-500 dark:to-emerald-400 py-4 px-4 text-sm font-bold text-white shadow-lg hover:shadow-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-[#061812] transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
                            >
                                {submitting ? (
                                    <>
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                                        <span>Memproses...</span>
                                    </>
                                ) : (
                                    'Masuk Aplikasi'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
