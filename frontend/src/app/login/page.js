"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, User, ShieldAlert, Sun, Moon } from 'lucide-react';
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
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-[#020c08] px-4 py-12 text-slate-800 dark:text-slate-100 sm:px-6 lg:px-8 transition-colors duration-300">
            {/* Theme Toggle Button */}
            <div className="absolute top-6 right-6">
                <button 
                    onClick={toggleTheme}
                    title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
                    className="p-2.5 rounded-xl bg-white dark:bg-emerald-500/10 border border-slate-200 dark:border-emerald-500/20 text-amber-500 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-emerald-500/20 transition-all cursor-pointer shadow-sm"
                >
                    {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5 text-slate-700" />}
                </button>
            </div>

            {/* Glowing background circles */}
            <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-emerald-500/5 dark:bg-emerald-800/10"></div>
            <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-amber-500/5"></div>

            <div className="w-full max-w-sm space-y-8 relative">
                {/* Header Logo & Title */}
                <div className="flex flex-col items-center text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                        E-Monitoring Siswa
                    </h2>
                    <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400/80 font-semibold">
                        SMP Plus Ma'had Darul Ikhlas
                    </p>
                </div>

                {/* Login Form Panel */}
                <div className="glass-panel rounded-3xl p-8 shadow-2xl">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="flex items-center gap-3 rounded-xl bg-red-950/40 border border-red-500/30 p-4 text-sm text-red-300">
                                <ShieldAlert className="h-5 w-5 shrink-0 text-red-400" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold tracking-wider text-emerald-400 uppercase mb-2">
                                    Username
                                </label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <User className="h-5 w-5 text-emerald-500/60" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="block w-full rounded-xl border border-emerald-500/20 bg-[#061812]/50 py-3 pl-10 pr-3 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                                        placeholder="Masukkan username Anda"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold tracking-wider text-emerald-400 uppercase mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <Lock className="h-5 w-5 text-emerald-500/60" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full rounded-xl border border-emerald-500/20 bg-[#061812]/50 py-3 pl-10 pr-10 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-emerald-500/60 hover:text-emerald-400"
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

                        <div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="group relative flex w-full justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-3 px-4 text-sm font-semibold text-white shadow-lg transition-all hover:from-emerald-500 hover:to-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-[#020c08] disabled:opacity-50"
                            >
                                {submitting ? (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                ) : (
                                    'Masuk Aplikasi'
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer Info */}
                <div className="text-center text-xs text-slate-500">
                    <p>© 2026 SMP Plus Ma'had Darul Ikhlas E-Monitoring. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}
