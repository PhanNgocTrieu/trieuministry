
import React from 'react';

interface PrayerCardProps {
    id: string;
    name: string;
    status: 'active' | 'answered';
    createdAt: any;
    onToggleStatus: (id: string, currentStatus: 'active' | 'answered') => void;
    onDelete: (id: string) => void;
    onPray: (id: string) => void;
    color: 'green' | 'purple';
}

export default function PrayerCard({ id, name, status, createdAt, onToggleStatus, onDelete, onPray, color }: PrayerCardProps) {
    const isAnswered = status === 'answered';
    
    const colorClasses = {
        green: { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-800', btn: 'text-green-600 hover:bg-green-100' },
        purple: { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-800', btn: 'text-purple-600 hover:bg-purple-100' }
    };
    
    const c = colorClasses[color];

    return (
        <div className={`rounded-xl border shadow-sm p-4 flex flex-col justify-between transition-all duration-300 ${isAnswered ? 'bg-gray-50 border-gray-100 opacity-75' : 'bg-white border-gray-100 hover:shadow-md'}`}>
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <h3 className={`font-bold text-lg leading-tight mb-1 ${isAnswered ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {name}
                    </h3>
                    <p className="text-xs text-gray-400">
                        {createdAt?.seconds ? new Date(createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                    </p>
                </div>
                {isAnswered && (
                    <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-md">
                        Answered
                    </span>
                )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-2">
                <div className="flex gap-1">
                    <button 
                        onClick={() => onToggleStatus(id, status)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isAnswered ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`}
                        title={isAnswered ? "Mark Active" : "Mark Answered"}
                    >
                        <i className={`fas ${isAnswered ? 'fa-undo' : 'fa-check'}`}></i>
                    </button>
                    <button 
                        onClick={() => onDelete(id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                    >
                        <i className="fas fa-trash"></i>
                    </button>
                </div>
                
                {!isAnswered && (
                    <button 
                        onClick={() => onPray(id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all active:scale-95 ${c.bg} ${c.text} hover:brightness-95`}
                    >
                        <i className="fas fa-praying-hands"></i> Pray
                    </button>
                )}
            </div>
        </div>
    );
}
