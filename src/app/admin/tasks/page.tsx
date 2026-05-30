"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import AdminGuard from '@/components/admin/AdminGuard';
import TaskItem from '@/components/admin/tasks/TaskItem';
import { TaskFormModal } from '@/components/admin/tasks/TaskFormModal';
import TaskStatsModal from '@/components/admin/tasks/TaskStatsModal';
import { Task, TaskFormData } from '@/components/admin/tasks/types';
import { useModal } from '@/context/ModalContext';
import { logActivity } from '@/lib/activity-logger';

export default function AdminTasksPage() {
    const { user } = useAuth();
    const { showAlert, showConfirm } = useModal();
    
    const [sortBy, setSortBy] = useState<'default' | 'deadline' | 'priority' | 'newest'>('default');

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

    // --- Active Tasks Fetching ---
    useEffect(() => {
        if (!user) return;

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
            console.error("Error fetching tasks:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Derived State: Sorted Tasks
    const sortedTasks = React.useMemo(() => {
        const sorted = [...tasks];
        // Only sort pending tasks primarily. Completed tasks can be sorted by completedAt or just same logic.
        sorted.sort((a, b) => {
            if (sortBy === 'default') {
                // 1. Incomplete first
                if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
                // 2. High priority first
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                }
                // 3. Earliest deadline first
                if (a.deadline && b.deadline) {
                    return a.deadline.toMillis() - b.deadline.toMillis();
                }
                return 0;
            } else if (sortBy === 'deadline') {
                // Earliest first, nulls last
                if (!a.deadline) return 1;
                if (!b.deadline) return -1;
                return a.deadline.toMillis() - b.deadline.toMillis();
            } else if (sortBy === 'priority') {
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            } else if (sortBy === 'newest') {
                const timeA = a.createdAt?.toMillis() || 0;
                const timeB = b.createdAt?.toMillis() || 0;
                return timeB - timeA;
            }
            return 0;
        });
        return sorted;
    }, [tasks, sortBy]);

    const pendingTasks = sortedTasks.filter(t => !t.isCompleted);
    const completedTasks = sortedTasks.filter(t => t.isCompleted);

    // --- Actions ---

    const handleCreateTask = async (data: TaskFormData) => {
        try {
            await addDoc(collection(db, 'tasks'), {
                ...data,
                isCompleted: false,
                createdAt: serverTimestamp(),
                authorId: user?.uid
            });
            showAlert('Success', 'Task created successfully');
        } catch (err) {
            console.error(err);
            showAlert('Error', 'Failed to create task');
        }
    };

    const handleUpdateTask = async (data: TaskFormData) => {
        if (!editingTask) return;
        try {
            const docRef = doc(db, 'tasks', editingTask.id);
            await updateDoc(docRef, {
                ...data,
                // keep other fields
            });
            showAlert('Success', 'Task updated');
        } catch (err) {
            console.error(err);
            showAlert('Error', 'Failed to update task');
        }
    };

    const handleToggleComplete = async (task: Task) => {
        try {
            const docRef = doc(db, 'tasks', task.id);
            await updateDoc(docRef, {
                isCompleted: !task.isCompleted,
                completedAt: !task.isCompleted ? serverTimestamp() : null
            });
            await logActivity('task', 'update', `Task "${task.content.substring(0, 20)}..." marked as ${!task.isCompleted ? 'completed' : 'incomplete'}`);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: string) => {
        showConfirm('Delete Task', 'Are you sure you want to permanently delete this task?', async () => {
            try {
                await deleteDoc(doc(db, 'tasks', id));
                await logActivity('task', 'delete', 'Deleted a task');
                showAlert('Deleted', 'Task deleted');
            } catch (err) {
                console.error(err);
            }
        });
    };



    return (
        <AdminGuard>
            <div className="max-w-5xl mx-auto space-y-8 pb-20">
                {/* Header & Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Task Management</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your personal tasks and deadlines.</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsStatsModalOpen(true)}
                            className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 px-4 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm font-bold text-sm transition-all flex items-center gap-2"
                        >
                            <i className="fas fa-chart-pie text-blue-600"></i> Export Stats
                        </button>
                        <button
                            onClick={() => {
                                setEditingTask(undefined);
                                setIsModalOpen(true);
                            }}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-500 transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20 whitespace-nowrap"
                        >
                            <i className="fas fa-plus"></i> Add New Task
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="min-h-[500px] space-y-8">
                    
                    {/* Controls Row */}
                    <div className="flex items-center justify-between">
                         <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                            In Progress
                            <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full">
                                {pendingTasks.length}
                            </span>
                        </h2>

                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-500"><i className="fas fa-sort"></i></label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="px-2 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="default">Smart Sort</option>
                                <option value="deadline">Deadline</option>
                                <option value="priority">Priority</option>
                                <option value="newest">Newest</option>
                            </select>
                        </div>
                    </div>

                    {/* Pending List */}
                    {loading ? (
                        <div className="space-y-4">
                            {[1,2,3].map(i => (
                                <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : pendingTasks.length > 0 ? (
                        <div className="space-y-3">
                            {pendingTasks.map(task => (
                                <TaskItem
                                    key={task.id}
                                    task={task}
                                    onToggleComplete={handleToggleComplete}
                                    onDelete={handleDelete}
                                    onEdit={(t) => {
                                        setEditingTask(t);
                                        setIsModalOpen(true);
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                            <i className="fas fa-clipboard-check text-4xl text-slate-300 dark:text-slate-700 mb-4"></i>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">All Caught Up!</h3>
                            <p className="text-slate-500 dark:text-slate-500 max-w-xs mx-auto mt-2">
                                You have no pending tasks. Enjoy your day!
                            </p>
                        </div>
                    )}


                    {/* Completed Section (if any) */}
                    {completedTasks.length > 0 && (
                        <div className="animate-in fade-in duration-500">
                             <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4 mt-8 opacity-70">
                                <span className="w-2 h-6 bg-green-500 rounded-full grayscale opacity-50"></span>
                                Completed
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs px-2 py-0.5 rounded-full">
                                    {completedTasks.length}
                                </span>
                            </h2>
                            <div className="space-y-3 opacity-60 hover:opacity-100 transition-opacity duration-300">
                                {completedTasks.map(task => (
                                    <TaskItem
                                        key={task.id}
                                        task={task}
                                        onToggleComplete={handleToggleComplete}
                                        onDelete={handleDelete}
                                        onEdit={(t) => {
                                            setEditingTask(t);
                                            setIsModalOpen(true);
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                </div>

            </div>

            <TaskFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
                initialData={editingTask}
            />

            <TaskStatsModal 
                isOpen={isStatsModalOpen}
                onClose={() => setIsStatsModalOpen(false)}
                tasks={tasks}
            />
        </AdminGuard>
    );
}
