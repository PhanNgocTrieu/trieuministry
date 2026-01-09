"use client";

import React, { useState } from 'react';
import PersonalPrayerList from '@/components/admin/prayer/PersonalPrayerList';
import IntercessoryList from '@/components/admin/prayer/IntercessoryList';
import ScriptureManager from '@/components/admin/prayer/ScriptureManager';

export default function AdminMyPrayersPage() {
    const [activeTab, setActiveTab] = useState<'personal' | 'intercessory' | 'scripture'>('personal');

    return (
        <div className="max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="mb-8 p-4">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">My Prayers</h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Manage your personal spiritual walk and intercessory commitments.
                </p>
            </div>

            {/* Main Tabs */}
            <div className="flex border-b border-slate-200 dark:border-white/10 mb-8 px-4">
                <button
                    onClick={() => setActiveTab('personal')}
                    className={`px-6 py-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
                        activeTab === 'personal'
                            ? 'border-green-500 text-green-600 dark:text-green-400 bg-green-500/5'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                    <i className="fas fa-user-circle"></i>
                    Personal Prayers
                </button>
                <button
                    onClick={() => setActiveTab('intercessory')}
                    className={`px-6 py-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
                        activeTab === 'intercessory'
                            ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-500/5'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                    <i className="fas fa-users"></i>
                    Intercessory List
                </button>
                <button
                    onClick={() => setActiveTab('scripture')}
                    className={`px-6 py-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
                        activeTab === 'scripture'
                            ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-500/5'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                    <i className="fas fa-book-open"></i>
                    Scripture
                </button>
            </div>

            {/* Content Area */}
            <div className="animate-fade-in">
                {activeTab === 'personal' && <PersonalPrayerList />}
                {activeTab === 'intercessory' && <IntercessoryList />}
                {activeTab === 'scripture' && <ScriptureManager />}
            </div>
        </div>
    );
}
