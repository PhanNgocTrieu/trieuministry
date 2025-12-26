"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';

type TabType = 'calling' | 'vision' | 'mission' | 'values';

export default function ProfilePage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('calling');

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
      case 'calling':
        return (
          <div className="bg-white p-8 lg:p-12 rounded-3xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-3xl mb-8 shadow-sm">
                  <i className="fas fa-bullhorn"></i>
              </div>
              <h4 className="text-3xl font-bold text-gray-900 mb-6">{t('profile.calling.title')}</h4>
              <div className="text-gray-600 leading-loose text-lg space-y-6 text-justify">
                  <p>{t('profile.calling.content_1')}</p>
                  <p>{t('profile.calling.content_2')}</p>
                  <div className="h-px bg-gray-100 w-1/2 my-8"></div>
                  <p className="italic text-gray-500">"Here I am, Lord. Send me!"</p>
              </div>
          </div>
        );
      case 'vision':
        return (
          <div className="bg-white p-8 lg:p-12 rounded-3xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-3xl mb-8 shadow-sm">
                  <i className="fas fa-eye"></i>
              </div>
              <h4 className="text-3xl font-bold text-gray-900 mb-6">{t('profile.vision.title')}</h4>
              <p className="text-gray-600 leading-loose text-lg text-justify">
                  {t('profile.vision.content')}
              </p>
          </div>
        );
      case 'mission':
        return (
          <div className="bg-white p-8 lg:p-12 rounded-3xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center text-3xl mb-8 shadow-sm">
                  <i className="fas fa-bullseye"></i>
              </div>
              <h4 className="text-3xl font-bold text-gray-900 mb-6">{t('profile.mission.title')}</h4>
              <p className="text-gray-600 leading-loose text-lg text-justify">
                  {t('profile.mission.content')}
              </p>
          </div>
        );
      case 'values':
        return (
          <div className="bg-white p-8 lg:p-12 rounded-3xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-20 h-20 bg-green-50 text-green-600 rounded-3xl flex items-center justify-center text-3xl mb-8 shadow-sm">
                  <i className="fas fa-heart"></i>
              </div>
              <h4 className="text-3xl font-bold text-gray-900 mb-6">{t('profile.values.title')}</h4>
              <p className="text-gray-600 leading-loose text-lg text-justify">
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
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-gray-900 to-blue-900 text-white py-20 lg:py-24 text-center relative overflow-hidden mt-12 mb-16">
         <div className="absolute inset-0 bg-[url('/hero_bg.png')] bg-cover opacity-20 bg-center"></div>
         <div className="container container-custom relative z-10 fade-in-up">
             <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('profile.hero.title')}</h1>
             <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
                 {t('profile.hero.subtitle')}
             </p>
         </div>
      </section>

      <div className="container container-custom pb-24 lg:pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative">
              
              {/* LEFT COLUMN - Main Content */}
              <div className="lg:col-span-5 space-y-12">
                  
                  {/* About Founder */}
                  <div className="sticky top-32 z-10">
                      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10 fade-in-up">
                          <div className="flex flex-col items-center text-center">
                              <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-lg mb-6">
                                  <Image 
                                      src="/profile/profile.jpg" 
                                      alt="Phan Ngoc Trieu" 
                                      fill
                                      className="object-cover"
                                  />
                              </div>
                              
                              <span className="text-blue-600 font-bold tracking-widest text-xs uppercase mb-2 block">
                                  {t('profile.founder.label')}
                              </span>
                              <h2 className="text-3xl font-bold text-gray-900 mb-4">Phan Ngọc Triều</h2>
                              <blockquote className="text-lg text-gray-600 italic border-l-4 border-blue-200 pl-4 py-1 mb-6 text-left w-full bg-blue-50/50 p-4 rounded-r-lg">
                                  {t('profile.founder.quote')}
                              </blockquote>
                              <div className="text-gray-600 space-y-4 text-justify leading-relaxed text-sm">
                                  <p>
                                      {t('profile.founder.bio').replace('{{age}}', (new Date().getFullYear() - 1999).toString())}
                                  </p>
                              </div>

                              <div className="flex justify-center gap-3 mt-8">
                                  <a href="https://www.facebook.com/trieu.phanngoc.31/" target="_blank" className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all">
                                      <i className="fab fa-facebook-f"></i>
                                  </a>
                                  <a href="https://www.youtube.com/@trieuphanngoc3549" target="_blank" className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all">
                                      <i className="fab fa-youtube"></i>
                                  </a>
                                  <a href="mailto:phantrieu580@gmail.com" className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-600 hover:text-white transition-all">
                                      <i className="fas fa-envelope"></i>
                                  </a>
                              </div>
                          </div>
                      </section>
                  </div>
              </div>

              {/* RIGHT COLUMN - Tabbed Sidebar */}
              <div className="lg:col-span-7">
                  <div className="">
                      {/* Tab Headers */}
                      <div className="flex bg-white/50 backdrop-blur-sm rounded-2xl p-2 shadow-sm border border-gray-100 overflow-x-auto scrollbar-hide gap-2">
                          <button 
                              onClick={() => setActiveTab('calling')}
                              className={`flex-1 py-4 px-6 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center justify-center gap-3
                                  ${activeTab === 'calling' ? 'bg-white text-blue-600 shadow-md ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
                          >
                              <i className="fas fa-bullhorn text-lg"></i>
                              {t('profile.calling.title')}
                          </button>
                          <button 
                              onClick={() => setActiveTab('vision')}
                              className={`flex-1 py-4 px-6 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center justify-center gap-3
                                  ${activeTab === 'vision' ? 'bg-white text-blue-600 shadow-md ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
                          >
                              <i className="fas fa-eye text-lg"></i>
                              {t('profile.vision.title')}
                          </button>
                          <button 
                              onClick={() => setActiveTab('mission')}
                              className={`flex-1 py-4 px-6 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center justify-center gap-3
                                  ${activeTab === 'mission' ? 'bg-white text-blue-600 shadow-md ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
                          >
                              <i className="fas fa-bullseye text-lg"></i>
                              {t('profile.mission.title')}
                          </button>
                          <button 
                              onClick={() => setActiveTab('values')}
                              className={`flex-1 py-4 px-6 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center justify-center gap-3
                                  ${activeTab === 'values' ? 'bg-white text-blue-600 shadow-md ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
                          >
                              <i className="fas fa-heart text-lg"></i>
                              {t('profile.values.title')}
                          </button>
                      </div>

                      {/* Tab Content */}
                      <div className="mt-8">
                        {renderTabContent()}
                      </div>
                  </div>
              </div>

          </div>
      </div>
    </main>
  );
}
