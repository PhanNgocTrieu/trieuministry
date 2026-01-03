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
    currency?: string;
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
                        <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100/50 p-6 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>
                            
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 relative z-10">Fundraising Progress</h3>
                            
                            <div className="relative z-10">
                                <span className="text-sm text-gray-500 font-medium block mb-1">Raised so far</span>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-4xl font-extrabold text-gray-900 tracking-tight">
                                        {new Intl.NumberFormat(appeal.currency === 'USD' ? 'en-US' : 'vi-VN', { style: 'currency', currency: appeal.currency || 'VND' }).format(Number(appeal.currentAmount || 0))}
                                    </span>
                                </div>

                                <div className="w-full bg-gray-100 rounded-full h-3 mb-4 overflow-hidden">
                                    <div 
                                        className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_2px_10px_rgba(234,179,8,0.4)] relative"
                                        style={{ width: `${Math.min(100, (Number(appeal.currentAmount || 0) / Number(appeal.target || 1)) * 100)}%` }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-end border-t border-gray-100 pt-4 mt-2">
                                    <div>
                                        <span className="text-xs text-gray-400 font-semibold uppercase block mb-0.5">Target Goal</span>
                                        <span className="font-bold text-gray-700">
                                            {new Intl.NumberFormat(appeal.currency === 'USD' ? 'en-US' : 'vi-VN', { style: 'currency', currency: appeal.currency || 'VND' }).format(Number(appeal.target || 0))}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-black text-yellow-600">
                                            {Math.round((Number(appeal.currentAmount || 0) / Number(appeal.target || 1)) * 100)}
                                            <span className="text-sm align-top ml-0.5">%</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bank Info */}
                        <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100/50 p-6 relative overflow-hidden">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Receiving Account</h3>
                            
                            {appeal.bankQR && (
                                <div className="mb-8 flex justify-center">
                                    <div className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                        <div className="relative w-48 h-48">
                                            <Image 
                                                src={appeal.bankQR}
                                                alt="Bank QR"
                                                fill
                                                className="object-contain rounded-lg"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-5">
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors group">
                                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Bank Name</label>
                                    <div className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{appeal.bankName || 'N/A'}</div>
                                </div>
                                
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors group">
                                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Account Number</label>
                                    <div className="flex items-center justify-between">
                                        <div className="font-bold text-gray-900 font-mono text-lg tracking-wide group-hover:text-blue-700 transition-colors">{appeal.bankAccount || 'N/A'}</div>
                                        {appeal.bankAccount && (
                                            <button 
                                                onClick={() => copyToClipboard(appeal.bankAccount || '', 'Copied account number!')}
                                                className="text-gray-400 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                                                title="Copy Account Number"
                                            >
                                                <i className="far fa-copy text-lg"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors group">
                                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Account Holder</label>
                                    <div className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{appeal.bankOwner || 'N/A'}</div>
                                </div>

                                {appeal.phone && (
                                     <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors group">
                                        <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Contact</label>
                                        <div className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{appeal.phone}</div>
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
