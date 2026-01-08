"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface RoleGuardProps {
    children: React.ReactNode;
    requireRole?: 'admin' | 'volunteer' | 'user'; 
    // 'user' just means authenticated
}

export default function RoleGuard({ children, requireRole = 'user' }: RoleGuardProps) {
    const { user, loading, isAdmin, isVolunteer } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        if (requireRole === 'admin' && !isAdmin) {
            router.push('/dashboard'); // Fallback to safe zone
            return;
        }

        if (requireRole === 'volunteer' && !(isVolunteer || isAdmin)) {
            router.push('/dashboard');
            return;
        }

    }, [user, loading, isAdmin, isVolunteer, router, requireRole]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
        );
    }

    if (!user) return null;
    if (requireRole === 'admin' && !isAdmin) return null;
    if (requireRole === 'volunteer' && !(isVolunteer || isAdmin)) return null;

    return <>{children}</>;
}
