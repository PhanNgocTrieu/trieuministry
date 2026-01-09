"use client";

import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, where, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import AdminGuard from '@/components/admin/AdminGuard';
import { useModal } from '@/context/ModalContext';
import { logActivity } from '@/lib/activity-logger';

interface Appeal {
    id: string;
    title: string;
    status: string;
    createdAt: any;
    authorName?: string;
    type?: string;
    // User request specific fields
    name?: string;
    target?: string;
    content?: string;
    currentAmount?: number;
    currency?: string;
}

export default function AdminUserAppealsPage() {
    const [appeals, setAppeals] = useState<Appeal[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const { showAlert, showConfirm } = useModal();

    useEffect(() => {
        // Fetch appeals that are NOT 'official' (aka user requests)
        // Since Firestore inequality queries are tricky with multiple fields, we'll fetch 'user_request' type specifically
        // OR fetch all and filter client side if types are mixed.
        // Let's rely on 'user_request' being set by the updated donate page. 
        // For older ones without type, we might need a workaround, but let's stick to explicit 'user_request'.
        const q = query(
            collection(db, "appeals"), 
            where("type", "==", "user_request"),
            orderBy("createdAt", "desc")
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                currentAmount: doc.data().currentAmount || 0,
                currency: doc.data().currency || 'VND'
            } as Appeal));
            setAppeals(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching appeals:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await updateDoc(doc(db, "appeals", id), { status: newStatus });
            await logActivity('appeal', 'update', `Updated user appeal status to ${newStatus}`);
        } catch (error) {
            console.error("Error updating status:", error);
            showAlert("Error", "Failed to update status");
        }
    };

    const handleDeleteClick = (id: string) => {
        showConfirm(
            "Delete Request",
            "Are you sure you want to delete this request?",
            async () => {
                try {
                    await deleteDoc(doc(db, "appeals", id));
                    await logActivity('appeal', 'delete', 'Deleted a user appeal request');
                    showAlert("Success", "Request deleted successfully.");
                } catch (error) {
                    console.error("Error deleting appeal:", error);
                    showAlert("Error", "Failed to delete appeal");
                }
            },
            true,
            "Delete"
        );
    };

    const filteredAppeals = appeals.filter(appeal => {
        if (filter === 'all') return true;
        return appeal.status === filter;
    });

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp.seconds * 1000).toLocaleDateString();
    };

    return (
        <AdminGuard>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ministry Appeals (User Requests)</h1>
                        <p className="text-slate-500 dark:text-slate-400">Manage donation requests submitted by users.</p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex border-b border-slate-200 dark:border-white/10">
                    {['all', 'pending', 'published', 'rejected'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors capitalize ${
                                filter === status 
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                {loading ? (
                     <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-300 dark:border-slate-700 border-t-blue-500"></div>
                        <p className="mt-2 text-slate-500">Loading requests...</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-white/5 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/5 text-xs uppercase text-slate-500 dark:text-slate-400">
                                        <th className="px-6 py-4 font-bold">User / Title</th>
                                        <th className="px-6 py-4 font-bold">Progress (Raised / Target)</th>
                                        <th className="px-6 py-4 font-bold">Status</th>
                                        <th className="px-6 py-4 font-bold">Date</th>
                                        <th className="px-6 py-4 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                                    {filteredAppeals.length > 0 ? (
                                        filteredAppeals.map((appeal) => (
                                            <tr key={appeal.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-900 dark:text-white">{appeal.title || 'No Title'}</div>
                                                    <div className="text-xs text-slate-500">by {appeal.name || 'Anonymous'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1 min-w-[200px]">
                                                        <div className="flex justify-between text-xs mb-1">
                                                            <span className="font-bold text-blue-600 dark:text-blue-400">
                                                                {new Intl.NumberFormat(appeal.currency === 'USD' ? 'en-US' : 'vi-VN', { style: 'currency', currency: appeal.currency || 'VND' }).format(appeal.currentAmount || 0)}
                                                            </span>
                                                            <span className="text-slate-500">
                                                                / {new Intl.NumberFormat(appeal.currency === 'USD' ? 'en-US' : 'vi-VN', { style: 'currency', currency: appeal.currency || 'VND' }).format(Number(appeal.target) || 0)}
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5">
                                                            <div 
                                                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(37,99,235,0.5)]" 
                                                                style={{ width: `${Math.min(100, ((appeal.currentAmount || 0) / (Number(appeal.target) || 1)) * 100)}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={appeal.status}
                                                        onChange={(e) => handleStatusChange(appeal.id, e.target.value)}
                                                        className={`text-xs font-bold px-2 py-1 rounded border outline-none cursor-pointer ${
                                                            appeal.status === 'published' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' :
                                                            appeal.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20' :
                                                            'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                                        }`}
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="published">Published</option>
                                                        <option value="rejected">Rejected</option>
                                                        <option value="draft">Draft</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-400">
                                                    {formatDate(appeal.createdAt)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Link 
                                                            href={`/admin/user-appeals/${appeal.id}/edit`}
                                                            className="p-2 text-blue-500 dark:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                            title="Edit Details"
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </Link>
                                                        <button 
                                                            onClick={() => handleDeleteClick(appeal.id)}
                                                            className="p-2 text-red-500 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-600">
                                                <i className="fas fa-inbox text-4xl mb-3 opacity-50"></i>
                                                <p>No ministry appeals found.</p>
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
