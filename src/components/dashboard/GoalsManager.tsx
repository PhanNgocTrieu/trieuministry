"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import GoalCard from '@/components/admin/GoalCard';
import { useAuth } from '@/context/AuthContext';
import { useModal } from '@/context/ModalContext';

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
                 showAlert("Success", "Goal deleted successfully.");
            },
            true
        );
    };

    const handleUpdateGoal = async (id: string, data: Partial<Goal>) => {
        try {
            await updateDoc(doc(db, "goals", id), data);
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

    if (loading) return <div className="p-8 text-center text-gray-500">Loading goals...</div>;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Goals & Monitoring</h1>
                    <p className="text-gray-500">Track your personal yearly goals and milestones.</p>
                </div>
                <Link 
                    href={`${basePath}/create`} 
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 shadow-sm font-bold flex items-center justify-center gap-2"
                >
                    <i className="fas fa-plus"></i> New Goal
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm">
                    <p className="text-xs text-gray-400 font-bold uppercase">Total Goals</p>
                    <p className="text-3xl font-extrabold text-blue-600 mt-2">{totalGoals}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-green-100 shadow-sm">
                    <p className="text-xs text-gray-400 font-bold uppercase">Completed</p>
                    <p className="text-3xl font-extrabold text-green-600 mt-2">{completedGoals}</p>
                </div>
                 <div className="bg-white p-6 rounded-xl border border-yellow-100 shadow-sm">
                    <p className="text-xs text-gray-400 font-bold uppercase">In Progress</p>
                    <p className="text-3xl font-extrabold text-yellow-600 mt-2">{inProgressGoals}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-purple-100 shadow-sm">
                    <p className="text-xs text-gray-400 font-bold uppercase">Success Rate</p>
                    <p className="text-3xl font-extrabold text-purple-600 mt-2">{completionRate}%</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-500">Year:</span>
                    <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value={0}>All Years</option>
                        {[2024, 2025, 2026, 2027].map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>

                <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-500">Status:</span>
                    <select 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Status</option>
                        <option value="planned">Planned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="on_hold">On Hold</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-500">Priority:</span>
                    <select 
                        value={filterPriority} 
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
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
                <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-bullseye text-gray-300 text-3xl"></i>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No goals found</h3>
                    <p className="text-gray-500">Adjust filters or create your first goal for {selectedYear}.</p>
                </div>
            )}
        </div>
    );
}
