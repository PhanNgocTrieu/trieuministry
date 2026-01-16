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
import FundraisingModal from './FundraisingModal';

interface Wallet {
    id: string;
    title: string;
    description: string;
    status: 'active' | 'completed';
    type?: 'estimation' | 'management';
    exchangeRate: number;
    createdBy: string;
    // currentFund removed/ignored as it's now derived from items
    targetPeople?: number; // For Fundraising
}

interface WalletItem {
    id: string;
    date: Timestamp;
    content: string;
    item: string;
    quantity: number;
    unit?: string; // e.g. kg, box
    unitPrice?: number; // New: Price per unit/person
    category?: string;
    pic?: string; // Person In Charge
    benefactorOf?: string; // New: Who is this benefactor for?
    estimatedVND: number;
    estimatedUSD: number;
    actualVND: number;
    actualUSD: number;
    type?: 'income' | 'expense'; // expense = Cost, income = Fund
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

    // Filter State
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
    const [filterBenefactorOf, setFilterBenefactorOf] = useState<string>('all');
    
    // Autocomplete State
    const [showBenefactorSuggestions, setShowBenefactorSuggestions] = useState(false);
    const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
    
    // Initial Form State
    const initialFormState = {
        date: new Date().toISOString().split('T')[0],
        content: '',
        item: '',
        quantity: 1,
        unit: '',
        unitPrice: 0,
        category: '',
        pic: '',
        benefactorOf: '',
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
    // Cost (Expense)
    const totalEstVND = items
        .filter(i => !i.type || i.type === 'expense')
        .reduce((sum, i) => sum + (i.estimatedVND || 0), 0);
    
    // Available Funds (Income) - Derived from items now
    const currentFund = items
        .filter(i => i.type === 'income')
        .reduce((sum, i) => sum + (i.estimatedVND || 0), 0); // Using estimatedVND for ease in Estimation Mode

    const totalEstUSD = items.reduce((sum, i) => sum + (i.estimatedUSD || 0), 0);
    
    // Management Mode Stats (Ledger)
    const totalIncomeVND = items.filter(i => i.type === 'income').reduce((sum, i) => sum + (i.actualVND || 0), 0);
    const totalExpenseVND = items.filter(i => i.type === 'expense' || !i.type).reduce((sum, i) => sum + (i.actualVND || 0), 0);
    const balanceVND = totalIncomeVND - totalExpenseVND;
    
    const [deleteModal, setDeleteModal] = useState<{ id: string; isOpen: boolean }>({ id: '', isOpen: false });
    const [showStats, setShowStats] = useState(false);
    const [showComplete, setShowComplete] = useState(false);
    
    // Fundraising Modal State
    const [showFundraising, setShowFundraising] = useState(false);

    // Filter Items
    const filteredItems = useMemo(() => {
        let result = items;

        // Filter by Type
        if (filterType !== 'all') {
            result = result.filter(item => {
                const type = item.type || 'expense';
                return type === filterType;
            });
        }

        // Filter by Benefactor Of
        if (filterBenefactorOf !== 'all') {
            result = result.filter(item => item.benefactorOf === filterBenefactorOf);
        }

        return result;
    }, [items, filterType, filterBenefactorOf]);

    // Unique Benefactor Of Options
    const benefactorOfOptions = useMemo(() => {
        const unique = new Set(items.map(i => i.benefactorOf).filter((i): i is string => !!i));
        return Array.from(unique).sort();
    }, [items]);
    
    // Filtered Suggestions for Dropdown
    const benefactorSuggestions = useMemo(() => {
        if (!formData.benefactorOf) return benefactorOfOptions;
        return benefactorOfOptions.filter(name => 
            name.toLowerCase().includes(formData.benefactorOf.toLowerCase())
        );
    }, [benefactorOfOptions, formData.benefactorOf]);

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

    // Filtered Category Suggestions
    const categorySuggestions = useMemo(() => {
        const options = formData.type === 'income' ? incomeCategories : expenseCategories;
        if (!formData.category) return options;
        return options.filter(c => c.toLowerCase().includes(formData.category.toLowerCase()));
    }, [formData.type, formData.category, incomeCategories, expenseCategories]);

    // Calculate Filtered Total
    const filteredTotal = useMemo(() => {
        return filteredItems.reduce((acc, item) => {
            const amount = isEstimation ? (item.estimatedVND || 0) : (item.actualVND || 0);
            if (item.type === 'income') {
                return acc + amount;
            } else {
                return acc - amount;
            }
        }, 0);
    }, [filteredItems, isEstimation]);

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

    // Derived Fundraising Stats for Banner
    const targetPeople = wallet?.targetPeople || 1;
    const remainingNeed = Math.max(0, totalEstVND - currentFund);
    const perPersonTarget = targetPeople > 0 ? remainingNeed / targetPeople : 0;

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
            unit: item.unit || '',
            unitPrice: item.unitPrice || 0,
            category: item.category || '',
            pic: item.pic || '',
            benefactorOf: item.benefactorOf || '',
            estimatedVND: item.estimatedVND || 0,
            actualVND: item.actualVND || 0,
            // Fallback for estimation mode items that didn't have type before (assume expense)
            type: item.type || 'expense',
            isCompleted: item.isCompleted,
            note: item.note || ''
        });
        setEditingId(item.id);
        setIsAdding(true);
    };

    // Auto-calculation logic
    useEffect(() => {
        if (isEstimation) {
            // Only auto-calc if expense? Or for income too if they use unit price?
            // Let's support it for both if they want.
            const calculated = (formData.quantity || 0) * (formData.unitPrice || 0);
            setFormData(prev => ({ ...prev, estimatedVND: calculated }));
        }
    }, [formData.quantity, formData.unitPrice, isEstimation]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'estimatedVND' | 'actualVND' | 'unitPrice') => {
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
                     {isEstimation && (
                        <button 
                            onClick={() => setShowFundraising(true)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-500 shadow-sm"
                        >
                            <i className="fas fa-hand-holding-heart mr-2"></i> Fundraising
                        </button>
                     )}
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
            <div className={`grid gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm ${isEstimation ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'}`}>
                {isEstimation ? (
                    <>
                        <div className="text-center p-2">
                            <p className="text-xs text-slate-500 font-bold uppercase">Total Estimate</p>
                            <p className="text-lg font-bold text-slate-900 dark:text-white">{totalEstVND.toLocaleString()} ₫</p>
                        </div>
                        <div className="text-center p-2 border-l border-slate-100 dark:border-white/5">
                             <p className="text-xs text-green-500 font-bold uppercase">Available Funds</p>
                             <p className="text-lg font-bold text-green-600 dark:text-green-400">{currentFund.toLocaleString()} ₫</p>
                        </div>
                         <div className="text-center p-2 border-l border-slate-100 dark:border-white/5">
                             <p className="text-xs text-red-500 font-bold uppercase">Need To Call</p>
                             <p className="text-lg font-bold text-red-600 dark:text-red-400">{remainingNeed.toLocaleString()} ₫</p>
                        </div>
                        <div className="text-center p-2 border-l border-slate-100 dark:border-white/5">
                             <p className="text-xs text-blue-500 font-bold uppercase">Per Person ({targetPeople})</p>
                             <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{Math.ceil(perPersonTarget).toLocaleString()} ₫</p>
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
                     <div className="space-y-4">
                         {/* Estimation Mode Specific Layout */}
                         {isEstimation ? (
                             <>
                                 <div className="flex flex-col md:flex-row gap-4">
                                     {/* Type Switcher */}
                                     <div className="md:w-1/3 max-w-[300px]">
                                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                                         <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm h-[42px]">
                                             <button
                                                 type="button"
                                                 onClick={() => setFormData({...formData, type: 'expense'})}
                                                 className={`flex-1 rounded-lg text-sm font-bold transition-all duration-200 ${formData.type === 'expense' ? 'bg-red-50 text-red-600 shadow-sm ring-1 ring-red-100' : 'text-slate-400 hover:text-slate-600'}`}
                                             >
                                                 Est. Cost
                                             </button>
                                             <button
                                                 type="button"
                                                 onClick={() => setFormData({...formData, type: 'income'})}
                                                 className={`flex-1 rounded-lg text-sm font-bold transition-all duration-200 ${formData.type === 'income' ? 'bg-green-50 text-green-600 shadow-sm ring-1 ring-green-100' : 'text-slate-400 hover:text-slate-600'}`}
                                             >
                                                 Avail. Fund
                                             </button>
                                         </div>
                                     </div>

                                     {/* Content */}
                                     <div className="flex-1">
                                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Content</label>
                                         <input 
                                             type="text" 
                                             required 
                                             value={formData.content} 
                                             onChange={e => setFormData({...formData, content: e.target.value})} 
                                             className="w-full px-4 h-[42px] rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 font-medium" 
                                             placeholder="What is this item?" 
                                         />
                                     </div>
                                 </div>

                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                     {/* Unit */}
                                     <div>
                                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unit</label>
                                         <input 
                                             type="text" 
                                             value={formData.unit} 
                                             onChange={e => setFormData({...formData, unit: e.target.value})} 
                                             className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium" 
                                             placeholder="pcs..." 
                                         />
                                     </div>

                                     {/* Quantity */}
                                     <div>
                                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantity</label>
                                         <input 
                                             type="number" 
                                             value={formData.quantity === 0 ? '' : formData.quantity} 
                                             onChange={e => {
                                                 const val = parseFloat(e.target.value);
                                                 setFormData({...formData, quantity: isNaN(val) ? 0 : val});
                                             }} 
                                             className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                         />
                                     </div>

                                     {/* Price/Item */}
                                     <div>
                                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Price/Item (VND)</label>
                                         <input 
                                             type="text" 
                                             value={formData.unitPrice ? formData.unitPrice.toLocaleString() : ''} 
                                             onChange={e => handleAmountChange(e, 'unitPrice')}
                                             className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                             placeholder="0"
                                         />
                                     </div>

                                     {/* Total */}
                                     <div>
                                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Total {formData.type === 'income' ? 'Fund' : 'Est.'} (VND)</label>
                                         <input 
                                             type="text" 
                                             value={formData.estimatedVND ? formData.estimatedVND.toLocaleString() : ''} 
                                             readOnly
                                             className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none font-extrabold ${formData.type === 'income' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'}`}
                                             placeholder="0"
                                         />
                                     </div>
                                 </div>
                             </>
                         ) : (
                             // Management Mode Layout (Existing)
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                 {/* Date */}
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                                     <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" />
                                 </div>

                                 {/* Type Selector Management */}
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

                                {/* Category */}
                                <div>
                                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                                     <div className="relative">
                                         <input 
                                            type="text" 
                                            value={formData.category} 
                                            onChange={e => setFormData({...formData, category: e.target.value})}
                                            onFocus={() => setShowCategorySuggestions(true)}
                                            onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 200)}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" 
                                            placeholder="Select or type..." 
                                        />
                                        {/* Custom Category Dropdown */}
                                        {showCategorySuggestions && categorySuggestions.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-white/10 max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                                                {categorySuggestions.map((cat, idx) => (
                                                    <div 
                                                        key={idx}
                                                        onClick={() => {
                                                            setFormData({...formData, category: cat});
                                                            setShowCategorySuggestions(false);
                                                        }}
                                                        className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer flex items-center gap-3 transition-colors"
                                                    >
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0`} style={{ backgroundColor: `hsl(${(cat.length * 50 + 120) % 360}, 60%, 50%)` }}>
                                                            {cat.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-slate-700 dark:text-slate-200 font-medium">{cat}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                     </div>
                                 </div>
                                                                  {/* PIC / Benefactor */}
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                          {formData.type === 'income' ? 'Person in Charge/Benefactor' : 'Person in Charge'}
                                      </label>
                                      <input type="text" value={formData.pic} onChange={e => setFormData({...formData, pic: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder={formData.type === 'income' ? "Who donated?" : "Who is responsible?"} />
                                  </div>

                                  {/* Content */}
                                  <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                                      <input type="text" required value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Transaction description..." />
                                  </div>

                                  {/* Benefactor Of (Only for Income) */}
                                  {formData.type === 'income' && (
                                     <div>
                                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">To Whom? (Của ai)</label>
                                         <div className="relative">
                                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                 <i className="fas fa-user-tag text-xs"></i>
                                             </div>
                                             <input 
                                                 type="text" 
                                                 value={formData.benefactorOf} 
                                                 onChange={e => setFormData({...formData, benefactorOf: e.target.value})}
                                                 onFocus={() => setShowBenefactorSuggestions(true)}
                                                 onBlur={() => setTimeout(() => setShowBenefactorSuggestions(false), 200)}
                                                 className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" 
                                                 placeholder="Select or type..." 
                                             />
                                             {/* Custom Dropdown */}
                                             {showBenefactorSuggestions && benefactorSuggestions.length > 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-white/10 max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                                                    {benefactorSuggestions.map((name, idx) => (
                                                        <div 
                                                            key={idx}
                                                            onClick={() => {
                                                                setFormData({...formData, benefactorOf: name});
                                                                setShowBenefactorSuggestions(false);
                                                            }}
                                                            className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer flex items-center gap-3 transition-colors"
                                                        >
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0`} style={{ backgroundColor: `hsl(${(name.length * 40) % 360}, 70%, 50%)` }}>
                                                                {name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="text-slate-700 dark:text-slate-200 font-medium">{name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                             )}
                                         </div>
                                     </div>
                                  )}
                                
                                {/* Amount */}
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
                             </div>
                         )}

                         {/* Common: Note */}
                         <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Note</label>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input 
                                    type="text" 
                                    value={formData.note} 
                                    onChange={e => setFormData({...formData, note: e.target.value})} 
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-400" 
                                    placeholder="Add a note (optional)..."
                                />
                                {isEstimation && formData.type === 'income' && (
                                     <>
                                        <input 
                                            type="text" 
                                            value={formData.pic} 
                                            onChange={e => setFormData({...formData, pic: e.target.value})} 
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-400" 
                                            placeholder="Benefactor (Ân nhân)..." 
                                        />
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={formData.benefactorOf} 
                                                onChange={e => setFormData({...formData, benefactorOf: e.target.value})} 
                                                onFocus={() => setShowBenefactorSuggestions(true)}
                                                onBlur={() => setTimeout(() => setShowBenefactorSuggestions(false), 200)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-400" 
                                                placeholder="To whom? (Của ai)..." 
                                            />
                                            {/* Custom Dropdown */}
                                             {showBenefactorSuggestions && benefactorSuggestions.length > 0 && (
                                                <div className="absolute z-10 w-full bottom-full mb-1 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-white/10 max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                                                    {benefactorSuggestions.map((name, idx) => (
                                                        <div 
                                                            key={idx}
                                                            onClick={() => {
                                                                setFormData({...formData, benefactorOf: name});
                                                                setShowBenefactorSuggestions(false);
                                                            }}
                                                            className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer flex items-center gap-3 transition-colors"
                                                        >
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0`} style={{ backgroundColor: `hsl(${(name.length * 40) % 360}, 70%, 50%)` }}>
                                                                {name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="text-slate-700 dark:text-slate-200 font-medium">{name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                             )}
                                        </div>
                                     </>
                                )}
                             </div>
                         </div>
                     </div>
                     <div className="flex justify-end pt-2">
                         <button type="submit" className="px-8 py-2 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-500">Save Item</button>
                     </div>
                </form>
            )}

            {/* Filter Tabs & Total */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center pb-2 gap-4">
                <div className="flex gap-2 flex-wrap">
                    <button 
                        onClick={() => setFilterType('all')}
                        className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors border ${filterType === 'all' ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:border-white/10 dark:hover:bg-slate-800'}`}
                    >
                        All
                    </button>
                    <button 
                        onClick={() => setFilterType('income')}
                        className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors border ${filterType === 'income' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-green-600 border-slate-200 hover:bg-green-50 dark:bg-slate-900 dark:text-green-500 dark:border-white/10 dark:hover:bg-green-900/20'}`}
                    >
                        Income
                    </button>
                    <button 
                        onClick={() => setFilterType('expense')}
                        className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors border ${filterType === 'expense' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-600 border-slate-200 hover:bg-red-50 dark:bg-slate-900 dark:text-red-500 dark:border-white/10 dark:hover:bg-red-900/20'}`}
                    >
                        Expense
                    </button>
                    
                    {/* Benefactor Of FilterDropdown */}
                    {benefactorOfOptions.length > 0 && (
                        <div className="ml-2">
                            <select
                                value={filterBenefactorOf}
                                onChange={(e) => setFilterBenefactorOf(e.target.value)}
                                className="px-3 py-1.5 rounded-lg text-sm font-bold border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="all">All Beneficiaries</option>
                                {benefactorOfOptions.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Filtered Total Display - DEBUG VERIFICATION */}
                <div className="bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-lg border-2 border-blue-500 flex items-center gap-3 shadow-md" style={{ minWidth: '200px', display: 'flex', zIndex: 50 }}>
                     <span className="text-xs font-bold text-blue-700 dark:text-blue-200 uppercase">
                         {filterType === 'all' ? 'Current Balance' : filterType === 'income' ? 'Current Income' : 'Current Expense'}
                     </span>
                     <span className={`text-lg font-bold font-mono ${filteredTotal >= 0 ? 'text-blue-800 dark:text-white' : 'text-red-600 dark:text-red-300'}`}>
                         {filteredTotal >= 0 ? '+' : ''}{filteredTotal?.toLocaleString() || '0'} ₫
                     </span>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-xs">
                            <tr>
                                {isEstimation ? (
                                    <>
                                        <th className="px-4 py-3 text-left">Content</th>
                                        <th className="px-4 py-3 text-center">Unit</th>
                                        <th className="px-4 py-3 text-center">Qty</th>
                                        <th className="px-4 py-3 text-right text-slate-500">Total (VND)</th>
                                        <th className="px-4 py-3 text-left">Note</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-4 py-3 text-left">Date</th>
                                        <th className="px-4 py-3 text-center">Type</th>
                                        <th className="px-4 py-3 text-left">Category</th>
                                        <th className="px-4 py-3 text-left">PIC</th>
                                        <th className="px-4 py-3 text-left">Description</th>
                                        <th className="px-4 py-3 text-right">Amount (VND)</th>
                                        <th className="px-4 py-3 text-left">Note</th>
                                    </>
                                )}
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                             {filteredItems.map(item => (
                                 <tr key={item.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${item.isCompleted ? 'bg-green-50/50 dark:bg-green-900/10' : ''}`}>
                                     
                                     {isEstimation ? (
                                         <>
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white max-w-[200px]" title={item.content}>
                                                {item.type === 'income' && <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-green-100 text-green-700 font-bold mr-2 uppercase">Fund</span>}
                                                {item.content}
                                                {(item.type === 'income' && (item.pic || item.benefactorOf)) && (
                                                    <div className="text-xs text-green-600 font-normal mt-0.5 flex flex-col gap-0.5">
                                                        {item.pic && (
                                                            <span><i className="fas fa-hand-holding-heart mr-1"></i> {item.pic}</span>
                                                        )}
                                                        {item.benefactorOf && (
                                                            <span><i className="fas fa-user-tag mr-1"></i> For: {item.benefactorOf}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{item.unit || '-'}</td>
                                            <td className="px-4 py-3 text-center font-mono">{item.quantity}</td>
                                            <td className={`px-4 py-3 text-right font-bold ${item.type === 'income' ? 'text-green-600' : 'text-slate-900 dark:text-white'}`}>
                                                {item.type === 'income' ? '+' : ''}{item.estimatedVND.toLocaleString()} ₫
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 text-xs max-w-[150px] truncate" title={item.note}>{item.note || '-'}</td>
                                         </>
                                     ) : (
                                        <>
                                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{format(item.date.toDate(), 'dd/MM/yy')}</td>
                                            <td className="px-4 py-3 text-center">
                                                {item.type === 'income' ? (
                                                     <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold uppercase">Income</span>
                                                ) : (
                                                     <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold uppercase">Expense</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.category || '-'}</td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-medium">{item.pic || '-'}</td>
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white max-w-[300px] truncate" title={item.content}>
                                                {item.content}
                                                {item.type === 'income' && (item.pic || item.benefactorOf) && (
                                                    <div className="text-xs text-green-600 font-normal mt-0.5 flex flex-wrap gap-2">
                                                        {item.pic && <span><i className="fas fa-hand-holding-heart mr-1"></i> {item.pic}</span>}
                                                        {item.benefactorOf && <span><i className="fas fa-user-tag mr-1"></i> For: {item.benefactorOf}</span>}
                                                    </div>
                                                )}
                                            </td>
                                            <td className={`px-4 py-3 text-right font-bold font-mono ${item.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                                                {item.type === 'income' ? '+' : '-'}{item.actualVND.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 text-xs max-w-[150px] truncate" title={item.note}>{item.note || '-'}</td>
                                        </>
                                     )}

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

             {/* Fundraising Modal */}
            <FundraisingModal 
                isOpen={showFundraising}
                onClose={() => setShowFundraising(false)}
                walletId={walletId}
                totalEstimate={totalEstVND}
                availableFunds={currentFund}
                initialTargetPeople={wallet?.targetPeople}
                onUpdate={(newPeople) => setWallet(prev => prev ? ({ ...prev, targetPeople: newPeople}) : null)}
            />
        </div>
    );
}
