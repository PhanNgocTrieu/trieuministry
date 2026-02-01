"use client";

import React, { useState } from 'react';
import IntercessoryList from '@/components/admin/prayer/IntercessoryList';
import ScriptureManager from '@/components/admin/prayer/ScriptureManager';

export default function UserPrayersPage() {
    const [activeTab, setActiveTab] = useState<'intercessory' | 'scripture'>('intercessory');

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">My Prayers</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Manage your personal spiritual walk, ministry focused prayers, and intercessory commitments.
                </p>
            </div>

            {/* Main Tabs */}
            <div className="flex border-b border-gray-200 dark:border-white/10 overflow-x-auto">

                <button
                    onClick={() => setActiveTab('intercessory')}
                    className={`px-6 py-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                        activeTab === 'intercessory'
                            ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-500/5'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                >
                    <i className="fas fa-users"></i>
                    Intercessory List
                </button>
                <button
                    onClick={() => setActiveTab('scripture')}
                    className={`px-6 py-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                        activeTab === 'scripture'
                            ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-500/5'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                >
                    <i className="fas fa-book-open"></i>
                    Scripture
                </button>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">

                {activeTab === 'intercessory' && <IntercessoryList />}
                {activeTab === 'scripture' && <ScriptureManager />}
            </div>
        </div>
    );
}
