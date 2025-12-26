"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
        const { user, loading, isVerified } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (loading) return;

        // Paths that don't satisfy the check
        if (!user) {
             // If user is not logged in, we don't block anything at global level (pages like login/register are public)
             // But if they are on /verify-email and not logged in, they should go to login
             if (pathname === '/verify-email') {
                 router.push('/login');
             }
             return;
        }

        // User is logged in
        if (!isVerified) {
            // If they are NOT verified, they MUST be on /verify-email
            if (pathname !== '/verify-email') {
                router.push('/verify-email');
            }
        } else {
            // If they ARE verified, they should NOT be on /verify-email
            if (pathname === '/verify-email') {
                router.push('/');
            }
        }

    }, [user, loading, pathname, router]);


    if (loading) {
         return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // While checking redirect, we might want to return null/spinner to prevent flash of content
    // But since we have public pages, we can't just block everything.
    // The issue is: if unverified user visits "/", we want to redirect BEFORE showing content.
    // So if user && !emailVerified && path != verify, show nothing/spinner.
    if (user && !isVerified && pathname !== '/verify-email') {
        return null;
    }

    return <>{children}</>;
}
