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
        high: 'bg-red-100 text-red-700 border-red-200',
        medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        low: 'bg-green-100 text-green-700 border-green-200'
    };
    return (
        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${colors[priority as keyof typeof colors] || colors.low}`}>
            {priority}
        </span>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
        planned: 'bg-gray-100 text-gray-600',
        in_progress: 'bg-blue-100 text-blue-600',
        completed: 'bg-green-100 text-green-600',
        on_hold: 'bg-orange-100 text-orange-600'
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colors[status as keyof typeof colors] || colors.planned}`}>
            {status.replace('_', ' ')}
        </span>
    );
};

// ... (interfaces kept same)

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
                            ? 'bg-green-50 border-green-200 text-green-700' 
                            : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600'
                        }`}
                    >
                        <i className={`fas ${goal.isCompleted ? 'fa-check-circle text-lg' : 'fa-circle text-lg'}`}></i>
                        <span className="font-bold">{goal.isCompleted ? 'Completed' : 'Mark as Done'}</span>
                    </button>
                );

            case 'milestone':
                 return (
                    <div className="mt-4 space-y-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Milestones</p>
                        {goal.milestones?.map((ms, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => handleMilestoneToggle(idx)}
                                className="flex items-start gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group"
                            >
                                <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                    ms.isCompleted 
                                    ? 'bg-blue-500 border-blue-500 text-white' 
                                    : 'border-gray-300 text-transparent group-hover:border-blue-400'
                                }`}>
                                    <i className="fas fa-check text-xs"></i>
                                </div>
                                <span className={`text-sm flex-1 leading-snug ${ms.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                    {ms.title}
                                </span>
                            </div>
                        ))}
                        {goal.milestones?.length === 0 && <p className="text-xs text-gray-400 italic">No milestones defined.</p>}
                    </div>
                );

            case 'savings':
            case 'target':
                return (
                    <div className="mt-4 bg-gray-50 rounded-xl p-3 border border-gray-100">
                         <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-gray-500 uppercase">Current Progress</span>
                            <button 
                                onClick={() => setIsEditingValue(!isEditingValue)}
                                className="text-xs text-blue-600 font-bold hover:underline"
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
                                    className="w-full px-3 py-2 text-sm font-bold bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-sm transition-all"
                                    placeholder="Value"
                                />
                                <button 
                                    onClick={handleValueSave}
                                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 font-bold text-sm"
                                >
                                    Save
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-gray-900">
                                    {goal.type === 'savings' ? formatCurrency(goal.currentValue || 0) : goal.currentValue || 0}
                                </span>
                                <span className="text-sm text-gray-500 font-medium">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2 flex-wrap">
                    <PriorityBadge priority={goal.priority} />
                    <StatusBadge status={goal.status} />
                    {goal.type && goal.type !== 'milestone' && (
                        <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border bg-gray-50 text-gray-500 border-gray-200">
                            {goal.type}
                        </span>
                    )}
                </div>
                <div className="flex gap-2">
                    <Link 
                        href={`${basePath}/create?id=${goal.id}`} 
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                        <i className="fas fa-edit"></i>
                    </Link>
                    <button 
                        onClick={() => onDelete(goal.id)} 
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                        <i className="fas fa-trash"></i>
                    </button>
                </div>
            </div>

            {/* Content */}
            <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">{goal.title}</h3>
            {goal.description && <p className="text-sm text-gray-500 mb-4 line-clamp-2">{goal.description}</p>}

            {/* Progress Bar (Always Show) */}
            <div className="mt-auto">
                <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(goal.progress || 0)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden mb-2">
                    <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                            goal.progress === 100 ? 'bg-green-500' : 
                            goal.progress > 50 ? 'bg-blue-500' : 'bg-blue-400'
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
