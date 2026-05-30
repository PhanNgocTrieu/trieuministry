"use client";

import React, { useState, useEffect } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, startOfYear, endOfYear, addMonths, subMonths, addYears, subYears, isSameDay, isAfter, startOfDay } from 'date-fns';
import Link from 'next/link';
import { useModal } from '@/context/ModalContext';

type LogType = 'personal_prayer' | 'intercession' | 'scripture';

interface DisciplineLog {
    id: string;
    userId: string;
    date: string; // YYYY-MM-DD
    type: LogType;
    content?: string;
    completed: boolean;
}

export default function DisciplinePage() {
    const { user } = useAuth();
    const { showAlert } = useModal();
    const [viewDate, setViewDate] = useState(new Date()); // Controls the calendar view (Month/Year)
    const [selectedDate, setSelectedDate] = useState(new Date()); // Controls the active date for logging
    const [logs, setLogs] = useState<DisciplineLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchLogs();
        }
    }, [user, viewDate]); // Re-fetch when viewDate changes (year/month navigation)

    const fetchLogs = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Fetch for the whole YEAR of the viewDate to allow yearly stats & smooth navigation
            const start = format(startOfYear(viewDate), 'yyyy-MM-dd');
            const end = format(endOfYear(viewDate), 'yyyy-MM-dd');

            const q = query(
                collection(db, 'discipline_logs'),
                where('userId', '==', user.uid),
                where('date', '>=', start),
                where('date', '<=', end)
            );

            const querySnapshot = await getDocs(q);
            const fetchedLogs: DisciplineLog[] = [];
            querySnapshot.forEach((doc) => {
                fetchedLogs.push({ id: doc.id, ...doc.data() } as DisciplineLog);
            });
            setLogs(fetchedLogs);

        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLog = async (type: LogType, content: string) => {
        if (!user) return;
        const dateStr = format(selectedDate, 'yyyy-MM-dd');

        try {
            const docId = `${user.uid}_${dateStr}_${type}`;
            const docRef = doc(db, 'discipline_logs', docId);

            const newLog = {
                id: docId,
                userId: user.uid,
                date: dateStr,
                type: type,
                content: content,
                completed: true,
                updatedAt: serverTimestamp() // distinct from dateStr
            };

            await setDoc(docRef, newLog, { merge: true });

            // Optimistically update logs
            setLogs(prev => {
                // Remove existing log of this type/date if any (though merge:true keeps it, we want to update the entry in FE state)
                const filtered = prev.filter(l => !(l.date === dateStr && l.type === type));
                return [...filtered, newLog as any]; // Cast to any because serverTimestamp is incompatible with Date in FE usually, but here we ignore updatedAt in UI
            });
            
            showAlert("Success", "Updated successfully!");
        } catch (error) {
            console.error("Error logging:", error);
            showAlert("Error", "Failed to update.");
        }
    };

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(viewDate),
        end: endOfMonth(viewDate)
    });

    const getDayLogs = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return logs.filter(log => log.date === dateStr);
    };

    const nextMonth = () => setViewDate(addMonths(viewDate, 1));
    const prevMonth = () => setViewDate(subMonths(viewDate, 1));
    const nextYear = () => setViewDate(addYears(viewDate, 1));
    const prevYear = () => setViewDate(subYears(viewDate, 1));
    const goToToday = () => {
        const today = new Date();
        setViewDate(today);
        setSelectedDate(today);
    };

    // Derived state for logging buttons
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const logsForSelectedDate = logs.filter(l => l.date === selectedDateStr);
    const selectedDateStatus = {
        personal_prayer: logsForSelectedDate.some(l => l.type === 'personal_prayer'),
        intercession: logsForSelectedDate.some(l => l.type === 'intercession'),
        scripture: logsForSelectedDate.some(l => l.type === 'scripture')
    };

    // Prevent logging for future dates
    const isFutureDate = isAfter(startOfDay(selectedDate), startOfDay(new Date()));

    // Calculate Stats
    const currentMonthStr = format(viewDate, 'yyyy-MM');
    const monthlyLogs = logs.filter(l => l.date.startsWith(currentMonthStr));
    const currentYear = format(viewDate, 'yyyy');
    
    const stats = {
        month: {
            personal_prayer: monthlyLogs.filter(l => l.type === 'personal_prayer').length,
            intercession: monthlyLogs.filter(l => l.type === 'intercession').length,
            scripture: monthlyLogs.filter(l => l.type === 'scripture').length
        },
        year: {
            personal_prayer: logs.filter(l => l.type === 'personal_prayer').length,
            intercession: logs.filter(l => l.type === 'intercession').length,
            scripture: logs.filter(l => l.type === 'scripture').length
        }
    };

    return (
        <AdminGuard>
            <div className="max-w-6xl mx-auto mb-20 p-4">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Spiritual Discipline</h1>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-full shadow-lg border border-slate-200 dark:border-white/10">
                        <button onClick={prevYear} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" title="Previous Year">
                            <i className="fas fa-angle-double-left"></i>
                        </button>
                        <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" title="Previous Month">
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        
                        <h2 className="text-lg font-bold w-40 text-center text-slate-900 dark:text-white">{format(viewDate, 'MMMM yyyy')}</h2>
                        
                        <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" title="Next Month">
                            <i className="fas fa-chevron-right"></i>
                        </button>
                        <button onClick={nextYear} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" title="Next Year">
                            <i className="fas fa-angle-double-right"></i>
                        </button>
                    </div>
                    <button onClick={goToToday} className="px-4 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-500/20 text-sm font-bold transition-colors border border-blue-500/20">
                        Back to Today
                    </button>
                </div>

                {/* Summary Stats Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-600 dark:text-green-400 border border-green-500/30">
                                <i className="fas fa-praying-hands"></i>
                            </div>
                            <div>
                                <span className="block font-medium text-green-700 dark:text-green-400 leading-tight">Personal Prayers</span>
                                <span className="text-xs text-green-600/70 dark:text-green-500/70">Month / Year {currentYear}</span>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.month.personal_prayer} <span className="text-sm font-normal text-slate-400">/ {stats.year.personal_prayer}</span></div>
                        </div>
                    </div>
                    <div className="bg-blue-600/10 rounded-xl p-4 border border-blue-600/20 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-700 dark:text-blue-500 border border-blue-600/30">
                                <i className="fas fa-hand-holding-heart"></i>
                            </div>
                             <div>
                                <span className="block font-medium text-blue-800 dark:text-blue-500 leading-tight">Intercession</span>
                                <span className="text-xs text-blue-700/70 dark:text-blue-600/70">Month / Year {currentYear}</span>
                            </div>
                        </div>
                         <div className="text-right">
                             <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.month.intercession} <span className="text-sm font-normal text-slate-400">/ {stats.year.intercession}</span></div>
                        </div>
                    </div>
                     <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/20 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 border border-orange-500/30">
                                <i className="fas fa-book-open"></i>
                            </div>
                             <div>
                                <span className="block font-medium text-orange-700 dark:text-orange-400 leading-tight">Scripture</span>
                                <span className="text-xs text-orange-600/70 dark:text-orange-500/70">Month / Year {currentYear}</span>
                            </div>
                        </div>
                         <div className="text-right">
                             <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.month.scripture} <span className="text-sm font-normal text-slate-400">/ {stats.year.scripture}</span></div>
                        </div>
                    </div>
                </div>

                {/* Entry Sections - Compact */}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    {isToday(selectedDate) ? "Today's Discipline" : `Discipline for ${format(selectedDate, 'MMMM do, yyyy')}`} 
                    <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                        ({isToday(selectedDate) ? format(new Date(), 'MMM do') : 'Backfill Mode'})
                    </span>
                    {isFutureDate && (
                        <span className="text-xs font-bold text-red-500 ml-2 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded">
                            Future Date - Cannot Log
                        </span>
                    )}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    
                    {/* Personal Prayer - Compact */}
                    <div className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                        selectedDateStatus.personal_prayer 
                            ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30' 
                            : isFutureDate 
                                ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60' 
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-green-300 dark:hover:border-green-700'
                    }`}>
                        <div className="flex items-center gap-3">
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                                 selectedDateStatus.personal_prayer 
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                             }`}>
                                <i className="fas fa-praying-hands"></i>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">Personal Prayer</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Daily connection</p>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => handleLog('personal_prayer', 'Daily Personal Prayer')}
                            disabled={selectedDateStatus.personal_prayer || isFutureDate}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                                selectedDateStatus.personal_prayer 
                                    ? 'text-green-600 dark:text-green-500 cursor-default' 
                                    : isFutureDate
                                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                        : 'bg-green-500 text-white hover:bg-green-600 shadow-sm'
                            }`}
                        >
                                {selectedDateStatus.personal_prayer ? (
                                    <><i className="fas fa-check"></i> Done</>
                                ) : (
                                    'Mark Done'
                                )}
                        </button>
                    </div>

                    {/* Intercession - Compact */}
                     <div className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                        selectedDateStatus.intercession 
                            ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30' 
                            : isFutureDate 
                                ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60' 
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-800'
                    }`}>
                         <div className="flex items-center gap-3">
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                                 selectedDateStatus.intercession 
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-500' 
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                             }`}>
                                <i className="fas fa-hand-holding-heart"></i>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">Intercession</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Praying for others</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => handleLog('intercession', 'Daily Intercession')}
                            disabled={selectedDateStatus.intercession || isFutureDate}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                                selectedDateStatus.intercession 
                                    ? 'text-blue-700 dark:text-blue-600 cursor-default' 
                                    : isFutureDate
                                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                            }`}
                        >
                                {selectedDateStatus.intercession ? (
                                    <><i className="fas fa-check"></i> Done</>
                                ) : (
                                    'Mark Done'
                                )}
                        </button>
                    </div>

                    {/* Scripture - Compact */}
                    <div className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                        selectedDateStatus.scripture 
                            ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/30' 
                            : isFutureDate 
                                ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60' 
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-700'
                    }`}>
                         <div className="flex items-center gap-3">
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                                 selectedDateStatus.scripture 
                                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' 
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                             }`}>
                                <i className="fas fa-book-open"></i>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">Scripture</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Daily reading</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => handleLog('scripture', 'Daily Scripture Reading')}
                            disabled={selectedDateStatus.scripture || isFutureDate}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                                selectedDateStatus.scripture 
                                    ? 'text-orange-600 dark:text-orange-500 cursor-default' 
                                    : isFutureDate
                                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                        : 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm'
                            }`}
                        >
                                {selectedDateStatus.scripture ? (
                                    <><i className="fas fa-check"></i> Done</>
                                ) : (
                                    'Mark Done'
                                )}
                        </button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-white/5 p-6 mb-8 transition-colors">
                    <div className="grid grid-cols-7 gap-2 mb-2 text-center text-sm font-bold text-slate-500 uppercase tracking-wider">
                        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {/* Empty cells for offset */}
                        {/* Empty cells for offset */}
                        {Array.from({ length: startOfMonth(viewDate).getDay() }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-24 md:h-32 bg-slate-50 dark:bg-slate-800/30 rounded-lg"></div>
                        ))}
                        
                        {daysInMonth.map((day) => {
                            const dayLogs = getDayLogs(day);
                            const hasPersonal = dayLogs.some(l => l.type === 'personal_prayer');
                            const hasIntercession = dayLogs.some(l => l.type === 'intercession');
                            const hasScripture = dayLogs.some(l => l.type === 'scripture');
                            const isTodayDate = isToday(day);
                            const isSelected = isSameDay(day, selectedDate);

                            return (
                                <div key={day.toISOString()} 
                                     onClick={() => setSelectedDate(day)}
                                     className={`h-24 md:h-32 border rounded-lg p-2 flex flex-col justify-between transition-all cursor-pointer ${
                                        isSelected
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/20'
                                            : isTodayDate
                                                ? 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800' // Today but not selected
                                                : 'border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-white/10'
                                     }`}
                                >
                                    <div className="text-right">
                                        <span className={`text-sm font-medium ${
                                            isSelected ? 'text-blue-700 dark:text-blue-400 font-bold' :
                                            isTodayDate ? 'text-blue-600 dark:text-blue-500' : 'text-slate-500'
                                        }`}>
                                            {format(day, 'd')}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1 text-xs">
                                        {hasPersonal && (
                                            <div className="flex items-center gap-1 text-green-600 dark:text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">
                                                <i className="fas fa-check-circle text-[10px]"></i> <span className="hidden md:inline">Prayer</span>
                                            </div>
                                        )}
                                        {hasIntercession && (
                                            <div className="flex items-center gap-1 text-blue-700 dark:text-blue-500 bg-blue-600/10 px-1.5 py-0.5 rounded border border-blue-600/20">
                                                <i className="fas fa-hand-holding-heart text-[10px]"></i> <span className="hidden md:inline">Intercede</span>
                                            </div>
                                        )}
                                        {hasScripture && (
                                            <div 
                                                title={dayLogs.find(l => l.type === 'scripture')?.content || 'Scripture Read'}
                                                className="flex items-center gap-1 text-orange-600 dark:text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 cursor-help"
                                            >
                                                <i className="fas fa-book-open text-[10px]"></i> 
                                                <span className="hidden md:inline truncate max-w-[60px]">
                                                    {dayLogs.find(l => l.type === 'scripture')?.content || 'Scripture'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </AdminGuard>
    );
}
