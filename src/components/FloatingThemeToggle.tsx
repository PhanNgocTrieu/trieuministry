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
            className="icon-3d fixed bottom-6 right-6 z-[100] w-14 h-14 bg-white dark:bg-slate-800 text-slate-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700"
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
