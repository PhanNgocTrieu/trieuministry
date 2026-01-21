"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';

// Mock Data for items not yet in Firestore
const DOCUMENTS = [
  { id: '1', title: 'Worship Team Lessons', type: 'PDF', size: '3.8 MB', date: 'Jan 10, 2024', url: '/resources/bible_study/_worship_team_lessons.pdf' },
  { id: '2', title: 'Be Blessed in Honoring Parents', type: 'PDF', size: '91 KB', date: 'Dec 15, 2023', url: '/resources/sharing/_be_bless_in_honoring_parents.pdf' },
  { id: '3', title: 'Can I Help You?', type: 'PDF', size: '320 KB', date: 'Jan 05, 2024', url: '/resources/sharing/_can_i_help_you.pdf' },
  { id: '4', title: 'Reason for Coming', type: 'PDF', size: '172 KB', date: 'Jan 08, 2024', url: '/resources/sharing/_reason_for_coming.pdf' },
];

const SONGS = [
  { id: '1', title: 'Man of Sorrow', artist: 'Worship Team', duration: 'PDF', cover: '', url: '/resources/songs/_man_of_sorrow.pdf', type: 'sheet' },
];

export default function ResourcesPage() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let unsubscribe = () => {};

    if (activeTab === 'posts' || activeTab === 'testimonies') {
      // Fetch from Firestore
      const collectionName = activeTab === 'posts' ? 'posts' : 'testimonies';
      const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
      
      unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedItems: any[] = [];
        snapshot.forEach((doc) => {
          fetchedItems.push({ id: doc.id, ...doc.data() });
        });
        setItems(fetchedItems);
        setLoading(false);
      });
    } else if (activeTab === 'documents') {
      setItems(DOCUMENTS);
      setLoading(false);
    } else if (activeTab === 'songs') {
      setItems(SONGS);
      setLoading(false);
    }

    return () => unsubscribe();
  }, [activeTab]);

  const tabs = [
    { id: 'posts', label: 'Blog Posts', icon: 'fas fa-newspaper' },
    { id: 'testimonies', label: 'Testimonies', icon: 'fas fa-bullhorn' },
    { id: 'documents', label: 'Documents', icon: 'fas fa-file-alt' },
    { id: 'songs', label: 'Worship Songs', icon: 'fas fa-music' },
  ];

  return (
    <main className="bg-white dark:bg-slate-950 min-h-screen font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">
      
      {/* SECTION: HERO */}
      <section className="relative pt-32 pb-24 overflow-hidden bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-white/5">
        <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-500/5 dark:bg-violet-600/5 rounded-full blur-[150px]"></div>
        </div>

        <div className="container container-custom relative z-10 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-6">
                Resources <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">Hub</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Equipping the saints for the work of ministry, for building up the body of Christ.
            </p>
        </div>
      </section>

      {/* SECTION: CONTENT */}
      <section className="py-16 md:py-24">
        <div className="container container-custom">
           <div className="flex flex-col lg:flex-row gap-12">
               
               {/* SIDEBAR NAVIGATION */}
               <div className="w-full lg:w-1/4">
                   <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl sticky top-28 border border-slate-200 dark:border-white/5">
                       <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 py-2 mb-2">Categories</h3>
                       <div className="flex flex-col gap-2">
                           {tabs.map(tab => (
                               <button
                                  key={tab.id}
                                  onClick={() => setActiveTab(tab.id)}
                                  className={`w-full text-left px-5 py-4 rounded-2xl flex items-center gap-4 transition-all duration-300 font-bold ${
                                      activeTab === tab.id 
                                        ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-lg shadow-slate-200/50 dark:shadow-none ring-1 ring-slate-200 dark:ring-slate-700' 
                                        : 'text-slate-500 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300'
                                  }`}
                               >
                                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                                       activeTab === tab.id 
                                         ? 'bg-violet-50 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400' 
                                         : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                                   }`}>
                                       <i className={tab.icon}></i>
                                   </div>
                                   {tab.label}
                               </button>
                           ))}
                       </div>

                       {isAdmin && (activeTab === 'posts' || activeTab === 'testimonies') && (
                           <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/5 px-2">
                               <Link 
                                  href={`/admin/${activeTab}/create`} 
                                  className="w-full py-3 bg-violet-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-violet-700 hover:shadow-lg hover:shadow-violet-500/20 transition-all"
                               >
                                   <i className="fas fa-plus"></i> Add New
                               </Link>
                           </div>
                       )}
                   </div>
               </div>

               {/* MAIN CONTENT GRID */}
               <div className="w-full lg:w-3/4 min-h-[500px]">
                   <div className="flex items-center justify-between mb-8">
                       <h2 className="text-3xl font-bold text-slate-900 dark:text-white capitalize">{activeTab}</h2>
                       <div className="text-sm text-slate-500 font-medium">
                           Showing {items.length} results
                       </div>
                   </div>

                   {loading ? (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           {[1, 2, 3, 4].map(i => (
                               <div key={i} className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-900 animate-pulse"></div>
                           ))}
                       </div>
                   ) : items.length === 0 ? (
                       <div className="text-center py-24 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                           <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 dark:text-slate-600">
                               <i className="fas fa-folder-open text-4xl"></i>
                           </div>
                           <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Items Found</h3>
                           <p className="text-slate-500">There are no {activeTab} to display at the moment.</p>
                       </div>
                   ) : (
                       <div className={`grid gap-8 ${activeTab === 'posts' || activeTab === 'testimonies' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                           {items.map(item => (
                               <div key={item.id} className="group premium-card rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 relative">
                                   
                                   {/* POSTS & TESTIMONIES CARD */}
                                   {(activeTab === 'posts' || activeTab === 'testimonies') && (
                                       <>
                                           <div className="h-56 bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
                                               {item.coverImage ? (
                                                   <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                               ) : (
                                                   <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-slate-300 dark:text-slate-600">
                                                       <i className={`fas ${activeTab === 'posts' ? 'fa-pen-nib' : 'fa-quote-left'} text-5xl opacity-50`}></i>
                                                   </div>
                                               )}
                                               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                           </div>
                                           <div className="p-8">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                                        activeTab === 'posts' 
                                                            ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400' 
                                                            : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                                    }`}>
                                                        {activeTab === 'posts' ? 'Article' : 'Story'}
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">
                                                        {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : item.date || 'Recently'}
                                                    </span>
                                                </div>
                                               <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 line-clamp-2 leading-tight group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                                   {item.title}
                                               </h3>
                                               <p className="text-slate-600 dark:text-slate-400 line-clamp-3 mb-6 leading-relaxed">
                                                   {item.excerpt || item.content?.replace(/<[^>]*>/g, '').substring(0, 150) + '...'}
                                               </p>
                                               <Link 
                                                  href={`/resources/${item.id}`} 
                                                  className="inline-flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                                               >
                                                   Read Full {activeTab === 'posts' ? 'Article' : 'Testimony'} <i className="fas fa-arrow-right"></i>
                                               </Link>
                                           </div>
                                       </>
                                   )}

                                   {/* DOCUMENTS CARD */}
                                   {activeTab === 'documents' && (
                                       <div className="p-6 flex items-center gap-6">
                                           <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 dark:text-rose-400 text-2xl shrink-0">
                                               <i className="fas fa-file-pdf"></i>
                                           </div>
                                           <div className="flex-1">
                                               <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-rose-500 transition-colors">
                                                 <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                    {item.title}
                                                 </a>
                                               </h3>
                                               <p className="text-sm text-slate-500 flex items-center gap-3">
                                                   <span>{item.size}</span>
                                                   <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                   <span>{item.date}</span>
                                               </p>
                                           </div>
                                           <a 
                                             href={item.url} 
                                             target="_blank" 
                                             rel="noopener noreferrer"
                                             className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all"
                                           >
                                               <i className="fas fa-download"></i>
                                           </a>
                                       </div>
                                   )}

                                    {/* SONGS CARD */}
                                   {activeTab === 'songs' && (
                                       <div className="p-4 flex items-center gap-6">
                                            <a 
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-800 relative overflow-hidden shrink-0 group-hover:shadow-lg transition-all flex items-center justify-center"
                                            >
                                                {item.type === 'sheet' ? (
                                                     <i className="fas fa-file-pdf text-3xl text-slate-400 group-hover:text-violet-600 transition-colors"></i>
                                                ) : (
                                                    <>
                                                        <div className="absolute inset-0 bg-violet-600/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                            <i className="fas fa-play text-white drop-shadow-md"></i>
                                                        </div>
                                                        {item.cover ? (
                                                            <img src={item.cover} alt="Cover" className="w-full h-full object-cover" /> 
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-800">
                                                                <i className="fas fa-music"></i>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </a>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{item.title}</a>
                                                </h3>
                                                <p className="text-sm text-slate-500">{item.artist}</p>
                                            </div>
                                            <div className="text-sm font-bold text-slate-400 font-mono tracking-wider">
                                                {item.duration}
                                            </div>
                                            <a 
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                                            >
                                                <i className="fas fa-download"></i>
                                            </a>
                                       </div>
                                   )}

                               </div>
                           ))}
                       </div>
                   )}
               </div>
           </div>
        </div>
      </section>

    </main>
  );
}
