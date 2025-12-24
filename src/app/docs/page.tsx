"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function DocsPage() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');

  // Animation effect
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    });

    const hiddenElements = document.querySelectorAll('.fade-in-up');
    hiddenElements.forEach((el) => observer.observe(el));

    return () => {
      hiddenElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  // Mock Data
  const docs = [
    {
      id: 1,
      title: "Sample Bible Study",
      category: "study",
      description: "A comprehensive guide to studying the Bible effectively.",
      image: "/docs/default.jpg"
    },
    {
       id: 2,
       title: "Worship Team Guidelines",
       category: "training",
       description: "Essential principles for worship leaders and team members.",
       image: "/docs/bible_study/_worship_team_lessons.png"
    }
  ];

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="bg-white py-16">
        <div className="container container-custom fade-in-up">
           <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-8/12">
                 <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-gray-800">{t('docs.hero.title')}</h1>
                 <p className="text-xl text-gray-600 font-light">
                    {t('docs.hero.subtitle')}
                 </p>
              </div>
              <div className="lg:w-4/12 text-center hidden lg:block fade-in-up" style={{ animationDelay: '0.1s' }}>
                 <i className="fas fa-book-reader text-9xl text-gray-200"></i>
              </div>
           </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-8 bg-blue-50 sticky top-[72px] z-30 shadow-sm transition-all">
         <div className="container container-custom">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
               <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-5">
                     <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                        {t('docs.list.search_placeholder')}
                     </label>
                     <div className="relative">
                        <span className="absolute left-3 top-3 text-blue-500"><i className="fas fa-search"></i></span>
                        <input 
                           type="text" 
                           className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                           placeholder={t('docs.list.search_placeholder')}
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                        />
                     </div>
                  </div>
                  <div className="md:col-span-4">
                     <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                        {t('docs.list.category_all')}
                     </label>
                     <div className="relative">
                        <span className="absolute left-3 top-3 text-blue-500"><i className="fas fa-filter"></i></span>
                        <select 
                           className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition-all cursor-pointer"
                           value={category}
                           onChange={(e) => setCategory(e.target.value)}
                        >
                           <option value="">{t('docs.list.category_all')}</option>
                           <option value="study">Bible Study</option>
                           <option value="training">Training</option>
                        </select>
                        <span className="absolute right-4 top-3 text-gray-400 pointer-events-none"><i className="fas fa-chevron-down"></i></span>
                     </div>
                  </div>
                  <div className="md:col-span-3">
                     <button 
                        className="w-full py-2.5 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                        onClick={() => { setSearchTerm(''); setCategory(''); }}
                     >
                        <i className="fas fa-undo"></i>
                        {t('docs.list.reset')}
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Docs List */}
      <section className="py-12">
         <div className="container container-custom">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
               <h2 className="text-2xl font-bold text-gray-800">{t('docs.list.title')}</h2>
               <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                  {docs.length} {t('docs.list.count_suffix')}
               </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {docs.map((doc) => (
                  <div key={doc.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group border border-gray-100">
                     <div className="h-48 bg-gray-200 relative overflow-hidden">
                        {/* 
                           Note: Using a placeholder div for image if Next/Image not fully verified.
                           In real implementation, use Next/Image with valid src.
                        */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                        <div className="absolute top-3 right-3 z-20 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full uppercase font-bold tracking-wider">
                           {doc.category}
                        </div>
                        <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-400">
                           <i className="fas fa-file-alt text-4xl"></i>
                        </div>
                     </div>
                     <div className="p-5">
                        <h3 className="font-bold text-lg text-gray-800 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">{doc.title}</h3>
                        <p className="text-gray-500 text-sm mb-4 line-clamp-2 h-10">{doc.description}</p>
                        <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                           <button className="text-gray-400 hover:text-blue-600 transition-colors text-sm font-semibold flex items-center gap-1">
                              <i className="fas fa-eye"></i> {t('common.preview')}
                           </button>
                           <button className="text-blue-600 hover:text-blue-800 transition-colors text-sm font-bold flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100">
                              <i className="fas fa-download"></i> {t('common.download')}
                           </button>
                        </div>
                     </div>
                  </div>
               ))}
            </div>

            {docs.length === 0 && (
               <div className="text-center py-20">
                  <div className="text-gray-300 text-6xl mb-4"><i className="fas fa-folder-open"></i></div>
                  <p className="text-gray-500 text-lg">{t('docs.list.empty')}</p>
               </div>
            )}
         </div>
      </section>
    </main>
  );
}
