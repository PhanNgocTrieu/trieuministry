"use client";

import React, { useState } from 'react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import RoleGuard from "@/components/RoleGuard";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const mainContentRef = React.useRef<HTMLElement>(null);

    React.useEffect(() => {
        // Immediate scroll attempt
        if (mainContentRef.current) {
            mainContentRef.current.scrollTop = 0;
        }

        // Delayed scroll to handle async rendering/transitions
        const timeoutId = setTimeout(() => {
            if (mainContentRef.current) {
                mainContentRef.current.scrollTo({ top: 0, behavior: 'instant' });
            }
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [pathname]);

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/') ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-purple-600 dark:hover:text-white';
    
    const handleLinkClick = () => {
        setIsSidebarOpen(false);
        if (mainContentRef.current) {
            mainContentRef.current.scrollTop = 0;
        }
    };

    return (
        <RoleGuard requireRole="admin">
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
                {/* Mobile Overlay */}
                {isSidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside className={`
                    fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/5 text-slate-600 dark:text-white flex flex-col
                    transform transition-transform duration-300 ease-in-out
                    lg:static lg:translate-x-0 lg:z-0
                    ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
                `}>
                    <div className="p-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between gap-2">
                         <div className="flex items-center gap-2">
                             <i className="fas fa-user-shield text-xl text-purple-600 dark:text-purple-500"></i>
                             <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">Admin Panel</span>
                         </div>
                         <button 
                            onClick={() => setIsSidebarOpen(false)}
                            className="lg:hidden text-slate-400 hover:text-white"
                         >
                             <i className="fas fa-times text-xl"></i>
                         </button>
                    </div>
                    
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                        
                        <Link href="/admin" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${pathname === '/admin' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-purple-600 dark:hover:text-white'}`}>
                            <i className="fas fa-th-large w-5 text-center"></i>
                            Dashboard
                        </Link>

                        <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mt-2">My Personal</div>

                        <Link href="/admin/discipline" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/discipline')}`}>
                            <i className="fas fa-clipboard-check w-5 text-center"></i>
                            Discipline
                        </Link>

                        <Link href="/admin/goals" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/goals')}`}>
                            <i className="fas fa-bullseye w-5 text-center"></i>
                            Goals
                        </Link>

                        <Link href="/admin/tasks" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/tasks')}`}>
                            <i className="fas fa-tasks w-5 text-center"></i>
                            Tasks
                        </Link>

                        <Link href="/admin/my-expenses" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/my-expenses')}`}>
                            <i className="fas fa-wallet w-5 text-center"></i>
                            My Expenses
                        </Link>

                        <Link href="/admin/my-prayers" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/my-prayers')}`}>
                            <i className="fas fa-praying-hands w-5 text-center"></i>
                            My Prayers
                        </Link>

                        <Link href="/admin/my-appeals" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/my-appeals')}`}>
                            <i className="fas fa-hand-holding-heart w-5 text-center"></i>
                            My Appeals
                        </Link>

                        <div className="px-4 py-2 mt-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ministry Management</div>

                        <Link href="/admin/users" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/users')}`}>
                            <i className="fas fa-users w-5 text-center"></i>
                            Users
                        </Link>

                        {/* Financials moved to My Expenses */}

                        <Link href="/admin/prayers" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/prayers')}`}>
                            <i className="fas fa-hands-holding-heart w-5 text-center"></i>
                            Community Prayers
                        </Link>
                        
                        <Link href="/admin/expenses" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/expenses')}`}>
                            <i className="fas fa-file-invoice-dollar w-5 text-center"></i>
                            Expenses Manage
                        </Link>

                        <Link href="/admin/blogs" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/blogs')}`}>
                            <i className="fas fa-blog w-5 text-center"></i>
                            Blogs
                        </Link>

                        <Link href="/admin/sponsors" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/sponsors')}`}>
                            <i className="fas fa-hand-holding-usd w-5 text-center"></i>
                            Sponsors
                        </Link>

                        <Link href="/admin/ministries" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/ministries')}`}>
                            <i className="fas fa-church w-5 text-center"></i>
                            Ministry Boards
                        </Link>

                        <Link href="/admin/appeals" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/appeals')}`}>
                            <i className="fas fa-envelope-open-text w-5 text-center"></i>
                            Pastoral Letters
                        </Link>

                        <Link href="/admin/user-appeals" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/user-appeals')}`}>
                            <i className="fas fa-hand-holding-heart w-5 text-center"></i>
                            Ministry Appeals
                        </Link>

                        <Link href="/admin/settings" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/settings')}`}>
                            <i className="fas fa-cog w-5 text-center"></i>
                            Settings
                        </Link>

                    </nav>

                    <div className="p-4 border-t border-slate-200 dark:border-white/5">
                        <button 
                            onClick={() => logout()}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 w-full transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-500/20"
                        >
                            <i className="fas fa-sign-out-alt w-5 text-center"></i>
                            Logout
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
                    <header className="lg:hidden bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4 flex justify-between items-center shadow-md z-30 sticky top-0 border-b border-slate-200 dark:border-white/5">
                         <div className="flex items-center gap-2">
                             <i className="fas fa-user-shield text-purple-600 dark:text-purple-500"></i>
                             <span className="font-bold">Admin Panel</span>
                         </div>
                         <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-white focus:outline-none"
                         >
                             <i className="fas fa-bars text-xl"></i>
                         </button>
                    </header>

                    <main id="admin-main-content" ref={mainContentRef} className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
                        {children}
                    </main>
                </div>
            </div>
        </RoleGuard>
    );
}
