"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc, updateDoc, orderBy, query } from "firebase/firestore";
import Link from "next/link";
import TableSkeleton from "@/components/admin/TableSkeleton";
import { useModal } from "@/context/ModalContext";

interface Ministry {
    id: string;
    title: string;
    description: string;
    status: 'active' | 'completed' | 'on-hold';
    visibility: 'public' | 'private' | 'shared';
    sharedWith?: string[];
    createdAt: any;
}

export default function AdminMinistriesPage() {
    const [ministries, setMinistries] = useState<Ministry[]>([]);
    const [loading, setLoading] = useState(true);
    const { showAlert, showConfirm } = useModal();

    const fetchMinistries = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "ministries"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const list: Ministry[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                list.push({ id: doc.id, ...data } as Ministry);
            });
            setMinistries(list);
        } catch (error) {
            console.error("Error fetching ministries:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMinistries();
    }, []);

    const handleDelete = async (id: string) => {
        showConfirm(
            "Delete Ministry",
            "Are you sure you want to delete this ministry? This action cannot be undone.",
            async () => {
                try {
                    await deleteDoc(doc(db, "ministries", id));
                    setMinistries(ministries.filter(p => p.id !== id));
                    showAlert("Success", "Ministry deleted successfully.");
                } catch (error) {
                    console.error("Error deleting ministry:", error);
                    showAlert("Error", "Failed to delete ministry");
                }
            },
            true
        );
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            await updateDoc(doc(db, "ministries", id), { status: newStatus });
            setMinistries(ministries.map(a => a.id === id ? { ...a, status: newStatus as any } : a));
        } catch (error) {
            console.error("Error updating status:", error);
            showAlert("Error", "Failed to update status");
        }
    };

    if (loading) {
       return (
             <div>
                 <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ministry Management</h1>
                </div>
                {/* Custom dark skeleton or standard one with overrides */}
                <div className="animate-pulse space-y-4">
                     {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-200 dark:bg-slate-800/50 rounded-xl w-full"></div>)}
                </div>
            </div>
        );
    }

    return (
        <div>

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ministry Management</h1>
                <Link href="/admin/ministries/create?returnUrl=/admin/ministries" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-900/20">
                    <i className="fas fa-plus"></i> Add Ministry
                </Link>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-white/5 overflow-hidden">
                <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-xs text-slate-700 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/5">
                        <tr>
                            <th scope="col" className="px-6 py-3">Title</th>
                            <th scope="col" className="px-6 py-3">Visibility</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                        {ministries.map((item) => (
                            <tr key={item.id} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900 dark:text-white">{item.title}</div>
                                    <div className="text-xs text-slate-500 truncate max-w-[200px]">{item.description}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${
                                        item.visibility === 'public' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                        item.visibility === 'private' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    }`}>
                                        <i className={`fas mr-1 ${
                                            item.visibility === 'public' ? 'fa-globe' :
                                            item.visibility === 'private' ? 'fa-lock' :
                                            'fa-user-friends'
                                        }`}></i>
                                        {item.visibility}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <select 
                                        value={item.status}
                                        onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
                                        className={`px-2 py-1 rounded text-xs font-bold uppercase border-none focus:ring-0 cursor-pointer ${
                                            {
                                                'on-hold': 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
                                                active: 'bg-green-500/10 text-green-600 dark:text-green-400',
                                                completed: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
                                            }[item.status] || 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                        }`}
                                    >
                                        <option value="active" className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">Active</option>
                                        <option value="completed" className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">Completed</option>
                                        <option value="on-hold" className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">On Hold</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4">
                                    {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="px-6 py-4 flex gap-3">
                                    <Link href={`/admin/ministries/${item.id}/edit`} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300" title="Edit">
                                        <i className="fas fa-edit"></i>
                                    </Link>
                                    <button onClick={() => handleDelete(item.id)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300" title="Delete">
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {ministries.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                    No ministries found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
