"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { useModal } from '@/context/ModalContext';

interface PrayerSponsor {
    id: string;
    name: string;
    organization: string; // New: Church/Org
    contact: string;
    startDate: string; // New: From Date
    endDate: string;   // New: To Date
    isCompleted: boolean; // New: Status
    notes: string;
    createdAt: Timestamp;
}

export default function PrayerSponsors() {
    const [sponsors, setSponsors] = useState<PrayerSponsor[]>([]);
    const [loading, setLoading] = useState(true);
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
    const { showAlert, showConfirm } = useModal();
    
    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        organization: '',
        contact: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        isCompleted: false,
        notes: ''
    });

    useEffect(() => {
        const q = query(collection(db, "prayer_sponsors"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as PrayerSponsor[];
            setSponsors(list);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const resetForm = () => {
        setFormData({
            name: '',
            organization: '',
            contact: '',
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            isCompleted: false,
            notes: ''
        });
        setEditingId(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            const data = {
                ...formData,
                updatedAt: Timestamp.now()
            };

            if (editingId) {
                await updateDoc(doc(db, "prayer_sponsors", editingId), data);
            } else {
                await addDoc(collection(db, "prayer_sponsors"), {
                    ...data,
                    createdAt: Timestamp.now()
                });
            }
            
            setIsModalOpen(false);
            resetForm();
            showAlert("Success", "Prayer partner saved successfully.");
        } catch (error) {
            console.error("Error saving prayer sponsor:", error);
            showAlert("Error", "Failed to save information.");
        }
    };

    const handleEdit = (sponsor: PrayerSponsor) => {
        setEditingId(sponsor.id);
        const [start] = sponsor.startDate ? sponsor.startDate.split('T') : [''];
        const [end] = sponsor.endDate ? sponsor.endDate.split('T') : [''];

        setFormData({
            name: sponsor.name,
            organization: sponsor.organization || '',
            contact: sponsor.contact,
            startDate: start,
            endDate: end,
            isCompleted: sponsor.isCompleted || false,
            notes: sponsor.notes
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        showConfirm(
            "Delete Prayer Partner",
            "Are you sure you want to delete this prayer partner?",
            async () => {
                await deleteDoc(doc(db, "prayer_sponsors", id));
            },
            true
        );
    };

    // Stats State
    const toggleStatus = async (sponsor: PrayerSponsor) => {
        try {
            await updateDoc(doc(db, "prayer_sponsors", sponsor.id), {
                isCompleted: !sponsor.isCompleted,
                updatedAt: Timestamp.now()
            });
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
    const [statsData, setStatsData] = useState<{
        year: string;
        total: number;
        completed: number;
        active: number;
        partners: PrayerSponsor[];
    } | null>(null);

    const handleShowStats = () => {
        // Filter by year
        const filtered = sponsors.filter(s => {
            const startYear = s.startDate ? s.startDate.substring(0, 4) : '';
            const endYear = s.endDate ? s.endDate.substring(0, 4) : '';
            return startYear === yearFilter || endYear === yearFilter;
        });

        if (filtered.length === 0) {
            showAlert("Info", `No partners found for year ${yearFilter}`);
            return;
        }

        setStatsData({
            year: yearFilter,
            total: filtered.length,
            completed: filtered.filter(s => s.isCompleted).length,
            active: filtered.filter(s => !s.isCompleted).length,
            partners: filtered
        });
        setIsStatsModalOpen(true);
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Prayer Partners</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Track commitment and prayer support.</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 px-3">
                        <span className="text-xs font-bold text-slate-500">Year:</span>
                        <select 
                            value={yearFilter}
                            onChange={(e) => setYearFilter(e.target.value)}
                            className="bg-transparent text-sm font-bold text-slate-900 dark:text-white focus:outline-none py-2"
                        >
                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleShowStats}
                        className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold flex items-center gap-2 transition-all"
                    >
                        <i className="fas fa-chart-pie"></i> View Stats
                    </button>
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-900/20 font-bold flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                    >
                        <i className="fas fa-plus"></i> Add Partner
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/5">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Partner / Org</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Information</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Commitment Period</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-32">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right w-24">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                            {sponsors.length > 0 ? sponsors.map(sponsor => (
                                <tr key={sponsor.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4 align-top">
                                        <div className="font-bold text-slate-900 dark:text-white text-lg">{sponsor.name}</div>
                                        {sponsor.organization && (
                                            <div className="text-sm font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-0.5">
                                                <i className="fas fa-church text-xs opacity-70"></i>
                                                {sponsor.organization}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        {sponsor.contact && (
                                            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                                                <i className="fas fa-address-card w-4 opacity-50"></i> {sponsor.contact}
                                            </div>
                                        )}
                                        {sponsor.notes && (
                                            <div className="text-xs text-slate-500 italic bg-slate-100 dark:bg-slate-800 p-2 rounded max-w-xs">
                                                "{sponsor.notes}"
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <div className="flex flex-col gap-1 text-sm">
                                            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
                                                <i className="fas fa-calendar-alt text-slate-400 text-xs w-4"></i>
                                                {new Date(sponsor.startDate).toLocaleDateString()}
                                            </div>
                                            {sponsor.endDate && (
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <i className="fas fa-long-arrow-alt-down text-xs w-4 ml-0.5"></i>
                                                     {new Date(sponsor.endDate).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <button
                                            onClick={() => toggleStatus(sponsor)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-2 ${
                                                sponsor.isCompleted
                                                ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                                                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20'
                                            }`}
                                        >
                                            {sponsor.isCompleted ? (
                                                <>
                                                    <i className="fas fa-check-circle"></i> Completed
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-spinner fa-spin-pulse"></i> Active
                                                </>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right align-top">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleEdit(sponsor)} 
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-blue-500/10 hover:text-blue-500 dark:hover:text-blue-400 transition-all"
                                                title="Edit"
                                            >
                                                <i className="fas fa-pen"></i>
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(sponsor.id)} 
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all"
                                                title="Delete"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <i className="fas fa-users text-4xl mb-3 opacity-20"></i>
                                            <p>No prayer partners found.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Statistics Modal */}
             {isStatsModalOpen && statsData && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setIsStatsModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden transform transition-all flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="bg-slate-50 dark:bg-slate-800/50 px-8 py-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    Prayer Stats {statsData.year}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Overview of prayer partners for the selected year.</p>
                            </div>
                            <button onClick={() => setIsStatsModalOpen(false)} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-white/30 flex items-center justify-center transition-all">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <div className="p-8 overflow-y-auto">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="p-6 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                                    <h4 className="text-blue-600 dark:text-blue-400 font-bold uppercase text-xs tracking-wider mb-2">Total Partners</h4>
                                    <p className="text-4xl font-extrabold text-slate-900 dark:text-white">{statsData.total}</p>
                                </div>
                                <div className="p-6 bg-green-50 dark:bg-green-500/10 rounded-2xl border border-green-100 dark:border-green-500/20">
                                    <h4 className="text-green-600 dark:text-green-400 font-bold uppercase text-xs tracking-wider mb-2">Completed</h4>
                                    <p className="text-4xl font-extrabold text-slate-900 dark:text-white">{statsData.completed}</p>
                                </div>
                                <div className="p-6 bg-yellow-50 dark:bg-yellow-500/10 rounded-2xl border border-yellow-100 dark:border-yellow-500/20">
                                    <h4 className="text-yellow-600 dark:text-yellow-400 font-bold uppercase text-xs tracking-wider mb-2">Active</h4>
                                    <p className="text-4xl font-extrabold text-slate-900 dark:text-white">{statsData.active}</p>
                                </div>
                            </div>

                            {/* Detailed List */}
                            <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-white/10 pb-2">Detailed List</h4>
                            <div className="space-y-3">
                                {statsData.partners.map(partner => (
                                    <div key={partner.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-white/5">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900 dark:text-white">{partner.name}</span>
                                                {partner.organization && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">{partner.organization}</span>}
                                            </div>
                                            <div className="text-sm text-slate-500 mt-1 flex gap-4">
                                                <span><i className="fas fa-calendar-alt text-xs mr-1"></i> {new Date(partner.startDate).toLocaleDateString()} - {partner.endDate ? new Date(partner.endDate).toLocaleDateString() : 'Ongoing'}</span>
                                            </div>
                                            {partner.notes && <p className="text-xs text-slate-500 italic mt-1">"{partner.notes}"</p>}
                                        </div>
                                        <div className="mt-2 md:mt-0">
                                             <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                partner.isCompleted 
                                                ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300' 
                                                : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300'
                                            }`}>
                                                {partner.isCompleted ? 'Completed' : 'Active'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                             <button
                                onClick={() => setIsStatsModalOpen(false)}
                                className="px-6 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all" onClick={e => e.stopPropagation()}>
                        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                {editingId ? 'Edit Partner' : 'Add Prayer Partner'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 dark:text-white"
                                    placeholder="Partner's Name"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Organization / Church</label>
                                <input 
                                    type="text" 
                                    value={formData.organization}
                                    onChange={e => setFormData({...formData, organization: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                    placeholder="e.g. Grace Church"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Contact Info</label>
                                <input 
                                    type="text" 
                                    value={formData.contact}
                                    onChange={e => setFormData({...formData, contact: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                    placeholder="Email, Phone, Facebook..."
                                />
                            </div>

                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">From Date</label>
                                    <input 
                                        type="date" 
                                        required
                                        value={formData.startDate}
                                        onChange={e => setFormData({...formData, startDate: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">To Date</label>
                                    <input 
                                        type="date" 
                                        value={formData.endDate}
                                        onChange={e => setFormData({...formData, endDate: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                                <input
                                    type="checkbox"
                                    id="isCompleted"
                                    checked={formData.isCompleted}
                                    onChange={e => setFormData({...formData, isCompleted: e.target.checked})}
                                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="isCompleted" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                    Commitment Completed
                                </label>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Notes</label>
                                <textarea 
                                    value={formData.notes}
                                    onChange={e => setFormData({...formData, notes: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white resize-none h-20"
                                    placeholder="Additional notes..."
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition-all"
                                >
                                    Save Partner
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
