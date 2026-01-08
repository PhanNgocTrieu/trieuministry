"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import AdminGuard from '@/components/admin/AdminGuard';
import ImageUploader from '@/components/ImageUploader';
import { useModal } from '@/context/ModalContext';

export default function EditUserAppealPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    
    const [formData, setFormData] = useState({
        title: '',
        name: '', // Submitter name
        phone: '',
        status: 'pending',
        target: 0,
        content: '',
        bankName: '',
        bankAccount: '',
        bankOwner: '',
        bankQR: '',
        currency: 'VND',
        currentAmount: 0
    });

    const { showAlert } = useModal();

    useEffect(() => {
        const fetchAppeal = async () => {
            try {
                const docRef = doc(db, "appeals", id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData({
                        title: data.title || '',
                        name: data.name || '',
                        phone: data.phone || '',
                        status: data.status || 'pending',
                        target: data.target || 0,
                        content: data.content || '',
                        bankName: data.bankName || '',
                        bankAccount: data.bankAccount || '',
                        bankOwner: data.bankOwner || '',
                        bankQR: data.bankQR || '',
                        currency: data.currency || 'VND',
                        currentAmount: data.currentAmount || 0
                    });
                } else {
                    showAlert("Error", "Appeal not found");
                    router.push("/admin/user-appeals");
                }
            } catch (error) {
                console.error("Error fetching appeal:", error);
                showAlert("Error", "Error fetching appeal");
            } finally {
                setFetching(false);
            }
        };

        if (id) fetchAppeal();
    }, [id, router, showAlert]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await updateDoc(doc(db, "appeals", id), {
                ...formData,
                target: Number(formData.target),
                currentAmount: Number(formData.currentAmount),
                updatedAt: serverTimestamp()
            });

            showAlert("Success", "Request updated successfully");
            router.push("/admin/user-appeals");
        } catch (error) {
            console.error("Error updating appeal:", error);
            showAlert("Error", "Failed to update appeal");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="text-center py-20 text-slate-400">Loading details...</div>;

    return (
        <AdminGuard>
            <div className="max-w-4xl mx-auto pb-20">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/admin/user-appeals" className="text-slate-400 hover:text-white transition-colors">
                        <i className="fas fa-arrow-left"></i> Back
                    </Link>
                    <h1 className="text-3xl font-bold text-white">Review User Appeal</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Status & Review */}
                    <div className="bg-slate-900 rounded-2xl shadow-lg border border-white/5 p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Review Status</h2>
                            <div className={`px-4 py-2 rounded-full font-bold text-sm uppercase ${
                                formData.status === 'published' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                                formData.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-slate-800 text-slate-400 border border-white/10'
                            }`}>
                                Current: {formData.status}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">Change Status</label>
                                <select 
                                    name="status" 
                                    value={formData.status} 
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-white"
                                >
                                    <option value="pending">Pending Review</option>
                                    <option value="published">Approved & Published</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="draft">Draft (On Hold)</option>
                                </select>
                                <p className="text-sm text-slate-500 mt-2">
                                    <i className="fas fa-info-circle mr-1"></i>
                                    setting to <strong>Published</strong> will make it visible on the Donate page.
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">Target Amount (VND)</label>
                                <input 
                                    type="number" 
                                    name="target" 
                                    required
                                    value={formData.target} 
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">Currency</label>
                                <select 
                                    name="currency" 
                                    value={formData.currency} 
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-white"
                                >
                                    <option value="VND">VND (Vietnamese Dong)</option>
                                    <option value="USD">USD (US Dollar)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">Current Amount (Raised)</label>
                                <input 
                                    type="number" 
                                    name="currentAmount" 
                                    value={formData.currentAmount} 
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* User Info & Content */}
                    <div className="bg-slate-900 rounded-2xl shadow-lg border border-white/5 p-8">
                        <h2 className="text-xl font-bold text-white mb-6">Request Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">Submitter Name</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-white" />
                            </div>
                             <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">Phone / Contact</label>
                                <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-white" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-400 mb-2">Appeal Title</label>
                                <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-white" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-400 mb-2">Detailed Content</label>
                                <textarea name="content" rows={5} value={formData.content} onChange={handleChange} className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-600"></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Banking Info */}
                    <div className="bg-slate-900 rounded-2xl shadow-lg border border-white/5 p-8">
                        <h2 className="text-xl font-bold text-white mb-6">Receiving Information</h2>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <input type="text" name="bankName" placeholder="Bank Name" value={formData.bankName} onChange={handleChange} className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-600" />
                            <input type="text" name="bankAccount" placeholder="Account Number" value={formData.bankAccount} onChange={handleChange} className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-600" />
                            <input type="text" name="bankOwner" placeholder="Account Owner" value={formData.bankOwner} onChange={handleChange} className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-600" />
                         </div>
                         <div>
                            <label className="block text-sm font-bold text-slate-400 mb-2">QR Code Image</label>
                            <div className="border border-white/10 rounded-xl p-4 bg-slate-800/50 max-w-sm">
                                <ImageUploader 
                                    onImageUploaded={(url) => setFormData(prev => ({...prev, bankQR: url}))}
                                    currentImage={formData.bankQR}
                                    folder="appeals_qr"
                                />
                            </div>
                         </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-4 pt-4">
                        <Link href="/admin/user-appeals" className="px-8 py-3 border border-white/10 text-slate-400 rounded-xl hover:bg-slate-800 font-bold transition-colors">
                            Cancel
                        </Link>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 font-bold shadow-lg shadow-blue-900/50 disabled:opacity-50 transform active:scale-95 transition-all"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminGuard>
    );
}
