"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/context/LanguageContext';

interface Appeal {
    id: string;
    title: string;
    content: string;
    coverImage?: string;
    pdfUrl?: string;
    createdAt: any;
    authorName?: string;
}

export default function AppealDetailPage() {
    const { t } = useLanguage();
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
        return new Date(timestamp.seconds * 1000).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
         return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
            </div>
        );
    }

    if (!appeal) return null;

    return (
        <main className="bg-gray-50 min-h-screen pb-20">
            <Navbar />
            
            <div className="pt-24 container container-custom max-w-4xl">
                <div className="mb-6">
                    <Link href="/appeals" className="text-gray-500 hover:text-blue-600 font-medium inline-flex items-center gap-2 transition-colors">
                        <i className="fas fa-arrow-left"></i> {t('back_to_list') || 'Back to Letters'}
                    </Link>
                </div>

                <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {appeal.coverImage && (
                        <div className="w-full h-[300px] md:h-[400px] relative">
                             <Image 
                                src={appeal.coverImage} 
                                alt={appeal.title} 
                                fill
                                className="object-cover"
                            />
                        </div>
                    )}

                    <div className="p-8 md:p-12">
                        <header className="mb-8 border-b border-gray-100 pb-8">
                            <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                                <span className="flex items-center gap-1"><i className="far fa-calendar"></i> {formatDate(appeal.createdAt)}</span>
                                {appeal.authorName && (
                                    <>
                                        <span>•</span>
                                        <span className="flex items-center gap-1"><i className="far fa-user"></i> {appeal.authorName}</span>
                                    </>
                                )}
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                                {appeal.title}
                            </h1>
                        </header>

                        <div 
                            className="prose prose-lg prose-blue max-w-none text-gray-700 mb-8"
                            dangerouslySetInnerHTML={{ __html: appeal.content }}
                        />

                        {appeal.pdfUrl && (
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-2xl">
                                        <i className="fas fa-file-pdf"></i>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">Original PDF Version</h4>
                                        <p className="text-sm text-gray-500">Download the original formatted letter</p>
                                    </div>
                                </div>
                                <a 
                                    href={appeal.pdfUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="px-6 py-2.5 bg-white border border-gray-300 hover:border-red-500 hover:text-red-600 font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 whitespace-nowrap"
                                >
                                    <i className="fas fa-download"></i> Download PDF
                                </a>
                            </div>
                        )}
                    </div>
                </article>
            </div>
        </main>
    );
}
