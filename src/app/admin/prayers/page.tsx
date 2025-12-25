"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
import Image from "next/image";

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

export default function PrayersManagementPage() {
    const [prayers, setPrayers] = useState<PrayerData[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPrayers = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "prayers"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const list: PrayerData[] = [];
            querySnapshot.forEach((doc) => {
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
        fetchPrayers();
    }, []);

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

    if (loading) {
        return <div className="p-8 text-center">Loading prayers...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Prayer Management</h1>
                <span className="bg-orange-100 text-orange-800 text-sm font-medium px-2.5 py-0.5 rounded">
                    Total: {prayers.length}
                </span>
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
                                            {prayer.userName}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="line-clamp-2 text-gray-900">{prayer.content}</p>
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
                                            className="text-red-600 hover:text-red-800 font-medium"
                                        >
                                            <i className="fas fa-trash"></i>
                                       </button>
                                    </td>
                                </tr>
                            ))}
                            {prayers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No prayers found.
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
