import React from 'react';

interface PrayerCardProps {
    id: string;
    name: string;
    description?: string;
    category?: string;
    status: 'active' | 'answered';
    createdAt: any;
    onToggleStatus: (id: string, currentStatus: 'active' | 'answered') => void;
    onDelete: (id: string) => void;
    onEdit?: (target: any) => void;
    onPray: (id: string) => void;
    color: 'green' | 'purple' | 'blue';
}

export default function PrayerCard({ id, name, description, category, status, createdAt, onToggleStatus, onDelete, onEdit, onPray, color }: PrayerCardProps) {
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
        },
        blue: { 
            bg: 'bg-blue-500/20', 
            border: 'border-blue-500/30', 
            text: 'text-blue-400', 
            btn: 'text-blue-400 hover:bg-blue-500/30' 
        }
    };
    
    const c = colorClasses[color] || colorClasses.green;

    return (
        <div className={`rounded-xl border shadow-lg p-5 flex flex-col justify-between transition-all duration-300 ${isAnswered ? 'bg-slate-900/50 border-white/5 opacity-75' : 'bg-slate-900 border-white/10 hover:shadow-xl hover:border-white/20'}`}>
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    {category && (
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-2 inline-block border ${isAnswered ? 'bg-slate-800 text-slate-500 border-slate-700' : `${c.bg} ${c.text} ${c.border}`}`}>
                            {category}
                        </span>
                    )}
                    <h3 className={`font-bold text-lg leading-tight mb-2 ${isAnswered ? 'text-slate-500 line-through' : 'text-white'}`}>
                        {name}
                    </h3>
                    {description && (
                        <p className={`text-sm mb-3 line-clamp-2 ${isAnswered ? 'text-slate-600' : 'text-slate-400'}`}>
                            {description}
                        </p>
                    )}
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                        <i className="far fa-clock"></i>
                        {createdAt?.seconds ? new Date(createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                    </p>
                </div>
                {isAnswered && (
                    <span className="text-xs font-bold bg-green-900/30 text-green-400 px-2 py-1 rounded-md border border-green-500/20 ml-2">
                        Answered
                    </span>
                )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
                <div className="flex gap-1">
                    <button 
                        onClick={() => onToggleStatus(id, status)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isAnswered ? 'text-yellow-400 hover:bg-yellow-500/20' : 'text-green-400 hover:bg-green-500/20'}`}
                        title={isAnswered ? "Mark Active" : "Mark Answered"}
                    >
                        <i className={`fas ${isAnswered ? 'fa-undo' : 'fa-check'}`}></i>
                    </button>
                    {onEdit && (
                         <button 
                            onClick={() => onEdit({id, name, description, category, status})}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-blue-400 hover:bg-blue-500/20 transition-colors"
                            title="Edit"
                        >
                            <i className="fas fa-edit"></i>
                        </button>
                    )}
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
