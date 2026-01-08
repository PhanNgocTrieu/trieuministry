"use client";

import React, { useState, useEffect } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { useModal } from '@/context/ModalContext';
import Link from 'next/link';
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

export default function IntercessoryPage() {
    const { user } = useAuth();
    const { showAlert, showConfirm } = useModal();
    const [targets, setTargets] = useState<Target[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newName, setNewName] = useState("");
    const [newTitle, setNewTitle] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [newCommitmentTime, setNewCommitmentTime] = useState("");
    
    const [showAnswered, setShowAnswered] = useState(false);

    useEffect(() => {
        if (user) {
            fetchTargets();
        }
    }, [user]);

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

    const resetForm = () => {
        setNewName("");
        setNewTitle("");
        setNewDescription("");
        setNewCommitmentTime("");
        setEditingId(null);
    };

    const handleEdit = (target: Target) => {
        setEditingId(target.id);
        setNewName(target.name);
        setNewTitle(target.title || "");
        setNewDescription(target.description || "");
        setNewCommitmentTime(target.commitmentTime || "");
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newName.trim()) return;

        try {
            const payload = {
                userId: user.uid,
                name: newName.trim(),
                title: newTitle.trim(),
                description: newDescription.trim(),
                commitmentTime: newCommitmentTime.trim(),
                status: 'active' as const,
            };

            if (editingId) {
                // UPDATE Existing
                const docRef = doc(db, 'intercession_targets', editingId);
                await updateDoc(docRef, {
                    name: newName.trim(),
                    title: newTitle.trim(),
                    description: newDescription.trim(),
                    commitmentTime: newCommitmentTime.trim(),
                });

                setTargets(targets.map(t => t.id === editingId ? { ...t, ...payload, id: editingId, createdAt: t.createdAt } : t));
                showAlert("Success", "Prayer request updated.");
            } else {
                // CREATE New
                const finalPayload = { ...payload, createdAt: serverTimestamp() };
                const docRef = await addDoc(collection(db, 'intercession_targets'), finalPayload);
                
                const newTarget: Target = {
                    id: docRef.id,
                    ...payload,
                    createdAt: { seconds: Date.now() / 1000 }
                } as Target;

                setTargets([newTarget, ...targets]);
                showAlert("Success", "Added to intercession list.");
            }
            
            resetForm();
        } catch (error) {
            console.error("Error saving item:", error);
            showAlert("Error", "Failed to save item");
        }
    };

    const handleUpdateStatus = async (id: string, currentStatus: 'active' | 'answered') => {
        const newStatus = currentStatus === 'active' ? 'answered' : 'active';
        try {
            await updateDoc(doc(db, 'intercession_targets', id), { status: newStatus });
            setTargets(targets.map(t => t.id === id ? { ...t, status: newStatus } : t));
        } catch (error) {
            console.error("Error updating status:", error);
            showAlert("Error", "Failed to update status");
        }
    };

    const handleDelete = async (id: string) => {
        showConfirm(
            "Delete Item",
            "Are you sure you want to delete this item?",
            async () => {
                try {
                    await deleteDoc(doc(db, 'intercession_targets', id));
                    setTargets(targets.filter(t => t.id !== id));
                    if (editingId === id) resetForm();
                    showAlert("Success", "Item deleted.");
                } catch (error) {
                    console.error("Error deleting:", error);
                    showAlert("Error", "Failed to delete item");
                }
            },
            true, "Delete"
        );
    };

    const handlePray = async (id: string) => {
        if (!user) return;
        showAlert("Prayer Logged", "Your intercession has been recorded.");

        try {
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
        }
    };

    const activeTargets = targets.filter(t => t.status === 'active');
    const answeredTargets = targets.filter(t => t.status === 'answered');
    const displayTargets = showAnswered ? answeredTargets : activeTargets;

    return (
        <AdminGuard>
             <div className="max-w-6xl mx-auto mb-20 p-4">
                 <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <span className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30">
                                <i className="fas fa-hand-holding-heart"></i>
                            </span>
                            Intercession Ministry
                        </h1>
                        <p className="text-slate-400 mt-1 ml-14">Manage and track your intercessory prayer list.</p>
                    </div>
                    <Link href="/admin/discipline" className="text-slate-400 hover:text-white font-bold text-sm bg-slate-900 border border-white/10 px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">
                        <i className="fas fa-arrow-left mr-2"></i> Back to Discipline
                    </Link>
                </div>

                {/* Input Area */}
                <div className={`p-6 rounded-2xl shadow-lg border mb-8 transition-colors ${editingId ? 'bg-purple-900/10 border-purple-500/30' : 'bg-slate-900 border-white/5'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            {editingId ? (
                                <>
                                    <i className="fas fa-edit text-purple-400"></i> Editing Request
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-plus-circle text-purple-400"></i> Add New Request
                                </>
                            )}
                        </h3>
                        {editingId && (
                            <button onClick={resetForm} className="text-sm text-slate-400 hover:text-white underline">
                                Cancel Edit
                            </button>
                        )}
                    </div>
                    
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                             <label className="text-xs font-bold text-slate-500 uppercase">Person / Group Name</label>
                             <input
                                 type="text"
                                 value={newName}
                                 onChange={(e) => setNewName(e.target.value)}
                                 placeholder="Who are we praying for?"
                                 className="w-full px-4 py-3 bg-slate-800 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all placeholder:text-slate-600"
                             />
                        </div>
                        <div className="space-y-1">
                             <label className="text-xs font-bold text-slate-500 uppercase">Topic / Title</label>
                             <input
                                 type="text"
                                 value={newTitle}
                                 onChange={(e) => setNewTitle(e.target.value)}
                                 placeholder="Short topic (e.g. Health, Wisdom)"
                                 className="w-full px-4 py-3 bg-slate-800 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all placeholder:text-slate-600"
                             />
                        </div>
                        
                        <div className="space-y-1 md:col-span-2">
                             <label className="text-xs font-bold text-slate-500 uppercase">Detailed Prayer Request (Nan đề)</label>
                             <textarea
                                 value={newDescription}
                                 onChange={(e) => setNewDescription(e.target.value)}
                                 placeholder="Enter the specific prayer needs here..."
                                 rows={3}
                                 className="w-full px-4 py-3 bg-slate-800 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none placeholder:text-slate-600"
                             />
                        </div>

                        <div className="space-y-1">
                             <label className="text-xs font-bold text-slate-500 uppercase">Commitment Time</label>
                             <input
                                 type="text"
                                 value={newCommitmentTime}
                                 onChange={(e) => setNewCommitmentTime(e.target.value)}
                                 placeholder="Duration (e.g. 1 week, Until Answered)..."
                                 className="w-full px-4 py-3 bg-slate-800 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all placeholder:text-slate-600"
                             />
                        </div>

                        <div className="flex items-end gap-3">
                            {editingId && (
                                <button 
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 h-[50px] bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-all border border-white/10"
                                >
                                    Cancel
                                </button>
                            )}
                            <button 
                                type="submit"
                                disabled={!newName.trim()}
                                className={`flex-1 h-[50px] font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:shadow-none text-white ${
                                    editingId 
                                        ? "bg-purple-600 hover:bg-purple-500 shadow-purple-900/20" 
                                        : "bg-purple-600 hover:bg-purple-500 shadow-purple-900/20"
                                }`}
                            >
                                {editingId ? (
                                    <><i className="fas fa-save mr-2"></i> Update Target</>
                                ) : (
                                    <><i className="fas fa-paper-plane mr-2"></i> Add Prayer Target</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-4 mb-6 border-b border-white/10 pb-1">
                    <button 
                        onClick={() => setShowAnswered(false)}
                        className={`pb-3 px-2 font-bold text-sm transition-colors border-b-2 ${!showAnswered ? 'text-purple-400 border-purple-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                    >
                        Active Requests <span className="ml-2 bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full text-xs border border-purple-500/30">{activeTargets.length}</span>
                    </button>
                    <button 
                        onClick={() => setShowAnswered(true)}
                        className={`pb-3 px-2 font-bold text-sm transition-colors border-b-2 ${showAnswered ? 'text-green-400 border-green-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                    >
                        Answered Prayers <span className="ml-2 bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full text-xs border border-green-500/30">{answeredTargets.length}</span>
                    </button>
                </div>

                {/* Grid */}
                {/* List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-12 text-slate-500">Loading...</div>
                    ) : displayTargets.length === 0 ? (
                        <div className="text-center py-12 bg-slate-900 rounded-2xl border border-white/5 border-dashed">
                             <p className="text-slate-400">No requests found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {displayTargets.map(target => (
                                <div key={target.id} className={`bg-slate-900 rounded-2xl border transition-all flex flex-col group overflow-hidden ${
                                    editingId === target.id ? 'border-purple-500 ring-1 ring-purple-500 shadow-lg shadow-purple-900/20' : 'border-white/5 shadow-lg hover:shadow-xl hover:border-white/10'
                                }`}>
                                    {/* Header */}
                                    <div className="p-5 flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                                            target.status === 'answered' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                        }`}>
                                            {target.status === 'answered' ? <i className="fas fa-check text-xl"></i> : <i className="fas fa-praying-hands text-xl"></i>}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-white text-lg leading-tight truncate pr-2">{target.name}</h4>
                                                    {target.title && <span className="inline-block px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide bg-purple-500/10 text-purple-400 border border-purple-500/20 mt-1">{target.title}</span>}
                                                </div>
                                                
                                                {/* Action Icons */}
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button 
                                                        onClick={() => handleEdit(target)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-blue-500/10 hover:text-blue-400 transition-all opacity-0 group-hover:opacity-100"
                                                        title="Edit"
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(target.id)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                                                        title="Delete"
                                                    >
                                                        <i className="fas fa-trash-alt"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Content Body */}
                                    <div className="px-5 pb-4 flex-1">
                                        {target.description ? (
                                            <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                                                <p className="text-slate-300 text-sm whitespace-pre-line leading-relaxed">
                                                    {target.description}
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-slate-500 text-sm italic py-2">No detailed description.</p>
                                        )}
                                    </div>

                                    {/* Footer / Meta */}
                                    <div className="px-5 py-4 border-t border-white/5 bg-slate-800/30 flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                                             {target.commitmentTime && (
                                                <div className="flex items-center gap-1.5" title="Commitment Time">
                                                    <i className="fas fa-clock text-purple-400"></i> {target.commitmentTime}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5" title="Created At">
                                                <i className="fas fa-calendar-alt text-slate-600"></i>
                                                {target.createdAt?.seconds ? new Date(target.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20" title="Prayer Count">
                                                <i className="fas fa-fire"></i> {target.prayerCount || 0}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleUpdateStatus(target.id, target.status)}
                                                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                                                    target.status === 'active' 
                                                        ? 'bg-slate-800 border border-white/10 text-slate-400 hover:border-green-500/50 hover:text-green-400' 
                                                        : 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                }`}
                                                title={target.status === 'active' ? "Mark as Answered" : "Mark as Active"}
                                            >
                                                <i className="fas fa-check"></i>
                                            </button>

                                            <button 
                                                onClick={() => handlePray(target.id)}
                                                className="flex items-center gap-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg transition-all shadow-lg shadow-purple-900/20 active:scale-95"
                                            >
                                                <i className="fas fa-plus-circle"></i> Log Prayer
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        }
                        </div>
                    )}
                 </div>
             </div>
        </AdminGuard>
    );
}
