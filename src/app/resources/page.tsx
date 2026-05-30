"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AmbientBackground from '@/components/ui/AmbientBackground';

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState('posts');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    fetch('/resources/metadata.json')
      .then(res => res.json())
      .then(data => {
        const tabData = data[activeTab] || [];
        // Sort items by createdAt if available, else date
        const sortedData = [...tabData].sort((a: any, b: any) => {
           const timeA = a.createdAt?.seconds || Date.parse(a.date) || 0;
           const timeB = b.createdAt?.seconds || Date.parse(b.date) || 0;
           return timeB - timeA;
        });
        setItems(sortedData);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching metadata:', error);
        setItems([]);
        setLoading(false);
      });
  }, [activeTab]);

  const tabs = [
    { id: 'posts', label: 'Blog Posts', icon: 'fas fa-newspaper' },
    { id: 'testimonies', label: 'Testimonies', icon: 'fas fa-bullhorn' },
    { id: 'documents', label: 'Documents', icon: 'fas fa-file-alt' },
    { id: 'songs', label: 'Translated Songs', icon: 'fas fa-music' },
  ];

  return (
    <main className="bg-white dark:bg-slate-950 min-h-screen font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">
      
      {/* SECTION: HERO */}
      <section className="relative pt-32 pb-20 overflow-hidden border-b border-slate-200 dark:border-white/5">
        <AmbientBackground variant="section" />
        <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-blue-600/10" />
        </div>

        <div className="container container-custom relative z-10 text-center">
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6">
                Resources <span className="text-aurora">Hub</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Equipping the saints for the work of ministry, for building up the body of Christ.
            </p>
        </div>
      </section>

      {/* SECTION: CONTENT */}
      <section className="py-12 md:py-20">
        <div className="container container-custom">
           <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
               
               {/* SIDEBAR NAVIGATION */}
               <div className="w-full lg:w-1/4">
                   <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl sticky top-28 border border-slate-200 dark:border-white/5 shadow-sm">
                       <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 py-3 mb-2">Library</h3>
                       <div className="flex flex-col gap-2">
                           {tabs.map(tab => (
                               <button
                                  key={tab.id}
                                  onClick={() => setActiveTab(tab.id)}
                                  className={`w-full text-left px-5 py-4 rounded-2xl flex items-center gap-4 transition-all duration-300 font-bold ${
                                      activeTab === tab.id 
                                        ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-500 shadow-xl shadow-slate-200/50 dark:shadow-none ring-1 ring-slate-200 dark:ring-slate-700/50' 
                                        : 'text-slate-500 hover:bg-white/60 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300'
                                  }`}
                               >
                                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                                       activeTab === tab.id 
                                         ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-500' 
                                         : 'bg-slate-200 dark:bg-slate-800/50 text-slate-400'
                                   }`}>
                                       <i className={tab.icon}></i>
                                   </div>
                                   {tab.label}
                               </button>
                           ))}
                       </div>


                   </div>
               </div>

               {/* MAIN CONTENT GRID */}
               <div className="w-full lg:w-3/4 min-h-[600px]">
                   <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-white/5">
                       <h2 className="text-3xl font-bold text-slate-900 dark:text-white capitalize tracking-tight">{activeTab}</h2>
                       <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900 rounded-full text-xs font-bold text-slate-500 border border-slate-200 dark:border-white/5">
                           {items.length} RESULTS
                       </div>
                   </div>

                   {loading ? (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           {[1, 2, 3, 4].map(i => (
                               <div key={i} className="h-72 rounded-3xl bg-slate-100 dark:bg-slate-900 animate-pulse"></div>
                           ))}
                       </div>
                   ) : items.length === 0 ? (
                       <div className="text-center py-24 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                           <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 dark:text-slate-700">
                               <i className="fas fa-folder-open text-5xl"></i>
                           </div>
                           <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Items Found</h3>
                           <p className="text-slate-500">There are no {activeTab} to display at the moment.</p>
                       </div>
                   ) : (
                       <div className={`grid gap-6 ${['posts', 'testimonies', 'documents'].includes(activeTab) ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                           {items.map(item => (
                               <div key={item.id} className="group premium-card rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 transition-all duration-300 relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                                   
                                   {/* POSTS & TESTIMONIES CARD */}
                                   {(activeTab === 'posts' || activeTab === 'testimonies') && (
                                       <div className="p-6 flex flex-col h-full relative group hover:border-blue-600/50 transition-colors border-l-4 border-l-transparent hover:border-l-blue-600 bg-white dark:bg-slate-900">
                                            {/* Header */}
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                        activeTab === 'posts' 
                                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-500' 
                                                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-600'
                                                    }`}>
                                                        {activeTab === 'posts' ? 'Article' : 'Story'}
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-bold">
                                                        {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : item.date || 'Recently'}
                                                    </span>
                                                </div>
                                                {/* File Icon */}
                                                <div className="text-slate-300 dark:text-slate-700">
                                                     <i className={`fas ${item.fileUrl?.includes('.pdf') ? 'fa-file-pdf' : 'fa-file-image'} text-xl`}></i>
                                                </div>
                                            </div>

                                            {/* Title */}
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-snug group-hover:text-blue-700 dark:group-hover:text-blue-500 transition-colors">
                                                 {item.fileUrl ? (
                                                     <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="hover:underline focus:outline-none before:absolute before:inset-0">
                                                         {item.title}
                                                     </a>
                                                 ) : (
                                                     item.title
                                                 )}
                                            </h3>

                                            {/* Excerpt */}
                                            {item.excerpt && (
                                                <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">
                                                    {item.excerpt}
                                                </p>
                                            )}

                                            {/* Action - pushed to bottom */}
                                            <div className="mt-auto pt-4 flex items-center text-sm font-bold text-blue-700 dark:text-blue-500">
                                                {item.fileUrl ? (
                                                     <span className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                                         {item.fileUrl.includes('.pdf') ? 'View PDF' : 'View Image'} <i className="fas fa-external-link-alt text-xs"></i>
                                                     </span>
                                                ) : (
                                                    <span className="text-slate-400 italic font-normal">No file attached</span>
                                                )}
                                            </div>
                                       </div>
                                   )}

                                   {/* DOCUMENTS CARD - Redesigned */}
                                   {activeTab === 'documents' && (
                                       <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 relative group-hover:border-amber-200 dark:group-hover:border-amber-600/30 transition-colors">
                                           {/* Decorative Top Accent */}
                                           <div className="h-1.5 w-full bg-gradient-to-r from-amber-600 to-orange-500"></div>

                                           <div className="p-8 flex-1 flex flex-col">
                                               {/* Header: Icon & Type */}
                                               <div className="flex items-start justify-between mb-6">
                                                   <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-600/10 text-amber-50 dark:text-amber-500 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                                                       <i className="fas fa-book-open"></i>
                                                   </div>
                                                   <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest border border-slate-200 dark:border-white/10">
                                                      {item.category || 'PDF'}
                                                   </div>
                                               </div>

                                               {/* Content */}
                                               <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 leading-tight group-hover:text-red-600 dark:group-hover:text-amber-500 transition-colors">
                                                   {item.title}
                                               </h3>
                                               
                                               {item.author && (
                                                   <div className="flex items-center gap-2 mb-4 text-sm font-bold text-slate-400">
                                                       <i className="fas fa-feather-alt text-xs text-amber-500"></i>
                                                       <span>{item.author}</span>
                                                   </div>
                                               )}

                                               <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8 line-clamp-3">
                                                   {item.description}
                                               </p>
                                               
                                               {/* Footer: Meta & Action */}
                                               <div className="mt-auto pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                                                   <div className="flex flex-col text-xs font-bold text-slate-400">
                                                       <span>Since {item.date}</span>
                                                       <span className="text-slate-300 dark:text-slate-600">{item.size}</span>
                                                   </div>
                                                   
                                                   <a 
                                                     href={item.fileUrl} 
                                                     target="_blank" 
                                                     rel="noopener noreferrer"
                                                     className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 dark:bg-amber-600/10 text-red-600 dark:text-amber-500 rounded-xl font-bold text-sm hover:bg-amber-100 dark:hover:bg-amber-600/20 transition-all shadow-sm group-hover:shadow-md"
                                                   >
                                                       <span>Download</span>
                                                       <i className="fas fa-cloud-download-alt"></i>
                                                   </a>
                                               </div>
                                           </div>
                                       </div>
                                   )}

                                    {/* SONGS CARD */}
                                   {activeTab === 'songs' && (
                                       <div className="p-6 flex items-center gap-6">
                                            <a 
                                                href={item.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-20 h-20 rounded-2xl bg-slate-200 dark:bg-slate-800 relative overflow-hidden shrink-0 group-hover:shadow-lg transition-all flex items-center justify-center border border-slate-100 dark:border-white/5"
                                            >
                                                {/* Use PDF icon always as these are documents mostly, or check type if we have audio */}
                                                 <i className="fas fa-file-pdf text-3xl text-slate-400 group-hover:text-blue-700 transition-colors"></i>
                                            </a>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-700 dark:group-hover:text-blue-500 transition-colors">
                                                    <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{item.title}</a>
                                                </h3>
                                                <p className="text-sm text-slate-500 mb-2">{item.author}</p>
                                                {item.category && (
                                                    <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase">
                                                        <i className="fas fa-tag text-[8px]"></i> {item.category}
                                                    </div>
                                                )}
                                            </div>
                                            <a 
                                                href={item.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 hover:bg-blue-700 hover:text-white dark:hover:bg-blue-700 transition-all shadow-sm"
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
