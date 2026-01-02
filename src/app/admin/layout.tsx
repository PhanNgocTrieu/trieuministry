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

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white';
    
    const handleLinkClick = () => setIsSidebarOpen(false);

    return (
        <RoleGuard requireRole="admin">
            <div className="min-h-screen bg-gray-100 flex">
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
                             <i className="fas fa-user-shield text-xl text-blue-500"></i>
                             <span className="text-xl font-bold">Admin Panel</span>
                         </div>
                         <button 
                            onClick={() => setIsSidebarOpen(false)}
                            className="lg:hidden text-gray-400 hover:text-white"
                         >
                             <i className="fas fa-times text-xl"></i>
                         </button>
                    </div>
                    
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        
                        <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">My Personal</div>

                        <Link href="/admin/goals" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/goals')}`}>
                            <i className="fas fa-bullseye w-5 text-center"></i>
                            Goals
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

                        <div className="px-4 py-2 mt-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Ministry Management</div>

                        <Link href="/admin/users" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/users')}`}>
                            <i className="fas fa-users w-5 text-center"></i>
                            Users
                        </Link>

                        {/* Financials moved to My Expenses */}

                        <Link href="/admin/prayers" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/prayers')}`}>
                            <i className="fas fa-hands-holding-heart w-5 text-center"></i>
                            Community Prayers
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
                             <i className="fas fa-user-shield text-blue-500"></i>
                             <span className="font-bold">Admin Panel</span>
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
