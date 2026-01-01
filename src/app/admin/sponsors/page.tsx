"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import Link from 'next/link';

interface Sponsor {
    id: string;
    fullName: string;
    donorInfo: string;
    commitmentType: 'monthly' | 'yearly' | 'one-time';
    amount: number;
    startDate: string; // Storing as YYYY-MM-DD for simpler input handling
    endDate: string;
    isCompleted: boolean;
    createdAt: Timestamp;
}

export default function SponsorsPage() {
    const [sponsors, setSponsors] = useState<Sponsor[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'incomplete'>('all');
    
    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        fullName: '',
        donorInfo: '',
        commitmentType: 'monthly',
        amount: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        isCompleted: false
    });

    useEffect(() => {
        const q = query(collection(db, "sponsors"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Sponsor));
            setSponsors(list);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const resetForm = () => {
        setFormData({
            fullName: '',
            donorInfo: '',
            commitmentType: 'monthly',
            amount: 0,
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            isCompleted: false
        });
        setEditingId(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            const data = {
                ...formData,
                amount: Number(formData.amount),
                updatedAt: Timestamp.now()
            };

            if (editingId) {
                await updateDoc(doc(db, "sponsors", editingId), data);
            } else {
                await addDoc(collection(db, "sponsors"), {
                    ...data,
                    createdAt: Timestamp.now()
                });
            }
            
            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            console.error("Error saving sponsor:", error);
            alert("Failed to save sponsor information.");
        }
    };

    const handleEdit = (sponsor: Sponsor) => {
        setEditingId(sponsor.id);
        setFormData({
            fullName: sponsor.fullName,
            donorInfo: sponsor.donorInfo,
            commitmentType: sponsor.commitmentType as any,
            amount: sponsor.amount,
            startDate: sponsor.startDate,
            endDate: sponsor.endDate,
            isCompleted: sponsor.isCompleted
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this commitment?")) {
            await deleteDoc(doc(db, "sponsors", id));
        }
    };

    const filteredSponsors = sponsors
        .filter(s => {
             if (filterStatus === 'all') return true;
             if (filterStatus === 'completed') return s.isCompleted;
             if (filterStatus === 'incomplete') return !s.isCompleted;
             return true;
        })
        .sort((a, b) => {
            // Sort incomplete first
            if (a.isCompleted === b.isCompleted) return 0;
            return a.isCompleted ? 1 : -1;
        });

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/admin" className="text-gray-500 hover:text-blue-600 mb-2 inline-block">
                        <i className="fas fa-arrow-left mr-2"></i> Back to Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Sponsor Commitments</h1>
                    <p className="text-gray-500">Manage financial commitments and sponsorships.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="bg-purple-600 text-white px-5 py-2.5 rounded-xl hover:bg-purple-700 shadow-md shadow-purple-200 font-bold flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                >
                    <i className="fas fa-plus"></i> New Commitment
                </button>
            </div>

            {/* Filters */}
             <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm inline-flex gap-1">
                {(['all', 'incomplete', 'completed'] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                            filterStatus === status 
                            ? 'bg-purple-50 text-purple-700 shadow-sm' 
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Sponsor</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Commitment</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Duration</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                             {filteredSponsors.length > 0 ? filteredSponsors.map(sponsor => (
                                <tr key={sponsor.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{sponsor.fullName}</div>
                                        <div className="text-xs text-gray-500 max-w-xs truncate">{sponsor.donorInfo}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{sponsor.amount.toLocaleString('vi-VN')} ₫</div>
                                        <div className="text-xs text-purple-600 font-medium capitalize bg-purple-50 px-2 py-0.5 rounded-full w-fit">
                                            {sponsor.commitmentType}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        <div>Start: {sponsor.startDate}</div>
                                        {sponsor.endDate && <div>End: {sponsor.endDate}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            sponsor.isCompleted 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {sponsor.isCompleted ? 'Completed' : 'Active / Incomplete'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleEdit(sponsor)} className="text-gray-400 hover:text-blue-600 mx-2">
                                            <i className="fas fa-pen"></i>
                                        </button>
                                        <button onClick={() => handleDelete(sponsor.id)} className="text-gray-400 hover:text-red-600 mx-2">
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                             )) : (
                                 <tr>
                                     <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                         No sponsors found matching filters.
                                     </td>
                                 </tr>
                             )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in-up" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">
                                {editingId ? 'Edit Commitment' : 'New Commitment'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900">
                                <i className="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.fullName}
                                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                                    className="w-full border-gray-200 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Donor Info</label>
                                <textarea 
                                    value={formData.donorInfo}
                                    onChange={e => setFormData({...formData, donorInfo: e.target.value})}
                                    className="w-full border-gray-200 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="Contact info, notes, etc."
                                    rows={2}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Type</label>
                                    <select
                                        value={formData.commitmentType}
                                        onChange={e => setFormData({...formData, commitmentType: e.target.value as any})}
                                        className="w-full border-gray-200 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                        <option value="one-time">One-time</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Amount (VND)</label>
                                    <input 
                                        type="number" 
                                        required
                                        min="0"
                                        value={formData.amount}
                                        onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                                        className="w-full border-gray-200 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>
                            </div>

                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Start Date</label>
                                    <input 
                                        type="date" 
                                        required
                                        value={formData.startDate}
                                        onChange={e => setFormData({...formData, startDate: e.target.value})}
                                        className="w-full border-gray-200 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">End Date (Optional)</label>
                                    <input 
                                        type="date" 
                                        value={formData.endDate}
                                        onChange={e => setFormData({...formData, endDate: e.target.value})}
                                        className="w-full border-gray-200 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input 
                                    type="checkbox"
                                    id="isCompleted"
                                    checked={formData.isCompleted}
                                    onChange={e => setFormData({...formData, isCompleted: e.target.checked})}
                                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 rounded"
                                />
                                <label htmlFor="isCompleted" className="text-sm font-bold text-gray-700">Mark as Completed</label>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
                                >
                                    Save Commitment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
