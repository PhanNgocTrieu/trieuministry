"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import ConfirmModal from '@/components/admin/ConfirmModal';

interface ExpenseCategory {
    id: string;
    name: string;
    color: string;
    type: 'income' | 'expense';
    scope?: 'personal' | 'ministry';
    userId?: string;
}

interface CategoriesManagerProps {
    basePath: string;
    scope: 'personal' | 'ministry';
}

export default function CategoriesManager({ basePath, scope }: CategoriesManagerProps) {
    const { user, isAdmin } = useAuth();
    const router = useRouter();

    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [formName, setFormName] = useState('');
    const [formColor, setFormColor] = useState('#3B82F6');
    const [formType, setFormType] = useState<'income' | 'expense'>('expense');
    
    // Delete Modal
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({ isOpen: false, id: '', name: '' });

    useEffect(() => {
        if (!user) return;
        fetchCategories();
    }, [user, scope]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            // Fetch ALL categories first (since composite indexes might be missing for complex queries)
            // Or try simple filtering.
            // Ideally: collection("expense_categories")
            
            const q = query(collection(db, "expense_categories"), orderBy("name"));
            const snapshot = await getDocs(q);
            const list: ExpenseCategory[] = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const cat = { id: doc.id, ...data } as ExpenseCategory;

                // Filter logic matches functionality in ExpenseEditor
                const isPersonal = cat.scope === 'personal';
                const isMinistry = cat.scope === 'ministry' || !cat.scope; // Legacy/Global treated as ministry

                if (scope === 'personal') {
                    // Must be owned by user OR be a default personal category (if we had those, but for now assuming user-created)
                    // Currently enforcing strict ownership for personal categories
                    if (cat.userId === user?.uid && isPersonal) {
                        list.push(cat);
                    }
                } else if (scope === 'ministry') {
                    if (isMinistry) {
                        list.push(cat);
                    }
                }
            });

            setCategories(list);
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditId(null);
        setFormName('');
        setFormColor('#3B82F6');
        setFormType('expense');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (cat: ExpenseCategory) => {
        setEditId(cat.id);
        setFormName(cat.name);
        setFormColor(cat.color);
        setFormType(cat.type);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            const data = {
                name: formName,
                color: formColor,
                type: formType,
                scope,
                userId: user.uid, // Always bind creator
                updatedAt: serverTimestamp()
            };

            if (editId) {
                await updateDoc(doc(db, "expense_categories", editId), data);
            } else {
                await addDoc(collection(db, "expense_categories"), {
                    ...data,
                    createdAt: serverTimestamp()
                });
            }
            setIsModalOpen(false);
            fetchCategories();
        } catch (error) {
            console.error("Error saving category:", error);
            alert("Failed to save category");
        }
    };

    const handleDelete = (id: string, name: string) => {
        setDeleteModal({ isOpen: true, id, name });
    };

    const confirmDelete = async () => {
        if (!deleteModal.id) return;
        try {
            await deleteDoc(doc(db, "expense_categories", deleteModal.id));
            setDeleteModal({ isOpen: false, id: '', name: '' });
            fetchCategories();
        } catch (error) {
            console.error("Error deleting category:", error);
            alert("Failed to delete category");
        }
    };

    const incomeCats = categories.filter(c => c.type === 'income');
    const expenseCats = categories.filter(c => c.type === 'expense');

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {scope === 'personal' ? 'My Categories' : 'Ministry Categories'}
                    </h1>
                    <p className="text-gray-500">Manage income and expense categories.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                         onClick={() => router.back()}
                         className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-bold"
                    >
                        Back
                    </button>
                    <button 
                        onClick={handleOpenCreate}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center gap-2"
                    >
                        <i className="fas fa-plus"></i> New Category
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading categories...</div>
            ) : (
                <>
                    {categories.length === 0 ? (
                        <p className="text-gray-400 italic text-sm text-center py-12">No categories found. Create a new one to get started.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categories.map(cat => (
                                <div key={cat.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div 
                                            className="w-4 h-4 rounded-full" 
                                            style={{ backgroundColor: cat.color }}
                                        ></div>
                                        <span className="font-bold text-gray-800">{cat.name}</span>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleOpenEdit(cat)} className="text-gray-400 hover:text-blue-600">
                                            <i className="fas fa-pen"></i>
                                        </button>
                                        <button onClick={() => handleDelete(cat.id, cat.name)} className="text-gray-400 hover:text-red-600">
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Edit/Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-fade-in-up">
                        <h2 className="text-xl font-bold mb-6">
                            {editId ? 'Edit Category' : 'New Category'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formName}
                                    onChange={e => setFormName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Food, Salary"
                                />
                            </div>
                            
                            {/* Type selection removed as per user request */}

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', 
                                        '#8B5CF6', '#EC4899', '#6B7280', '#000000'
                                    ].map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setFormColor(color)}
                                            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                                                formColor === color ? 'border-gray-900 scale-110' : 'border-transparent'
                                            }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                    <input 
                                        type="color" 
                                        value={formColor}
                                        onChange={e => setFormColor(e.target.value)}
                                        className="w-8 h-8 rounded-full overflow-hidden border-0 p-0"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
                                >
                                    Save
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
                title="Delete Category"
                message={`Are you sure you want to delete "${deleteModal.name}"?`}
                confirmText="Delete"
                isDangerous={true}
            />
        </div>
    );
}
