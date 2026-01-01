"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';

interface Milestone {
    id: string;
    title: string;
    isCompleted: boolean;
}

function CreateGoalForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('id');

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
    }, [editId]);

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
        setLoading(true);

        const goalData = {
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
            router.push('/admin/goals');
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

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm space-y-6">
                
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Year</label>
                        <input 
                            type="number" 
                            required
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Priority</label>
                        <select 
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
                    <input 
                        type="text" 
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Expand Music Team"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                    <textarea 
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Goal details..."
                    />
                </div>

                {/* Status Override */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                    <select 
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="planned">Planned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="on_hold">On Hold</option>
                    </select>
                </div>

                {/* Milestones */}
                <div className="border-t border-gray-100 pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <label className="block text-sm font-bold text-gray-700">Milestones</label>
                        <button 
                            type="button"
                            onClick={handleAddMilestone}
                            className="text-xs text-blue-600 font-bold hover:underline"
                        >
                            + Add Milestone
                        </button>
                    </div>
                    
                    <div className="space-y-3">
                        {milestones.map((ms, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <input 
                                    type="checkbox"
                                    checked={ms.isCompleted}
                                    onChange={() => toggleMilestone(idx)}
                                    className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                                    title="Mark as completed"
                                />
                                <input 
                                    type="text" 
                                    value={ms.title}
                                    onChange={(e) => handleMilestoneChange(idx, e.target.value)}
                                    placeholder={`Milestone ${idx + 1}`}
                                    className="flex-1 border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                                <button 
                                    type="button" 
                                    onClick={() => removeMilestone(idx)}
                                    className="text-red-400 hover:text-red-600"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        ))}
                         {milestones.length === 0 && (
                            <p className="text-sm text-gray-400 italic">No milestones added yet. Break down your goal into small steps.</p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                    <button 
                        type="button"
                        onClick={() => router.back()}
                        className="px-5 py-2.5 rounded-lg text-gray-600 font-bold hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        disabled={loading}
                        className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Goal'}
                    </button>
                </div>

            </form>
        </div>
    );
}

export default function CreateGoalPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CreateGoalForm />
        </Suspense>
    );
}
