"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useModal } from '@/context/ModalContext';
import { format } from 'date-fns';

export default function ScriptureManager() {
    const { user } = useAuth();
    const { showAlert } = useModal();
    const [loading, setLoading] = useState(true);
    const [todayCompleted, setTodayCompleted] = useState(false);
    const [stats, setStats] = useState({
        streak: 0,
        total: 0
    });

    useEffect(() => {
        if (user) {
            fetchStatus();
        }
    }, [user]);

    const fetchStatus = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            
            // Check today
            const qToday = query(
                collection(db, 'discipline_logs'),
                where('userId', '==', user.uid),
                where('date', '==', todayStr),
                where('type', '==', 'scripture')
            );
            const todaySnap = await getDocs(qToday);
            setTodayCompleted(!todaySnap.empty);

            // Get Stats (Simple count for now)
            const qAll = query(
                collection(db, 'discipline_logs'),
                where('userId', '==', user.uid),
                where('type', '==', 'scripture')
            );
            const allSnap = await getDocs(qAll);
            setStats({
                streak: 0, // Implement streak logic later if needed
                total: allSnap.size
            });

        } catch (error) {
            console.error("Error fetching scripture status:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async () => {
        if (!user) return;
        
        try {
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const docId = `${user.uid}_${todayStr}_scripture`;
            
            await setDoc(doc(db, 'discipline_logs', docId), {
                userId: user.uid,
                date: todayStr,
                type: 'scripture',
                completed: true,
                updatedAt: serverTimestamp()
            }, { merge: true });

            setTodayCompleted(true);
            setStats(prev => ({ ...prev, total: prev.total + 1 }));
            showAlert("Success", "Scripture reading logged for today!");
        } catch (error) {
            console.error("Error logging scripture:", error);
            showAlert("Error", "Failed to log reading");
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4 animate-fade-in">
             <div className="text-center mb-8">
                <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-500 text-3xl border border-orange-500/20">
                    <i className="fas fa-book-open"></i>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Daily Scripture</h1>
                <p className="text-slate-500 dark:text-slate-400">
                    "Thy word is a lamp unto my feet, and a light unto my path." - Psalm 119:105
                </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-orange-500/20 overflow-hidden">
                <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        {format(new Date(), 'EEEE, MMMM do, yyyy')}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">Have you read your Bible today?</p>

                    <button 
                        onClick={handleMarkRead}
                        disabled={todayCompleted}
                        className={`w-full max-w-sm py-4 rounded-xl font-bold text-lg transition-all transform active:scale-95 shadow-lg ${
                            todayCompleted 
                                ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 cursor-default shadow-none' 
                                : 'bg-orange-600 text-white hover:bg-orange-500 shadow-orange-900/20 hover:shadow-orange-900/30'
                        }`}
                    >
                         {todayCompleted ? (
                             <span className="flex items-center justify-center gap-2">
                                 <i className="fas fa-check-circle text-2xl"></i> Completed
                             </span>
                         ) : (
                             <span className="flex items-center justify-center gap-2">
                                 <i className="fas fa-book-reader"></i> Mark as Read
                             </span>
                         )}
                    </button>
                    
                    {todayCompleted && (
                        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-500/10 animate-fade-in">
                            <p className="text-green-700 dark:text-green-300 font-medium">
                                Great job! You've successfully logged your reading for today.
                            </p>
                        </div>
                    )}
                </div>

                <div className="bg-orange-50 dark:bg-slate-800/50 p-6 border-t border-orange-100 dark:border-white/5 flex justify-center gap-12">
                     <div className="text-center">
                         <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</div>
                         <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Days</div>
                     </div>
                     {/* Placeholder for streak if we implement it */}
                     {/* <div className="text-center">
                         <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.streak}</div>
                         <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Streak</div>
                     </div> */}
                </div>
            </div>
        </div>
    );
}
