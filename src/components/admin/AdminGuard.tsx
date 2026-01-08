"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const { user, loading, isAdmin, isVolunteer } = useAuth();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/");
            } else {
                setIsAuthorized(true);
            }
        }
    }, [user, loading, isAdmin, isVolunteer, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
        );
    }

    if (!isAuthorized) {
        return null;
    }

    return <>{children}</>;
}
