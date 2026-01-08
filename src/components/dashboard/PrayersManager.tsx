"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc, where, addDoc, serverTimestamp } from "firebase/firestore";
import TableSkeleton from "@/components/admin/TableSkeleton";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { logActivity } from "@/lib/activity-logger";

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
    const { showAlert, showConfirm } = useModal();

    // Create Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newPrayerContent, setNewPrayerContent] = useState("");
    const [newPrayerScope, setNewPrayerScope] = useState<'personal' | 'community'>('community'); // Default to community (public)
    const [includeSignature, setIncludeSignature] = useState(true);
    const [editId, setEditId] = useState<string | null>(null);
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
                 // Fetch all WITHOUT orderBy first to ensure we get docs missing 'createdAt'
                 q = query(prayersRef);
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

            // Client-side Sort (descending by createdAt)
            list.sort((a, b) => {
                const timeA = a.createdAt?.seconds || 0;
                const timeB = b.createdAt?.seconds || 0;
                return timeB - timeA;
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
            if (editId) {
                // Update existing
                // Calculate final content with or without signature
                const signature = `\n\n- ${user.displayName || user.email?.split('@')[0] || 'Anonymous'}`;
                let finalContent = newPrayerContent;

                if (includeSignature) {
                    if (!finalContent.includes(signature)) {
                        finalContent += signature;
                    }
                } else {
                    if (finalContent.includes(signature)) {
                        finalContent = finalContent.replace(signature, "");
                    }
                }

                await updateDoc(doc(db, "prayers", editId), {
                    content: finalContent,
                    scope: newPrayerScope,
                    type: newPrayerScope, // Ensure type stays in sync
                    updatedAt: serverTimestamp()
                });
                await logActivity(
                    'prayer',
                    'update',
                    `Updated prayer request: ${finalContent.substring(0, 30)}${finalContent.length > 30 ? '...' : ''}`,
                    { prayerId: editId, scope: newPrayerScope }
                );
                showAlert("Success", "Prayer request updated.");
            } else {
                // Create new
                await addDoc(collection(db, "prayers"), {
                    userId: user.uid,
                    userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
                    name: user.displayName || user.email?.split('@')[0] || 'Anonymous', // Add legacy 'name' field
                    userAvatar: user.photoURL || '',
                    content: (includeSignature && !editId) 
                        ? `${newPrayerContent}\n\n- ${user.displayName || user.email?.split('@')[0] || 'Anonymous'}`
                        : newPrayerContent,
                    status: 'pending',
                    createdAt: serverTimestamp(),
                    prayerCount: 0,
                    scope: newPrayerScope,
                    type: newPrayerScope // Legacy compatibility
                });
                await logActivity(
                    'prayer',
                    'create',
                    `New (Manager) ${newPrayerScope} prayer request: ${newPrayerContent.substring(0, 30)}${newPrayerContent.length > 30 ? '...' : ''}`,
                    { userId: user.uid, scope: newPrayerScope }
                );
                showAlert("Success", "Prayer request created.");
            }
            
            setNewPrayerContent("");
            setEditId(null);
            setIncludeSignature(true); // Reset to default
            setIsCreateOpen(false);
            fetchPrayers(); // Refresh
        } catch (error) {
            console.error(error);
            showAlert("Error", editId ? "Error updating prayer" : "Error creating prayer request");
        } finally {
            setCreating(false);
        }
    };

    const handleEdit = (prayer: PrayerData) => {
        setNewPrayerContent(prayer.content);
        setNewPrayerScope(prayer.scope || 'personal');
        
        // Detect if signature exists
        const signature = `\n\n- ${user?.displayName || user?.email?.split('@')[0] || 'Anonymous'}`;
        setIncludeSignature(prayer.content.includes(signature));
        
        setEditId(prayer.id);
        setIsCreateOpen(true);
    };

    const handleCloseModal = () => {
        setIsCreateOpen(false);
        setEditId(null);
        setNewPrayerContent("");
        setNewPrayerScope('community');
    };

    const handleDelete = (id: string) => {
        showConfirm(
            "Delete Prayer Request",
            "Are you sure you want to delete this prayer request? This action cannot be undone.",
            async () => {
                 try {
                    await deleteDoc(doc(db, "prayers", id));
                    await logActivity('prayer', 'delete', `Deleted prayer request`, { prayerId: id });
                    setPrayers(prev => prev.filter(p => p.id !== id));
                    showAlert("Success", "Prayer request deleted.");
                } catch (error) {
                    console.error("Error deleting prayer:", error);
                    showAlert("Error", "Failed to delete prayer");
                }
            },
            true,
            "Delete",
            "Cancel"
        );
    };

    const handleStatusChange = async (id: string, newStatus: 'pending' | 'prayed' | 'answered') => {
        try {
            await updateDoc(doc(db, "prayers", id), { status: newStatus });
            await logActivity(
                'prayer',
                'update',
                `Prayer status updated to ${newStatus}`,
                { prayerId: id, newStatus }
            );
            setPrayers(prayers.map(p => p.id === id ? { ...p, status: newStatus } : p));
        } catch (error) {
            console.error("Error updating status:", error);
            showAlert("Error", "Failed to update status");
        }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        {mode === 'personal' ? (
                            <><i className="fas fa-praying-hands text-blue-400"></i> My Prayers</>
                        ) : mode === 'admin' ? (
                            <><i className="fas fa-tasks text-blue-400"></i> Manage All Prayers</>
                        ) : (
                            <><i className="fas fa-users text-blue-400"></i> Community Prayers</>
                        )}
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {mode === 'personal' ? 'Track your personal prayer requests.' : 'View and manage prayer requests.'}
                    </p>
                </div>
                {/* Add Button (only for personal or admin/volunteer if they want to post) */}
                <button 
                    onClick={() => {
                        setEditId(null);
                        setNewPrayerContent("");
                        setNewPrayerScope('community');
                        setIsCreateOpen(true);
                    }}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-900/20 font-bold flex items-center gap-2"
                >
                    <i className="fas fa-plus"></i> New Request
                </button>
            </div>

            {/* Create Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fade-in-up border border-white/10">
                        <h3 className="text-xl font-bold text-white mb-4">{editId ? 'Edit Prayer Request' : 'New Prayer Request'}</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">My Request</label>
                                <textarea 
                                    rows={4}
                                    required
                                    value={newPrayerContent}
                                    onChange={(e) => setNewPrayerContent(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl focus:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white placeholder:text-slate-500"
                                    placeholder="Share what you need prayer for..."
                                />
                                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={includeSignature}
                                        onChange={(e) => setIncludeSignature(e.target.checked)}
                                        className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500 bg-slate-800 border-white/10"
                                    />
                                    <span className="text-sm text-slate-400">Sign my name in the request</span>
                                </label>
                            </div>
                            
                            
                            {/* Visibility - Admin Only */}
                            {isAdmin && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Visibility</label>
                                    <div className="flex gap-2 bg-slate-800 p-1 rounded-lg border border-white/5">
                                        <button
                                            type="button"
                                            onClick={() => setNewPrayerScope('personal')}
                                            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${newPrayerScope === 'personal' ? 'bg-slate-700 shadow-sm text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            Personal (Private)
                                        </button>
                                         <button
                                            type="button"
                                            onClick={() => setNewPrayerScope('community')}
                                            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${newPrayerScope === 'community' ? 'bg-slate-700 shadow-sm text-green-400' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            Community (Public)
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">
                                        {newPrayerScope === 'personal' ? 'Only you and the ministry team can see this.' : 'Everyone in the community can see and pray for this.'}
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                <button 
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 rounded-lg text-slate-400 font-bold hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={creating}
                                    className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all"
                                >
                                    {creating ? 'Saving...' : (editId ? 'Update Request' : 'Send Request')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {loading ? (
                 <TableSkeleton cols={5} />
            ) : (
                <div className="bg-slate-900 rounded-xl shadow-lg border border-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-400">
                            <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 border-b border-white/5">
                                <tr>
                                    <th scope="col" className="px-6 py-3">User</th>
                                    <th scope="col" className="px-6 py-3 w-1/3">Content</th>
                                    <th scope="col" className="px-6 py-3">Type</th>
                                    <th scope="col" className="px-6 py-3">Date</th>
                                    <th scope="col" className="px-6 py-3">Status</th>
                                    <th scope="col" className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {prayers.map((prayer) => (
                                    <tr key={prayer.id} className="bg-slate-900 hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${prayer.scope === 'personal' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                                    {prayer.userName ? prayer.userName.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <span className="font-medium text-white">{prayer.userName || 'Anonymous'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="line-clamp-2 text-slate-300">{prayer.content}</p>
                                            {prayer.prayerCount > 0 && (
                                                <span className="inline-flex items-center gap-1 text-xs text-blue-400 font-medium mt-1">
                                                    <i className="fas fa-praying-hands"></i> {prayer.prayerCount} prayers
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {prayer.scope === 'community' ? (
                                                <span className="text-xs font-bold px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                                                    Community
                                                </span>
                                            ) : prayer.scope === 'personal' ? (
                                                <span className="text-xs font-bold px-2 py-1 rounded bg-slate-700 text-slate-300 border border-white/5">
                                                    Personal
                                                </span>
                                            ) : (
                                                <span className="text-xs font-bold px-2 py-1 rounded bg-red-500/10 text-red-400 animate-pulse border border-red-500/20">
                                                    Unknown
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
                                                    prayer.status === 'answered' ? 'bg-green-500/10 text-green-400' : 
                                                    prayer.status === 'prayed' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-slate-800 text-slate-300'
                                                }`}
                                                disabled={!(isAdmin || isVolunteer || prayer.userId === user?.uid)}
                                            >
                                                <option value="pending" className="text-black">Pending</option>
                                                <option value="prayed" className="text-black">Prayed</option>
                                                <option value="answered" className="text-black">Answered</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                           {(isAdmin || prayer.userId === user?.uid) ? (
                                               <div className="flex items-center gap-2">
                                                   <button 
                                                        onClick={() => handleEdit(prayer)}
                                                        className="text-blue-400 hover:text-blue-300 font-medium p-2 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                   </button>
                                                   <button 
                                                        onClick={() => handleDelete(prayer.id)}
                                                        className="text-red-400 hover:text-red-300 font-medium p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                   </button>
                                               </div>
                                           ) : null}
                                        </td>
                                    </tr>
                                ))}
                                {prayers.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <i className="fas fa-inbox text-2xl text-slate-700"></i>
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
        </div>
    );
}
