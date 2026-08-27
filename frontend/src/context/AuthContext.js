"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const API_URL = '/api';
    const INACTIVITY_LIMIT = 60 * 60 * 1000; // 1 jam dalam milidetik

    // Fitur "Geser/Tekan Kembali 2x untuk Logout" di Dashboard
    useEffect(() => {
        let backPressCount = 0;
        let backPressTimer;

        const isDashboard = pathname === '/admin/dashboard' || pathname === '/guru/dashboard' || pathname === '/wali_siswa/dashboard' || pathname === '/bendahara/dashboard';

        const handlePopState = (event) => {
            if (isDashboard) {
                backPressCount++;
                if (backPressCount === 1) {
                    // Mencegah kembali (menjebak popstate) dengan cara menambah history state lagi
                    window.history.pushState(null, null, window.location.pathname);
                    
                    alert('Geser atau tekan KEMBALI sekali lagi untuk LOGOUT.');

                    backPressTimer = setTimeout(() => {
                        backPressCount = 0;
                    }, 2000);
                } else if (backPressCount === 2) {
                    clearTimeout(backPressTimer);
                    logout();
                }
            }
        };

        if (isDashboard) {
            // Jebak tombol back saat pertama kali mount di dashboard
            window.history.pushState(null, null, window.location.pathname);
            window.addEventListener('popstate', handlePopState);
        }

        return () => {
            window.removeEventListener('popstate', handlePopState);
            if (backPressTimer) clearTimeout(backPressTimer);
        };
    }, [pathname]);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        const lastActivity = localStorage.getItem('last_activity');

        if (storedToken && storedUser && storedUser !== 'undefined') {
            // Cek apakah sudah melebihi batas inaktif saat baru buka (1 jam)
            if (lastActivity && (Date.now() - parseInt(lastActivity, 10)) > INACTIVITY_LIMIT) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('last_activity');
                setLoading(false);
                return;
            }
            
            // Perbarui aktivitas karena user baru saja membuka web
            localStorage.setItem('last_activity', Date.now().toString());

            try {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } catch (err) {
                console.error("Failed to parse user from localStorage:", err);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setLoading(false);
                return;
            }
            
            // Verify token with backend
            fetch(`${API_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${storedToken}`
                }
            })
            .then(res => {
                if (res.status === 401) {
                    logout();
                } else {
                    return res.json();
                }
            })
            .then(data => {
                if (data && data.user) {
                    setUser(data.user);
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
            })
            .catch(err => {
                console.error('Error verifying token:', err);
                // Log out the user if verification fails completely
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setToken(null);
                setUser(null);
            })
            .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (username, password) => {
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Login failed');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('last_activity', Date.now().toString());
            setToken(data.token);
            setUser(data.user);

            // Redirect based on role
            if (data.user.role === 'admin') {
                router.replace('/admin/dashboard');
            } else if (data.user.role === 'guru') {
                router.replace('/guru/dashboard');
            } else if (data.user.role === 'wali_siswa') {
                router.replace('/wali_siswa/dashboard');
            } else if (data.user.role === 'bendahara') {
                router.replace('/bendahara/dashboard');
            }
            return data.user;
        } catch (err) {
            throw err;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('last_activity');
        setToken(null);
        setUser(null);
        router.replace('/login');
    };

    // Refresh user data from backend (e.g. after profile edit)
    const refreshUser = async (currentToken) => {
        const tkn = currentToken || token;
        if (!tkn) return;
        try {
            const res = await fetch(`${API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${tkn}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.user) {
                    setUser(data.user);
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
            }
        } catch (err) {
            console.error('Error refreshing user:', err);
        }
    };

    const register = async (userData) => {
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Registration failed');
            }
            return data;
        } catch (err) {
            throw err;
        }
    };

    // Tracker aktivitas pengguna
    useEffect(() => {
        if (!token) return;

        const updateActivity = () => {
            localStorage.setItem('last_activity', Date.now().toString());
        };

        // Throttle untuk menghindari terlalu sering update localStorage
        let timeoutId;
        const handleActivity = () => {
            if (!timeoutId) {
                updateActivity();
                timeoutId = setTimeout(() => {
                    timeoutId = null;
                }, 60000); // Update maksimal 1 kali per menit
            }
        };

        // Event listener saat user aktif di halaman web
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(e => window.addEventListener(e, handleActivity));

        return () => {
            events.forEach(e => window.removeEventListener(e, handleActivity));
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [token]);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, register, refreshUser, API_URL }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
