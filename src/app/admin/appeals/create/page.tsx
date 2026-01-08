"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import AdminGuard from '@/components/admin/AdminGuard';
import RichTextEditor from '@/components/RichTextEditor';
import ImageUploader from '@/components/ImageUploader';
import FileUploader from '@/components/FileUploader';
import { useModal } from '@/context/ModalContext';
import { logActivity } from '@/lib/activity-logger';

interface MinistrySection {
    id: string;
    title: string;
    titleEn?: string;
    description: string;
    descriptionEn?: string;
    images: string[];
}

interface AppealFormData {
    title: string;
    titleEn: string;
    status: string;
    coverImage: string;
    pdfUrl: string;
    pdfUrlEn: string; // New field
    letterContent: string; // New field
    letterContentEn: string; // New field
    ministrySections: MinistrySection[];
    fundraisingImages: string[];
    fundraisingDescription: string;
    fundraisingDescriptionEn: string;
    currentAmount: number;
    target: number;
}

export default function CreateAppealPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    
    // Initial State
    const [formData, setFormData] = useState<AppealFormData>({
        title: '',
        titleEn: '',
        status: 'published',
        coverImage: '',
        pdfUrl: '',
        pdfUrlEn: '',
        letterContent: '', // New field
        letterContentEn: '', // New field
        ministrySections: [
            { id: Date.now().toString(), title: '', titleEn: '', description: '', descriptionEn: '', images: [] }
         ],
        fundraisingImages: [], 
        fundraisingDescription: '',
        fundraisingDescriptionEn: '',
        currentAmount: 0,
        target: 0
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- Ministry Section Handlers ---

    const addMinistrySection = () => {
        setFormData(prev => ({
            ...prev,
            ministrySections: [
                ...prev.ministrySections,
                { id: Date.now().toString(), title: '', description: '', images: [] }
            ]
        }));
    };

    const removeMinistrySection = (id: string) => {
        setFormData(prev => ({
            ...prev,
            ministrySections: prev.ministrySections.filter(s => s.id !== id)
        }));
    };

    const updateMinistrySection = (id: string, field: keyof MinistrySection, value: any) => {
        setFormData(prev => ({
            ...prev,
            ministrySections: prev.ministrySections.map(s => 
                s.id === id ? { ...s, [field]: value } : s
            )
        }));
    };

    // --- Submit ---

    const { showAlert } = useModal();

    // --- Submit ---

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await addDoc(collection(db, "appeals"), {
                ...formData,
                type: 'official', // Maintain compatibility if needed
                authorId: user?.uid,
                authorName: user?.displayName || 'Admin',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            await logActivity(
                'appeal',
                'create',
                `New appeal created: ${formData.title}`,
                { title: formData.title, status: formData.status }
            );

            showAlert("Success", "Appeal created successfully!");
            router.push("/admin/appeals");
        } catch (error) {
            console.error("Error creating appeal:", error);
            showAlert("Error", "Failed to create appeal");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminGuard>
            <div className="max-w-5xl mx-auto pb-20">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/admin/appeals" className="text-slate-400 hover:text-white transition-colors">
                        <i className="fas fa-arrow-left"></i> Back
                    </Link>
                    <h1 className="text-3xl font-bold text-white">Create New Appeal Letter</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* 1. Basic Info */}
                    <div className="bg-slate-900 rounded-2xl shadow-lg border border-white/5 p-8">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg flex items-center justify-center text-sm">1</span>
                            General Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2">Title (Vietnamese)</label>
                                    <input 
                                        type="text" 
                                        name="title" 
                                        required
                                        value={formData.title} 
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg text-white placeholder-slate-600"
                                        placeholder="e.g. Ca Ngợi Chúa Giáng Sinh 2024"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2">Title (English)</label>
                                    <input 
                                        type="text" 
                                        name="titleEn" 
                                        value={formData.titleEn} 
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg text-white placeholder-slate-600"
                                        placeholder="e.g. Christmas Charity Appeal 2024"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">Status</label>
                                <select 
                                    name="status" 
                                    value={formData.status} 
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-white"
                                >
                                    <option value="published">Published</option>
                                    <option value="draft">Draft</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">Cover Image</label>
                                <div className="border border-white/10 rounded-xl p-2 bg-slate-800/50">
                                    {formData.coverImage ? (
                                        <div className="relative group">
                                            <img src={formData.coverImage} alt="Cover" className="w-full h-32 object-cover rounded-lg" />
                                            <button 
                                                type="button"
                                                onClick={() => setFormData({...formData, coverImage: ''})}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-sm"
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    ) : (
                                        <ImageUploader onImageUploaded={(url) => setFormData(prev => ({...prev, coverImage: url}))} folder="appeals_covers" />
                                    )}
                                </div>
                            </div>
                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2">Target Amount (VND)</label>
                                    <input 
                                        type="number" 
                                        name="target" 
                                        value={formData.target} 
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-600"
                                        placeholder="e.g. 10000000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2">Current Amount (VND)</label>
                                    <input 
                                        type="number" 
                                        name="currentAmount" 
                                        value={formData.currentAmount} 
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-600"
                                        placeholder="e.g. 0"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Ministry Sections (Simplified - No Images) */}
                    <div className="bg-slate-900 rounded-2xl shadow-lg border border-white/5 p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="w-8 h-8 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg flex items-center justify-center text-sm">2</span>
                                Ministry Highlights / Details
                            </h2>
                            <button 
                                type="button" 
                                onClick={addMinistrySection}
                                className="px-4 py-2 bg-slate-800 text-slate-300 border border-white/10 rounded-lg font-bold hover:bg-slate-700 hover:text-white transition-colors text-sm"
                            >
                                <i className="fas fa-plus mr-2"></i> Add Section
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            {formData.ministrySections.map((section, index) => (
                                <div key={section.id} className="border border-white/10 rounded-xl p-6 relative bg-slate-800/30">
                                    <div className="absolute top-4 right-4">
                                        <button 
                                            type="button"
                                            onClick={() => removeMinistrySection(section.id)}
                                            className="text-slate-500 hover:text-red-400 transition-colors"
                                            title="Remove Section"
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Section Title (VI)</label>
                                                <input 
                                                    type="text" 
                                                    value={section.title}
                                                    onChange={(e) => updateMinistrySection(section.id, 'title', e.target.value)}
                                                    className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-slate-600"
                                                    placeholder="Tiêu đề tiếng Việt"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Section Title (EN)</label>
                                                <input 
                                                    type="text" 
                                                    value={section.titleEn || ''}
                                                    onChange={(e) => updateMinistrySection(section.id, 'titleEn', e.target.value)}
                                                    className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-slate-600"
                                                    placeholder="English Title"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description (VI)</label>
                                                <div className="bg-white rounded-lg border border-white/10 overflow-hidden text-black">
                                                    <RichTextEditor 
                                                        value={section.description} 
                                                        onChange={(html) => updateMinistrySection(section.id, 'description', html)} 
                                                        placeholder="Mô tả chi tiết..."
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description (EN)</label>
                                                <div className="bg-white rounded-lg border border-white/10 overflow-hidden text-black">
                                                    <RichTextEditor 
                                                        value={section.descriptionEn || ''} 
                                                        onChange={(html) => updateMinistrySection(section.id, 'descriptionEn', html)} 
                                                        placeholder="English description..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. Fundraising Section (Images) */}
                    <div className="bg-slate-900 rounded-2xl shadow-lg border border-white/5 p-8">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg flex items-center justify-center text-sm">3</span>
                            Fundraising & Financial Reports (Gây quỹ)
                        </h2>
                        
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2">Fundraising Description (VI)</label>
                                    <div className="bg-white rounded-lg border border-white/10 overflow-hidden text-black">
                                        <RichTextEditor 
                                            value={formData.fundraisingDescription} 
                                            onChange={(html) => setFormData({...formData, fundraisingDescription: html})} 
                                            placeholder="Mô tả mục tiêu gây quỹ..."
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2">Fundraising Description (EN)</label>
                                    <div className="bg-white rounded-lg border border-white/10 overflow-hidden text-black">
                                        <RichTextEditor 
                                            value={formData.fundraisingDescriptionEn} 
                                            onChange={(html) => setFormData({...formData, fundraisingDescriptionEn: html})} 
                                            placeholder="Fundraising goals (English)..."
                                        />
                                    </div>
                                </div>
                            </div>
                            </div>
                            
                            {/* NEW: Financial Reports Gallery */}
                            <div className="border-t border-white/10 pt-6">
                                <label className="block text-sm font-bold text-slate-400 mb-4">Financial Reports Gallery (Báo cáo tài chính)</label>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    {formData.fundraisingImages.map((img, idx) => (
                                        <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10 bg-slate-800">
                                            <img src={img} alt={`Report ${idx + 1}`} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({
                                                    ...prev,
                                                    fundraisingImages: prev.fundraisingImages.filter((_, i) => i !== idx)
                                                }))}
                                                className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
                                            >
                                                <i className="fas fa-trash-alt text-xs"></i>
                                            </button>
                                        </div>
                                    ))}
                                    
                                    {/* Upload Trigger */}
                                    <div className="aspect-square">
                                        <ImageUploader 
                                            key={formData.fundraisingImages.length}
                                            folder="appeals_reports"
                                            onImageUploaded={(url) => {
                                                if (url) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        fundraisingImages: [...prev.fundraisingImages, url]
                                                    }));
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500">Upload multiple images for monthly expense reports.</p>
                            </div>
                        </div>


                    {/* 4. PDF Attachments */}
                    <div className="bg-slate-900 rounded-2xl shadow-lg border border-white/5 p-8">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-lg flex items-center justify-center text-sm">4</span>
                            PDF Attachments (Downloadable Files)
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                 <label className="block text-sm font-bold text-slate-400 mb-2">Vietnamese PDF</label>
                                 <div className="p-4 bg-slate-800 rounded-xl border border-white/10">
                                    <FileUploader 
                                        onFileUploaded={(url) => setFormData(prev => ({...prev, pdfUrl: url}))} 
                                        folder="appeals_pdfs" 
                                        label="Click to upload Vietnamese PDF"
                                        currentFile={formData.pdfUrl}
                                    />
                                 </div>
                            </div>
                            <div>
                                 <label className="block text-sm font-bold text-slate-400 mb-2">English PDF</label>
                                 <div className="p-4 bg-slate-800 rounded-xl border border-white/10">
                                    <FileUploader 
                                        onFileUploaded={(url) => setFormData(prev => ({...prev, pdfUrlEn: url}))} 
                                        folder="appeals_pdfs" 
                                        label="Click to upload English PDF"
                                        currentFile={formData.pdfUrlEn}
                                    />
                                 </div>
                            </div>
                        </div>
                    </div>

                    {/* submit */}
                    <div className="flex justify-end gap-4 pt-4">
                        <Link 
                            href="/admin/appeals"
                            className="px-8 py-3 border border-white/10 text-slate-400 rounded-xl hover:bg-slate-800 font-bold transition-colors"
                        >
                            Cancel
                        </Link>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 font-bold shadow-lg shadow-blue-900/50 disabled:opacity-50 flex items-center gap-2 transform active:scale-95 transition-all"
                        >
                            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
                            Publish Appeal
                        </button>
                    </div>
                </form>
            </div>
        </AdminGuard>
    );
}
