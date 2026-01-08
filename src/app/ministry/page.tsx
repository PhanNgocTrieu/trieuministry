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
                                                       <h3 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight">{title}</h3>
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
                                                <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed flex-grow">
                                                    {description}
                                                </div>
                                           </div>
                                       </div>
                                        {prayerNeeds && (
                                            <div className="bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-white/5 p-6 md:p-8 backdrop-blur-sm">
                                               <div className="flex items-start gap-5">
                                                   <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0 mt-1 border border-orange-500/20">
                                                       <i className="fas fa-pray"></i>
                                                   </div>
                                                    <div>
                                                        <h4 className="font-bold text-base text-slate-900 dark:text-white mb-2">Prayer Needs</h4>
                                                        <div className="text-slate-600 dark:text-slate-400 whitespace-pre-line text-sm italic leading-relaxed">
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

      {/* SECTION 2: INTERCESSORY PRAYER */}
      <section className="bg-slate-950 py-24 text-white relative border-t border-white/5">
          {/* Subtle separator glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>

          <div className="container container-custom relative z-10">
             <div className="max-w-4xl mb-16">
                 <span className="text-purple-400 font-bold tracking-wider uppercase text-sm mb-2 block">Join Us In Prayer</span>
                 <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                     Intercessory Focus
                 </h2>
                 <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
                     We are standing in the gap for these specific needs. Click a card to read more and pray.
                 </p>
                 <div className="mt-8 h-1 w-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
             </div>

             {intercessionTargets.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {intercessionTargets.map(target => {
                         const targetName = getLocalized(target, 'name');
                         return (
                         <div 
                             key={target.id} 
                             onClick={() => setSelectedTarget(target)}
                             className="bg-slate-900/60 backdrop-blur-sm p-6 rounded-3xl border border-white/5 hover:bg-slate-800 hover:border-purple-500/50 transition-all group cursor-pointer active:scale-95 shadow-lg shadow-black/20"
                         >
                             {/* Commitment Time Badge */}
                             {target.commitmentTime && (
                                 <div className="absolute top-0 right-0 bg-slate-800/90 px-3 py-1.5 rounded-bl-2xl border-l border-b border-white/5 flex items-center gap-2 backdrop-blur-md">
                                     <i className="fas fa-clock text-purple-400 text-xs"></i>
                                     <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">{target.commitmentTime}</span>
                                 </div>
                             )}

                             <div className="flex items-start gap-4 mt-2">
                                 <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-110 group-hover:from-purple-600 group-hover:to-blue-600 group-hover:text-white transition-all duration-300 border border-white/5 group-hover:border-transparent group-hover:shadow-lg group-hover:shadow-purple-500/30">
                                     <i className="fas fa-praying-hands text-xl"></i>
                                 </div>
                                 <div className="flex-1">
                                     {/* Name / Group */}
                                     <h4 className="text-lg font-bold text-white mb-1 leading-tight group-hover:text-purple-300 transition-colors">{targetName}</h4>
                                     
                                     {/* Title / Topic */}
                                     {target.title && (
                                         <p className="text-slate-400 font-medium text-sm mb-3">{target.title}</p>
                                     )}

                                     <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-white/5">
                                         <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-purple-400 transition-colors">
                                             <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-purple-400 transition-colors"></span>
                                             Read Request
                                         </div>
                                         <div className="flex items-center gap-1.5 text-slate-400 bg-slate-800/50 px-2 py-1 rounded-md">
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
                 <div className="text-center py-16 border border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                     <p className="text-slate-500">No active intercession targets at the moment.</p>
                 </div>
             )}
          </div>
      </section>

      {/* Detail Modal */}
      {selectedTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedTarget(null)}></div>
            <div className="bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-700 relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn">
                
                {/* Header */}
                <div className="p-6 md:p-8 border-b border-white/10 bg-gradient-to-b from-slate-800 to-slate-900">
                    <button 
                        onClick={() => setSelectedTarget(null)}
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all border border-white/5"
                    >
                        <i className="fas fa-times"></i>
                    </button>

                    <div className="flex gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-purple-900/30 shrink-0">
                            <i className="fas fa-praying-hands text-2xl"></i>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/20">
                                    Prayer Request
                                </span>
                                {selectedTarget.commitmentTime && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-white/5">
                                        <i className="fas fa-clock text-[9px]"></i> {selectedTarget.commitmentTime}
                                    </span>
                                )}
                            </div>
                            <h3 className="text-2xl font-bold text-white leading-tight">{selectedTarget.name}</h3>
                            {selectedTarget.title && <p className="text-lg text-purple-200 mt-1 font-medium">{selectedTarget.title}</p>}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar bg-slate-900">
                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5 shadow-inner">
                        <p className="whitespace-pre-line text-lg leading-relaxed text-slate-300">
                            {selectedTarget.description || "No specific details provided. Please pray as led by the Spirit."}
                        </p>
                    </div>
                    
                    <div className="mt-8 flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                        <div className="text-slate-400 text-sm">
                            Current Prayers: <span className="text-white font-bold ml-1">{selectedTarget.prayerCount || 0}</span>
                        </div>
                        <div className="text-slate-500 text-xs font-mono">
                            Posted: {selectedTarget.createdAt?.seconds ? new Date(selectedTarget.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}
                        </div>
                    </div>
                </div>

                {/* Footer / Actions */}
                <div className="p-6 border-t border-white/10 bg-slate-800/50 flex justify-end gap-3 backdrop-blur-sm">
                    <button 
                        onClick={() => setSelectedTarget(null)}
                        className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-sm"
                    >
                        Close
                    </button>
                    {isAdmin ? (
                        <button 
                            onClick={() => {
                                handlePray(selectedTarget.id, selectedTarget.name);
                                setSelectedTarget(null);
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all active:scale-95 flex items-center gap-2 text-sm"
                        >
                            <i className="fas fa-check"></i> Pray & Log
                        </button>
                    ) : (
                        <button 
                             onClick={() => handlePray(selectedTarget.id, selectedTarget.name)}
                             className="px-6 py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-all active:scale-95 flex items-center gap-2 text-sm border border-white/5"
                        >
                             <i className="fas fa-heart text-pink-500"></i> I Prayed
                        </button>
                    )}
                </div>

            </div>
        </div>
      )}

    </main>
  );
}
