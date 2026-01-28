"use client";

import React, { useState, useEffect } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, collection, query, getDocs } from 'firebase/firestore';
import RichTextEditor from '@/components/admin/RichTextEditor';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { useModal } from '@/context/ModalContext';
import { format } from 'date-fns';

// --- Internal Component: History Item ---
const HistoryItem = ({ log, onDelete }: { log: any, onDelete: (id: string) => void }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLongContent, setIsLongContent] = useState(false);
    const contentRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (contentRef.current) {
            setIsLongContent(contentRef.current.scrollHeight > 150);
        }
    }, [log.content]);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-all hover:shadow-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <i className="fas fa-calendar-day"></i>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">
                            {format(new Date(log.date), 'EEEE, MMMM do, yyyy')}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Snapshot</p>
                    </div>
                </div>
                <button 
                    onClick={() => onDelete(log.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete Snapshot"
                >
                    <i className="fas fa-trash-alt"></i>
                </button>
            </div>
            
            <div className="p-6">
                <div 
                    ref={contentRef}
                    className={`prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 relative ${!isExpanded && isLongContent ? 'max-h-[150px] overflow-hidden mask-bottom' : ''}`}
                >
                    <div dangerouslySetInnerHTML={{ __html: log.content }} />
                    
                    {!isExpanded && isLongContent && (
                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white dark:from-slate-900 to-transparent pointer-events-none"></div>
                    )}
                </div>

                {isLongContent && (
                    <div className="mt-4 flex justify-center">
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-sm font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 hover:underline flex items-center gap-1"
                        >
                            {isExpanded ? (
                                <>Show Less <i className="fas fa-chevron-up"></i></>
                            ) : (
                                <>Show More <i className="fas fa-chevron-down"></i></>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function PersonalPrayerPage() {
    const { user } = useAuth();
    const { showAlert } = useModal();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isPrayedToday, setIsPrayedToday] = useState(false);
    const [lastSavedContent, setLastSavedContent] = useState('');
    const [history, setHistory] = useState<any[]>([]);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // 1. Fetch Personal Prayer Content
            const contentRef = doc(db, 'user_personal_data', user.uid);
            const contentSnap = await getDoc(contentRef);
            
            if (contentSnap.exists()) {
                const data = contentSnap.data();
                const fetchedContent = data.prayers_content || '';
                setContent(fetchedContent);
                setLastSavedContent(fetchedContent);
            }

            // 2. Check if prayed today
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const logId = `${user.uid}_${todayStr}_personal_prayer`;
            const logRef = doc(db, 'discipline_logs', logId);
            const logSnap = await getDoc(logRef);
            
            if (logSnap.exists() && logSnap.data().completed) {
                setIsPrayedToday(true);
            }

            // 3. Fetch History
            await fetchHistory();

        } catch (error) {
            console.error("Error fetching data:", error);
            showAlert("Error", "Failed to load personal data.");
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        if (!user) return;
        try {
            const historyRef = collection(db, 'user_personal_data', user.uid, 'history');
            const q = query(historyRef); 
            const snapshot = await getDocs(q);
            const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            logs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setHistory(logs);
        } catch (error) {
            console.error("Error fetching history:", error);
        }
    }

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const docRef = doc(db, 'user_personal_data', user.uid);
            await setDoc(docRef, {
                prayers_content: content,
                updatedAt: serverTimestamp()
            }, { merge: true });
            
            setLastSavedContent(content);
            showAlert("Saved", "Your prayers have been saved successfully.");
        } catch (error) {
            console.error("Error saving:", error);
            showAlert("Error", "Failed to save content.");
        } finally {
            setSaving(false);
        }
    };

    const handleCompletePrayer = async () => {
        if (!user) return;
        
        try {
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            
            // 1. Log Discipline
            const logId = `${user.uid}_${todayStr}_personal_prayer`;
            const logRef = doc(db, 'discipline_logs', logId);
            await setDoc(logRef, {
                userId: user.uid,
                date: todayStr,
                type: 'personal_prayer',
                completed: true,
                updatedAt: serverTimestamp()
            }, { merge: true });

            // 2. Save Snapshot to History
            const historyId = todayStr; 
            const historyRef = doc(db, 'user_personal_data', user.uid, 'history', historyId);
            await setDoc(historyRef, {
                date: todayStr,
                content: content,
                createdAt: serverTimestamp()
            });

            setIsPrayedToday(true);
            await fetchHistory(); // Refresh list
            showAlert("Amen!", "Prayer recorded and snapshot saved.");
        } catch (error) {
            console.error("Error logging prayer:", error);
            showAlert("Error", "Failed to update discipline log.");
        }
    };

    const confirmDelete = (id: string) => {
        setSelectedLogId(id);
        setDeleteModalOpen(true);
    };

    const handleDeleteSnapshot = async () => {
        if (!user || !selectedLogId) return;

        try {
            await deleteDoc(doc(db, 'user_personal_data', user.uid, 'history', selectedLogId));
            setHistory(prev => prev.filter(log => log.id !== selectedLogId));
            showAlert("Deleted", "Snapshot deleted.");
        } catch (error) {
            console.error("Error deleting:", error);
            showAlert("Error", "Failed to delete snapshot.");
        }
    };

    const hasUnsavedChanges = content !== lastSavedContent;

    return (
        <AdminGuard>
            <div className="max-w-5xl mx-auto mb-20 p-4">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-8 md:p-12 mb-8 shadow-2xl text-white">
                    <div className="absolute top-0 right-0 p-32 bg-purple-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 p-32 bg-indigo-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -ml-16 -mb-16"></div>

                    <div className="relative flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="text-center md:text-left space-y-2">
                            <h1 className="text-3xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
                                Personal Prayers
                            </h1>
                            <p className="text-lg text-purple-200 font-medium max-w-xl">
                                "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God."
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handleSave}
                                disabled={!hasUnsavedChanges || saving}
                                className={`px-6 py-3 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 transform active:scale-95 ${
                                    hasUnsavedChanges
                                        ? 'bg-white text-indigo-900 hover:bg-indigo-50 hover:shadow-white/20'
                                        : 'bg-white/10 text-white/50 cursor-not-allowed border border-white/5'
                                }`}
                            >
                                {saving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                                {hasUnsavedChanges ? 'Save Changes' : 'Saved'}
                            </button>

                            <button
                                onClick={handleCompletePrayer}
                                className={`px-6 py-3 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 transform active:scale-95 ${
                                    isPrayedToday
                                        ? 'bg-green-500/20 border border-green-500/50 text-green-300 backdrop-blur-sm'
                                        : 'bg-gradient-to-r from-emerald-500 to-green-400 text-white hover:shadow-green-500/30 hover:scale-105'
                                }`}
                            >
                                {isPrayedToday ? (
                                    <><i className="fas fa-check-circle"></i> Update Today's Snapshot</>
                                ) : (
                                    <><i className="fas fa-praying-hands"></i> Mark as Prayed</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900/50 rounded-3xl shadow-xl border border-slate-200 dark:border-white/5 overflow-hidden backdrop-blur-sm mb-12">
                    {loading ? (
                         <div className="h-[600px] flex items-center justify-center flex-col gap-4 text-slate-400">
                            <i className="fas fa-spinner fa-spin text-4xl text-purple-500"></i>
                            <p>Loading your prayers...</p>
                         </div>
                    ) : (
                        <div className="p-1">
                             <RichTextEditor
                                value={content}
                                onChange={setContent}
                                placeholder="Write your prayers here..."
                                className="min-h-[600px] border-none"
                            />
                        </div>
                    )}
                </div>

                {/* History Section */}
                {history.length > 0 && (
                    <div className="animate-fadeIn">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                            <i className="fas fa-history text-purple-500"></i> Prayer History
                        </h2>
                        <div className="grid grid-cols-1 gap-6">
                            {history.map((log) => (
                                <HistoryItem 
                                    key={log.id} 
                                    log={log} 
                                    onDelete={confirmDelete} 
                                />
                            ))}
                        </div>
                    </div>
                )}

                <ConfirmModal
                    isOpen={deleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    onConfirm={handleDeleteSnapshot}
                    title="Delete Snapshot?"
                    message="Are you sure you want to delete this prayer snapshot? This action cannot be undone."
                    confirmText="Delete"
                    isDangerous={true}
                />
            </div>
        </AdminGuard>
    );
}
