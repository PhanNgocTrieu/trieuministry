"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { Task } from './types';
import TaskItem from './TaskItem';
import { format } from 'date-fns';

export default function TaskReport() {
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, 'tasks'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedTasks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Task));
            setTasks(fetchedTasks);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching tasks for report:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Filter tasks by selected year
    const yearlyTasks = React.useMemo(() => {
        return tasks.filter(task => {
            const date = task.createdAt?.toDate ? task.createdAt.toDate() : new Date();
            return date.getFullYear().toString() === year;
        });
    }, [tasks, year]);

    // Calculate Stats
    const stats = React.useMemo(() => {
        const total = yearlyTasks.length;
        const completed = yearlyTasks.filter(t => t.isCompleted).length;
        const pending = total - completed;
        return { total, completed, pending };
    }, [yearlyTasks]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Controls */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-100 dark:bg-blue-600/20 p-2 rounded-lg text-blue-700 dark:text-blue-500">
                         <i className="fas fa-chart-pie text-xl"></i>
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-900 dark:text-white">Task Reports</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Overview of tasks and performance by year.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Select Year:</label>
                    <select 
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 rounded-lg text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600"
                    >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                            <h4 className="text-blue-600 dark:text-blue-400 font-bold uppercase text-xs tracking-wider mb-2">Total Tasks</h4>
                            <p className="text-4xl font-extrabold text-slate-900 dark:text-white">{stats.total}</p>
                        </div>
                        <div className="p-6 bg-green-50 dark:bg-green-500/10 rounded-2xl border border-green-100 dark:border-green-500/20">
                            <h4 className="text-green-600 dark:text-green-400 font-bold uppercase text-xs tracking-wider mb-2">Completed</h4>
                            <p className="text-4xl font-extrabold text-slate-900 dark:text-white">{stats.completed}</p>
                        </div>
                        <div className="p-6 bg-yellow-50 dark:bg-yellow-500/10 rounded-2xl border border-yellow-100 dark:border-yellow-500/20">
                            <h4 className="text-yellow-600 dark:text-yellow-400 font-bold uppercase text-xs tracking-wider mb-2">Pending</h4>
                            <p className="text-4xl font-extrabold text-slate-900 dark:text-white">{stats.pending}</p>
                        </div>
                    </div>

                    {/* List */}
                    {yearlyTasks.length > 0 ? (
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 pb-2">
                                Task History - {year}
                            </h3>
                            <div className="grid gap-3">
                                {yearlyTasks.map(task => (
                                    <TaskItem 
                                        key={task.id} 
                                        task={task} 
                                        isReadOnly={true}
                                        onToggleComplete={() => {}} 
                                        onDelete={() => {}} 
                                        onEdit={() => {}} 
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                            <i className="fas fa-clipboard-list text-4xl text-slate-300 dark:text-slate-700 mb-3"></i>
                            <p className="text-slate-500 font-medium">No tasks found for {year}</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
