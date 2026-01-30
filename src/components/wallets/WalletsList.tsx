"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy, serverTimestamp, Timestamp, writeBatch } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useModal } from '@/context/ModalContext';
import ConfirmModal from '@/components/admin/ConfirmModal';
import DebtList from './DebtList';

interface Wallet {
    id: string;
    title: string;
    description: string;
    status: 'active' | 'completed';
    type: 'estimation' | 'management';
    exchangeRate: number;
    createdAt: Timestamp;
    createdBy: string;
    totalEstimatedVND?: number; // These could be aggregated or computed
    totalActualVND?: number;
}

export default function WalletsList({ basePath }: { basePath: string }) {
    const { user } = useAuth();
    const { showAlert } = useModal();
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    // Create Form State
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newRate, setNewRate] = useState(25000);
    const [newType, setNewType] = useState<'estimation' | 'management'>('management');
    const [creating, setCreating] = useState(false);

    // Delete State
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({ isOpen: false, id: '', name: '' });

    // Filter & Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'estimation' | 'management' | 'debt'>('all');

    const filteredWallets = wallets.filter(wallet => {
        const matchesSearch = wallet.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || wallet.type === filterType;
        return matchesSearch && matchesType;
    });

    useEffect(() => {
        if (!user) return;
        fetchWallets();
    }, [user]);

    const fetchWallets = async () => {
        try {
            const q = query(
                collection(db, "wallets"),
                where("createdBy", "==", user?.uid),
                orderBy("createdAt", "desc")
            );
            const snapshot = await getDocs(q);
            const list = snapshot.docs.map(doc => {
                 const data = doc.data();
                 return { 
                     id: doc.id, 
                     ...data,
                     type: data.type || 'management' // Fallback for existing
                 } as Wallet;
            });
            setWallets(list);
        } catch (error) {
            console.error("Error fetching wallets:", error);
            // Index might be missing for compound query, try simpler one or prompt creation
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setCreating(true);

        try {
            await addDoc(collection(db, 'wallets'), {
                title: newTitle,
                description: newDesc,
                exchangeRate: Number(newRate),
                type: newType,
                status: 'active',
                createdBy: user.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            
            setIsCreateModalOpen(false);
            setNewTitle('');
            setNewDesc('');
            setNewRate(25000);
            setNewType('management');
            fetchWallets(); // Refresh list
            showAlert('Success', 'Wallet created successfully!');
        } catch (error) {
            console.error(error);
            showAlert('Error', 'Failed to create wallet.');
        } finally {
            setCreating(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteModal.id) return;
        try {
            // Cascade delete items
            // 1. Get all items in subcollection
            const itemsRef = collection(db, "wallets", deleteModal.id, "items");
            const itemsSnap = await getDocs(itemsRef);
            
            const batch = writeBatch(db);
            // Delete items
            itemsSnap.forEach((doc) => {
                batch.delete(doc.ref);
            });
            // Delete wallet
            batch.delete(doc(db, "wallets", deleteModal.id));
            
            await batch.commit();

            setWallets(prev => prev.filter(w => w.id !== deleteModal.id));
            setDeleteModal({ isOpen: false, id: '', name: '' });
            showAlert('Success', 'Wallet and all data deleted.');
        } catch (error) {
            console.error("Error deleting wallet:", error);
            showAlert('Error', 'Failed to delete wallet.');
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading wallets...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Wallets</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage budgets for your projects.</p>
                </div>
                {filterType !== 'debt' && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-500/20 font-bold flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95"
                    >
                        <i className="fas fa-plus"></i> New Wallet
                    </button>
                )}
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                {filterType !== 'debt' && (
                    <div className="relative flex-1">
                        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                        <input
                            type="text"
                            placeholder="Search wallets by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                )}
                {filterType === 'debt' && <div className="flex-1"></div>}

                <div className="flex gap-2">
                    <button
                        onClick={() => setFilterType('all')}
                        className={`px-4 py-2 rounded-xl font-bold transition-all border ${
                            filterType === 'all'
                            ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900 dark:border-white'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:border-white/10 dark:hover:bg-slate-800'
                        }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilterType('estimation')}
                        className={`px-4 py-2 rounded-xl font-bold transition-all border ${
                            filterType === 'estimation'
                            ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-500/30'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:border-white/10 dark:hover:bg-slate-800'
                        }`}
                    >
                        Estimation
                    </button>
                    <button
                        onClick={() => setFilterType('management')}
                        className={`px-4 py-2 rounded-xl font-bold transition-all border ${
                            filterType === 'management'
                            ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-500/30'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:border-white/10 dark:hover:bg-slate-800'
                        }`}
                    >
                        Management
                    </button>
                    <button
                        onClick={() => setFilterType('debt')}
                        className={`px-4 py-2 rounded-xl font-bold transition-all border ${
                            filterType === 'debt'
                            ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-500/30'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:border-white/10 dark:hover:bg-slate-800'
                        }`}
                    >
                        Debt
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {filterType === 'debt' ? (
                <DebtList />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredWallets.map(wallet => (
                        <div key={wallet.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-lg p-6 hover:border-blue-500/30 transition-all group relative">
                             <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setDeleteModal({ isOpen: true, id: wallet.id, name: wallet.title });
                                    }}
                                    className="text-slate-400 hover:text-red-500 transition-colors p-2"
                                >
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>

                            <Link href={`${basePath}/${wallet.id}`} className="block">
                                <div className="mb-4">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{wallet.title}</h3>
                                    <p className="text-sm text-slate-500 line-clamp-2">{wallet.description || "No description"}</p>
                                </div>
                                
                                <div className="flex items-center justify-between text-sm mb-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                        wallet.status === 'active' 
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                    }`}>
                                        {wallet.status}
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ml-2 ${
                                        wallet.type === 'estimation'
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                    }`}>
                                        {wallet.type === 'estimation' ? 'Dự chi' : 'Quản lí'}
                                    </span>
                                    <span className="text-slate-400 font-mono text-xs ml-auto">Rate: {wallet.exchangeRate?.toLocaleString()}</span>
                                </div>

                                <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-blue-500 font-bold text-sm">
                                    <span>View Details</span>
                                    <i className="fas fa-arrow-right transform group-hover:translate-x-1 transition-transform"></i>
                                </div>
                            </Link>
                        </div>
                    ))}
                    
                    {filteredWallets.length === 0 && (
                         <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                            <i className="fas fa-wallet text-4xl mb-3 opacity-50"></i>
                            <p>No wallets found. Create one to get started!</p>
                        </div>
                    )}
                </div>
            )}

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setIsCreateModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Create New Wallet</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Wallet Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setNewType('estimation')}
                                        className={`p-3 rounded-xl border text-left transition-all ${newType === 'estimation' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 ring-1 ring-blue-500' : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                    >
                                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <i className="fas fa-calculator text-blue-500"></i> Estimation
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">Plan estimated costs only. No actual spending tracking.</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewType('management')}
                                        className={`p-3 rounded-xl border text-left transition-all ${newType === 'management' ? 'bg-green-50 dark:bg-green-900/20 border-green-500 ring-1 ring-green-500' : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                    >
                                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <i className="fas fa-coins text-green-500"></i> Management
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">Track actual spending against your estimates.</p>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Wallet Title</label>
                                <input
                                    type="text"
                                    required
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="e.g. House Renovation"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Exchange Rate (1 USD = ? VND)</label>
                                <input
                                    type="number"
                                    required
                                    value={newRate}
                                    onChange={(e) => setNewRate(Number(e.target.value))}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Description (Optional)</label>
                                <textarea
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
                                    placeholder="Brief description..."
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all"
                                >
                                    {creating ? 'Creating...' : 'Create Wallet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={confirmDelete}
                title="Delete Wallet"
                message={`Are you sure you want to delete "${deleteModal.name}"? This will permanently delete all data inside this wallet.`}
                confirmText="Delete Everything"
                isDangerous={true}
            />
        </div>
    );
}
