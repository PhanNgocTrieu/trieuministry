"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

interface Ministry {
  id: string;
  title: string;
  category?: string; // Added category
  description: string;
  prayerNeeds?: string; // Added Prayer Needs
  status: 'active' | 'completed' | 'on-hold';
  visibility: 'public' | 'private' | 'shared';
  sharedWith?: string[];
  coverImage?: string; // Single Image
  images?: { url: string; caption: string }[]; // Keeping for backward compatibility
  createdAt: any;
}

export default function MinistryPage() {
  const { t } = useLanguage();
  const { user, isAdmin } = useAuth();
  
  // Data States
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Ministries
    const qMinistries = query(collection(db, "ministries"), orderBy("createdAt", "desc"));
    const unsubscribeMinistries = onSnapshot(qMinistries, (snapshot) => {
      const list: Ministry[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Ministry);
      });
      setMinistries(list);
      setLoading(false); // Move loading false here or after all fetches if multiple
    });

    return () => {
      unsubscribeMinistries();
    };
  }, []);

  // Filter Ministries based on visibility
  const filteredMinistries = ministries.filter(m => {
    if (m.visibility === 'public') return true;
    if (isAdmin) return true; // Admin sees everything
    
    // Check Shared
    if (m.visibility === 'shared' && user?.email && m.sharedWith?.includes(user.email)) {
        return true;
    }
    
    return false; // Private or not shared with user
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

  // Get sorted categories (optional: alphabetical or predefined order)
  const categories = Object.keys(groupedMinistries).sort();

  return (
    <main className="bg-gray-50 min-h-screen pb-20 font-sans">
      {/* Unified Container for Consistent Spacing */}
      <div className="container container-custom pb-20" style={{ paddingTop: '40px' }}>
          {/* Header Section */}
          <div className="max-w-4xl mb-12 md:mb-16">
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
                  {t('nav.ministry')}
              </h1>
              <p className="text-xl text-gray-500 leading-relaxed max-w-3xl">
                  {t('ministry.hero.subtitle')}
              </p>
              <div className="mt-8 h-1 w-20 bg-blue-600 rounded-full"></div>
              
               {isAdmin && (
                  <div className="mt-8">
                      <Link href="/admin/ministries/create?returnUrl=/ministry" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">
                          <i className="fas fa-plus"></i>
                          <span>Add New Ministry</span>
                      </Link>
                  </div>
              )}
          </div>

          <div className="space-y-16 animate-fade-in">
              {categories.length > 0 ? (
                  categories.map(category => (
                      <section key={category} className="scroll-mt-24">
                          <div className="flex items-center gap-4 mb-8">
                             <div className="h-10 w-2 bg-blue-500 rounded-full"></div>
                             <h2 className="text-3xl font-bold text-gray-900">{category}</h2>
                          </div>

                          <div className="grid grid-cols-1 gap-8">
                              {groupedMinistries[category].map((ministry) => {
                                  // Fallback for image: coverImage or first image in old array
                                  const displayImage = ministry.coverImage || (ministry.images && ministry.images.length > 0 ? ministry.images[0].url : null);

                                  return (
                                  <div key={ministry.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
                                      
                                      {/* Main Body: Image + Content Side-by-Side on Desktop */}
                                      <div className={`flex flex-col ${displayImage ? 'md:flex-row' : ''}`}>
                                          
                                          {/* 1. Image Section */}
                                          {displayImage && (
                                              <div className="md:w-5/12 bg-gray-50 flex items-center justify-center relative min-h-[300px] md:min-h-full">
                                                  <img 
                                                      src={displayImage} 
                                                      alt={ministry.title} 
                                                      className="w-full h-full object-cover absolute inset-0 md:static md:object-cover" 
                                                      // Mobile: Absolute inset to fill fixed height. Desktop: Static to fill column height (flex stretch)
                                                      // Actually 'h-full object-cover' works if parent has height.
                                                      // Let's use simple responsive:
                                                      // Mobile: h-64 w-full object-cover.
                                                      // Desktop: w-full h-full object-cover (and parent flex stretch makes it match content height).
                                                  />
                                                  {/* Mobile/Desktop Image styling adjustment */}
                                                  <style jsx>{`
                                                    @media (max-width: 768px) {
                                                        img { position: absolute; height: 100%; top: 0; left: 0; }
                                                        .md\\:w-5\\/12 { height: 300px; display: block; }
                                                    }
                                                    @media (min-width: 769px) {
                                                        img { height: 100%; object-fit: cover; }
                                                    }
                                                  `}</style>
                                              </div>
                                          )}

                                          {/* 2. Content Section */}
                                          <div className={`p-8 flex flex-col ${displayImage ? 'md:w-7/12 border-l border-gray-50' : 'w-full'}`}>
                                              <div className="mb-6">
                                                  <div className="flex justify-between items-start gap-4">
                                                      <h3 className="text-2xl font-bold text-gray-900 leading-tight">{ministry.title}</h3>
                                                      
                                                      {/* Status & Edit - Visible on Desktop here. On Mobile maybe overlay image? 
                                                          Let's keep it simple: always here for consistency. 
                                                      */}
                                                      <div className="flex items-center gap-2 shrink-0">
                                                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                                              ministry.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                                          }`}>
                                                              {ministry.status}
                                                          </span>
                                                          {isAdmin && (
                                                              <Link href={`/admin/ministries/${ministry.id}/edit`} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                                                  <i className="fas fa-edit"></i>
                                                              </Link>
                                                          )}
                                                      </div>
                                                  </div>
                                                  
                                                  <div className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                                                     <i className="far fa-calendar-alt text-gray-400"></i>
                                                     <span>Added: {ministry.createdAt?.seconds ? new Date(ministry.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                                                  </div>
                                              </div>

                                              <div className="prose prose-blue max-w-none text-gray-600 whitespace-pre-line leading-relaxed flex-grow">
                                                  {ministry.description}
                                              </div>
                                          </div>
                                      </div>

                                      {/* 3. Prayer Needs Section - Full Width Footer */}
                                      {ministry.prayerNeeds && (
                                          <div className="bg-orange-50/50 border-t border-orange-100 p-6 md:p-8">
                                              <div className="flex items-start gap-4">
                                                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0 mt-1">
                                                      <i className="fas fa-pray"></i>
                                                  </div>
                                                  <div>
                                                      <h4 className="font-bold text-lg text-gray-900 mb-2">Prayer Needs</h4>
                                                      <div className="text-gray-700 whitespace-pre-line leading-relaxed italic">
                                                          {ministry.prayerNeeds}
                                                      </div>
                                                  </div>
                                              </div>
                                          </div>
                                      )}
                                  </div>
                                  );
                              })}
                          </div>
                      </section>
                  ))
              ) : (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                          <i className="fas fa-church text-4xl"></i>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">No Ministries Found</h3>
                      <p className="text-gray-500">{t('ministry.empty_message') || 'We have not added any ministries yet.'}</p>
                  </div>
              )}
          </div>
      </div>
    </main>
  );
}
