"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { ResourceItem, mockDocuments, mockSongs, mockPosts, mockTestimonies } from '@/data/mockResources';
import { useLanguage } from '@/context/LanguageContext'; // Added import



// --- Components ---

    const Sidebar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
    const { t } = useLanguage(); 
    const menuItems = [
        { id: 'all', label: t('resources.tabs.all'), icon: 'fas fa-th-large' },
        { id: 'posts', label: t('resources.tabs.posts') || 'Posts', icon: 'fas fa-newspaper' },
        { id: 'testimonies', label: t('resources.tabs.testimonies') || 'Testimonies', icon: 'fas fa-comment-medical' },
        { id: 'documents', label: t('resources.tabs.documents'), icon: 'fas fa-file-pdf' },
        { id: 'songs', label: t('resources.tabs.songs'), icon: 'fas fa-music' },
    ];

    return (
        <nav className="space-y-4">
            {menuItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl font-bold transition-all duration-300 text-left shadow-lg ${
                        activeTab === item.id
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-purple-900/30 scale-105'
                            : 'bg-white/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:shadow-xl border border-slate-200 dark:border-white/5'
                    }`}
                >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        activeTab === item.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                    }`}>
                        <i className={`${item.icon} text-lg`}></i>
                    </div>
                    <span className="text-base tracking-wide">{item.label}</span>
                </button>
            ))}
        </nav>
    );
};



const ResourceCard = ({ item }: { item: ResourceItem }) => {
    const { t } = useLanguage();
    // Determine Link based on type
    const href = item.type === 'blog' ? `/blogs/${item.slug || item.id}` : `/resources/${item.slug}`;
    const icon = item.type === 'blog' ? 'fa-pen' : item.type === 'song' ? 'fa-music' : 'fa-file-pdf';
    const isBlog = item.type === 'blog';
    
    return (
        <Link href={href} className="group bg-white dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-purple-900/20 hover:-translate-y-1 transition-all duration-300 border border-slate-100 dark:border-white/5 flex flex-col h-full hover:border-purple-500/30">
            {/* Show cover image only if NOT a blog */}
            {!isBlog && (
                <div className="relative h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    {item.coverImage && !item.coverImage.includes('placehold') ? (
                        <Image 
                            src={item.coverImage} 
                            alt={item.title} 
                            fill 
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-400 dark:text-slate-600 text-4xl group-hover:text-purple-500 transition-colors">
                            <i className={`fas ${icon}`}></i>
                        </div>
                    )}
                    <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-md text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm flex items-center gap-1 border border-slate-200 dark:border-white/10">
                        <i className={`fas ${icon} text-[10px]`}></i> {item.category}
                    </div>
                </div>
            )}
            
            <div className="p-5 flex flex-col flex-grow">
                {/* For blogs, we might want a small category badge since image is gone */}
                {isBlog && (
                     <div className="mb-2">
                        <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-blue-500/20">
                            <i className="fas fa-pen-nib text-[10px]"></i> {t('resources.tabs.blogs')}
                        </span>
                     </div>
                )}

                <h3 className={`text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors ${isBlog ? 'text-xl' : ''}`}>
                    {item.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-3 mb-4 flex-grow">
                    {item.description}
                </p>
                <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500">
                    <span>{item.date}</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300">{item.author}</span>
                </div>
            </div>
        </Link>
    );
};

const SectionHeader = ({ title, icon, onSeeAll }: { title: string, icon: string, onSeeAll?: () => void }) => {
    const { t } = useLanguage();
    return (
        <div className="flex items-center justify-between mb-6 mt-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <i className={`fas ${icon} text-purple-500`}></i> {title}
            </h2>
            {onSeeAll && (
                <button onClick={onSeeAll} className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline">
                    {t('resources.sections.view_all')}
                </button>
            )}
        </div>
    );
};

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// ... (keep imports)



// ... (keep SectionHeader)

export default function ResourcesDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const { t } = useLanguage(); // Use hook
    const [activeTab, setActiveTab] = useState('all');
    const [loading, setLoading] = useState(false);



    const renderContent = () => {
        if (loading) return <div className="p-12 text-center text-slate-500">{t('resources.loading')}</div>;

        if (activeTab === 'all') {
            return (
                <div className="space-y-12">
                     {/* ... (keep existing structure) ... */}
                    {/* Blogs Section */}


                    {/* Posts Section */}
                    <section>
                        <SectionHeader title={t('resources.sections.posts') || 'Posts'} icon="fa-newspaper" onSeeAll={() => setActiveTab('posts')} />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {mockPosts.slice(0, 4).map(item => <ResourceCard key={item.id} item={item} />)}
                        </div>
                    </section>

                    {/* Testimonies Section */}
                    <section>
                        <SectionHeader title={t('resources.sections.testimonies') || 'Testimonies'} icon="fa-comment-medical" onSeeAll={() => setActiveTab('testimonies')} />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {mockTestimonies.slice(0, 4).map(item => <ResourceCard key={item.id} item={item} />)}
                        </div>
                    </section>

                    {/* Documents Section */}
                    <section>
                        <SectionHeader title={t('resources.sections.documents')} icon="fa-file-pdf" onSeeAll={() => setActiveTab('documents')} />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {mockDocuments.slice(0, 4).map(item => <ResourceCard key={item.id} item={item} />)}
                        </div>
                    </section>

                    {/* Songs Section */}
                    <section>
                        <SectionHeader title={t('resources.sections.songs')} icon="fa-music" onSeeAll={() => setActiveTab('songs')} />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {mockSongs.slice(0, 4).map(item => <ResourceCard key={item.id} item={item} />)}
                        </div>
                    </section>
                </div>
            );
        }

        // Specific Tab Views
        let items: ResourceItem[] = [];
        let title = '';
        if (activeTab === 'posts') { items = mockPosts; title = t('resources.tabs.posts') || 'Posts'; }
        if (activeTab === 'testimonies') { items = mockTestimonies; title = t('resources.tabs.testimonies') || 'Testimonies'; }
        if (activeTab === 'documents') { items = mockDocuments; title = t('resources.tabs.documents'); }
        if (activeTab === 'songs') { items = mockSongs; title = t('resources.tabs.songs'); }

        return (
            <div>
                 <div className="mb-8 flex items-end justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{title}</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">{t('resources.found_items').replace('{{count}}', items.length.toString())}</p>
                    </div>
                    
                     {/* Write Button (Only visible for 'blogs' tab if logged in) */}

                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {items.map(item => <ResourceCard key={item.id} item={item} />)}
                 </div>
            </div>
        );
    };

    return (
        <main className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-20 font-sans transition-colors duration-300">
             {/* Mobile Tab Select */}
            <div className="lg:hidden bg-slate-900/80 backdrop-blur-md border-b border-white/5 sticky top-[72px] z-30 px-4 py-3 overflow-x-auto whitespace-nowrap hide-scrollbar shadow-lg">
                {['all', 'posts', 'testimonies', 'documents', 'songs'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`inline-block px-4 py-2 rounded-full text-sm font-bold mr-2 ${
                            activeTab === tab 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                    >
                        {t(`resources.tabs.${tab}`)}
                    </button>
                ))}
            </div>

            <div className="container container-custom pb-20" style={{ paddingTop: '40px' }}>
                {/* Header Section */}
                <div className="max-w-4xl mb-12 md:mb-16">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
                        {t('resources.title') || 'Resources'}
                    </h1>
                     <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
                        {t('resources.subtitle') || 'Explore our collection of spiritual resources including blogs, documents, and songs.'}
                    </p>
                    <div className="mt-8 h-1 w-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                     {/* Left Sidebar */}
                    <div className="lg:col-span-3 hidden lg:block">
                        <div>
                            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                        </div>
                    </div>

                    {/* Right Content */}
                    <div className="lg:col-span-9">
                        {renderContent()}
                    </div>
                </div>
            </div>


        </main>
    );
}
