"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

interface Ministry {
  id: string;
  // Bilingual Fields
  title_en?: string;
  title_vi?: string;
  description_en?: string;
  description_vi?: string;
  prayerNeeds_en?: string;
  prayerNeeds_vi?: string;
  
  // Setup (Legacy fallback)
  title: string;
  description: string;
  prayerNeeds?: string;
  
  category?: string;
  status: 'active' | 'completed' | 'on-hold';
  visibility: 'public' | 'private' | 'shared';
  sharedWith?: string[];
  coverImage?: string;
  images?: { url: string; caption: string }[];
  createdAt: any;
}

export default function MinistryPage() {
  const { t, language } = useLanguage();
  const { user, isAdmin } = useAuth();
  
  // Data States
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to get localized text with fallback
  const getLocalized = (obj: any, field: string) => {
    const langKey = `${field}_${language}`;
    // Prefer typed language field > opposite language field > generic field
    return obj[langKey] || obj[`${field}_en`] || obj[`${field}_vi`] || obj[field] || '';
  };

  useEffect(() => {
    // Fetch Ministries
    const qMinistries = query(collection(db, "ministries"), orderBy("createdAt", "desc"));
    const unsubscribeMinistries = onSnapshot(qMinistries, (snapshot) => {
      const list: Ministry[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Ministry);
      });
      setMinistries(list);
      setLoading(false);
    });

    return () => {
      unsubscribeMinistries();
    };
  }, []);

  // Filter Ministries based on visibility
  const filteredMinistries = ministries.filter(m => {
    if (m.visibility === 'public') return true;
    if (isAdmin) return true; 
    if (m.visibility === 'shared' && user?.email && m.sharedWith?.includes(user?.email)) {
        return true;
    }
    return false;
  });

  // Group by Category
  const groupedMinistries: Record<string, Ministry[]> = {};
  filteredMinistries.forEach(ministry => {
      const cat = ministry.category || "General";
      if (!groupedMinistries[cat]) {
          groupedMinistries[cat] = [];
      }
      groupedMinistries[cat].push(ministry);
  });
  const categories = Object.keys(groupedMinistries).sort();

  return (
    <main className="bg-slate-50 dark:bg-slate-950 min-h-screen font-sans selection:bg-purple-500/30 text-slate-900 dark:text-slate-200 transaction-colors duration-300">
      
      {/* SECTION 1: MINISTRY UPDATES */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
        {/* Background Gradients (Premium) */}
        <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(at_top_left,_var(--tw-gradient-stops))] from-purple-100/40 via-blue-50/20 to-transparent dark:hidden opacity-100"></div>
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-600/20 dark:bg-purple-600/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="container container-custom relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
                <div>
                    <span className="text-purple-600 dark:text-purple-400 font-bold tracking-wider uppercase text-sm mb-2 block">Our Work & Mission</span>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                        {t('nav.ministry')}
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400 mt-4 max-w-2xl leading-relaxed">
                         {t('ministry.hero.subtitle')}
                    </p>
                </div>
                {isAdmin && (
                    <Link href="/admin/ministries/create?returnUrl=/ministry" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-gray-100 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                        <i className="fas fa-plus text-purple-600"></i>
                        <span>Add Ministry</span>
                    </Link>
                )}
            </div>

            <div className="space-y-20">
               {categories.length > 0 ? (
                   categories.map(category => (
                       <div key={category}>
                           <div className="flex items-center gap-4 mb-10">
                              <div className="h-8 w-1.5 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                               <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{category}</h2>
                           </div>

                           <div className="grid grid-cols-1 gap-10">
                               {groupedMinistries[category].map((ministry) => {
                                   const displayImage = ministry.coverImage || (ministry.images && ministry.images.length > 0 ? ministry.images[0].url : null);
                                   const title = getLocalized(ministry, 'title');
                                   const description = getLocalized(ministry, 'description');
                                   const prayerNeeds = getLocalized(ministry, 'prayerNeeds');

                                   return (
                                   <div key={ministry.id} className="relative glass-panel rounded-3xl overflow-hidden hover:border-purple-500/30 hover:shadow-premium-hover transition-all duration-500 flex flex-col group shadow-premium dark:shadow-none dark:bg-slate-900/40 dark:border-white/10">
                                       <div className={`flex flex-col ${displayImage ? 'md:flex-row' : ''}`}>
                                           {displayImage && (
                                               <div className="md:w-5/12 bg-slate-800 relative min-h-[300px] overflow-hidden">
                                                   <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10 opacity-60"></div>
                                                   <img 
                                                       src={displayImage} 
                                                       alt={title} 
                                                       className="w-full h-full object-cover absolute inset-0 transition-transform duration-700 group-hover:scale-110" 
                                                   />
                                               </div>
                                           )}
                                           <div className={`p-8 md:p-10 flex flex-col ${displayImage ? 'md:w-7/12' : 'w-full'}`}>
                                               <div className="mb-6">
                                                   <div className="flex justify-between items-start gap-4">
                                                       <Link href={`/ministry/${ministry.id}`} className="group/title">
                                                           <h3 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight group-hover/title:text-purple-600 dark:group-hover/title:text-purple-400 transition-colors">{title}</h3>
                                                       </Link>
                                                       <div className="flex items-center gap-2 shrink-0">
                                                           {ministry.status !== 'active' && (
                                                               <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                                                                   ministry.status === 'completed' 
                                                                    ? 'bg-slate-800 text-slate-400 border-slate-700' 
                                                                    : 'bg-amber-900/30 text-amber-500 border-amber-900/50'
                                                               }`}>
                                                                   {ministry.status}
                                                               </span>
                                                           )}
                                                           {isAdmin && (
                                                               <Link href={`/admin/ministries/${ministry.id}/edit`} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:bg-white hover:text-slate-900 transition-all">
                                                                   <i className="fas fa-edit"></i>
                                                               </Link>
                                                           )}
                                                       </div>
                                                   </div>
                                                   <div className="text-sm text-slate-500 mt-3 font-medium flex items-center gap-2">
                                                      <i className="fas fa-calendar-alt opacity-50"></i>
                                                      {ministry.createdAt?.seconds ? new Date(ministry.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                                   </div>
                                               </div>
                                                {/* Description Preview - Strip HTML and truncate */}
                                                <div className="text-slate-600 dark:text-slate-300 leading-relaxed flex-grow mb-6">
                                                    {description.replace(/<[^>]*>/g, '').substring(0, 250)}{description.length > 250 ? '...' : ''}
                                                </div>
                                                 
                                                {/* Read More Button */}
                                                <div className="mt-auto">
                                                    <Link 
                                                        href={`/ministry/${ministry.id}`}
                                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all hover:scale-105 shadow-lg shadow-purple-900/30"
                                                    >
                                                        <span>{language === 'vi' ? 'Đọc thêm' : 'Read More'}</span>
                                                        <i className="fas fa-arrow-right text-sm"></i>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>

                                   </div>
                                   );
                               })}
                           </div>
                       </div>
                   ))
               ) : (
                   <div className="text-center py-24 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
                       <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-church text-4xl text-slate-600"></i>
                       </div>
                       <h3 className="text-xl font-bold text-white mb-2">No Updates Yet</h3>
                       <p className="text-slate-500 font-medium">Ministry updates will appear here soon.</p>
                   </div>
               )}
            </div>
        </div>
      </section>

    </main>
  );
}
