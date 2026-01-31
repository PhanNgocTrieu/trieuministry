"use client";

import React, { useState, useEffect } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getBiblePlan, DayPlan, OT_BOOKS, NT_BOOKS, BibleBook } from '@/lib/biblePlan';
import { format, startOfYear, endOfYear, eachDayOfInterval, getMonth, getDate, getDayOfYear } from 'date-fns';
import { useModal } from '@/context/ModalContext';

interface BibleProgress {
    completedDays: number[]; // Array of day numbers (1-365)
    yearCompleted: boolean;
    completedChapters: string[]; // Format: "Genesis 1", "Exodus 20"
    totalCompletions: number;
}

export default function BibleSchedulePage() {
    const { user } = useAuth();
    const { showAlert, showConfirm } = useModal();
    const [plan, setPlan] = useState<DayPlan[]>([]);
    const [progress, setProgress] = useState<BibleProgress>({ 
        completedDays: [], 
        yearCompleted: false,
        completedChapters: [],
        totalCompletions: 7 
    });
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null); // 0-11
    
    // Constants for months
    const MONTHS = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const TOTAL_BIBLE_CHAPTERS = 1189;

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
                const data = docSnap.data();
                setProgress({
                    completedDays: data.completedDays || [],
                    yearCompleted: data.yearCompleted || false,
                    completedChapters: data.completedChapters || [],
                    totalCompletions: data.totalCompletions ?? 7 // Default to 7 if undefined
                });
            } else {
                 // Initialize if not exists
                 const initial = { 
                     completedDays: [], 
                     yearCompleted: false,
                     completedChapters: [],
                     totalCompletions: 7 
                 };
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
        showConfirm("Reset Schedule Progress?", "Are you sure you want to delete ALL progress for the Yearly Schedule? This cannot be undone.", async () => {
             try {
                const docRef = doc(db, 'bible_progress', user.uid);
                // Only reset the schedule part
                await updateDoc(docRef, {
                    completedDays: [],
                    yearCompleted: false,
                    updatedAt: serverTimestamp()
                });
                setProgress(prev => ({ ...prev, completedDays: [], yearCompleted: false }));
                showAlert("Reset", "Your yearly schedule progress has been reset.");
            } catch (error) {
                console.error("Error resetting:", error);
                showAlert("Error", "Failed to reset.");
            }
        });
    };

    // Helper to get days for a month
    const getDaysInMonth = (monthIndex: number) => {
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

    // Calculate Book Progress based on SCHEDULE (completed days)
    const getScheduleBookProgress = (bookName: string) => {
        // Find all days that involve this book
        const relevantDays = plan.filter(p => 
            p.readings.some(r => r.startsWith(bookName + " "))
        );
        
        if (relevantDays.length === 0) return 0;

        const completedRelevantDays = relevantDays.filter(p => progress.completedDays.includes(p.day)).length;
        
        return Math.round((completedRelevantDays / relevantDays.length) * 100);
    };

    // --- Bible Markdown Logic ---
    const [activeTab, setActiveTab] = useState<'schedule' | 'markdown'>('schedule');

    const toggleChapter = async (book: string, chapter: number) => {
        if (!user) return;
        const chapterId = `${book} ${chapter}`;
        const isCompleted = progress.completedChapters.includes(chapterId);
        
        // Optimistic update
        let newCompletedChapters = isCompleted 
            ? progress.completedChapters.filter(c => c !== chapterId)
            : [...progress.completedChapters, chapterId];
            
        // Check for full completion (ALL chapters)
        let newTotalCompletions = progress.totalCompletions;
        let justCompletedAll = false;

        // If we just added a chapter and now have exactly TOTAL count (assuming user didn't uncheck something else)
        // Wait, simple condition: if newCompletedChapters.length === TOTAL_BIBLE_CHAPTERS
        if (!isCompleted && newCompletedChapters.length === TOTAL_BIBLE_CHAPTERS) {
             justCompletedAll = true;
             newTotalCompletions += 1;
             newCompletedChapters = []; // Reset!
             showAlert("Hallelujah!", `You have completed reading the Bible for the ${newTotalCompletions}th time! Progress has been reset.`);
        }

        setProgress(prev => ({
            ...prev,
            completedChapters: newCompletedChapters,
            totalCompletions: newTotalCompletions
        }));

        try {
            const docRef = doc(db, 'bible_progress', user.uid);
            await updateDoc(docRef, {
                completedChapters: newCompletedChapters,
                totalCompletions: newTotalCompletions,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating chapter:", error);
            fetchProgress(); // Revert
        }
    };

    const isChapterCompleted = (book: string, chapter: number) => {
        return progress.completedChapters.includes(`${book} ${chapter}`);
    };

    const getBookProgress = (book: BibleBook) => {
        let completed = 0;
        for (let i = 1; i <= book.chapters; i++) {
            if (isChapterCompleted(book.name, i)) completed++;
        }
        return Math.round((completed / book.chapters) * 100);
    };

    return (
        <AdminGuard>
            <div className="max-w-7xl mx-auto mb-20 p-4">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Bible Reading Tracker</h1>
                        <p className="text-slate-500 dark:text-slate-400">Manage your daily schedule and total completions</p>
                    </div>
                </div>

                {/* Tabs Header */}
                <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-8 w-fit mx-auto md:mx-0">
                    <button
                        onClick={() => setActiveTab('schedule')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                            activeTab === 'schedule'
                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                        Daily Schedule
                    </button>
                    <button
                        onClick={() => setActiveTab('markdown')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                            activeTab === 'markdown'
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                        Bible Markdown
                    </button>
                </div>

                {activeTab === 'schedule' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                        
                        {/* Hero / Overall Progress Card */}
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white shadow-2xl">
                             <div className="absolute top-0 right-0 p-32 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -mr-16 -mt-16"></div>
                             <div className="absolute bottom-0 left-0 p-32 bg-indigo-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -ml-16 -mb-16"></div>
                             
                             <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="space-y-4 text-center md:text-left z-10">
                                    <div>
                                        <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">Yearly Plan</h2>
                                        <p className="text-blue-200 mt-2 text-lg">Your spiritual journey through the Word.</p>
                                    </div>
                                    
                                    <div className="flex gap-3 justify-center md:justify-start pt-2">
                                        {progress.yearCompleted ? (
                                            <div className="inline-flex items-center px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-300 rounded-full text-sm font-bold backdrop-blur-sm">
                                                <i className="fas fa-trophy mr-2 text-yellow-400"></i> Year Completed!
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={handleCompleteYear}
                                                className="px-5 py-2 bg-white text-blue-900 rounded-full hover:bg-blue-50 transition-all font-bold shadow-lg text-sm flex items-center gap-2 transform hover:scale-105 active:scale-95"
                                            >
                                                Mark Year Complete <i className="fas fa-check-circle"></i>
                                            </button>
                                        )}
                                        <button 
                                            onClick={handleReset}
                                            className="px-5 py-2 bg-red-500/20 text-red-200 border border-red-500/30 rounded-full hover:bg-red-500/30 transition-all font-bold text-sm backdrop-blur-sm"
                                        >
                                            Reset
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center">
                                     <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle
                                                cx="50%" cy="50%" r="45%"
                                                className="stroke-current text-blue-900/50"
                                                strokeWidth="10"
                                                fill="transparent"
                                            />
                                            <circle
                                                cx="50%" cy="50%" r="45%"
                                                className="stroke-current text-blue-400"
                                                strokeWidth="10"
                                                strokeLinecap="round"
                                                strokeDasharray="283" // 2 * pi * 45% (approx)
                                                strokeDashoffset={283 - (283 * (progress.completedDays.length / 365))}
                                                fill="transparent"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-3xl md:text-4xl font-black text-white">{Math.round((progress.completedDays.length / 365) * 100)}%</span>
                                            <span className="text-xs md:text-sm text-blue-300 uppercase tracking-widest font-semibold">Complete</span>
                                        </div>
                                     </div>
                                </div>
                             </div>
                        </div>

                        {/* Months Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
                            {MONTHS.map((month, index) => {
                                const percent = getMonthProgress(index);
                                const isComplete = percent === 100;
                                const isStarted = percent > 0 && percent < 100;
                                const currentMonth = new Date().getMonth() === index;
                                
                                return (
                                    <div 
                                        key={month}
                                        onClick={() => setSelectedMonth(index)}
                                        className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer ${
                                            isComplete
                                                ? 'bg-blue-50/50 dark:bg-slate-800/50 border-blue-200 dark:border-blue-900/30'
                                                : currentMonth
                                                    ? 'bg-white dark:bg-slate-900 border-blue-400 ring-2 ring-blue-100 dark:ring-blue-900/20 shadow-lg scale-[1.02]'
                                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
                                        }`}
                                    >
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <h3 className={`text-lg font-bold ${
                                                        isComplete ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-white'
                                                    } ${currentMonth ? 'text-blue-600' : ''}`}>
                                                        {month}
                                                    </h3>
                                                    <p className="text-xs text-slate-400 font-medium mt-1">
                                                        {getDaysInMonth(index).length} Readings
                                                    </p>
                                                </div>
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-colors ${
                                                    isComplete 
                                                        ? 'bg-green-100 text-green-600' 
                                                        : isStarted 
                                                            ? 'bg-blue-100 text-blue-600'
                                                            : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                                                }`}>
                                                    {isComplete ? <i className="fas fa-check"></i> : `${percent}%`}
                                                </div>
                                            </div>

                                            <div className="relative w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div 
                                                    className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ${
                                                        isComplete ? 'bg-green-500' : 'bg-blue-500'
                                                    }`}
                                                    style={{ width: `${percent}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        
                                        {/* Hover Effect Bar */}
                                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Automatic Book Tracker Section */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-white/10 mb-12">
                             <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Schedule Books Progress</h3>
                                    <p className="text-slate-500 dark:text-slate-400">Track books completed based on your Daily Schedule plan.</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-black text-slate-900 dark:text-white">
                                        {[...OT_BOOKS, ...NT_BOOKS].filter(b => getScheduleBookProgress(b.name) === 100).length} <span className="text-lg text-slate-400 font-medium">/ 66</span>
                                    </div>
                                    <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">Books Completed</div>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Old Testament</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {OT_BOOKS.map(book => {
                                            const percent = getScheduleBookProgress(book.name);
                                            const isComplete = percent === 100;
                                            return (
                                                <div 
                                                    key={book.name}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-2 transition-all cursor-default relative group/tooltip ${
                                                        isComplete 
                                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30' 
                                                            : percent > 0 
                                                                ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                                                                : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 border-slate-200 dark:border-slate-700'
                                                    }`}
                                                >
                                                    {book.name}
                                                    {isComplete && <i className="fas fa-check"></i>}
                                                    {!isComplete && percent > 0 && <span className="text-[10px] opacity-70">{percent}%</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">New Testament</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {NT_BOOKS.map(book => {
                                            const percent = getScheduleBookProgress(book.name);
                                            const isComplete = percent === 100;
                                            return (
                                                <div 
                                                    key={book.name}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-2 transition-all cursor-default ${
                                                        isComplete 
                                                            ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-500/30' 
                                                            : percent > 0 
                                                                ? 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                                                                : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 border-slate-200 dark:border-slate-700'
                                                    }`}
                                                >
                                                    {book.name}
                                                    {isComplete && <i className="fas fa-check"></i>}
                                                    {!isComplete && percent > 0 && <span className="text-[10px] opacity-70">{percent}%</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Day List Modal */}
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
                        </div>
                    </div>
                )}
                
                {/* --- Bible Markdown Section --- */}
                {activeTab === 'markdown' && (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Bible Markdown</h2>
                                <p className="text-slate-500 dark:text-slate-400">Track book by book. {progress.completedChapters.length} / {TOTAL_BIBLE_CHAPTERS} chapters completed.</p>
                            </div>
                            <div className="px-6 py-4 bg-indigo-600 text-white rounded-2xl shadow-lg flex flex-col items-center justify-center min-w-[150px]">
                                <span className="text-sm font-medium opacity-80 uppercase tracking-wider">Total Reads</span>
                                <span className="text-4xl font-black">{progress.totalCompletions}</span>
                            </div>
                        </div>

                        <div className="space-y-12">
                            {/* Old Testament */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-white/10">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                                    Old Testament
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {OT_BOOKS.map(book => {
                                        const percent = getBookProgress(book);
                                        const isComplete = percent === 100;
                                        return (
                                            <div key={book.name} className={`p-4 rounded-xl border transition-all ${isComplete ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30' : 'border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/20'}`}>
                                                <div className="flex justify-between items-center mb-3">
                                                    <h4 className="font-bold text-slate-700 dark:text-slate-200">{book.name}</h4>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${isComplete ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>{percent}%</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1 mb-4">
                                                    {Array.from({ length: book.chapters }, (_, i) => i + 1).map(chap => renderChapterBox(book.name, chap))}
                                                </div>
                                                {!isComplete && (
                                                    <button
                                                        onClick={() => markBookAsRead(book)}
                                                        className="w-full mt-2 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-300"
                                                    >
                                                        Mark All Read
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* New Testament */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-white/10">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-red-500 rounded-full"></span>
                                    New Testament
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {NT_BOOKS.map(book => {
                                        const percent = getBookProgress(book);
                                        const isComplete = percent === 100;
                                        return (
                                            <div key={book.name} className={`p-4 rounded-xl border transition-all ${isComplete ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' : 'border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/20'}`}>
                                                <div className="flex justify-between items-center mb-3">
                                                    <h4 className="font-bold text-slate-700 dark:text-slate-200">{book.name}</h4>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${isComplete ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-600'}`}>{percent}%</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1 mb-4">
                                                    {Array.from({ length: book.chapters }, (_, i) => i + 1).map(chap => renderChapterBox(book.name, chap))}
                                                </div>
                                                {!isComplete && (
                                                    <button
                                                        onClick={() => markBookAsRead(book)}
                                                        className="w-full mt-2 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-300"
                                                    >
                                                        Mark All Read
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </AdminGuard>
    );

    function renderChapterBox(book: string, chapter: number) {
        const isRead = isChapterCompleted(book, chapter);
        return (
            <button
                key={`${book}-${chapter}`}
                onClick={() => toggleChapter(book, chapter)}
                className={`w-7 h-7 rounded text-[10px] font-bold transition-all flex items-center justify-center ${
                    isRead 
                        ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-sm transform scale-105' 
                        : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
                title={`${book} ${chapter}`}
            >
                {chapter}
            </button>
        );
    }

    async function markBookAsRead(book: BibleBook) {
        if (!user) return;
        
        // Find all chapters for this book that are NOT read yet
        const newChaptersToAdd: string[] = [];
        for (let i = 1; i <= book.chapters; i++) {
             const chapterId = `${book.name} ${i}`;
             if (!progress.completedChapters.includes(chapterId)) {
                 newChaptersToAdd.push(chapterId);
             }
        }

        if (newChaptersToAdd.length === 0) return;

        showConfirm(
            `Mark ${book.name} as Read?`, 
            `This will mark all ${book.chapters} chapters of ${book.name} as completed.`, 
            async () => {
                // Combine with existing
                let newCompletedChapters = [...progress.completedChapters, ...newChaptersToAdd];

                // Check for full completion
                let newTotalCompletions = progress.totalCompletions;
                
                // If the new list length equals total Bible chapters
                if (newCompletedChapters.length === TOTAL_BIBLE_CHAPTERS) {
                     newTotalCompletions += 1;
                     newCompletedChapters = []; // Reset!
                     showAlert("Hallelujah!", `You have completed reading the Bible for the ${newTotalCompletions}th time! Progress has been reset.`);
                }
        
                // Optimistic Update
                setProgress(prev => ({
                    ...prev,
                    completedChapters: newCompletedChapters,
                    totalCompletions: newTotalCompletions
                }));
        
                try {
                    const docRef = doc(db, 'bible_progress', user.uid);
                    await updateDoc(docRef, {
                        completedChapters: newCompletedChapters,
                        totalCompletions: newTotalCompletions,
                        updatedAt: serverTimestamp()
                    });
                } catch (error) {
                    console.error("Error batch marking book:", error);
                    showAlert("Error", "Failed to mark book as read.");
                    fetchProgress(); // Revert
                }
            }
        );
    }
}

