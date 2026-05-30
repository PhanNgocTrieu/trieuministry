"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc, where, addDoc, serverTimestamp } from "firebase/firestore";
import TableSkeleton from "@/components/admin/TableSkeleton";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { logActivity } from "@/lib/activity-logger";
import { useLanguage } from "@/context/LanguageContext";

interface PrayerData {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    title?: string;
    action?: string;
    status: 'pending' | 'prayed' | 'answered' | 'not_prayed';
    createdAt: any;
    updatedAt?: any;
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
    const { t } = useLanguage(); // Ensure you have useLanguage hook if using 't'

    // Unified State
    const [isOpen, setIsOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    
    // Form State
    const [editContent, setEditContent] = useState("");
    const [editTitle, setEditTitle] = useState("");
    const [editAction, setEditAction] = useState("");
    const [viewType, setViewType] = useState<'personal' | 'community'>('community');
    const [showName, setShowName] = useState(true);
    
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !editContent.trim()) return;
        setIsSubmitting(true);

        try {
            const prayerData: Partial<PrayerData> = {
                content: editContent,
                title: editTitle,
                action: editAction,
                type: viewType,
                scope: viewType, // Keep legacy scope in sync
                userName: showName ? (user.displayName || user.email?.split('@')[0] || 'Anonymous') : 'Anonymous',
                userAvatar: showName ? (user.photoURL || '') : '',
                userId: user.uid,
                updatedAt: serverTimestamp(),
                status: editAction ? 'answered' : (editId ? undefined : 'not_prayed')
            };

            // Remove undefined fields
            Object.keys(prayerData).forEach(key => prayerData[key as keyof typeof prayerData] === undefined && delete prayerData[key as keyof typeof prayerData]);

            if (editId) {
                await updateDoc(doc(db, "prayers", editId), prayerData);
                await logActivity(
                    'prayer',
                    'update',
                    `Updated prayer request: ${editContent.substring(0, 30)}...`,
                    { prayerId: editId, scope: viewType }
                );
                showAlert("Success", "Prayer request updated.");
            } else {
                await addDoc(collection(db, "prayers"), {
                    ...prayerData,
                    status: editAction ? 'answered' : 'not_prayed',
                    prayerCount: 0,
                    createdAt: serverTimestamp()
                });
                await logActivity(
                    'prayer',
                    'create',
                    `New (Manager) ${viewType} prayer request`,
                    { userId: user.uid, scope: viewType }
                );
                showAlert("Success", "Prayer request created.");
            }
            
            closeModal();
            fetchPrayers();
        } catch (error) {
            console.error(error);
            showAlert("Error", "Failed to save prayer request");
        } finally {
            setIsSubmitting(false);
        }
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
            setPrayers(prayers.map(p => p.id === id ? { ...p, status: newStatus } : p));
        } catch (error) {
            console.error("Error updating status:", error);
            showAlert("Error", "Failed to update status");
        }
    };

    const openNew = () => {
        setEditId(null);
        setEditContent("");
        setEditTitle("");
        setEditAction("");
        setViewType('community');
        setShowName(true);
        setIsOpen(true);
    };

    const openEdit = (prayer: PrayerData) => {
        setEditId(prayer.id);
        setEditContent(prayer.content);
        setEditTitle(prayer.title || "");
        setEditAction(prayer.action || ""); // Fix: handle undefined action
        setViewType((prayer.type as 'personal' | 'community') || (prayer.scope as 'personal' | 'community') || 'personal');
        setShowName(prayer.userName !== 'Anonymous');
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
        setEditId(null);
        setEditContent("");
        setEditTitle("");
        setEditAction("");
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        {mode === 'personal' ? (
                            <><i className="fas fa-praying-hands text-blue-600 dark:text-blue-400"></i> My Prayers</>
                        ) : mode === 'admin' ? (
                            <><i className="fas fa-tasks text-blue-600 dark:text-blue-400"></i> Manage All Prayers</>
                        ) : (
                            <><i className="fas fa-users text-blue-600 dark:text-blue-400"></i> Community Prayers</>
                        )}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        {mode === 'personal' ? 'Track your personal prayer requests.' : 'View and manage prayer requests.'}
                    </p>
                </div>
                <button 
                    onClick={openNew}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-900/20 font-bold flex items-center gap-2"
                >
                    <i className="fas fa-plus"></i> New Request
                </button>
            </div>

            {/* Create/Edit Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-up border border-slate-200 dark:border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="p-6 border-b border-slate-200 dark:border-white/10">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{editId ? 'Edit Prayer Request' : 'New Prayer Request'}</h3>
                        </div>
                        
                        <form onSubmit={handleSave}>
                            <div className="p-6 space-y-4">
                                {/* Title Field */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all placeholder:text-slate-400"
                                        placeholder="e.g., Healing for my family"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Content Field */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Request Details <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all placeholder:text-slate-400"
                                        placeholder="Share what you need prayer for..."
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Answer Field (Only for editing) */}
                                {editId && (
                                    <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-900/20">
                                        <label className="block text-sm font-bold text-green-800 dark:text-green-400 mb-1">
                                            <i className="fas fa-bolt mr-2"></i>God's Answer / Testimony
                                        </label>
                                        <textarea
                                            className="w-full bg-white dark:bg-slate-950 border border-green-200 dark:border-green-800/30 text-slate-900 dark:text-white rounded-xl px-4 py-3 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-green-500 transition-all placeholder:text-slate-400"
                                            placeholder="Share how God has answered this prayer..."
                                            value={editAction}
                                            onChange={(e) => setEditAction(e.target.value)}
                                        />
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="showName"
                                        checked={showName}
                                        onChange={(e) => setShowName(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-700 focus:ring-blue-600 bg-slate-100 dark:bg-slate-800"
                                    />
                                    <label htmlFor="showName" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                                        Sign my name in the request
                                    </label>
                                </div>

                                {isAdmin && (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                            Visibility
                                        </label>
                                        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/5">
                                            <button
                                                type="button"
                                                className={`py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                                                    viewType === 'personal'
                                                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                                }`}
                                                onClick={() => setViewType('personal')}
                                            >
                                                Personal
                                            </button>
                                            <button
                                                type="button"
                                                className={`py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                                                    viewType === 'community'
                                                        ? 'bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-sm'
                                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                                }`}
                                                onClick={() => setViewType('community')}
                                            >
                                                Community
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2 ml-1">
                                            {viewType === 'personal' 
                                                ? 'Only you and the ministry team can see this.' 
                                                : 'Everyone in the community can see and pray for this.'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-slate-100 dark:border-white/5 flex gap-3 justify-end bg-slate-50/50 dark:bg-slate-900/50 rounded-b-2xl">
                                <button 
                                    type="button"
                                    onClick={closeModal}
                                    className="px-5 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSubmitting || !editContent.trim()}
                                    className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSubmitting && <i className="fas fa-spinner fa-spin"></i>}
                                    {editId ? 'Update Request' : 'Post Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {loading ? (
                 <TableSkeleton cols={5} />
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
                            <thead className="text-xs text-slate-700 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/5">
                                <tr>
                                    <th scope="col" className="px-6 py-3">User</th>
                                    <th scope="col" className="px-6 py-3 w-1/3">Content</th>
                                    <th scope="col" className="px-6 py-3">Type</th>
                                    <th scope="col" className="px-6 py-3">Date</th>
                                    <th scope="col" className="px-6 py-3">Status</th>
                                    <th scope="col" className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {prayers.map((prayer) => (
                                    <tr key={prayer.id} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${prayer.scope === 'personal' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'}`}>
                                                    {prayer.userName ? prayer.userName.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <span className="font-medium text-slate-900 dark:text-white">{prayer.userName || 'Anonymous'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-800 dark:text-white mb-1 line-clamp-1">{prayer.title || 'Untitled'}</p>
                                            <p className="line-clamp-2 text-slate-600 dark:text-slate-300">{prayer.content}</p>
                                            {prayer.action && (
                                                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-green-600 dark:text-green-400 mt-1 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                                                    <i className="fas fa-check-circle"></i> Answered
                                                </span>
                                            )}
                                            {prayer.prayerCount > 0 && (
                                                <span className="inline-flex items-center gap-1 text-xs text-blue-400 font-medium mt-1 ml-2">
                                                    <i className="fas fa-praying-hands"></i> {prayer.prayerCount} prayers
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {prayer.scope === 'community' ? (
                                                <span className="text-xs font-bold px-2 py-1 rounded bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                                                    Community
                                                </span>
                                            ) : prayer.scope === 'personal' ? (
                                                <span className="text-xs font-bold px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5">
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
                                                className={`text-xs font-bold px-2 py-1 rounded border-0 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500 ${
                                                    prayer.status === 'answered' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 
                                                    prayer.status === 'prayed' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' : 
                                                    'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300'
                                                }`}
                                                disabled={!(isAdmin || isVolunteer || prayer.userId === user?.uid)}
                                            >
                                                <option value="pending" className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">Pending</option>
                                                <option value="prayed" className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">Prayed</option>
                                                <option value="answered" className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">Answered</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                           {(isAdmin || prayer.userId === user?.uid) ? (
                                               <div className="flex items-center gap-2">
                                                   <button 
                                                        onClick={() => openEdit(prayer)}
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
