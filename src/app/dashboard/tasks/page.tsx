"use client";

import React from 'react';

export default function UserTasksPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Tasks</h1>
                <p className="text-slate-500 dark:text-slate-400">Manage your assigned and personal tasks.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-white/5 p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <i className="fas fa-check-double text-2xl"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No tasks available</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                    You don't have any tasks at the moment. Tasks assigned to you or created by you will appear here.
                </p>
                {/* Future implementation: Add Task Button */}
                <button className="mt-6 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    Create Personal Task
                </button>
            </div>
        </div>
    );
}
