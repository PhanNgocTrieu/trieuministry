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
  title?: string;
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
import IntercessoryList from '@/components/admin/prayer/IntercessoryList';

export default function PrayersPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'community' | 'intercession'>('community');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { showAlert, showConfirm } = useModal();
  
  // Real Data State
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection State
  const [selectedPrayerId, setSelectedPrayerId] = useState<string | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newAction, setNewAction] = useState('');
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
          title: data.title,
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
  const communityPrayers = prayers.filter(p => p.type !== 'personal');

  const stats = {
    total: communityPrayers.length,
    pending: communityPrayers.filter(p => p.status === 'not_prayed' || p.status === 'prayed').length
  };

  // Filtering Logic
  const filteredPrayers = communityPrayers.filter(prayer => {
     const matchesFilter = filter === 'all' || prayer.status === filter;
     const matchesSearch = prayer.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           prayer.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (prayer.title && prayer.title.toLowerCase().includes(searchTerm.toLowerCase()));
     return matchesFilter && matchesSearch;
  });

  // Auto-select first item on load or filter change if nothing selected
  useEffect(() => {
    if (!selectedPrayerId && filteredPrayers.length > 0) {
        setSelectedPrayerId(filteredPrayers[0].id);
    }
  }, [filteredPrayers, selectedPrayerId]);

  const selectedPrayer = filteredPrayers.find(p => p.id === selectedPrayerId) || filteredPrayers[0];

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
     if (!user || !newContent.trim() || !newTitle.trim()) return;

     setIsSubmitting(true);
     try {
        await addDoc(collection(db, 'prayers'), {
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
            userAvatar: user.photoURL || '',
            title: newTitle,
            content: newContent,
            category: newCategory,
            action: newAction,
            status: newAction ? 'answered' : 'not_prayed',
            prayerCount: 0,
            createdAt: serverTimestamp()
        });
        
        setNewTitle('');
        setNewContent('');
        setNewAction('');
        setShowModal(false);
        showAlert("Success", "Prayer request submitted successfully.");
     } catch (error) {
         console.error("Error adding prayer", error);
         showAlert("Error", "Failed to submit prayer. Please try again.");
     } finally {
         setIsSubmitting(false);
     }
  };

  const handlePrayClick = async (id: string, currentStatus: string) => {
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

  const handlePrayerSelect = (id: string) => {
      setSelectedPrayerId(id);
      // On mobile, show detail modal/view
      if (window.innerWidth < 1024) {
          setShowMobileDetail(true);
      }
  };

  return (
    <main className="bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-300 flex flex-col">
      {/* Hero Section */}
      <section className="bg-slate-50 dark:bg-slate-900 py-12 border-b border-slate-200 dark:border-white/5 relative overflow-hidden transition-colors duration-500 shrink-0">
         {/* Premium Background */}
        <div className="absolute inset-0 bg-[radial-gradient(at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-purple-50/20 to-transparent dark:hidden opacity-100"></div>
        <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 z-0"></div>
        
         <div className="container container-custom relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="md:w-7/12">
                   <h1 className="text-3xl lg:text-4xl font-bold mb-2 text-slate-900 dark:text-white flex items-center gap-3">
                      <i className="fas fa-praying-hands text-purple-600 dark:text-purple-500"></i>
                      {t('prayers.hero.title')}
                   </h1>
                   <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
                      {t('prayers.hero.subtitle')}
                   </p>
               </div>
               <div className="md:w-auto flex gap-4">
                   <div className="flex gap-4 mr-4 border-r border-slate-200 dark:border-white/10 pr-6">
                       <div className="text-center">
                           <span className="block text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</span>
                           <span className="text-xs text-slate-500 uppercase font-bold">Total</span>
                       </div>
                       <div className="text-center">
                           <span className="block text-2xl font-bold text-slate-900 dark:text-white">{stats.pending}</span>
                           <span className="text-xs text-slate-500 uppercase font-bold">Pending</span>
                       </div>
                   </div>
                   <button 
                      onClick={handleAddClick}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-105 text-white rounded-full font-bold shadow-lg shadow-purple-900/20 transition-all flex items-center gap-2"
                   >
                      <i className="fas fa-plus"></i>
                      {t('prayers.hero.btn_add')}
                   </button>
               </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-6 mt-8 border-b border-slate-200 dark:border-white/10">
                <button
                    onClick={() => setActiveTab('community')}
                    className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${
                        activeTab === 'community'
                            ? 'text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400'
                            : 'text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    Community Prayers
                </button>
                <button
                    onClick={() => setActiveTab('intercession')}
                    className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${
                        activeTab === 'intercession'
                            ? 'text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400'
                            : 'text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    My Intercession List
                </button>
            </div>
         </div>
      </section>

      {/* Main Content - Master Detail Layout */}
      <section className="flex-1 py-8 overflow-hidden h-full">
         <div className="container container-custom h-full">
            {activeTab === 'community' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
                
                {/* LEFT COLUMN: LIST VIEW */}
                <div className="lg:col-span-5 flex flex-col h-full lg:max-h-[calc(100vh-350px)]">
                    {/* Search & Filters */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-white/5 mb-4 shrink-0">
                        <div className="relative mb-3">
                            <span className="absolute left-3 top-2.5 text-slate-400"><i className="fas fa-search"></i></span>
                            <input 
                                type="text" 
                                placeholder={t('prayers.list.search_placeholder')}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            {['all', 'not_prayed', 'prayed', 'answered'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilter(status)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${filter === status ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                >
                                    {t(`prayers.status.${status}`) || status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Scrollable List */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                        {loading ? (
                            <div className="text-center py-10 text-slate-500">Loading...</div>
                        ) : filteredPrayers.length === 0 ? (
                            <div className="text-center py-10 text-slate-500">
                                <i className="fas fa-search text-3xl mb-2 opacity-30"></i>
                                <p>No prayers found.</p>
                            </div>
                        ) : (
                            filteredPrayers.map((prayer) => (
                                <div 
                                    key={prayer.id}
                                    onClick={() => handlePrayerSelect(prayer.id)}
                                    className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                                        selectedPrayerId === prayer.id 
                                            ? 'bg-purple-50 dark:bg-purple-900/10 border-purple-500 ring-1 ring-purple-500/20' 
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 hover:border-purple-300 dark:hover:border-purple-700'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 text-xs font-bold">
                                                {prayer.author.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{prayer.title || 'Untitled Prayer'}</h4>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">{prayer.author}</span>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                                            prayer.status === 'answered' ? 'text-green-600 dark:text-green-400 bg-green-500/5 border-green-500/10' :
                                            prayer.status === 'prayed' ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/5 border-yellow-500/10' :
                                            'text-slate-500 bg-slate-500/5 border-slate-500/10'
                                        }`}>
                                            {t(`prayers.status.${prayer.status}`)}
                                        </span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 mb-2 font-medium pl-10">
                                        {prayer.content}
                                    </p>
                                    <div className="flex justify-between items-center pl-10">
                                        <span className="text-xs text-slate-400">{prayer.date}</span>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <i className="fas fa-praying-hands text-purple-500"></i> {prayer.prayerCount}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: DETAIL VIEW (Desktop) */}
                <div className="hidden lg:flex lg:col-span-7 flex-col h-full lg:max-h-[calc(100vh-350px)]">
                    {selectedPrayer ? (
                         <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-white/5 h-full overflow-hidden flex flex-col animate-in fade-in slide-in-from-right-4 duration-300 key-{selectedPrayer.id}">
                            
                            {/* Detailed Header */}
                            <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/20 shrink-0">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shrink-0">
                                            {selectedPrayer.author.charAt(0)}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                                                {selectedPrayer.title || 'Untitled Prayer'}
                                            </h2>
                                            <div className="flex items-center gap-3 mt-2 text-sm text-slate-500 dark:text-slate-400">
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedPrayer.author}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                                <span className="flex items-center gap-1">
                                                    <i className="far fa-calendar-alt"></i> {selectedPrayer.date}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                                <span className="flex items-center gap-1 font-medium text-purple-600 dark:text-purple-400">
                                                    <i className="fas fa-bookmark"></i> {selectedPrayer.category || 'General'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 text-center min-w-[80px]">
                                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{selectedPrayer.prayerCount}</div>
                                        <div className="text-[10px] uppercase font-bold text-slate-500">Prayers</div>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Content */}
                            <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                                <div className="prose dark:prose-invert max-w-none">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Prayer Request</h3>
                                    <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
                                        {selectedPrayer.content}
                                    </p>
                                </div>

                                {selectedPrayer.action && (
                                    <div className="mt-8 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl p-5 animate-in zoom-in-95 duration-500">
                                        <h4 className="flex items-center gap-2 font-bold text-green-700 dark:text-green-400 mb-2">
                                            <i className="fas fa-bolt"></i> God's Answer
                                        </h4>
                                        <p className="text-green-800 dark:text-green-300">
                                            {selectedPrayer.action}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Detailed Footer Actions */}
                            <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-950 flex justify-between items-center shrink-0">
                                <div className="flex gap-2">
                                    <button 
                                        className="w-10 h-10 rounded-full flex items-center justify-center border border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition-colors"
                                        title="Share"
                                    >
                                        <i className="fas fa-share-alt"></i>
                                    </button>
                                </div>
                                <button 
                                    onClick={() => handlePrayClick(selectedPrayer.id, selectedPrayer.status)}
                                    className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                                >
                                    <i className="fas fa-praying-hands"></i>
                                    {selectedPrayer.status === 'not_prayed' ? 'I Will Pray' : 'Pray Again'}
                                </button>
                            </div>

                         </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                            <i className="fas fa-praying-hands text-4xl mb-4 opacity-50"></i>
                            <p>Select a prayer request to view details</p>
                        </div>
                    )}
                </div>

            </div>
            ) : (
                <div className="h-full">
                    <IntercessoryList />
                </div>
            )}
         </div>
      </section>

      {/* Mobile Detail Modal */}
      {showMobileDetail && selectedPrayer && (
          <div className="fixed inset-0 z-[60] lg:hidden flex flex-col bg-white dark:bg-slate-950 animate-in slide-in-from-bottom duration-300">
              <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center gap-3">
                  <button onClick={() => setShowMobileDetail(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white">
                      <i className="fas fa-arrow-left"></i>
                  </button>
                  <h3 className="font-bold text-lg">Prayer Details</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                            {selectedPrayer.author.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                                {selectedPrayer.title || 'Untitled Prayer'}
                            </h2>
                            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                <span className="font-semibold block">{selectedPrayer.author}</span>
                                <span className="text-xs opacity-70"><i className="far fa-calendar-alt mr-1"></i> {selectedPrayer.date}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="prose dark:prose-invert max-w-none mb-8">
                        <p className="text-lg leading-relaxed whitespace-pre-line text-slate-800 dark:text-slate-200">
                            {selectedPrayer.content}
                        </p>
                    </div>

                    {selectedPrayer.action && (
                        <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl p-5 mb-8">
                            <h4 className="font-bold text-green-700 dark:text-green-400 mb-2">
                                <i className="fas fa-bolt mr-2"></i> God's Answer
                            </h4>
                            <p className="text-green-800 dark:text-green-300">
                                {selectedPrayer.action}
                            </p>
                        </div>
                    )}
              </div>
              <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 pb-8">
                   <button 
                        onClick={() => handlePrayClick(selectedPrayer.id, selectedPrayer.status)}
                        className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <i className="fas fa-praying-hands"></i>
                        Pray ({selectedPrayer.prayerCount})
                    </button>
              </div>
          </div>
      )}

      {/* Modal Form */}
      {showModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 border border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar">
               <div className="p-6 border-b border-white/5 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
                  <h5 className="text-xl font-bold text-purple-400 flex items-center gap-2">
                     <i className="fas fa-praying-hands"></i>
                     {t('prayers.modal.add_title')}
                  </h5>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                     <i className="fas fa-times text-xl"></i>
                  </button>
               </div>
               
               <form onSubmit={handleAddPrayer} className="p-6 space-y-4">
                  
                  {/* Title Field */}
                  <div>
                     <label className="block text-sm font-bold text-slate-300 mb-1">Title <span className="text-red-500">*</span></label>
                     <input 
                        type="text" 
                        className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none placeholder-slate-600" 
                        placeholder="e.g., Healing for my mother" 
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                     />
                  </div>

                  {/* Category Field */}
                  <div>
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

                  {/* Content Field */}
                  <div>
                     <label className="block text-sm font-bold text-slate-300 mb-1">{t('prayers.form.content_label')} <span className="text-red-500">*</span></label>
                     <textarea 
                        rows={4} 
                        className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none placeholder-slate-600" 
                        placeholder={t('prayers.form.content_placeholder')} 
                        required
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                     ></textarea>
                  </div>

                  {/* Answer Field */}
                  <div>
                     <label className="block text-sm font-bold text-slate-300 mb-1">God's Answer / Testimony (Optional)</label>
                     <textarea 
                        rows={3} 
                        className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none placeholder-slate-600" 
                        placeholder="Share how God has answered this prayer..." 
                        value={newAction}
                        onChange={(e) => setNewAction(e.target.value)}
                     ></textarea>
                     <p className="text-xs text-slate-500 mt-1">If filled, the prayer status will automatically be set to "Answered".</p>
                  </div>
                  
                  {/* Submitter Info */}
                  <div className="pt-2 border-t border-white/5">
                     <p className="text-xs text-slate-500">Posting as: <span className="text-slate-300 font-bold">{user?.displayName || 'Anonymous'}</span></p>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
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
