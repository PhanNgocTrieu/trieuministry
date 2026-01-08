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
                     <h1 className="text-2xl font-bold text-white">Ministry Appeals (Donation Requests)</h1>
                     <p className="text-slate-400">Manage fundraising requests submitted by users.</p>
                </div>

                {loading ? (
                     <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-700 border-t-blue-500"></div>
                     </div>
                ) : (
                    <div className="bg-slate-900 rounded-xl shadow-lg border border-white/5 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-800/50 border-b border-white/5 text-xs uppercase text-slate-400">
                                        <th className="px-6 py-4 font-bold">Request Details</th>
                                        <th className="px-6 py-4 font-bold">Submitter</th>
                                        <th className="px-6 py-4 font-bold">Progress</th>
                                        <th className="px-6 py-4 font-bold">Status</th>
                                        <th className="px-6 py-4 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {requests.length > 0 ? (
                                        requests.map((req) => (
                                            <tr key={req.id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-white">{req.title}</div>
                                                    <div className="text-xs text-slate-400 mt-1 line-clamp-1">{req.content}</div>
                                                    <div className="text-xs text-slate-500 mt-1">{formatDate(req.createdAt)}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-sm text-white">{req.name}</div>
                                                    <div className="text-xs text-slate-400">{req.phone}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <div className="space-y-1 min-w-[150px]">
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-slate-500">Raised:</span>
                                                            <span className="font-bold font-mono text-green-400">
                                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(req.currentAmount || 0)}
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-slate-800 rounded-full h-1.5 border border-white/5">
                                                            <div 
                                                                className="bg-blue-500 h-1.5 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                                                                style={{ width: `${Math.min(100, ((req.currentAmount || 0) / parseInt(req.target || '1')) * 100)}%` }}
                                                            ></div>
                                                        </div>
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-slate-500">Target:</span>
                                                            <span className="font-mono text-slate-400">
                                                                {req.target ? parseInt(req.target).toLocaleString() : 'N/A'}
                                                            </span>
                                                        </div>
                                                        
                                                        {(req.status === 'published' || req.status === 'completed') && (
                                                            <button 
                                                                onClick={() => {
                                                                    setEditingAmount(req.id);
                                                                    setNewAmount(req.currentAmount || 0);
                                                                }}
                                                                className="text-xs text-blue-400 hover:text-blue-300 font-bold mt-1"
                                                            >
                                                                Update Amount
                                                            </button>
                                                        )}

                                                        {editingAmount === req.id && (
                                                            <div className="absolute z-10 bg-slate-800 p-4 shadow-xl border border-white/10 rounded-lg mt-2 min-w-[250px]">
                                                                <h4 className="text-xs font-bold uppercase mb-2 text-white">Update Raised Amount</h4>
                                                                <input 
                                                                    type="number" 
                                                                    value={newAmount}
                                                                    onChange={(e) => setNewAmount(parseInt(e.target.value) || 0)}
                                                                    className="w-full border border-white/10 bg-slate-900 text-white rounded px-2 py-1 text-sm mb-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                                                />
                                                                <div className="flex gap-2 justify-end">
                                                                    <button 
                                                                        onClick={() => setEditingAmount(null)}
                                                                        className="text-xs text-slate-400 hover:text-slate-200"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleUpdateAmount(req.id, parseInt(req.target))}
                                                                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-500"
                                                                    >
                                                                        Save
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border 
                                                        ${req.status === 'published' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                                                          req.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                          req.status === 'completed' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                          'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                        {req.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {req.status === 'pending' && (
                                                            <button 
                                                                onClick={() => handleApproveClick(req)}
                                                                className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 transition-colors shadow-lg shadow-green-900/20"
                                                            >
                                                                Approve
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => handleRejectClick(req.id)}
                                                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
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
