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
    <main className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="bg-white py-16 lg:py-20 border-b border-gray-100">
         <div className="container container-custom">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
               <div className="lg:w-7/12">
                   <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-gray-900 flex items-center gap-3">
                      <i className="fas fa-praying-hands text-blue-600"></i>
                      {t('prayers.hero.title')}
                   </h1>
                   <p className="text-xl text-gray-500 max-w-2xl">
                      {t('prayers.hero.subtitle')}
                   </p>
               </div>
               <div className="lg:w-auto">
                   <button 
                      onClick={handleAddClick}
                      className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-lg hover:-translate-y-1 transition-all flex items-center gap-3"
                   >
                      <i className="fas fa-plus"></i>
                      {t('prayers.hero.btn_add')}
                   </button>
               </div>
            </div>
         </div>
      </section>

      {/* Call for Donation for Ministries */}
      <section className="bg-blue-600 text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 opacity-50 mix-blend-multiply"></div>
        <div className="container container-custom relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
             <div className="lg:w-2/3">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 flex items-center gap-3">
                    <i className="fas fa-hand-holding-heart text-yellow-300"></i>
                    Support Our Ministries
                </h2>
                <p className="text-blue-100 text-lg leading-relaxed mb-6">
                    Join us in spreading God's love. Your generous donations help us maintain our ministries, support those in need, and continue our mission. Every contribution makes a difference.
                </p>
                <div className="bg-blue-700/50 rounded-xl p-4 border border-blue-500/50 backdrop-blur-sm inline-block">
                    <p className="text-sm text-blue-200 font-bold uppercase tracking-wider mb-2">Direct Bank Transfer</p>
                    <div className="flex flex-col md:flex-row gap-6">
                        <div>
                            <span className="block text-xs text-blue-300">Bank Name</span>
                            <span className="font-bold text-white text-lg">MB Bank</span>
                        </div>
                        <div>
                            <span className="block text-xs text-blue-300">Account Number</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-white text-xl">0974210249</span>
                                <button onClick={() => {navigator.clipboard.writeText('0974210249'); showAlert('Info', 'Copied!');}} className="text-blue-200 hover:text-white transition-colors">
                                    <i className="fas fa-copy"></i>
                                </button>
                            </div>
                        </div>
                        <div>
                            <span className="block text-xs text-blue-300">Account Name</span>
                            <span className="font-bold text-white text-lg">PHAN NGOC TRIEU</span>
                        </div>
                    </div>
                </div>
             </div>
             <div className="lg:w-1/3 text-center">
                 <button onClick={() => router.push('/donate')} className="px-8 py-4 bg-white text-blue-600 font-bold rounded-full shadow-lg hover:bg-yellow-300 hover:text-blue-800 transition-all hover:-translate-y-1">
                     View Donation Details <i className="fas fa-arrow-right ml-2"></i>
                 </button>
             </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50">
          <div className="container container-custom">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-3xl">
                       <i className="fas fa-list"></i>
                    </div>
                    <div>
                       <h3 className="text-4xl font-bold text-gray-900">{stats.total}</h3>
                       <p className="text-gray-500 font-medium">{t('prayers.stats.total')}</p>
                    </div>
                </div>

                {/* Answered */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center text-3xl">
                       <i className="fas fa-check-circle"></i>
                    </div>
                    <div>
                       <h3 className="text-4xl font-bold text-gray-900">{stats.answered}</h3>
                       <p className="text-gray-500 font-medium">{t('prayers.stats.answered')}</p>
                    </div>
                </div>

                {/* Pending */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6">
                    <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center text-3xl">
                       <i className="fas fa-clock"></i>
                    </div>
                    <div>
                       <h3 className="text-4xl font-bold text-gray-900">{stats.pending}</h3>
                       <p className="text-gray-500 font-medium">{t('prayers.stats.pending')}</p>
                    </div>
                </div>
             </div>
          </div>
      </section>
      
      {/* Filters & List */}
      <section className="pb-20">
         <div className="container container-custom">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8 sticky top-[72px] z-20">
               <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                  <div className="relative w-full md:w-96">
                     <span className="absolute left-3 top-2.5 text-gray-400"><i className="fas fa-search"></i></span>
                     <input 
                        type="text" 
                        placeholder={t('prayers.list.search_placeholder')}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                     />
                  </div>
                  
                  <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                      {['all', 'not_prayed', 'prayed', 'answered'].map(status => (
                         <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${filter === status ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                         >
                            {t(`prayers.status.${status}`) || status}
                         </button>
                      ))}
                  </div>
               </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-20 text-gray-500">Loading prayers...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPrayers.map((prayer) => (
                    <div 
                        key={prayer.id} 
                        className={`bg-white rounded-2xl shadow-sm p-6 border-l-4 hover:-translate-y-1 transition-all duration-300 relative group
                            ${prayer.status === 'answered' ? 'border-green-500' : 
                            prayer.status === 'prayed' ? 'border-yellow-400' : 'border-gray-300'}
                        `}
                    >
                        {/* Badge */}
                        <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                            ${prayer.status === 'answered' ? 'bg-green-100 text-green-700' : 
                            prayer.status === 'prayed' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}
                        `}>
                            {t(`prayers.status.${prayer.status}`)}
                        </span>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 font-bold overflow-hidden">
                                {prayer.author === 'Anonymous' ? (
                                    <i className="fas fa-user"></i>
                                ) : (
                                    <span className="text-xs uppercase">{prayer.author.charAt(0)}</span>
                                )}
                            </div>
                            <div>
                                <h5 className="font-bold text-gray-800 text-sm">{prayer.author}</h5>
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <i className="far fa-calendar-alt"></i> {prayer.date}
                                </span>
                            </div>
                        </div>

                        <p className="text-gray-600 mb-6 min-h-[80px] leading-relaxed">
                            {prayer.content}
                        </p>
                        
                        {prayer.action && (
                            <div className="mb-4 bg-green-50 border border-green-100 p-3 rounded-lg text-sm text-green-800">
                                <strong className="block mb-1 text-green-700"><i className="fas fa-bolt mr-1"></i> God's Action:</strong>
                                {prayer.action}
                            </div>
                        )}

                        <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                            <span className="text-gray-400 text-sm font-semibold flex items-center gap-1">
                                <i className="fas fa-bookmark text-gray-300"></i> {prayer.category || 'General'}
                            </span>
                            
                            <button 
                                onClick={() => handlePrayClick(prayer.id, prayer.status)}
                                className="group/btn flex items-center gap-2 text-blue-600 font-bold text-sm bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-600 hover:text-white transition-colors"
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
                  <div className="text-gray-300 text-5xl mb-4"><i className="fas fa-clock"></i></div>
                  <p className="text-gray-500">No prayer requests found matching your filters.</p>
               </div>
            )}
         </div>
      </section>

      {/* Modal */}
      {showModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
               <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h5 className="text-xl font-bold text-blue-600 flex items-center gap-2">
                     <i className="fas fa-praying-hands"></i>
                     {t('prayers.modal.add_title')}
                  </h5>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                     <i className="fas fa-times text-xl"></i>
                  </button>
               </div>
               
               <form onSubmit={handleAddPrayer} className="p-6">
                  {/* Note: Author is taken from logged in user automatically */}
                  <div className="mb-4">
                     <label className="block text-sm font-bold text-gray-700 mb-1">Your Name</label>
                     <input 
                        type="text" 
                        className="w-full border border-gray-300 bg-gray-100 text-gray-500 rounded-lg px-4 py-2" 
                        value={user?.displayName || 'Anonymous'} 
                        disabled 
                     />
                     <p className="text-xs text-gray-500 mt-1">Taken from your account profile.</p>
                  </div>
                   <div className="mb-4">
                     <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                     <select 
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                     <label className="block text-sm font-bold text-gray-700 mb-1">{t('prayers.form.content_label')}</label>
                     <textarea 
                        rows={4} 
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                        placeholder={t('prayers.form.content_placeholder')} 
                        required
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                     ></textarea>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                     <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
                     <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className={`px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
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
