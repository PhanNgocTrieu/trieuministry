"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, where } from 'firebase/firestore';
import CreateAppealModal from '@/components/CreateAppealModal';
import { useModal } from '@/context/ModalContext';

interface Appeal {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  imageUrl?: string;
  endDate?: any;
  status: 'active' | 'completed' | 'urgent';
  createdAt: any;
}

export default function DonatePage() {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  const { showConfirm, showAlert } = useModal();
  
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    // Filter out 'official' appeals (Ministry Updates)
    const q = query(
        collection(db, "appeals"), 
        where("type", "!=", "official"),
        orderBy("type"), 
        orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Appeal[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Appeal);
      });
      setAppeals(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDeleteAppeal = async (id: string) => {
    showConfirm(
      "Delete Appeal", 
      "Are you sure you want to delete this appeal? This action cannot be undone.",
      async () => {
        try {
          await deleteDoc(doc(db, "appeals", id));
          showAlert("Success", "Appeal deleted successfully.");
        } catch (error) {
          console.error("Error deleting appeal:", error);
          showAlert("Error", "Failed to delete appeal.");
        }
      },
      true, // isDestructive
      "Delete"
    );
  };

  const calculateProgress = (current: number, target: number) => {
      if (target === 0) return 0;
      const progress = (current / target) * 100;
      return Math.min(100, progress); // Cap at 100%
  };

  return (
    <main className="bg-white dark:bg-slate-950 min-h-screen font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">
      
      {/* SECTION 1: HERO & BANK DETAILS */}
      <section className="relative pt-32 pb-24 overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
         {/* Background Gradients */}
         <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-violet-500/10 dark:bg-violet-600/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="container container-custom relative z-10">
           <div className="flex flex-col lg:flex-row items-center gap-16">
               <div className="lg:w-1/2">
                   <span className="inline-block px-4 py-1.5 rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 text-sm font-bold mb-6 border border-violet-200 dark:border-violet-500/30">
                       <i className="fas fa-heart mr-2 text-rose-500"></i> {t('donate.hero.badge') || "Support The Mission"}
                   </span>
                   <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
                       {t('donate.hero.title')}
                   </h1>
                   <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
                       {t('donate.hero.subtitle')}
                   </p>
                   
                   <blockquote className="border-l-4 border-violet-500 pl-6 py-2 italic text-slate-700 dark:text-slate-300 text-lg mb-10 bg-gradient-to-r from-violet-50/50 to-transparent dark:from-violet-900/10 rounded-r-xl">
                       "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver."
                       <span className="block text-sm font-bold text-violet-600 dark:text-violet-400 mt-2 not-italic font-sans">— 2 Corinthians 9:7</span>
                   </blockquote>
               </div>

               {/* Bank Card */}
               <div className="lg:w-1/2 w-full">
                   <div className="premium-glass-panel p-8 md:p-10 rounded-[2.5rem] relative overflow-hidden transform hover:scale-[1.02] transition-transform duration-500">
                        {/* Card Glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/20 rounded-full blur-[80px]"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                            <div className="w-full md:w-1/2">
                                <div className="bg-white p-4 rounded-3xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/5 mb-6 md:mb-0">
                                   {/* QR Code Placeholder - In production replace with real image */}
                                    <div className="aspect-square bg-slate-100 rounded-2xl flex items-center justify-center relative overflow-hidden">
                                        <Image 
                                            src="/donate/personal_qr.jpg" 
                                            alt="QR Code" 
                                            fill 
                                            className="object-cover"
                                            onError={(e) => {
                                                // Fallback if image missing
                                                e.currentTarget.style.display = 'none';
                                            }} 
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                                            <i className="fas fa-qrcode text-6xl"></i>
                                        </div>
                                    </div>
                                    <p className="text-center text-xs font-bold text-slate-400 uppercase mt-2 tracking-widest">Scan to Give</p>
                                </div>
                            </div>
                            
                            <div className="w-full md:w-1/2 space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Bank Name</label>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <i className="fas fa-university text-violet-600 dark:text-violet-400"></i> MB Bank
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Account Number</label>
                                    <div className="flex items-center gap-3">
                                        <p className="text-2xl font-mono font-bold text-slate-900 dark:text-white tracking-widest">0974210249</p>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText('0974210249');
                                                showAlert("Copied", "Account number copied to clipboard");
                                            }}
                                            className="text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                                            title="Copy"
                                        >
                                            <i className="far fa-copy"></i>
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Account Holder</label>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white uppercase">PHAN NGOC TRIEU</p>
                                </div>
                                
                                <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                                     <p className="text-sm text-slate-500 italic">
                                         * Note: Please include "Donation" or the appeal name in the transfer description.
                                     </p>
                                </div>
                            </div>
                        </div>
                   </div>
               </div>
           </div>
        </div>
      </section>

      {/* SECTION 2: APPEALS */}
      <section className="py-24 bg-white dark:bg-slate-950 transition-colors duration-500">
         <div className="container container-custom">
             <div className="flex justify-between items-end mb-16">
                 <div>
                     <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">Ministry <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">Appeals</span></h2>
                     <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
                         Specific projects and needs where your support can make a direct impact.
                     </p>
                 </div>
                 {isAdmin && (
                     <button 
                        onClick={() => setShowCreateModal(true)}
                        className="hidden md:inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-500/20 transition-all transform hover:-translate-y-1"
                     >
                         <i className="fas fa-plus"></i> Create Appeal
                     </button>
                 )}
             </div>

             {loading ? (
                 <div className="text-center py-20">
                     <div className="loading-spinner mb-4 mx-auto"></div>
                     <p className="text-slate-500">Loading appeals...</p>
                 </div>
             ) : appeals.length === 0 ? (
                 <div className="text-center py-24 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                     <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 dark:text-slate-600">
                         <i className="fas fa-hand-holding-usd text-4xl"></i>
                     </div>
                     <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Active Appeals</h3>
                     <p className="text-slate-500">Check back later for specific giving opportunities.</p>
                     {isAdmin && (
                         <button 
                            onClick={() => setShowCreateModal(true)}
                            className="mt-6 px-6 py-3 bg-violet-600 text-white font-bold rounded-xl"
                         >
                             Create First Appeal
                         </button>
                     )}
                 </div>
             ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                     {appeals.map(appeal => {
                         const progress = calculateProgress(appeal.currentAmount, appeal.targetAmount);
                         
                         return (
                             <div key={appeal.id} className="group premium-card flex flex-col h-full rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                                 {/* Image Header */}
                                 <div className="h-56 bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
                                     {appeal.imageUrl ? (
                                         <img 
                                             src={appeal.imageUrl} 
                                             alt={appeal.title} 
                                             className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                         />
                                     ) : (
                                         <div className="w-full h-full bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/40 dark:to-indigo-900/40 flex items-center justify-center text-violet-300 dark:text-violet-700">
                                             <i className="fas fa-gift text-5xl opacity-50"></i>
                                         </div>
                                     )}
                                     
                                     {/* Status Badge */}
                                     <div className="absolute top-4 right-4">
                                         <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ${
                                             appeal.status === 'urgent' 
                                                ? 'bg-rose-500 text-white' 
                                                : appeal.status === 'completed'
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-white/90 text-violet-600 backdrop-blur-sm'
                                         }`}>
                                             {appeal.status}
                                         </span>
                                     </div>
                                 </div>
                                 
                                 <div className="p-8 flex flex-col flex-1">
                                     <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 line-clamp-1" title={appeal.title}>
                                         {appeal.title}
                                     </h3>
                                     
                                     <div className="mb-6 space-y-2">
                                         <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
                                             <span>Raised: <span className="text-violet-600 dark:text-violet-400">{(appeal.currentAmount || 0).toLocaleString()} ₫</span></span>
                                             <span className="text-slate-400">Target: {(appeal.targetAmount || 0).toLocaleString()} ₫</span>
                                         </div>
                                         <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                             <div 
                                                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                                                style={{ width: `${progress}%` }}
                                             >
                                                <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
                                             </div>
                                         </div>
                                         <div className="text-right text-xs text-slate-400 font-bold">
                                             {progress.toFixed(0)}% Funded
                                         </div>
                                     </div>

                                     <p className="text-slate-600 dark:text-slate-400 mb-8 line-clamp-3 leading-relaxed flex-1">
                                         {appeal.description}
                                     </p>
                                     
                                     <div className="flex items-center gap-3 mt-auto">
                                         <button 
                                            className="flex-1 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition-opacity"
                                            onClick={() => {
                                                navigator.clipboard.writeText(`Donation for: ${appeal.title}`);
                                                showAlert("Success", "Appeal reference copied!");
                                            }}
                                         >
                                             Donate
                                         </button>
                                         
                                         {isAdmin && (
                                             <button 
                                                onClick={() => handleDeleteAppeal(appeal.id)}
                                                className="w-12 h-12 flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 text-slate-400 hover:text-rose-500 hover:border-rose-500 transition-colors"
                                                title="Delete Appeal"
                                             >
                                                 <i className="fas fa-trash-alt"></i>
                                             </button>
                                         )}
                                     </div>
                                 </div>
                             </div>
                         );
                     })}
                 </div>
             )}
         </div>
      </section>

      {isAdmin && showCreateModal && (
          <CreateAppealModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      )}

    </main>
  );
}
