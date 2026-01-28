"use client";

import React, { useState, useEffect } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { useModal } from '@/context/ModalContext';
import { format } from 'date-fns';

export default function PersonalPrayerPage() {
    const { user } = useAuth();
    const { showAlert } = useModal();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isPrayedToday, setIsPrayedToday] = useState(false);
    const [lastSavedContent, setLastSavedContent] = useState('');

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

        } catch (error) {
            console.error("Error fetching data:", error);
            showAlert("Error", "Failed to load personal data.");
        } finally {
            setLoading(false);
        }
    };

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
            const logId = `${user.uid}_${todayStr}_personal_prayer`;
            const logRef = doc(db, 'discipline_logs', logId);

            await setDoc(logRef, {
                userId: user.uid,
                date: todayStr,
                type: 'personal_prayer',
                completed: true,
                updatedAt: serverTimestamp()
            }, { merge: true });

            setIsPrayedToday(true);
            showAlert("Amen!", "Prayer discipline recorded for today.");
        } catch (error) {
            console.error("Error logging prayer:", error);
            showAlert("Error", "Failed to update discipline log.");
        }
    };

    const hasUnsavedChanges = content !== lastSavedContent;

    return (
        <AdminGuard>
            <div className="max-w-5xl mx-auto mb-20 p-4">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Personal Prayers</h1>
                        <p className="text-slate-500 dark:text-slate-400">Keep your prayer points in one place.</p>
                    </div>
                    
                    <div className="flex gap-3">
                        <button
                            onClick={handleSave}
                            disabled={!hasUnsavedChanges || saving}
                            className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 ${
                                hasUnsavedChanges
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            {saving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                            {hasUnsavedChanges ? 'Save Changes' : 'Saved'}
                        </button>

                        <button
                            onClick={handleCompletePrayer}
                            disabled={isPrayedToday}
                            className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 ${
                                isPrayedToday
                                    ? 'bg-green-100 text-green-700 border border-green-200 cursor-default'
                                    : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-105 shadow-green-500/30'
                            }`}
                        >
                            {isPrayedToday ? (
                                <><i className="fas fa-check-circle"></i> Prayed Today</>
                            ) : (
                                <><i className="fas fa-praying-hands"></i> Mark as Prayed</>
                            )}
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-white/10 overflow-hidden">
                    {loading ? (
                         <div className="h-96 flex items-center justify-center">
                            <i className="fas fa-spinner fa-spin text-4xl text-blue-500"></i>
                         </div>
                    ) : (
                        <RichTextEditor
                            value={content}
                            onChange={setContent}
                            placeholder="Write your prayers here..."
                            className="min-h-[500px]"
                        />
                    )}
                </div>
            </div>
        </AdminGuard>
    );
}
