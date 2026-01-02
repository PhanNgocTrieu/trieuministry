"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/context/LanguageContext';
import { useModal } from '@/context/ModalContext';

interface Appeal {
    id: string;
    title: string;
    content: string;
    target: number;
    currentAmount: number;
    name: string;
    createdAt: any;
    bankName?: string;
    bankAccount?: string;
    bankOwner?: string;
    bankQR?: string;
    phone?: string;
}

export default function MinistryAppealDetailPage() {
    const { t } = useLanguage();
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const { showAlert } = useModal();

    const [appeal, setAppeal] = useState<Appeal | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAppeal = async () => {
            try {
                const docRef = doc(db, "appeals", id);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.type !== 'user_request') {
                         router.push(`/appeals/${id}`); // Redirect if it's actually an official appeal
                         return;
                    }
                    setAppeal({ id: docSnap.id, ...data } as Appeal);
                } else {
                    router.push('/donate');
                }
            } catch (error) {
                console.error("Error fetching appeal:", error);
            } finally {
                setLoading(false);
            }
        }; 

        if (id) fetchAppeal();
    }, [id, router]);

    const copyToClipboard = (text: string, message: string) => {
        navigator.clipboard.writeText(text);
        showAlert("Info", message);
    };

    if (loading) {
         return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-yellow-600"></div>
            </div>
        );
    }

    if (!appeal) return null;

    return (
        <main className="bg-gray-50 min-h-screen pb-20">
            <Navbar />
            
            <div className="pt-24 container container-custom max-w-4xl">
                <div className="mb-6">
                    <Link href="/donate" className="text-gray-500 hover:text-yellow-600 font-medium inline-flex items-center gap-2 transition-colors">
                        <i className="fas fa-arrow-left"></i> {t('app.back_to_donate') || 'Back to Donate'}
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                         <article className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
                            <header className="mb-6 border-b border-gray-100 pb-6">
                                <div className="flex items-center gap-2 text-sm text-yellow-600 font-bold uppercase tracking-wide mb-3">
                                    <i className="fas fa-hand-holding-heart"></i>
                                    Ministry Appeal
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-4">{appeal.title}</h1>
                                <div className="flex items-center gap-4 text-gray-500 text-sm">
                                    <span className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                                        <i className="fas fa-user text-gray-400"></i> 
                                        {appeal.name}
                                    </span>
                                    {appeal.createdAt && (
                                        <span className="flex items-center gap-2">
                                            <i className="far fa-calendar text-gray-400"></i>
                                            {new Date(appeal.createdAt.seconds * 1000).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </header>

                            <div className="prose prose-lg max-w-none text-gray-700 whitespace-pre-line">
                                {appeal.content}
                            </div>
                        </article>
                    </div>

                    {/* Sidebar / Funding Info */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Target Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Target Goal</h3>
                            <div className="text-3xl font-bold text-gray-900 mb-2">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(appeal.target)}
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                                <div 
                                    className="bg-yellow-500 h-2 rounded-full" 
                                    style={{ width: `${Math.min(100, (appeal.currentAmount / appeal.target) * 100)}%` }}
                                ></div>
                            </div>
                             <div className="flex justify-between text-sm text-gray-500 font-medium">
                                <span>Raised: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(appeal.currentAmount)}</span>
                                <span>{Math.round((appeal.currentAmount / appeal.target) * 100)}%</span>
                            </div>
                        </div>

                        {/* Bank Info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Receiving Info</h3>
                            
                            {appeal.bankQR && (
                                <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                                    <div className="relative w-40 h-40 mx-auto mb-2">
                                        <Image 
                                            src={appeal.bankQR}
                                            alt="Bank QR"
                                            fill
                                            className="object-contain rounded-lg"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400">Scan to donate</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-400">Bank Name</label>
                                    <div className="font-bold text-gray-800">{appeal.bankName || 'N/A'}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400">Account Number</label>
                                    <div className="flex items-center justify-between">
                                        <div className="font-bold text-gray-800 font-mono text-lg">{appeal.bankAccount || 'N/A'}</div>
                                        {appeal.bankAccount && (
                                            <button 
                                                onClick={() => copyToClipboard(appeal.bankAccount || '', 'Copied account number!')}
                                                className="text-blue-600 hover:text-blue-700"
                                            >
                                                <i className="far fa-copy"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400">Account Holder</label>
                                    <div className="font-bold text-gray-800">{appeal.bankOwner || 'N/A'}</div>
                                </div>
                                {appeal.phone && (
                                     <div>
                                        <label className="text-xs text-gray-400">Contact</label>
                                        <div className="font-bold text-gray-800">{appeal.phone}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
