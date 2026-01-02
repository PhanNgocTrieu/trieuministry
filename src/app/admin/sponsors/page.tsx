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
    startDate: string; // YYYY-MM-DD
    endDate: string;
    isCompleted: boolean;
    completedMilestones: string[]; // Array of "YYYY-MM" or "YYYY" keys
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
        amount: '' as string | number, // Changed to string/number for better input handling
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        isCompleted: false,
        completedMilestones: [] as string[]
    });

    useEffect(() => {
        const q = query(collection(db, "sponsors"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Ensure completedMilestones exists
                    completedMilestones: data.completedMilestones || []
                };
            }) as Sponsor[];
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
            amount: '',
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            isCompleted: false,
            completedMilestones: []
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
            isCompleted: sponsor.isCompleted,
            completedMilestones: sponsor.completedMilestones || []
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this commitment?")) {
            await deleteDoc(doc(db, "sponsors", id));
        }
    };

    const handleQuickStatusUpdate = async (id: string, newStatus: boolean) => {
        try {
            await updateDoc(doc(db, "sponsors", id), {
                isCompleted: newStatus,
                updatedAt: Timestamp.now()
            });
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    // Helper to generate milestones based on dates
    const generateMilestones = (start: string, end: string, type: string) => {
        if (!start) return [];
        
        const milestones = [];
        const startDate = new Date(start);
        const endDate = end ? new Date(end) : new Date(new Date().setFullYear(new Date().getFullYear() + 1)); // Default 1 year if no end

        let current = new Date(startDate);
        // Reset to first day of month for consistent keys
        current.setDate(1); 

        // Limit to reasonable number to prevent infinite loops (e.g. 5 years = 60 months)
        const limitDate = new Date(startDate);
        limitDate.setFullYear(startDate.getFullYear() + 5);
        const effectiveEnd = endDate > limitDate ? limitDate : endDate;

        while (current <= effectiveEnd) {
            const year = current.getFullYear();
            const month = current.getMonth() + 1;
            const key = type === 'yearly' 
                ? `${year}` 
                : `${year}-${month.toString().padStart(2, '0')}`;
                
            const label = type === 'yearly'
                ? `${year}`
                : current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

            // Avoid duplicates for yearly if loop steps monthly
            if (!milestones.find(m => m.key === key)) {
                milestones.push({ key, label });
            }

            // Increment
            if (type === 'yearly') {
                current.setFullYear(current.getFullYear() + 1);
            } else if (type === 'monthly') {
                current.setMonth(current.getMonth() + 1);
            } else {
                // One-time
                milestones.push({ key: 'one-time', label: 'One-time' });
                break;
            }
        }
        return milestones;
    };

    const toggleMilestone = async (sponsor: Sponsor, milestoneKey: string) => {
        const currentCompleted = sponsor.completedMilestones || [];
        let newCompleted;
        
        if (currentCompleted.includes(milestoneKey)) {
            newCompleted = currentCompleted.filter(k => k !== milestoneKey);
        } else {
            newCompleted = [...currentCompleted, milestoneKey];
        }

        try {
            await updateDoc(doc(db, "sponsors", sponsor.id), {
                completedMilestones: newCompleted,
                updatedAt: Timestamp.now()
            });
        } catch (error) {
            console.error("Error updating milestone:", error);
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
             // Sort by creation date desc
            return b.createdAt?.seconds - a.createdAt?.seconds;
        });

    // ... existing filters logic
    
    // Stats Calculations
    const getIncomeForMonth = (monthKey: string) => {
        return sponsors.reduce((total, sponsor) => {
            if (sponsor.completedMilestones?.includes(monthKey)) {
                return total + sponsor.amount;
            }
            return total;
        }, 0);
    };

    const currentDate = new Date();
    const currentMonthKey = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const lastDate = new Date();
    lastDate.setMonth(lastDate.getMonth() - 1);
    const lastMonthKey = `${lastDate.getFullYear()}-${(lastDate.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const thisMonthIncome = getIncomeForMonth(currentMonthKey);
    const lastMonthIncome = getIncomeForMonth(lastMonthKey);

    const currentYear = currentDate.getFullYear().toString();
    const yearlyIncome = sponsors.reduce((total, sponsor) => {
        // Count all milestones starting with current year
        const yearMilestones = sponsor.completedMilestones?.filter(m => m.startsWith(currentYear)) || [];
        return total + (yearMilestones.length * sponsor.amount);
    }, 0);

    const expectedMonthly = sponsors
        .filter(s => s.commitmentType === 'monthly' && !s.isCompleted)
        .reduce((sum, s) => sum + s.amount, 0);

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Link href="/admin" className="text-gray-500 hover:text-blue-600 mb-2 inline-block">
                        <i className="fas fa-arrow-left mr-2"></i> Back to Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Sponsor Commitments</h1>
                    <p className="text-gray-500">Manage financial commitments and sponsorships.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="bg-purple-600 text-white px-5 py-2.5 rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-200 font-bold flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                >
                    <i className="fas fa-plus"></i> New Commitment
                </button>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <i className="fas fa-calendar-check text-5xl text-green-500"></i>
                    </div>
                    <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Received This Month</p>
                    <p className="text-2xl font-extrabold text-gray-900">
                        {thisMonthIncome.toLocaleString('vi-VN')} ₫
                    </p>
                    <p className="text-xs text-green-600 mt-1 font-medium bg-green-50 w-fit px-1.5 py-0.5 rounded">
                        {currentMonthKey}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <i className="fas fa-history text-5xl text-blue-500"></i>
                    </div>
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Received Last Month</p>
                    <p className="text-2xl font-extrabold text-gray-900">
                        {lastMonthIncome.toLocaleString('vi-VN')} ₫
                    </p>
                    <p className="text-xs text-blue-600 mt-1 font-medium bg-blue-50 w-fit px-1.5 py-0.5 rounded">
                        {lastMonthKey}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <i className="fas fa-piggy-bank text-5xl text-purple-500"></i>
                    </div>
                    <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">Total Year {currentYear}</p>
                    <p className="text-2xl font-extrabold text-gray-900">
                        {yearlyIncome.toLocaleString('vi-VN')} ₫
                    </p>
                </div>

                 <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <i className="fas fa-sync-alt text-5xl text-gray-400"></i>
                    </div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Expected Monthly</p>
                    <p className="text-2xl font-extrabold text-gray-900">
                        {expectedMonthly.toLocaleString('vi-VN')} ₫
                    </p>
                    <p className="text-xs text-gray-400 mt-1 font-medium">
                        From active recurring
                    </p>
                </div>
            </div>

            {/* Filters */}
             <div className="bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm inline-flex gap-1">
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
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-64">Sponsor</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-40">Commitment</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Progress & Milestones</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-40">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right w-24">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                             {filteredSponsors.length > 0 ? filteredSponsors.map(sponsor => {
                                 const milestones = generateMilestones(sponsor.startDate, sponsor.endDate, sponsor.commitmentType);
                                 const completedCount = sponsor.completedMilestones?.length || 0;
                                 const totalCount = milestones.length;
                                 const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

                                 return (
                                    <tr key={sponsor.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4 align-top">
                                            <div className="font-bold text-gray-900 text-lg mb-1">{sponsor.fullName}</div>
                                            <div className="text-sm text-gray-500 whitespace-pre-wrap">{sponsor.donorInfo}</div>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <div className="font-bold text-purple-700 text-lg">
                                                {sponsor.amount.toLocaleString('vi-VN')} ₫
                                            </div>
                                            <div className="inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-600 capitalize">
                                                {sponsor.commitmentType}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-2 font-medium">
                                                Since: {new Date(sponsor.startDate).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            {/* Progress Bar */}
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500" 
                                                        style={{ width: `${progress}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-bold text-gray-500 w-12 text-right">
                                                    {Math.round(progress)}%
                                                </span>
                                            </div>

                                            {/* Milestones Grid */}
                                            <div className="flex flex-wrap gap-1.5">
                                                {milestones.map(m => {
                                                    const isDone = sponsor.completedMilestones?.includes(m.key);
                                                    return (
                                                        <button
                                                            key={m.key}
                                                            onClick={() => toggleMilestone(sponsor, m.key)}
                                                            title={`${m.label} - ${isDone ? 'Completed' : 'Pending'} - Click to toggle`}
                                                            className={`px-2 py-1 text-[10px] font-bold rounded-md border transition-all ${
                                                                isDone
                                                                    ? 'bg-green-500 border-green-500 text-white shadow-sm'
                                                                    : 'bg-white border-gray-200 text-gray-400 hover:border-purple-300 hover:text-purple-600'
                                                            }`}
                                                        >
                                                            {m.label}
                                                        </button>
                                                    );
                                                })}
                                                {milestones.length === 0 && (
                                                    <span className="text-xs text-gray-400 italic">No milestones generated</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <select
                                                value={sponsor.isCompleted ? 'true' : 'false'}
                                                onChange={(e) => handleQuickStatusUpdate(sponsor.id, e.target.value === 'true')}
                                                className={`text-xs font-bold rounded-lg px-3 py-2 border-0 ring-1 ring-inset w-full cursor-pointer focus:ring-2 focus:ring-purple-500 ${
                                                    sponsor.isCompleted 
                                                    ? 'bg-green-50 text-green-700 ring-green-200' 
                                                    : 'bg-yellow-50 text-yellow-700 ring-yellow-200'
                                                }`}
                                            >
                                                <option value="false">Active</option>
                                                <option value="true">Completed</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 text-right align-top">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleEdit(sponsor)} 
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
                                                    title="Edit"
                                                >
                                                    <i className="fas fa-pen"></i>
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(sponsor.id)} 
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                                                    title="Delete"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                 );
                             }) : (
                                 <tr>
                                     <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                         <div className="flex flex-col items-center justify-center">
                                            <i className="fas fa-search text-4xl mb-3 opacity-20"></i>
                                            <p>No sponsors found matching your filters.</p>
                                         </div>
                                     </td>
                                 </tr>
                             )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden transform transition-all" onClick={e => e.stopPropagation()}>
                        <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {editingId ? 'Edit Commitment' : 'New Commitment'}
                                </h3>
                                <p className="text-gray-500 text-sm mt-1">Enter sponsor details and commitment terms.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-300 flex items-center justify-center transition-all">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Full Name</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={formData.fullName}
                                            onChange={e => setFormData({...formData, fullName: e.target.value})}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-bold text-gray-900"
                                            placeholder="e.g. John Doe"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Commitment Type</label>
                                        <div className="relative">
                                            <select
                                                value={formData.commitmentType}
                                                onChange={e => setFormData({...formData, commitmentType: e.target.value as any})}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-bold text-gray-900 appearance-none"
                                            >
                                                <option value="monthly">Monthly Recurring</option>
                                                <option value="yearly">Yearly Recurring</option>
                                                <option value="one-time">One-time Donation</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500">
                                                <i className="fas fa-chevron-down text-xs"></i>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Amount (VND)</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <span className="text-gray-400 font-bold">₫</span>
                                            </div>
                                            <input 
                                                type="number" 
                                                required
                                                step="100000"
                                                min="0"
                                                value={formData.amount}
                                                onChange={e => setFormData({...formData, amount: e.target.value})}
                                                className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-mono font-bold text-gray-900 text-lg"
                                                placeholder="0"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 pl-1">Increments of 100,000 VND</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Donor Info / Notes</label>
                                        <textarea 
                                            value={formData.donorInfo}
                                            onChange={e => setFormData({...formData, donorInfo: e.target.value})}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-medium text-gray-900 resize-none h-[124px]"
                                            placeholder="Contact info, specific requests..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Start Date</label>
                                            <input 
                                                type="date" 
                                                required
                                                value={formData.startDate}
                                                onChange={e => setFormData({...formData, startDate: e.target.value})}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-medium text-gray-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">End Date</label>
                                            <input 
                                                type="date" 
                                                value={formData.endDate}
                                                onChange={e => setFormData({...formData, endDate: e.target.value})}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-medium text-gray-900"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-6 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-2.5 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-purple-200 hover:shadow-purple-300 transform hover:-translate-y-0.5 transition-all"
                                >
                                    {editingId ? 'Save Changes' : 'Create Commitment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
