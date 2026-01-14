"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
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

const PriorityBadge = ({ priority }: { priority: string }) => {
    const colors = {
        high: 'bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20',
        medium: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
        low: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
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

export default function AdminGoalsList() {
    const { user } = useAuth();
    const { showAlert, showConfirm } = useModal();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    
    // UI State
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Inline Edit State (for Target/Savings)
    const [isEditingValue, setIsEditingValue] = useState(false);
    const [tempValue, setTempValue] = useState("");

    useEffect(() => {
        if (!user) return;
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



    const getFilteredGoals = () => {
        let filtered = goals;

        // 1. Tab Filter (Active vs Completed)
        if (activeTab === 'active') {
            filtered = filtered.filter(g => g.status !== 'completed');
        } else {
            filtered = filtered.filter(g => g.status === 'completed');
        }

        // 2. Year Filter
        if (selectedYear !== 0) {
            filtered = filtered.filter(g => g.year === selectedYear);
        }

        // 3. Search
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(g => g.title.toLowerCase().includes(term));
        }

        return filtered;
    };

    const handleDelete = async (id: string) => {
        showConfirm(
            "Delete Goal",
            "Are you sure you want to delete this goal?",
            async () => {
                try {
                    await deleteDoc(doc(db, "goals", id));
                    await logActivity('goal', 'delete', 'Deleted a goal');
                    showAlert("Success", "Goal deleted successfully.");
                    // Selection handling is automatic via useEffect re-render
                } catch (error) {
                    console.error("Error deleting:", error);
                    showAlert("Error", "Failed to delete goal");
                }
            },
            true, "Delete"
        );
    };

    const handleUpdateGoal = async (id: string, data: Partial<Goal>) => {
        try {
            await updateDoc(doc(db, "goals", id), data);
            
            // If status changed to completed, maybe switch tab? 
            // Better to let user switch manually or just let it disappear from "Active" list
            if (data.status === 'completed' && activeTab === 'active') {
                showAlert("Goal Completed!", "Moved to Completed list.");
            }
        } catch (error) {
            console.error("Error updating goal:", error);
            showAlert("Error", "Failed to update goal");
        }
    };

    // --- Detail Update Logic ---

    const handleSimpleToggle = (goal: Goal) => {
        const newCompleted = !goal.isCompleted;
        handleUpdateGoal(goal.id, {
            isCompleted: newCompleted,
            progress: newCompleted ? 100 : 0,
            status: newCompleted ? 'completed' : 'in_progress'
        });
    };

    const handleMilestoneToggle = (goal: Goal, msIndex: number) => {
        if (!goal.milestones) return;
        const newMilestones = [...goal.milestones];
        newMilestones[msIndex].isCompleted = !newMilestones[msIndex].isCompleted;
        
        const completedCount = newMilestones.filter(m => m.isCompleted).length;
        const newProgress = (completedCount / newMilestones.length) * 100;
        
        let newStatus: Goal['status'] = goal.status;
        if (newProgress === 100) newStatus = 'completed';
        else if (newProgress > 0 && newStatus === 'planned') newStatus = 'in_progress';

        handleUpdateGoal(goal.id, {
            milestones: newMilestones,
            progress: newProgress,
            status: newStatus
        });
    };

    const handleValueSave = (goal: Goal) => {
        const val = parseFloat(tempValue);
        if (isNaN(val)) return;
        
        const target = goal.targetValue || 1;
        const newProgress = Math.min(100, (val / target) * 100);
        
        let newStatus: Goal['status'] = goal.status;
        if (newProgress === 100 && newStatus !== 'completed') newStatus = 'completed';
        else if (newProgress > 0 && newStatus === 'planned') newStatus = 'in_progress';

        handleUpdateGoal(goal.id, {
            currentValue: val,
            progress: newProgress,
            status: newStatus
        });
        setIsEditingValue(false);
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    };

    const visibleGoals = getFilteredGoals();
    const selectedGoal = goals.find(g => g.id === selectedId);

    // Reset temp value when selection changes
    useEffect(() => {
        if (selectedGoal) {
            setTempValue(selectedGoal.currentValue?.toString() || "");
            setIsEditingValue(false);
        }
    }, [selectedId]);

    // --- Stats Report Logic ---
    const [showStatsModal, setShowStatsModal] = useState(false);

    const getStatsData = () => {
        const now = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(now.getFullYear() - 1);

        // Filter goals from the last 12 months (based on createdAt or just year matching)
        // Since we have 'year' field, we can use that for simplicity or strict date check if createdAt exists
        const statsGoals = goals.filter(g => {
            if (!g.createdAt?.seconds) return g.year === now.getFullYear(); // Fallback
            const gDate = new Date(g.createdAt.seconds * 1000);
            return gDate >= oneYearAgo && gDate <= now;
        });

        const total = statsGoals.length;
        const completed = statsGoals.filter(g => g.status === 'completed').length;
        const inProgress = statsGoals.filter(g => g.status === 'in_progress').length;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { total, completed, inProgress, rate, goals: statsGoals };
    };

    const statsData = getStatsData();

    return (
        <div className="h-[calc(100dvh-140px)] min-h-[400px] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-slate-900 animate-fade-in relative flex flex-col">
            
            {/* STATS MODAL */}
            {showStatsModal && (
                <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col max-h-[90%] animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <i className="fas fa-chart-pie text-blue-500"></i> Annual Report
                                </h2>
                                <p className="text-sm text-slate-500">Overview of the last 12 months.</p>
                            </div>
                            <button 
                                onClick={() => setShowStatsModal(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 hover:bg-red-500/10 flex items-center justify-center transition-all"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-3 gap-4 mb-8">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-500/10 text-center">
                                    <p className="text-xs font-bold text-blue-500 uppercase">Total Goals</p>
                                    <p className="text-3xl font-black text-blue-700 dark:text-blue-400">{statsData.total}</p>
                                </div>
                                <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-500/10 text-center">
                                    <p className="text-xs font-bold text-green-500 uppercase">Completed</p>
                                    <p className="text-3xl font-black text-green-700 dark:text-green-400">{statsData.completed}</p>
                                </div>
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-500/10 text-center">
                                    <p className="text-xs font-bold text-purple-500 uppercase">Success Rate</p>
                                    <p className="text-3xl font-black text-purple-700 dark:text-purple-400">{statsData.rate}%</p>
                                </div>
                            </div>

                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wide border-b border-slate-100 dark:border-white/5 pb-2">
                                Goal History
                            </h3>
                            <div className="space-y-3">
                                {statsData.goals.length > 0 ? (
                                    statsData.goals.map(g => (
                                        <div key={g.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${g.status === 'completed' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                                <span className={`font-medium ${g.status === 'completed' ? 'text-slate-900 dark:text-white line-through opacity-70' : 'text-slate-700 dark:text-slate-200'}`}>
                                                    {g.title}
                                                </span>
                                            </div>
                                            <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                                {g.year}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-slate-500 italic py-4">No goals found for this period.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DETAIL MODAL (Replaces Right Panel) */}
            {selectedGoal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 relative">
                        
                        {/* 1. Modal Header (Close Button) */}
                         <div className="p-4 border-b border-slate-100 dark:border-white/5 flex justify-end items-center bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                            <button 
                                onClick={() => setSelectedId(null)}
                                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                title="Close"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {/* Interactive Body */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white dark:bg-slate-900 custom-scrollbar">
                            
                            {/* 2. Title & Actions Header */}
                            <div className="flex flex-col md:flex-row gap-4 justify-between items-start mb-8">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <StatusBadge status={selectedGoal.status} />
                                        <PriorityBadge priority={selectedGoal.priority || 'medium'} />
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                            {selectedGoal.year}
                                        </span>
                                    </div>
                                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                                        {selectedGoal.title}
                                    </h1>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link 
                                        href={`/admin/goals/create?id=${selectedGoal.id}`}
                                        className="px-4 py-2 rounded-xl flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white transition-all font-bold text-sm"
                                        title="Edit Details"
                                    >
                                        <i className="fas fa-edit"></i> Edit
                                    </Link>
                                    <button 
                                        onClick={() => handleDelete(selectedGoal.id)}
                                        className="px-4 py-2 rounded-xl flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-500 hover:text-white transition-all font-bold text-sm"
                                        title="Delete"
                                    >
                                        <i className="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>

                            {/* 3. Overall Progress */}
                            <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-white/5">
                                <div className="flex justify-between items-end mb-3">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Process</p>
                                        <p className={`text-4xl font-black ${selectedGoal.progress === 100 ? 'text-green-500' : 'text-blue-600 dark:text-blue-400'}`}>
                                            {Math.round(selectedGoal.progress || 0)}%
                                        </p>
                                    </div>
                                    {selectedGoal.status === 'completed' && (
                                        <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-2">
                                            <i className="fas fa-check-circle"></i> COMPLETED
                                        </div>
                                    )}
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-3 overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-700 ${
                                            selectedGoal.progress === 100 ? 'bg-green-500' : 'bg-blue-600'
                                        }`} 
                                        style={{ width: `${selectedGoal.progress || 0}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* 4. Description Content */}
                            {selectedGoal.description && (
                                <div className="mb-8">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-3 flex items-center gap-2">
                                        <i className="fas fa-align-left text-slate-400"></i> Description
                                    </h3>
                                    <div className="prose prose-slate dark:prose-invert max-w-none">
                                        <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                            {selectedGoal.description}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* 5. Milestones & Updates (Type Specific) */}
                            <div className="border-t border-slate-100 dark:border-white/5 pt-8">
                                
                                {/* MILESTONES */}
                                {selectedGoal.type === 'milestone' && (
                                    <div className="space-y-4">
                                         <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-3 flex items-center gap-2">
                                            <i className="fas fa-tasks text-slate-400"></i> Milestones Checklist
                                        </h3>
                                        <div className="space-y-3">
                                            {selectedGoal.milestones?.map((ms, idx) => (
                                                <div 
                                                    key={idx} 
                                                    onClick={() => handleMilestoneToggle(selectedGoal, idx)}
                                                    className="flex items-start gap-4 p-4 rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-800/20 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg transition-all border border-transparent hover:border-slate-100 dark:hover:border-white/5 group"
                                                >
                                                    <div className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors shrink-0 ${
                                                        ms.isCompleted 
                                                        ? 'bg-blue-600 border-blue-600 text-white' 
                                                        : 'border-slate-300 dark:border-slate-600 text-transparent group-hover:border-blue-400'
                                                    }`}>
                                                        <i className="fas fa-check text-xs"></i>
                                                    </div>
                                                    <span className={`text-base font-medium transition-colors ${ms.isCompleted ? 'text-slate-400 dark:text-slate-500 line-through decoration-2' : 'text-slate-700 dark:text-slate-200'}`}>
                                                        {ms.title}
                                                    </span>
                                                </div>
                                            ))}
                                            {(!selectedGoal.milestones || selectedGoal.milestones.length === 0) && (
                                                <p className="text-slate-400 italic text-sm">No milestones defined. Edit the goal to add list items.</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* TARGET / SAVINGS */}
                                {(selectedGoal.type === 'target' || selectedGoal.type === 'savings') && (
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-3 flex items-center gap-2">
                                            <i className="fas fa-chart-line text-slate-400"></i> Current Value
                                        </h3>
                                        <div className="bg-slate-50 dark:bg-slate-800/20 p-8 rounded-2xl flex flex-col items-center justify-center text-center border border-slate-100 dark:border-white/5">
                                            {isEditingValue ? (
                                                <div className="w-full max-w-xs animate-in fade-in zoom-in duration-200">
                                                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Update New Value</label>
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="number" 
                                                            value={tempValue}
                                                            onChange={(e) => setTempValue(e.target.value)}
                                                            className="w-full px-4 py-3 text-lg font-bold bg-white dark:bg-slate-700 border border-slate-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white outline-none"
                                                            placeholder="Value"
                                                            autoFocus
                                                        />
                                                        <button 
                                                            onClick={() => handleValueSave(selectedGoal)}
                                                            className="bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-500 font-bold"
                                                        >
                                                            Save
                                                        </button>
                                                    </div>
                                                    <button onClick={() => setIsEditingValue(false)} className="mt-3 text-sm text-slate-400 hover:text-slate-600">Cancel</button>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                                                        {selectedGoal.type === 'savings' ? formatCurrency(selectedGoal.currentValue || 0) : selectedGoal.currentValue || 0}
                                                    </p>
                                                    <p className="text-xl text-slate-400 dark:text-slate-500 font-medium mb-6">
                                                        of <span className="text-slate-600 dark:text-slate-300">{selectedGoal.type === 'savings' ? formatCurrency(selectedGoal.targetValue || 0) : `${selectedGoal.targetValue} ${selectedGoal.unit || ''}`}</span>
                                                    </p>
                                                    <button 
                                                        onClick={() => setIsEditingValue(true)}
                                                        className="px-6 py-2.5 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-white/10 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl font-bold transition-all shadow-sm"
                                                    >
                                                        Update Value
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* SIMPLE */}
                                {selectedGoal.type === 'simple' && (
                                    <div className="flex flex-col items-center justify-center py-6">
                                        <button 
                                            onClick={() => handleSimpleToggle(selectedGoal)}
                                            className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-lg shadow-sm transition-all transform active:scale-95 ${
                                                selectedGoal.isCompleted 
                                                ? 'bg-green-500 text-white hover:bg-green-600' 
                                                : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10'
                                            }`}
                                        >
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedGoal.isCompleted ? 'border-white' : 'border-slate-400'}`}>
                                                {selectedGoal.isCompleted && <i className="fas fa-check text-xs"></i>}
                                            </div>
                                            {selectedGoal.isCompleted ? 'Marked as Complete' : 'Mark as Complete'}
                                        </button>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MAIN LIST: FULL WIDTH */}
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950/50">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 dark:border-white/10 space-y-3">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="font-bold text-slate-700 dark:text-slate-200">Goals</h2>
                            <p className="text-xs text-slate-500">Year: {selectedYear}</p>
                        </div>
                         <div className="flex gap-2">
                             <button
                                onClick={() => setShowStatsModal(true)}
                                className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                                title="Stats Reports"
                            >
                                <i className="fas fa-chart-bar"></i>
                            </button>
                            <Link 
                                href="/admin/goals/create"
                                className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
                                title="Add New Goal"
                            >
                                <i className="fas fa-plus"></i>
                            </Link>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                        <input 
                            type="text" 
                            placeholder="Search goals..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1 bg-slate-200 dark:bg-slate-800 rounded-lg">
                         <button 
                            onClick={() => setActiveTab('active')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'active' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            Active
                        </button>
                         <button 
                            onClick={() => setActiveTab('completed')}
                             className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'completed' ? 'bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            Completed
                        </button>
                    </div>
                </div>

                {/* List Items */}
                <div className="flex-1 min-h-0 overflow-y-scroll custom-scrollbar p-0 overscroll-y-contain">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500 text-sm">Loading...</div>
                    ) : visibleGoals.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm italic">
                            <i className="fas fa-clipboard-list text-4xl mb-3 text-slate-300 dark:text-slate-700"></i>
                            {searchTerm ? "No matches found." : activeTab === 'active' ? "No active goals." : "No completed goals."}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 divide-y md:divide-y-0 divide-slate-100 dark:divide-white/5">
                            {visibleGoals.map(goal => (
                                 <div 
                                    key={goal.id}
                                    onClick={() => setSelectedId(goal.id)}
                                    className={`p-5 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 group border-b border-r border-slate-100 dark:border-white/5 ${
                                        selectedId === goal.id 
                                            ? 'bg-blue-50/50 dark:bg-blue-900/10' 
                                            : 'bg-transparent'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className={`font-bold text-base line-clamp-1 flex-1 mr-2 ${selectedId === goal.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                            {goal.title}
                                        </h3>
                                        {goal.status === 'completed' && <i className="fas fa-check-circle text-green-500"></i>}
                                    </div>
                                    
                                    <div className="flex justify-between items-center text-xs mb-3">
                                         <div className="flex items-center gap-2">
                                             <PriorityBadge priority={goal.priority || 'medium'} />
                                             <span className="text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{goal.year}</span>
                                         </div>
                                         <div className="flex items-center gap-1 font-bold text-slate-500">
                                             <span>{Math.round(goal.progress || 0)}%</span>
                                         </div>
                                    </div>

                                    {/* Mini Progress Bar */}
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${goal.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`} 
                                            style={{ width: `${goal.progress || 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
