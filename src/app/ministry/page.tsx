"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
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
}

export default function MinistryPage() {
  const { t } = useLanguage();
  const { user, isAdmin } = useAuth();
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [personalPrayers, setPersonalPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPrayerModalOpen, setIsPrayerModalOpen] = useState(false);

  useEffect(() => {
    const qMinistries = query(collection(db, "ministries"), orderBy("createdAt", "desc"));
    const unsubscribeMinistries = onSnapshot(qMinistries, (snapshot) => {
      const list: Ministry[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Ministry);
      });
      setMinistries(list);
    });

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

    setLoading(false);

    return () => {
      unsubscribeMinistries();
      unsubscribePrayers();
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

  return (
    <main className="bg-gray-50 min-h-screen">
      <AddPrayerModal 
          isOpen={isPrayerModalOpen} 
          onClose={() => setIsPrayerModalOpen(false)} 
      />

      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/pattern.png')] opacity-10"></div>
        <div className="container container-custom text-center relative z-10 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('ministry.hero.title')}</h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
            {t('ministry.hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-12">
        <div className="container container-custom">
            {/* Admin Controls Header */}
            {isAdmin && (
                <div className="flex justify-end gap-3 mb-8">
                    <button 
                        onClick={() => setIsPrayerModalOpen(true)}
                        className="px-4 py-2 bg-white text-blue-600 text-sm font-bold rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors shadow-sm"
                    >
                        <i className="fas fa-plus mr-2"></i>
                        {t('ministry.personal_prayers.btn_add')}
                    </button>
                    <Link href="/admin/ministries/create" className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                        <i className="fas fa-plus mr-2"></i>
                        {t('ministry.letters.btn_add') || 'Add Ministry'}
                    </Link>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Sidebar: Personal Prayers (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <i className="fas fa-praying-hands text-blue-500"></i>
                                {t('ministry.personal_prayers.title') || 'Personal Prayers'}
                            </h3>
                            {isAdmin && (
                                <button 
                                    onClick={() => setIsPrayerModalOpen(true)}
                                    className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors"
                                    title="Add Prayer"
                                >
                                    <i className="fas fa-plus text-xs"></i>
                                </button>
                            )}
                        </div>
                        
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {personalPrayers.length > 0 ? (
                                personalPrayers.map((prayer) => (
                                    <div key={prayer.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-400">
                                        {prayer.title && <h5 className="font-bold text-gray-800 text-sm mb-1">{prayer.title}</h5>}
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-gray-500">{prayer.name || 'Admin'}</span>
                                            <small className="text-xs text-gray-400">
                                                {prayer.createdAt?.seconds ? new Date(prayer.createdAt.seconds * 1000).toLocaleDateString() : ''}
                                            </small>
                                        </div>
                                        <p className="text-gray-600 text-sm whitespace-pre-line italic">"{prayer.content}"</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-gray-400">
                                    <p className="text-sm">No personal requests yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Main Content: Ministries (8 cols) */}
                <div className="lg:col-span-8 space-y-8">
                     <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-1 bg-blue-600 rounded-full"></div>
                        <h2 className="text-2xl font-bold text-gray-900">{t('ministry.letters.title') || 'Ministries'}</h2>
                     </div>

                    {filteredMinistries.length > 0 ? (
                        filteredMinistries.map((ministry) => (
                            <div key={ministry.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">
                                {/* Header */}
                                <div className="p-6 border-b border-gray-50 flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-2xl font-bold text-gray-800">{ministry.title}</h3>
                                            <span className={`px-2 py-0.5 rounded textxs font-bold uppercase ${
                                                ministry.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {ministry.status}
                                            </span>
                                            {isAdmin && (
                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase border ${
                                                    ministry.visibility === 'public' ? 'bg-green-50 text-green-700 border-green-100' :
                                                    ministry.visibility === 'private' ? 'bg-red-50 text-red-700 border-red-100' :
                                                    'bg-blue-50 text-blue-700 border-blue-100'
                                                }`}>
                                                    {ministry.visibility}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-500 flex items-center gap-4">
                                            <span><i className="far fa-calendar-alt mr-1"></i> {ministry.createdAt?.seconds ? new Date(ministry.createdAt.seconds * 1000).toLocaleDateString() : ''}</span>
                                            <span><i className="fas fa-user-circle mr-1"></i> Trieu Ministry</span>
                                        </div>
                                    </div>
                                    {isAdmin && (
                                        <Link href={`/admin/ministries/${ministry.id}/edit`} className="text-gray-400 hover:text-blue-600">
                                            <i className="fas fa-edit"></i>
                                        </Link>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <div className="prose prose-blue max-w-none text-gray-600 mb-6 whitespace-pre-line">
                                        {ministry.description}
                                    </div>

                                    {/* Gallery */}
                                    {ministry.images && ministry.images.length > 0 && (
                                        <div className="mt-6">
                                            <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Gallery</h4>
                                            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                                                {ministry.images.map((img, idx) => (
                                                    <div key={idx} className="flex-none w-72 snap-start group relative">
                                                        <div className="aspect-video rounded-lg overflow-hidden border border-gray-200">
                                                            <img src={img.url} alt={img.caption || `Image ${idx + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                        </div>
                                                        {img.caption && (
                                                            <p className="text-xs text-gray-500 mt-2 font-medium">
                                                                <i className="fas fa-info-circle mr-1 text-blue-400"></i>
                                                                {img.caption}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                            <i className="fas fa-folder-open text-4xl text-gray-300 mb-4"></i>
                            <p className="text-gray-500">No ministries found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </section>
    </main>
  );
}
