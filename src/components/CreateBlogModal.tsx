"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import RichTextEditor from '@/components/RichTextEditor';
import ImageUploader from '@/components/ImageUploader';
import { useLanguage } from '@/context/LanguageContext';
import { useModal } from '@/context/ModalContext';
import { logActivity } from '@/lib/activity-logger';

const categories = ['Bible Study', 'Sharing', 'Music', 'Leadership', 'Testimony'];

interface CreateBlogModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateBlogModal({ isOpen, onClose, onSuccess }: CreateBlogModalProps) {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { showAlert } = useModal();
    
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
            showAlert("Error", t('blogs.create.alert_required'));
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

            await logActivity(
                'blog',
                'create',
                `New blog submitted: ${title}`,
                { title, category, author: user?.displayName }
            );

            setShowSuccess(true);
            onSuccess(); // Triggers refresh in parent
            
            // Reset form
            setTitle('');
            setContent('');
            setCoverImage('');
        } catch (error) {
            console.error("Error creating blog:", error);
            showAlert("Error", t('blogs.create.alert_error'));
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-slate-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-lg p-8 text-center animate-in zoom-in-95 duration-200">
                    <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                        <i className="fas fa-check text-4xl text-green-400"></i>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">{t('blogs.create.success_title')}</h2>
                    <p className="text-slate-400 mb-8 text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: t('blogs.create.success_message') }}></p>
                    <button 
                        onClick={handleClose}
                        className="w-full py-4 rounded-2xl bg-white text-slate-900 font-bold text-lg hover:bg-slate-200 hover:scale-[0.98] transition-all"
                    >
                        {t('blogs.create.btn_got_it')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in duration-200 border border-white/10">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-900 sticky top-0 z-10">
                    <h2 className="text-2xl font-bold text-white">{t('blogs.create.title')}</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>

                <div className="p-6 md:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title & Category */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-300 mb-2">{t('blogs.create.label_title')}</label>
                                <input 
                                    type="text" 
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-lg placeholder-slate-500"
                                    placeholder={t('blogs.create.placeholder_title')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">{t('blogs.create.label_category')}</label>
                                <select 
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all"
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Cover Image */}
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">{t('blogs.create.label_cover')}</label>
                            <ImageUploader 
                                onImageUploaded={setCoverImage}
                                currentImage={coverImage}
                            />
                        </div>

                        {/* Rich Editor */}
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">{t('blogs.create.label_content')}</label>
                            <div className="text-black"> 
                                {/* RichTextEditor usually has its own styling, wrapping in text-black if it relies on white bg, 
                                    but ideally we should update RichTextEditor too. keeping text-black for safety for now 
                                    or assuming it handles its own theme. Let's try to check RichTextEditor later. 
                                    Actually, usually TinyMCE/Quill needs light mode or specific config. 
                                    Let's wrap in a white container or check if it can be dark. 
                                    For now, I'll keep it as is but be aware it might need fixes. */}
                                <RichTextEditor 
                                    value={content}
                                    onChange={setContent}
                                    placeholder={t('blogs.create.placeholder_content')}
                                />
                            </div>
                        </div>

                        {/* Excerpt */}
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                {t('blogs.create.label_excerpt')} <span className="text-slate-500 font-normal text-xs">{t('blogs.create.placeholder_excerpt')}</span>
                            </label>
                            <textarea 
                                value={excerpt}
                                onChange={(e) => setExcerpt(e.target.value)}
                                rows={2}
                                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all text-sm placeholder-slate-500"
                            />
                        </div>
                    </form>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/5 bg-slate-900 flex items-center justify-end gap-3 sticky bottom-0 z-10 rounded-b-2xl">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl font-bold text-slate-400 hover:bg-white/10 hover:text-white transition-all"
                    >
                        {t('blogs.create.btn_cancel')}
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={`px-8 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
                    >
                        {isSubmitting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
                        {t('blogs.create.btn_submit')}
                    </button>
                </div>
            </div>
        </div>
    );
}
