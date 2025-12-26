"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';

type TabType = 'vision' | 'mission' | 'values';

export default function ProfilePage() {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('vision');

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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'vision':
        return (
          <div className="bg-white p-8 rounded-b-2xl rounded-tr-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-left-4 duration-300">
             <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mb-6">
                  <i className="fas fa-eye"></i>
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-4">{t('profile.vision.title')}</h4>
              <p className="text-gray-600 leading-relaxed text-lg">
                  {t('profile.vision.content')}
              </p>
          </div>
        );
      case 'mission':
        return (
          <div className="bg-white p-8 rounded-b-2xl rounded-tr-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center text-2xl mb-6">
                  <i className="fas fa-bullseye"></i>
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-4">{t('profile.mission.title')}</h4>
              <p className="text-gray-600 leading-relaxed text-lg">
                  {t('profile.mission.content')}
              </p>
          </div>
        );
      case 'values':
        return (
          <div className="bg-white p-8 rounded-b-2xl rounded-tr-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-2xl mb-6">
                  <i className="fas fa-heart"></i>
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-4">{t('profile.values.title')}</h4>
              <p className="text-gray-600 leading-relaxed text-lg">
                  {t('profile.values.content')}
              </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-gray-900 to-blue-900 text-white py-20 lg:py-24 text-center relative overflow-hidden">
         <div className="absolute inset-0 bg-[url('/hero_bg.png')] bg-cover opacity-20 bg-center"></div>
         <div className="container container-custom relative z-10 fade-in-up">
             <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('profile.hero.title')}</h1>
             <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
                 {t('profile.hero.subtitle')}
             </p>
         </div>
      </section>

      <div className="container container-custom py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              
              {/* LEFT COLUMN - Main Content */}
              <div className="lg:col-span-7 space-y-12">
                  
                  {/* About Founder */}
                  <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10 fade-in-up">
                      <div className="flex flex-col md:flex-row items-start gap-8">
                          <div className="flex-shrink-0 mx-auto md:mx-0">
                               <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-white shadow-lg">
                                   <Image 
                                      src="/profile/profile.jpg" 
                                      alt="Phan Ngoc Trieu" 
                                      fill
                                      className="object-cover"
                                   />
                               </div>
                               <div className="flex justify-center gap-3 mt-4">
                                   <a href="https://www.facebook.com/trieu.phanngoc.31/" target="_blank" className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all text-sm">
                                       <i className="fab fa-facebook-f"></i>
                                   </a>
                                   <a href="https://www.youtube.com/@trieuphanngoc3549" target="_blank" className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all text-sm">
                                       <i className="fab fa-youtube"></i>
                                   </a>
                                   <a href="mailto:phantrieu580@gmail.com" className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-600 hover:text-white transition-all text-sm">
                                       <i className="fas fa-envelope"></i>
                                   </a>
                               </div>
                          </div>
                          
                          <div className="flex-1 text-center md:text-left">
                               <span className="text-blue-600 font-bold tracking-widest text-xs uppercase mb-2 block">
                                   {t('profile.founder.label')}
                               </span>
                               <h2 className="text-3xl font-bold text-gray-900 mb-4">Phan Ngọc Triều</h2>
                               <blockquote className="text-lg text-gray-600 italic border-l-4 border-blue-200 pl-4 py-1 mb-6">
                                   {t('profile.founder.quote')}
                               </blockquote>
                               <div className="text-gray-600 space-y-4 text-justify leading-relaxed">
                                   <p>
                                      {t('profile.founder.bio').replace('{{age}}', (new Date().getFullYear() - 1999).toString())}
                                   </p>
                               </div>
                          </div>
                      </div>
                  </section>

                  {/* The Calling */}
                  <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10 fade-in-up">
                      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                          <i className="fas fa-bullhorn text-blue-500 mr-3"></i>
                          {t('profile.calling.title')}
                      </h3>
                      
                      <div className={`relative transition-[max-height] duration-700 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[3000px]' : 'max-h-[300px]'}`}>
                          <div className="text-gray-700 leading-relaxed text-justify space-y-4">
                              <p>{t('profile.calling.content_1')}</p>
                              <p>{t('profile.calling.content_2')}</p>
                          </div>
                          <div className={`absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white to-transparent transition-opacity duration-500 ${isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}></div>
                      </div>
                      
                      <div className="text-center mt-6">
                          <button 
                              onClick={() => setIsExpanded(!isExpanded)}
                              className="text-blue-600 font-bold hover:text-blue-700 transition-colors flex items-center justify-center mx-auto"
                          >
                              {isExpanded ? 'Show Less' : t('common.read_more')} 
                              <i className={`fas fa-chevron-down ml-2 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
                          </button>
                      </div>
                  </section>
              </div>

              {/* RIGHT COLUMN - Tabbed Sidebar */}
              <div className="lg:col-span-5">
                  <div className="sticky top-24">
                      {/* Tab Headers */}
                      <div className="flex bg-white rounded-t-2xl p-1 shadow-sm border-b border-gray-100 overflow-x-auto">
                          <button 
                              onClick={() => setActiveTab('vision')}
                              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2
                                  ${activeTab === 'vision' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                          >
                              <i className="fas fa-eye"></i>
                              {t('profile.vision.title')}
                          </button>
                          <button 
                              onClick={() => setActiveTab('mission')}
                              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2
                                  ${activeTab === 'mission' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                          >
                              <i className="fas fa-bullseye"></i>
                              {t('profile.mission.title')}
                          </button>
                          <button 
                              onClick={() => setActiveTab('values')}
                              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2
                                  ${activeTab === 'values' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                          >
                              <i className="fas fa-heart"></i>
                              {t('profile.values.title')}
                          </button>
                      </div>

                      {/* Tab Content */}
                      {renderTabContent()}
                  </div>
              </div>

          </div>
      </div>
    </main>
  );
}
