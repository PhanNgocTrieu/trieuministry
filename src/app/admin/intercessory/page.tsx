"use client";

import React from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import IntercessoryList from '@/components/admin/prayer/IntercessoryList';

export default function AdminIntercessoryPage() {
    return (
        <AdminGuard>
            <div className="max-w-6xl mx-auto mb-20 p-4">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Intercessory Prayer List</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage your prayer targets and commitments.</p>
                </div>
                <IntercessoryList />
            </div>
        </AdminGuard>
    );
}
