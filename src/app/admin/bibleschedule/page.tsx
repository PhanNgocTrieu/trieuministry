"use client";

import React, { useState, useEffect } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getBiblePlan, DayPlan } from '@/lib/biblePlan';
import { format, startOfYear, endOfYear, eachDayOfInterval, getMonth, getDate, getDayOfYear } from 'date-fns';
import { useModal } from '@/context/ModalContext';

interface BibleProgress {
    completedDays: number[]; // Array of day numbers (1-365)
    yearCompleted: boolean;
}

export default function BibleSchedulePage() {
    const { user } = useAuth();
    const { showAlert, showConfirm } = useModal();
    const [plan, setPlan] = useState<DayPlan[]>([]);
    const [progress, setProgress] = useState<BibleProgress>({ completedDays: [], yearCompleted: false });
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null); // 0-11
    
    // Constants for months
    const MONTHS = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    useEffect(() => {
        // Generate Plan
        const generatedPlan = getBiblePlan();
        setPlan(generatedPlan);

        if (user) {
            fetchProgress();
        }
    }, [user]);

    const fetchProgress = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const docRef = doc(db, 'bible_progress', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setProgress(docSnap.data() as BibleProgress);
            } else {
                 // Initialize if not exists
                 const initial = { completedDays: [], yearCompleted: false };
                 await setDoc(docRef, initial);
                 setProgress(initial);
            }
        } catch (error) {
            console.error("Error fetching progress:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleDay = async (day: number) => {
        if (!user) return;
        
        const isCompleted = progress.completedDays.includes(day);
        let newCompletedDays = [...progress.completedDays];

        if (isCompleted) {
            newCompletedDays = newCompletedDays.filter(d => d !== day);
        } else {
            newCompletedDays.push(day);
        }

        // Optimistic UI update
        const newProgress = { ...progress, completedDays: newCompletedDays };
        setProgress(newProgress);

        try {
            const docRef = doc(db, 'bible_progress', user.uid);
            await updateDoc(docRef, {
                completedDays: newCompletedDays,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating day:", error);
            fetchProgress(); // Revert on error
            showAlert("Error", "Failed to update progress.");
        }
    };

    const handleCompleteYear = async () => {
        if (!user) return;
        showConfirm("Mark Year as Completed?", "This will mark your annual Bible reading goal as achieved!", async () => {
             try {
                const docRef = doc(db, 'bible_progress', user.uid);
                await updateDoc(docRef, {
                    yearCompleted: true,
                    updatedAt: serverTimestamp()
                });
                setProgress(prev => ({ ...prev, yearCompleted: true }));
                showAlert("Congratulations!", "You have completed the Bible in a year!");
            } catch (error) {
                console.error("Error completing year:", error);
                showAlert("Error", "Failed.");
            }
        });
    };

    const handleReset = async () => {
        if (!user) return;
        showConfirm("Reset Progress?", "Are you sure you want to delete ALL progress? This cannot be undone.", async () => {
             try {
                const docRef = doc(db, 'bible_progress', user.uid);
                await setDoc(docRef, {
                    completedDays: [],
                    yearCompleted: false,
                    resetAt: serverTimestamp()
                });
                setProgress({ completedDays: [], yearCompleted: false });
                showAlert("Reset", "Your progress has been reset.");
            } catch (error) {
                console.error("Error resetting:", error);
                showAlert("Error", "Failed to reset.");
            }
        });
    };

    // Helper to get days for a month
    const getDaysInMonth = (monthIndex: number) => {
        // Simplified logic: filter plan by checking approx day ranges or just mapping dates
        // Since getBiblePlan returns day 1-365, we need to map that to months assuming non-leap year or standard
        // Better: Use date-fns to map day of year to month
        
        // Let's assume current year (or a non-leap year for consistency of the plan 1-365)
        // If we want to be precise with the generated plan being 365 fixed, we treat it as a fixed schedule.
        // Day 1 = Jan 1.
        
        // Filter plan items where the corresponding date falls in the month
        return plan.filter(p => {
             const date = new Date(new Date().getFullYear(), 0, p.day); // Jan 1st + day-1
             return date.getMonth() === monthIndex;
        });
    };

    const getMonthProgress = (monthIndex: number) => {
        const days = getDaysInMonth(monthIndex);
        if (days.length === 0) return 0;
        const completed = days.filter(d => progress.completedDays.includes(d.day)).length;
        return Math.round((completed / days.length) * 100);
    };

    return (
        <AdminGuard>
            <div className="max-w-7xl mx-auto mb-20 p-4">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Bible Reading Schedule</h1>
                        <p className="text-slate-500 dark:text-slate-400">Track your 1-year journey through the Word</p>
                    </div>
                     <div className="flex gap-4">
                         {progress.yearCompleted ? (
                             <div className="px-6 py-3 bg-green-500 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 animate-bounce">
                                 <i className="fas fa-trophy"></i> Year Completed!
                             </div>
                         ) : (
                            <button 
                                onClick={handleCompleteYear}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold shadow"
                            >
                                <i className="fas fa-check-double mr-2"></i> Mark Year Complete
                            </button>
                         )}
                         <button 
                            onClick={handleReset}
                            className="px-6 py-2 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500/20 transition-colors font-bold border border-red-500/20"
                        >
                            <i className="fas fa-trash-alt mr-2"></i> Reset
                        </button>
                    </div>
                </div>

                {/* Overall Progress */}
                <div className="mb-12 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-white/10">
                     <div className="flex justify-between items-end mb-2">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Total Progress</span>
                        <span className="font-bold text-2xl text-blue-600">
                            {Math.round((progress.completedDays.length / 365) * 100)}%
                        </span>
                    </div>
                    <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000"
                            style={{ width: `${(progress.completedDays.length / 365) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Months Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {MONTHS.map((month, index) => {
                        const percent = getMonthProgress(index);
                        const isComplete = percent === 100;
                        
                        return (
                            <div 
                                key={month}
                                onClick={() => setSelectedMonth(index)}
                                className={`relative cursor-pointer group transition-all duration-300 transform hover:-translate-y-1 ${
                                    isComplete 
                                        ? 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border-green-500/30' 
                                        : 'bg-white dark:bg-slate-900 hover:shadow-xl border-slate-200 dark:border-white/10'
                                } rounded-2xl border p-6 shadow-md`}
                            >
                                {isComplete && (
                                    <div className="absolute -top-3 -right-3 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-white text-xl shadow-lg animate-pulse z-10 border-4 border-white dark:border-slate-900" title="Month Completed!">
                                        <i className="fas fa-star"></i>
                                    </div>
                                )}
                                
                                <div className="flex justify-between items-start mb-4">
                                     <h3 className={`text-xl font-bold ${isComplete ? 'text-green-800 dark:text-green-400' : 'text-slate-800 dark:text-white'}`}>{month}</h3>
                                     <div className={`text-xs font-bold px-2 py-1 rounded ${isComplete ? 'bg-green-200 text-green-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                         {percent}%
                                     </div>
                                </div>

                                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${isComplete ? 'bg-green-500' : 'bg-blue-500'}`}
                                        style={{ width: `${percent}%` }}
                                    ></div>
                                </div>
                                
                                <p className="text-sm text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors">
                                    Click to view readings <i className="fas fa-arrow-right ml-1"></i>
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Day List Modal/Overlay */}
                {selectedMonth !== null && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedMonth(null)}>
                        <div 
                            className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    Readings for {MONTHS[selectedMonth]}
                                </h2>
                                <button onClick={() => setSelectedMonth(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                    <i className="fas fa-times text-slate-500"></i>
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {getDaysInMonth(selectedMonth).map((dayPlan) => (
                                        <div 
                                            key={dayPlan.day}
                                            onClick={() => toggleDay(dayPlan.day)}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${
                                                progress.completedDays.includes(dayPlan.day)
                                                    ? 'bg-green-500/10 border-green-500/30'
                                                    : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-white/5 hover:border-blue-500/50'
                                            }`}
                                        >
                                            <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${
                                                progress.completedDays.includes(dayPlan.day)
                                                    ? 'bg-green-500 border-green-500 text-white'
                                                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                                            }`}>
                                                {progress.completedDays.includes(dayPlan.day) && <i className="fas fa-check text-xs"></i>}
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Day {dayPlan.day}</div>
                                                <div className={`font-bold ${
                                                    progress.completedDays.includes(dayPlan.day) ? 'text-green-700 dark:text-green-400 line-through opacity-70' : 'text-slate-900 dark:text-white'
                                                }`}>
                                                    {dayPlan.display}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-center text-sm text-slate-500">
                                Click on a day to mark it as read/unread
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminGuard>
    );
}
