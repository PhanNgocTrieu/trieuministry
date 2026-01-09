"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getCountFromServer, orderBy, limit, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from "@/context/AuthContext";
import { ActivityLog } from '@/lib/activity-logger';
import Link from 'next/link';

// Helper to format date relative
const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    
    return Math.floor(seconds) + " seconds ago";
};

export default function AdminDashboardPage() {
    const { user, isAdmin, isVolunteer } = useAuth();
    const [stats, setStats] = useState({
        card1: 0,
        card2: 0,
        card3: 0,
        visits: 0,
        prayersBreakdown: {
            personal: 0,
            community: 0,
            answered: 0
        }
    });
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                let card1Count = 0;
                let card2Count = 0;
                let card3Count = 0;
                let visitsCount = 0;
                
                // Card 1: Total Users
                const usersSnap = await getCountFromServer(collection(db, "users"));
                card1Count = usersSnap.data().count;

                // Card 2: Total Prayers & Breakdown
                const prayersColl = collection(db, "prayers");
                const totalPrayersSnap = await getCountFromServer(prayersColl);
                card2Count = totalPrayersSnap.data().count;

                // Granular Stats
                const personalSnap = await getCountFromServer(query(prayersColl, where("scope", "==", "personal")));
                const communitySnap = await getCountFromServer(query(prayersColl, where("scope", "==", "community")));
                const answeredSnap = await getCountFromServer(query(prayersColl, where("status", "==", "answered")));

                // Card 3: Pending Blogs
                const q = query(collection(db, "blogs"), where("status", "==", "pending"));
                const snap = await getCountFromServer(q);
                card3Count = snap.data().count;

                // Visits
                try {
                    const visitsDoc = await getDoc(doc(db, "stats", "general"));
                    if (visitsDoc.exists()) {
                        visitsCount = visitsDoc.data().totalVisits || 0;
                    }
                } catch (e) {
                    console.error("Error fetching visits:", e);
                }

                // Recent Activities
                try {
                    const activitiesQ = query(collection(db, "activities"), orderBy("timestamp", "desc"), limit(10));
                    const activitiesSnap = await getDocs(activitiesQ);
                    const activitiesList = activitiesSnap.docs.map(doc => {
                        const data = doc.data();
                        return {
                            ...data,
                            timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(),
                        } as ActivityLog;
                    });
                    setActivities(activitiesList);
                } catch (e) {
                    console.error("Error fetching activities:", e);
                }

                setStats({
                    card1: card1Count,
                    card2: card2Count,
                    card3: card3Count,
                    visits: visitsCount,
                    prayersBreakdown: {
                        personal: personalSnap.data().count,
                        community: communitySnap.data().count,
                        answered: answeredSnap.data().count
                    }
                });

            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchStats();
        }
    }, [user, isAdmin, isVolunteer]);

    const getCardTitle = (index: number) => {
        switch(index) {
            case 1: return "Total Users";
            case 2: return "Prayer Requests";
            case 3: return "Pending Blogs";
            default: return "";
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Dashboard Overview</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Card 1 */}
                <div className="bg-white dark:bg-slate-900/50 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-white/5 flex flex-col h-full backdrop-blur-sm hover:border-blue-500/30 transition-colors">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{getCardTitle(1)}</h3>
                         <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
                            <i className={`fas ${isAdmin || isVolunteer ? 'fa-users' : 'fa-hand-holding-heart'}`}></i>
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white mt-auto">
                        {loading ? <div className="h-9 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div> : stats.card1}
                    </div>
                </div>

                {/* Card 2 - Prayers Breakdown */}
                <div className="bg-white dark:bg-slate-900/50 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-white/5 col-span-1 md:col-span-2 lg:col-span-1 backdrop-blur-sm hover:border-orange-500/30 transition-colors">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{getCardTitle(2)}</h3>
                         <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-500/20">
                            <i className="fas fa-praying-hands"></i>
                        </div>
                    </div>
                    <div className="flex items-end gap-3 mb-4">
                        <div className="text-3xl font-bold text-slate-900 dark:text-white">
                            {loading ? <div className="h-9 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div> : stats.card2}
                        </div>
                        <span className="text-sm text-slate-500 mb-1">Total</span>
                    </div>
                    
                    {/* Breakdown Stats */}
                    {!loading && (
                        <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-3 text-center">
                            <div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Public</div>
                                <div className="text-base font-bold text-green-400">{stats.prayersBreakdown.community}</div>
                            </div>
                            <div className="border-l border-white/5">
                                <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Private</div>
                                <div className="text-base font-bold text-blue-400">{stats.prayersBreakdown.personal}</div>
                            </div>
                            {/* Check for discrepancy */}
                            {(stats.card2 - (stats.prayersBreakdown.community + stats.prayersBreakdown.personal)) > 0 ? (
                                <div className="border-l border-white/5">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Other</div>
                                    <div className="text-base font-bold text-slate-400">
                                        {stats.card2 - (stats.prayersBreakdown.community + stats.prayersBreakdown.personal)}
                                    </div>
                                </div>
                            ) : (
                                <div className="border-l border-white/5">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Answered</div>
                                    <div className="text-base font-bold text-yellow-600 dark:text-yellow-500">{stats.prayersBreakdown.answered}</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Card 3 */}
                <div className="bg-white dark:bg-slate-900/50 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-white/5 flex flex-col h-full backdrop-blur-sm hover:border-purple-500/30 transition-colors">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{getCardTitle(3)}</h3>
                         <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
                            <i className="fas fa-blog"></i>
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white mt-auto">
                        {loading ? <div className="h-9 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div> : stats.card3}
                    </div>
                </div>

                {/* Card 4 - Visits (Static) */}
                 <div className="bg-white dark:bg-slate-900/50 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-white/5 flex flex-col h-full backdrop-blur-sm hover:border-green-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Visits</h3>
                        <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center border border-green-500/20">
                            <i className="fas fa-chart-line"></i>
                        </div>
                    </div>
                     <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        {loading ? (
                            <div className="h-9 w-24 bg-slate-800 rounded animate-pulse"></div>
                        ) : ( 
                            stats.visits.toLocaleString() 
                        )}
                     </div>
                     <p className="text-emerald-400 text-sm mt-2 font-medium">
                        <i className="fas fa-arrow-up mr-1"></i>
                        Live Tracking
                     </p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900/50 rounded-xl shadow-lg border border-slate-200 dark:border-white/5 p-6 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {(isAdmin || isVolunteer) && (
                        <>
                            <Link href="/admin/appeals" className="block p-4 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl border border-blue-500/20 transition-all group">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <i className="fas fa-envelope-open-text"></i>
                                    </div>
                                    <span className="font-bold text-blue-700 dark:text-blue-300">Appeal Letters</span>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-200 transaction-colors">Manage support appeals</p>
                            </Link>
                            
                            <Link href="/admin/sponsors" className="block p-4 bg-purple-500/10 hover:bg-purple-500/20 rounded-xl border border-purple-500/20 transition-all group">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <i className="fas fa-hand-holding-usd"></i>
                                    </div>
                                    <span className="font-bold text-purple-700 dark:text-purple-300">Sponsors</span>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-200 transition-colors">Manage commitments</p>
                            </Link>

                            <Link href="/admin/ministries/intercessory" className="block p-4 bg-orange-500/10 hover:bg-orange-500/20 rounded-xl border border-orange-500/20 transition-all group">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <i className="fas fa-church"></i>
                                    </div>
                                    <span className="font-bold text-orange-700 dark:text-orange-300">Intercessory</span>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 group-hover:text-orange-600 dark:group-hover:text-orange-200 transition-colors">Manage ministries</p>
                            </Link>
                        </>
                     )}
                     {/* Add more quick actions later */}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900/50 rounded-xl shadow-lg border border-slate-200 dark:border-white/5 p-6 mt-6 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
                {activities.length === 0 ? (
                    <div className="text-center text-slate-500 py-8">
                        No recent activity found.
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {activities.map((activity, index) => (
                            <div key={index} className="py-4 flex items-start gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                                    ${activity.type === 'prayer' ? 'bg-orange-500/10 text-orange-400' : 
                                      activity.type === 'blog' ? 'bg-purple-500/10 text-purple-400' :
                                      activity.type === 'appeal' ? 'bg-blue-500/10 text-blue-400' :
                                      'bg-slate-100 dark:bg-slate-700/50 text-slate-400'}`}>
                                    <i className={`fas 
                                        ${activity.type === 'prayer' ? 'fa-praying-hands' : 
                                          activity.type === 'blog' ? 'fa-blog' :
                                          activity.type === 'appeal' ? 'fa-hand-holding-heart' :
                                          'fa-info-circle'}`}></i>
                                </div>
                                <div className="flex-1">
                                    <p className="text-slate-700 dark:text-slate-200 font-medium">{activity.description}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-slate-500">{timeAgo(activity.timestamp)}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-bold border
                                            ${activity.action === 'create' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                              activity.action === 'update' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                              activity.action === 'delete' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                              'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                                            {activity.action}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
