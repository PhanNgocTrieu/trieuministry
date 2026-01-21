"use client";

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useModal } from '@/context/ModalContext';
import AdminGuard from '@/components/admin/AdminGuard';
import { logActivity } from '@/lib/activity-logger';
import Link from 'next/link';

import ImageUploader from '@/components/ImageUploader';
import RichTextEditor from '@/components/admin/RichTextEditor';

export default function MinistryUpdateForm({ params }: { params?: Promise<{ id: string }> }) {
    const resolvedParams = params ? use(params) : null;
    const isEdit = !!resolvedParams?.id;
    const id = resolvedParams?.id;
    const router = useRouter();
    const { user } = useAuth();
    const { showAlert, showConfirm } = useModal();
    
    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    
    // Main Form Data
    const [formData, setFormData] = useState({
        title: '',
        titleEn: '',
        content: '', // Legacy or Intro
        letterContent: '', // New Letter Content
        status: 'draft', 
        type: 'official',
        coverImage: '',
        authorName: '',
        pdfUrl: ''
    });

    // Sections Data
    interface MinistrySection {
        id: string;
        title: string;
        description: string;
        images: string[];
    }
    const [sections, setSections] = useState<MinistrySection[]>([]);

    useEffect(() => {
        if (isEdit && id) {
            const fetchDoc = async () => {
                try {
                    const docRef = doc(db, "appeals", id);
                    const snap = await getDoc(docRef);
                    if (snap.exists()) {
                        const data = snap.data();
                        setFormData({
                            title: data.title || '',
                            titleEn: data.titleEn || '',
                            content: data.content || '',
                            letterContent: data.letterContent || '',
                            status: data.status || 'draft',
                            type: 'official',
                            coverImage: data.coverImage || '',
                            authorName: data.authorName || '',
                            pdfUrl: data.pdfUrl || ''
                        });
                        // Load Sections
                        if (data.ministrySections && Array.isArray(data.ministrySections)) {
                            setSections(data.ministrySections.map((s: any) => ({
                                id: s.id || Math.random().toString(36).substr(2, 9),
                                title: s.title || '',
                                description: s.description || '',
                                images: s.images || []
                            })));
                        }
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
        }
    }, [isEdit, id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- SECTIONS LOGIC ---
    const addSection = () => {
        setSections([...sections, {
            id: Math.random().toString(36).substr(2, 9),
            title: '',
            description: '',
            images: []
        }]);
    };

    const removeSection = (index: number) => {
        const newSections = [...sections];
        newSections.splice(index, 1);
        setSections(newSections);
    };

    const updateSection = (index: number, field: keyof MinistrySection, value: any) => {
        const newSections = [...sections];
        newSections[index] = { ...newSections[index], [field]: value };
        setSections(newSections);
    };

    const addImageToSection = (index: number, url: string) => {
        const newSections = [...sections];
        const currentImages = newSections[index].images || [];
        newSections[index].images = [...currentImages, url];
        setSections(newSections);
    };

    const removeImageFromSection = (sectionIndex: number, imageIndex: number) => {
        const newSections = [...sections];
        newSections[sectionIndex].images.splice(imageIndex, 1);
        setSections(newSections);
    };
    // ----------------------

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        if (!formData.title.trim()) {
            showAlert("Error", "Please enter a title");
            setSubmitting(false);
            return;
        }

        try {
            const dataToSave = {
                ...formData,
                ministrySections: sections,
                updatedAt: serverTimestamp()
            };

            if (isEdit && id) {
                await updateDoc(doc(db, "appeals", id), dataToSave);
                await logActivity('ministry_update', 'update', `Updated ministry update: ${formData.title}`);
                showAlert("Success", "Update saved successfully");
            } else {
                await addDoc(collection(db, "appeals"), {
                    ...dataToSave,
                    authorId: user?.uid,
                    authorName: user?.displayName || 'Admin',
                    createdAt: serverTimestamp(),
                });
                await logActivity('ministry_update', 'create', `Created ministry update: ${formData.title}`);
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

    return (
        <AdminGuard>
            <div className="max-w-5xl mx-auto space-y-8 pb-20">
                <div className="flex items-center gap-4">
                    <Link href="/admin/ministry-updates" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {isEdit ? 'Edit Update' : 'New Ministry Update'}
                        </h1>
                        <p className="text-slate-500">Create detailed reports with sections.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* 1. MAIN DETAILS */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-white/5 p-6 md:p-8 space-y-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-4 mb-4">
                            1. General Information
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Title</label>
                                <input 
                                    type="text" 
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg"
                                    placeholder="e.g., Monthly Ministry Update"
                                />
                            </div>

                            <div className="space-y-2">
                                 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Status</label>
                                 <select 
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none"
                                 >
                                     <option value="draft">Draft</option>
                                     <option value="published">Published</option>
                                 </select>
                            </div>
                        </div>
                        
                        {/* Cover Image */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Cover Image</label>
                            <div className="border border-slate-200 dark:border-white/10 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50">
                                <ImageUploader 
                                    onImageUploaded={(url) => setFormData(prev => ({ ...prev, coverImage: url }))} 
                                    folder="ministry_updates/covers"
                                    currentImage={formData.coverImage}
                                />
                            </div>
                        </div>

                        {/* Intro / Letter Content */}
                         <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Introduction / Letter Content</label>
                            <div className="rich-text-wrapper min-h-[200px]">
                                <RichTextEditor
                                    value={formData.letterContent || formData.content}
                                    onChange={(html) => setFormData(prev => ({ ...prev, letterContent: html }))}
                                    placeholder="Write your opening letter..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* 2. SECTIONS MANAGEMENT */}
                    <div className="space-y-6">
                         <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                2. Sections
                            </h3>
                            <button
                                type="button"
                                onClick={addSection}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                            >
                                <i className="fas fa-plus"></i> Add Section
                            </button>
                        </div>

                        {sections.length === 0 && (
                            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <i className="fas fa-layer-group text-4xl text-slate-300 mb-3"></i>
                                <p className="text-slate-500">No sections added yet. Click "Add Section" to create detailed content blocks.</p>
                            </div>
                        )}

                        {sections.map((section, index) => (
                            <div key={section.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-white/5 overflow-hidden animate-fade-in-up">
                                <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                                    <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">
                                        Section {index + 1}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => removeSection(index)}
                                        className="text-red-500 hover:text-red-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                        title="Remove Section"
                                    >
                                        <i className="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                                <div className="p-6 md:p-8 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Section Title</label>
                                        <input
                                            type="text"
                                            value={section.title}
                                            onChange={(e) => updateSection(index, 'title', e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                            placeholder="Section Header..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Section Content</label>
                                         <div className="rich-text-wrapper">
                                            <RichTextEditor
                                                value={section.description}
                                                onChange={(html) => updateSection(index, 'description', html)}
                                                placeholder="Details for this section..."
                                                className="min-h-[150px]"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Section Images</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {section.images?.map((img, imgIdx) => (
                                                <div key={imgIdx} className="relative aspect-video rounded-lg overflow-hidden group border border-slate-200 dark:border-white/10">
                                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImageFromSection(index, imgIdx)}
                                                        className="absolute top-2 right-2 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                    >
                                                        <i className="fas fa-times text-xs"></i>
                                                    </button>
                                                </div>
                                            ))}
                                            <div className="aspect-video bg-slate-50 dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center">
                                                <ImageUploader 
                                                    onImageUploaded={(url) => addImageToSection(index, url)}
                                                    folder={`ministry_updates/sections/${section.id}`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ACTIONS */}
                    <div className="sticky bottom-4 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex items-center justify-between">
                         <div className="text-sm text-slate-500">
                            {sections.length} sections defined
                         </div>
                         <div className="flex gap-4">
                            <Link 
                                href="/admin/ministry-updates"
                                className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                            >
                                Cancel
                            </Link>
                            <button 
                                type="submit"
                                disabled={submitting}
                                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                            >
                                {submitting ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i> Saving...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-save"></i> Save Complete Update
                                    </>
                                )}
                            </button>
                         </div>
                    </div>
                </form>
            </div>
        </AdminGuard>
    );
}
