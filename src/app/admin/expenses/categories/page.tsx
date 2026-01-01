"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';

interface ExpenseCategory {
    id: string;
    name: string;
    color: string;
    isDefault?: boolean;
}

const COLORS = [
    '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', // Original & Bright
    '#F43F5E', '#D946EF', '#A855F7', '#64748B', '#78716C', '#14B8A6', '#22C55E', '#EAB308', '#60A5FA', '#9CA3AF'  // More shades
];

export default function CategoriesPage() {
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Form
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState(COLORS[0]);

    useEffect(() => {
        const q = query(collection(db, "expense_categories"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: ExpenseCategory[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                list.push({ 
                    id: doc.id, 
                    ...data,
                } as ExpenseCategory);
            });
            setCategories(list);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        try {
            await addDoc(collection(db, "expense_categories"), {
                name: newName.trim(),
                color: newColor,
                isDefault: false
            });
            setNewName('');
            setNewColor(COLORS[0]);
        } catch (error) {
            console.error("Error adding category:", error);
            alert("Failed to add category");
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete "${name}"? This might affect existing transactions.`)) {
            await deleteDoc(doc(db, "expense_categories", id));
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading categories...</div>;

    return (
        <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Financial Categories</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-fit">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h2 className="font-bold text-gray-700">
                             All Categories
                        </h2>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                        {categories.map(cat => (
                            <div key={cat.id} className="p-4 flex items-center justify-between group hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div 
                                        className="w-8 h-8 rounded-lg shadow-sm border border-black/5 flex-shrink-0" 
                                        style={{ backgroundColor: cat.color }}
                                    ></div>
                                    <span className="font-medium text-gray-900">{cat.name}</span>
                                </div>
                                {!cat.isDefault && (
                                    <button 
                                        onClick={() => handleDelete(cat.id, cat.name)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Delete Category"
                                    >
                                        <i className="fas fa-trash-alt text-sm"></i>
                                    </button>
                                )}
                            </div>
                        ))}
                        {categories.length === 0 && (
                            <div className="p-12 text-center text-gray-400">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <i className="fas fa-tags text-2xl text-gray-300"></i>
                                </div>
                                <p>No categories found.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Add Form */}
                <div className="h-fit sticky top-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <i className="fas fa-plus-circle text-blue-500"></i>
                            Add New Category
                        </h2>
                        <form onSubmit={handleAddCategory} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Category Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                                    placeholder="e.g., Salary, Rent, Food"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Color Tag</label>
                                <div className="grid grid-cols-5 sm:grid-cols-8 gap-3">
                                    {COLORS.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setNewColor(color)}
                                            className={`w-8 h-8 rounded-full transition-all duration-300 relative ${
                                                newColor === color 
                                                ? 'ring-2 ring-offset-2 ring-blue-500 scale-110 shadow-md' 
                                                : 'hover:scale-110 hover:shadow-sm opacity-80 hover:opacity-100'
                                            }`}
                                            style={{ backgroundColor: color }}
                                        >
                                            {newColor === color && (
                                                <span className="absolute inset-0 flex items-center justify-center text-white text-xs">
                                                    <i className="fas fa-check"></i>
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button 
                                type="submit"
                                className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <i className="fas fa-plus mr-2"></i>
                                Create Category
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
