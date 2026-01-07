"use client";

import React from 'react';
import { Task } from './types';
import { format } from 'date-fns';

interface TaskItemProps {
    task: Task;
    onToggleComplete: (task: Task) => void;
    onDelete: (id: string) => void;
    onEdit: (task: Task) => void;
    onArchive?: (task: Task) => void; // Optional: specific archive action
    isReadOnly?: boolean; // For reports
}

export default function TaskItem({ 
    task, 
    onToggleComplete, 
    onDelete, 
    onEdit, 
    onArchive,
    isReadOnly = false 
}: TaskItemProps) {
    
    const priorityColors = {
        high: 'bg-red-100 text-red-700 border-red-200',
        medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        low: 'bg-green-100 text-green-700 border-green-200'
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
            group bg-white border rounded-xl p-4 transition-all hover:shadow-md
            ${task.isCompleted ? 'bg-gray-50 border-gray-100' : 'border-gray-200'}
            ${isOverdue ? 'border-l-4 border-l-red-500' : ''}
        `}>
            {/* Header: Priority & Category */}
            <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${priorityColors[task.priority]}`}>
                        {task.priority}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border bg-blue-50 text-blue-600 border-blue-100">
                        {task.category}
                    </span>
                    {task.receiveFrom && (
                         <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border bg-purple-50 text-purple-600 border-purple-100 flex items-center gap-1">
                            <i className="fas fa-user-tag text-[8px]"></i> {task.receiveFrom}
                        </span>
                    )}
                </div>
                
                {!isReadOnly && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => onEdit(task)}
                            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                            title="Edit"
                        >
                            <i className="fas fa-edit text-xs"></i>
                        </button>
                        <button 
                            onDoubleClick={() => onDelete(task.id)} // Double click to delete
                            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                            title="Double click to Delete"
                        >
                            <i className="fas fa-trash text-xs"></i>
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="mb-3">
                <p className={`text-sm font-medium leading-relaxed ${task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {task.content}
                </p>
            </div>

            {/* Footer: Date & Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                    {task.deadline && (
                        <span className={`flex items-center gap-1.5 ${isOverdue || isUrgent ? 'text-red-600 font-bold bg-red-50 px-2 py-1 rounded' : 'bg-gray-50 px-2 py-1 rounded'}`}>
                            <i className={`far ${isOverdue || isUrgent ? 'fa-bell' : 'fa-clock'}`}></i>
                            {formatDate(task.deadline)}
                            {isOverdue && <span className="text-[10px] uppercase ml-1">(Overdue)</span>}
                            {isUrgent && <span className="text-[10px] uppercase ml-1">(Urgent)</span>}
                        </span>
                    )}
                </div>

                {!isReadOnly ? (
                    <div className="flex items-center gap-2">
                         {task.isCompleted && onArchive && (
                             <button
                                onClick={() => onArchive(task)}
                                className="px-3 py-1.5 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors flex items-center gap-1"
                             >
                                 <i className="fas fa-archive"></i> Archive
                             </button>
                         )}
                        <button 
                            onClick={() => onToggleComplete(task)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 border ${
                                task.isCompleted 
                                ? 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200' // State: Completed -> can undo
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200 shadow-sm' // State: Active -> can complete
                            }`}
                        >
                            <i className={`fas ${task.isCompleted ? 'fa-undo' : 'fa-check'}`}></i>
                            {task.isCompleted ? 'Undo' : 'Done'}
                        </button>
                    </div>
                ) : (
                    <span className="text-xs text-gray-400 italic">
                         Archived {task.archivedAt ? formatDate(task.archivedAt) : ''}
                    </span>
                )}
            </div>
        </div>
    );
}
