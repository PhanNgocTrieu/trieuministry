"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { useAuth } from "@/context/AuthContext";

export default function AdminDashboardPage() {
    const { user, isAdmin, isVolunteer } = useAuth();
    const [stats, setStats] = useState({
        card1: 0,
        card2: 0,
        card3: 0,
        visits: 12450,
        prayersBreakdown: {
            personal: 0,
            community: 0,
            answered: 0
        }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                let card1Count = 0;
                let card2Count = 0;
                let card3Count = 0;
                
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

                setStats({
                    card1: card1Count,
                    card2: card2Count,
                    card3: card3Count,
                    visits: 12450, // Keep placeholder
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
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Card 1 */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">{getCardTitle(1)}</h3>
                         <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                            <i className={`fas ${isAdmin || isVolunteer ? 'fa-users' : 'fa-hand-holding-heart'}`}></i>
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mt-auto">
                        {loading ? <div className="h-9 w-24 bg-gray-200 rounded animate-pulse"></div> : stats.card1}
                    </div>
                </div>

                {/* Card 2 - Prayers Breakdown */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-1 md:col-span-2 lg:col-span-1">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">{getCardTitle(2)}</h3>
                         <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                            <i className="fas fa-praying-hands"></i>
                        </div>
                    </div>
                    <div className="flex items-end gap-3 mb-4">
                        <div className="text-3xl font-bold text-gray-900">
                            {loading ? <div className="h-9 w-16 bg-gray-200 rounded animate-pulse"></div> : stats.card2}
                        </div>
                        <span className="text-sm text-gray-500 mb-1">Total</span>
                    </div>
                    
                    {/* Breakdown Stats */}
                    {!loading && (
                        <div className="grid grid-cols-3 gap-2 border-t border-gray-50 pt-3 text-center">
                            <div>
                                <div className="text-xs text-gray-400 font-bold uppercase mb-1">Public</div>
                                <div className="text-lg font-bold text-green-600">{stats.prayersBreakdown.community}</div>
                            </div>
                            <div className="border-l border-gray-100">
                                <div className="text-xs text-gray-400 font-bold uppercase mb-1">Private</div>
                                <div className="text-lg font-bold text-blue-600">{stats.prayersBreakdown.personal}</div>
                            </div>
                            {/* Check for discrepancy */}
                            {(stats.card2 - (stats.prayersBreakdown.community + stats.prayersBreakdown.personal)) > 0 ? (
                                <div className="border-l border-gray-100">
                                    <div className="text-xs text-gray-400 font-bold uppercase mb-1">Other</div>
                                    <div className="text-lg font-bold text-gray-400">
                                        {stats.card2 - (stats.prayersBreakdown.community + stats.prayersBreakdown.personal)}
                                    </div>
                                </div>
                            ) : (
                                <div className="border-l border-gray-100">
                                    <div className="text-xs text-gray-400 font-bold uppercase mb-1">Answered</div>
                                    <div className="text-lg font-bold text-yellow-600">{stats.prayersBreakdown.answered}</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Card 3 */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">{getCardTitle(3)}</h3>
                         <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                            <i className="fas fa-blog"></i>
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mt-auto">
                        {loading ? <div className="h-9 w-24 bg-gray-200 rounded animate-pulse"></div> : stats.card3}
                    </div>
                </div>

                {/* Card 4 - Visits (Static) */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">Visits</h3>
                        <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                            <i className="fas fa-chart-line"></i>
                        </div>
                    </div>
                     <div className="text-3xl font-bold text-gray-900">
                        {loading ? (
                            <div className="h-9 w-24 bg-gray-200 rounded animate-pulse"></div>
                        ) : ( 
                            stats.visits 
                        )}
                     </div>
                     <p className="text-gray-400 text-sm mt-2 font-medium">Coming Soon</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {(isAdmin || isVolunteer) && (
                        <>
                            <a href="/admin/appeals" className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-colors group">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <i className="fas fa-envelope-open-text"></i>
                                    </div>
                                    <span className="font-bold text-blue-800">Appeal Letters</span>
                                </div>
                                <p className="text-sm text-blue-600">Manage support appeals</p>
                            </a>
                            
                            <a href="/admin/sponsors" className="block p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-100 transition-colors group">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <i className="fas fa-hand-holding-usd"></i>
                                    </div>
                                    <span className="font-bold text-purple-800">Sponsors</span>
                                </div>
                                <p className="text-sm text-purple-600">Manage commitments</p>
                            </a>
                        </>
                     )}
                     {/* Add more quick actions later */}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
                <div className="text-center text-gray-500 py-8">
                    Activity log coming soon...
                </div>
            </div>
        </div>
    );
}
