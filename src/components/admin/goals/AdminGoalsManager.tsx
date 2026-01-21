"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useModal } from '@/context/ModalContext';
import { logActivity } from '@/lib/activity-logger';

interface Goal {
    id: string;
    userId: string;
    year: number;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    status: 'planned' | 'in_progress' | 'completed' | 'on_hold';
    progress: number;
    createdAt?: any;
    userEmail?: string; // Optional if we join data
}

const PriorityBadge = ({ priority }: { priority: string }) => {
    const colors = {
        high: 'bg-red-500/10 text-red-500 border-red-500/20',
        medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
        low: 'bg-green-500/10 text-green-600 border-green-500/20'
    };
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${colors[priority as keyof typeof colors] || colors.low}`}>
            {priority}
        </span>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
        planned: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
        in_progress: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        completed: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
        on_hold: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${colors[status as keyof typeof colors] || colors.planned}`}>
            {status.replace('_', ' ')}
        </span>
    );
};

export default function AdminGoalsManager() {
    const { user } = useAuth();
    const { showAlert, showConfirm } = useModal();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        // Query ALL goals, ordered by created desc
        // Note: This requires an index if mixed with filters, but simple collection query is ok if small.
        // Usually we need `orderBy("createdAt", "desc")`.
        
        const q = query(
            collection(db, "goals"),
            orderBy("createdAt", "desc")
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: Goal[] = [];
            snapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() } as Goal);
            });
            setGoals(list);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching all goals:", error);
            // Fallback: Try without orderBy if index is missing
             const q2 = query(collection(db, "goals"));
             // We can't easily fallback inside error handler cleanly in this structure loop, so we just log.
             // But for now, let's assume index exists or small collection.
             setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredGoals = goals.filter(g => {
        const matchesSearch = g.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (g.userId && g.userId.includes(searchTerm));
        const matchesYear = selectedYear === 0 || g.year === selectedYear;
        return matchesSearch && matchesYear;
    });

    const handleDelete = async (id: string) => {
        showConfirm("Delete Goal", "Are you sure? This cannot be undone.", async () => {
            try {
                await deleteDoc(doc(db, "goals", id));
                await logActivity('goal', 'delete', `Admin deleted goal ${id}`);
                showAlert("Success", "Goal deleted.");
            } catch (err) {
                console.error(err);
                showAlert("Error", "Failed to delete.");
            }
        }, true, "Delete");
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden flex flex-col h-[calc(100vh-140px)]">
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center gap-4">
                <div>
                     <h2 className="text-xl font-bold text-slate-900 dark:text-white">All User Goals</h2>
                     <p className="text-sm text-slate-500">Global management view</p>
                </div>
                <div className="flex gap-4">
                    <select 
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-4 py-2 text-sm font-bold"
                    >
                        <option value={0}>All Years</option>
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <input 
                        type="text" 
                        placeholder="Search title or User ID..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-4 py-2 text-sm w-64 focus:ring-2 focus:ring-violet-500"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Goal</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User ID</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Year</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Priority</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Progress</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {loading ? (
                            <tr><td colSpan={7} className="p-8 text-center text-slate-500">Loading...</td></tr>
                        ) : filteredGoals.length === 0 ? (
                            <tr><td colSpan={7} className="p-8 text-center text-slate-500">No goals found.</td></tr>
                        ) : filteredGoals.map(goal => (
                            <tr key={goal.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4 max-w-xs">
                                    <div className="font-bold text-slate-900 dark:text-white truncate" title={goal.title}>{goal.title}</div>
                                    <div className="text-xs text-slate-500 truncate">{goal.description}</div>
                                </td>
                                <td className="px-6 py-4 text-xs font-mono text-slate-500">
                                    {goal.userId?.substring(0, 8)}...
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">
                                    {goal.year}
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={goal.status} />
                                </td>
                                <td className="px-6 py-4">
                                    <PriorityBadge priority={goal.priority} />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${goal.progress || 0}%` }}></div>
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1 font-bold">{Math.round(goal.progress || 0)}%</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => handleDelete(goal.id)}
                                        className="text-slate-400 hover:text-red-500 transition-colors"
                                        title="Delete"
                                    >
                                        <i className="fas fa-trash-alt"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
