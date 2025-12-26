"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc, where } from "firebase/firestore";
import Image from "next/image";
import TableSkeleton from "@/components/admin/TableSkeleton";

interface PrayerData {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    status: 'pending' | 'prayed' | 'answered';
    createdAt: any;
    prayerCount: number;
}

import { useAuth } from "@/context/AuthContext";
// ... imports

export default function PrayersManagementPage() {
    const { user, isAdmin, isVolunteer } = useAuth();
    const [prayers, setPrayers] = useState<PrayerData[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'community' | 'personal'>('community');

    const fetchPrayers = async () => {
        if (!user) return;
        setLoading(true);
        try {
            let q;
            // Base collection reference
            const prayersRef = collection(db, "prayers");

            if (isAdmin || isVolunteer) {
                 if (activeTab === 'personal') {
                     // Get only personal prayers (ministry owners)
                     q = query(prayersRef, where('type', '==', 'personal'), orderBy("createdAt", "desc"));
                 } else {
                     // Get community prayers (exclude personal if possible, or filter client side)
                     // For simplicity and index avoidance, let's fetch all sorted and filter client-side for now
                     // unless 'community' type is strictly set.
                     q = query(prayersRef, orderBy("createdAt", "desc"));
                 }
            } else {
                 // User: only see own prayers
                 q = query(
                    prayersRef, 
                    where("userId", "==", user.uid),
                    orderBy("createdAt", "desc")
                );
            }

            const querySnapshot = await getDocs(q);
            const list: PrayerData[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Client-side filtering for 'community' tab to ensure mixed data (legacy) works
                if (activeTab === 'community' && data.type === 'personal') return;
                
                list.push({ id: doc.id, ...doc.data() } as PrayerData);
            });
            setPrayers(list);
        } catch (error) {
            console.error("Error fetching prayers:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchPrayers();
        }
    }, [user, isAdmin, isVolunteer, activeTab]);

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this prayer request?")) {
            try {
                await deleteDoc(doc(db, "prayers", id));
                setPrayers(prayers.filter(p => p.id !== id));
            } catch (error) {
                console.error("Error deleting prayer:", error);
                alert("Failed to delete prayer");
            }
        }
    };

    const handleStatusChange = async (id: string, newStatus: 'pending' | 'prayed' | 'answered') => {
        try {
            await updateDoc(doc(db, "prayers", id), { status: newStatus });
            setPrayers(prayers.map(p => p.id === id ? { ...p, status: newStatus } : p));
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        }
    };

    if (loading && !prayers.length) { // Only show skeleton on initial load or empty
        return (
             <div>
                 <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Prayer Management</h1>
                </div>
                <TableSkeleton cols={5} />
            </div>
        );
    }


    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Prayer Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage community requests and personal ministry prayers.</p>
                </div>
                <div className="bg-gray-100 p-1 rounded-lg flex items-center">
                    <button
                        onClick={() => setActiveTab('community')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                            activeTab === 'community' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        Community Prayers
                    </button>
                    <button
                        onClick={() => setActiveTab('personal')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                            activeTab === 'personal' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        Personal Prayers
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">User</th>
                                <th scope="col" className="px-6 py-3 w-1/3">Content</th>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {prayers.map((prayer) => (
                                <tr key={prayer.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${activeTab === 'personal' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {prayer.userName ? prayer.userName.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            <span className="font-medium text-gray-900">{prayer.userName || 'Anonymous'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="line-clamp-2 text-gray-900">{prayer.content}</p>
                                        {prayer.prayerCount > 0 && (
                                            <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium mt-1">
                                                <i className="fas fa-praying-hands"></i> {prayer.prayerCount} prayers
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {prayer.createdAt?.seconds ? new Date(prayer.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <select 
                                            value={prayer.status}
                                            onChange={(e) => handleStatusChange(prayer.id, e.target.value as any)}
                                            className={`text-xs font-bold px-2 py-1 rounded border-0 cursor-pointer ${
                                                prayer.status === 'answered' ? 'bg-green-100 text-green-800' : 
                                                prayer.status === 'prayed' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                            }`}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="prayed">Prayed</option>
                                            <option value="answered">Answered</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                       <button 
                                            onClick={() => handleDelete(prayer.id)}
                                            className="text-red-600 hover:text-red-800 font-medium p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <i className="fas fa-trash"></i>
                                       </button>
                                    </td>
                                </tr>
                            ))}
                            {prayers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <i className="fas fa-inbox text-2xl text-gray-300"></i>
                                            <p>No prayers found in {activeTab === 'personal' ? 'Personal' : 'Community'} list.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
