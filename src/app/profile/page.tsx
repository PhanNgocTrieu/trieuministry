"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';

type TabType = 'founder' | 'calling' | 'vision' | 'mission' | 'values' | 'heart';

export default function ProfilePage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('founder');

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


  return (
    <div className="bg-gray-50 min-h-screen pb-40">
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

      <div className="container container-custom">
          
          <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-2 border border-gray-200/50 max-w-5xl mx-auto">
              {/* Tab Headers */}
              <div className="flex overflow-x-auto scrollbar-hide gap-2 p-1 bg-gray-100/50 rounded-2xl mb-2">
                  <button 
                      onClick={() => setActiveTab('founder')}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2
                          ${activeTab === 'founder' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'}`}
                  >
                      <i className="fas fa-user-tie"></i>
                      {t('profile.founder.label')}
                  </button>
                  <button 
                      onClick={() => setActiveTab('calling')}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2
                          ${activeTab === 'calling' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'}`}
                  >
                      <i className="fas fa-envelope-open-text"></i>
                      {t('profile.calling.title')}
                  </button>
                  <button 
                      onClick={() => setActiveTab('heart')}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2
                          ${activeTab === 'heart' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'}`}
                  >
                      <i className="fas fa-hand-holding-heart"></i>
                      {t('profile.heart.title')}
                  </button>
                  <button 
                      onClick={() => setActiveTab('vision')}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2
                          ${activeTab === 'vision' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'}`}
                  >
                      <i className="fas fa-eye"></i>
                      {t('profile.vision.title')}
                  </button>
                  <button 
                      onClick={() => setActiveTab('mission')}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2
                          ${activeTab === 'mission' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'}`}
                  >
                      <i className="fas fa-bullseye"></i>
                      {t('profile.mission.title')}
                  </button>
                  <button 
                      onClick={() => setActiveTab('values')}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2
                          ${activeTab === 'values' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'}`}
                  >
                      <i className="fas fa-bible"></i>
                      {t('profile.values.title')}
                  </button>
              </div>

              {/* Tab Content */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-12 min-h-[500px]">
                  
                  {activeTab === 'founder' && (
                      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <div className="flex flex-col lg:flex-row gap-12 items-start">
                              <div className="w-full lg:w-1/3 flex flex-col items-center text-center">
                                  <div className="relative w-56 h-56 rounded-full overflow-hidden border-4 border-white shadow-xl mb-6">
                                      <Image 
                                          src="/profile/profile.jpg" 
                                          alt="Phan Ngoc Trieu" 
                                          fill
                                          sizes="(max-width: 768px) 100vw, 224px"
                                          className="object-cover"
                                      />
                                  </div>
                                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Phan Ngọc Triều</h2>
                                  <span className="text-blue-600 font-bold tracking-widest text-sm uppercase mb-6 block">
                                      {t('profile.founder.label')}
                                  </span>
                                  
                                  {/* Social Links */}
                                  <div className="flex justify-center gap-4">
                                      <a href="https://www.facebook.com/trieu.phanngoc.31/" target="_blank" className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all text-xl">
                                          <i className="fab fa-facebook-f"></i>
                                      </a>
                                      <a href="https://www.youtube.com/@trieuphanngoc3549" target="_blank" className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all text-xl">
                                          <i className="fab fa-youtube"></i>
                                      </a>
                                      <a href="mailto:phantrieu580@gmail.com" className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-600 hover:text-white transition-all text-xl">
                                          <i className="fas fa-envelope"></i>
                                      </a>
                                  </div>
                              </div>
                              <div className="w-full lg:w-2/3">
                                  <blockquote className="text-xl text-gray-700 italic border-l-4 border-blue-600 pl-6 py-4 mb-8 bg-blue-50/50 rounded-r-xl">
                                      {t('profile.founder.quote')}
                                  </blockquote>
                                  <div className="text-gray-600 space-y-6 text-justify leading-loose text-lg">
                                      <p>
                                          {t('profile.founder.bio').replace('{{age}}', (new Date().getFullYear() - 1999).toString())}
                                      </p>
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}

                  {activeTab === 'calling' && (
                      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto flex flex-col items-center text-center">
                          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-3xl mb-8 shadow-sm">
                              <i className="fas fa-envelope-open-text"></i>
                          </div>
                          <h4 className="text-4xl font-bold text-gray-900 mb-8">{t('profile.calling.title')}</h4>
                          <div className="text-gray-600 leading-loose text-xl space-y-8 text-justify">
                              <p>{t('profile.calling.content_1')}</p>
                              <p>{t('profile.calling.content_2')}</p>
                              <div className="text-center py-8">
                                  <p className="font-serif italic text-3xl text-blue-600">"Here I am, Lord. Send me!"</p>
                              </div>
                          </div>
                      </div>
                  )}

                  {activeTab === 'heart' && (
                       <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto flex flex-col items-center">
                           <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center text-3xl mb-8 shadow-sm">
                               <i className="fas fa-hand-holding-heart"></i>
                           </div>
                           <h4 className="text-4xl font-bold text-gray-900 mb-8 text-center">{t('profile.heart.title')}</h4>
                           <div className="space-y-6 w-full">
                               {(t('profile.heart.items') as any as string[]).map((item, index) => (
                                   <div key={index} className="flex gap-4 items-start bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-all">
                                       <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0 font-bold text-lg">
                                           {index + 1}
                                       </div>
                                       <p className="text-gray-700 text-lg leading-relaxed flex-1 pt-1">
                                           {item}
                                       </p>
                                   </div>
                               ))}
                           </div>
                       </div>
                  )}

                  {activeTab === 'vision' && (
                      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto flex flex-col items-center text-center">
                          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-3xl mb-8 shadow-sm">
                              <i className="fas fa-eye"></i>
                          </div>
                          <h4 className="text-4xl font-bold text-gray-900 mb-8">{t('profile.vision.title')}</h4>
                          <p className="text-gray-600 leading-loose text-xl">
                              {t('profile.vision.content')}
                          </p>
                      </div>
                  )}

                  {activeTab === 'mission' && (
                      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto flex flex-col items-center text-center">
                          <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center text-3xl mb-8 shadow-sm">
                              <i className="fas fa-bullseye"></i>
                          </div>
                          <h4 className="text-4xl font-bold text-gray-900 mb-8">{t('profile.mission.title')}</h4>
                          <p className="text-gray-600 leading-loose text-xl">
                              {t('profile.mission.content')}
                          </p>
                      </div>
                  )}

                  {activeTab === 'values' && (
                      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto">
                          <div className="flex flex-col items-center text-center mb-12">
                              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm">
                                  <i className="fas fa-bible"></i>
                              </div>
                              <h4 className="text-4xl font-bold text-gray-900">{t('profile.values.title')}</h4>
                          </div>
                          
                          <div className="space-y-8">
                               {(t('profile.values.items') as any as {title: string, content: string}[]).map((value, index) => (
                                   <div key={index} className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-md transition-all">
                                        <h5 className="text-xl font-bold text-indigo-800 mb-3 flex items-center gap-3">
                                            <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
                                            {value.title}
                                        </h5>
                                        <p className="text-gray-700 leading-relaxed text-lg pl-5 text-justify">
                                            {value.content}
                                        </p>
                                   </div>
                               ))}
                          </div>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div> /* End of Profile Page Container */
  );
}
