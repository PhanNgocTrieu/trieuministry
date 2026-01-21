"use client";

import React, { useState, useEffect } from "react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; 
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import RoleGuard from "@/components/RoleGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile toggle only
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  const switchLanguage = (lang: 'en' | 'vi') => {
      setLanguage(lang);
  };

  const isActive = (path: string) => {
    if (path === '/admin') {
      return pathname === '/admin' 
        ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30' 
        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-violet-600 dark:hover:text-white';
    }
    return pathname.startsWith(path)
        ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30' 
        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-violet-600 dark:hover:text-white';
  };

  const navSections = [
    {
        title: "Personal",
        items: [
             { href: '/admin', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
             { href: '/admin/ministry-updates', label: 'Ministry Updates', icon: 'fas fa-envelope-open-text' },
             { href: '/admin/sponsors', label: 'Sponsors', icon: 'fas fa-hand-holding-heart' },
             { href: '/admin/goals', label: 'Goals', icon: 'fas fa-bullseye' },
             { href: '/admin/discipline', label: 'Discipline', icon: 'fas fa-dumbbell' },
             { href: '/admin/tasks', label: 'Tasks', icon: 'fas fa-tasks' },
             { href: '/admin/my-prayers', label: 'My Prayers', icon: 'fas fa-pray' },
        ]
    },
    {
        title: "Management",
        items: [
             { href: '/admin/users', label: 'Users', icon: 'fas fa-users' },
             { href: '/admin/ministries', label: 'Ministries', icon: 'fas fa-church' },
             { href: '/admin/resources', label: 'Resources', icon: 'fas fa-layer-group' },
             { href: '/admin/wallets', label: 'Wallets', icon: 'fas fa-wallet' },
             { href: '/admin/settings', label: 'Settings', icon: 'fas fa-cogs' },
        ]
    }
  ];

  return (
    <RoleGuard requireRole="admin">
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">
            
            {/* MOBILE OVERLAY */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            <aside 
                className={`fixed top-0 left-0 z-50 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/5 shadow-2xl transition-all duration-300 ease-in-out w-72 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                }`}
            >
                <div className="flex flex-col h-full">
                    {/* Brand */}
                    <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100 dark:border-white/5">
                        <Link href="/" className="flex items-center gap-4 group-hover/brand overflow-hidden">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-violet-500/20">
                                <i className="fas fa-church"></i>
                            </div>
                            <span className="font-bold text-xl text-slate-900 dark:text-white whitespace-nowrap">
                                TrieuMinistry
                            </span>
                        </Link>
                        
                        {/* Close Button (Mobile Only) */}
                        <button 
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-2 text-slate-400 hover:text-rose-500"
                        >
                            <i className="fas fa-times text-xl"></i>
                        </button>
                    </div>

                    {/* Navigation */}
                    <div className="flex-1 overflow-y-auto py-6 px-3 space-y-4 custom-scrollbar">
                        {navSections.map((section, idx) => (
                            <div key={idx}>
                                {section.title !== 'Overview' && (
                                    <div className="px-3 mb-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                                        {section.title}
                                    </div>
                                )}
                                {section.title !== 'Overview' && idx > 0 && (
                                     <div className="mx-2 my-2 h-px bg-slate-100 dark:bg-white/5"></div>
                                )}

                                <div className="space-y-1">
                                    {section.items.map((item) => (
                                        <Link 
                                            key={item.href}
                                            href={item.href}
                                            className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group/link relative overflow-hidden ${isActive(item.href)}`}
                                        >
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 transition-all ${
                                                 (pathname === item.href || pathname.startsWith(item.href + '/'))
                                                    ? 'bg-violet-600 text-white' 
                                                    : 'bg-slate-100 dark:bg-slate-800 group-hover/link:bg-white group-hover/link:text-violet-600'
                                            }`}>
                                                <i className={`${item.icon} w-6 text-center`}></i>
                                            </div>
                                            <span className="font-medium whitespace-nowrap">
                                                {item.label}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                     {/* Preferences & User Footer */}
                     <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-white/5">
                        
                        {/* Controls */}
                        <div className="px-6 py-3 flex items-center justify-between border-b border-slate-100 dark:border-white/5">
                             <button
                                onClick={toggleTheme}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-amber-400 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                                title="Toggle Theme"
                             >
                                {theme === 'dark' ? <i className="fas fa-sun text-xs"></i> : <i className="fas fa-moon text-xs"></i>}
                             </button>

                             <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-white/10">
                                <button 
                                  onClick={() => switchLanguage('vi')} 
                                  className={`px-2 py-1 text-[10px] rounded font-bold transition-all ${language === 'vi' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                  VI
                                </button>
                                <button 
                                  onClick={() => switchLanguage('en')} 
                                  className={`px-2 py-1 text-[10px] rounded font-bold transition-all ${language === 'en' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                  EN
                                </button>
                             </div>
                        </div>

                        {/* User */}
                        <div className="p-4">
                            <div className="flex items-center gap-3">
                                <img 
                                    src={user?.photoURL || "https://ui-avatars.com/api/?name=Admin+User"} 
                                    alt="Admin" 
                                    className="w-10 h-10 rounded-xl bg-slate-200 border border-slate-200 dark:border-white/10 shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.displayName || 'Admin'}</p>
                                    <button onClick={logout} className="text-xs text-rose-500 hover:text-rose-600 font-bold uppercase tracking-wider flex items-center gap-1">
                                        <i className="fas fa-sign-out-alt"></i> Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 lg:ml-72">
                {/* Header for Mobile */}
                <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-4 lg:hidden sticky top-0 z-30 shadow-sm">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-500 hover:text-violet-600">
                        <i className="fas fa-bars text-xl"></i>
                    </button>
                    <span className="font-bold text-slate-900 dark:text-white">Admin Panel</span>
                    <button onClick={toggleTheme} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-amber-400">
                         {theme === 'dark' ? <i className="fas fa-sun"></i> : <i className="fas fa-moon"></i>}
                    </button>
                </header>

                <main className="p-4 md:p-8 lg:p-10 max-w-[1920px] mx-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    </RoleGuard>
  );
}
