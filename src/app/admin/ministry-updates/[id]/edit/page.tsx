"use client";

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, getDocs, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useModal } from '@/context/ModalContext';
import AdminGuard from '@/components/admin/AdminGuard';
import { logActivity } from '@/lib/activity-logger';
import Link from 'next/link';

import ImageUploader from '@/components/ImageUploader';
import FileUploader from '@/components/FileUploader';

export default function MinistryUpdateForm({ params }: { params?: Promise<{ id: string }> }) {
    const resolvedParams = params ? use(params) : null;
    const isEdit = !!resolvedParams?.id;
    const id = resolvedParams?.id;
    
    const router = useRouter();
    const { user } = useAuth();
    const { showAlert } = useModal();
    
    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'en' | 'vi'>('en');

    // Main Form Data
    const [formData, setFormData] = useState({
        // English (Mapped to *En fields)
        title_en: '',
        pdfUrl_en: '',
        
        // Vietnamese (Mapped to standard fields)
        title_vi: '',
        pdfUrl_vi: '',

        category: 'General',
        status: 'draft', 
        type: 'official',
        coverImage: '',
        authorName: '',
        
        // New fields for month/year sorting
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
    });

    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);

    // Fetch Categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                // Fetch from specific collection + existing appeals
                const catsSnapshot = await getDocs(collection(db, "appeal_categories"));
                const storedCategories = new Set<string>();
                catsSnapshot.forEach(doc => storedCategories.add(doc.data().name));

                // Also check existing appeals for categories
                const appealsSnapshot = await getDocs(collection(db, "appeals"));
                appealsSnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.category) storedCategories.add(data.category);
                });

                setCategories(Array.from(storedCategories).sort());
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };
        fetchCategories();
    }, []);

    // Load Existing Data
    useEffect(() => {
        if (isEdit && id) {
            const fetchDoc = async () => {
                try {
                    const docRef = doc(db, "appeals", id);
                    const snap = await getDoc(docRef);
                    if (snap.exists()) {
                        const data = snap.data();
                        
                        // Determine month/year if not present
                        let loadedMonth = data.month;
                        let loadedYear = data.year;
                        
                        if (!loadedMonth || !loadedYear) {
                           const d = data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date();
                           if (!loadedMonth) loadedMonth = d.getMonth() + 1;
                           if (!loadedYear) loadedYear = d.getFullYear();
                        }

                        setFormData({
                            title_en: data.titleEn || '',
                            pdfUrl_en: data.pdfUrlEn || '',

                            title_vi: data.title || '',
                            pdfUrl_vi: data.pdfUrl || '',

                            category: data.category || 'General',
                            status: data.status || 'draft',
                            type: 'official',
                            coverImage: data.coverImage || '',
                            authorName: data.authorName || '',
                            
                            month: loadedMonth,
                            year: loadedYear,
                        });
                    } else {
                        showAlert("Error", "Document not found");
                        router.push('/admin/ministry-updates');
                    }
                } catch (error) {
                    console.error(error);
                    showAlert("Error", "Failed to load document");
                } finally {
                    setLoading(false);
                }
            };
            fetchDoc();
        } else {
            setLoading(false);
        }
    }, [isEdit, id, router, showAlert]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const categoryName = formData.category || "General";
            
            // Auto-save category
            if (!categories.includes(categoryName)) {
                try {
                    const catId = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
                    await setDoc(doc(db, "appeal_categories", catId), {
                        name: categoryName,
                        createdAt: serverTimestamp()
                    });
                } catch (err) { console.error(err); }
            }

            const dataToSave = {
                // Map bilingual fields to schema
                title: formData.title_vi,
                titleEn: formData.title_en,
                
                // Content mapping - strictly using PDF URLs now
                pdfUrl: formData.pdfUrl_vi,
                pdfUrlEn: formData.pdfUrl_en,

                category: categoryName,
                status: formData.status,
                type: 'official',
                coverImage: formData.coverImage,
                
                month: Number(formData.month),
                year: Number(formData.year),
                
                updatedAt: serverTimestamp()
            };

            if (isEdit && id) {
                await updateDoc(doc(db, "appeals", id), dataToSave);
                await logActivity('ministry_update', 'update', `Updated ministry update: ${formData.title_en || formData.title_vi}`);
                showAlert("Success", "Update saved successfully");
            } else {
                await addDoc(collection(db, "appeals"), {
                    ...dataToSave,
                    authorId: user?.uid,
                    authorName: user?.displayName || 'Admin',
                    createdAt: serverTimestamp(),
                });
                await logActivity('ministry_update', 'create', `Created ministry update: ${formData.title_en || formData.title_vi}`);
                showAlert("Success", "Update created successfully");
            }
            router.push('/admin/ministry-updates');
        } catch (error) {
            console.error(error);
            showAlert("Error", "Failed to save update");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i + 1); // Next year down to 10 years ago

    return (
        <AdminGuard>
            <div className="max-w-4xl mx-auto mb-20">
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/admin/ministry-updates" className="text-slate-400 hover:text-white transition-colors">
                        <i className="fas fa-arrow-left"></i> Back
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {isEdit ? 'Edit Ministry Update' : 'New Ministry Update'}
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-white/5 p-6 space-y-6">
                    
                    {/* Language Tabs */}
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
                        <div className="flex gap-2">
                            <button 
                                type="button" 
                                onClick={() => setActiveTab('en')}
                                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'en' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                <span className="mr-2">🇺🇸</span> English
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setActiveTab('vi')}
                                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'vi' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                <span className="mr-2">🇻🇳</span> Vietnamese
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-400">
                                Title <span className="text-slate-500 font-normal">({activeTab.toUpperCase()})</span>
                            </label>
                            <input 
                                type="text" 
                                name={`title_${activeTab}`}
                                required
                                // @ts-ignore
                                value={formData[`title_${activeTab}`]} 
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400"
                                placeholder={activeTab === 'en' ? "e.g. Monthly Update" : "Ví dụ: Cập nhật tháng"}
                            />
                        </div>

                         {/* Date Selection */}
                         <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Month</label>
                            <select
                                name="month"
                                value={formData.month}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <option key={m} value={m}>
                                        {new Date(0, m - 1).toLocaleString('default', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Year</label>
                            <select
                                name="year"
                                value={formData.year}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                            >
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                             <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Category</label>
                             <div className="flex gap-2">
                                {isCustomCategory ? (
                                    <input 
                                        type="text" 
                                        name="category" 
                                        required
                                        value={formData.category} 
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-blue-500/30 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-blue-500/5 text-slate-900 dark:text-white"
                                        placeholder="Type new category name..."
                                    />
                                ) : (
                                    <select
                                        name="category"
                                        required
                                        value={formData.category}
                                        onChange={(e) => {
                                            if (e.target.value === '__NEW__') {
                                                setIsCustomCategory(true);
                                                setFormData(prev => ({ ...prev, category: '' }));
                                            } else {
                                                handleChange(e);
                                            }
                                        }}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                    >
                                        <option value="">Select a category...</option>
                                        {categories.map((cat, idx) => (
                                            <option key={idx} value={cat}>{cat}</option>
                                        ))}
                                        <option value="__NEW__" className="font-bold text-blue-600 dark:text-blue-400">+ Create New Category</option>
                                    </select>
                                )}
                                 <button
                                    type="button"
                                    onClick={() => {
                                        setIsCustomCategory(!isCustomCategory);
                                        if (!isCustomCategory) setFormData(prev => ({ ...prev, category: '' }));
                                    }}
                                    className="px-3 py-2 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                                >
                                    <i className={`fas ${isCustomCategory ? 'fa-list' : 'fa-plus'}`}></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Cover Image */}
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Cover Image</label>
                        <div className="border border-slate-200 dark:border-white/10 rounded-lg p-6 bg-slate-50 dark:bg-slate-800/50">
                             <ImageUploader 
                                 onImageUploaded={(url) => setFormData(prev => ({ ...prev, coverImage: url }))} 
                                 folder="ministry_updates/covers"
                                 currentImage={formData.coverImage}
                             />
                        </div>
                    </div>

                    {/* Document Upload Option */}
                    <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-white/5">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-400">
                            Attachment File <span className="text-slate-500 font-normal">({activeTab.toUpperCase()})</span>
                        </label>
                        <p className="text-xs text-slate-500 mb-2">Upload the {activeTab === 'en' ? 'English' : 'Vietnamese'} version of the document (PDF, DOCX).</p>
                        
                        {activeTab === 'en' ? (
                            <FileUploader 
                                onFileUploaded={(url) => setFormData(prev => ({ ...prev, pdfUrl_en: url }))}
                                currentFile={formData.pdfUrl_en}
                                folder="ministry_updates/documents"
                                label="Upload English Document"
                                accept=".pdf,.doc,.docx"
                            />
                        ) : (
                            <FileUploader 
                                onFileUploaded={(url) => setFormData(prev => ({ ...prev, pdfUrl_vi: url }))}
                                currentFile={formData.pdfUrl_vi}
                                folder="ministry_updates/documents"
                                label="Upload Vietnamese Document"
                                accept=".pdf,.doc,.docx"
                            />
                        )}
                    </div>

                    <div className="border-t border-slate-200 dark:border-white/10 pt-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Status</label>
                            <select 
                                name="status" 
                                value={formData.status} 
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="pt-4 flex justify-end gap-3">
                        <Link href="/admin/ministry-updates" className="px-6 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            Cancel
                        </Link>
                        <button 
                            type="submit" 
                            disabled={submitting}
                            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/50 disabled:opacity-50"
                        >
                            {submitting ? 'Saving...' : 'Save Update'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminGuard>
    );
}
