"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import AdminGuard from '@/components/admin/AdminGuard';
import RichTextEditor from '@/components/RichTextEditor';
import ImageUploader from '@/components/ImageUploader';
import FileUploader from '@/components/FileUploader';

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
}

export default function EditAppealPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
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
        ministrySections: [],
        fundraisingImages: [], 
        fundraisingDescription: '',
        fundraisingDescriptionEn: '',
    });

    useEffect(() => {
        const fetchAppeal = async () => {
            try {
                const docRef = doc(db, "appeals", id);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData({
                        title: data.title || "",
                        titleEn: data.titleEn || "",
                        status: data.status || "published",
                        coverImage: data.coverImage || "",
                        pdfUrl: data.pdfUrl || "",
                        pdfUrlEn: data.pdfUrlEn || "",
                        letterContent: data.letterContent || data.content || "", // Fallback to content
                        letterContentEn: data.letterContentEn || "",
                        ministrySections: data.ministrySections || [],
                        fundraisingImages: data.fundraisingImages || [],
                        fundraisingDescription: data.fundraisingDescription || "",
                        fundraisingDescriptionEn: data.fundraisingDescriptionEn || "",
                    });
                } else {
                    alert("Appeal not found");
                    router.push("/admin/appeals");
                }
            } catch (error) {
                console.error("Error fetching appeal:", error);
                alert("Error loading appeal details");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchAppeal();
    }, [id, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- Ministry Section Handlers ---

    const addMinistrySection = () => {
        setFormData(prev => ({
            ...prev,
            ministrySections: [
                ...prev.ministrySections,
                { id: Date.now().toString(), title: '', titleEn: '', description: '', descriptionEn: '', images: [] }
            ]
        }));
    };

    const removeMinistrySection = (sectionId: string) => {
        setFormData(prev => ({
            ...prev,
            ministrySections: prev.ministrySections.filter(s => s.id !== sectionId)
        }));
    };

    const updateMinistrySection = (sectionId: string, field: keyof MinistrySection, value: any) => {
        setFormData(prev => ({
            ...prev,
            ministrySections: prev.ministrySections.map(s => 
                s.id === sectionId ? { ...s, [field]: value } : s
            )
        }));
    };

    // --- Submit ---

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const docRef = doc(db, "appeals", id);
            await updateDoc(docRef, {
                ...formData,
                updatedAt: serverTimestamp()
            });

            alert("Appeal updated successfully!");
            router.push("/admin/appeals");
        } catch (error) {
            console.error("Error updating appeal:", error);
            alert("Failed to update appeal");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-20 text-center"><i className="fas fa-spinner fa-spin text-3xl text-blue-600"></i></div>;

    return (
        <AdminGuard>
            <div className="max-w-5xl mx-auto pb-20">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/admin/appeals" className="text-gray-500 hover:text-gray-700">
                        <i className="fas fa-arrow-left"></i> Back
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Edit Appeal Letter</h1>
                        <p className="text-sm text-gray-500">ID: {id}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* 1. Basic Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">1</span>
                            General Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Title (Vietnamese)</label>
                                    <input 
                                        type="text" 
                                        name="title" 
                                        required
                                        value={formData.title} 
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg"
                                        placeholder="e.g. Ca Ngợi Chúa Giáng Sinh 2024"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Title (English)</label>
                                    <input 
                                        type="text" 
                                        name="titleEn" 
                                        value={formData.titleEn} 
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg"
                                        placeholder="e.g. Christmas Charity Appeal 2024"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                                <select 
                                    name="status" 
                                    value={formData.status} 
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="published">Published</option>
                                    <option value="draft">Draft</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Cover Image</label>
                                <div className="border border-gray-200 rounded-xl p-2">
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
                        </div>
                    </div>

                    {/* 2. Ministry Letter Content (NEW) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-sm">2</span>
                            Ministry Letter (Thư Mục Vụ)
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Letter Content (Vietnamese)</label>
                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                    <RichTextEditor 
                                        value={formData.letterContent || ''} 
                                        onChange={(html) => setFormData({...formData, letterContent: html})} 
                                        placeholder="Nội dung thư mục vụ (Tiếng Việt)..."
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Letter Content (English)</label>
                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                    <RichTextEditor 
                                        value={formData.letterContentEn || ''} 
                                        onChange={(html) => setFormData({...formData, letterContentEn: html})} 
                                        placeholder="Ministry Letter Content (English)..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Ministry Sections (Simplified - No Images) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">3</span>
                                Ministry Highlights / Details
                            </h2>
                            <button 
                                type="button" 
                                onClick={addMinistrySection}
                                className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-bold hover:bg-indigo-100 transition-colors text-sm"
                            >
                                <i className="fas fa-plus mr-2"></i> Add Section
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            {formData.ministrySections.map((section, index) => (
                                <div key={section.id} className="border border-gray-200 rounded-xl p-6 relative bg-gray-50/50">
                                    <div className="absolute top-4 right-4">
                                        <button 
                                            type="button"
                                            onClick={() => removeMinistrySection(section.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                            title="Remove Section"
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Section Title (VI)</label>
                                                <input 
                                                    type="text" 
                                                    value={section.title}
                                                    onChange={(e) => updateMinistrySection(section.id, 'title', e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                                                    placeholder="Tiêu đề tiếng Việt"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Section Title (EN)</label>
                                                <input 
                                                    type="text" 
                                                    value={section.titleEn || ''}
                                                    onChange={(e) => updateMinistrySection(section.id, 'titleEn', e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                                                    placeholder="English Title"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description (VI)</label>
                                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                    <RichTextEditor 
                                                        value={section.description} 
                                                        onChange={(html) => updateMinistrySection(section.id, 'description', html)} 
                                                        placeholder="Mô tả chi tiết..."
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description (EN)</label>
                                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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

                    {/* 4. Fundraising Section (No Images) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-sm">4</span>
                            Fundraising & Financial Reports (Gây quỹ)
                        </h2>
                        
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Fundraising Description (VI)</label>
                                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                        <RichTextEditor 
                                            value={formData.fundraisingDescription} 
                                            onChange={(html) => setFormData({...formData, fundraisingDescription: html})} 
                                            placeholder="Mô tả mục tiêu gây quỹ..."
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Fundraising Description (EN)</label>
                                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                        <RichTextEditor 
                                            value={formData.fundraisingDescriptionEn} 
                                            onChange={(html) => setFormData({...formData, fundraisingDescriptionEn: html})} 
                                            placeholder="Fundraising goals (English)..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 5. PDF Attachments */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-sm">5</span>
                            PDF Attachments (Downloadable Files)
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                 <label className="block text-sm font-bold text-gray-700 mb-2">Vietnamese PDF</label>
                                 <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <FileUploader 
                                        onFileUploaded={(url) => setFormData(prev => ({...prev, pdfUrl: url}))} 
                                        folder="appeals_pdfs" 
                                        label="Click to upload Vietnamese PDF"
                                        currentFile={formData.pdfUrl}
                                    />
                                 </div>
                            </div>
                            <div>
                                 <label className="block text-sm font-bold text-gray-700 mb-2">English PDF</label>
                                 <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
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
                            className="px-8 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-bold transition-colors"
                        >
                            Cancel
                        </Link>
                        <button 
                            type="submit" 
                            disabled={saving}
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center gap-2 transform active:scale-95 transition-all"
                        >
                            {saving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </AdminGuard>
    );
}
