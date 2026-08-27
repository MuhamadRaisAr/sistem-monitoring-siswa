"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PerekapanRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/guru/perekapan/absensi');
    }, [router]);

    return null;
}
