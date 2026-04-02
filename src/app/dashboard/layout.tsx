"use client";

import React, { useState } from 'react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import RoleGuard from "@/components/RoleGuard";

export default function UserDashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { logout, user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/') 
        ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30' 
        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-violet-600 dark:hover:text-white';
    
    const handleLinkClick = () => setIsSidebarOpen(false);

    const navItems = [
        { href: '/dashboard/goals', label: 'My Goals', icon: 'fas fa-bullseye' },
        { href: '/dashboard/tasks', label: 'My Tasks', icon: 'fas fa-tasks' },
        { href: '/dashboard/wallets', label: 'My Wallets', icon: 'fas fa-briefcase' },
    ];

    return (
        <RoleGuard requireRole="user">
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">
                {/* Mobile Overlay */}
                {isSidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside className={`
                    fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/5
                    flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out
                    lg:static lg:translate-x-0 lg:z-0
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}>
                    <div className="h-20 flex items-center px-6 border-b border-slate-100 dark:border-white/5 gap-3">
                         <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400 text-lg">
                             <i className="fas fa-user-circle"></i>
                         </div>
                         <div className="flex-1">
                             <h2 className="font-bold text-lg text-slate-900 dark:text-white leading-none">My Dashboard</h2>
                             <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage your account</p>
                         </div>
                         <button 
                            onClick={() => setIsSidebarOpen(false)}
                            className="lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                         >
                             <i className="fas fa-times text-xl"></i>
                         </button>
                    </div>
                    
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                        <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Personal Menu</div>
                        
                        {navItems.map((item) => (
                            <Link 
                                key={item.href}
                                href={item.href} 
                                onClick={handleLinkClick} 
                                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive(item.href)}`}
                            >
                                <div className={`w-8 text-center ${pathname === item.href || pathname.startsWith(item.href + '/') ? '' : 'text-slate-400'}`}>
                                    <i className={item.icon}></i>
                                </div>
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <img 
                                src={user?.photoURL || "https://ui-avatars.com/api/?name=User"} 
                                alt="User" 
                                className="w-10 h-10 rounded-full bg-slate-200 border border-slate-200 dark:border-white/10"
                            />
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.displayName || 'User'}</p>
                                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => logout()}
                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 font-bold w-full transition-colors text-sm"
                        >
                            <i className="fas fa-sign-out-alt w-8 text-center"></i>
                            Sign Out
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <header className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/5 p-4 flex justify-between items-center z-30 sticky top-0">
                         <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
                                 <i className="fas fa-user-circle"></i>
                             </div>
                             <span className="font-bold text-slate-900 dark:text-white">My Dashboard</span>
                         </div>
                         <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 text-slate-500 hover:text-violet-600 focus:outline-none"
                         >
                             <i className="fas fa-bars text-xl"></i>
                         </button>
                    </header>

                    <main className="flex-1 overflow-y-auto p-4 md:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </RoleGuard>
    );
}
