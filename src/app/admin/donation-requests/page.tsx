"use client";

import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AdminGuard from '@/components/admin/AdminGuard';
import { useModal } from '@/context/ModalContext';

interface DonationRequest {
    id: string;
    title: string;
    content: string;
    name: string; // Submitter name
    phone: string;
    target: string; // Target amount
    currentAmount?: number; // Current raised amount
    status: string; // 'published', 'pending', 'rejected', 'completed'
    createdAt: any;
    type?: string; 
}

export default function DonationRequestsPage() {
    const [requests, setRequests] = useState<DonationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const { showAlert, showConfirm } = useModal();
    const [editingAmount, setEditingAmount] = useState<string | null>(null);
    const [newAmount, setNewAmount] = useState<number>(0);

    useEffect(() => {
        const q = query(collection(db, "appeals"), orderBy("createdAt", "desc"));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: DonationRequest[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.type !== 'official') {
                    list.push({ id: doc.id, ...data, currentAmount: data.currentAmount || 0 } as DonationRequest);
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

    const performApprove = async (id: string, request: DonationRequest) => {
        try {
            await updateDoc(doc(db, "appeals", id), {
                status: 'published',
                type: 'user_request',
                currentAmount: request.currentAmount || 0
            });
            showAlert("Success", "Request approved and published.");
        } catch (error) {
            console.error("Error approving:", error);
            showAlert("Error", "Failed to approve request");
        }
    };

    const performReject = async (id: string) => {
        try {
            await deleteDoc(doc(db, "appeals", id));
            showAlert("Success", "Request rejected and deleted.");
        } catch (error) {
            console.error("Error deleting:", error);
            showAlert("Error", "Failed to delete request");
        }
    };

    const handleUpdateAmount = async (id: string, target: number) => {
        try {
            let status = 'published';
            if (newAmount >= target) {
                status = 'completed';
            }

            await updateDoc(doc(db, "appeals", id), {
                currentAmount: newAmount,
                status: status
            });

            if (status === 'completed') {
                showAlert("Success", "Amount updated. Goal reached! Status set to completed.");
            } else {
                showAlert("Success", "Current amount updated.");
            }
            setEditingAmount(null);
        } catch (error) {
            console.error("Error updating amount:", error);
            showAlert("Error", "Failed to update amount");
        }
    };

    const handleApproveClick = (request: DonationRequest) => {
        showConfirm(
            "Approve Request",
            "Approve this request? It will be published to the website.",
            () => performApprove(request.id, request),
            false,
            "Approve"
        );
    };

    const handleRejectClick = (id: string) => {
        showConfirm(
            "Reject Request",
            "Reject (Delete) this request? This action cannot be undone.",
            () => performReject(id),
            true,
            "Reject & Delete"
        );
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp.seconds * 1000).toLocaleDateString();
    };

    return (
        <AdminGuard>
            <div className="space-y-6">
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
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500">
                                        <th className="px-6 py-4 font-bold">Request Details</th>
                                        <th className="px-6 py-4 font-bold">Submitter</th>
                                        <th className="px-6 py-4 font-bold">Progress</th>
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
                                                <td className="px-6 py-4 text-sm">
                                                    <div className="space-y-1 min-w-[150px]">
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-gray-500">Raised:</span>
                                                            <span className="font-bold font-mono">
                                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(req.currentAmount || 0)}
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                            <div 
                                                                className="bg-blue-600 h-1.5 rounded-full" 
                                                                style={{ width: `${Math.min(100, ((req.currentAmount || 0) / parseInt(req.target || '1')) * 100)}%` }}
                                                            ></div>
                                                        </div>
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-gray-500">Target:</span>
                                                            <span className="font-mono text-gray-700">
                                                                {req.target ? parseInt(req.target).toLocaleString() : 'N/A'}
                                                            </span>
                                                        </div>
                                                        
                                                        {(req.status === 'published' || req.status === 'completed') && (
                                                            <button 
                                                                onClick={() => {
                                                                    setEditingAmount(req.id);
                                                                    setNewAmount(req.currentAmount || 0);
                                                                }}
                                                                className="text-xs text-blue-600 hover:text-blue-800 font-bold mt-1"
                                                            >
                                                                Update Amount
                                                            </button>
                                                        )}

                                                        {editingAmount === req.id && (
                                                            <div className="absolute z-10 bg-white p-4 shadow-xl border border-gray-200 rounded-lg mt-2 min-w-[250px]">
                                                                <h4 className="text-xs font-bold uppercase mb-2">Update Raised Amount</h4>
                                                                <input 
                                                                    type="number" 
                                                                    value={newAmount}
                                                                    onChange={(e) => setNewAmount(parseInt(e.target.value) || 0)}
                                                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm mb-2"
                                                                />
                                                                <div className="flex gap-2 justify-end">
                                                                    <button 
                                                                        onClick={() => setEditingAmount(null)}
                                                                        className="text-xs text-gray-500 hover:text-gray-700"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleUpdateAmount(req.id, parseInt(req.target))}
                                                                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                                                                    >
                                                                        Save
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize
                                                        ${req.status === 'published' ? 'bg-green-100 text-green-700' : 
                                                          req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                          req.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                                          'bg-red-100 text-red-700'}`}>
                                                        {req.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {req.status === 'pending' && (
                                                            <button 
                                                                onClick={() => handleApproveClick(req)}
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
            </div>
        </AdminGuard>
    );
}
