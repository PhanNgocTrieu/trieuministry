"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, getDocs, setDoc, doc } from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import ImageUploader from "@/components/ImageUploader";
import RichTextEditor from "@/components/RichTextEditor";
import AdminGuard from "@/components/admin/AdminGuard";
import { useModal } from "@/context/ModalContext";
import { logActivity } from '@/lib/activity-logger';

interface MinistryImage {
  url: string;
  caption: string;
}

export default function CreateMinistryPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnUrl = searchParams.get('returnUrl') || '/admin/ministries';
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    
    // Bilingual Form Data
    const [formData, setFormData] = useState({
        // English (Default)
        title_en: "",
        description_en: "",
        prayerNeeds_en: "",
        
        // Vietnamese
        title_vi: "",
        description_vi: "",
        prayerNeeds_vi: "",

        category: "General", 
        status: "active",
        visibility: "public",
        sharedWith: "" 
    });

    const [activeTab, setActiveTab] = useState<'en' | 'vi'>('en');

    const [coverImage, setCoverImage] = useState<string>(""); 
    const [uploadKey, setUploadKey] = useState(0);
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const catsSnapshot = await getDocs(collection(db, "ministry_categories"));
                const storedCategories = new Set<string>();
                catsSnapshot.forEach(doc => {
                    storedCategories.add(doc.data().name);
                });

                const ministriesSnapshot = await getDocs(collection(db, "ministries"));
                ministriesSnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.category) {
                        storedCategories.add(data.category);
                    }
                });

                setCategories(prev => Array.from(new Set([...prev, ...Array.from(storedCategories)])).sort());
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };

        fetchCategories();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageUploaded = (url: string) => {
        if (url) {
            setCoverImage(url);
            setUploadKey(prev => prev + 1); 
        }
    };

    const removeImage = () => {
        setCoverImage("");
    };

    const { showAlert } = useModal();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const sharedWithArray = formData.sharedWith.split(',').map(email => email.trim()).filter(email => email);
            const categoryName = formData.category || "General";
            
            // Auto-save category
            if (!categories.includes(categoryName)) {
                try {
                    const catId = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
                    await setDoc(doc(db, "ministry_categories", catId), {
                        name: categoryName,
                        createdAt: serverTimestamp()
                    });
                } catch (err) { console.error(err); }
            }

            await addDoc(collection(db, "ministries"), {
                // Save Bilingual Data
                title_en: formData.title_en,
                title_vi: formData.title_vi,
                description_en: formData.description_en,
                description_vi: formData.description_vi,
                prayerNeeds_en: formData.prayerNeeds_en,
                prayerNeeds_vi: formData.prayerNeeds_vi,
                
                // Fallback for legacy support (Use English as Default)
                title: formData.title_en || formData.title_vi, 
                description: formData.description_en || formData.description_vi,
                prayerNeeds: formData.prayerNeeds_en || formData.prayerNeeds_vi,

                category: categoryName,
                status: formData.status,
                visibility: formData.visibility,
                sharedWith: sharedWithArray,
                coverImage: coverImage, 
                authorId: user?.uid,
                authorName: user?.displayName || 'Admin',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            await logActivity('ministry', 'create', `Created new ministry: ${formData.title_en || formData.title_vi}`);

            showAlert("Success", "Ministry added successfully!");
            router.push(returnUrl);
        } catch (error) {
            console.error("Error creating ministry:", error);
            showAlert("Error", "Failed to create ministry");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminGuard>
            <div className="max-w-4xl mx-auto mb-20">
            <div className="flex items-center gap-4 mb-6">
                <Link href={returnUrl} className="text-slate-400 hover:text-white transition-colors">
                    <i className="fas fa-arrow-left"></i> Back
                </Link>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Add New Ministry</h1>
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
                            <span className="mr-2">🇺🇸</span> English (Source)
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
                            Ministry Title <span className="text-slate-500 font-normal">({activeTab.toUpperCase()})</span>
                        </label>
                        <input 
                            type="text" 
                            name={`title_${activeTab}`}
                            required
                            // @ts-ignore
                            value={formData[`title_${activeTab}`]} 
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400"
                            placeholder={activeTab === 'en' ? "e.g. Youth Mentorship Program" : "Ví dụ: Chương trình Cố vấn Thanh niên"}
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                         <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Category</label>
                         {/* Category Logic (Same as before) */}
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

                {/* Single Image Section */}
                <div className="space-y-4">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Cover Image</label>
                    <div className="border border-slate-200 dark:border-white/10 rounded-lg p-6 bg-slate-50 dark:bg-slate-800/50">
                        {coverImage ? (
                            <div className="relative group max-w-md mx-auto">
                                <img src={coverImage} alt="Cover" className="w-full h-auto rounded-lg shadow-md" />
                                <button 
                                    type="button" 
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm transition-colors"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center min-h-[200px]">
                                <div className="w-full max-w-[200px]">
                                     <ImageUploader 
                                         key={uploadKey}
                                         onImageUploaded={handleImageUploaded} 
                                         folder="ministries" 
                                     />
                                </div>
                                <p className="text-sm text-slate-500 mt-4">Upload a representative image.</p>
                            </div>
                        )}
                    </div>
                </div>

                 <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Description <span className="text-slate-500 font-normal">({activeTab.toUpperCase()})</span></label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                        <i className="fas fa-info-circle mr-1"></i>
                        Use the toolbar to format text, add images, and import Word documents.
                    </p>
                    <RichTextEditor
                        // @ts-ignore
                        value={formData[`description_${activeTab}`]}
                        onChange={(html: string) => setFormData(prev => ({ ...prev, [`description_${activeTab}`]: html }))}
                        placeholder={activeTab === 'en' ? "Describe the ministry works..." : "Mô tả công việc của mục vụ..."}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-400 flex items-center gap-2">
                        <span className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 p-1 rounded"><i className="fas fa-pray"></i></span>
                        Prayer Needs <span className="text-slate-500 font-normal">({activeTab.toUpperCase()})</span>
                    </label>
                    <textarea 
                        name={`prayerNeeds_${activeTab}`} 
                        rows={4}
                        // @ts-ignore
                        value={formData[`prayerNeeds_${activeTab}`]} 
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-orange-500/20 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white bg-orange-500/5 placeholder-slate-600"
                        placeholder={activeTab === 'en' ? "List specific prayer needs..." : "Liệt kê các nhu cầu cầu nguyện cụ thể..."}
                    ></textarea>
                </div>

                <div className="border-t border-slate-200 dark:border-white/10 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Status</label>
                        <select 
                            name="status" 
                            value={formData.status} 
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                        >
                            <option value="active">Active</option>
                            <option value="on-hold">On Hold</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Visibility</label>
                        <select 
                            name="visibility" 
                            value={formData.visibility} 
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                        >
                            <option value="public">Public (Everyone)</option>
                            <option value="private">Private (Admin Only)</option>
                            <option value="shared">Shared (Specific Users)</option>
                        </select>
                    </div>
                </div>

                {formData.visibility === 'shared' && (
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-400">
                            Share with (Emails) <span className="text-slate-500 font-normal">- comma separated</span>
                        </label>
                        <textarea 
                            name="sharedWith" 
                            rows={2}
                            value={formData.sharedWith} 
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                            placeholder="user1@example.com, user2@example.com"
                        ></textarea>
                    </div>
                )}
                
                <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3">
                    <Link href={returnUrl} className="px-6 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        Cancel
                    </Link>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/50 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Create Ministry'}
                    </button>
                </div>
            </form>
            </div>
        </AdminGuard>
    );
}
