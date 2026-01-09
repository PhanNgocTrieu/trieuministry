"use client";


// Force rebuild check 2
import React, { useState, useEffect } from 'react';
import { Task, TaskFormData } from './types';
import { db } from '@/lib/firebase';
import { collection, getDocs, Timestamp } from 'firebase/firestore';

interface TaskFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: TaskFormData) => Promise<void>;
    initialData?: Task;
}

export default function TaskFormModal({ isOpen, onClose, onSubmit, initialData }: TaskFormModalProps) {
    if (!isOpen) return null;

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<TaskFormData>({
        content: '',
        priority: 'medium',
        category: 'General',
        receiveFrom: '',
        ...initialData
    });

    // Date handling
    const [dateInput, setDateInput] = useState('');
    const [timeInput, setTimeInput] = useState('');

    const [categories, setCategories] = useState<string[]>(['General', 'Ministry', 'Personal', 'Urgent']);
    const [isCustomCategory, setIsCustomCategory] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
            // Parse timestamp to date/time inputs
            if (initialData.deadline) {
                const date = initialData.deadline.toDate();
                setDateInput(date.toISOString().split('T')[0]); // YYYY-MM-DD
                setTimeInput(date.toTimeString().slice(0, 5)); // HH:MM
            }
        } else {
            // Defaults
            setFormData({
                content: '',
                priority: 'medium',
                category: 'General',
                receiveFrom: '',
            });
            setDateInput('');
            setTimeInput('');
        }
    }, [initialData, isOpen]);

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            // Using ministry_categories as requested "same as ministry page"
            try {
                const catsSnapshot = await getDocs(collection(db, "ministry_categories"));
                const storedCategories = new Set<string>(['General', 'Ministry', 'Personal']);
                catsSnapshot.forEach(doc => storedCategories.add(doc.data().name));
                setCategories(Array.from(storedCategories).sort());
            } catch (err) {
                console.error("Error fetching categories:", err);
            }
        };
        fetchCategories();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const dataToSubmit = { ...formData };
            if (dateInput) {
                const dateObj = new Date(`${dateInput}T${timeInput || '23:59'}`);
                dataToSubmit.deadline = Timestamp.fromDate(dateObj);
            } else {
                dataToSubmit.deadline = null;
            }
            await onSubmit(dataToSubmit);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                        {initialData ? 'Edit Task' : 'Add New Task'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Content */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Task Content</label>
                        <textarea
                            required
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                            placeholder="What needs to be done?"
                            value={formData.content}
                            onChange={e => setFormData({...formData, content: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Priority */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Priority</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                value={formData.priority}
                                onChange={e => setFormData({...formData, priority: e.target.value as any})}
                            >
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>

                        {/* Receive From */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Receive From</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                                placeholder="e.g. Pastor A"
                                value={formData.receiveFrom || ''}
                                onChange={e => setFormData({...formData, receiveFrom: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Category</label>
                        <div className="flex gap-2">
                             {isCustomCategory ? (
                                <input 
                                    type="text" 
                                    required
                                    value={formData.category} 
                                    onChange={e => setFormData({...formData, category: e.target.value})}
                                    className="w-full px-3 py-2 border border-blue-300 dark:border-blue-500/30 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 dark:bg-blue-500/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                                    placeholder="Type new category..."
                                    autoFocus
                                />
                            ) : (
                                <select
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                    value={formData.category}
                                    onChange={(e) => {
                                        if (e.target.value === '__NEW__') {
                                            setIsCustomCategory(true);
                                            setFormData(prev => ({ ...prev, category: '' }));
                                        } else {
                                            setFormData(prev => ({ ...prev, category: e.target.value }));
                                        }
                                    }}
                                >
                                    {categories.map((cat, idx) => (
                                        <option key={idx} value={cat}>{cat}</option>
                                    ))}
                                    <option value="__NEW__" className="font-bold text-blue-600 dark:text-blue-400">+ New Category</option>
                                </select>
                            )}
                            <button
                                type="button"
                                onClick={() => setIsCustomCategory(!isCustomCategory)}
                                className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-slate-300 transition-colors"
                                title={isCustomCategory ? "Select Existing" : "Create New"}
                            >
                                <i className={`fas ${isCustomCategory ? 'fa-list' : 'fa-plus'}`}></i>
                            </button>
                        </div>
                    </div>


                    {/* Deadline */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Deadline</label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                className="flex-1 px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                value={dateInput}
                                onChange={e => setDateInput(e.target.value)}
                            />
                            <input
                                type="time"
                                className="w-32 px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                value={timeInput}
                                onChange={e => setTimeInput(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg font-bold text-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm transition-colors shadow-sm"
                        >
                            {loading ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Task')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
