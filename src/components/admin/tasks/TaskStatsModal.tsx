"use client";

import React, { useState, useMemo } from 'react';
import { Task } from './types';

interface TaskStatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
}

export default function TaskStatsModal({ isOpen, onClose, tasks }: TaskStatsModalProps) {
    const [year, setYear] = useState(new Date().getFullYear().toString());

    // Filter tasks by year
    const yearlyTasks = useMemo(() => {
        return tasks.filter(task => {
            const date = task.createdAt?.toDate ? task.createdAt.toDate() : new Date();
            return date.getFullYear().toString() === year;
        });
    }, [tasks, year]);

    // Calculate Stats
    const stats = useMemo(() => {
        const total = yearlyTasks.length;
        const completed = yearlyTasks.filter(t => t.isCompleted).length;
        const pending = total - completed;

        // Priority Breakdown
        const priorityCounts = yearlyTasks.reduce((acc, t) => {
            acc[t.priority] = (acc[t.priority] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const priorityBreakdown = [
            { name: 'High', count: priorityCounts['high'] || 0, color: '#ef4444' }, // red-500
            { name: 'Medium', count: priorityCounts['medium'] || 0, color: '#f59e0b' }, // amber-500
            { name: 'Low', count: priorityCounts['low'] || 0, color: '#3b82f6' } // blue-500
        ].map(item => ({
             ...item,
             percentage: total > 0 ? (item.count / total * 100) : 0
        })).sort((a, b) => b.count - a.count);

        // Category Breakdown
        const categoryCounts = yearlyTasks.reduce((acc, t) => {
            const cat = t.category || 'Uncategorized';
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const categoryBreakdown = Object.entries(categoryCounts)
            .map(([name, count]) => ({
                name,
                count,
                percentage: total > 0 ? (count / total * 100) : 0
            }))
            .sort((a, b) => b.count - a.count);

        return { total, completed, pending, priorityBreakdown, categoryBreakdown };
    }, [yearlyTasks]);

    if (!isOpen) return null;

    return (
        <>
            <style type="text/css" media="print">
                {`
                  @page { size: auto; margin: 0mm; } 
                  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                `}
            </style>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 print:p-0 print:bg-white print:absolute print:inset-0 print:z-[9999] print:block">
                <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:w-full print:max-w-none print:rounded-none print:h-auto print:overflow-visible">
                    
                    {/* Header */}
                    <div className="p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center shrink-0 print:bg-slate-50 print:dark:bg-slate-800/50">
                        <div className="flex items-center gap-4">
                            <div className="bg-purple-600 p-2 rounded-lg text-white print:bg-purple-600 print:text-white">
                                <i className="fas fa-chart-pie text-xl"></i>
                            </div>
                            <div>
                                <h2 className="font-bold text-lg text-slate-900 dark:text-white print:text-slate-900 print:dark:text-white">
                                    Task Statistics Report
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 print:text-slate-500 print:dark:text-slate-400">
                                    Yearly overview and performance metrics ({year})
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 print:hidden">
                             <select 
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <button 
                                onClick={() => window.print()} 
                                className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 font-bold text-sm transition-colors"
                            >
                                <i className="fas fa-print mr-2"></i> Print
                            </button>
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                <i className="fas fa-times text-xl"></i>
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="p-8 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-[#0B1120] print:overflow-visible print:bg-slate-50/50 print:dark:bg-[#0B1120]">
                    <div className="space-y-8">
                        
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-lg relative overflow-hidden group">
                                <div className="absolute right-0 top-0 p-4 opacity-10">
                                    <i className="fas fa-tasks text-6xl text-blue-500"></i>
                                </div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Tasks</p>
                                <p className="text-4xl font-extrabold text-slate-900 dark:text-white">{stats.total}</p>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-lg relative overflow-hidden group">
                                <div className="absolute right-0 top-0 p-4 opacity-10">
                                    <i className="fas fa-check-circle text-6xl text-green-500"></i>
                                </div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Completed</p>
                                <p className="text-4xl font-extrabold text-slate-900 dark:text-white">{stats.completed}</p>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-lg relative overflow-hidden group">
                                <div className="absolute right-0 top-0 p-4 opacity-10">
                                    <i className="fas fa-clock text-6xl text-yellow-500"></i>
                                </div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pending</p>
                                <p className="text-4xl font-extrabold text-slate-900 dark:text-white">{stats.pending}</p>
                            </div>
                        </div>

                         {/* Details Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            
                            {/* Priority Analysis */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-white/5 overflow-hidden">
                                <div className="p-5 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/20">
                                    <h3 className="font-bold text-slate-900 dark:text-white">Priority Analysis</h3>
                                </div>
                                <div className="p-0">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                            <tr>
                                                <th className="px-6 py-3 text-left">Level</th>
                                                <th className="px-6 py-3 text-right">Count</th>
                                                <th className="px-6 py-3 text-right">%</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                            {stats.priorityBreakdown.map((item) => (
                                                <tr key={item.name}>
                                                    <td className="px-6 py-4 font-medium flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                                        {item.name}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                                                        {item.count}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-slate-500">
                                                        {item.percentage.toFixed(1)}%
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="bg-slate-50 dark:bg-slate-800/50 font-bold border-t border-slate-200 dark:border-white/10">
                                                <td className="px-6 py-3 text-slate-900 dark:text-white">Total</td>
                                                <td className="px-6 py-3 text-right text-slate-900 dark:text-white">{stats.total}</td>
                                                <td className="px-6 py-3 text-right">100%</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Category Analysis */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-white/5 overflow-hidden">
                                <div className="p-5 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/20">
                                    <h3 className="font-bold text-slate-900 dark:text-white">Category Analysis</h3>
                                </div>
                                <div className="p-0">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                            <tr>
                                                <th className="px-6 py-3 text-left">Category</th>
                                                <th className="px-6 py-3 text-right">Count</th>
                                                <th className="px-6 py-3 text-right">%</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                            {stats.categoryBreakdown.map((item) => (
                                                <tr key={item.name}>
                                                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                                                        {item.name}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                                                        {item.count}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-slate-500">
                                                        {item.percentage.toFixed(1)}%
                                                    </td>
                                                </tr>
                                            ))}
                                             <tr className="bg-slate-50 dark:bg-slate-800/50 font-bold border-t border-slate-200 dark:border-white/10">
                                                <td className="px-6 py-3 text-slate-900 dark:text-white">Total</td>
                                                <td className="px-6 py-3 text-right text-slate-900 dark:text-white">{stats.total}</td>
                                                <td className="px-6 py-3 text-right">100%</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>


                        </div>

                        {/* Task History Lists */}
                        <div className="space-y-8">
                            
                            {/* Completed Tasks History */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-white/5 overflow-hidden">
                                <div className="p-5 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/20">
                                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <i className="fas fa-check-circle text-green-500"></i>
                                        Completed Tasks History
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                            <tr>
                                                <th className="px-6 py-3 text-left">Date Completed</th>
                                                <th className="px-6 py-3 text-left">Task Details</th>
                                                <th className="px-6 py-3 text-left">Category</th>
                                                <th className="px-6 py-3 text-center">Priority</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                            {yearlyTasks.filter(t => t.isCompleted).map((task) => (
                                                <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                        {task.completedAt?.toDate 
                                                            ? task.completedAt.toDate().toLocaleDateString('vi-VN') 
                                                            : 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-900 dark:text-white">
                                                        <div className="font-medium whitespace-pre-wrap">{task.content}</div>
                                                        {task.receiveFrom && (
                                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                                                <i className="fas fa-arrow-right-long text-[10px] opacity-70"></i>
                                                                From: <span className="font-semibold">{task.receiveFrom}</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs font-bold">
                                                            {task.category || 'Uncategorized'}
                                                        </span>
                                                    </td>
                                                     <td className="px-6 py-4 text-center">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                                                            ${task.priority === 'high' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : ''}
                                                            ${task.priority === 'medium' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' : ''}
                                                            ${task.priority === 'low' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : ''}
                                                        `}>
                                                            {task.priority}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {yearlyTasks.filter(t => t.isCompleted).length === 0 && (
                                                 <tr>
                                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 italic">
                                                        No completed tasks found for this year.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                             {/* Active Tasks History */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-white/5 overflow-hidden">
                                <div className="p-5 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/20">
                                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <i className="fas fa-clock text-yellow-500"></i>
                                        In Progress Tasks
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                            <tr>
                                                <th className="px-6 py-3 text-left">Deadline</th>
                                                <th className="px-6 py-3 text-left">Task Details</th>
                                                <th className="px-6 py-3 text-left">Category</th>
                                                <th className="px-6 py-3 text-center">Priority</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                            {yearlyTasks.filter(t => !t.isCompleted).map((task) => (
                                                <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                        {task.deadline?.toDate 
                                                            ? (
                                                                <span className={task.deadline.toDate() < new Date() ? 'text-red-500 dark:text-red-400 font-bold' : ''}>
                                                                    {task.deadline.toDate().toLocaleDateString('vi-VN')}
                                                                </span>
                                                            ) 
                                                            : <span className="opacity-50 text-xs">No Deadline</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-900 dark:text-white">
                                                         <div className="font-medium whitespace-pre-wrap">{task.content}</div>
                                                        {task.receiveFrom && (
                                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                                                <i className="fas fa-arrow-right-long text-[10px] opacity-70"></i>
                                                                From: <span className="font-semibold">{task.receiveFrom}</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs font-bold">
                                                            {task.category || 'Uncategorized'}
                                                        </span>
                                                    </td>
                                                     <td className="px-6 py-4 text-center">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                                                            ${task.priority === 'high' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : ''}
                                                            ${task.priority === 'medium' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' : ''}
                                                            ${task.priority === 'low' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : ''}
                                                        `}>
                                                            {task.priority}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                             {yearlyTasks.filter(t => !t.isCompleted).length === 0 && (
                                                 <tr>
                                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 italic">
                                                        No pending tasks found for this year.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}
