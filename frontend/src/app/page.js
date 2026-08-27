"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (user.role === "admin") {
          router.replace("/admin/dashboard");
        } else if (user.role === "guru") {
          router.replace("/guru/dashboard");
        } else if (user.role === "wali_siswa") {
          router.replace("/wali_siswa/dashboard");
        }
      } else {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

    return (
        <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-[#020c08] text-slate-800 dark:text-slate-100 transition-colors duration-300">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                <p className="text-emerald-600 dark:text-emerald-500 font-semibold tracking-wide">Menghubungkan ke Sistem...</p>
            </div>
        </div>
    );
}
