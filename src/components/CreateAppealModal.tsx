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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10 backdrop-blur-md rounded-t-2xl">
                    <h5 className="text-xl font-bold text-blue-600 flex items-center gap-2">
                        <i className="fas fa-paper-plane"></i>
                        {t('donate.form.title')}
                    </h5>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                        <i className="fas fa-times text-lg"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-4">
                    <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-2">
                        <i className="fas fa-info-circle"></i>
                        {isAdmin ? "As an Admin, this appeal will be published immediately." : t('donate.form.warning')}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">{t('donate.form.name')}</label>
                            <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">{t('donate.form.phone')}</label>
                            <input type="text" name="phone" required value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('donate.form.appeal_title')}</label>
                        <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">{t('donate.form.target')}</label>
                            <input type="number" name="target" required value={formData.target} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">{t('donate.form.current_amount')}</label>
                            <input type="number" name="currentAmount" value={formData.currentAmount} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('donate.form.content')}</label>
                        <textarea name="content" required rows={4} value={formData.content} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <h6 className="font-bold text-gray-700 mb-3">{t('donate.form.bank_info')}</h6>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <input type="text" name="bankName" placeholder={t('donate.form.bank_name')} value={formData.bankName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                            <input type="text" name="bankAccount" placeholder={t('donate.form.bank_account')} value={formData.bankAccount} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                            <input type="text" name="bankOwner" placeholder={t('donate.form.bank_owner')} value={formData.bankOwner} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        
                        {/* QR Code Upload */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">QR Code Image</label>
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50">
                                    <ImageUploader 
                                        onImageUploaded={(url) => setFormData({...formData, bankQR: url})} 
                                        folder="appeals_qr"
                                        currentImage={formData.bankQR}
                                    />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                        >
                            {t('donate.form.cancel')}
                        </button>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-sm disabled:bg-gray-400"
                        >
                            {loading ? 'Sending...' : t('donate.form.send')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
