"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import ArticleContent from '@/components/ArticleContent';

interface Post {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    type: 'post' | 'testimony';
    status: 'draft' | 'published';
    coverImage?: string;
    author: string;
    authorId?: string;
    createdAt: any;
    updatedAt?: any;
}

export default function PostDetailPage() {
    const params = useParams();
    const slug = params.slug as string;
    const { t, language } = useLanguage();
    const { isAdmin } = useAuth();
    
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFoundState, setNotFoundState] = useState(false);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                // Query by slug
                const q = query(
                    collection(db, "posts"),
                    where("slug", "==", slug)
                );
                const snapshot = await getDocs(q);
                
                if (snapshot.empty) {
                    setNotFoundState(true);
                } else {
                    const doc = snapshot.docs[0];
                    setPost({ id: doc.id, ...doc.data() } as Post);
                }
            } catch (error) {
                console.error("Error fetching post:", error);
                setNotFoundState(true);
            } finally {
                setLoading(false);
            }
        };

        if (slug) fetchPost();
    }, [slug]);

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="text-slate-500">Loading...</div>
            </main>
        );
    }

    if (notFoundState || !post) {
        return notFound();
    }

    const formattedDate = post.createdAt?.seconds 
        ? new Date(post.createdAt.seconds * 1000).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : '';

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            {/* Hero Section with Cover Image */}
            {post.coverImage ? (
                <section className="relative h-[50vh] min-h-[400px] max-h-[600px] overflow-hidden">
                    {/* Background Image */}
                    <div className="absolute inset-0">
                        <img 
                            src={post.coverImage} 
                            alt={post.title}
                            className="w-full h-full object-cover"
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-900/30"></div>
                    </div>
                    
                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                        <div className="container container-custom">
                            {/* Back Link */}
                            <Link href="/resources" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors">
                                <i className="fas fa-arrow-left"></i>
                                <span>{language === 'vi' ? 'Quay lại' : 'Back to Resources'}</span>
                            </Link>
                            
                            {/* Type Badge */}
                            <div className="mb-4">
                                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                                    post.type === 'testimony'
                                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                }`}>
                                    <i className={`fas ${post.type === 'testimony' ? 'fa-comment-medical' : 'fa-newspaper'}`}></i>
                                    {post.type === 'testimony' ? 'Testimony' : 'Post'}
                                </span>
                            </div>
                            
                            {/* Title */}
                            <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight max-w-4xl">
                                {post.title}
                            </h1>
                            
                            {/* Meta */}
                            <div className="flex flex-wrap items-center gap-6 mt-6 text-white/70">
                                <div className="flex items-center gap-2">
                                    <i className="fas fa-user-circle"></i>
                                    <span>{post.author}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <i className="fas fa-calendar-alt"></i>
                                    <span>{formattedDate}</span>
                                </div>
                                {isAdmin && (
                                    <Link 
                                        href={`/admin/posts/${post.id}/edit`}
                                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
                                    >
                                        <i className="fas fa-edit"></i>
                                        <span>Edit</span>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            ) : (
                /* Simple Header without Cover Image */
                <section className="bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-950 pt-24 pb-12">
                    <div className="container container-custom">
                        {/* Back Link */}
                        <Link href="/resources" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors">
                            <i className="fas fa-arrow-left"></i>
                            <span>{language === 'vi' ? 'Quay lại' : 'Back to Resources'}</span>
                        </Link>
                        
                        {/* Type Badge */}
                        <div className="mb-4">
                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                                post.type === 'testimony'
                                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                                <i className={`fas ${post.type === 'testimony' ? 'fa-comment-medical' : 'fa-newspaper'}`}></i>
                                {post.type === 'testimony' ? 'Testimony' : 'Post'}
                            </span>
                        </div>
                        
                        {/* Title */}
                        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight max-w-4xl">
                            {post.title}
                        </h1>
                        
                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-6 mt-6 text-slate-500">
                            <div className="flex items-center gap-2">
                                <i className="fas fa-user-circle"></i>
                                <span>{post.author}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <i className="fas fa-calendar-alt"></i>
                                <span>{formattedDate}</span>
                            </div>
                            {isAdmin && (
                                <Link 
                                    href={`/admin/posts/${post.id}/edit`}
                                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    <i className="fas fa-edit"></i>
                                    <span>Edit</span>
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
                        {/* Excerpt */}
                        {post.excerpt && (
                            <div className="mb-8 pb-8 border-b border-slate-200 dark:border-slate-800">
                                <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                    {post.excerpt}
                                </p>
                            </div>
                        )}
                        
                        {/* Main Content */}
                        <ArticleContent content={post.content} />
                        
                        {/* Author Card */}
                        <div className="mt-16 p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                                    {post.author?.charAt(0)?.toUpperCase() || 'A'}
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {language === 'vi' ? 'Viết bởi' : 'Written by'}
                                    </p>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                                        {post.author}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Back to Resources */}
                        <div className="mt-12 text-center">
                            <Link 
                                href="/resources"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                <i className="fas fa-arrow-left"></i>
                                <span>{language === 'vi' ? 'Xem thêm bài viết' : 'More Posts'}</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
