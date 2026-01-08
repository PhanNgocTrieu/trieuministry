"use client";

import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import AdminGuard from '@/components/admin/AdminGuard';
import { useModal } from '@/context/ModalContext';

interface Appeal {
    id: string;
    title: string;
    status: string; // 'published', 'draft', 'pending'
    createdAt: any;
    authorName?: string;
    type?: string; // 'official' vs 'user_request'
}

export default function AdminAppealsPage() {
    const [appeals, setAppeals] = useState<Appeal[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, published, pending
    const { showAlert, showConfirm } = useModal();

    useEffect(() => {
        const q = query(collection(db, "appeals"), where("type", "==", "official"), orderBy("createdAt", "desc"));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Appeal));
            setAppeals(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching appeals:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleDeleteClick = (id: string) => {
        showConfirm(
            "Delete Appeal",
            "Are you sure you want to delete this appeal? This action cannot be undone.",
            async () => {
                try {
                    await deleteDoc(doc(db, "appeals", id));
                    showAlert("Success", "Appeal deleted successfully.");
                } catch (error) {
                    console.error("Error deleting appeal:", error);
                    showAlert("Error", "Failed to delete appeal");
                }
            },
            true, // isDangerous
            "Delete" // confirmText
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
                        <h1 className="text-2xl font-bold text-white">Manage Appeals</h1>
                        <p className="text-slate-400">Create, edit, and manage appeal letters and requests.</p>
                    </div>
                     <div className="flex gap-3">
                        <Link 
                            href="/appeals"
                            className="px-5 py-2.5 bg-slate-800 text-slate-300 border border-white/10 hover:bg-slate-700 rounded-lg font-bold shadow-sm flex items-center gap-2 transition-all hover:text-white"
                        >
                            <i className="fas fa-external-link-alt"></i>
                            View Public Page
                        </Link>
                        <Link 
                            href="/admin/appeals/create" 
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all"
                        >
                            <i className="fas fa-plus"></i>
                            New Appeal Letter
                        </Link>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex border-b border-white/10">
                    {['all', 'published', 'draft', 'pending'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors capitalize ${
                                filter === status 
                                ? 'border-blue-500 text-blue-400' 
                                : 'border-transparent text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-700 border-t-blue-500"></div>
                        <p className="mt-2 text-slate-500">Loading appeals...</p>
                    </div>
                ) : (
                    <div className="bg-slate-900 rounded-xl shadow-lg border border-white/5 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-800/50 border-b border-white/5 text-xs uppercase text-slate-400 sticky top-0">
                                        <th className="px-6 py-4 font-bold">Title</th>
                                        <th className="px-6 py-4 font-bold">Status</th>
                                        <th className="px-6 py-4 font-bold">Type</th>
                                        <th className="px-6 py-4 font-bold">Created At</th>
                                        <th className="px-6 py-4 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredAppeals.length > 0 ? (
                                        filteredAppeals.map((appeal) => (
                                            <tr key={appeal.id} className="hover:bg-slate-800/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-white">{appeal.title || 'Untitled Appeal'}</div>
                                                    {appeal.authorName && <div className="text-xs text-slate-500">by {appeal.authorName}</div>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border
                                                        ${appeal.status === 'published' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                                                          appeal.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                          'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                                        {appeal.status || 'Draft'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${
                                                        appeal.type === 'official' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
                                                    }`}>
                                                        {appeal.type === 'official' ? 'Official Letter' : 'Request'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    {formatDate(appeal.createdAt)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Link 
                                                            href={`/admin/appeals/${appeal.id}/edit`}
                                                            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </Link>
                                                        <button 
                                                            onClick={() => handleDeleteClick(appeal.id)}
                                                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                                <i className="fas fa-inbox text-4xl mb-3 opacity-20"></i>
                                                <p>No appeals found.</p>
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
