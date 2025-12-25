"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import RichTextEditor from '@/components/RichTextEditor';
import ImageUploader from '@/components/ImageUploader';

const categories = ['Bible Study', 'Sharing', 'Music', 'Leadership', 'Testimony'];

interface CreateBlogModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateBlogModal({ isOpen, onClose, onSuccess }: CreateBlogModalProps) {
    const { user } = useAuth();
    
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState(categories[0]);
    const [excerpt, setExcerpt] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            alert("Please fill in title and content");
            return;
        }

        setIsSubmitting(true);
        try {
            // Generate basic slug
            const slug = title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');

            await addDoc(collection(db, "blogs"), {
                title,
                slug: `${slug}-${Date.now()}`,
                content,
                excerpt: excerpt || content.substring(0, 150).replace(/<[^>]*>/g, '') + '...',
                category,
                coverImage: coverImage || null,
                author: user?.displayName || 'Anonymous',
                authorId: user?.uid,
                authorEmail: user?.email,
                date: new Date().toISOString().split('T')[0],
                timestamp: serverTimestamp(),
                status: 'pending',
                tags: []
            });

            setShowSuccess(true);
            onSuccess(); // Triggers refresh in parent
            
            // Reset form
            setTitle('');
            setContent('');
            setCoverImage('');
        } catch (error) {
            console.error("Error creating blog:", error);
            alert("Failed to create blog. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setShowSuccess(false);
        onClose();
    };

    if (showSuccess) {
         return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 text-center animate-in zoom-in-95 duration-200">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="fas fa-check text-4xl text-green-600"></i>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Blog Submitted!</h2>
                    <p className="text-gray-500 mb-8 text-lg leading-relaxed">
                        Your article has been successfully submitted and is now <strong>pending review</strong>. It will be published once approved by an admin.
                    </p>
                    <button 
                        onClick={handleClose}
                        className="w-full py-4 rounded-2xl bg-gray-900 text-white font-bold text-lg hover:bg-gray-800 hover:scale-[0.98] transition-all"
                    >
                        Got it, thanks!
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <h2 className="text-2xl font-bold text-gray-900">Write New Blog</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>

                <div className="p-6 md:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title & Category */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
                                <input 
                                    type="text" 
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-bold text-lg"
                                    placeholder="Enter title..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                                <select 
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-gray-50"
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Cover Image */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Cover Image</label>
                            <ImageUploader 
                                onImageUploaded={setCoverImage}
                                currentImage={coverImage}
                            />
                        </div>

                        {/* Rich Editor */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Content</label>
                            <RichTextEditor 
                                value={content}
                                onChange={setContent}
                                placeholder="Start writing here..."
                            />
                        </div>

                        {/* Excerpt */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Excerpt <span className="text-gray-400 font-normal text-xs">(Optional short summary)</span>
                            </label>
                            <textarea 
                                value={excerpt}
                                onChange={(e) => setExcerpt(e.target.value)}
                                rows={2}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                            />
                        </div>
                    </form>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 sticky bottom-0 z-10 rounded-b-2xl">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-white hover:shadow-sm transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={`px-8 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
                    >
                        {isSubmitting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
                        Submit Blog
                    </button>
                </div>
            </div>
        </div>
    );
}
