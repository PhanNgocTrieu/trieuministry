"use client";

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import ImageUploader from '@/components/ImageUploader';
import { useAuth } from '@/context/AuthContext';
import { useModal } from '@/context/ModalContext';

interface CreateAppealModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateAppealModal({ isOpen, onClose }: CreateAppealModalProps) {
    const { t } = useLanguage();
    const { user, isAdmin } = useAuth();
    const { showAlert } = useModal();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: user?.displayName || '',
        phone: '',
        target: '',
        title: '',
        content: '',
        bankName: '',
        bankAccount: '',
        bankOwner: '',
        bankQR: '',
        currency: 'VND',
        currentAmount: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addDoc(collection(db, "appeals"), {
                ...formData,
                status: isAdmin ? "published" : "pending", // Auto-publish for admins
                type: "user_request",
                currentAmount: Number(formData.currentAmount) || 0,
                target: Number(formData.target),
                authorId: user?.uid || null,
                authorName: user?.displayName || user?.email || formData.name,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            
            if (isAdmin) {
                showAlert("Success", "Appeal request created and published successfully!");
            } else {
                showAlert("Success", t('donate.form.success_message') || "Your appeal request has been submitted successfully! We will review it shortly.");
            }
            
            onClose();
            setFormData({
                name: user?.displayName || '',
                phone: '',
                target: '',
                title: '',
                content: '',
                bankName: '',
                bankAccount: '',
                bankOwner: '',
                bankQR: '',
                currency: 'VND',
                currentAmount: ''
            });
        } catch (error) {
            console.error("Error submitting appeal:", error);
            showAlert("Error", t('donate.js_form.error_generic') || "Failed to submit appeal. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 sticky top-0 z-10 backdrop-blur-md">
                    <h5 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-600/20 flex items-center justify-center text-blue-700 dark:text-blue-500">
                             <i className="fas fa-paper-plane"></i>
                        </div>
                        {t('donate.form.title')}
                    </h5>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <i className="fas fa-times text-lg"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-600/20 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                        <i className="fas fa-info-circle"></i>
                        {isAdmin ? "As an Admin, this appeal will be published immediately." : t('donate.form.warning')}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2 pl-1">{t('donate.form.name')}</label>
                            <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all dark:text-white font-medium" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2 pl-1">{t('donate.form.phone')}</label>
                            <input type="text" name="phone" required value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all dark:text-white font-medium" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2 pl-1">{t('donate.form.appeal_title')}</label>
                        <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all dark:text-white font-medium" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2 pl-1">{t('donate.form.target')}</label>
                            <input type="number" name="target" required value={formData.target} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all dark:text-white font-medium" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2 pl-1">{t('donate.form.current_amount')}</label>
                            <input type="number" name="currentAmount" value={formData.currentAmount} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all dark:text-white font-medium" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2 pl-1">{t('donate.form.content')}</label>
                        <textarea name="content" required rows={4} value={formData.content} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none resize-none dark:text-white leading-relaxed"></textarea>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-white/5">
                        <h6 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                             <i className="fas fa-university text-slate-400"></i> {t('donate.form.bank_info')}
                        </h6>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <input type="text" name="bankName" placeholder={t('donate.form.bank_name')} value={formData.bankName} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all dark:text-white text-sm" />
                            <input type="text" name="bankAccount" placeholder={t('donate.form.bank_account')} value={formData.bankAccount} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all dark:text-white text-sm" />
                            <input type="text" name="bankOwner" placeholder={t('donate.form.bank_owner')} value={formData.bankOwner} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all dark:text-white text-sm" />
                        </div>
                        
                        {/* QR Code Upload */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2 pl-1">QR Code Image</label>
                            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/50">
                                    <ImageUploader 
                                        onImageUploaded={(url) => setFormData({...formData, bankQR: url})} 
                                        folder="appeals_qr"
                                        currentImage={formData.bankQR}
                                    />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 dark:border-white/5">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            {t('donate.form.cancel')}
                        </button>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 bg-blue-700 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none transition-all"
                        >
                            {loading ? 'Sending...' : t('donate.form.send')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
