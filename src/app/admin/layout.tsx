"use client";

import React, { useState } from 'react';

import AdminGuard from "@/components/admin/AdminGuard";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { logout, isVolunteer, isAdmin } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const isActive = (path: string) => pathname === path ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white';
    
    // Close sidebar when route changes (optional, but good for mobile)
    // or just add onClick to links
    const handleLinkClick = () => setIsSidebarOpen(false);

    return (
        <AdminGuard>
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
                             <i className="fas fa-church text-xl text-blue-500"></i>
                             <span className="text-xl font-bold">Ministry Admin</span>
                         </div>
                         {/* Close button for mobile */}
                         <button 
                            onClick={() => setIsSidebarOpen(false)}
                            className="lg:hidden text-gray-400 hover:text-white"
                         >
                             <i className="fas fa-times text-xl"></i>
                         </button>
                    </div>
                    
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        <Link href="/admin" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin')}`}>
                            <i className="fas fa-tachometer-alt w-5 text-center"></i>
                            Dashboard
                        </Link>

                        <Link href="/admin/goals" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/goals')}`}>
                            <i className="fas fa-bullseye w-5 text-center"></i>
                            Goals
                        </Link>

                        <Link href="/admin/expenses" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/expenses') 
                            || isActive('/admin/expenses/add') 
                            || isActive('/admin/expenses/categories')}`}>
                            <i className="fas fa-wallet w-5 text-center"></i>
                            Expenses
                        </Link>
                        
                        {(isAdmin) && (
                            <Link href="/admin/users" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/users')}`}>
                                <i className="fas fa-users w-5 text-center"></i>
                                Users
                            </Link>
                        )}

                         <Link href="/admin/prayers" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/prayers')}`}>
                            <i className="fas fa-praying-hands w-5 text-center"></i>
                            {(isAdmin || isVolunteer) ? 'Prayers' : 'My Prayers'}
                        </Link>
                        
                        {(isAdmin) && (
                            <>
                                <Link href="/admin/appeals" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/appeals')}`}>
                                    <i className="fas fa-envelope-open-text w-5 text-center"></i>
                                    Ministry Letters
                                </Link>
                                <Link href="/admin/donation-requests" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/donation-requests')}`}>
                                    <i className="fas fa-hand-holding-heart w-5 text-center"></i>
                                    Ministry Appeals
                                </Link>
                            </>
                        )}
                        <Link href="/admin/blogs" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/blogs')}`}>
                            <i className="fas fa-blog w-5 text-center"></i>
                            {(isAdmin || isVolunteer) ? 'Blogs' : 'My Blogs'}
                        </Link>
                        <Link href="/admin/ministries" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/ministries')}`}>
                            <i className="fas fa-hand-holding-heart w-5 text-center"></i>
                            {(isAdmin || isVolunteer) ? 'Ministry' : 'My Ministry'}
                        </Link>

                        {(isAdmin) && (
                            <Link href="/admin/settings" onClick={handleLinkClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/settings')}`}>
                                <i className="fas fa-cogs w-5 text-center"></i>
                                Settings
                            </Link>
                        )}
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
                    {/* Top Mobile Header */}
                    <header className="lg:hidden bg-gray-900 text-white p-4 flex justify-between items-center shadow-md z-30 sticky top-0">
                         <div className="flex items-center gap-2">
                             <i className="fas fa-church text-blue-500"></i>
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
        </AdminGuard>
    );
}
