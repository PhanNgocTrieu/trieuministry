"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard/goals');
    }, [router]);

    return (
        <div className="flex items-center justify-center h-full text-gray-400">
            <i className="fas fa-spinner fa-spin mr-2"></i> Loading Dashboard...
        </div>
    );
}
