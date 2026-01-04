import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

interface Target {
    id: string;
    userId: string;
    name: string;
    status: 'active' | 'answered';
    createdAt: any;
}

interface PrayerTargetListProps {
    title: string;
    icon: string;
    color: 'green' | 'purple' | 'orange';
    collectionName: string;
    logType: 'personal_prayer' | 'intercession' | 'scripture'; // Expanding if needed
    isTodayLogged: boolean;
    onLog: (type: any, content: string) => void;
}

export default function PrayerTargetList({ title, icon, color, collectionName, logType, isTodayLogged, onLog }: PrayerTargetListProps) {
    const { user } = useAuth();
    const [targets, setTargets] = useState<Target[]>([]);
    const [newTargetName, setNewTargetName] = useState("");
    const [showAnswered, setShowAnswered] = useState(false);

    // Color maps
    const colorClasses = {
        green: { text: 'text-green-700', bg: 'bg-green-100', btn: 'bg-green-600 hover:bg-green-700', light: 'bg-green-50', ring: 'focus:ring-green-500' },
        purple: { text: 'text-purple-700', bg: 'bg-purple-100', btn: 'bg-purple-600 hover:bg-purple-700', light: 'bg-purple-50', ring: 'focus:ring-purple-500' },
        orange: { text: 'text-orange-700', bg: 'bg-orange-100', btn: 'bg-orange-600 hover:bg-orange-700', light: 'bg-orange-50', ring: 'focus:ring-orange-500' },
    };
    const c = colorClasses[color];

    useEffect(() => {
        if (user) {
            fetchTargets();
        }
    }, [user, collectionName]);

    const fetchTargets = async () => {
        if (!user) return;
        try {
            const q = query(
                collection(db, collectionName),
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            const fetched: Target[] = [];
            snapshot.forEach(doc => {
                fetched.push({ id: doc.id, ...doc.data() } as Target);
            });
            setTargets(fetched);
        } catch (error) {
            console.error(`Error fetching ${collectionName}:`, error);
        }
    };

    const handleAddTarget = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newTargetName.trim()) return;

        try {
            const docRef = await addDoc(collection(db, collectionName), {
                userId: user.uid,
                name: newTargetName.trim(),
                status: 'active',
                createdAt: serverTimestamp()
            });

            const newTarget: Target = {
                id: docRef.id,
                userId: user.uid,
                name: newTargetName.trim(),
                status: 'active',
                createdAt: new Date()
            };
            setTargets([newTarget, ...targets]);
            setNewTargetName("");
        } catch (error) {
            console.error("Error adding target:", error);
        }
    };

    const handleUpdateStatus = async (targetId: string, newStatus: 'active' | 'answered') => {
        try {
            await updateDoc(doc(db, collectionName, targetId), { status: newStatus });
            setTargets(prev => prev.map(t => t.id === targetId ? { ...t, status: newStatus } : t));
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleDelete = async (targetId: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await deleteDoc(doc(db, collectionName, targetId));
            setTargets(prev => prev.filter(t => t.id !== targetId));
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    const activeTargets = targets.filter(t => t.status === 'active');
    const answeredTargets = targets.filter(t => t.status === 'answered');
    const displayTargets = showAnswered ? answeredTargets : activeTargets;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-[500px]">
            <div className={`flex items-center justify-between mb-4 ${c.text}`}>
                    <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${c.bg} flex items-center justify-center`}>
                        <i className={icon}></i>
                    </div>
                    <h4 className="font-bold text-lg">{title}</h4>
                </div>
                <div className="flex bg-gray-100 rounded-lg p-1">
                    <button 
                        onClick={() => setShowAnswered(false)}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${!showAnswered ? `bg-white shadow ${c.text}` : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Active
                    </button>
                    <button 
                        onClick={() => setShowAnswered(true)}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${showAnswered ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Answered
                    </button>
                </div>
            </div>

            {!showAnswered && (
                <form onSubmit={handleAddTarget} className="flex gap-2 mb-4">
                    <input 
                        type="text"
                        className={`flex-1 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:ring-2 ${c.ring}`}
                        placeholder="Enter name or topic..."
                        value={newTargetName}
                        onChange={(e) => setNewTargetName(e.target.value)}
                    />
                    <button type="submit" className={`${c.btn} text-white w-10 h-10 rounded-lg flex items-center justify-center`}>
                        <i className="fas fa-plus"></i>
                    </button>
                </form>
            )}

            <div className="flex-1 overflow-y-auto min-h-0 space-y-2 mb-4 pr-1">
                {displayTargets.length === 0 ? (
                    <div className="text-center text-gray-400 py-8 text-sm italic">
                        {showAnswered ? "No answered items yet." : "No active items."}
                    </div>
                ) : (
                    displayTargets.map(target => (
                        <div key={target.id} className="group flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 hover:bg-white transition-colors">
                            <span className={`text-sm font-medium ${showAnswered ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                {target.name}
                            </span>
                            <div className="flex items-center gap-1 opacity-100 transition-opacity"> 
                                {target.status === 'active' && (
                                    <button 
                                        onClick={() => handleUpdateStatus(target.id, 'answered')}
                                        className="w-8 h-8 flex items-center justify-center text-green-600 hover:bg-green-50 rounded-full"
                                        title="Mark Answered"
                                    >
                                        <i className="fas fa-check"></i>
                                    </button>
                                )}
                                {target.status === 'answered' && (
                                    <button 
                                        onClick={() => handleUpdateStatus(target.id, 'active')}
                                        className="w-8 h-8 flex items-center justify-center text-yellow-600 hover:bg-yellow-50 rounded-full"
                                        title="Mark Active"
                                    >
                                        <i className="fas fa-undo"></i>
                                    </button>
                                )}
                                <button 
                                    onClick={() => handleDelete(target.id)}
                                    className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                    title="Delete"
                                >
                                    <i className="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <button 
                onClick={() => onLog(logType, `Prayed for list (${targets.length})`)}
                className={`w-full py-2 rounded-lg font-bold transition-colors mt-auto ${isTodayLogged ? `${c.bg} ${c.text}` : `${c.btn} text-white`}`}
            >
                    {isTodayLogged ? <span><i className="fas fa-check mr-2"></i> Prayed Today</span> : "Mark All as Prayed"}
            </button>
        </div>
    );
}
