"use client";

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc, doc, increment } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

// Types
type Prayer = {
  id: string;
  author: string;
  userId?: string; // Optional for migration/guest
  content: string;
  date: string;
  status: 'not_prayed' | 'prayed' | 'answered';
  prayerCount: number;
  category?: string;
  action?: string;
  createdAt?: any;
  type?: string; // 'personal' | 'community'
};

import { useModal } from '@/context/ModalContext';

export default function PrayersPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { showAlert, showConfirm } = useModal();
  
  // Real Data State
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Subscribe to real-time updates
    const q = query(collection(db, 'prayers'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Prayer[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          author: data.userName || 'Unknown',
          userId: data.userId,
          content: data.content,
          date: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : 'N/A',
          status: data.status || 'not_prayed',
          prayerCount: data.prayerCount || 0,
          category: data.category || 'General',
          action: data.action,
          type: data.type
        } as Prayer);
      });
      setPrayers(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  // Derived Statistics
  // Filter out personal prayers first for statistics and listing
  const communityPrayers = prayers.filter(p => p.type !== 'personal');

  const stats = {
    total: communityPrayers.length,
    answered: communityPrayers.filter(p => p.status === 'answered').length,
    pending: communityPrayers.filter(p => p.status === 'not_prayed' || p.status === 'prayed').length
  };

  // Filtering Logic
  const filteredPrayers = communityPrayers.filter(prayer => {
     const matchesFilter = filter === 'all' || prayer.status === filter;
     const matchesSearch = prayer.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           prayer.author.toLowerCase().includes(searchTerm.toLowerCase());
     return matchesFilter && matchesSearch;
  });

  const handleAddClick = () => {
      if (!user) {
          showConfirm(
              "Login Required",
              "You need to be logged in to share a prayer request with the community.",
              () => router.push('/login'),
              false,
              "Go to Login",
              "Not Now"
          );
          return;
      }
      setShowModal(true);
  };

  const handleAddPrayer = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!user || !newContent.trim()) return;

     setIsSubmitting(true);
     try {
        await addDoc(collection(db, 'prayers'), {
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
            userAvatar: user.photoURL || '',
            content: newContent,
            category: newCategory,
            status: 'not_prayed',
            prayerCount: 0,
            createdAt: serverTimestamp()
        });
        
        setNewContent('');
        setShowModal(false);
        // Alert handled by UI, list auto updates via onSnapshot
        showAlert("Success", "Prayer request submitted successfully.");
     } catch (error) {
         console.error("Error adding prayer", error);
         showAlert("Error", "Failed to submit prayer. Please try again.");
     } finally {
         setIsSubmitting(false);
     }
  };

  const handlePrayClick = async (id: string, currentStatus: string) => {
     // Optimistic update could go here, but let's rely on fast Firestore
     try {
         const prayerRef = doc(db, 'prayers', id);
         const updates: any = {
             prayerCount: increment(1)
         };
         if (currentStatus === 'not_prayed') {
             updates.status = 'prayed';
         }
         await updateDoc(prayerRef, updates);
     } catch (error) {
         console.error("Error praying", error);
     }
  };

  return (
    <main className="bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
      {/* Hero Section */}
      <section className="bg-slate-50 dark:bg-slate-900 py-16 lg:py-20 border-b border-slate-200 dark:border-white/5 relative overflow-hidden transition-colors duration-500">
         {/* Premium Background */}
        <div className="absolute inset-0 bg-[radial-gradient(at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-purple-50/20 to-transparent dark:hidden opacity-100"></div>
        <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 z-0"></div>
        
         <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse"></div>
         <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]"></div>

         <div className="container container-custom relative z-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
               <div className="lg:w-7/12">
                   <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-3">
                      <i className="fas fa-praying-hands text-purple-600 dark:text-purple-500"></i>
                      {t('prayers.hero.title')}
                   </h1>
                   <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl">
                      {t('prayers.hero.subtitle')}
                   </p>
               </div>
               <div className="lg:w-auto">
                   <button 
                      onClick={handleAddClick}
                      className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-105 text-white rounded-full font-bold shadow-lg shadow-purple-900/20 transition-all flex items-center gap-3"
                   >
                      <i className="fas fa-plus"></i>
                      {t('prayers.hero.btn_add')}
                   </button>
               </div>
            </div>
         </div>
      </section>

      {/* Call for Donation for Ministries */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/5 py-12 relative overflow-hidden transition-colors duration-300">
        <div className="absolute inset-0 bg-blue-50/50 dark:bg-blue-600/10 opacity-20"></div>
        <div className="container container-custom relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
             <div className="lg:w-2/3">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 flex items-center gap-3 text-slate-900 dark:text-white">
                    <i className="fas fa-hand-holding-heart text-yellow-500 dark:text-yellow-400"></i>
                    Support Our Ministries
                </h2>
                <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed mb-6">
                    Join us in spreading God's love. Your generous donations help us maintain our ministries, support those in need, and continue our mission. Every contribution makes a difference.
                </p>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-blue-500/20 backdrop-blur-sm inline-block">
                    <p className="text-sm text-blue-300 font-bold uppercase tracking-wider mb-2">Direct Bank Transfer</p>
                    <div className="flex flex-col md:flex-row gap-6">
                        <div>
                            <span className="block text-xs text-slate-500 dark:text-slate-400">Bank Name</span>
                            <span className="font-bold text-slate-900 dark:text-white text-lg">MB Bank</span>
                        </div>
                        <div>
                            <span className="block text-xs text-slate-500 dark:text-slate-400">Account Number</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-white text-xl">0974210249</span>
                                <button onClick={() => {navigator.clipboard.writeText('0974210249'); showAlert('Info', 'Copied!');}} className="text-blue-400 hover:text-white transition-colors">
                                    <i className="fas fa-copy"></i>
                                </button>
                            </div>
                        </div>
                        <div>
                            <span className="block text-xs text-slate-500 dark:text-slate-400">Account Name</span>
                            <span className="font-bold text-slate-900 dark:text-white text-lg">PHAN NGOC TRIEU</span>
                        </div>
                    </div>
                </div>
             </div>
             <div className="lg:w-1/3 text-center">
                 <button onClick={() => router.push('/donate')} className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-300 font-bold rounded-full shadow-lg transition-all hover:-translate-y-1">
                     View Donation Details <i className="fas fa-arrow-right ml-2"></i>
                 </button>
             </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <div className="container container-custom">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total */}
                <div className="glass-panel dark:bg-slate-900/50 p-6 rounded-2xl shadow-premium dark:shadow-none border border-slate-200 dark:border-white/5 flex items-center gap-6 backdrop-blur-sm">
                    <div className="w-16 h-16 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center text-3xl border border-blue-500/20">
                       <i className="fas fa-list"></i>
                    </div>
                    <div>
                       <h3 className="text-4xl font-bold text-slate-900 dark:text-white">{stats.total}</h3>
                       <p className="text-slate-500 dark:text-slate-400 font-medium">{t('prayers.stats.total')}</p>
                    </div>
                </div>

                {/* Answered */}
                <div className="glass-panel dark:bg-slate-900/50 p-6 rounded-2xl shadow-premium dark:shadow-none border border-slate-200 dark:border-white/5 flex items-center gap-6 backdrop-blur-sm">
                    <div className="w-16 h-16 bg-green-500/10 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center text-3xl border border-green-500/20">
                       <i className="fas fa-check-circle"></i>
                    </div>
                    <div>
                       <h3 className="text-4xl font-bold text-slate-900 dark:text-white">{stats.answered}</h3>
                       <p className="text-slate-500 dark:text-slate-400 font-medium">{t('prayers.stats.answered')}</p>
                    </div>
                </div>

                {/* Pending */}
                <div className="glass-panel dark:bg-slate-900/50 p-6 rounded-2xl shadow-premium dark:shadow-none border border-slate-200 dark:border-white/5 flex items-center gap-6 backdrop-blur-sm">
                    <div className="w-16 h-16 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-2xl flex items-center justify-center text-3xl border border-yellow-500/20">
                       <i className="fas fa-clock"></i>
                    </div>
                    <div>
                       <h3 className="text-4xl font-bold text-slate-900 dark:text-white">{stats.pending}</h3>
                       <p className="text-slate-500 dark:text-slate-400 font-medium">{t('prayers.stats.pending')}</p>
                    </div>
                </div>
             </div>
          </div>
      </section>
      
      {/* Filters & List */}
      <section className="pb-20">
         <div className="container container-custom">
            {/* Filter Bar */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-200 dark:border-white/5 mb-8 sticky top-[72px] z-20 transition-colors duration-300">
               <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                  <div className="relative w-full md:w-96">
                     <span className="absolute left-3 top-2.5 text-slate-400"><i className="fas fa-search"></i></span>
                     <input 
                        type="text" 
                        placeholder={t('prayers.list.search_placeholder')}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                     />
                  </div>
                  
                  <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                      {['all', 'not_prayed', 'prayed', 'answered'].map(status => (
                         <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${filter === status ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'}`}
                         >
                            {t(`prayers.status.${status}`) || status}
                         </button>
                      ))}
                  </div>
               </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-20 text-slate-500">Loading prayers...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPrayers.map((prayer) => (
                    <div 
                        key={prayer.id} 
                        className={`glass-panel dark:bg-slate-900/50 rounded-2xl shadow-premium dark:shadow-none p-6 border-l-4 hover:-translate-y-1 transition-all duration-300 relative group backdrop-blur-sm border-t border-r border-b border-white/50 dark:border-white/5
                            ${prayer.status === 'answered' ? 'border-l-green-500' : 
                            prayer.status === 'prayed' ? 'border-l-yellow-500' : 'border-l-slate-400 dark:border-l-slate-700'}
                        `}
                    >
                        {/* Badge */}
                        <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border
                            ${prayer.status === 'answered' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' : 
                            prayer.status === 'prayed' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20' : 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20'}
                        `}>
                            {t(`prayers.status.${prayer.status}`)}
                        </span>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold overflow-hidden border border-slate-200 dark:border-white/5">
                                {prayer.author === 'Anonymous' ? (
                                    <i className="fas fa-user"></i>
                                ) : (
                                    <span className="text-xs uppercase">{prayer.author.charAt(0)}</span>
                                )}
                            </div>
                            <div>
                                <h5 className="font-bold text-slate-900 dark:text-slate-200 text-sm">{prayer.author}</h5>
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <i className="far fa-calendar-alt"></i> {prayer.date}
                                </span>
                            </div>
                        </div>

                        <p className="text-slate-600 dark:text-slate-300 mb-6 min-h-[80px] leading-relaxed">
                            {prayer.content}
                        </p>
                        
                        {prayer.action && (
                            <div className="mb-4 bg-green-500/5 border border-green-500/20 p-3 rounded-lg text-sm text-green-300">
                                <strong className="block mb-1 text-green-400"><i className="fas fa-bolt mr-1"></i> God's Action:</strong>
                                {prayer.action}
                            </div>
                        )}

                        <div className="pt-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
                            <span className="text-slate-500 text-sm font-semibold flex items-center gap-1">
                                <i className="fas fa-bookmark text-slate-400 dark:text-slate-600"></i> {prayer.category || 'General'}
                            </span>
                            
                            <button 
                                onClick={() => handlePrayClick(prayer.id, prayer.status)}
                                className="group/btn flex items-center gap-2 text-blue-400 font-bold text-sm bg-blue-500/10 px-4 py-2 rounded-full hover:bg-blue-600 hover:text-white transition-all hover:scale-105 border border-blue-500/20 hover:border-blue-500"
                            >
                                <i className="fas fa-praying-hands group-hover/btn:animate-pulse"></i>
                                Pray ({prayer.prayerCount})
                            </button>
                        </div>
                    </div>
                ))}
                </div>
            )}

            {!loading && filteredPrayers.length === 0 && (
               <div className="text-center py-20">
                  <div className="text-slate-700 text-6xl mb-4"><i className="fas fa-clock"></i></div>
                  <p className="text-slate-500">No prayer requests found matching your filters.</p>
               </div>
            )}
         </div>
      </section>

      {/* Modal */}
      {showModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 border border-white/10">
               <div className="p-6 border-b border-white/5 flex justify-between items-center">
                  <h5 className="text-xl font-bold text-purple-400 flex items-center gap-2">
                     <i className="fas fa-praying-hands"></i>
                     {t('prayers.modal.add_title')}
                  </h5>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                     <i className="fas fa-times text-xl"></i>
                  </button>
               </div>
               
               <form onSubmit={handleAddPrayer} className="p-6">
                  {/* Note: Author is taken from logged in user automatically */}
                  <div className="mb-4">
                     <label className="block text-sm font-bold text-slate-300 mb-1">Your Name</label>
                     <input 
                        type="text" 
                        className="w-full border border-slate-700 bg-slate-950 text-slate-400 rounded-lg px-4 py-2 opacity-70" 
                        value={user?.displayName || 'Anonymous'} 
                        disabled 
                     />
                     <p className="text-xs text-slate-500 mt-1">Taken from your account profile.</p>
                  </div>
                   <div className="mb-4">
                     <label className="block text-sm font-bold text-slate-300 mb-1">Category</label>
                     <select 
                        className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                     >
                        <option value="General">General</option>
                        <option value="Health">Health</option>
                        <option value="Family">Family</option>
                        <option value="Work">Work</option>
                        <option value="Finance">Finance</option>
                        <option value="Spiritual">Spiritual</option>
                     </select>
                  </div>
                  <div className="mb-6">
                     <label className="block text-sm font-bold text-slate-300 mb-1">{t('prayers.form.content_label')}</label>
                     <textarea 
                        rows={4} 
                        className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none placeholder-slate-600" 
                        placeholder={t('prayers.form.content_placeholder')} 
                        required
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                     ></textarea>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                     <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 text-slate-400 font-bold hover:text-white hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
                     <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className={`px-6 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 shadow-md ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                     >
                        {isSubmitting ? 'Submitting...' : 'Submit Prayer'}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </main>
  );
}
