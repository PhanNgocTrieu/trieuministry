"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, where, doc, updateDoc, increment, setDoc, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { useModal } from '@/context/ModalContext';

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

interface IntercessionTarget {
  id: string;
  name: string;
  title?: string;
  description?: string;
  commitmentTime?: string;
  
  // Bilingual (Legacy/Future Compat)
  name_en?: string;
  name_vi?: string;
  
  status: 'active' | 'answered';
  prayerCount?: number;
  createdAt: any;
}

export default function MinistryPage() {
  const { t, language } = useLanguage();
  const { user, isAdmin } = useAuth();
  const { showAlert } = useModal();
  
  // Data States
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [intercessionTargets, setIntercessionTargets] = useState<IntercessionTarget[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<IntercessionTarget | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to get localized text with fallback
  const getLocalized = (obj: any, field: string) => {
    const langKey = `${field}_${language}`;
    // Prefer typed language field > opposite language field > generic field
    return obj[langKey] || obj[`${field}_en`] || obj[`${field}_vi`] || obj[field] || '';
  };

  useEffect(() => {
    // Fetch Intercession Targets (Active Only)
    const qIntercession = query(collection(db, "intercession_targets"), where("status", "==", "active"), orderBy("createdAt", "desc"));
    const unsubscribeIntercession = onSnapshot(qIntercession, (snapshot) => {
      const list: IntercessionTarget[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as IntercessionTarget);
      });
      setIntercessionTargets(list);
    });

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
      unsubscribeIntercession();
    };
  }, []);

  // Filter Ministries based on visibility
  const filteredMinistries = ministries.filter(m => {
    if (m.visibility === 'public') return true;
    if (isAdmin) return true; 
    if (m.visibility === 'shared' && user?.email && m.sharedWith?.includes(user.email)) {
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

  const handlePray = async (targetId: string, targetName: string) => {
      try {
          // 1. Increment Global Counter (Admin Only)
          if (isAdmin) {
              const targetRef = doc(db, "intercession_targets", targetId);
              await updateDoc(targetRef, {
                  prayerCount: increment(1)
              });
          }

          // 2. If User Logged In -> Update Discipline Calendar
          if (user) {
              const todayStr = format(new Date(), 'yyyy-MM-dd');
              const logId = `${user.uid}_${todayStr}_intercession`;
              
              await setDoc(doc(db, "discipline_logs", logId), {
                  userId: user.uid,
                  date: todayStr,
                  type: 'intercession',
                  completed: true,
                  updatedAt: serverTimestamp()
              }, { merge: true });

              showAlert("Amen!", `You prayed for "${targetName}". Marked in your calendar.`);
          } else {
             showAlert("Amen!", `Please login to track your prayer journey.`);
          }

      } catch (error) {
          console.error("Error logging prayer:", error);
      }
  };

  return (
    <main className="bg-gray-50 min-h-screen font-sans">
      
      {/* SECTION 1: MINISTRY UPDATES (White Background) */}
      <section className="bg-white pb-20 pt-32">
        <div className="container container-custom">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <span className="text-blue-600 font-bold tracking-wider uppercase text-sm mb-2 block">Our Work & Mission</span>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                        {t('nav.ministry')}
                    </h1>
                    <p className="text-xl text-gray-500 mt-4 max-w-2xl">
                         {t('ministry.hero.subtitle')}
                    </p>
                </div>
                {isAdmin && (
                    <Link href="/admin/ministries/create?returnUrl=/ministry" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">
                        <i className="fas fa-plus"></i>
                        <span>Add Ministry</span>
                    </Link>
                )}
            </div>

            <div className="space-y-16">
               {categories.length > 0 ? (
                   categories.map(category => (
                       <div key={category}>
                           <div className="flex items-center gap-4 mb-8">
                              <div className="h-10 w-2 bg-blue-500 rounded-full"></div>
                              <h2 className="text-3xl font-bold text-gray-900">{category}</h2>
                           </div>

                           <div className="grid grid-cols-1 gap-8">
                               {groupedMinistries[category].map((ministry) => {
                                   const displayImage = ministry.coverImage || (ministry.images && ministry.images.length > 0 ? ministry.images[0].url : null);
                                   const title = getLocalized(ministry, 'title');
                                   const description = getLocalized(ministry, 'description');
                                   const prayerNeeds = getLocalized(ministry, 'prayerNeeds');

                                   return (
                                   <div key={ministry.id} className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col group">
                                       <div className={`flex flex-col ${displayImage ? 'md:flex-row' : ''}`}>
                                           {displayImage && (
                                               <div className="md:w-5/12 bg-gray-200 relative min-h-[300px] overflow-hidden">
                                                   <img 
                                                       src={displayImage} 
                                                       alt={title} 
                                                       className="w-full h-full object-cover absolute inset-0 transition-transform duration-700 group-hover:scale-105" 
                                                   />
                                               </div>
                                           )}
                                           <div className={`p-8 flex flex-col ${displayImage ? 'md:w-7/12' : 'w-full'}`}>
                                               <div className="mb-6">
                                                   <div className="flex justify-between items-start gap-4">
                                                       <h3 className="text-2xl font-bold text-gray-900 leading-tight">{title}</h3>
                                                       <div className="flex items-center gap-2 shrink-0">
                                                           {ministry.status !== 'active' && (
                                                               <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                                                   ministry.status === 'completed' ? 'bg-gray-200 text-gray-600' : 'bg-yellow-100 text-yellow-700'
                                                               }`}>
                                                                   {ministry.status}
                                                               </span>
                                                           )}
                                                           {isAdmin && (
                                                               <Link href={`/admin/ministries/${ministry.id}/edit`} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors">
                                                                   <i className="fas fa-edit"></i>
                                                               </Link>
                                                           )}
                                                       </div>
                                                   </div>
                                                   <div className="text-sm text-gray-400 mt-2">
                                                      Added: {ministry.createdAt?.seconds ? new Date(ministry.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                                   </div>
                                               </div>
                                               <div className="prose prose-blue max-w-none text-gray-600 whitespace-pre-line leading-relaxed flex-grow">
                                                   {description}
                                               </div>
                                           </div>
                                       </div>
                                       {prayerNeeds && (
                                           <div className="bg-white border-t border-gray-100 p-6 md:p-8">
                                               <div className="flex items-start gap-4">
                                                   <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0 mt-1">
                                                       <i className="fas fa-pray text-sm"></i>
                                                   </div>
                                                   <div>
                                                       <h4 className="font-bold text-base text-gray-900 mb-1">Prayer Needs</h4>
                                                       <div className="text-gray-600 whitespace-pre-line text-sm italic">
                                                           {prayerNeeds}
                                                       </div>
                                                   </div>
                                               </div>
                                           </div>
                                       )}
                                   </div>
                                   );
                               })}
                           </div>
                       </div>
                   ))
               ) : (
                   <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                       <i className="fas fa-church text-4xl text-gray-300 mb-4"></i>
                       <p className="text-gray-500 font-medium">No ministry updates yet.</p>
                   </div>
               )}
            </div>
        </div>
      </section>

      {/* SECTION 2: INTERCESSORY PRAYER (Distinct Darker/Colored Background) */}
      <section className="bg-slate-900 py-24 text-white relative">
          <div className="container container-custom">
             <div className="max-w-4xl mb-12">
                 <span className="text-purple-400 font-bold tracking-wider uppercase text-sm mb-2 block">Join Us In Prayer</span>
                 <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
                     Intercessory Focus
                 </h2>
                 <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
                     We are standing in the gap for these specific needs. Click a card to read more and pray.
                 </p>
                 <div className="mt-8 h-1 w-20 bg-purple-500 rounded-full"></div>
             </div>

             {intercessionTargets.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {intercessionTargets.map(target => {
                         const targetName = getLocalized(target, 'name');
                         return (
                         <div 
                             key={target.id} 
                             onClick={() => setSelectedTarget(target)}
                             className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 hover:bg-slate-800 hover:border-purple-500/50 transition-all group cursor-pointer active:scale-95"
                         >
                             {/* Commitment Time Badge */}
                             {target.commitmentTime && (
                                 <div className="absolute top-0 right-0 bg-slate-700/60 px-3 py-1.5 rounded-bl-xl border-l border-b border-slate-600/50 flex items-center gap-2">
                                     <i className="fas fa-clock text-purple-400 text-xs"></i>
                                     <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">{target.commitmentTime}</span>
                                 </div>
                             )}

                             <div className="flex items-start gap-4 mt-2">
                                 <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                                     <i className="fas fa-praying-hands text-xl"></i>
                                 </div>
                                 <div className="flex-1">
                                     {/* Name / Group */}
                                     <h4 className="text-lg font-bold text-white mb-1 leading-tight">{targetName}</h4>
                                     
                                     {/* Title / Topic */}
                                     {target.title && (
                                         <p className="text-purple-300 font-medium text-sm mb-3">{target.title}</p>
                                     )}

                                     <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-slate-700/50">
                                         <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-purple-400 transition-colors">
                                             <span className="w-1.5 h-1.5 rounded-full bg-slate-500 group-hover:bg-purple-400"></span>
                                             Read Request
                                         </div>
                                         <div className="flex items-center gap-1.5 text-slate-400">
                                             <span className="text-xs font-bold text-white">{target.prayerCount || 0}</span>
                                             <span className="text-[10px] uppercase font-bold text-slate-500">prayers</span>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         </div>
                         );
                     })}
                 </div>
             ) : (
                 <div className="text-center py-16 border border-dashed border-slate-700 rounded-3xl bg-slate-800/20">
                     <p className="text-slate-500">No active intercession targets at the moment.</p>
                 </div>
             )}
          </div>
      </section>

      {/* Detail Modal */}
      {selectedTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedTarget(null)}></div>
            <div className="bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-700 relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 md:p-8 border-b border-slate-700/50 bg-slate-800/50">
                    <button 
                        onClick={() => setSelectedTarget(null)}
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                    >
                        <i className="fas fa-times"></i>
                    </button>

                    <div className="flex gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white shadow-lg shrink-0">
                            <i className="fas fa-praying-hands text-2xl"></i>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                                    Prayer Request
                                </span>
                                {selectedTarget.commitmentTime && (
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                        <i className="fas fa-clock text-[10px]"></i> {selectedTarget.commitmentTime}
                                    </span>
                                )}
                            </div>
                            <h3 className="text-2xl font-bold text-white leading-tight">{selectedTarget.name}</h3>
                            {selectedTarget.title && <p className="text-lg text-purple-200 mt-1">{selectedTarget.title}</p>}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                        <p className="whitespace-pre-line text-lg leading-relaxed text-slate-200">
                            {selectedTarget.description || "No specific details provided. Please pray as led by the Spirit."}
                        </p>
                    </div>
                    
                    <div className="mt-8 flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                        <div className="text-slate-400 text-sm">
                            Current Prayers: <span className="text-white font-bold">{selectedTarget.prayerCount || 0}</span>
                        </div>
                        <div className="text-slate-500 text-xs">
                            Posted: {selectedTarget.createdAt?.seconds ? new Date(selectedTarget.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}
                        </div>
                    </div>
                </div>

                {/* Footer / Actions */}
                <div className="p-6 border-t border-slate-700/50 bg-slate-800/30 flex justify-end gap-3">
                    <button 
                        onClick={() => setSelectedTarget(null)}
                        className="px-6 py-3 rounded-xl font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                    >
                        Close
                    </button>
                    {isAdmin ? (
                        <button 
                            onClick={() => {
                                handlePray(selectedTarget.id, selectedTarget.name);
                                setSelectedTarget(null);
                            }}
                            className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-500/20 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <i className="fas fa-check"></i> Pray & Log
                        </button>
                    ) : (
                        <button 
                             onClick={() => handlePray(selectedTarget.id, selectedTarget.name)}
                             className="px-6 py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-all active:scale-95 flex items-center gap-2"
                        >
                             <i className="fas fa-heart"></i> I Prayed
                        </button>
                    )}
                </div>

            </div>
        </div>
      )}

    </main>
  );
}
