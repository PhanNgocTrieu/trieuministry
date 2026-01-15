"use client";

import React, { useState } from 'react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import RoleGuard from "@/components/RoleGuard";

export default function UserDashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white';
    
    const handleLinkClick = () => setIsSidebarOpen(false);

    return (
        <RoleGuard requireRole="user">
            <div className="min-h-screen bg-gray-100 dark:bg-slate-950 flex">
                {/* Mobile Overlay */}
                {isSidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside className={`
                    fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white flex flex-col
                    transform transition-transform duration-300 ease-in-out
                    lg:static lg:translate-x-0 lg:z-0
                    ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
                `}>
                    <div className="p-6 border-b border-gray-800 flex items-center justify-between gap-2">
                         <div className="flex items-center gap-2">
                             <i className="fas fa-user-circle text-xl text-blue-500"></i>
                             <span className="text-xl font-bold">My Dashboard</span>
                         </div>
                         <button 
                            onClick={() => setIsSidebarOpen(false)}
                            className="lg:hidden text-gray-400 hover:text-white"
                         >
                             <i className="fas fa-times text-xl"></i>
                         </button>
                    </div>
                    
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Personal</div>
                        
                        <Link href="/dashboard/goals" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/dashboard/goals')}`}>
                            <i className="fas fa-bullseye w-5 text-center"></i>
                            Goals
                        </Link>



                        <Link href="/dashboard/wallets" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/dashboard/wallets')}`}>
                            <i className="fas fa-briefcase w-5 text-center"></i>
                            Wallets
                        </Link>

                        <Link href="/dashboard/prayers" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/dashboard/prayers')}`}>
                            <i className="fas fa-praying-hands w-5 text-center"></i>
                            My Prayers
                        </Link>

                        <Link href="/dashboard/appeals" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/dashboard/appeals')}`}>
                            <i className="fas fa-hand-holding-heart w-5 text-center"></i>
                            My Appeals
                        </Link>
                    </nav>

                    <div className="p-4 border-t border-gray-800">
                        <button 
                            onClick={() => logout()}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-gray-800 hover:text-red-300 w-full transition-colors"
                        >
                            <i className="fas fa-sign-out-alt w-5 text-center"></i>
                            Logout
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <header className="lg:hidden bg-gray-900 text-white p-4 flex justify-between items-center shadow-md z-30 sticky top-0">
                         <div className="flex items-center gap-2">
                             <i className="fas fa-user-circle text-blue-500"></i>
                             <span className="font-bold">My Dashboard</span>
                         </div>
                         <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 text-gray-300 hover:text-white focus:outline-none"
                         >
                             <i className="fas fa-bars text-xl"></i>
                         </button>
                    </header>

                    <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </RoleGuard>
    );
}
