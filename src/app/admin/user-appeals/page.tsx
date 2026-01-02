"use client";

import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, where, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import AdminGuard from '@/components/admin/AdminGuard';
import ConfirmModal from '@/components/admin/ConfirmModal';

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
}

export default function AdminUserAppealsPage() {
    const [appeals, setAppeals] = useState<Appeal[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [deleteId, setDeleteId] = useState<string | null>(null);

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

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await updateDoc(doc(db, "appeals", id), { status: newStatus });
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteDoc(doc(db, "appeals", deleteId));
        } catch (error) {
            console.error("Error deleting appeal:", error);
            alert("Failed to delete appeal");
        } finally {
            setDeleteId(null);
        }
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
                        <h1 className="text-2xl font-bold text-gray-900">Ministry Appeals (User Requests)</h1>
                        <p className="text-gray-500">Manage donation requests submitted by users.</p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex border-b border-gray-200">
                    {['all', 'pending', 'published', 'rejected'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors capitalize ${
                                filter === status 
                                ? 'border-blue-600 text-blue-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                {loading ? (
                     <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
                        <p className="mt-2 text-gray-500">Loading requests...</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500">
                                        <th className="px-6 py-4 font-bold">User / Title</th>
                                        <th className="px-6 py-4 font-bold">Target</th>
                                        <th className="px-6 py-4 font-bold">Status</th>
                                        <th className="px-6 py-4 font-bold">Date</th>
                                        <th className="px-6 py-4 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredAppeals.length > 0 ? (
                                        filteredAppeals.map((appeal) => (
                                            <tr key={appeal.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900">{appeal.title || 'No Title'}</div>
                                                    <div className="text-xs text-gray-400">by {appeal.name || 'Anonymous'}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium">
                                                    {appeal.target}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={appeal.status}
                                                        onChange={(e) => handleStatusChange(appeal.id, e.target.value)}
                                                        className={`text-xs font-bold px-2 py-1 rounded border outline-none ${
                                                            appeal.status === 'published' ? 'bg-green-50 text-green-700 border-green-200' :
                                                            appeal.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                            'bg-gray-50 text-gray-600 border-gray-200'
                                                        }`}
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="published">Published</option>
                                                        <option value="rejected">Rejected</option>
                                                        <option value="draft">Draft</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {formatDate(appeal.createdAt)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Link 
                                                            href={`/admin/user-appeals/${appeal.id}/edit`}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                            title="Edit Details"
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </Link>
                                                        <button 
                                                            onClick={() => setDeleteId(appeal.id)}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
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
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                                <i className="fas fa-inbox text-4xl mb-3 opacity-20"></i>
                                                <p>No ministry appeals found.</p>
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
                    title="Delete Request"
                    message="Are you sure you want to delete this request?"
                    confirmText="Delete"
                    isDangerous={true}
                />
            </div>
        </AdminGuard>
    );
}
