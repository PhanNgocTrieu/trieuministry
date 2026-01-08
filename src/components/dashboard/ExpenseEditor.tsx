"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, serverTimestamp, Timestamp, query, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useModal } from '@/context/ModalContext';

interface ExpenseCategory {
    id: string;
    name: string;
    color: string;
    type: 'income' | 'expense';
}

interface ExpenseEditorProps {
    basePath: string; // e.g. /dashboard/expenses
    defaultScope?: 'personal' | 'ministry';
}

export default function ExpenseEditor({ basePath, defaultScope = 'personal' }: ExpenseEditorProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('id');
    const { user, isAdmin, isVolunteer } = useAuth();
    const { showAlert } = useModal();

    const [scope, setScope] = useState<'personal' | 'ministry'>(defaultScope);
    const [type, setType] = useState<'expense' | 'income'>('expense');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [categoryId, setCategoryId] = useState('');
    const [description, setDescription] = useState('');
    const [allCategories, setAllCategories] = useState<ExpenseCategory[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingCats, setFetchingCats] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
             // Ideally we create a composite index for accurate querying
             // For now we fetch all and filter client side to avoid index missing errors during dev
             // Or we just query by name
            const q = query(collection(db, "expense_categories"), orderBy("name"));
            const snapshot = await getDocs(q);
            const list: ExpenseCategory[] = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                
                // Filter logic
                const isPersonal = data.scope === 'personal';
                const isMinistry = data.scope === 'ministry' || !data.scope;

                if (scope === 'personal') {
                    if (data.userId === user?.uid && isPersonal) {
                        list.push({ id: doc.id, ...data, type: data.type || 'expense' } as ExpenseCategory);
                    }
                } else if (scope === 'ministry') {
                    if (isMinistry) {
                        list.push({ id: doc.id, ...data, type: data.type || 'expense' } as ExpenseCategory);
                    }
                }
            });
            setAllCategories(list);
            setFetchingCats(false);
        };
        if (user) {
            fetchCategories();
        }
    }, [user, scope]);

    useEffect(() => {
        if (editId) {
            const fetchTransaction = async () => {
                const docRef = doc(db, "expenses", editId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    
                    if (data.userId && user && data.userId !== user.uid && !isAdmin) { // Admin can edit any
                        showAlert("Error", "You do not have permission to edit this transaction.");
                        router.push(basePath);
                        return;
                    }

                    setScope(data.scope || 'ministry'); // Default legacy to ministry if not set? Or personal? 
                    // Wait, if I edit legacy, it should probably stay legacy (undefined) or prompt?
                    // Let's default 'ministry' if missing for Admin.
                    setType(data.type || 'expense');
                    setAmount(data.amount.toString());
                    const d = data.date.toDate();
                    setDate(d.toISOString().split('T')[0]);
                    setCategoryId(data.categoryId);
                    setDescription(data.description);
                }
            };
            fetchTransaction();
        }
    }, [editId, user, router, basePath]);

    const filteredCategories = allCategories; // Show all categories regardless of type

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        const selectedCategory = allCategories.find(c => c.id === categoryId);
        
        const transactionData = {
            userId: user.uid,
            scope,
            type,
            amount: parseFloat(amount),
            date: Timestamp.fromDate(new Date(date)),
            categoryId,
            categoryName: selectedCategory ? selectedCategory.name : 'Unknown',
            categoryColor: selectedCategory ? selectedCategory.color : '#ccc',
            description,
        };

        try {
            if (editId) {
                await updateDoc(doc(db, "expenses", editId), {
                    ...transactionData,
                    updatedAt: serverTimestamp()
                });
            } else {
                await addDoc(collection(db, "expenses"), {
                    ...transactionData,
                    createdAt: serverTimestamp()
                });
            }
            router.back(); 
        } catch (error) {
            console.error(error);
            showAlert("Error", "Error saving transaction");
        } finally {
            setLoading(false);
        }
    };

    if (fetchingCats) return <div className="p-8 text-center text-slate-500">Loading form...</div>;

    return (
        <div className="max-w-xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-6">
                {editId ? 'Edit Transaction' : 'New Transaction'}
            </h1>

            <form onSubmit={handleSubmit} className="bg-slate-900 p-8 rounded-2xl border border-white/5 shadow-xl space-y-8">
                
                {/* Scope Selection Removed as per request - defaulting to personal/individual management */}
                
                {/* Type Toggle */}
                <div className="flex p-1.5 bg-slate-800 rounded-xl border border-white/5">
                    <button
                        type="button"
                        onClick={() => { setType('expense'); setCategoryId(''); }}
                        className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                            type === 'expense' 
                            ? 'bg-slate-700 text-red-500 shadow-sm border border-white/10' 
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <i className="fas fa-minus-circle"></i> Expense
                    </button>
                    <button
                        type="button"
                        onClick={() => { setType('income'); setCategoryId(''); }}
                        className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                            type === 'income' 
                            ? 'bg-slate-700 text-green-500 shadow-sm border border-white/10' 
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <i className="fas fa-plus-circle"></i> Income
                    </button>
                </div>

                {/* Amount */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Amount (VND)</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className={`text-xl font-bold ${type === 'expense' ? 'text-red-500' : 'text-green-500'}`}>₫</span>
                        </div>
                        <input 
                            type="number" 
                            step="1000"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full pl-10 pr-4 py-4 bg-slate-800 border border-white/10 rounded-xl focus:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-xl font-bold text-white outline-none"
                            placeholder="0"
                        />
                    </div>
                </div>

                {/* Date & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Date</label>
                        <input 
                            type="date" 
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl focus:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-white outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Category</label>
                        <div className="relative">
                            <select 
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl focus:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-white appearance-none outline-none"
                                required
                            >
                                <option value="" disabled>Select Category</option>
                                {filteredCategories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-500">
                                <i className="fas fa-chevron-down text-xs"></i>
                            </div>
                        </div>
                        <div className="mt-2 text-right">
                             <a 
                                href={`${basePath}/categories`}
                                className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center justify-end gap-1"
                            >
                                <i className="fas fa-plus"></i> New Category
                            </a>
                        </div>
                         {filteredCategories.length === 0 && (
                            <p className="text-xs text-red-400 mt-1 font-medium">
                                <i className="fas fa-exclamation-triangle mr-1"></i>
                                No categories found. Please add one.
                            </p>
                        )}
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Description</label>
                    <textarea 
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl focus:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-white resize-none outline-none placeholder:text-slate-600"
                        placeholder="Transaction details..."
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                    <button 
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 rounded-xl text-slate-400 font-bold hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        disabled={loading || filteredCategories.length === 0}
                        className={`px-8 py-3 rounded-xl text-white font-bold shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 ${
                            type === 'expense'
                            ? 'bg-gradient-to-r from-red-600 to-red-700 shadow-red-500/20'
                            : 'bg-gradient-to-r from-green-600 to-green-700 shadow-green-500/20'
                        }`}
                    >
                        {loading ? 'Saving...' : 'Save Transaction'}
                    </button>
                </div>

            </form>
        </div>
    );
}
