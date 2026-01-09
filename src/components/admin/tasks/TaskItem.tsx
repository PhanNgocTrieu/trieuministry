"use client";

import React from 'react';
import { Task } from './types';
import { format } from 'date-fns';

interface TaskItemProps {
    task: Task;
    onToggleComplete: (task: Task) => void;
    onDelete: (id: string) => void;
    onEdit: (task: Task) => void;
    isReadOnly?: boolean; // For reports
}

export default function TaskItem({ 
    task, 
    onToggleComplete, 
    onDelete, 
    onEdit, 
    isReadOnly = false 
}: TaskItemProps) {
    
    const priorityColors = {
        high: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30',
        medium: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30',
        low: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30'
    };

    const now = Date.now();
    const deadlineMillis = task.deadline?.toMillis() || 0;
    const isOverdue = !task.isCompleted && task.deadline && deadlineMillis < now;
    const isUrgent = !task.isCompleted && task.deadline && !isOverdue && (deadlineMillis - now < 7 * 24 * 60 * 60 * 1000); // 7 days

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        return format(timestamp.toDate(), 'MMM d, yyyy HH:mm');
    };

    return (
        <div className={`
            group bg-white dark:bg-slate-900 border rounded-xl p-4 transition-all hover:shadow-md
            ${task.isCompleted ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/5' : 'border-slate-200 dark:border-white/10 hover:border-blue-500/30 dark:hover:border-blue-500/30'}
            ${isOverdue ? 'border-l-4 border-l-red-500' : ''}
        `}>
            {/* Header: Priority & Category */}
            <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${priorityColors[task.priority]}`}>
                        {task.priority}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20">
                        {task.category}
                    </span>
                    {task.receiveFrom && (
                         <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-500/20 flex items-center gap-1">
                            <i className="fas fa-user-tag text-[8px]"></i> {task.receiveFrom}
                        </span>
                    )}
                </div>
                
                {!isReadOnly && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => onEdit(task)}
                            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded transition-all"
                            title="Edit"
                        >
                            <i className="fas fa-edit text-xs"></i>
                        </button>
                        <button 
                            onDoubleClick={() => onDelete(task.id)} // Double click to delete
                            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-all"
                            title="Double click to Delete"
                        >
                            <i className="fas fa-trash text-xs"></i>
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="mb-3">
                <p className={`text-sm font-medium leading-relaxed ${task.isCompleted ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                    {task.content}
                </p>
            </div>

            {/* Footer: Date & Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5 mt-2">
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    {task.deadline && (
                        <span className={`flex items-center gap-1.5 ${isOverdue || isUrgent ? 'text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded' : 'bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded'}`}>
                            <i className={`far ${isOverdue || isUrgent ? 'fa-bell' : 'fa-clock'}`}></i>
                            {formatDate(task.deadline)}
                            {isOverdue && <span className="text-[10px] uppercase ml-1">(Overdue)</span>}
                            {isUrgent && <span className="text-[10px] uppercase ml-1">(Urgent)</span>}
                        </span>
                    )}
                </div>

                {!isReadOnly ? (
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => onToggleComplete(task)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 border ${
                                task.isCompleted 
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:bg-green-50 dark:hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400 hover:border-green-200 dark:hover:border-green-500/20' // State: Completed -> can undo
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-green-50 dark:hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400 hover:border-green-200 dark:hover:border-green-500/20 shadow-sm' // State: Active -> can complete
                            }`}
                        >
                            <i className={`fas ${task.isCompleted ? 'fa-undo' : 'fa-check'}`}></i>
                            {task.isCompleted ? 'Undo' : 'Done'}
                        </button>
                    </div>
                ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                         {task.completedAt ? `Completed ${formatDate(task.completedAt)}` : ''}
                    </span>
                )}
            </div>
        </div>
    );
}
