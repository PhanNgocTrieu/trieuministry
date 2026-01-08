import React, { useState } from 'react';
import Link from 'next/link';

interface Goal {
    id: string;
    year: number;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    status: 'planned' | 'in_progress' | 'completed' | 'on_hold';
    progress: number;
    type?: 'milestone' | 'target' | 'savings' | 'simple';
    // Milestone
    milestones?: {
        id: string;
        title: string;
        isCompleted: boolean;
    }[];
    // Target
    targetValue?: number;
    currentValue?: number;
    unit?: string;
    // Simple
    isCompleted?: boolean;
}

const PriorityBadge = ({ priority }: { priority: string }) => {
    const colors = {
        high: 'bg-red-500/10 text-red-400 border-red-500/20',
        medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        low: 'bg-green-500/10 text-green-400 border-green-500/20'
    };
    return (
        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${colors[priority as keyof typeof colors] || colors.low}`}>
            {priority}
        </span>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
        planned: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
        in_progress: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
        completed: 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400',
        on_hold: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400'
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colors[status as keyof typeof colors] || colors.planned}`}>
            {status.replace('_', ' ')}
        </span>
    );
};

interface GoalCardProps {
    goal: Goal;
    onDelete: (id: string) => void;
    onUpdate: (id: string, data: Partial<Goal>) => void;
    basePath: string;
}

export default function GoalCard({ goal, onDelete, onUpdate, basePath }: GoalCardProps) {
    const [isEditingValue, setIsEditingValue] = useState(false);
    const [tempValue, setTempValue] = useState(goal.currentValue?.toString() || '');

    // Formatting helpers
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    };

    // --- Handlers ---

    // 1. Simple Goal Handler
    const handleSimpleToggle = () => {
        const newCompleted = !goal.isCompleted;
        onUpdate(goal.id, {
            isCompleted: newCompleted,
            progress: newCompleted ? 100 : 0,
            status: newCompleted ? 'completed' : 'in_progress'
        });
    };

    // 2. Milestone Handler
    const handleMilestoneToggle = (msIndex: number) => {
        if (!goal.milestones) return;
        
        const newMilestones = [...goal.milestones];
        newMilestones[msIndex].isCompleted = !newMilestones[msIndex].isCompleted;
        
        const completedCount = newMilestones.filter(m => m.isCompleted).length;
        const newProgress = (completedCount / newMilestones.length) * 100;
        
        let newStatus: Goal['status'] = goal.status;
        if (newProgress === 100) newStatus = 'completed';
        else if (newProgress > 0 && newStatus === 'planned') newStatus = 'in_progress';

        onUpdate(goal.id, {
            milestones: newMilestones,
            progress: newProgress,
            status: newStatus
        });
    };

    // 3. Numeric Handler (Target/Savings)
    const handleValueSave = () => {
        const val = parseFloat(tempValue);
        if (isNaN(val)) return;
        
        const target = goal.targetValue || 1;
        const newProgress = Math.min(100, (val / target) * 100);
        
        let newStatus: Goal['status'] = goal.status;
        if (newProgress === 100 && newStatus !== 'completed') newStatus = 'completed';
        else if (newProgress > 0 && newStatus === 'planned') newStatus = 'in_progress';

        onUpdate(goal.id, {
            currentValue: val,
            progress: newProgress,
            status: newStatus
        });
        setIsEditingValue(false);
    };

    const renderInteractiveContent = () => {
        switch(goal.type) {
            case 'simple':
                return (
                    <button 
                        onClick={handleSimpleToggle}
                        className={`w-full mt-4 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all group ${
                            goal.isCompleted 
                            ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400' 
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400'
                        }`}
                    >
                        <i className={`fas ${goal.isCompleted ? 'fa-check-circle text-lg' : 'fa-circle text-lg'}`}></i>
                        <span className="font-bold">{goal.isCompleted ? 'Completed' : 'Mark as Done'}</span>
                    </button>
                );

            case 'milestone':
                 return (
                    <div className="mt-4 space-y-2">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Milestones</p>
                        {goal.milestones?.map((ms, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => handleMilestoneToggle(idx)}
                                className="flex items-start gap-3 p-2 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                            >
                                <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                    ms.isCompleted 
                                    ? 'bg-blue-600 border-blue-600 text-white' 
                                    : 'border-slate-300 dark:border-slate-600 text-transparent group-hover:border-blue-400'
                                }`}>
                                    <i className="fas fa-check text-xs"></i>
                                </div>
                                <span className={`text-sm flex-1 leading-snug ${ms.isCompleted ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-600 dark:text-slate-300'}`}>
                                    {ms.title}
                                </span>
                            </div>
                        ))}
                        {goal.milestones?.length === 0 && <p className="text-xs text-slate-500 italic">No milestones defined.</p>}
                    </div>
                );

            case 'savings':
            case 'target':
                return (
                    <div className="mt-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-white/5">
                         <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase">Current Progress</span>
                            <button 
                                onClick={() => setIsEditingValue(!isEditingValue)}
                                className="text-xs text-blue-400 font-bold hover:text-blue-300 hover:underline"
                            >
                                {isEditingValue ? 'Cancel' : 'Update'}
                            </button>
                        </div>
                        
                        {isEditingValue ? (
                            <div className="flex gap-2">
                                <input 
                                    type="number" 
                                    value={tempValue}
                                    onChange={(e) => setTempValue(e.target.value)}
                                    className="w-full px-3 py-2 text-sm font-bold bg-white dark:bg-slate-700 border border-slate-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white outline-none shadow-sm transition-all"
                                    placeholder="Value"
                                />
                                <button 
                                    onClick={handleValueSave}
                                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-500 font-bold text-sm"
                                >
                                    Save
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {goal.type === 'savings' ? formatCurrency(goal.currentValue || 0) : goal.currentValue || 0}
                                </span>
                                <span className="text-sm text-slate-500 font-medium">
                                    / {goal.type === 'savings' ? formatCurrency(goal.targetValue || 0) : `${goal.targetValue} ${goal.unit || ''}`}
                                </span>
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-white/5 p-6 flex flex-col h-full hover:border-blue-500/30 dark:hover:border-white/20 transition-all hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2 flex-wrap">
                    <PriorityBadge priority={goal.priority} />
                    <StatusBadge status={goal.status} />
                    {goal.type && goal.type !== 'milestone' && (
                        <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10">
                            {goal.type}
                        </span>
                    )}
                </div>
                <div className="flex gap-2">
                    <Link 
                        href={`${basePath}/create?id=${goal.id}`} 
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                    >
                        <i className="fas fa-edit"></i>
                    </Link>
                    <button 
                        onClick={() => onDelete(goal.id)} 
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                        <i className="fas fa-trash"></i>
                    </button>
                </div>
            </div>

            {/* Content */}
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-tight">{goal.title}</h3>
            {goal.description && <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{goal.description}</p>}

            {/* Progress Bar (Always Show) */}
            <div className="mt-auto">
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(goal.progress || 0)}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mb-2">
                    <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                            goal.progress === 100 ? 'bg-green-500' : 
                            goal.progress > 50 ? 'bg-blue-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${goal.progress || 0}%` }}
                    ></div>
                </div>

                {/* Dynamic Interactive Content */}
                {renderInteractiveContent()}
            </div>
        </div>
    );
}
