
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
    
    // Updated dark theme color classes
    const colorClasses = {
        green: { 
            bg: 'bg-green-500/20', 
            border: 'border-green-500/30', 
            text: 'text-green-400', 
            btn: 'text-green-400 hover:bg-green-500/30' 
        },
        purple: { 
            bg: 'bg-purple-500/20', 
            border: 'border-purple-500/30', 
            text: 'text-purple-400', 
            btn: 'text-purple-400 hover:bg-purple-500/30' 
        }
    };
    
    const c = colorClasses[color];

    return (
        <div className={`rounded-xl border shadow-lg p-4 flex flex-col justify-between transition-all duration-300 ${isAnswered ? 'bg-slate-900/50 border-white/5 opacity-75' : 'bg-slate-900 border-white/10 hover:shadow-xl hover:border-white/20'}`}>
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <h3 className={`font-bold text-lg leading-tight mb-1 ${isAnswered ? 'text-slate-500 line-through' : 'text-white'}`}>
                        {name}
                    </h3>
                    <p className="text-xs text-slate-500">
                        {createdAt?.seconds ? new Date(createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                    </p>
                </div>
                {isAnswered && (
                    <span className="text-xs font-bold bg-green-900/30 text-green-400 px-2 py-1 rounded-md border border-green-500/20">
                        Answered
                    </span>
                )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-2">
                <div className="flex gap-1">
                    <button 
                        onClick={() => onToggleStatus(id, status)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isAnswered ? 'text-yellow-400 hover:bg-yellow-500/20' : 'text-green-400 hover:bg-green-500/20'}`}
                        title={isAnswered ? "Mark Active" : "Mark Answered"}
                    >
                        <i className={`fas ${isAnswered ? 'fa-undo' : 'fa-check'}`}></i>
                    </button>
                    <button 
                        onClick={() => onDelete(id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Delete"
                    >
                        <i className="fas fa-trash"></i>
                    </button>
                </div>
                
                {!isAnswered && (
                    <button 
                        onClick={() => onPray(id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all active:scale-95 ${c.bg} ${c.text} hover:brightness-110 border ${c.border}`}
                    >
                        <i className="fas fa-praying-hands"></i> Pray
                    </button>
                )}
            </div>
        </div>
    );
}
