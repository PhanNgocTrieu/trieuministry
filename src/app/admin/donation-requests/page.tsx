"use client";

import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AdminGuard from '@/components/admin/AdminGuard';

interface DonationRequest {
    id: string;
    title: string;
    content: string;
    name: string; // Submitter name
    phone: string;
    target: string; // Target amount
    status: string; // 'published', 'pending', 'rejected'
    createdAt: any;
    type?: string; 
}

import ConfirmModal from '@/components/admin/ConfirmModal'; // Added import

interface ModalConfig {
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
    isDangerous: boolean;
    confirmText?: string;
}

export default function DonationRequestsPage() {
    const [requests, setRequests] = useState<DonationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalConfig, setModalConfig] = useState<ModalConfig>({
        isOpen: false,
        title: '',
        message: '',
        action: async () => {},
        isDangerous: false
    });

    useEffect(() => {
        // ... (keep existing useEffect logic)
        const q = query(collection(db, "appeals"), orderBy("createdAt", "desc"));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: DonationRequest[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.type !== 'official') {
                    list.push({ id: doc.id, ...data } as DonationRequest);
                }
            });
            setRequests(list);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching requests:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const performApprove = async (id: string) => {
        try {
            await updateDoc(doc(db, "appeals", id), {
                status: 'published',
                type: 'user_request'
            });
        } catch (error) {
            console.error("Error approving:", error);
            alert("Failed to approve request"); // Fallback alert for error
        }
    };

    const performReject = async (id: string) => {
        try {
            await deleteDoc(doc(db, "appeals", id));
        } catch (error) {
            console.error("Error deleting:", error);
            alert("Failed to delete request"); // Fallback alert for error
        }
    };

    const handleApproveClick = (id: string) => {
        setModalConfig({
            isOpen: true,
            title: "Approve Request",
            message: "Approve this request? It will be published to the website.",
            action: () => performApprove(id),
            isDangerous: false,
            confirmText: "Approve"
        });
    };

    const handleRejectClick = (id: string) => {
        setModalConfig({
            isOpen: true,
            title: "Reject Request",
            message: "Reject (Delete) this request? This action cannot be undone.",
            action: () => performReject(id),
            isDangerous: true,
            confirmText: "Reject & Delete"
        });
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp.seconds * 1000).toLocaleDateString();
    };

    return (
        <AdminGuard>
            <div className="space-y-6">
                {/* ... existing header and loading ... */}
                
                {/* ... (keep header) ... */}
                <div>
                     <h1 className="text-2xl font-bold text-gray-900">Ministry Appeals (Donation Requests)</h1>
                     <p className="text-gray-500">Manage fundraising requests submitted by users.</p>
                </div>

                {loading ? (
                     <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
                     </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                {/* ... thead ... */}
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500">
                                        <th className="px-6 py-4 font-bold">Request Details</th>
                                        <th className="px-6 py-4 font-bold">Submitter</th>
                                        <th className="px-6 py-4 font-bold">Target</th>
                                        <th className="px-6 py-4 font-bold">Status</th>
                                        <th className="px-6 py-4 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {requests.length > 0 ? (
                                        requests.map((req) => (
                                            <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900">{req.title}</div>
                                                    <div className="text-xs text-gray-400 mt-1 line-clamp-1">{req.content}</div>
                                                    <div className="text-xs text-gray-400 mt-1">{formatDate(req.createdAt)}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-sm">{req.name}</div>
                                                    <div className="text-xs text-gray-500">{req.phone}</div>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-sm">
                                                    {req.target ? `${parseInt(req.target).toLocaleString()} VND` : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize
                                                        ${req.status === 'published' ? 'bg-green-100 text-green-700' : 
                                                          req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                          'bg-red-100 text-red-700'}`}>
                                                        {req.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {req.status === 'pending' && (
                                                            <button 
                                                                onClick={() => handleApproveClick(req.id)}
                                                                className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 transition-colors"
                                                            >
                                                                Approve
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => handleRejectClick(req.id)}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete / Reject"
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
                                                <p>No donation requests found.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <ConfirmModal
                    isOpen={modalConfig.isOpen}
                    onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                    onConfirm={modalConfig.action}
                    title={modalConfig.title}
                    message={modalConfig.message}
                    isDangerous={modalConfig.isDangerous}
                    confirmText={modalConfig.confirmText}
                />
            </div>
        </AdminGuard>
    );
}
