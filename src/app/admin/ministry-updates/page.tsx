"use client";

import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import AdminGuard from '@/components/admin/AdminGuard';
import { useModal } from '@/context/ModalContext';
import { logActivity } from '@/lib/activity-logger';

interface MinistryUpdate {
    id: string;
    title: string;
    titleEn?: string;
    status: string; // 'published', 'draft'
    createdAt: any;
    authorName?: string;
    type?: string; 
    month?: number;
    year?: number;
}

export default function AdminMinistryUpdatesPage() {
    const [updates, setUpdates] = useState<MinistryUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const { showAlert, showConfirm } = useModal();

    useEffect(() => {
        // Fetch valid "Ministry Updates" (formerly Official Appeals)
        // We look for type == "official"
        // We remove orderBy("createdAt") from query to sort client-side by custom month/year
        const q = query(collection(db, "appeals"), where("type", "==", "official"));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as MinistryUpdate));

            // Client-side sort: Year DESC -> Month DESC -> CreatedAt DESC
            data.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
                const dateB = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);

                const yearA = a.year || dateA.getFullYear();
                const yearB = b.year || dateB.getFullYear();
                
                if (yearB !== yearA) return yearB - yearA;

                const monthA = a.month || (dateA.getMonth() + 1);
                const monthB = b.month || (dateB.getMonth() + 1);
                
                if (monthB !== monthA) return monthB - monthA;

                return dateB.getTime() - dateA.getTime();
            });

            setUpdates(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching updates:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleDeleteClick = (id: string) => {
        showConfirm(
            "Delete Update",
            "Are you sure you want to delete this ministry update? This action cannot be undone.",
            async () => {
                try {
                    await deleteDoc(doc(db, "appeals", id));
                    await logActivity('ministry_update', 'delete', 'Deleted a ministry update letter');
                    showAlert("Success", "Update deleted successfully.");
                } catch (error) {
                    console.error("Error deleting update:", error);
                    showAlert("Error", "Failed to delete update");
                }
            },
            true, // isDestructive
            "Delete"
        );
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp.seconds * 1000).toLocaleDateString();
    };

    return (
        <AdminGuard>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ministry Updates</h1>
                        <p className="text-slate-500 dark:text-slate-400">Manage official letters and ministry updates.</p>
                    </div>
                     <div className="flex gap-3">
                        <Link 
                            href="/appeals" 
                            className="px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg font-bold shadow-sm flex items-center gap-2 transition-all hover:text-slate-900 dark:hover:text-white"
                        >
                            <i className="fas fa-external-link-alt"></i>
                            View Page
                        </Link>
                        <Link 
                            href="/admin/ministry-updates/create" 
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all"
                        >
                            <i className="fas fa-plus"></i>
                            New Update
                        </Link>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-700 border-t-blue-500"></div>
                        <p className="mt-2 text-slate-500">Loading updates...</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-white/5 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/5 text-xs uppercase text-slate-500 dark:text-slate-400 sticky top-0">
                                        <th className="px-6 py-4 font-bold">Title (VI / EN)</th>
                                        <th className="px-6 py-4 font-bold">Month/Year</th>
                                        <th className="px-6 py-4 font-bold">Status</th>
                                        <th className="px-6 py-4 font-bold">Date Created</th>
                                        <th className="px-6 py-4 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {updates.length > 0 ? (
                                        updates.map((update) => (
                                            <tr key={update.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-900 dark:text-white">{update.title || 'Untitled'}</div>
                                                    {update.titleEn && (
                                                        <div className="text-sm text-slate-500 italic">{update.titleEn}</div>
                                                    )}
                                                    {update.authorName && <div className="text-xs text-slate-400 mt-1">by {update.authorName}</div>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {update.month && update.year ? (
                                                        <span className="font-bold text-blue-600 dark:text-blue-400">
                                                            {update.month}/{update.year}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 italic text-xs">Not set</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border
                                                        ${update.status === 'published' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' : 
                                                          'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                                                        {update.status || 'Draft'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    {formatDate(update.createdAt)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Link 
                                                            href={`/admin/ministry-updates/${update.id}/edit`}
                                                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </Link>
                                                        <button 
                                                            onClick={() => handleDeleteClick(update.id)}
                                                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <i className="fas fa-trash-alt"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                                <i className="fas fa-inbox text-4xl mb-3 opacity-20"></i>
                                                <p>No ministry updates found.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AdminGuard>
    );
}
