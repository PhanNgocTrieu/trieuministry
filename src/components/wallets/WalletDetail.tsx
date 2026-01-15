"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, Timestamp, writeBatch } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useModal } from '@/context/ModalContext';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { format } from 'date-fns';
import WalletStats from './WalletStats';
import WalletCompletionModal from './WalletCompletionModal';

interface Wallet {
    id: string;
    title: string;
    description: string;
    status: 'active' | 'completed';
    type?: 'estimation' | 'management';
    exchangeRate: number;
    createdBy: string;
}

interface WalletItem {
    id: string;
    date: Timestamp;
    content: string;
    item: string;
    quantity: number;
    category?: string;
    pic?: string; // Person In Charge
    estimatedVND: number;
    estimatedUSD: number;
    actualVND: number;
    actualUSD: number;
    type?: 'income' | 'expense'; // For Management Mode
    isCompleted: boolean;
    note: string;
}

export default function WalletDetail({ walletId, basePath }: { walletId: string, basePath: string }) {
    const { user } = useAuth();
    const router = useRouter();
    const { showAlert } = useModal();
    
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [items, setItems] = useState<WalletItem[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Form State
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    const initialFormState = {
        date: new Date().toISOString().split('T')[0],
        content: '',
        item: '',
        quantity: 1,
        category: '',
        pic: '',
        estimatedVND: 0,
        actualVND: 0,
        type: 'expense' as 'income' | 'expense',
        isCompleted: false,
        note: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    // Stats Logic
    const isEstimation = wallet?.type === 'estimation';

    // Estimation Mode Stats
    const totalEstVND = items.reduce((sum, i) => sum + (i.estimatedVND || 0), 0);
    const totalEstUSD = items.reduce((sum, i) => sum + (i.estimatedUSD || 0), 0);
    
    // Management Mode Stats (Ledger)
    const totalIncomeVND = items.filter(i => i.type === 'income').reduce((sum, i) => sum + (i.actualVND || 0), 0);
    const totalExpenseVND = items.filter(i => i.type === 'expense' || !i.type).reduce((sum, i) => sum + (i.actualVND || 0), 0); // Default to expense if type missing
    const balanceVND = totalIncomeVND - totalExpenseVND;
    
    // Legacy/Hybrid fallback (Total Valid Actuals) for stats pass-through if needed
    const totalActVND = items.reduce((sum, i) => sum + (i.actualVND || 0), 0);
    
    const [deleteModal, setDeleteModal] = useState<{ id: string; isOpen: boolean }>({ id: '', isOpen: false });
    const [showStats, setShowStats] = useState(false);
    const [showComplete, setShowComplete] = useState(false);

    // Dynamic Category Suggestion Logic
    const expenseCategories = useMemo(() => {
        const defaults = ["Food", "Transport", "Utilities", "Housing", "Health", "Education", "Shopping", "Entertainment", "Other"];
        const fromHistory = items
            .filter(i => (!i.type || i.type === 'expense') && i.category)
            .map(i => i.category!);
        return Array.from(new Set([...defaults, ...fromHistory])).sort();
    }, [items]);

    const incomeCategories = useMemo(() => {
        const defaults = ["Salary", "Bonus", "Gift", "Refund", "Investment", "Other"];
        const fromHistory = items
            .filter(i => i.type === 'income' && i.category)
            .map(i => i.category!);
        return Array.from(new Set([...defaults, ...fromHistory])).sort();
    }, [items]);

    useEffect(() => {
        if (!user || !walletId) return;

        // Fetch Wallet Metadata
        const fetchWallet = async () => {
             const docRef = doc(db, "wallets", walletId);
             const docSnap = await getDoc(docRef);
             if (docSnap.exists()) {
                 setWallet({ id: docSnap.id, ...docSnap.data() } as Wallet);
             } else {
                 showAlert('Error', 'Wallet not found');
                 router.push(basePath);
             }
        };
        fetchWallet();

        // Realtime Items
        const q = query(
            collection(db, "wallets", walletId, "items"),
            orderBy("date", "desc"),
            orderBy("createdAt", "desc") // fallback sort
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WalletItem));
            setItems(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [walletId, user]);

    const handleBack = () => router.push(basePath);

    const handleSaveItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!wallet) return;

        const rate = wallet.exchangeRate || 25000;
        const estUSD = formData.estimatedVND / rate;
        const actUSD = formData.actualVND / rate;

        const itemData = {
            ...formData,
            date: Timestamp.fromDate(new Date(formData.date)),
            estimatedUSD: estUSD,
            actualUSD: actUSD,
            updatedAt: serverTimestamp()
        };

        try {
            if (editingId) {
                await updateDoc(doc(db, "wallets", walletId, "items", editingId), itemData);
            } else {
                await addDoc(collection(db, "wallets", walletId, "items"), {
                    ...itemData,
                    createdAt: serverTimestamp()
                });
            }
            setIsAdding(false);
            setEditingId(null);
            setFormData(initialFormState);
        } catch (error) {
            console.error(error);
            showAlert('Error', 'Failed to save item.');
        }
    };

    const handleDelete = async () => {
        if (deleteModal.id) {
            await deleteDoc(doc(db, "wallets", walletId, "items", deleteModal.id));
            setDeleteModal({ id: '', isOpen: false });
        }
    };

    const handleEdit = (item: WalletItem) => {
        setFormData({
            date: item.date.toDate().toISOString().split('T')[0],
            content: item.content || '',
            item: item.item || '',
            quantity: item.quantity || 1,
            category: item.category || '',
            pic: item.pic || '',
            estimatedVND: item.estimatedVND || 0,
            actualVND: item.actualVND || 0,
            type: item.type || 'expense',
            isCompleted: item.isCompleted,
            note: item.note || ''
        });
        setEditingId(item.id);
        setIsAdding(true);
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'estimatedVND' | 'actualVND') => {
        const rawValue = e.target.value.replace(/[^0-9]/g, ''); // Remove non-digit chars
        const numValue = rawValue ? parseInt(rawValue, 10) : 0;
        setFormData({ ...formData, [field]: numValue });
    };

    const toggleCompletion = async (item: WalletItem) => {
        await updateDoc(doc(db, "wallets", walletId, "items", item.id), {
            isCompleted: !item.isCompleted
        });
    };

    const handleWalletConclusion = async (action: 'keep' | 'delete') => {
        if (!wallet) return;
        
        try {
            if (action === 'delete') {
                // Delete all items first
                const batch = writeBatch(db);
                items.forEach(item => {
                    batch.delete(doc(db, "wallets", walletId, "items", item.id));
                });
                // Delete wallet
                batch.delete(doc(db, "wallets", walletId));
                await batch.commit();
                
                showAlert('Success', 'Wallet completed and deleted.');
                router.push(basePath);
            } else {
                // Mark complete
                await updateDoc(doc(db, "wallets", walletId), {
                    status: 'completed',
                    updatedAt: serverTimestamp()
                });
                setWallet(prev => prev ? ({ ...prev, status: 'completed' }) : null);
                setShowComplete(false);
                showAlert('Success', 'Wallet marked as completed.');
            }
        } catch (error) {
            console.error(error);
            showAlert('Error', 'Failed to update wallet status.');
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading details...</div>;

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <button onClick={handleBack} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 flex items-center gap-2 font-bold">
                    <i className="fas fa-arrow-left"></i> Back
                </button>
                <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                            {wallet?.title}
                        </h1>
                        {wallet?.status === 'completed' && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold uppercase">Completed</span>
                        )}
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold uppercase ${isEstimation ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                            {isEstimation ? 'Estimation' : 'Management'}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                     <button 
                        onClick={() => setShowStats(true)}
                        className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                        <i className="fas fa-chart-pie mr-2"></i> Stats
                    </button>
                    {wallet?.status !== 'completed' && (
                        <button 
                            onClick={() => setShowComplete(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-500 shadow-sm"
                        >
                            <i className="fas fa-check mr-2"></i> Finish
                        </button>
                    )}
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 shadow-lg shadow-blue-500/20"
                    >
                        <i className="fas fa-plus mr-2"></i> Add Item
                    </button>
                </div>
            </div>

            {/* Summary Banner */}
            <div className={`grid gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm ${isEstimation ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-3'}`}>
                {isEstimation ? (
                    <>
                        <div className="text-center p-2">
                            <p className="text-xs text-slate-500 font-bold uppercase">Est. Total (VND)</p>
                            <p className="text-lg font-bold text-slate-900 dark:text-white">{totalEstVND.toLocaleString()} ₫</p>
                        </div>
                        <div className="text-center p-2 border-l border-slate-100 dark:border-white/5">
                            <p className="text-xs text-slate-500 font-bold uppercase">Est. Total (USD)</p>
                            <p className="text-lg font-bold text-slate-900 dark:text-white">${totalEstUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                        </div>
                         <div className="text-center p-2 border-l border-slate-100 dark:border-white/5">
                            <p className="text-xs text-slate-500 font-bold uppercase text-blue-500">Items</p>
                            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{items.length}</p>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Management (Ledger) Summary */}
                        <div className="text-center p-2">
                            <p className="text-xs text-green-500 font-bold uppercase">Total Income</p>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">{totalIncomeVND.toLocaleString()} ₫</p>
                        </div>
                        
                        <div className="text-center p-2 border-l border-slate-100 dark:border-white/5">
                            <p className="text-xs text-red-500 font-bold uppercase">Total Expense</p>
                            <p className="text-lg font-bold text-red-600 dark:text-red-400">{totalExpenseVND.toLocaleString()} ₫</p>
                        </div>

                         <div className="text-center p-2 border-l border-slate-100 dark:border-white/5">
                            <p className="text-xs text-slate-500 font-bold uppercase">Balance</p>
                            <p className={`text-lg font-bold ${balanceVND >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-500'}`}>
                                {balanceVND.toLocaleString()} ₫
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Form Area */}
            {isAdding && (
                <form onSubmit={handleSaveItem} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-blue-200 dark:border-blue-500/30 animate-fade-in space-y-4">
                     <div className="flex justify-between items-center mb-2">
                         <h3 className="font-bold text-slate-900 dark:text-white">{editingId ? 'Edit Item' : 'Add New Item'}</h3>
                         <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); setFormData(initialFormState); }} className="text-slate-400 hover:text-slate-600">
                             <i className="fas fa-times"></i>
                         </button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                         
                         {/* Common: Date */}
                         <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                             <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" />
                         </div>

                         {/* Management: Income/Expense Selector */}
                         {!isEstimation && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                                <div className="flex gap-2 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({...formData, type: 'expense'})}
                                        className={`flex-1 py-1.5 px-3 rounded-md text-sm font-bold transition-colors ${formData.type === 'expense' ? 'bg-red-50 text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Expense
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({...formData, type: 'income'})}
                                        className={`flex-1 py-1.5 px-3 rounded-md text-sm font-bold transition-colors ${formData.type === 'income' ? 'bg-green-50 text-green-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Income
                                    </button>
                                </div>
                            </div>
                         )}

                         {/* Common: Category */}
                         <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                             <input 
                                list={`category-list-${formData.type}`} 
                                type="text" 
                                value={formData.category} 
                                onChange={e => setFormData({...formData, category: e.target.value})} 
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" 
                                placeholder="Select or type..." 
                            />
                             <datalist id="category-list-expense">
                                 {expenseCategories.map(c => <option key={c} value={c} />)}
                             </datalist>
                             <datalist id="category-list-income">
                                 {incomeCategories.map(c => <option key={c} value={c} />)}
                             </datalist>
                         </div>
                         
                         {/* Common: Person in Charge */}
                         <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Person in Charge</label>
                             <input type="text" value={formData.pic} onChange={e => setFormData({...formData, pic: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Who is responsible?" />
                         </div>

                         {/* Common: Content/Description */}
                         <div className={!isEstimation ? "" : "md:col-span-1"}>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{isEstimation ? 'Task Content' : 'Description'}</label>
                             <input type="text" required value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder={isEstimation ? "Describe the task..." : "Transaction description..."} />
                         </div>
                         
                         {/* Estimation Only Fields */}
                         {isEstimation && (
                             <>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Item Name</label>
                                    <input type="text" value={formData.item} onChange={e => setFormData({...formData, item: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Search item..." />
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantity</label>
                                    <input type="number" step="0.1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value)})} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Est. Cost (VND)</label>
                                    <input 
                                        type="text" 
                                        value={formData.estimatedVND ? formData.estimatedVND.toLocaleString() : ''} 
                                        onChange={e => handleAmountChange(e, 'estimatedVND')}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="0"
                                    />
                                </div>
                            </>
                         )}

                         {/* Management Only Fields */}
                         {!isEstimation && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount (VND)</label>
                                <input 
                                    type="text" 
                                    value={formData.actualVND ? formData.actualVND.toLocaleString() : ''} 
                                    onChange={e => handleAmountChange(e, 'actualVND')}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="0"
                                />
                            </div>
                         )}

                         {/* Common: Note */}
                         <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Note</label>
                             <input type="text" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" />
                         </div>
                     </div>
                     <div className="flex justify-end pt-2">
                         <button type="submit" className="px-8 py-2 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-500">Save Item</button>
                     </div>
                </form>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3 text-left">Date</th>
                                
                                {isEstimation ? (
                                    <>
                                        <th className="px-4 py-3 text-left">Category</th>
                                        <th className="px-4 py-3 text-left">PIC</th>
                                        <th className="px-4 py-3 text-left">Content</th>
                                        <th className="px-4 py-3 text-left">Item</th>
                                        <th className="px-4 py-3 text-center">Qty</th>
                                        <th className="px-4 py-3 text-right text-slate-500">Est. (VND)</th>
                                        <th className="px-4 py-3 text-right text-slate-500">Est. ($)</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-4 py-3 text-center">Type</th>
                                        <th className="px-4 py-3 text-left">Category</th>
                                        <th className="px-4 py-3 text-left">PIC</th>
                                        <th className="px-4 py-3 text-left">Description</th>
                                        <th className="px-4 py-3 text-right">Amount (VND)</th>
                                    </>
                                )}
                                
                                <th className="px-4 py-3 text-left">Note</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                             {items.map(item => (
                                 <tr key={item.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${item.isCompleted ? 'bg-green-50/50 dark:bg-green-900/10' : ''}`}>
                                     <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{format(item.date.toDate(), 'dd/MM/yy')}</td>
                                     
                                     {isEstimation ? (
                                         <>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.category || '-'}</td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-medium">{item.pic || '-'}</td>
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white max-w-[200px] truncate" title={item.content}>{item.content}</td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.item}</td>
                                            <td className="px-4 py-3 text-center font-mono">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right font-mono text-slate-500">{item.estimatedVND.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right font-mono text-slate-500">${item.estimatedUSD.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button onClick={() => toggleCompletion(item)} className={`text-xl ${item.isCompleted ? 'text-green-500' : 'text-slate-300 hover:text-green-500'} transition-colors`}>
                                                    <i className={`fas ${item.isCompleted ? 'fa-check-circle' : 'fa-circle'}`}></i>
                                                </button>
                                            </td>
                                         </>
                                     ) : (
                                        <>
                                            <td className="px-4 py-3 text-center">
                                                {item.type === 'income' ? (
                                                     <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold uppercase">Income</span>
                                                ) : (
                                                     <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold uppercase">Expense</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.category || '-'}</td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-medium">{item.pic || '-'}</td>
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white max-w-[300px] truncate" title={item.content}>{item.content}</td>
                                            <td className={`px-4 py-3 text-right font-bold font-mono ${item.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                                                {item.type === 'income' ? '+' : '-'}{item.actualVND.toLocaleString()}
                                            </td>
                                        </>
                                     )}

                                     <td className="px-4 py-3 text-slate-500 text-xs max-w-[150px] truncate" title={item.note}>{item.note || '-'}</td>
                                     <td className="px-4 py-3 text-right whitespace-nowrap">
                                         <button onClick={() => handleEdit(item)} className="text-blue-500 hover:text-blue-600 p-2"><i className="fas fa-pen"></i></button>
                                         <button onClick={() => setDeleteModal({ id: item.id, isOpen: true })} className="text-red-400 hover:text-red-500 p-2"><i className="fas fa-trash"></i></button>
                                     </td>
                                 </tr>
                             ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ id: '', isOpen: false })}
                onConfirm={handleDelete}
                title="Delete Item"
                message="Are you sure you want to delete this row?"
                confirmText="Delete"
                isDangerous={true}
            />

            <WalletStats
                isOpen={showStats}
                onClose={() => setShowStats(false)}
                walletTitle={wallet?.title || 'Wallet'}
                items={items}
                rate={wallet?.exchangeRate || 25000}
                type={wallet?.type || 'management'}
            />

            <WalletCompletionModal
                isOpen={showComplete}
                onClose={() => setShowComplete(false)}
                onConfirm={handleWalletConclusion}
                walletTitle={wallet?.title || 'Wallet'}
            />
        </div>
    );
}
