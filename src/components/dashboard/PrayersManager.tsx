"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc, where, addDoc, serverTimestamp } from "firebase/firestore";
import TableSkeleton from "@/components/admin/TableSkeleton";
import ConfirmModal from "@/components/admin/ConfirmModal";
import { useAuth } from "@/context/AuthContext";

interface PrayerData {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    status: 'pending' | 'prayed' | 'answered';
    createdAt: any;
    prayerCount: number;
    type?: string; 
    scope?: 'personal' | 'community';
}

interface PrayersManagerProps {
    mode: 'personal' | 'community' | 'admin';
}

export default function PrayersManager({ mode }: PrayersManagerProps) {
    const { user, isAdmin, isVolunteer } = useAuth();
    const [prayers, setPrayers] = useState<PrayerData[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Create Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newPrayerContent, setNewPrayerContent] = useState("");
    const [newPrayerScope, setNewPrayerScope] = useState<'personal' | 'community'>('personal');
    const [creating, setCreating] = useState(false);

    const fetchPrayers = async () => {
        if (!user) return;
        setLoading(true);
        try {
            let q;
            const prayersRef = collection(db, "prayers");
            
            // Note: Indexing might be required for compound queries
            if (mode === 'personal') {
                 q = query(prayersRef, where("userId", "==", user.uid), orderBy("createdAt", "desc"));
            } else {
                 // Admin or Community
                 // Fetch all and filter client side to avoid complex index requirements for now, or simple order by
                 q = query(prayersRef, orderBy("createdAt", "desc"));
            }

            const querySnapshot = await getDocs(q);
            const list: PrayerData[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                
                // Client-side filtering for complex logic
                if (mode === 'community') {
                    // Show ONLY community prayers
                    if (data.scope !== 'community' && data.type !== 'community') return; 
                }
                // Admin sees all, Personal sees own (handled by query)
                
                list.push({ id: doc.id, ...data } as PrayerData);
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
    }, [user, mode]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newPrayerContent.trim()) return;
        setCreating(true);

        try {
            await addDoc(collection(db, "prayers"), {
                userId: user.uid,
                userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
                userAvatar: user.photoURL || '',
                content: newPrayerContent,
                status: 'pending',
                createdAt: serverTimestamp(),
                prayerCount: 0,
                scope: newPrayerScope,
                type: newPrayerScope // Legacy compatibility
            });
            setNewPrayerContent("");
            setIsCreateOpen(false);
            fetchPrayers(); // Refresh
        } catch (error) {
            console.error(error);
            alert("Error creating prayer request");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteDoc(doc(db, "prayers", deleteId));
            setPrayers(prayers.filter(p => p.id !== deleteId));
        } catch (error) {
            console.error("Error deleting prayer:", error);
            alert("Failed to delete prayer");
        } finally {
            setDeleteId(null);
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

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {mode === 'personal' ? 'My Prayers' : mode === 'admin' ? 'Manage All Prayers' : 'Community Prayers'}
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {mode === 'personal' ? 'Track your personal prayer requests.' : 'View and manage prayer requests.'}
                    </p>
                </div>
                {/* Add Button (only for personal or admin/volunteer if they want to post) */}
                <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 shadow-sm font-bold flex items-center gap-2"
                >
                    <i className="fas fa-plus"></i> New Request
                </button>
            </div>

            {/* Create Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fade-in-up">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">New Prayer Request</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">My Request</label>
                                <textarea 
                                    rows={4}
                                    required
                                    value={newPrayerContent}
                                    onChange={(e) => setNewPrayerContent(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Share what you need prayer for..."
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Visibility</label>
                                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setNewPrayerScope('personal')}
                                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${newPrayerScope === 'personal' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                                    >
                                        Personal (Private)
                                    </button>
                                     <button
                                        type="button"
                                        onClick={() => setNewPrayerScope('community')}
                                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${newPrayerScope === 'community' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500'}`}
                                    >
                                        Community (Public)
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                    {newPrayerScope === 'personal' ? 'Only you and the ministry team can see this.' : 'Everyone in the community can see and pray for this.'}
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button 
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="px-4 py-2 rounded-lg text-gray-600 font-bold hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={creating}
                                    className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                                >
                                    {creating ? 'Sending...' : 'Send Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {loading ? (
                 <TableSkeleton cols={5} />
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">User</th>
                                    <th scope="col" className="px-6 py-3 w-1/3">Content</th>
                                    <th scope="col" className="px-6 py-3">Type</th>
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
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${prayer.scope === 'personal' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
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
                                        <td className="px-6 py-4">
                                             <span className={`text-xs font-bold px-2 py-1 rounded ${prayer.scope === 'community' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                 {prayer.scope === 'community' ? 'Community' : 'Personal'}
                                             </span>
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
                                                disabled={!(isAdmin || isVolunteer || prayer.userId === user?.uid)}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="prayed">Prayed</option>
                                                <option value="answered">Answered</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                           {(isAdmin || prayer.userId === user?.uid) ? (
                                               <button 
                                                    onClick={() => handleDelete(prayer.id)}
                                                    className="text-red-600 hover:text-red-800 font-medium p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <i className="fas fa-trash"></i>
                                               </button>
                                           ) : null}
                                        </td>
                                    </tr>
                                ))}
                                {prayers.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <i className="fas fa-inbox text-2xl text-gray-300"></i>
                                                <p>No prayers found.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <ConfirmModal 
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Prayer Request"
                message="Are you sure you want to delete this prayer request? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                isDangerous={true}
            />
        </div>
    );
}
