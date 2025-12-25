"use client";

import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

interface Appeal {
    id: string;
    title: string;
    content: string;
    coverImage?: string;
    createdAt: any;
    status: string;
    type?: string;
    authorName?: string;
    pdfUrl?: string; // Adding this here as well to match previous implementation
}

export default function AppealsPage() {
    const { t } = useLanguage();
    const { user, isAdmin } = useAuth(); // Correctly get isAdmin from context
    const [appeals, setAppeals] = useState<Appeal[]>([]);
    const [loading, setLoading] = useState(true);

    // const isAdmin = userData?.role === 'admin'; // Removed incorrect line

    useEffect(() => {
        // Fetch only Published and Official appeals
        const q = query(
            collection(db, "appeals"), 
            where("status", "==", "published"),
            where("type", "==", "official"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Appeal));
            setAppeals(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching appeals:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        return new Date(timestamp.seconds * 1000).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
            </div>
        );
    }

    const latestAppeal = appeals.length > 0 ? appeals[0] : null;
    const previousAppeals = appeals.length > 1 ? appeals.slice(1) : [];

    return (
        <main className="min-h-screen bg-gray-50/50 pb-20 font-sans selection:bg-blue-100">
            <Navbar />
            
            <div className="container container-custom pt-32 pb-12">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 px-2">
                    <div className="max-w-3xl">
                        <span className="text-blue-600 font-bold tracking-wider uppercase text-xs mb-2 block">
                            {t('nav.ministry') || 'Ministry'}
                        </span>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight leading-tight">
                            {t('appeals.page_title') || 'Appeal Letters'}
                        </h1>
                        <p className="text-xl text-gray-500 font-light leading-relaxed">
                            {t('appeals.page_subtitle') || 'Updates, stories, and urgent calls for support from our ministry.'}
                        </p>
                    </div>

                    {isAdmin && (
                        <div className="flex-shrink-0 mb-2">
                             <Link 
                                href="/admin/appeals/create" 
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white hover:bg-black rounded-lg font-semibold transition-all shadow-sm hover:shadow-md active:transform active:scale-95"
                            >
                                <i className="fas fa-plus"></i>
                                <span>New Appeal</span>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="space-y-12">
                    {latestAppeal ? (
                        <section className="max-w-4xl mx-auto">
                            <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-8 lg:p-10 border border-blue-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                                <div className="absolute top-0 right-0 p-6 opacity-5">
                                    <i className="fas fa-feather-alt text-9xl text-blue-900 transform rotate-45"></i>
                                </div>
                                
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4 text-sm">
                                        <span className="px-3 py-1 bg-blue-600 text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-sm">
                                            Latest Update
                                        </span>
                                        <span className="text-gray-500 font-medium flex items-center gap-2">
                                            <i className="far fa-calendar-alt"></i>
                                            {formatDate(latestAppeal.createdAt)}
                                        </span>
                                    </div>

                                    <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
                                        <Link href={`/appeals/${latestAppeal.id}`} className="hover:text-blue-600 transition-colors">
                                            {latestAppeal.title}
                                        </Link>
                                    </h2>

                                    <div 
                                        className="prose prose-lg text-gray-600 mb-8 max-w-none line-clamp-3 leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: latestAppeal.content }}
                                    />

                                    <div>
                                        <Link 
                                            href={`/appeals/${latestAppeal.id}`} 
                                            className="inline-flex items-center gap-2 text-blue-700 font-bold hover:text-blue-800 transition-colors group/btn"
                                        >
                                            {t('common.read_more') || 'Read Full Letter'}
                                            <i className="fas fa-arrow-right transform group-btn-hover:translate-x-1 transition-transform"></i>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </section>
                    ) : (
                        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200 max-w-4xl mx-auto">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                <i className="fas fa-feather-alt text-2xl"></i>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">No updates yet</h3>
                            <p className="text-gray-500 max-w-sm mx-auto text-sm">We haven't posted any appeal letters recently.</p>
                        </div>
                    )}

                    {/* Previous Appeals - Compact List Layout */}
                    {previousAppeals.length > 0 && (
                        <section className="max-w-4xl mx-auto">
                            <div className="flex items-center gap-4 mb-8">
                                 <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                                    {t('appeals.previous') || 'Previous Letters'}
                                </h3>
                                <div className="h-px bg-gray-200 flex-1"></div>
                            </div>
                            
                            <div className="flex flex-col gap-4">
                                {previousAppeals.map(appeal => (
                                    <article key={appeal.id} className="group bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-200">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 text-xs text-gray-400 mb-2 font-medium">
                                                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                                        {formatDate(appeal.createdAt)}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{appeal.authorName || 'Admin'}</span>
                                                </div>
                                                
                                                <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                                    <Link href={`/appeals/${appeal.id}`}>
                                                        {appeal.title}
                                                    </Link>
                                                </h4>
                                                
                                                <div 
                                                    className="text-gray-500 text-sm line-clamp-2 leading-relaxed max-w-2xl"
                                                    dangerouslySetInnerHTML={{ __html: appeal.content.replace(/<[^>]+>/g, '') }}
                                                />
                                            </div>
                                            
                                            <div className="flex-shrink-0 pt-1">
                                                <Link 
                                                    href={`/appeals/${appeal.id}`}
                                                    className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:rotate-[-45deg]"
                                                >
                                                    <i className="fas fa-arrow-right text-sm"></i>
                                                </Link>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </main>
    );
}
