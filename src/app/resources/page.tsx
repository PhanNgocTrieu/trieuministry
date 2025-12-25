"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { ResourceItem, mockDocuments, mockSongs } from '@/data/mockResources';
import { useLanguage } from '@/context/LanguageContext'; // Added import

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  author: string;
  date: string;
  status: 'approved' | 'pending';
  category: string;
  excerpt: string;
  content: string;
  tags: string[];
}

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
    const { t } = useLanguage(); // Use hook
    const menuItems = [
        { id: 'all', label: t('resources.tabs.all'), icon: 'fas fa-th-large' },
        { id: 'blogs', label: t('resources.tabs.blogs'), icon: 'fas fa-pen-nib' },
        { id: 'documents', label: t('resources.tabs.documents'), icon: 'fas fa-file-pdf' },
        { id: 'songs', label: t('resources.tabs.songs'), icon: 'fas fa-music' },
    ];

    return (
        <aside className="w-64 bg-white border-r border-gray-100 flex-shrink-0 fixed h-full pt-20 hidden lg:block z-20">
            <div className="p-6">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{t('resources.sidebar_title')}</h2>
                <nav className="space-y-2">
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                                activeTab === item.id 
                                ? 'bg-blue-50 text-blue-600 shadow-sm' 
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        >
                            <i className={`${item.icon} w-5 text-center`}></i>
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>
        </aside>
    );
};



const ResourceCard = ({ item }: { item: ResourceItem }) => {
    const { t } = useLanguage();
    // Determine Link based on type
    const href = item.type === 'blog' ? `/blogs/${item.slug || item.id}` : `/resources/${item.slug}`;
    const icon = item.type === 'blog' ? 'fa-pen' : item.type === 'song' ? 'fa-music' : 'fa-file-pdf';
    const isBlog = item.type === 'blog';
    
    return (
        <Link href={href} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 flex flex-col h-full">
            {/* Show cover image only if NOT a blog */}
            {!isBlog && (
                <div className="relative h-48 bg-gray-100 overflow-hidden">
                    {item.coverImage && !item.coverImage.includes('placehold') ? (
                        <Image 
                            src={item.coverImage} 
                            alt={item.title} 
                            fill 
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-200 text-4xl">
                            <i className={`fas ${icon}`}></i>
                        </div>
                    )}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-gray-700 shadow-sm flex items-center gap-1">
                        <i className={`fas ${icon} text-[10px]`}></i> {item.category}
                    </div>
                </div>
            )}
            
            <div className="p-5 flex flex-col flex-grow">
                {/* For blogs, we might want a small category badge since image is gone */}
                {isBlog && (
                     <div className="mb-2">
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                            <i className="fas fa-pen-nib text-[10px]"></i> {t('resources.tabs.blogs')}
                        </span>
                     </div>
                )}

                <h3 className={`text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors ${isBlog ? 'text-xl' : ''}`}>
                    {item.title}
                </h3>
                <p className="text-gray-500 text-xs line-clamp-3 mb-4 flex-grow">
                    {item.description}
                </p>
                <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                    <span>{item.date}</span>
                    <span className="font-semibold text-gray-900">{item.author}</span>
                </div>
            </div>
        </Link>
    );
};

const SectionHeader = ({ title, icon, onSeeAll }: { title: string, icon: string, onSeeAll?: () => void }) => {
    const { t } = useLanguage();
    return (
        <div className="flex items-center justify-between mb-6 mt-2">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <i className={`fas ${icon} text-blue-500`}></i> {title}
            </h2>
            {onSeeAll && (
                <button onClick={onSeeAll} className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline">
                    {t('resources.sections.view_all')}
                </button>
            )}
        </div>
    );
};

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import CreateBlogModal from '@/components/CreateBlogModal';

// ... (keep imports)



// ... (keep SectionHeader)

export default function ResourcesDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const { t } = useLanguage(); // Use hook
    const [activeTab, setActiveTab] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [blogs, setBlogs] = useState<ResourceItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBlogs = async () => {
        try {
            const q = query(
                collection(db, "blogs"), 
                where("status", "==", "approved"),
                orderBy("date", "desc")
            );
            const snapshot = await getDocs(q);
            const blogList: ResourceItem[] = snapshot.docs.map(doc => {
                const data = doc.data() as BlogPost;
                return {
                    id: doc.id,
                    slug: data.slug,
                    title: data.title,
                    category: data.category,
                    description: data.excerpt, 
                    coverImage: '', 
                    date: data.date,
                    author: data.author,
                    type: 'blog'
                };
            });
            setBlogs(blogList);
        } catch (err) {
            console.error("Failed to fetch blogs", err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Blogs from Firestore
    useEffect(() => {
        fetchBlogs();
    }, []);

    const renderContent = () => {
        if (loading) return <div className="p-12 text-center text-gray-400">{t('resources.loading')}</div>;

        if (activeTab === 'all') {
            return (
                <div className="space-y-12">
                     {/* ... (keep existing structure) ... */}
                    {/* Blogs Section */}
                    <section>
                        <SectionHeader title={t('resources.sections.latest_blogs')} icon="fa-pen-nib" onSeeAll={() => setActiveTab('blogs')} />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {blogs.slice(0, 4).map(item => <ResourceCard key={item.id} item={item} />)}
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
        if (activeTab === 'blogs') { items = blogs; title = t('resources.tabs.blogs'); }
        if (activeTab === 'documents') { items = mockDocuments; title = t('resources.tabs.documents'); }
        if (activeTab === 'songs') { items = mockSongs; title = t('resources.tabs.songs'); }

        return (
            <div>
                 <div className="mb-8 flex items-end justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                        <p className="text-gray-500 mt-1">{t('resources.found_items').replace('{{count}}', items.length.toString())}</p>
                    </div>
                    
                     {/* Write Button (Only visible for 'blogs' tab if logged in) */}
                    {(activeTab === 'blogs') && user && (
                        <button 
                            onClick={() => setShowCreateModal(true)}
                            className="hidden md:flex bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-600 transition-all shadow-lg items-center gap-2"
                        >
                            <i className="fas fa-pen-nib"></i> {t('resources.write_blog')}
                        </button>
                    )}
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {items.map(item => <ResourceCard key={item.id} item={item} />)}
                 </div>
            </div>
        );
    };

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col">
            {/* Mobile Tab Select */}
            <div className="lg:hidden bg-white border-b border-gray-200 sticky top-[72px] z-30 px-4 py-3 overflow-x-auto whitespace-nowrap hide-scrollbar shadow-sm">
                {['all', 'blogs', 'documents', 'songs'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`inline-block px-4 py-2 rounded-full text-sm font-bold mr-2 ${
                            activeTab === tab 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-600'
                        }`}
                    >
                        {t(`resources.tabs.${tab}`)}
                    </button>
                ))}
            </div>

            <div className="flex flex-1">
                {/* Sidebar (Desktop) */}
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

                {/* Main Content */}
                <div className="flex-1 lg:ml-64 p-6 md:p-12 pt-28 lg:pt-32">
                     {renderContent()}
                </div>
            </div>

            {/* FAB for Mobile (Only visible if logged in) */}
            {user && (
                 <button 
                    onClick={() => setShowCreateModal(true)}
                    className="fixed bottom-6 right-6 lg:hidden w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50 text-xl hover:bg-blue-700 transition-colors"
                 >
                     <i className="fas fa-pen"></i>
                 </button>
             )}

             {/* Create Blog Modal */}
             <CreateBlogModal 
                isOpen={showCreateModal} 
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    fetchBlogs(); // Refresh list
                    // Optionally switch to 'blogs' tab if not already
                    if (activeTab === 'all') setActiveTab('blogs');
                }}
             />
        </main>
    );
}
