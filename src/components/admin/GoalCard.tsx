import React from 'react';
import Link from 'next/link';

interface Goal {
    id: string;
    year: number;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    status: 'planned' | 'in_progress' | 'completed' | 'on_hold';
    progress: number;
    milestones: {
        id: string;
        title: string;
        isCompleted: boolean;
    }[];
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

export default function GoalCard({ goal, onDelete }: { goal: Goal, onDelete: (id: string) => void }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2 flex-wrap">
                    <PriorityBadge priority={goal.priority} />
                    <StatusBadge status={goal.status} />
                </div>
                <div className="flex gap-2">
                    <Link href={`/admin/goals/create?id=${goal.id}`} className="text-gray-400 hover:text-blue-600">
                        <i className="fas fa-edit"></i>
                    </Link>
                    <button onClick={() => onDelete(goal.id)} className="text-gray-400 hover:text-red-600">
                        <i className="fas fa-trash"></i>
                    </button>
                </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">{goal.title}</h3>
            <p className="text-sm text-gray-500 mb-6 flex-grow line-clamp-3">{goal.description}</p>

            <div className="mt-auto space-y-3">
                <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(goal.progress)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                            goal.progress === 100 ? 'bg-green-500' : 
                            goal.progress > 50 ? 'bg-blue-500' : 'bg-blue-400'
                        }`}
                        style={{ width: `${goal.progress}%` }}
                    ></div>
                </div>
                
                <div className="text-xs text-gray-400 flex items-center gap-1 mt-2">
                    <i className="fas fa-tasks"></i>
                    <span>{goal.milestones.filter(m => m.isCompleted).length}/{goal.milestones.length} Milestones</span>
                </div>
            </div>
        </div>
    );
}
