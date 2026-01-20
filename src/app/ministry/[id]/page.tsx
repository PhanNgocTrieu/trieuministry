"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import ArticleContent from '@/components/ArticleContent';

interface Ministry {
    id: string;
    title_en?: string;
    title_vi?: string;
    description_en?: string;
    description_vi?: string;
    prayerNeeds_en?: string;
    prayerNeeds_vi?: string;
    title: string;
    description: string;
    prayerNeeds?: string;
    category?: string;
    status: 'active' | 'completed' | 'on-hold';
    coverImage?: string;
    createdAt: any;
    updatedAt?: any;
}

export default function MinistryDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const { language, t } = useLanguage();
    const { isAdmin } = useAuth();

    const [ministry, setMinistry] = useState<Ministry | null>(null);
    const [loading, setLoading] = useState(true);

    // Helper to get localized text
    const getLocalized = (obj: any, field: string) => {
        const langKey = `${field}_${language}`;
        return obj[langKey] || obj[`${field}_en`] || obj[`${field}_vi`] || obj[field] || '';
    };

    useEffect(() => {
        const fetchMinistry = async () => {
            try {
                const docRef = doc(db, "ministries", id);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    setMinistry({ id: docSnap.id, ...docSnap.data() } as Ministry);
                } else {
                    router.push('/ministry');
                }
            } catch (error) {
                console.error("Error fetching ministry:", error);
                router.push('/ministry');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchMinistry();
    }, [id, router]);

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="loading-spinner"></div>
            </main>
        );
    }

    if (!ministry) {
        return null;
    }

    const title = getLocalized(ministry, 'title');
    const description = getLocalized(ministry, 'description');
    const prayerNeeds = getLocalized(ministry, 'prayerNeeds');
    const formattedDate = ministry.createdAt?.seconds 
        ? new Date(ministry.createdAt.seconds * 1000).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : '';

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            {/* Hero Section with Cover Image */}
            {ministry.coverImage ? (
                <section className="relative h-[50vh] min-h-[400px] max-h-[600px] overflow-hidden">
                    <div className="absolute inset-0">
                        <img 
                            src={ministry.coverImage} 
                            alt={title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
                    </div>
                    
                    {/* Content overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                        <div className="container container-custom">
                            <Link 
                                href="/ministry"
                                className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
                            >
                                <i className="fas fa-arrow-left"></i>
                                <span>{language === 'vi' ? 'Quay lại' : 'Back to Ministry'}</span>
                            </Link>
                            
                            <div className="flex items-center gap-3 mb-4">
                                {ministry.category && (
                                    <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium border border-purple-500/30">
                                        {ministry.category}
                                    </span>
                                )}
                                {ministry.status !== 'active' && (
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                                        ministry.status === 'completed' 
                                            ? 'bg-slate-800/80 text-slate-400 border-slate-700' 
                                            : 'bg-amber-900/30 text-amber-400 border-amber-900/50'
                                    }`}>
                                        {ministry.status}
                                    </span>
                                )}
                            </div>
                            
                            <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight max-w-4xl">
                                {title}
                            </h1>
                            
                            <div className="flex items-center gap-4 mt-4 text-slate-300 text-sm">
                                {formattedDate && (
                                    <span className="flex items-center gap-2">
                                        <i className="fas fa-calendar-alt opacity-50"></i>
                                        {formattedDate}
                                    </span>
                                )}
                                {isAdmin && (
                                    <Link 
                                        href={`/admin/ministries/${ministry.id}/edit`}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                                    >
                                        <i className="fas fa-edit"></i>
                                        <span>{language === 'vi' ? 'Chỉnh sửa' : 'Edit'}</span>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            ) : (
                /* Simple Header without Cover Image */
                <section className="pt-24 pb-12 bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-950">
                    <div className="container container-custom">
                        <Link 
                            href="/ministry"
                            className="inline-flex items-center gap-2 text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 mb-6 transition-colors"
                        >
                            <i className="fas fa-arrow-left"></i>
                            <span>{language === 'vi' ? 'Quay lại' : 'Back to Ministry'}</span>
                        </Link>
                        
                        <div className="flex items-center gap-3 mb-4">
                            {ministry.category && (
                                <span className="px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 rounded-full text-sm font-medium">
                                    {ministry.category}
                                </span>
                            )}
                            {ministry.status !== 'active' && (
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    ministry.status === 'completed' 
                                        ? 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400' 
                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                }`}>
                                    {ministry.status}
                                </span>
                            )}
                        </div>
                        
                        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight max-w-4xl">
                            {title}
                        </h1>
                        
                        <div className="flex items-center gap-4 mt-4 text-slate-500 dark:text-slate-400 text-sm">
                            {formattedDate && (
                                <span className="flex items-center gap-2">
                                    <i className="fas fa-calendar-alt opacity-50"></i>
                                    {formattedDate}
                                </span>
                            )}
                            {isAdmin && (
                                <Link 
                                    href={`/admin/ministries/${ministry.id}/edit`}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-500/20 dark:hover:bg-purple-500/30 rounded-lg text-purple-700 dark:text-purple-300 transition-colors"
                                >
                                    <i className="fas fa-edit"></i>
                                    <span>{language === 'vi' ? 'Chỉnh sửa' : 'Edit'}</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Article Content */}
            <section className="py-12 md:py-16">
                <div className="container container-custom">
                    <div className="max-w-3xl mx-auto">
                        {/* Main Content */}
                        <ArticleContent content={description} />
                        
                        {/* Prayer Needs Section */}
                        {prayerNeeds && (
                            <div className="mt-12 p-6 md:p-8 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-2xl border border-orange-200/50 dark:border-orange-500/20">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0 border border-orange-500/20">
                                        <i className="fas fa-pray text-xl"></i>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                                            {language === 'vi' ? 'Nhu Cầu Cầu Nguyện' : 'Prayer Needs'}
                                        </h3>
                                        <div className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                                            {prayerNeeds}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Footer Navigation */}
                        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
                            <Link 
                                href="/ministry"
                                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium transition-colors"
                            >
                                <i className="fas fa-arrow-left"></i>
                                <span>{language === 'vi' ? 'Xem tất cả Mục vụ' : 'View all Ministries'}</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
