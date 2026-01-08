"use client";

import React, { useState, useEffect } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, startOfYear, endOfYear, addMonths, subMonths, addYears, subYears } from 'date-fns';
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
    const [currentDate, setCurrentDate] = useState(new Date());
    const [logs, setLogs] = useState<DisciplineLog[]>([]);
    const [loading, setLoading] = useState(true);

    // Inputs for today
    const [scripture, setScripture] = useState("");

    // Identify if today is logged
    const [todayLogs, setTodayLogs] = useState<{ [key in LogType]: boolean }>({
        personal_prayer: false,
        intercession: false,
        scripture: false
    });

    useEffect(() => {
        if (user) {
            fetchLogs();
        }
    }, [user, currentDate]);

    const fetchLogs = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Fetch for the whole YEAR to allow yearly stats
            const start = format(startOfYear(currentDate), 'yyyy-MM-dd');
            const end = format(endOfYear(currentDate), 'yyyy-MM-dd');

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

            // Check today's status specifically
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const todayStatus = {
                personal_prayer: false,
                intercession: false,
                scripture: false
            };
            
            const todayQ = query(
                collection(db, 'discipline_logs'),
                where('userId', '==', user.uid),
                where('date', '==', todayStr)
            );
            const todaySnap = await getDocs(todayQ);
            todaySnap.forEach(doc => {
                const data = doc.data() as DisciplineLog;
                todayStatus[data.type] = true;
                if (data.type === 'scripture') setScripture(data.content || "");
            });
            setTodayLogs(todayStatus);

        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLog = async (type: LogType, content: string) => {
        if (!user) return;
        const todayStr = format(new Date(), 'yyyy-MM-dd');

        try {
            const docId = `${user.uid}_${todayStr}_${type}`;
            const docRef = doc(db, 'discipline_logs', docId);

            await setDoc(docRef, {
                userId: user.uid,
                date: todayStr,
                type: type,
                content: content,
                completed: true,
                updatedAt: serverTimestamp()
            }, { merge: true });

            setTodayLogs(prev => ({ ...prev, [type]: true }));
            fetchLogs();
            showAlert("Success", "Updated successfully!");
        } catch (error) {
            console.error("Error logging:", error);
            showAlert("Error", "Failed to update.");
        }
    };

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
    });

    const getDayLogs = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return logs.filter(log => log.date === dateStr);
    };

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const nextYear = () => setCurrentDate(addYears(currentDate, 1));
    const prevYear = () => setCurrentDate(subYears(currentDate, 1));
    const goToToday = () => setCurrentDate(new Date());

    // Calculate Stats
    const currentMonthStr = format(currentDate, 'yyyy-MM');
    const monthlyLogs = logs.filter(l => l.date. startsWith(currentMonthStr));
    const currentYear = format(currentDate, 'yyyy');
    
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
                    <h1 className="text-3xl font-bold text-white">Spiritual Discipline</h1>
                    <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-full shadow-lg border border-white/10">
                        <button onClick={prevYear} className="p-2 hover:bg-slate-800 rounded-full w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors" title="Previous Year">
                            <i className="fas fa-angle-double-left"></i>
                        </button>
                        <button onClick={prevMonth} className="p-2 hover:bg-slate-800 rounded-full w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors" title="Previous Month">
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        
                        <h2 className="text-lg font-bold w-40 text-center text-white">{format(currentDate, 'MMMM yyyy')}</h2>
                        
                        <button onClick={nextMonth} className="p-2 hover:bg-slate-800 rounded-full w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors" title="Next Month">
                            <i className="fas fa-chevron-right"></i>
                        </button>
                        <button onClick={nextYear} className="p-2 hover:bg-slate-800 rounded-full w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors" title="Next Year">
                            <i className="fas fa-angle-double-right"></i>
                        </button>
                    </div>
                    <button onClick={goToToday} className="px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 text-sm font-bold transition-colors border border-blue-500/20">
                        Current Month
                    </button>
                </div>

                {/* Summary Stats Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 border border-green-500/30">
                                <i className="fas fa-praying-hands"></i>
                            </div>
                            <div>
                                <span className="block font-medium text-green-400 leading-tight">Personal Prayers</span>
                                <span className="text-xs text-green-500/70">Month / Year {currentYear}</span>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="text-2xl font-bold text-white">{stats.month.personal_prayer} <span className="text-sm font-normal text-slate-400">/ {stats.year.personal_prayer}</span></div>
                        </div>
                    </div>
                    <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30">
                                <i className="fas fa-hand-holding-heart"></i>
                            </div>
                             <div>
                                <span className="block font-medium text-purple-400 leading-tight">Intercession</span>
                                <span className="text-xs text-purple-500/70">Month / Year {currentYear}</span>
                            </div>
                        </div>
                         <div className="text-right">
                             <div className="text-2xl font-bold text-white">{stats.month.intercession} <span className="text-sm font-normal text-slate-400">/ {stats.year.intercession}</span></div>
                        </div>
                    </div>
                     <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/20 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 border border-orange-500/30">
                                <i className="fas fa-book-open"></i>
                            </div>
                             <div>
                                <span className="block font-medium text-orange-400 leading-tight">Scripture</span>
                                <span className="text-xs text-orange-500/70">Month / Year {currentYear}</span>
                            </div>
                        </div>
                         <div className="text-right">
                             <div className="text-2xl font-bold text-white">{stats.month.scripture} <span className="text-sm font-normal text-slate-400">/ {stats.year.scripture}</span></div>
                        </div>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="bg-slate-900 rounded-xl shadow-lg border border-white/5 p-6 mb-8">
                    <div className="grid grid-cols-7 gap-2 mb-2 text-center text-sm font-bold text-slate-500 uppercase tracking-wider">
                        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {/* Empty cells for offset */}
                        {Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-24 md:h-32 bg-slate-800/30 rounded-lg"></div>
                        ))}
                        
                        {daysInMonth.map((day) => {
                            const dayLogs = getDayLogs(day);
                            const hasPersonal = dayLogs.some(l => l.type === 'personal_prayer');
                            const hasIntercession = dayLogs.some(l => l.type === 'intercession');
                            const hasScripture = dayLogs.some(l => l.type === 'scripture');
                            const isTodayDate = isToday(day);

                            return (
                                <div key={day.toISOString()} 
                                     className={`h-24 md:h-32 border rounded-lg p-2 flex flex-col justify-between transition-colors ${
                                        isTodayDate 
                                            ? 'border-blue-500/50 bg-blue-900/10' 
                                            : 'border-white/5 hover:bg-slate-800/50 hover:border-white/10'
                                     }`}
                                >
                                    <div className="text-right">
                                        <span className={`text-sm font-medium ${isTodayDate ? 'text-blue-400' : 'text-slate-500'}`}>
                                            {format(day, 'd')}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1 text-xs">
                                        {hasPersonal && (
                                            <div className="flex items-center gap-1 text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">
                                                <i className="fas fa-check-circle text-[10px]"></i> <span className="hidden md:inline">Prayer</span>
                                            </div>
                                        )}
                                        {hasIntercession && (
                                            <div className="flex items-center gap-1 text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                                                <i className="fas fa-hand-holding-heart text-[10px]"></i> <span className="hidden md:inline">Intercede</span>
                                            </div>
                                        )}
                                        {hasScripture && (
                                            <div className="flex items-center gap-1 text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
                                                <i className="fas fa-book-open text-[10px]"></i> <span className="hidden md:inline">Scripture</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Entry Sections */}
                <h3 className="text-xl font-bold text-white mb-4">Today's Log: <span className="text-blue-400">{format(new Date(), 'EEEE, MMMM do')}</span></h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* 1. Personal Prayers Link */}
                    <div className="bg-slate-900 rounded-xl shadow-lg border border-green-500/20 p-6 flex flex-col items-center justify-center text-center h-[200px] hover:shadow-xl hover:border-green-500/30 transition-all group">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-4 text-2xl group-hover:scale-110 transition-transform">
                            <i className="fas fa-praying-hands"></i>
                        </div>
                        <h4 className="font-bold text-lg text-white mb-2">Personal Prayers</h4>
                        <Link href="/admin/ministries/personal" className="text-green-500 font-bold hover:text-green-400 hover:underline">
                            Manage & Pray <i className="fas fa-arrow-right ml-1"></i>
                        </Link>
                    </div>

                    {/* 2. Intercessory Link */}
                    <div className="bg-slate-900 rounded-xl shadow-lg border border-purple-500/20 p-6 flex flex-col items-center justify-center text-center h-[200px] hover:shadow-xl hover:border-purple-500/30 transition-all group">
                        <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-500 mb-4 text-2xl group-hover:scale-110 transition-transform">
                            <i className="fas fa-hand-holding-heart"></i>
                        </div>
                        <h4 className="font-bold text-lg text-white mb-2">Intercession</h4>
                        <Link href="/admin/ministries/intercessory" className="text-purple-500 font-bold hover:text-purple-400 hover:underline">
                            Manage & Pray <i className="fas fa-arrow-right ml-1"></i>
                        </Link>
                    </div>

                    {/* 3. Scripture Today */}
                    <div className="bg-slate-900 rounded-xl shadow-lg border border-orange-500/20 p-6 flex flex-col relative h-[500px] md:h-auto">
                        <div className="flex items-center gap-3 mb-4 text-orange-500">
                            <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                                <i className="fas fa-book-open"></i>
                            </div>
                            <h4 className="font-bold text-lg">Scripture Today</h4>
                        </div>
                        <div className="flex-1 mb-4">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Passage / Reading</label>
                            <input 
                                type="text"
                                className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-slate-600"
                                placeholder="e.g. John 3:16, Psalm 23"
                                value={scripture}
                                onChange={(e) => setScripture(e.target.value)}
                            />
                            <p className="text-xs text-slate-500 mt-2">Create your own schedule or follow a plan.</p>
                        </div>
                        <button 
                            onClick={() => handleLog('scripture', scripture)}
                            className={`w-full py-2 rounded-lg font-bold transition-colors mt-auto ${
                                todayLogs.scripture 
                                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                                    : 'bg-orange-600 text-white hover:bg-orange-500 shadow-lg shadow-orange-900/20'
                            }`}
                        >
                             {todayLogs.scripture ? <span><i className="fas fa-check mr-2"></i> Updated</span> : "Update"}
                        </button>
                    </div>

                </div>
            </div>
        </AdminGuard>
    );
}
