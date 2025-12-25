"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import AdminGuard from '@/components/admin/AdminGuard';
import RichTextEditor from '@/components/RichTextEditor';
import ImageUploader from '@/components/ImageUploader';

import FileUploader from '@/components/FileUploader';

export default function EditAppealPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        status: 'published',
        coverImage: '',
        pdfUrl: '',
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
                        content: data.content || "",
                        status: data.status || "published",
                        coverImage: data.coverImage || "",
                        pdfUrl: data.pdfUrl || "",
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

    const handleContentChange = (html: string) => {
        setFormData({ ...formData, content: html });
    };

    const handleImageUploaded = (url: string) => {
        setFormData({ ...formData, coverImage: url });
    };

    const handlePdfUploaded = (url: string) => {
        setFormData({ ...formData, pdfUrl: url });
    };

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

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <AdminGuard>
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/admin/appeals" className="text-gray-500 hover:text-gray-700">
                        <i className="fas fa-arrow-left"></i> Back
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900">Edit Appeal Letter</h1>
                        <p className="text-xs text-gray-500">ID: {id}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                                <input 
                                    type="text" 
                                    name="title" 
                                    required
                                    value={formData.title} 
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Letter Content</label>
                                <RichTextEditor 
                                    value={formData.content} 
                                    onChange={handleContentChange} 
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                                <select 
                                    name="status" 
                                    value={formData.status} 
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="published">Published</option>
                                    <option value="draft">Draft</option>
                                    <option value="archived">Archived</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Cover Image</label>
                                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                    {formData.coverImage ? (
                                        <div className="relative">
                                            <img src={formData.coverImage} alt="Cover" className="w-full h-48 object-cover rounded-lg mb-2" />
                                            <button 
                                                type="button"
                                                onClick={() => setFormData({...formData, coverImage: ''})}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="h-48 flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                                            <span className="text-gray-400 text-sm">No image selected</span>
                                        </div>
                                    )}
                                    <div className="mt-3">
                                        <ImageUploader onImageUploaded={handleImageUploaded} folder="appeals_covers" />
                                    </div>
                                </div>
                            </div>

                             <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Attach PDF</label>
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <FileUploader 
                                        onFileUploaded={handlePdfUploaded} 
                                        folder="appeals_pdfs" 
                                        label="Upload Appeal PDF"
                                        currentFile={formData.pdfUrl}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                        <Link 
                            href="/admin/appeals"
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                        >
                            Cancel
                        </Link>
                        <button 
                            type="submit" 
                            disabled={saving}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-sm disabled:opacity-50 flex items-center gap-2"
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
