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
    const [milestones, setMilestones] = useState<Milestone[]>([]);

    useEffect(() => {
        if (editId) {
            const fetchGoal = async () => {
                const docRef = doc(db, "goals", editId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    // Validate ownership if needed, though Firestore rules should handle this
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
                    setMilestones(data.milestones || []);
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
        if (milestones.length === 0) return 0;
        const completed = milestones.filter(m => m.isCompleted).length;
        return (completed / milestones.length) * 100;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            alert("You must be logged in.");
            return;
        }
        setLoading(true);

        const goalData = {
            userId: user.uid, // Bind to current user
            title,
            description,
            year,
            priority,
            status,
            milestones: milestones.filter(m => m.title.trim() !== ''),
            progress: calculateProgress(),
            updatedAt: serverTimestamp()
        };

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
                
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Year</label>
                        <input 
                            type="number" 
                            required
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm font-medium"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Priority</label>
                        <div className="relative">
                            <select 
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm font-bold text-gray-700 appearance-none"
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
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Goal Title</label>
                    <input 
                        type="text" 
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm font-medium placeholder:text-gray-400 text-lg"
                        placeholder="e.g., Expand Music Team"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Description</label>
                    <textarea 
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm font-medium placeholder:text-gray-400 resize-none"
                        placeholder="Describe the details and expected outcome of this goal..."
                    />
                </div>

                {/* Status Override */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Current Status</label>
                    <div className="relative">
                        <select 
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm font-bold text-gray-700 appearance-none"
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

                {/* Milestones */}
                <div className="border-t border-gray-100 pt-8">
                    <div className="flex justify-between items-center mb-6">
                        <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                             <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                             Milestones & Key Steps
                        </label>
                        <button 
                            type="button"
                            onClick={handleAddMilestone}
                            className="text-sm text-blue-600 font-bold hover:text-blue-700 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <i className="fas fa-plus"></i> Add Milestone
                        </button>
                    </div>
                    
                    <div className="space-y-3">
                        {milestones.map((ms, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-gray-100 group hover:border-blue-200 hover:bg-white hover:shadow-sm transition-all">
                                <div className="pl-2">
                                    <input 
                                        type="checkbox"
                                        checked={ms.isCompleted}
                                        onChange={() => toggleMilestone(idx)}
                                        className="h-5 w-5 text-blue-600 rounded-md border-gray-300 focus:ring-blue-500 transition-all cursor-pointer"
                                        title="Mark as completed"
                                    />
                                </div>
                                <input 
                                    type="text" 
                                    value={ms.title}
                                    onChange={(e) => handleMilestoneChange(idx, e.target.value)}
                                    placeholder={`Milestone ${idx + 1}`}
                                    className="flex-1 bg-transparent border-none text-sm font-medium focus:ring-0 text-gray-700 placeholder:text-gray-400"
                                />
                                <button 
                                    type="button" 
                                    onClick={() => removeMilestone(idx)}
                                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <i className="fas fa-times text-sm"></i>
                                </button>
                            </div>
                        ))}
                         {milestones.length === 0 && (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                <p className="text-sm text-gray-500 font-medium">No milestones added yet.</p>
                                <p className="text-xs text-gray-400 mt-1">Break down your goal into smaller, actionable steps.</p>
                            </div>
                        )}
                    </div>
                </div>

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
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <i className="fas fa-spinner fa-spin"></i> Saving...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <i className="fas fa-save"></i> Save Goal
                            </span>
                        )}
                    </button>
                </div>

            </form>
        </div>
    );
}
