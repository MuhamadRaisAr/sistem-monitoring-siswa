"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
    LayoutDashboard, Users, BookOpen, Shield, HeartPulse, 
    CircleDollarSign, MessageSquare, LogOut, Menu, X, UserCheck,
    Sun, Moon, Key, UserCog, Eye, EyeOff, Camera, Calendar, ChevronsLeft, ChevronsRight, FileText,
    Printer, ClipboardList, ChevronDown, Bell, BellOff, Activity, Wallet, ShieldAlert
} from 'lucide-react';
import { useWebPush } from '@/hooks/useWebPush';
import { useSocket } from '@/context/SocketContext';
import { getAbbreviatedMapel } from '@/utils/mapelHelper';

export default function GuruLayout({ children }) {
    const { user, logout, loading, token } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { isSubscribed, permissionState, subscribeToPush, unsubscribeFromPush } = useWebPush(token);
    const { socket } = useSocket();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [toastNotif, setToastNotif] = useState(null);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const profileDropdownRef = useRef(null);
    const [isPerekapanOpen, setIsPerekapanOpen] = useState(false);
    const [isAbsensiOpen, setIsAbsensiOpen] = useState(false);
    const [isNilaiOpen, setIsNilaiOpen] = useState(false);
    const [mapels, setMapels] = useState([]);
    // Prevent body scroll when sidebar is open
    useEffect(() => {
        if (sidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [sidebarOpen]);

    useEffect(() => {
        if (pathname.startsWith('/guru/perekapan')) {
            setIsPerekapanOpen(true);
        }
        if (pathname.startsWith('/guru/akademik')) {
            setIsAbsensiOpen(true);
        }
        if (pathname.startsWith('/guru/nilai')) {
            setIsNilaiOpen(true);
        }
    }, [pathname]);

    // Close profile dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
                setProfileDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Socket.io for Realtime Notifications
    useEffect(() => {
        if (!socket) return;
        socket.on('new_notification', (data) => {
            console.log('Received notification:', data);
            setToastNotif(data);
            setTimeout(() => setToastNotif(null), 8000);
        });
        return () => {
            socket.off('new_notification');
        };
    }, [socket]);

    // Change profile states
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [editNamaLengkap, setEditNamaLengkap] = useState('');
    const [editUsername, setEditUsername] = useState('');
    const [editNoHp, setEditNoHp] = useState('');
    const [editProfileError, setEditProfileError] = useState('');
    const [editProfileSuccess, setEditProfileSuccess] = useState('');
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editAvatar, setEditAvatar] = useState(null);

    // Change password states
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Password visibility states
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleEditProfile = async (e) => {
        e.preventDefault();
        setEditProfileError('');
        setEditProfileSuccess('');
        setIsEditingProfile(true);

        try {
            const res = await fetch('/api/auth/update-profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    nama_lengkap: editNamaLengkap, 
                    username: editUsername, 
                    no_hp: editNoHp,
                    avatar: editAvatar !== null ? editAvatar : undefined
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Gagal mengubah profil.');
            }

            setEditProfileSuccess('Profil berhasil diperbarui. Silakan muat ulang halaman jika perubahan belum terlihat.');
            setTimeout(() => {
                setIsEditProfileOpen(false);
                setEditProfileSuccess('');
                window.location.reload(); // Reload to reflect changes globally
            }, 1500);
        } catch (err) {
            setEditProfileError(err.message);
        } finally {
            setIsEditingProfile(false);
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setEditProfileError('Ukuran file maksimal 2MB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditAvatar(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (newPassword !== confirmPassword) {
            setErrorMsg('Password baru dan konfirmasi password tidak cocok.');
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ oldPassword, newPassword })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Gagal mengubah password.');
            }

            setSuccessMsg('Password berhasil diperbarui.');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                setIsChangePasswordOpen(false);
                setSuccessMsg('');
            }, 2000);
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (user.role !== 'guru') {
                router.push('/');
            }
        }
    }, [user, loading, router]);

    // Fetch list of ekskul to determine if user is a pembina
    const [hasEkskul, setHasEkskul] = useState(false);
    useEffect(() => {
        if (!token || !user) return;
        const checkEkskulAndJadwal = async () => {
            try {
                const [resEkskul, resJadwal] = await Promise.all([
                    fetch('/api/ekskul', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('/api/jadwal/my-jadwal', { headers: { 'Authorization': `Bearer ${token}` } })
                ]);
                
                if (resEkskul.ok) {
                    const dataEkskul = await resEkskul.json();
                    if (Array.isArray(dataEkskul)) {
                        const isPembina = dataEkskul.some(e => e.pembina_id?.toString() === user.id?.toString());
                        setHasEkskul(isPembina);
                    }
                }

                if (resJadwal.ok) {
                    const dataJadwal = await resJadwal.json();
                    if (Array.isArray(dataJadwal)) {
                        const uniqueMapels = Array.from(new Set(dataJadwal.map(j => j.mata_pelajaran).filter(Boolean)));
                        setMapels(uniqueMapels);
                    }
                }
            } catch (err) {
                console.error('Error fetching ekskul/jadwal:', err);
            }
        };
        checkEkskulAndJadwal();
    }, [token, user]);

    if (loading || !user || user.role !== 'guru') {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-[#020c08] text-slate-800 dark:text-white transition-colors duration-300">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                    <p className="text-emerald-500 font-medium">Memverifikasi Guru...</p>
                </div>
            </div>
        );
    }

    const navigationGroups = [
        {
            title: "Menu Utama",
            items: [
                { name: 'Dashboard', href: '/guru/dashboard', icon: LayoutDashboard },
            ]
        },
        {
            title: "Akademik",
            items: [
                { name: 'Jadwal Mengajar', href: '/guru/jadwal', icon: Calendar },
                { 
                    name: 'Input Absensi', 
                    icon: BookOpen,
                    id: 'absensi',
                    ...(mapels.length > 1 ? {
                        children: mapels.map(m => ({ name: `Absensi ${getAbbreviatedMapel(m)}`, href: `/guru/akademik?mapel=${encodeURIComponent(m)}` }))
                    } : {
                        href: '/guru/akademik'
                    })
                },
                { 
                    name: 'Input Nilai', 
                    icon: FileText,
                    id: 'nilai',
                    ...(mapels.length > 1 ? {
                        children: mapels.map(m => ({ name: `Input Nilai ${getAbbreviatedMapel(m)}`, href: `/guru/nilai?mapel=${encodeURIComponent(m)}` }))
                    } : {
                        href: '/guru/nilai'
                    })
                },
            ]
        },
        {
            title: "Kesiswaan",
            items: [
                ...(user?.is_wali_kelas ? [
                    { 
                        name: 'Pelanggaran Kelas', 
                        icon: ShieldAlert,
                        id: 'pelanggaran-kelas',
                        href: '/guru/kedisiplinan/kelas'
                    }
                ] : []),
                ...(hasEkskul ? [
                    { name: 'Ekstrakurikuler', href: '/guru/ekskul', icon: Activity }
                ] : []),
            ]
        },
        {
            title: "Laporan & Administrasi",
            items: [
                { 
                    name: 'Perekapan', 
                    icon: ClipboardList,
                    id: 'perekapan',
                    children: [
                        { name: 'Rekap Absensi Guru', href: '/guru/perekapan/absensi' },
                        { name: 'Rekap Nilai Guru', href: '/guru/perekapan/nilai-mapel' },
                        ...(user?.is_wali_kelas ? [
                            { name: 'Rekap Absensi Wali Kelas', href: '/guru/perekapan/absensi-wali' },
                            { name: 'Rekap Nilai Wali Kelas', href: '/guru/perekapan/nilai' }
                        ] : []),
                    ]
                },
                ...(user?.is_wali_kelas ? [
                    { name: 'Cetak Raport', href: '/guru/cetak_raport', icon: Printer }
                ] : []),
                { name: 'Gaji Saya', href: '/guru/honor', icon: Wallet },
            ]
        }
    ].filter(group => group.items.length > 0);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const handleMenuClick = () => {
        setSidebarOpen(false);
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('guruAbsensi_mapel');
            sessionStorage.removeItem('guruAbsensi_kelas');
            sessionStorage.removeItem('guruNilai_mapel');
            sessionStorage.removeItem('guruNilai_kelas');
        }
    };

    return (
        <div className="h-screen overflow-hidden bg-slate-50 dark:bg-[#020c08] text-slate-800 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-300">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black/60 md:hidden"
                    onClick={toggleSidebar}
                ></div>
            )}

            {/* Realtime Toast Notification */}
            {toastNotif && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-white text-slate-700 px-5 py-4 rounded-2xl shadow-xl flex items-start gap-4 animate-fade-in-up max-w-[90vw] md:max-w-md w-full border border-slate-200">
                    <div className="bg-slate-100 p-2 rounded-xl shrink-0">
                        <Bell className="h-6 w-6 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-sm mb-0.5 text-slate-800">{toastNotif.title}</p>
                        <p className="text-xs text-slate-500 leading-relaxed">{toastNotif.message}</p>
                    </div>
                    <button onClick={() => setToastNotif(null)} className="shrink-0 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                        <X className="h-5 w-5" />
                    </button>
                </div>
            )}

            {/* Sidebar Component */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 flex flex-col shrink-0 bg-white dark:bg-[#041610] border-r border-slate-200 dark:border-emerald-500/10 transition-all duration-300 md:static md:translate-x-0 md:h-screen
                ${sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'}
                ${isCollapsed ? 'md:w-20' : 'md:w-72'}
            `}>
                {/* Brand / Logo */}
                <div className={`flex h-20 items-center border-b border-slate-200 dark:border-emerald-500/10 ${isCollapsed ? 'justify-center' : 'justify-between px-4 md:px-6'}`}>
                    {!isCollapsed && (
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div>
                                <h1 className="font-bold text-slate-800 dark:text-white tracking-wide leading-none transition-opacity duration-300">
                                    SISTEM MONITORING
                                </h1>
                            </div>
                        </div>
                    )}
                    
                    <button onClick={toggleSidebar} className={`md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-white shrink-0 ${isCollapsed ? 'hidden' : ''}`}>
                        <X className="h-6 w-6" />
                    </button>
                    
                    <button 
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`hidden md:flex p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-[#061e16] hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0 ${isCollapsed ? '' : 'ml-2'}`}
                        title={isCollapsed ? "Perluas Sidebar" : "Perkecil Sidebar"}
                    >
                        {isCollapsed ? <ChevronsRight className="h-6 w-6 text-emerald-600" /> : <ChevronsLeft className="h-5 w-5" />}
                    </button>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 px-3 py-6 overflow-y-auto overscroll-none">
                    {navigationGroups.map((group, idx) => (
                        <div key={idx} className={idx > 0 ? "mt-6 pt-4 border-t border-slate-200 dark:border-emerald-500/10 space-y-1" : "space-y-1"}>
                            {!isCollapsed && <p className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">{group.title}</p>}
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                if (item.children) {
                                    let isParentActive = false;
                                    let isDropdownOpen = false;
                                    let setDropdownOpen = null;

                                    if (item.id === 'perekapan') {
                                        isParentActive = pathname.startsWith('/guru/perekapan');
                                        isDropdownOpen = isPerekapanOpen;
                                        setDropdownOpen = setIsPerekapanOpen;
                                    } else if (item.id === 'absensi') {
                                        isParentActive = pathname.startsWith('/guru/akademik');
                                        isDropdownOpen = isAbsensiOpen;
                                        setDropdownOpen = setIsAbsensiOpen;
                                    } else if (item.id === 'nilai') {
                                        isParentActive = pathname.startsWith('/guru/nilai');
                                        isDropdownOpen = isNilaiOpen;
                                        setDropdownOpen = setIsNilaiOpen;
                                    }

                                    return (
                                        <div key={item.name} className="space-y-1">
                                            <button
                                                onClick={() => setDropdownOpen && setDropdownOpen(!isDropdownOpen)}
                                                title={isCollapsed ? item.name : ""}
                                                className={`
                                                    w-full flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200 cursor-pointer
                                                    ${isParentActive 
                                                        ? 'bg-emerald-600/10 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border-l-4 border-emerald-500 shadow-[inset_4px_0_12px_rgba(16,185,129,0.05)]' 
                                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#061e16] hover:text-slate-900 dark:hover:text-slate-100 border-l-4 border-transparent'
                                                    }
                                                    ${isCollapsed ? 'md:justify-center md:px-0' : ''}
                                                `}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Icon className={`h-5 w-5 shrink-0 ${isParentActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                                                    <span className={`${isCollapsed ? 'md:hidden' : 'block'} whitespace-nowrap`}>{item.name}</span>
                                                </div>
                                                {!isCollapsed && (
                                                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                                )}
                                            </button>
                                            {isDropdownOpen && !isCollapsed && (
                                                <div className="pl-6 space-y-1 animate-fade-in">
                                                    {item.children.map((child) => {
                                                        let isChildActive = false;
                                                        if (item.id === 'absensi' || item.id === 'nilai') {
                                                            // use reactive searchParams from Next.js hook
                                                            const currentMapel = searchParams.get('mapel');
                                                            const mapelFromHref = new URLSearchParams(child.href.split('?')[1] || '').get('mapel');
                                                            isChildActive = (pathname === child.href.split('?')[0]) && (currentMapel === mapelFromHref);
                                                        } else {
                                                            isChildActive = pathname === child.href;
                                                        }
                                                        return (
                                                            <Link
                                                                key={child.name}
                                                                href={child.href}
                                                                onClick={handleMenuClick}
                                                                className={`
                                                                    flex items-center gap-3 rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-250
                                                                    ${isChildActive 
                                                                        ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/5 dark:bg-emerald-500/10' 
                                                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#061e16] hover:text-slate-900 dark:hover:text-slate-100'
                                                                    }
                                                                `}
                                                            >
                                                                <span className={`h-1.5 w-1.5 rounded-full ${isChildActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                                <span>{child.name}</span>
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={handleMenuClick}
                                        title={isCollapsed ? item.name : ""}
                                        className={`
                                            flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200
                                            ${isActive 
                                                ? 'bg-emerald-600/10 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border-l-4 border-emerald-500 shadow-[inset_4px_0_12px_rgba(16,185,129,0.05)]' 
                                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#061e16] hover:text-slate-900 dark:hover:text-slate-100 border-l-4 border-transparent'
                                            }
                                            ${isCollapsed ? 'md:justify-center md:px-0' : ''}
                                        `}
                                    >
                                        <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                                        <span className={`${isCollapsed ? 'md:hidden' : 'block'} whitespace-nowrap`}>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>


            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden">
                {/* Header Navbar */}
                <header className={`flex items-center justify-between px-6 border-b border-slate-200 dark:border-emerald-500/10 bg-white/80 dark:bg-[#020c08]/50 backdrop-blur-md sticky top-0 z-30 transition-all duration-300 ${pathname.endsWith('/dashboard') ? 'h-24 py-2' : 'h-20'}`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0 md:flex-none">
                        <button onClick={toggleSidebar} className="md:hidden text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white p-2 -ml-2 shrink-0">
                            <Menu className="h-6 w-6" />
                        </button>
                        <h2 className="hidden md:flex items-center text-xl font-bold text-slate-800 dark:text-white tracking-wide capitalize gap-2">
                            {pathname.split('/').pop().replace('-', ' ')}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Theme Toggle Button */}
                        <button 
                            onClick={toggleTheme}
                            title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
                            className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 border border-slate-200 dark:border-emerald-500/20 text-amber-500 dark:text-amber-400 transition-all cursor-pointer"
                        >
                            {theme === 'dark' ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700" />}
                        </button>

                        {/* Profile Dropdown */}
                        <div className="relative" ref={profileDropdownRef}>
                            <button 
                                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                                className="flex items-center gap-3 text-left hover:opacity-85 transition-opacity focus:outline-none cursor-pointer"
                            >
                                <div className="hidden sm:flex flex-col text-right">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Selamat datang</span>
                                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{user.nama_lengkap}</span>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-600 dark:text-emerald-400 text-sm overflow-hidden">
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
                                    ) : (
                                        user?.nama_lengkap?.substring(0, 2).toUpperCase() || 'GR'
                                    )}
                                </div>
                            </button>

                            {profileDropdownOpen && (
                                <>
                                    {/* Dropdown Menu Panel */}
                                    <div className="absolute right-0 mt-2.5 w-60 rounded-2xl bg-white dark:bg-[#041610] border border-slate-200 dark:border-emerald-500/10 shadow-xl py-2 z-50 animate-fade-in text-slate-800 dark:text-slate-200">
                                        <div className="px-4 py-2 border-b border-slate-100 dark:border-emerald-500/5">
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Panel Guru</p>
                                            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user.nama_lengkap}</p>
                                            <p className="text-[10px] text-slate-500 truncate mt-0.5">@{user.username}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setProfileDropdownOpen(false);
                                                setIsEditProfileOpen(true);
                                                setEditNamaLengkap(user.nama_lengkap);
                                                setEditUsername(user.username);
                                                setEditNoHp(user.no_hp || '');
                                                setEditAvatar(user.avatar || null);
                                                setEditProfileError('');
                                                setEditProfileSuccess('');
                                            }}
                                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-[#061e16] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 text-left transition-colors cursor-pointer"
                                        >
                                            <UserCog className="h-4 w-4 text-emerald-500" />
                                            Edit Profil
                                        </button>
                                        <button
                                            onClick={() => {
                                                setProfileDropdownOpen(false);
                                                setIsChangePasswordOpen(true);
                                                setOldPassword('');
                                                setNewPassword('');
                                                setConfirmPassword('');
                                                setErrorMsg('');
                                                setSuccessMsg('');
                                            }}
                                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-[#061e16] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 text-left transition-colors cursor-pointer"
                                        >
                                            <Key className="h-4 w-4 text-emerald-500" />
                                            Ubah Password
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (isSubscribed) {
                                                    unsubscribeFromPush();
                                                } else {
                                                    subscribeToPush();
                                                }
                                            }}
                                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-[#061e16] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 text-left transition-colors cursor-pointer"
                                        >
                                            {isSubscribed ? (
                                                <>
                                                    <BellOff className="h-4 w-4 text-rose-500" />
                                                    Matikan Notifikasi
                                                </>
                                            ) : (
                                                <>
                                                    <Bell className="h-4 w-4 text-indigo-500" />
                                                    Aktifkan Notifikasi
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setProfileDropdownOpen(false);
                                                logout();
                                            }}
                                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-300 text-left transition-colors cursor-pointer"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Keluar Akun
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Dashboard Page Wrapper */}
                <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
                    {children}
                </main>
            </div>

            {/* Change Password Modal */}
            {isChangePasswordOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 overflow-hidden bg-white dark:bg-[#041610] text-slate-800 dark:text-white border border-slate-200 dark:border-emerald-500/10">
                        <button 
                            onClick={() => setIsChangePasswordOpen(false)} 
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                        >
                            <X className="h-6 w-6" />
                        </button>
                        
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Key className="h-5 w-5 text-emerald-500" />
                            Ubah Password
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Silakan masukkan password lama Anda dan password baru yang ingin Anda gunakan.</p>

                        <form onSubmit={handleChangePassword} className="space-y-4">
                            {errorMsg && (
                                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-300 text-xs font-semibold">
                                    {errorMsg}
                                </div>
                            )}
                            {successMsg && (
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                                    {successMsg}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-emerald-400 uppercase tracking-wider mb-1">Password Lama</label>
                                <div className="relative">
                                    <input
                                        type={showOldPassword ? 'text' : 'password'}
                                        required
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 pl-3 pr-10 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm"
                                        placeholder="Password saat ini"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowOldPassword(!showOldPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:text-emerald-500/60 dark:hover:text-emerald-400 cursor-pointer"
                                    >
                                        {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-emerald-400 uppercase tracking-wider mb-1">Password Baru</label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 pl-3 pr-10 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm"
                                        placeholder="Password baru"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:text-emerald-500/60 dark:hover:text-emerald-400 cursor-pointer"
                                    >
                                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-emerald-400 uppercase tracking-wider mb-1">Konfirmasi Password Baru</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 pl-3 pr-10 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm"
                                        placeholder="Ulangi password baru"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:text-emerald-500/60 dark:hover:text-emerald-400 cursor-pointer"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsChangePasswordOpen(false)}
                                    className="rounded-xl border border-slate-200 dark:border-emerald-500/20 py-2.5 px-4 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#061e16] transition-all cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 py-2.5 px-6 text-sm font-semibold text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {isSubmitting && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>}
                                    Simpan Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Profile Modal */}
            {isEditProfileOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 overflow-hidden bg-white dark:bg-[#041610] text-slate-800 dark:text-white border border-slate-200 dark:border-emerald-500/10">
                        <button 
                            onClick={() => setIsEditProfileOpen(false)} 
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                        >
                            <X className="h-6 w-6" />
                        </button>
                        
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <UserCog className="h-5 w-5 text-emerald-500" />
                            Edit Profil
                        </h2>

                        <form onSubmit={handleEditProfile} className="space-y-4">
                            {editProfileError && (
                                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-300 text-xs font-semibold">
                                    {editProfileError}
                                </div>
                            )}
                            {editProfileSuccess && (
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                                    {editProfileSuccess}
                                </div>
                            )}

                            <div className="flex flex-col items-center justify-center mb-6">
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    id="avatar-upload" 
                                    className="hidden" 
                                    onChange={handleAvatarChange} 
                                />
                                <label htmlFor="avatar-upload" className="relative group cursor-pointer" title="Ubah Foto Profil">
                                    <div className="h-24 w-24 rounded-full bg-emerald-100 dark:bg-emerald-900/50 border-4 border-white dark:border-[#041610] shadow-md flex items-center justify-center font-bold text-emerald-600 dark:text-emerald-400 text-3xl overflow-hidden">
                                        {(editAvatar !== '' && (editAvatar || user?.avatar)) ? (
                                            <img src={editAvatar || user.avatar} alt="Avatar" className="h-full w-full object-cover" />
                                        ) : (
                                            user?.nama_lengkap?.substring(0, 2).toUpperCase() || 'GR'
                                        )}
                                    </div>
                                    <div className="absolute inset-0 rounded-full bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="h-6 w-6 text-white mb-1" />
                                        <span className="text-[9px] text-white font-bold">UBAH FOTO</span>
                                    </div>
                                </label>
                                {editAvatar !== '' && (editAvatar || user?.avatar) && (
                                    <button 
                                        type="button"
                                        onClick={() => setEditAvatar('')}
                                        className="mt-3 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold flex items-center gap-1 transition-colors"
                                    >
                                        <X className="h-3 w-3" /> Hapus Foto
                                    </button>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-emerald-400 uppercase tracking-wider mb-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    required
                                    value={editNamaLengkap}
                                    onChange={(e) => setEditNamaLengkap(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-emerald-400 uppercase tracking-wider mb-1">No. HP (Opsional)</label>
                                <input
                                    type="text"
                                    value={editNoHp}
                                    onChange={(e) => setEditNoHp(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-[#020c08]/50 py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none text-sm"
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditProfileOpen(false)}
                                    className="rounded-xl border border-slate-200 dark:border-emerald-500/20 py-2.5 px-4 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#061e16] transition-all cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isEditingProfile}
                                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 py-2.5 px-6 text-sm font-semibold text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {isEditingProfile && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>}
                                    Simpan Profil
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
