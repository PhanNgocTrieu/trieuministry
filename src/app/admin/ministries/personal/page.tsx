"use client";

import React, { useState, useEffect } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { useModal } from '@/context/ModalContext';
import PrayerCard from '@/components/admin/prayer/PrayerCard';
import Link from 'next/link';
import { format } from 'date-fns';

interface Target {
    id: string;
    userId: string;
    name: string;
    status: 'active' | 'answered';
    createdAt: any;
}

export default function PersonalPrayerPage() {
    const { user } = useAuth();
    const { showAlert, showConfirm } = useModal();
    const [targets, setTargets] = useState<Target[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTargetName, setNewTargetName] = useState("");
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
        } catch (error) {
            console.error("Error fetching items:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTarget = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newTargetName.trim()) return;

        try {
            const docRef = await addDoc(collection(db, 'personal_prayer_targets'), {
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
                createdAt: { seconds: Date.now() / 1000 }
            };
            setTargets([newTarget, ...targets]);
            setNewTargetName("");
            showAlert("Success", "Added to personal prayer list.");
        } catch (error) {
            console.error("Error adding item:", error);
            showAlert("Error", "Failed to add item");
        }
    };

    const handleUpdateStatus = async (id: string, currentStatus: 'active' | 'answered') => {
        const newStatus = currentStatus === 'active' ? 'answered' : 'active';
        try {
            await updateDoc(doc(db, 'personal_prayer_targets', id), { status: newStatus });
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
                    await deleteDoc(doc(db, 'personal_prayer_targets', id));
                    setTargets(targets.filter(t => t.id !== id));
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
        // 1. Visual Feedback
        showAlert("Prayer Logged", "Your personal prayer has been recorded for today.");

        // 2. Update Discipline Log
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

    const activeTargets = targets.filter(t => t.status === 'active');
    const answeredTargets = targets.filter(t => t.status === 'answered');
    const displayTargets = showAnswered ? answeredTargets : activeTargets;

    return (
        <AdminGuard>
             <div className="max-w-6xl mx-auto mb-20 p-4">
                 <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <span className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 border border-green-500/30">
                                <i className="fas fa-praying-hands"></i>
                            </span>
                             Personal Prayer List
                        </h1>
                        <p className="text-slate-400 mt-1 ml-14">Track your personal prayer requests and walk with God.</p>
                    </div>
                    <Link href="/admin/discipline" className="text-slate-400 hover:text-white font-bold text-sm bg-slate-900 border border-white/10 px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">
                        <i className="fas fa-arrow-left mr-2"></i> Back to Discipline
                    </Link>
                </div>

                {/* Input Area */}
                <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-green-500/20 mb-8">
                    <form onSubmit={handleAddTarget} className="flex gap-3">
                        <input
                            type="text"
                            value={newTargetName}
                            onChange={(e) => setNewTargetName(e.target.value)}
                            placeholder="What do you want to pray for today?"
                            className="flex-1 px-4 py-3 bg-slate-800 border border-white/10 rounded-xl focus:bg-slate-800 focus:ring-2 focus:ring-green-500 outline-none transition-all font-medium text-white placeholder:text-slate-500"
                        />
                        <button 
                            type="submit"
                            disabled={!newTargetName.trim()}
                            className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-900/20 transition-all disabled:opacity-50 disabled:shadow-none"
                        >
                            <i className="fas fa-plus mr-2"></i> Add Item
                        </button>
                    </form>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-4 mb-6 border-b border-white/10 pb-1">
                    <button 
                        onClick={() => setShowAnswered(false)}
                        className={`pb-3 px-2 font-bold text-sm transition-colors border-b-2 ${!showAnswered ? 'text-green-400 border-green-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                    >
                        Active <span className="ml-2 bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-xs border border-green-500/30">{activeTargets.length}</span>
                    </button>
                    <button 
                        onClick={() => setShowAnswered(true)}
                        className={`pb-3 px-2 font-bold text-sm transition-colors border-b-2 ${showAnswered ? 'text-yellow-400 border-yellow-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                    >
                        Answered <span className="ml-2 bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full text-xs border border-yellow-500/30">{answeredTargets.length}</span>
                    </button>
                </div>

                {/* Grid */}
                 {loading ? (
                    <div className="text-center py-12 text-slate-500">Loading your list...</div>
                ) : (
                    <>
                        {displayTargets.length === 0 ? (
                            <div className="text-center py-20 bg-slate-900 rounded-2xl border-2 border-dashed border-white/10">
                                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600 text-2xl">
                                    <i className="fas fa-praying-hands"></i>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1">
                                    {showAnswered ? "No answered prayers yet." : "Your personal list is empty."}
                                </h3>
                                <p className="text-slate-500 text-sm">
                                    {showAnswered ? "Mark items as answered to see them here." : "Add a request above to start praying."}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {displayTargets.map(target => (
                                    <PrayerCard 
                                        key={target.id}
                                        {...target}
                                        color="green"
                                        onToggleStatus={handleUpdateStatus}
                                        onDelete={handleDelete}
                                        onPray={handlePray}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
             </div>
        </AdminGuard>
    );
}
