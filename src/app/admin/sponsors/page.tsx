"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import FinancialSponsors from '@/components/admin/sponsors/FinancialSponsors';
import PrayerSponsors from '@/components/admin/sponsors/PrayerSponsors';

export default function SponsorsPage() {
    const [activeTab, setActiveTab] = useState<'financial' | 'prayer'>('financial');

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Link href="/admin" className="text-slate-500 hover:text-blue-500 dark:text-slate-400 dark:hover:text-blue-400 mb-2 inline-block">
                        <i className="fas fa-arrow-left mr-2"></i> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Sponsors & Partners</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage your financial and prayer support network.</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-white/10 inline-flex gap-1 w-full md:w-auto overflow-x-auto">
                <button
                    onClick={() => setActiveTab('financial')}
                    className={`px-6 py-3 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap flex-1 md:flex-initial justify-center ${
                        activeTab === 'financial'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20'
                        : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                    <i className="fas fa-hand-holding-usd"></i>
                    Financial Sponsors
                </button>
                <button
                    onClick={() => setActiveTab('prayer')}
                    className={`px-6 py-3 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap flex-1 md:flex-initial justify-center ${
                        activeTab === 'prayer'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                        : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                    <i className="fas fa-pray"></i>
                    Prayer Partners
                </button>
            </div>

            {/* Content Area */}
            <div className="animate-fade-in">
                {activeTab === 'financial' ? <FinancialSponsors /> : <PrayerSponsors />}
            </div>
        </div>
    );
}
