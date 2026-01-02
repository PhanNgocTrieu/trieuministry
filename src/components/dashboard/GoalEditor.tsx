"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

interface Milestone {
    id: string;
    title: string;
    isCompleted: boolean;
}

interface GoalEditorProps {
    basePath: string; // URL to redirect back to, e.g. '/dashboard/goals'
}

export default function GoalEditor({ basePath }: GoalEditorProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('id');
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());
    const [priority, setPriority] = useState('medium');
    const [status, setStatus] = useState('planned');
    
    // New Fields
    const [type, setType] = useState<'milestone' | 'target' | 'savings' | 'simple'>('milestone');
    
    // Milestone Type
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    
    // Target/Savings Type
    const [targetValue, setTargetValue] = useState('');
    const [currentValue, setCurrentValue] = useState('');
    const [unit, setUnit] = useState('');

    // Simple Type
    const [isCompleted, setIsCompleted] = useState(false);

    useEffect(() => {
        if (editId) {
            const fetchGoal = async () => {
                const docRef = doc(db, "goals", editId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.userId && user && data.userId !== user.uid) {
                        alert("You do not have permission to edit this goal.");
                        router.push(basePath);
                        return;
                    }

                    setTitle(data.title);
                    setDescription(data.description);
                    setYear(data.year);
                    setPriority(data.priority || 'medium');
                    setStatus(data.status);
                    setType(data.type || 'milestone');
                    
                    // Load type specific data
                    setMilestones(data.milestones || []);
                    setTargetValue(data.targetValue ? data.targetValue.toString() : '');
                    setCurrentValue(data.currentValue ? data.currentValue.toString() : '');
                    setUnit(data.unit || '');
                    setIsCompleted(data.isCompleted || false);
                }
            };
            fetchGoal();
        }
    }, [editId, user, router, basePath]);

    const handleAddMilestone = () => {
        setMilestones([...milestones, { id: Date.now().toString(), title: '', isCompleted: false }]);
    };

    const handleMilestoneChange = (index: number, val: string) => {
        const newM = [...milestones];
        newM[index].title = val;
        setMilestones(newM);
    };

    const toggleMilestone = (index: number) => {
        const newM = [...milestones];
        newM[index].isCompleted = !newM[index].isCompleted;
        setMilestones(newM);
    };

    const removeMilestone = (index: number) => {
        const newM = [...milestones];
        newM.splice(index, 1);
        setMilestones(newM);
    };

    const calculateProgress = () => {
        if (type === 'milestone') {
            if (milestones.length === 0) return 0;
            const completed = milestones.filter(m => m.isCompleted).length;
            return (completed / milestones.length) * 100;
        } else if (type === 'target' || type === 'savings') {
            const target = parseFloat(targetValue) || 1;
            const current = parseFloat(currentValue) || 0;
            return Math.min(100, (current / target) * 100);
        } else if (type === 'simple') {
            return isCompleted ? 100 : 0;
        }
        return 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            alert("You must be logged in.");
            return;
        }
        setLoading(true);

        const goalData: any = {
            userId: user.uid,
            title,
            description,
            year,
            priority,
            status,
            type,
            progress: calculateProgress(),
            updatedAt: serverTimestamp()
        };

        if (type === 'milestone') {
            goalData.milestones = milestones.filter(m => m.title.trim() !== '');
        } else if (type === 'target' || type === 'savings') {
            goalData.targetValue = parseFloat(targetValue) || 0;
            goalData.currentValue = parseFloat(currentValue) || 0;
            goalData.unit = type === 'savings' ? 'VND' : unit;
        } else if (type === 'simple') {
            goalData.isCompleted = isCompleted;
            // Auto update status if completed
            if (isCompleted) goalData.status = 'completed';
        }

        try {
            if (editId) {
                await updateDoc(doc(db, "goals", editId), goalData);
            } else {
                await addDoc(collection(db, "goals"), {
                    ...goalData,
                    createdAt: serverTimestamp()
                });
            }
            router.push(basePath);
        } catch (error) {
            console.error(error);
            alert("Error saving goal");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
                {editId ? 'Edit Goal' : 'Create New Goal'}
            </h1>

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-8">
                
                {/* Type Selection */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {[
                        { id: 'milestone', label: 'Milestone', icon: 'fa-stream' },
                        { id: 'target', label: 'Target', icon: 'fa-bullseye' },
                        { id: 'savings', label: 'Savings', icon: 'fa-coins' },
                        { id: 'simple', label: 'Simple', icon: 'fa-check-circle' }
                    ].map(t => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setType(t.id as any)}
                            className={`py-4 px-2 rounded-xl font-bold text-sm capitalize border-2 transition-all flex flex-col items-center gap-2 ${
                                type === t.id 
                                ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' 
                                : 'bg-white text-gray-500 border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                            }`}
                        >
                            <i className={`fas ${t.icon} text-lg mb-0.5`}></i>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Year</label>
                        <input 
                            type="number" 
                            required
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-gray-900 shadow-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Priority</label>
                        <div className="relative">
                            <select 
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-gray-700 appearance-none shadow-sm"
                            >
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                <i className="fas fa-chevron-down text-xs"></i>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Status</label>
                         <div className="relative">
                            <select 
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-gray-700 appearance-none shadow-sm"
                            >
                                <option value="planned">Planned</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="on_hold">On Hold</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                <i className="fas fa-chevron-down text-xs"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Goal Title</label>
                    <input 
                        type="text" 
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-5 py-4 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-xl text-gray-900 placeholder:text-gray-300 shadow-sm"
                        placeholder="e.g., Run a Marathon"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Description</label>
                    <textarea 
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-gray-700 resize-none placeholder:text-gray-400 shadow-sm"
                        placeholder="Details..."
                    />
                </div>

                {/* Dynamic Fields Based on Type */}
                
                {/* 1. Milestone Type */}
                {type === 'milestone' && (
                    <div className="border-t border-gray-100 pt-8">
                        <div className="flex justify-between items-center mb-6">
                            <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                                 <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                                 Milestones & Key Steps
                            </label>
                            <button 
                                type="button"
                                onClick={handleAddMilestone}
                                className="text-sm text-blue-600 font-bold hover:text-blue-700 flex items-center gap-2 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors"
                            >
                                <i className="fas fa-plus"></i> Add Milestone
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {milestones.map((ms, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm group hover:border-blue-300 transition-all focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:border-blue-500">
                                    <div className="pl-1">
                                        <input 
                                            type="checkbox"
                                            checked={ms.isCompleted}
                                            onChange={() => toggleMilestone(idx)}
                                            className="h-5 w-5 text-blue-600 rounded-md border-gray-300 focus:ring-blue-500 cursor-pointer"
                                            title="Mark as completed"
                                        />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={ms.title}
                                        onChange={(e) => handleMilestoneChange(idx, e.target.value)}
                                        placeholder={`Milestone ${idx + 1}`}
                                        className="flex-1 bg-transparent border-none text-sm font-bold text-gray-700 placeholder:text-gray-300 focus:ring-0 p-0"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => removeMilestone(idx)}
                                        className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <i className="fas fa-times text-sm"></i>
                                    </button>
                                </div>
                            ))}
                            {milestones.length === 0 && (
                                <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
                                        <i className="fas fa-list-ul"></i>
                                    </div>
                                    <p className="text-sm text-gray-500 font-medium">No milestones yet.</p>
                                    <p className="text-xs text-gray-400">Add steps to track your progress.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 2. Target / Savings Type */}
                {(type === 'target' || type === 'savings') && (
                    <div className="border-t border-gray-100 pt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Current Value</label>
                            <input 
                                type="number" 
                                value={currentValue}
                                onChange={(e) => setCurrentValue(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-gray-900 shadow-sm placeholder:text-gray-300"
                                placeholder="0"
                            />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Target Value</label>
                            <input 
                                type="number" 
                                required
                                value={targetValue}
                                onChange={(e) => setTargetValue(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-gray-900 shadow-sm placeholder:text-gray-300"
                                placeholder="Target"
                            />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Unit</label>
                            <input 
                                type="text" 
                                value={type === 'savings' ? 'VND' : unit}
                                disabled={type === 'savings'}
                                onChange={(e) => setUnit(e.target.value)}
                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-gray-900 shadow-sm placeholder:text-gray-300 ${
                                    type === 'savings' ? 'bg-gray-50 text-gray-500' : 'bg-white'
                                }`}
                                placeholder={type === 'savings' ? 'VND' : 'e.g. Books, Km'}
                            />
                        </div>
                    </div>
                )}

                {/* 3. Simple Type */}
                {type === 'simple' && (
                    <div className="border-t border-gray-100 pt-8 pb-4">
                         <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <input 
                                type="checkbox"
                                id="isCompleted"
                                checked={isCompleted}
                                onChange={(e) => setIsCompleted(e.target.checked)}
                                className="h-6 w-6 text-green-600 rounded-md border-gray-300 focus:ring-green-500 cursor-pointer"
                            />
                            <label htmlFor="isCompleted" className="text-gray-900 font-bold cursor-pointer select-none">
                                Mark as Completed
                            </label>
                        </div>
                    </div>
                )}


                {/* Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                    <button 
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
                    >
                         {loading ? 'Saving...' : 'Save Goal'}
                    </button>
                </div>

            </form>
        </div>
    );
}
