"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import GoalCard from '@/components/admin/GoalCard';
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
    type: 'milestone' | 'target' | 'savings' | 'simple';
    // Milestone
    milestones: {
        id: string;
        title: string;
        isCompleted: boolean;
    }[];
    // Target / Savings
    targetValue?: number;
    currentValue?: number;
    unit?: string;
    // Simple
    isCompleted?: boolean;
    createdAt?: any;
}

interface GoalsManagerProps {
    basePath: string; // e.g. '/admin/goals', '/dashboard/goals', '/volunteer/goals'
}

export default function GoalsManager({ basePath }: GoalsManagerProps) {
    const { user } = useAuth();
    const { showAlert, showConfirm } = useModal();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(0); // Default to All Years
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');

    useEffect(() => {
        if (!user) return;

        // Removed orderBy("createdAt") to avoid composite index requirements
        // We will sort client-side
        const q = query(
            collection(db, "goals"), 
            where("userId", "==", user.uid)
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: Goal[] = [];
            snapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() } as Goal);
            });
            // Client-side sort desc by createdAt
            list.sort((a, b) => {
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA;
            });
            setGoals(list);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const handleDelete = async (id: string) => {
        showConfirm(
            "Delete Goal",
            "Are you sure you want to delete this goal?",
            async () => {
                 await deleteDoc(doc(db, "goals", id));
                 await logActivity('goal', 'delete', 'Deleted a goal');
                 showAlert("Success", "Goal deleted successfully.");
            },
            true
        );
    };

    const handleUpdateGoal = async (id: string, data: Partial<Goal>) => {
        try {
            await updateDoc(doc(db, "goals", id), data);
            await logActivity('goal', 'update', 'Updated goal progress/details');
        } catch (error) {
            console.error("Error updating goal:", error);
            showAlert("Error", "Failed to update goal progress");
        }
    };

    // Filters
    const filteredGoals = goals.filter(goal => {
        if (selectedYear !== 0 && goal.year !== selectedYear) return false;
        if (filterStatus !== 'all' && goal.status !== filterStatus) return false;
        if (filterPriority !== 'all' && goal.priority !== filterPriority) return false;
        return true;
    });

    // Stats
    const totalGoals = filteredGoals.length;
    const completedGoals = filteredGoals.filter(g => g.status === 'completed').length;
    const inProgressGoals = filteredGoals.filter(g => g.status === 'in_progress').length;
    const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

    if (loading) return <div className="p-8 text-center text-slate-400">Loading goals...</div>;

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Goals & Monitoring</h1>
                    <p className="text-slate-500 dark:text-slate-400">Track your personal yearly goals and milestones.</p>
                </div>
                <Link 
                    href={`${basePath}/create`} 
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-500 shadow-lg shadow-blue-500/20 font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95"
                >
                    <i className="fas fa-plus"></i> New Goal
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-white/5 shadow-lg group hover:border-blue-500/30 transition-colors">
                    <p className="text-xs text-slate-500 dark:text-slate-500 font-bold uppercase group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">Total Goals</p>
                    <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{totalGoals}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-white/5 shadow-lg group hover:border-green-500/30 transition-colors">
                    <p className="text-xs text-slate-500 dark:text-slate-500 font-bold uppercase group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Completed</p>
                    <p className="text-3xl font-extrabold text-green-600 dark:text-green-400 mt-2">{completedGoals}</p>
                </div>
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-white/5 shadow-lg group hover:border-yellow-500/30 transition-colors">
                    <p className="text-xs text-slate-500 dark:text-slate-500 font-bold uppercase group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">In Progress</p>
                    <p className="text-3xl font-extrabold text-yellow-600 dark:text-yellow-400 mt-2">{inProgressGoals}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-white/5 shadow-lg group hover:border-purple-500/30 transition-colors">
                    <p className="text-xs text-slate-500 dark:text-slate-500 font-bold uppercase group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Success Rate</p>
                    <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 mt-2">{completionRate}%</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/5 shadow-lg flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Year:</span>
                    <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 outline-none border"
                    >
                        <option value={0}>All Years</option>
                        {[2024, 2025, 2026, 2027].map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>

                <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden md:block"></div>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Status:</span>
                    <select 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 outline-none border"
                    >
                        <option value="all">All Status</option>
                        <option value="planned">Planned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="on_hold">On Hold</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Priority:</span>
                    <select 
                        value={filterPriority} 
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 outline-none border"
                    >
                        <option value="all">All Priorities</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
            </div>

            {/* Grid */}
            {filteredGoals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredGoals.map(goal => (
                        <GoalCard 
                            key={goal.id} 
                            goal={goal} 
                            onDelete={handleDelete} 
                            onUpdate={handleUpdateGoal}
                            basePath={basePath} 
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-bullseye text-slate-400 dark:text-slate-500 text-3xl"></i>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">No goals found</h3>
                    <p className="text-slate-500 mt-2">Adjust filters or create your first goal for {selectedYear}.</p>
                </div>
            )}
        </div>
    );
}
