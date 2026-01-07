"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Task, TaskReportDoc } from './types';
import TaskItem from './TaskItem';
import { format } from 'date-fns';

export default function TaskReport() {
    const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchArchivedTasks();
    }, [month]);

    const fetchArchivedTasks = async () => {
        setLoading(true);
        try {
            // New Logic: Fetch single aggregated document for the month
            const docRef = doc(db, 'task_reports', month);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data() as TaskReportDoc;
                // Sort tasks by completedAt or createdAt desc
                const sortedTasks = (data.tasks || []).sort((a, b) => {
                     // Handle nullable timestamps safely
                     const timeA = a.completedAt?.seconds || a.createdAt?.seconds || 0;
                     const timeB = b.completedAt?.seconds || b.createdAt?.seconds || 0;
                     return timeB - timeA;
                });
                setTasks(sortedTasks);
            } else {
                setTasks([]);
            }
        } catch (error) {
            console.error("Error fetching archives:", error);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Controls */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                         <i className="fas fa-archive text-xl"></i>
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-800">Archived Tasks Report</h2>
                        <p className="text-xs text-gray-500">View finished tasks by month to release active memory.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-bold text-gray-600">Select Month:</label>
                    <input 
                        type="month" 
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-12">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
            ) : tasks.length > 0 ? (
                <div className="grid gap-3">
                    {tasks.map(task => (
                        <TaskItem 
                            key={task.id} 
                            task={task} 
                            isReadOnly={true}
                            onToggleComplete={() => {}} 
                            onDelete={() => {}} 
                            onEdit={() => {}} 
                        />
                    ))}
                    <div className="text-center text-xs text-gray-400 mt-4">
                        Total {tasks.length} tasks archived in {format(new Date(month), 'MMMM yyyy')}
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <i className="fas fa-box-open text-4xl text-gray-300 mb-3"></i>
                    <p className="text-gray-500 font-medium">No archived tasks found for {month}</p>
                </div>
            )}
        </div>
    );
}
