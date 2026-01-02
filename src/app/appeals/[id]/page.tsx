"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/context/LanguageContext';

interface MinistrySection {
    id: string;
    title: string;
    titleEn?: string;
    description: string;
    descriptionEn?: string;
    images: string[];
}

interface Appeal {
    id: string;
    title: string;
    titleEn?: string;
    content?: string;
    letterContent?: string; // New field
    letterContentEn?: string; // New field
    ministrySections?: MinistrySection[];
    fundraisingImages?: string[];
    fundraisingDescription?: string;
    fundraisingDescriptionEn?: string;
    coverImage?: string;
    pdfUrl?: string;
    pdfUrlEn?: string; // New field
    createdAt: any;
    authorName?: string;
}

export default function AppealDetailPage() {
    const { t, language } = useLanguage();
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [appeal, setAppeal] = useState<Appeal | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAppeal = async () => {
            try {
                const docRef = doc(db, "appeals", id);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    setAppeal({ id: docSnap.id, ...docSnap.data() } as Appeal);
                } else {
                    router.push('/appeals');
                }
            } catch (error) {
                console.error("Error fetching appeal:", error);
            } finally {
                setLoading(false);
            }
        }; 

        if (id) fetchAppeal();
    }, [id, router]);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        return new Date(timestamp.seconds * 1000).toLocaleDateString(language === 'vi' ? 'vi-VN' : undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getContent = (vi: string | undefined, en: string | undefined) => {
        if (language === 'en' && en && en.trim().length > 0) return en;
        return vi || '';
    };

    if (loading) {
         return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
            </div>
        );
    }

    if (!appeal) return null;

    const hasNewStructure = (appeal.ministrySections && appeal.ministrySections.length > 0) || (appeal.fundraisingImages && appeal.fundraisingImages.length > 0) || (appeal.fundraisingDescription && appeal.fundraisingDescription.length > 0);
    const displayTitle = getContent(appeal.title, appeal.titleEn);

    return (
        <main className="bg-gray-50 min-h-screen pb-20">
            <Navbar />
            
            <div className="pt-24 container container-custom max-w-4xl">
                <div className="mb-6">
                    <Link href="/appeals" className="text-gray-500 hover:text-blue-600 font-medium inline-flex items-center gap-2 transition-colors">
                        <i className="fas fa-arrow-left"></i> {t('common.read_more') === 'Xem thêm' ? 'Quay lại danh sách' : 'Back to Letters'}
                    </Link>
                </div>

                <div className="space-y-8">
                    {/* 1. Header Card */}
                    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {appeal.coverImage && (
                            <div className="w-full h-[300px] md:h-[400px] relative">
                                 <Image 
                                    src={appeal.coverImage} 
                                    alt={displayTitle} 
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}

                        <div className="p-8 md:p-12">
                            <header className="mb-4">
                                <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                                    <span className="flex items-center gap-1"><i className="far fa-calendar"></i> {formatDate(appeal.createdAt)}</span>
                                    {appeal.authorName && (
                                        <>
                                            <span>•</span>
                                            <span className="flex items-center gap-1"><i className="far fa-user"></i> {appeal.authorName}</span>
                                        </>
                                    )}
                                </div>
                                <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
                                    {displayTitle}
                                </h1>
                            </header>
                            
                            {/* NEW: Ministry Letter Content */}
                            {getContent(appeal.letterContent, appeal.letterContentEn) && (
                                <div 
                                    className="prose prose-xl md:prose-2xl max-w-none text-gray-800 mt-8 [&_*]:!text-[16pt] [&_*]:!leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: getContent(appeal.letterContent, appeal.letterContentEn) || '' }}
                                />
                            )}

                            {/* Legacy Content (fallback if new letter content is empty) */}
                            {!getContent(appeal.letterContent, appeal.letterContentEn) && (
                                <div 
                                    className="prose prose-xl md:prose-2xl max-w-none text-gray-800 mt-8 [&_*]:!text-[16pt] [&_*]:!leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: appeal.content || '' }}
                                />
                            )}
                        </div>
                    </article>

                    {/* 2. Ministry Sections (Cards) - Images REMOVED */}
                    {hasNewStructure && appeal.ministrySections?.map((section) => {
                        const sectionTitle = getContent(section.title, section.titleEn);
                        const sectionDesc = getContent(section.description, section.descriptionEn);
                        
                        return (
                            <section key={section.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 overflow-hidden">
                                {sectionTitle && (
                                    <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-8 border-l-8 border-blue-600 pl-6 py-1">{sectionTitle}</h2>
                                )}
                                
                                <div 
                                    className="prose prose-xl md:prose-2xl max-w-none text-gray-800 [&_*]:!text-[16pt] [&_*]:!leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: sectionDesc }}
                                />
                            </section>
                        );
                    })}

                    {/* 3. Fundraising Section (Card) - Images REMOVED */}
                    {hasNewStructure && ((appeal.fundraisingImages && appeal.fundraisingImages.length > 0) || appeal.fundraisingDescription) && (
                        <section className="bg-white rounded-2xl shadow-sm border border-green-200 p-8 md:p-12 overflow-hidden ring-4 ring-green-50/50">
                            <h2 className="text-3xl md:text-5xl font-bold text-green-800 mb-8 flex items-center gap-3">
                                <span className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                    <i className="fas fa-hand-holding-heart text-xl"></i>
                                </span>
                                Fundraising & Reports
                            </h2>
                            
                            {getContent(appeal.fundraisingDescription, appeal.fundraisingDescriptionEn) && (
                                <div 
                                    className="prose prose-xl md:prose-2xl prose-green max-w-none text-gray-800 [&_*]:!text-[16pt] [&_*]:!leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: getContent(appeal.fundraisingDescription, appeal.fundraisingDescriptionEn) }}
                                />
                            )}

                        </section>
                    )}

                    {/* 4. Footer & Signature (Card) */}
                    <footer className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 text-center md:text-left">
                        <div className="max-w-3xl mx-auto space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide text-gray-400">{t('appeals.closing_thoughts')}</h3>
                                <p className="text-xl text-gray-800 italic leading-relaxed">
                                    "{t('appeals.closing_content')}"
                                </p>
                            </div>

                            <div className="w-20 h-1 bg-gray-100 mx-auto md:mx-0"></div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide text-gray-400">{t('appeals.confidentiality_note')}</h3>
                                <p className="text-lg text-gray-600">
                                    {t('appeals.confidentiality_content')}
                                </p>
                            </div>

                            <div className="pt-8 border-t border-gray-100 mt-8">
                                <p className="text-lg text-gray-800 mb-6 font-medium">
                                    {t('appeals.blessing')}
                                </p>
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div>
                                        <p className="text-gray-500 mb-1">{t('appeals.gratitude')}</p>
                                        <p className="text-2xl font-bold font-serif text-blue-900">{t('appeals.signature')}</p>
                                    </div>
                                    {/* Optional Signature Image or Stamp could go here */}
                                </div>
                            </div>
                        </div>
                    </footer>

                     {/* PDF Download (Separate Card) */}
                     {/* PDF Download (Separate Card) */}
                    {(appeal.pdfUrl || appeal.pdfUrlEn) && (
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8">
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
                                <div className="w-16 h-16 bg-white text-red-500 rounded-2xl shadow-sm flex items-center justify-center text-3xl flex-shrink-0">
                                    <i className="fas fa-file-pdf"></i>
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-gray-900">{t('appeals.download_title') || 'Download Appeal Letter'}</h4>
                                    <p className="text-gray-600">{t('appeals.download_desc') || 'Get the full PDF version of this appeal layout to read offline or print.'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {appeal.pdfUrl && (
                                    <a 
                                        href={appeal.pdfUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex-1 px-6 py-4 bg-red-50 border border-red-100 text-red-700 hover:bg-red-600 hover:text-white hover:border-red-600 font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-3 group"
                                    >
                                        <span className="text-2xl">🇻🇳</span>
                                        <span className="flex items-center gap-2">
                                            {t('appeals.download_vi') || 'Vietnamese PDF'}
                                            <i className="fas fa-download opacity-50 group-hover:opacity-100 transition-opacity"></i>
                                        </span>
                                    </a>
                                )}
                                {appeal.pdfUrlEn && (
                                    <a 
                                        href={appeal.pdfUrlEn} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex-1 px-6 py-4 bg-blue-50 border border-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-3 group"
                                    >
                                        <span className="text-2xl">🇺🇸</span>
                                        <span className="flex items-center gap-2">
                                            {t('appeals.download_en') || 'English PDF'}
                                            <i className="fas fa-download opacity-50 group-hover:opacity-100 transition-opacity"></i>
                                        </span>
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
