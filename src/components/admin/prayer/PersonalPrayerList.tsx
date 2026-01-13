"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { useModal } from '@/context/ModalContext';
import { format } from 'date-fns';

interface Target {
    id: string;
    userId: string;
    name: string;
    description?: string;
    category?: string;
    status: 'active' | 'answered';
    createdAt: any;
}

export default function PersonalPrayerList() {
    const { user } = useAuth();
    const { showAlert, showConfirm } = useModal();
    const [targets, setTargets] = useState<Target[]>([]);
    const [loading, setLoading] = useState(true);
    
    // UI State
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'view' | 'edit' | 'create'>('view');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'answered'>('active');
    const [searchTerm, setSearchTerm] = useState("");

    // Form State
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");

    useEffect(() => {
        if (user) {
            fetchTargets();
        }
    }, [user]);

    // Auto-select first item on load or filter change
    useEffect(() => {
        if (!selectedId && targets.length > 0) {
             const firstVisible = getFilteredTargets()[0];
             if (firstVisible) {
                 setSelectedId(firstVisible.id);
                 setViewMode('view');
             }
        }
    }, [targets, filterStatus]);

    const fetchTargets = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const q = query(
                collection(db, 'personal_prayer_targets'),
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            const fetched: Target[] = [];
            snapshot.forEach(doc => {
                fetched.push({ id: doc.id, ...doc.data() } as Target);
            });
            setTargets(fetched);
            // Initial selection logic handled by useEffect
        } catch (error) {
            console.error("Error fetching items:", error);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredTargets = () => {
        let filtered = targets;
        
        // Status Filter
        if (filterStatus !== 'all') {
            filtered = filtered.filter(t => t.status === filterStatus);
        }

        // Search Filter
        if (searchTerm.trim()) {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(t => 
                t.name.toLowerCase().includes(lowerTerm) || 
                t.category?.toLowerCase().includes(lowerTerm) ||
                t.description?.toLowerCase().includes(lowerTerm)
            );
        }

        return filtered;
    };

    const handleSelect = (id: string) => {
        setSelectedId(id);
        setViewMode('view');
        // Reset form just in case
        setName("");
        setDescription("");
        setCategory("");
    };

    const handleCreateNew = () => {
        setSelectedId(null);
        setName("");
        setDescription("");
        setCategory("");
        setViewMode('create');
    };

    const handleEdit = (target: Target) => {
        setName(target.name);
        setDescription(target.description || "");
        setCategory(target.category || "");
        setViewMode('edit');
    };

    const handleCancelForm = () => {
        if (viewMode === 'create' && targets.length > 0) {
            // If cancelling create, go back to first item or previous selection
            const first = getFilteredTargets()[0];
            if (first) {
                handleSelect(first.id);
            } else {
                setViewMode('view'); // Empty state
            }
        } else {
            // If cancelling edit, just go back to view
            setViewMode('view');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !name.trim()) return;

        try {
            if (viewMode === 'edit' && selectedId) {
                // Update
                const docRef = doc(db, 'personal_prayer_targets', selectedId);
                await updateDoc(docRef, {
                    name: name.trim(),
                    description: description.trim(),
                    category: category.trim(),
                    updatedAt: serverTimestamp()
                });

                setTargets(targets.map(t => t.id === selectedId ? { ...t, name, description, category } : t));
                showAlert("Success", "Prayer request updated.");
                setViewMode('view');
            } else if (viewMode === 'create') {
                // Create
                const docRef = await addDoc(collection(db, 'personal_prayer_targets'), {
                    userId: user.uid,
                    name: name.trim(),
                    description: description.trim(),
                    category: category.trim(),
                    status: 'active',
                    createdAt: serverTimestamp()
                });

                const newTarget: Target = {
                    id: docRef.id,
                    userId: user.uid,
                    name: name.trim(),
                    description: description.trim(),
                    category: category.trim(),
                    status: 'active',
                    createdAt: { seconds: Date.now() / 1000 }
                };
                
                const newTargets = [newTarget, ...targets];
                setTargets(newTargets);
                setSelectedId(newTarget.id); // Select the new item
                setViewMode('view');
                showAlert("Success", "Added to personal prayer list.");
            }
        } catch (error) {
            console.error("Error saving item:", error);
            showAlert("Error", "Failed to save item");
        }
    };

    const handleUpdateStatus = async (id: string, currentStatus: 'active' | 'answered') => {
        // Optimistic Update
        const newStatus = currentStatus === 'active' ? 'answered' : 'active';
        setTargets(targets.map(t => t.id === id ? { ...t, status: newStatus } : t));

        try {
            await updateDoc(doc(db, 'personal_prayer_targets', id), { status: newStatus });
        } catch (error) {
            console.error("Error updating status:", error);
            showAlert("Error", "Failed to update status");
            // Revert on error
            setTargets(targets.map(t => t.id === id ? { ...t, status: currentStatus } : t));
        }
    };

    const handleDelete = async (id: string | null) => {
        if (!id) return;
        
        showConfirm(
            "Delete Item",
            "Are you sure you want to delete this item?",
            async () => {
                try {
                    await deleteDoc(doc(db, 'personal_prayer_targets', id));
                    const newTargets = targets.filter(t => t.id !== id);
                    setTargets(newTargets);
                    
                    if (newTargets.length > 0) {
                        setSelectedId(newTargets[0].id);
                        setViewMode('view');
                    } else {
                        setSelectedId(null);
                        handleCreateNew(); // Or empty state
                    }
                    showAlert("Success", "Item deleted.");
                } catch (error) {
                    console.error("Error deleting:", error);
                    showAlert("Error", "Failed to delete item");
                }
            },
            true, "Delete"
        );
    };

    const handlePray = async (id: string | null) => {
        if (!user || !id) return;
        showAlert("Prayer Logged", "Your personal prayer has been recorded for today.");
        try {
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const docId = `${user.uid}_${todayStr}_personal_prayer`;
            await setDoc(doc(db, 'discipline_logs', docId), {
                userId: user.uid,
                date: todayStr,
                type: 'personal_prayer',
                completed: true,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error("Error logging discipline:", error);
        }
    };

    const visibleTargets = getFilteredTargets();
    const selectedTarget = targets.find(t => t.id === selectedId);

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-200px)] min-h-[600px] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-slate-900 animate-fade-in">
            
            {/* LEFT SIDEBAR: LIST */}
            <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-white/10 flex flex-col bg-slate-50 dark:bg-slate-950/50">
                {/* Header / Search */}
                <div className="p-4 border-b border-slate-200 dark:border-white/10 space-y-3">
                     <div className="flex justify-between items-center">
                        <h2 className="font-bold text-slate-700 dark:text-slate-200">Prayer List</h2>
                        <button 
                            onClick={handleCreateNew}
                            className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors shadow-lg shadow-green-900/20"
                            title="Add New Request"
                        >
                            <i className="fas fa-plus"></i>
                        </button>
                    </div>

                    <div className="relative">
                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                        <input 
                            type="text" 
                            placeholder="Search prayers..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                        />
                    </div>

                    <div className="flex p-1 bg-slate-200 dark:bg-slate-800 rounded-lg">
                        <button 
                            onClick={() => setFilterStatus('active')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${filterStatus === 'active' ? 'bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            Active
                        </button>
                        <button 
                            onClick={() => setFilterStatus('answered')}
                             className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${filterStatus === 'answered' ? 'bg-white dark:bg-slate-700 text-yellow-600 dark:text-yellow-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            Answered
                        </button>
                         <button 
                            onClick={() => setFilterStatus('all')}
                             className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${filterStatus === 'all' ? 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            All
                        </button>
                    </div>
                </div>

                {/* List Items */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500 text-sm">Loading...</div>
                    ) : visibleTargets.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm italic">
                            {searchTerm ? "No matches found." : "No prayer requests."}
                        </div>
                    ) : (
                        visibleTargets.map(target => (
                            <div 
                                key={target.id}
                                onClick={() => handleSelect(target.id)}
                                className={`p-4 border-b border-slate-100 dark:border-white/5 cursor-pointer transition-all hover:bg-white dark:hover:bg-slate-900 ${
                                    selectedId === target.id 
                                        ? 'bg-white dark:bg-slate-900 border-l-4 border-l-green-500 shadow-sm' 
                                        : 'bg-transparent border-l-4 border-l-transparent text-slate-600 dark:text-slate-400'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={`font-bold text-sm line-clamp-1 ${selectedId === target.id ? 'text-slate-900 dark:text-white' : ''}`}>
                                        {target.name}
                                    </h3>
                                    {target.status === 'answered' && (
                                        <i className="fas fa-check-circle text-yellow-500 text-xs" title="Answered"></i>
                                    )}
                                </div>
                                <div className="flex justify-between items-center">
                                     <p className="text-xs text-slate-500 line-clamp-1 flex-1 mr-2 opacity-80">
                                        {target.category || "General"}
                                     </p>
                                     <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                        {target.createdAt?.seconds ? new Date(target.createdAt.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                                     </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT MAIN: CONTENT / FORM */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900 relative">
                {viewMode === 'create' ? (
                     // CREATE FORM
                    <div className="flex-1 flex flex-col h-full animate-fadeIn">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-green-50/50 dark:bg-green-900/10">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <i className="fas fa-plus-circle text-green-500"></i> New Prayer Request
                                </h2>
                                <p className="text-sm text-slate-500">Share what's on your heart.</p>
                            </div>
                            <button onClick={handleCancelForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <i className="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 md:p-10">
                             <form id="create-form" onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Prayer Title</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Grandma's Health"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-lg font-bold"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category</label>
                                    <input
                                        type="text"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        placeholder="e.g. Family, Work, Health"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Details & Context</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Add any specific details, scripture, or context..."
                                        rows={6}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-green-500 outline-none resize-none leading-relaxed"
                                    ></textarea>
                                </div>
                             </form>
                        </div>
                        <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
                            <button onClick={handleCancelForm} className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                form="create-form"
                                disabled={!name.trim()}
                                className="px-8 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-900/20 disabled:opacity-50 disabled:shadow-none"
                            >
                                Save Request
                            </button>
                        </div>
                    </div>
                ) : viewMode === 'edit' && selectedTarget ? (
                    // EDIT FORM
                    <div className="flex-1 flex flex-col h-full animate-fadeIn">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-blue-50/50 dark:bg-blue-900/10">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <i className="fas fa-edit text-blue-500"></i> Editing Request
                                </h2>
                            </div>
                            <button onClick={handleCancelForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <i className="fas fa-times text-xl"></i>
                            </button>
                        </div>
                         <div className="flex-1 overflow-y-auto p-6 md:p-10">
                             <form id="edit-form" onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Prayer Title</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Grandma's Health"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category</label>
                                    <input
                                        type="text"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        placeholder="e.g. Family, Work, Health"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Details & Context</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Add any specific details, scripture, or context..."
                                        rows={6}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none leading-relaxed"
                                    ></textarea>
                                </div>
                             </form>
                        </div>
                        <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
                            <button onClick={handleCancelForm} className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                form="edit-form"
                                disabled={!name.trim()}
                                className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:shadow-none"
                            >
                                Update Request
                            </button>
                        </div>
                    </div>
                ) : selectedTarget ? (
                    // VIEW MODE
                    <div className="flex-1 flex flex-col h-full animate-fadeIn">
                        {/* Header Actions */}
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-start bg-slate-50/50 dark:bg-slate-900/50">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                     <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                                        selectedTarget.status === 'answered'
                                            ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
                                            : 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                                    }`}>
                                        {selectedTarget.status}
                                    </span>
                                    {selectedTarget.category && (
                                         <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                                            {selectedTarget.category}
                                         </span>
                                    )}
                                </div>
                                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                                    {selectedTarget.name}
                                </h1>
                                <p className="text-sm text-slate-500 mt-2 flex items-center gap-2">
                                    <i className="far fa-calendar-alt"></i>
                                    Added on {selectedTarget.createdAt?.seconds ? new Date(selectedTarget.createdAt.seconds * 1000).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Recently'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => handleUpdateStatus(selectedTarget.id, selectedTarget.status)}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                                        selectedTarget.status === 'answered'
                                            ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20'
                                            : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-white/10 hover:text-green-500 hover:border-green-500'
                                    }`}
                                    title={selectedTarget.status === 'active' ? "Mark Answered" : "Mark Active"}
                                >
                                    <i className={`fas ${selectedTarget.status === 'answered' ? 'fa-undo' : 'fa-check'}`}></i>
                                </button>
                                <button 
                                    onClick={() => handleEdit(selectedTarget)}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-all"
                                    title="Edit"
                                >
                                    <i className="fas fa-edit"></i>
                                </button>
                                <button 
                                    onClick={() => handleDelete(selectedTarget.id)}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-red-500 hover:border-red-500 transition-all"
                                    title="Delete"
                                >
                                    <i className="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>

                        {/* Content Body */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-10">
                            {selectedTarget.description ? (
                                <div className="prose dark:prose-invert max-w-none">
                                    <p className="whitespace-pre-line text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                                        {selectedTarget.description}
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center py-20 text-slate-400 italic">
                                    <p>No additional details provided.</p>
                                    <button 
                                        onClick={() => handleEdit(selectedTarget)}
                                        className="text-green-500 hover:underline mt-2 text-sm"
                                    >
                                        Add details
                                    </button>
                                </div>
                            )}

                             {selectedTarget.status === 'answered' && (
                                <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-500/20 rounded-xl p-4 flex items-start gap-4">
                                    <i className="fas fa-star text-yellow-500 mt-1"></i>
                                    <div>
                                        <h4 className="font-bold text-yellow-800 dark:text-yellow-400 text-sm">Praise God!</h4>
                                        <p className="text-yellow-700 dark:text-yellow-300/80 text-sm mt-1">This prayer has been marked as answered. Remember to give thanks!</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Action */}
                         <div className="p-6 border-t border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden md:block">
                                 {selectedTarget.status === 'active' ? 'Keep Praying' : 'Answered Prayer'}
                             </span>
                             {selectedTarget.status === 'active' && (
                                 <button 
                                    onClick={() => handlePray(selectedTarget.id)}
                                    className="w-full md:w-auto px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 hover:shadow-lg hover:shadow-green-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <i className="fas fa-praying-hands"></i>
                                    I Prayed Today
                                </button>
                             )}
                        </div>
                    </div>
                ) : (
                    // EMPTY STATE
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-50">
                         <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-300 dark:text-slate-600">
                             <i className="fas fa-praying-hands text-4xl"></i>
                         </div>
                         <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">My Prayer Space</h3>
                         <p className="text-slate-500 max-w-sm">Select a prayer request from the left to view details or start a new one.</p>
                         <button 
                            onClick={handleCreateNew}
                            className="mt-6 px-6 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700"
                        >
                            Create New Request
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

