"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ChildContext = createContext(null);

export const ChildProvider = ({ children }) => {
    const { token, user } = useAuth();
    const [childrenList, setChildrenList] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [loadingChildren, setLoadingChildren] = useState(true);

    const API_URL = '/api';

    const fetchChildren = async () => {
        if (!token || user?.role !== 'wali_siswa') {
            setLoadingChildren(false);
            return;
        }

        try {
            setLoadingChildren(true);
            const res = await fetch(`${API_URL}/siswa/my-children`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            setChildrenList(data);
            if (data.length > 0) {
                // Restore last selected child or select first
                const savedId = localStorage.getItem('last_selected_child_id');
                const matched = data.find(c => c.id.toString() === savedId);
                setSelectedChild(matched || data[0]);
            }
        } catch (err) {
            console.error('Error fetching mapped children:', err);
        } finally {
            setLoadingChildren(false);
        }
    };

    useEffect(() => {
        fetchChildren();
    }, [token, user]);

    const changeSelectedChild = (child) => {
        setSelectedChild(child);
        if (child) {
            localStorage.setItem('last_selected_child_id', child.id.toString());
        }
    };

    return (
        <ChildContext.Provider value={{ 
            childrenList, 
            selectedChild, 
            loadingChildren, 
            changeSelectedChild,
            reloadChildren: fetchChildren 
        }}>
            {children}
        </ChildContext.Provider>
    );
};

export const useChild = () => useContext(ChildContext);
