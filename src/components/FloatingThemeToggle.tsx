"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function FloatingThemeToggle() {
    const pathname = usePathname();
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();

    // Only show if the user is anonymous AND on routes where Navbar is hidden (/lib, /room)
    if (user || !(pathname?.startsWith('/lib') || pathname?.startsWith('/room'))) {
        return null;
    }

    return (
        <button
            onClick={toggleTheme}
            className="fixed bottom-6 right-6 z-[100] w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-110 transition-all duration-300"
            aria-label="Toggle Theme"
        >
            {theme === 'dark' ? (
                <i className="fas fa-sun text-xl"></i>
            ) : (
                <i className="fas fa-moon text-xl"></i>
            )}
        </button>
    );
}
