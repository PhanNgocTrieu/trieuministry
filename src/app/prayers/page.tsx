"use client";

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

// Types
type Prayer = {
  id: string;
  author: string;
  content: string;
  date: string;
  status: 'not_prayed' | 'prayed' | 'answered';
  prayerCount: number;
  category?: string;
  action?: string;
};

export default function PrayersPage() {
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock Data State
  const [prayers, setPrayers] = useState<Prayer[]>([
    {
      id: '1',
      author: 'John Doe',
      content: 'Please pray for my mother\'s health recovery.',
      date: '2024-12-24',
      status: 'not_prayed',
      prayerCount: 5,
      category: 'Health'
    },
    {
      id: '2',
      author: 'Anonymous',
      content: 'Praying for guidance in my new career path.',
      date: '2024-12-23',
      status: 'prayed',
      prayerCount: 12,
      category: 'Work'
    },
    {
       id: '3',
       author: 'Sarah M.',
       content: 'Praise God! My financial situation has improved.',
       date: '2024-12-20',
       status: 'answered',
       prayerCount: 20,
       category: 'Finance',
       action: 'God provided a new job opportunity just in time.'
    }
  ]);

  // Derived Statistics
  const stats = {
    total: prayers.length,
    answered: prayers.filter(p => p.status === 'answered').length,
    pending: prayers.filter(p => p.status === 'not_prayed' || p.status === 'prayed').length
  };

  // Filtering Logic
  const filteredPrayers = prayers.filter(prayer => {
     const matchesFilter = filter === 'all' || prayer.status === filter;
     const matchesSearch = prayer.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           prayer.author.toLowerCase().includes(searchTerm.toLowerCase());
     return matchesFilter && matchesSearch;
  });

  const handleAddPrayer = (e: React.FormEvent) => {
     e.preventDefault();
     // Mock Add Logic
     const newPrayer: Prayer = {
        id: Date.now().toString(),
        author: 'Guest User',
        content: 'This is a new prayer request.',
        date: new Date().toISOString().split('T')[0],
        status: 'not_prayed',
        prayerCount: 0,
        category: 'General'
     };
     setPrayers([newPrayer, ...prayers]);
     setShowModal(false);
     alert("Prayer request added successfully (Mock)!");
  };

  const handlePrayClick = (id: string) => {
     setPrayers(prayers.map(p => 
        p.id === id ? { ...p, prayerCount: p.prayerCount + 1, status: p.status === 'not_prayed' ? 'prayed' : p.status } : p
     ));
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
                      onClick={() => setShowModal(true)}
                      className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-lg hover:-translate-y-1 transition-all flex items-center gap-3"
                   >
                      <i className="fas fa-plus"></i>
                      {t('prayers.hero.btn_add')}
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
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 font-bold">
                           <i className="fas fa-user"></i>
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
                           onClick={() => handlePrayClick(prayer.id)}
                           className="group/btn flex items-center gap-2 text-blue-600 font-bold text-sm bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-600 hover:text-white transition-colors"
                        >
                           <i className="fas fa-praying-hands group-hover/btn:animate-pulse"></i>
                           Pray ({prayer.prayerCount})
                        </button>
                     </div>
                  </div>
               ))}
            </div>

            {filteredPrayers.length === 0 && (
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
                  <div className="mb-4">
                     <label className="block text-sm font-bold text-gray-700 mb-1">{t('prayers.form.name_label')}</label>
                     <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder={t('prayers.form.name_placeholder')} />
                  </div>
                  <div className="mb-6">
                     <label className="block text-sm font-bold text-gray-700 mb-1">{t('prayers.form.content_label')}</label>
                     <textarea rows={4} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder={t('prayers.form.content_placeholder')} required></textarea>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                     <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
                     <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md">Submit Prayer</button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </main>
  );
}
