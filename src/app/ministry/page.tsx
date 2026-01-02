"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import AddPrayerModal from '@/components/AddPrayerModal';

interface Ministry {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'on-hold';
  visibility: 'public' | 'private' | 'shared';
  sharedWith?: string[];
  images?: { url: string; caption: string }[];
  createdAt: any;
}

interface Prayer {
  id: string;
  title?: string; 
  content: string;
  name?: string;
  date?: string;
  createdAt: any;
  type?: 'personal' | 'community';
  prayerCount?: number;
  status?: string;
}

// Interfaces defined correctly above


interface Appeal {
    id: string;
    title: string;
    content: string;
    coverImage?: string;
    authorName?: string;
    authorId?: string;
    createdAt: any;
    status: 'published' | 'draft' | 'archived';
    type: 'urgent' | 'update' | 'thank_you' | 'general';
}

type TabType = 'ministries' | 'prayers' | 'appeals';

export default function MinistryPage() {
  const { t } = useLanguage();
  const { user, isAdmin } = useAuth();
  
  // Data States
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [personalPrayers, setPersonalPrayers] = useState<Prayer[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('ministries');
  const [isPrayerModalOpen, setIsPrayerModalOpen] = useState(false);

  const handlePrayClick = async (id: string) => {
     try {
         const prayerRef = doc(db, 'prayers', id);
         await updateDoc(prayerRef, {
             prayerCount: increment(1),
             status: 'prayed' // Auto update status to prayed if not already
         });
     } catch (error) {
         console.error("Error praying", error);
     }
  };

  useEffect(() => {
    // 1. Fetch Ministries
    const qMinistries = query(collection(db, "ministries"), orderBy("createdAt", "desc"));
    const unsubscribeMinistries = onSnapshot(qMinistries, (snapshot) => {
      const list: Ministry[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Ministry);
      });
      setMinistries(list);
    });

    // 2. Fetch Prayers (Personal)
    const qPrayers = query(
        collection(db, "prayers"), 
        where("type", "==", "personal"),
        orderBy("createdAt", "desc")
    );
    const unsubscribePrayers = onSnapshot(qPrayers, (snapshot) => {
      const list: Prayer[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Prayer);
      });
      setPersonalPrayers(list);
    }, (error) => {
        console.error("Error fetching prayers:", error);
    });
    
    // 3. Fetch Appeals (Ministry Appeals - User Submitted)
    const qAppeals = query(
        collection(db, "appeals"), 
        where("type", "==", "user_request"),
        where("status", "==", "published"), 
        orderBy("createdAt", "desc")
    );
    const unsubscribeAppeals = onSnapshot(qAppeals, (snapshot) => {
        const list: Appeal[] = [];
        snapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() } as Appeal);
        });
        setAppeals(list);
    });

    setLoading(false);

    return () => {
      unsubscribeMinistries();
      unsubscribePrayers();
      unsubscribeAppeals();
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

  const sidebarItems = [
      { id: 'ministries', label: t('ministry.letters.title') || 'Ministries', icon: 'fas fa-church' },
      { id: 'prayers', label: t('ministry.personal_prayers.title') || 'Personal Prayers', icon: 'fas fa-praying-hands' },
      { id: 'appeals', label: t('nav.appeals') || 'Call for Support', icon: 'fas fa-hand-holding-heart' },
  ];

  return (
    <main className="bg-gray-50 min-h-screen pb-20 font-sans">
      <AddPrayerModal 
          isOpen={isPrayerModalOpen} 
          onClose={() => setIsPrayerModalOpen(false)} 
      />

      {/* Unified Container for Consistent Spacing - Adjusted for perfect balance */}
      <div className="container container-custom pb-20" style={{ paddingTop: '40px' }}>
          {/* Header Section */}
          <div className="max-w-4xl mb-20 md:mb-24">
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
                  {t('nav.ministry')}
              </h1>
              <p className="text-xl text-gray-500 leading-relaxed max-w-3xl">
                  {t('ministry.hero.subtitle')}
              </p>
              <div className="mt-8 h-1 w-20 bg-blue-600 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              {/* Left Sidebar */}
              <div className="lg:col-span-3">
                  <div>
                      <nav className="space-y-4">
                          {sidebarItems.map((item) => (
                              <button
                                  key={item.id}
                                  onClick={() => setActiveTab(item.id as TabType)}
                                  className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl font-bold transition-all duration-300 text-left shadow-sm ${
                                      activeTab === item.id
                                          ? 'bg-blue-600 text-white shadow-blue-200 shadow-lg scale-105'
                                          : 'bg-white text-gray-500 hover:bg-white hover:text-blue-600 hover:shadow-md'
                                  }`}
                              >
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                                      activeTab === item.id ? 'bg-white/20' : 'bg-gray-50 text-gray-400 group-hover:bg-blue-50'
                                  }`}>
                                      <i className={`${item.icon} text-lg`}></i>
                                  </div>
                                  <span className="text-base tracking-wide">{item.label}</span>
                              </button>
                          ))}
                      </nav>
                  </div>
              </div>

              {/* Right Content */}
              <div className="lg:col-span-9">
                  {/* Tab: Ministries */}
                  {activeTab === 'ministries' && (
                      <div className="space-y-8 animate-fade-in">
                          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 w-full flex items-center justify-between mb-6">
                              <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl">
                                      <i className="fas fa-church"></i>
                                  </div>
                                  <div>
                                       <h2 className="text-xl font-bold text-gray-900">{t('ministry.letters.title') || 'Ministries'}</h2>
                                       <p className="text-sm text-gray-600">Explore our ministry outreach.</p>
                                  </div>
                              </div>
                              {isAdmin && (
                                  <Link href="/admin/ministries/create?returnUrl=/ministry" className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition-all active:scale-95 flex items-center gap-2">
                                      <i className="fas fa-plus"></i>
                                      <span>Add Ministry</span>
                                  </Link>
                              )}
                          </div>

                          {filteredMinistries.length > 0 ? (
                              <div className="grid grid-cols-1 gap-8">
                                  {filteredMinistries.map((ministry) => (
                                      <div key={ministry.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                          <div className="p-6">
                                              <div className="flex justify-between items-start mb-4">
                                                  <div>
                                                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{ministry.title}</h3>
                                                      <div className="flex items-center gap-2 text-sm">
                                                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                                                              ministry.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                                          }`}>
                                                              {ministry.status}
                                                          </span>
                                                          <span className="text-gray-400">•</span>
                                                          <span className="text-gray-500">
                                                              {ministry.createdAt?.seconds ? new Date(ministry.createdAt.seconds * 1000).toLocaleDateString() : ''}
                                                          </span>
                                                      </div>
                                                  </div>
                                                  {isAdmin && (
                                                      <Link href={`/admin/ministries/${ministry.id}/edit`} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                                          <i className="fas fa-edit"></i>
                                                      </Link>
                                                  )}
                                              </div>

                                              <div className="prose prose-blue max-w-none text-gray-600 mb-6 whitespace-pre-line">
                                                  {ministry.description}
                                              </div>

                                              {/* Gallery */}
                                              {ministry.images && ministry.images.length > 0 && (
                                                  <div>
                                                      <h4 className="font-bold text-gray-800 mb-3 text-xs uppercase tracking-wide opacity-70">
                                                          <i className="fas fa-images mr-2"></i>Gallery
                                                      </h4>
                                                      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                                                          {ministry.images.map((img, idx) => (
                                                              <div key={idx} className="flex-none w-64 snap-start relative group rounded-lg overflow-hidden border border-gray-200">
                                                                  <div className="aspect-video bg-gray-100">
                                                                      <img src={img.url} alt={img.caption || `Image ${idx + 1}`} className="w-full h-full object-cover" />
                                                                  </div>
                                                                  {img.caption && (
                                                                      <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/70 to-transparent text-white text-xs truncate">
                                                                          {img.caption}
                                                                      </div>
                                                                  )}
                                                              </div>
                                                          ))}
                                                      </div>
                                                  </div>
                                              )}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          ) : (
                              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
                                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                      <i className="fas fa-church text-2xl"></i>
                                  </div>
                                  <p className="text-gray-500 font-medium">No ministries found.</p>
                              </div>
                          )}
                      </div>
                  )}

                  {/* Tab: Personal Prayers */}
                  {activeTab === 'prayers' && (
                      <div className="space-y-6 animate-fade-in">
                          <div className="flex justify-between items-center mb-6">
                              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 w-full flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xl">
                                          <i className="fas fa-pray"></i>
                                      </div>
                                      <div>
                                          <h2 className="text-xl font-bold text-gray-900">{t('ministry.personal_prayers.title') || 'Personal Prayers'}</h2>
                                          <p className="text-sm text-gray-600">prayer requests in ministries</p>
                                      </div>
                                  </div>
                                  {isAdmin && (
                                      <button 
                                          onClick={() => setIsPrayerModalOpen(true)}
                                          className="px-5 py-2.5 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 shadow-md transition-all active:scale-95"
                                      >
                                          <i className="fas fa-plus mr-2"></i>
                                          {t('ministry.personal_prayers.btn_add') || 'Add Request'}
                                      </button>
                                  )}
                              </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {personalPrayers.length > 0 ? (
                                  personalPrayers.map((prayer) => (
                                      <div key={prayer.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                                          <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
                                          
                                          <div className="flex items-center justify-between mb-3">
                                              <span className="text-sm font-bold text-gray-800 bg-gray-50 px-2 py-1 rounded">
                                                  {prayer.name || 'Anonymous'}
                                              </span>
                                              <span className="text-xs text-gray-400 font-mono">
                                                  {prayer.createdAt?.seconds ? new Date(prayer.createdAt.seconds * 1000).toLocaleDateString() : ''}
                                              </span>
                                          </div>
                                          
                                          {prayer.title && (
                                              <h5 className="font-bold text-gray-900 mb-2 line-clamp-1">{prayer.title}</h5>
                                          )}
                                          
                                          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line italic mb-4">
                                              "{prayer.content}"
                                          </p>

                                          <div className="flex justify-end pt-2 border-t border-gray-50">
                                              <button 
                                                  onClick={() => handlePrayClick(prayer.id)}
                                                  className="text-xs font-bold text-orange-600 flex items-center gap-1 hover:underline transition-all active:scale-95"
                                              >
                                                  <i className="fas fa-praying-hands"></i> 
                                                  Pray {prayer.prayerCount ? `(${prayer.prayerCount})` : ''}
                                              </button>
                                          </div>
                                      </div>
                                  ))
                              ) : (
                                  <div className="col-span-2 text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
                                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                          <i className="fas fa-praying-hands text-2xl"></i>
                                      </div>
                                      <p className="text-gray-500">No personal prayer requests yet.</p>
                                  </div>
                              )}
                          </div>
                      </div>
                  )}

                  {/* Tab: Appeal Letters (Call for Support) */}
                  {activeTab === 'appeals' && (
                      <div className="space-y-8 animate-fade-in">
                          <div className="bg-red-50 p-4 rounded-xl border border-red-100 w-full flex items-center justify-between mb-6">
                              <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xl">
                                      <i className="fas fa-hand-holding-heart"></i>
                                  </div>
                                  <div>
                                      <h2 className="text-xl font-bold text-gray-900">{t('nav.appeals') || 'Call for Support'}</h2>
                                       <p className="text-sm text-gray-600">Support our mission and projects.</p>
                                  </div>
                              </div>
                              {isAdmin && (
                                  <Link href="/admin/appeals/create" className="px-5 py-2.5 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-all active:scale-95 shadow-md flex items-center gap-2">
                                      <i className="fas fa-plus"></i>
                                      <span>New Appeal</span>
                                  </Link>
                              )}
                          </div>

                            <div className="space-y-6">
                                {appeals.length > 0 ? (
                                    appeals.map((appeal) => (
                                        <article key={appeal.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col md:flex-row hover:shadow-lg transition-all duration-300 group">
                                            {appeal.coverImage && (
                                                <div className="md:w-1/3 relative h-48 md:h-auto overflow-hidden">
                                                    <Image 
                                                        src={appeal.coverImage} 
                                                        alt={appeal.title} 
                                                        fill
                                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                </div>
                                            )}
                                            
                                            <div className={`p-6 flex flex-col justify-center ${appeal.coverImage ? 'md:w-2/3' : 'w-full'}`}>
                                                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">
                                                    <span className="text-blue-600"><i className="far fa-calendar-alt mr-1"></i>{appeal.createdAt?.seconds ? new Date(appeal.createdAt.seconds * 1000).toLocaleDateString() : ''}</span>
                                                    <span>•</span>
                                                    <span>{appeal.authorName || 'Admin'}</span>
                                                </div>
                                                
                                                <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight group-hover:text-blue-600 transition-colors">
                                                    <Link href={`/appeals/${appeal.id}`}>
                                                        {appeal.title}
                                                    </Link>
                                                </h3>
                                                
                                                <div 
                                                    className="prose prose-sm text-gray-500 mb-4 line-clamp-2"
                                                    dangerouslySetInnerHTML={{ __html: (appeal.content || '').replace(/<[^>]+>/g, '') }}
                                                />
                                                
                                                <div className="mt-auto">
                                                    <Link 
                                                        href={`/appeals/${appeal.id}`}
                                                        className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 group/link"
                                                    >
                                                        {t('common.read_more') || 'Read Full Letter'}
                                                        <i className="fas fa-arrow-right transform group-hover/link:translate-x-1 transition-transform text-xs"></i>
                                                    </Link>
                                                </div>
                                            </div>
                                        </article>
                                    ))
                                ) : (
                                    <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                            <i className="fas fa-hand-holding-heart text-2xl"></i>
                                        </div>
                                        <p className="text-gray-500">No active calls for support at this time.</p>
                                    </div>
                                )}
                            </div>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </main>
  );
}
