"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, doc, updateDoc, deleteDoc, setDoc, increment } from 'firebase/firestore';
import { useModal } from '@/context/ModalContext';
import { format } from 'date-fns';

interface Target {
    id: string;
    userId: string;
    name: string;
    title?: string;
    description?: string;
    commitmentTime?: string;
    prayerCount?: number;
    status: 'active' | 'answered';
    createdAt: any;
}

export default function IntercessoryList() {
    const { user } = useAuth();
    const { showAlert, showConfirm } = useModal();
    const [targets, setTargets] = useState<Target[]>([]);
    const [loading, setLoading] = useState(true);
    
    // UI State
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'view' | 'edit' | 'create'>('view');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'answered'>('active');
    const [searchTerm, setSearchTerm] = useState("");

    // Form Stats
    const [name, setName] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [commitmentTime, setCommitmentTime] = useState("");

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
                collection(db, 'intercession_targets'),
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
                t.title?.toLowerCase().includes(lowerTerm) ||
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
        setTitle("");
        setDescription("");
        setCommitmentTime("");
    };

    const handleCreateNew = () => {
        setSelectedId(null);
        setName("");
        setTitle("");
        setDescription("");
        setCommitmentTime("");
        setViewMode('create');
    };

    const handleEdit = (target: Target) => {
        setName(target.name);
        setTitle(target.title || "");
        setDescription(target.description || "");
        setCommitmentTime(target.commitmentTime || "");
        setViewMode('edit');
    };

    const handleCancelForm = () => {
        if (viewMode === 'create' && targets.length > 0) {
            const first = getFilteredTargets()[0];
            if (first) {
                handleSelect(first.id);
            } else {
                setViewMode('view');
            }
        } else {
            setViewMode('view');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !name.trim()) return;

        try {
            const payload = {
                userId: user.uid,
                name: name.trim(),
                title: title.trim(),
                description: description.trim(),
                commitmentTime: commitmentTime.trim(),
                status: 'active' as const,
            };

            if (viewMode === 'edit' && selectedId) {
                // Update
                const docRef = doc(db, 'intercession_targets', selectedId);
                await updateDoc(docRef, {
                    name: name.trim(),
                    title: title.trim(),
                    description: description.trim(),
                    commitmentTime: commitmentTime.trim(),
                    updatedAt: serverTimestamp()
                });

                setTargets(targets.map(t => t.id === selectedId ? { ...t, name, title, description, commitmentTime } : t));
                showAlert("Success", "Intercession target updated.");
                setViewMode('view');
            } else if (viewMode === 'create') {
                // Create
                const docRef = await addDoc(collection(db, 'intercession_targets'), {
                    ...payload,
                    createdAt: serverTimestamp(),
                    prayerCount: 0
                });

                const newTarget: Target = {
                    id: docRef.id,
                    ...payload,
                    prayerCount: 0,
                    createdAt: { seconds: Date.now() / 1000 }
                };
                
                const newTargets = [newTarget, ...targets];
                setTargets(newTargets);
                setSelectedId(newTarget.id);
                setViewMode('view');
                showAlert("Success", "Added to intercession list.");
            }
        } catch (error) {
            console.error("Error saving item:", error);
            showAlert("Error", "Failed to save item");
        }
    };

    const handleUpdateStatus = async (id: string, currentStatus: 'active' | 'answered') => {
        const newStatus = currentStatus === 'active' ? 'answered' : 'active';
        setTargets(targets.map(t => t.id === id ? { ...t, status: newStatus } : t));

        try {
            await updateDoc(doc(db, 'intercession_targets', id), { status: newStatus });
        } catch (error) {
            console.error("Error updating status:", error);
            showAlert("Error", "Failed to update status");
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
                    await deleteDoc(doc(db, 'intercession_targets', id));
                    const newTargets = targets.filter(t => t.id !== id);
                    setTargets(newTargets);
                    
                    if (newTargets.length > 0) {
                        setSelectedId(newTargets[0].id);
                        setViewMode('view');
                    } else {
                        setSelectedId(null);
                        handleCreateNew();
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
        
        // Optimistic update for prayer count
        setTargets(targets.map(t => t.id === id ? { ...t, prayerCount: (t.prayerCount || 0) + 1 } : t));
        showAlert("Prayer Logged", "Your intercession has been recorded.");

        try {
            // 1. Update Target Prayer Count
            const targetRef = doc(db, 'intercession_targets', id);
            await updateDoc(targetRef, {
                prayerCount: increment(1)
            });

            // 2. Log Discipline
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const docId = `${user.uid}_${todayStr}_intercession`;
            await setDoc(doc(db, 'discipline_logs', docId), {
                userId: user.uid,
                date: todayStr,
                type: 'intercession',
                completed: true,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error("Error logging discipline:", error);
            // Revert optimistic update on error if needed, but low priority
        }
    };

    const visibleTargets = getFilteredTargets();
    const selectedTarget = targets.find(t => t.id === selectedId);

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-200px)] min-h-[600px] border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-slate-900 animate-fade-in ring-1 ring-slate-900/5 dark:ring-white/5">
            
            {/* LEFT SIDEBAR: LIST */}
            <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-white/10 flex flex-col bg-slate-50/80 dark:bg-slate-950/50 backdrop-blur-sm">
                {/* Header / Search */}
                <div className="p-5 border-b border-slate-200 dark:border-white/10 space-y-4">
                     <div className="flex justify-between items-center">
                        <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                             <span className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center text-sm">
                                 <i className="fas fa-list-ul"></i>
                             </span>
                             My List
                        </h2>
                        <button 
                            onClick={handleCreateNew}
                            className="w-10 h-10 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-center hover:shadow-lg hover:shadow-violet-500/25 hover:scale-105 transition-all"
                            title="Add New Target"
                        >
                            <i className="fas fa-plus"></i>
                        </button>
                    </div>

                    <div className="relative group">
                        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors"></i>
                        <input 
                            type="text" 
                            placeholder="Search people..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all shadow-sm"
                        />
                    </div>

                    <div className="flex p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl">
                         <button 
                            onClick={() => setFilterStatus('active')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${filterStatus === 'active' ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            Active
                        </button>
                         <button 
                            onClick={() => setFilterStatus('answered')}
                             className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${filterStatus === 'answered' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            Answered
                        </button>
                         <button 
                            onClick={() => setFilterStatus('all')}
                             className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${filterStatus === 'all' ? 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            All
                        </button>
                    </div>
                </div>

                {/* List Items */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center gap-3">
                            <div className="loading-spinner-sm border-violet-500"></div>
                            Loading...
                        </div>
                    ) : visibleTargets.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm italic flex flex-col items-center gap-3 opacity-60">
                            <i className="fas fa-search text-2xl"></i>
                            {searchTerm ? "No matches found." : "No intercession targets."}
                        </div>
                    ) : (
                        visibleTargets.map(target => (
                             <div 
                                key={target.id}
                                onClick={() => handleSelect(target.id)}
                                className={`p-4 rounded-xl cursor-pointer transition-all border group ${
                                    selectedId === target.id 
                                        ? 'bg-white dark:bg-slate-800 border-violet-500 ring-1 ring-violet-500/20 shadow-md' 
                                        : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:border-slate-200 dark:hover:border-white/5'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-1.5">
                                    <h3 className={`font-bold text-sm line-clamp-1 transition-colors ${selectedId === target.id ? 'text-violet-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {target.name}
                                    </h3>
                                    {target.status === 'answered' && (
                                        <i className="fas fa-check-circle text-emerald-500 text-xs" title="Answered"></i>
                                    )}
                                </div>
                                <div className="flex justify-between items-center">
                                     <p className="text-xs text-slate-500 line-clamp-1 flex-1 mr-2 font-medium">
                                        {target.title || "General Intercession"}
                                     </p>
                                     <div className="flex items-center gap-2">
                                         {target.prayerCount ? (
                                             <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1 ${selectedId === target.id ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300' : 'bg-slate-100 dark:bg-slate-900 text-slate-400'}`}>
                                                <i className="fas fa-fire text-[8px]"></i>{target.prayerCount}
                                             </span>
                                         ) : null}
                                     </div>
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
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/30">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
                                        <i className="fas fa-plus"></i>
                                    </div>
                                    New Target
                                </h2>
                            </div>
                            <button onClick={handleCancelForm} className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                             <form id="create-form" onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-2 pl-1">Person / Group Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Who are we praying for?"
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none text-xl font-bold transition-all"
                                        autoFocus
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-400 mb-2 pl-1">Topic / Title</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="e.g. Health, Wisdom"
                                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-400 mb-2 pl-1">Commitment</label>
                                        <input
                                            type="text"
                                            value={commitmentTime}
                                            onChange={(e) => setCommitmentTime(e.target.value)}
                                            placeholder="e.g. Weekly, Daily"
                                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all font-medium"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-2 pl-1">Detailed Request</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Specific needs and context..."
                                        rows={6}
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none resize-none leading-relaxed transition-all"
                                    ></textarea>
                                </div>
                             </form>
                        </div>
                        <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900 flex justify-end gap-4">
                            <button onClick={handleCancelForm} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                form="create-form"
                                disabled={!name.trim()}
                                className="px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-violet-500/25 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:transform-none transition-all"
                            >
                                Save Target
                            </button>
                        </div>
                    </div>
                ) : viewMode === 'edit' && selectedTarget ? (
                    // EDIT FORM
                    <div className="flex-1 flex flex-col h-full animate-fadeIn">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/30">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
                                        <i className="fas fa-edit"></i>
                                    </div>
                                    Edit Target
                                </h2>
                            </div>
                            <button onClick={handleCancelForm} className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                         <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                             <form id="edit-form" onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-2 pl-1">Person / Group Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Who are we praying for?"
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none text-xl font-bold transition-all"
                                        autoFocus
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-400 mb-2 pl-1">Topic / Title</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="e.g. Health, Wisdom"
                                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-400 mb-2 pl-1">Commitment</label>
                                        <input
                                            type="text"
                                            value={commitmentTime}
                                            onChange={(e) => setCommitmentTime(e.target.value)}
                                            placeholder="e.g. Weekly, Daily"
                                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all font-medium"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-2 pl-1">Detailed Request</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Specific needs and context..."
                                        rows={6}
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none resize-none leading-relaxed transition-all"
                                    ></textarea>
                                </div>
                             </form>
                        </div>
                        <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900 flex justify-end gap-4">
                            <button onClick={handleCancelForm} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                form="edit-form"
                                disabled={!name.trim()}
                                className="px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-violet-500/25 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:transform-none transition-all"
                            >
                                Update Target
                            </button>
                        </div>
                    </div>
                ) : selectedTarget ? (
                    // VIEW MODE
                    <div className="flex-1 flex flex-col h-full animate-fadeIn relative overflow-hidden">
                        {/* Decorative background */}
                        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/5 rounded-full blur-[80px] pointer-events-none"></div>

                        {/* Header Actions */}
                        <div className="p-8 border-b border-slate-100 dark:border-white/5 relative z-10">
                            <div className="flex justify-between items-start gap-4 mb-4">
                                <div className="flex gap-2">
                                     <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border transition-all ${
                                        selectedTarget.status === 'answered'
                                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                                            : 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/30'
                                    }`}>
                                        <i className={`fas ${selectedTarget.status === 'answered' ? 'fa-check-circle' : 'fa-clock'}`}></i>
                                        {selectedTarget.status}
                                    </span>
                                    {selectedTarget.title && (
                                         <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 uppercase tracking-wide">
                                            {selectedTarget.title}
                                        </span>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleUpdateStatus(selectedTarget.id, selectedTarget.status)}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all shadow-sm ${
                                            selectedTarget.status === 'answered'
                                                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                                                : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-white/10 hover:text-emerald-500 hover:border-emerald-500 hover:shadow-md'
                                        }`}
                                        title={selectedTarget.status === 'active' ? "Mark Answered" : "Mark Active"}
                                    >
                                        <i className={`fas ${selectedTarget.status === 'answered' ? 'fa-undo' : 'fa-check'}`}></i>
                                    </button>
                                    <button 
                                        onClick={() => handleEdit(selectedTarget)}
                                        className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-violet-500 hover:border-violet-500 hover:shadow-md transition-all"
                                        title="Edit"
                                    >
                                        <i className="fas fa-edit"></i>
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(selectedTarget.id)}
                                        className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-rose-500 hover:border-rose-500 hover:shadow-md transition-all"
                                        title="Delete"
                                    >
                                        <i className="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight mb-4">
                                {selectedTarget.name}
                            </h1>
                            
                            <div className="flex flex-wrap items-center gap-6">
                                {selectedTarget.commitmentTime && (
                                    <p className="text-sm font-bold text-violet-600 dark:text-violet-400 flex items-center gap-2">
                                        <i className="fas fa-redo-alt bg-violet-100 dark:bg-violet-500/20 p-1.5 rounded-full"></i>
                                        {selectedTarget.commitmentTime}
                                    </p>
                                )}
                                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <i className="far fa-calendar-alt"></i>
                                    Added {selectedTarget.createdAt?.seconds ? new Date(selectedTarget.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                     <span className="flex items-center gap-1 bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-md font-bold text-xs">
                                         <i className="fas fa-fire"></i> {selectedTarget.prayerCount || 0}
                                     </span>
                                     Prayers
                                </p>
                            </div>
                        </div>

                        {/* Content Body */}
                        <div className="flex-1 overflow-y-auto p-8 relative z-10 custom-scrollbar">
                            {selectedTarget.description ? (
                                <div className="prose dark:prose-invert max-w-none">
                                    <p className="whitespace-pre-line text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-light">
                                        {selectedTarget.description}
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                    <div className="mb-3 text-slate-400"><i className="fas fa-pen-alt text-2xl"></i></div>
                                    <p className="text-slate-500 font-medium">No detailed request provided.</p>
                                    <button 
                                        onClick={() => handleEdit(selectedTarget)}
                                        className="text-violet-600 dark:text-violet-400 font-bold hover:underline mt-2 text-sm"
                                    >
                                        Add context to help you pray effectively
                                    </button>
                                </div>
                            )}

                             {selectedTarget.status === 'answered' && (
                                <div className="mt-8 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left shadow-sm">
                                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xl shrink-0">
                                        <i className="fas fa-star"></i>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-emerald-800 dark:text-emerald-400 text-lg mb-1">Praise God!</h4>
                                        <p className="text-emerald-700 dark:text-emerald-300/80 leading-relaxed">This prayer has been marked as answered. Take a moment to give thanks for His faithfulness!</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Action */}
                         <div className="p-6 md:p-8 border-t border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-900/80 relative z-20">
                             <div className="text-center md:text-left">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
                                    Current Status
                                </span>
                                <span className={`font-bold ${selectedTarget.status === 'active' ? 'text-violet-600 dark:text-violet-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {selectedTarget.status === 'active' ? 'Active Prayer Target' : 'Answered Prayer'}
                                </span>
                             </div>
                             
                             {selectedTarget.status === 'active' && (
                                 <button 
                                    onClick={() => handlePray(selectedTarget.id)}
                                    className="w-full md:w-auto px-10 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-violet-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group"
                                >
                                    <i className="fas fa-praying-hands group-hover:animate-pulse"></i>
                                    I Prayed Today
                                </button>
                             )}
                        </div>
                    </div>
                ) : (
                    // EMPTY STATE
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10 relative overflow-hidden">
                         <div className="absolute inset-0 bg-slate-50/50 dark:bg-slate-900/50"></div>
                         <div className="relative z-10 max-w-md mx-auto">
                             <div className="w-24 h-24 bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-500/10 dark:to-indigo-500/10 rounded-[2rem] flex items-center justify-center mb-8 mx-auto text-violet-500/50 dark:text-violet-400/30 shadow-inner">
                                 <i className="fas fa-praying-hands text-5xl"></i>
                             </div>
                             <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Intercession Room</h3>
                             <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                                "Epaphras... is always wrestling in prayer for you, that you may stand firm in all the will of God."
                             </p>
                             <button 
                                onClick={handleCreateNew}
                                className="px-8 py-3.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 font-bold rounded-xl hover:border-violet-500 hover:text-violet-600 dark:hover:text-violet-400 transition-all shadow-sm hover:shadow-md flex items-center gap-2 mx-auto"
                            >
                                <i className="fas fa-plus-circle text-violet-500"></i>
                                Add New Target
                            </button>
                         </div>
                    </div>
                )}
            </div>
        </div>
    );
}
