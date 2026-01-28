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
                                disabled={isPrayedToday}
                                className={`px-6 py-3 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 transform active:scale-95 ${
                                    isPrayedToday
                                        ? 'bg-green-500/20 border border-green-500/50 text-green-300 cursor-default backdrop-blur-sm'
                                        : 'bg-gradient-to-r from-emerald-500 to-green-400 text-white hover:shadow-green-500/30 hover:scale-105'
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
                </div>

                <div className="bg-white dark:bg-slate-900/50 rounded-3xl shadow-xl border border-slate-200 dark:border-white/5 overflow-hidden backdrop-blur-sm">
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
            </div>
        </AdminGuard>
    );
}
