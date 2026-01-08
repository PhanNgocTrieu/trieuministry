"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import AdminGuard from '@/components/admin/AdminGuard';
import TaskItem from '@/components/admin/tasks/TaskItem';
import TaskFormModal from '@/components/admin/tasks/TaskFormModal';
import TaskReport from '@/components/admin/tasks/TaskReport';
import { Task, TaskFormData } from '@/components/admin/tasks/types';
import { useModal } from '@/context/ModalContext';
import { batchArchiveTasks } from '@/components/admin/tasks/archiveActions';

export default function AdminTasksPage() {
    const { user } = useAuth();
    const { showAlert, showConfirm } = useModal();
    
    // View State: 'active' | 'report'
    const [viewMode, setViewMode] = useState<'active' | 'report'>('active');
    const [sortBy, setSortBy] = useState<'default' | 'deadline' | 'priority' | 'newest'>('default');

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
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
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: string) => {
        showConfirm('Delete Task', 'Are you sure you want to permanently delete this task?', async () => {
            try {
                await deleteDoc(doc(db, 'tasks', id));
                showAlert('Deleted', 'Task deleted temporarily'); // 'temporarily' logic? No, just deleted.
            } catch (err) {
                console.error(err);
            }
        });
    };

    const handleArchive = async (task: Task) => {
        showConfirm('Archive Task', 'Move this task to archive? It will be removed from this list.', async () => {
            try {
                // 1. Add to task_archives
                const archiveRef = doc(collection(db, 'task_archives')); // New ID
                const archiveData = {
                    ...task,
                    archivedAt: serverTimestamp(),
                    archivedMonth: format(new Date(), 'yyyy-MM') // Current month
                };
                // Remove id from spread if we want new ID, or use same ID?
                // Let's use same ID for consistency if we ever want to restore.
                await setDoc(doc(db, 'task_archives', task.id), archiveData);

                // 2. Delete from tasks
                await deleteDoc(doc(db, 'tasks', task.id));

                showAlert('Archived', 'Task moved to archive.');
            } catch (err) {
                console.error(err);
                showAlert('Error', 'Failed to archive task');
            }
        });
    };

    const handleBatchArchive = async () => {
        const completedTasks = tasks.filter(t => t.isCompleted);
        if (completedTasks.length === 0) {
            showAlert('Info', 'No completed tasks to archive.');
            return;
        }
        try {
            await batchArchiveTasks(completedTasks, showConfirm);
            showAlert('Success', `Archived ${completedTasks.length} tasks.`);
        } catch (error) {
            // Error handled in helper
        }
    };

    return (
        <AdminGuard>
            <div className="max-w-5xl mx-auto space-y-6 pb-20">
                {/* Header & Tabs */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Task Management</h1>
                        <p className="text-sm text-slate-400">Manage your personal tasks and deadlines.</p>
                    </div>
                    
                    <div className="flex bg-slate-900 p-1 rounded-lg self-start border border-white/10">
                        <button
                            onClick={() => setViewMode('active')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                                viewMode === 'active' 
                                ? 'bg-slate-800 text-blue-400 shadow-sm border border-white/5' 
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            <i className="fas fa-list-ul mr-2"></i> Active Tasks
                        </button>
                        <button
                            onClick={() => setViewMode('report')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                                viewMode === 'report' 
                                ? 'bg-slate-800 text-purple-400 shadow-sm border border-white/5' 
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            <i className="fas fa-archive mr-2"></i> Reports / Archive
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="min-h-[500px]">
                    {viewMode === 'active' ? (
                        <>
                            {/* Controls */}
                            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <span className="text-xs font-bold uppercase text-slate-500 whitespace-nowrap">
                                        {tasks.filter(t => !t.isCompleted).length} Pending
                                    </span>
                                    
                                    {/* Sort Dropdown */}
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-bold text-slate-500"><i className="fas fa-sort"></i></label>
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value as any)}
                                            className="px-2 py-1.5 text-xs font-bold text-slate-300 bg-slate-800 border border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="default">Default (Smart)</option>
                                            <option value="deadline">Deadline</option>
                                            <option value="priority">Priority</option>
                                            <option value="newest">Newest</option>
                                        </select>
                                    </div>

                                    {tasks.some(t => t.isCompleted) && (
                                        <button 
                                            onClick={handleBatchArchive}
                                            className="px-3 py-1.5 text-xs font-bold text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg transition-colors flex items-center gap-1 border border-purple-500/20"
                                        >
                                            <i className="fas fa-boxes"></i> Archive Completed
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        setEditingTask(undefined);
                                        setIsModalOpen(true);
                                    }}
                                    className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-500 transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20 whitespace-nowrap"
                                >
                                    <i className="fas fa-plus"></i> Add New Task
                                </button>
                            </div>

                            {/* Active List */}
                            {loading ? (
                                <div className="space-y-4">
                                    {[1,2,3].map(i => (
                                        <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse"></div>
                                    ))}
                                </div>
                            ) : sortedTasks.length > 0 ? (
                                <div className="space-y-3">
                                    {sortedTasks.map(task => (
                                        <TaskItem
                                            key={task.id}
                                            task={task}
                                            onToggleComplete={handleToggleComplete}
                                            onDelete={handleDelete}
                                            onEdit={(t) => {
                                                setEditingTask(t);
                                                setIsModalOpen(true);
                                            }}
                                            onArchive={handleArchive}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-slate-900 rounded-xl border border-dashed border-white/10">
                                    <i className="fas fa-clipboard-check text-4xl text-slate-700 mb-4"></i>
                                    <h3 className="text-lg font-bold text-white">All Caught Up!</h3>
                                    <p className="text-slate-500 max-w-xs mx-auto mt-2">
                                        You have no pending tasks. Enjoy your day or add a new task to get started.
                                    </p>
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="mt-6 text-blue-400 font-bold hover:underline"
                                    >
                                        Create a task now
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <TaskReport />
                    )}
                </div>

            </div>

            <TaskFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
                initialData={editingTask}
            />
        </AdminGuard>
    );
}
