"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp, setDoc } from "firebase/firestore";
import Link from "next/link";
import { useModal } from "@/context/ModalContext";
import AdminGuard from "@/components/admin/AdminGuard";

interface MinistryCategory {
    id: string;
    name: string;
    createdAt?: any;
}

export default function MinistryCategoriesPage() {
    const router = useRouter();
    const { showAlert, showConfirm } = useModal();
    const [categories, setCategories] = useState<MinistryCategory[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [formName, setFormName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "ministry_categories"), orderBy("name"));
            const snapshot = await getDocs(q);
            const list: MinistryCategory[] = [];
            
            snapshot.forEach(doc => {
                list.push({ id: doc.id, ...doc.data() } as MinistryCategory);
            });

            setCategories(list);

            // Auto-sync legacy categories & Seeding Defaults
            const defaults = [
                "Vision Man Discipleship",
                "Fellowship Community",
                "Youth Ministry",
                "Worship Team",
                "Outreach",
                "Education",
                "General"
            ];

            // Fetch ALL legacy categories from ministries usage
            const ministriesSnapshot = await getDocs(collection(db, "ministries"));
            const legacyCategories = new Set<string>();
            ministriesSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.category) {
                    legacyCategories.add(data.category);
                }
            });

            // Add defaults to legacy check set
            defaults.forEach(d => legacyCategories.add(d));

            // If a category (legacy or default) is NOT in the fetched list, add it to DB
            const existingNames = new Set(list.map(c => c.name));
            let addedNew = false;
            
            for (const legCat of Array.from(legacyCategories)) {
                if (!existingNames.has(legCat)) {
                    console.log("Migrating legacy category:", legCat);
                    const id = legCat.toLowerCase().replace(/[^a-z0-9]+/g, '_');
                    try {
                        await setDoc(doc(db, "ministry_categories", id), {
                            name: legCat,
                            createdAt: serverTimestamp()
                        });
                        list.push({ id, name: legCat }); // Update UI immediately
                        addedNew = true;
                    } catch (err) {
                        console.error("Error migrating category:", err);
                    }
                }
            }

            if (addedNew) {
                // Re-sort list if we added new items
                list.sort((a, b) => a.name.localeCompare(b.name));
                setCategories([...list]);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditId(null);
        setFormName('');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (cat: MinistryCategory) => {
        setEditId(cat.id);
        setFormName(cat.name);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const categoryName = formName.trim();
            if (!categoryName) return;

            // Simple ID generation for consistency and duplicate prevention
            const id = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '_');

            const data = {
                name: categoryName,
                updatedAt: serverTimestamp()
            };

            if (editId) {
                await updateDoc(doc(db, "ministry_categories", editId), data);
            } else {
                await setDoc(doc(db, "ministry_categories", id), {
                    ...data,
                    createdAt: serverTimestamp()
                });
            }

            setIsModalOpen(false);
            fetchCategories();
            showAlert("Success", "Category saved successfully.");
        } catch (error) {
            console.error("Error saving category:", error);
            showAlert("Error", "Failed to save category");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (id: string, name: string) => {
        showConfirm(
            "Delete Category",
            `Are you sure you want to delete "${name}"?`,
            async () => {
                try {
                    await deleteDoc(doc(db, "ministry_categories", id));
                    setCategories(categories.filter(c => c.id !== id));
                    showAlert("Success", "Category deleted successfully.");
                } catch (error) {
                    console.error("Error deleting category:", error);
                    showAlert("Error", "Failed to delete category");
                }
            },
            true,
            "Delete"
        );
    };

    return (
        <AdminGuard>
            <div className="max-w-4xl mx-auto space-y-8 mb-20 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Ministry Categories</h1>
                        <p className="text-slate-400">Manage categories for ministries.</p>
                    </div>
                    <div className="flex gap-3">
                         <Link 
                            href="/admin/ministries"
                            className="px-4 py-2 text-slate-400 bg-slate-900 border border-white/10 rounded-lg hover:text-white hover:bg-slate-800 font-bold flex items-center gap-2 transition-colors"
                        >
                            <i className="fas fa-arrow-left"></i> Back
                        </Link>
                        <button 
                            onClick={handleOpenCreate}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20"
                        >
                            <i className="fas fa-plus"></i> New Category
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-slate-500">Loading categories...</div>
                ) : (
                    <>
                        {categories.length === 0 ? (
                            <div className="text-center py-16 bg-slate-900 rounded-xl border border-dashed border-white/10">
                                <p className="text-slate-500 mb-4">No categories found.</p>
                                <button 
                                    onClick={handleOpenCreate}
                                    className="px-4 py-2 bg-blue-500/10 text-blue-400 font-bold rounded-lg hover:bg-blue-500/20 border border-blue-500/20"
                                >
                                    Create First Category
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {categories.map(cat => (
                                    <div key={cat.id} className="bg-slate-900 p-4 rounded-xl border border-white/5 shadow-lg flex items-center justify-between group hover:border-white/10 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                                                 <i className="fas fa-tag"></i>
                                            </div>
                                            <span className="font-bold text-white">{cat.name}</span>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleOpenEdit(cat)} className="text-slate-500 hover:text-blue-400 w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-500/10 transition-colors">
                                                <i className="fas fa-pen"></i>
                                            </button>
                                            <button onClick={() => handleDelete(cat.id, cat.name)} className="text-slate-500 hover:text-red-400 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500/10 transition-colors">
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
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-slate-900 rounded-2xl w-full max-w-md p-6 animate-fade-in-up shadow-2xl border border-white/10">
                            <h2 className="text-xl font-bold mb-6 text-white">
                                {editId ? 'Edit Category' : 'New Category'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-1">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formName}
                                        onChange={e => setFormName(e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold text-white placeholder-slate-600 outline-none transition-all"
                                        placeholder="e.g. Media Team"
                                        autoFocus
                                    />
                                    <p className="text-xs text-slate-500 mt-1">This will appear in category suggestions.</p>
                                </div>
                                
                                <div className="flex justify-end gap-3 pt-6 border-t border-white/10 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-slate-400 font-bold hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 shadow-lg shadow-blue-900/50 transition-all transform active:scale-95 disabled:opacity-50"
                                    >
                                        {submitting ? 'Saving...' : 'Save Category'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminGuard>
    );
}
