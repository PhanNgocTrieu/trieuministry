"use client";

import React, { useEffect } from 'react';
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function Home() {
  const { t } = useLanguage();

  useEffect(() => {
    // Simple animation trigger
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
    <main className="overflow-hidden">
      {/* Hero Section */}
      {/* Hero Section - Modern & Clean */}
      <header className="relative min-h-[90vh] flex items-center justify-center text-center px-4 overflow-hidden pt-20">
        {/* Background - Subtle Premium Gradients */}
        <div className="absolute inset-0 bg-white dark:bg-slate-950 z-0 transition-colors duration-500">
             <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-violet-50/50 to-transparent dark:from-violet-900/10 dark:to-transparent"></div>
             <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-blue-100/40 dark:bg-blue-900/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse-slow"></div>
             <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-purple-100/40 dark:bg-purple-900/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="container container-custom relative z-10 fade-in-up">
           <div className="max-w-5xl mx-auto flex flex-col items-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-md shadow-sm mb-8 hover:scale-105 transition-transform cursor-default">
                  <span className="flex h-2 w-2 rounded-full bg-violet-600 dark:bg-violet-400"></span>
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300 tracking-wide uppercase">Faith • Hope • Love</span>
              </div>

              {/* Main Title */}
              <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-[1] text-slate-900 dark:text-white">
                {t('home.hero.title')}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg md:text-xl mb-10 text-slate-500 dark:text-slate-400 leading-relaxed font-medium max-w-2xl mx-auto">
                {t('home.hero.subtitle')}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto">
                <Link 
                  href="/prayers" 
                  className="group relative px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-base transition-all hover:scale-105 hover:shadow-xl shadow-lg shadow-slate-900/20 dark:shadow-white/10 flex items-center justify-center gap-2"
                >
                  <span>{t('home.hero.cta_prayer')}</span>
                  <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                </Link>
                <Link 
                  href="/donate" 
                  className="px-8 py-3.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-full font-bold text-base transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-105 flex items-center justify-center gap-2"
                >
                  <i className="fas fa-heart text-rose-500"></i>
                  <span>{t('home.hero.cta_donate')}</span>
                </Link>
              </div>
           </div>
        </div>
      </header>

      {/* Bento Grid Mission Section */}
      <section className="py-24 relative bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-white/5">
        <div className="container container-custom relative z-10">
          <div className="text-center mb-16 fade-in-up max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">
              {t('home.mission.title')}
            </h2>
            <div className="h-1 w-16 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full mx-auto"></div>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-2 gap-6 h-auto md:h-[550px]">
            
            {/* Card 1: Large Featured (Spans 2 rows, 1 col) */}
            <div className="md:row-span-2 group relative overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none p-8 flex flex-col justify-between transition-all hover:shadow-2xl fade-in-up">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors"></div>
               
               <div className="relative z-10">
                 <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-500">
                    <i className="fas fa-users"></i>
                 </div>
                 <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 leading-tight">
                    {t('home.mission.mission_1.title')}
                 </h3>
                 <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                    {t('home.mission.mission_1.content')}
                 </p>
               </div>
               
               <div className="relative z-10 mt-6">
                  <div className="text-indigo-600 dark:text-indigo-400 font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all cursor-pointer">
                     Learn More <i className="fas fa-long-arrow-alt-right"></i>
                  </div>
               </div>
            </div>

            {/* Card 2: Top Right (Wide, Spans 2 cols) */}
            <div className="md:col-span-2 group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 to-indigo-600 p-8 flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-violet-500/20 fade-in-up" style={{ animationDelay: '0.1s' }}>
                {/* Abstract Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                
                <div className="relative z-10 flex-1 text-center md:text-left">
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-4 backdrop-blur-sm">
                      <i className="fas fa-star"></i> Featured Ministry
                   </div>
                   <h3 className="text-2xl font-bold text-white mb-2">
                      {t('home.mission.mission_2.title')}
                   </h3>
                   <p className="text-white/80 text-base leading-relaxed mb-6">
                      {t('home.mission.mission_2.content')}
                   </p>
                   <Link href="/prayers" className="inline-flex px-5 py-2.5 bg-white text-violet-600 rounded-xl font-bold items-center gap-2 hover:bg-violet-50 transition-colors shadow-lg text-sm">
                      Join Prayer Wall
                   </Link>
                </div>
                <div className="relative z-10 w-full md:w-1/3 flex justify-center">
                    <div className="w-28 h-28 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 text-4xl text-white animate-pulse-slow">
                        <i className="fas fa-praying-hands"></i>
                    </div>
                </div>
            </div>

            {/* Card 3: Bottom Left (1 col) */}
            <div className="group relative overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none p-8 transition-all hover:scale-[1.02] fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl mb-4">
                    <i className="fas fa-hand-holding-heart"></i>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {t('home.mission.mission_3.title')}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {t('home.mission.mission_3.content')}
                </p>
            </div>

            {/* Card 4: Bottom Right (1 col) - New decorative or stat card */}
            <div className="group relative overflow-hidden rounded-[2rem] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/5 p-8 flex items-center justify-center text-center fade-in-up" style={{ animationDelay: '0.3s' }}>
                <div>
                   <div className="text-4xl font-black text-slate-900 dark:text-white mb-1">100+</div>
                   <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs">Lives Touched</p>
                </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Daily Verse Section - Simplified & Elegant */}
      <section className="py-24 relative bg-slate-900 text-white flex items-center justify-center overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-violet-900/50 to-slate-900 z-0"></div>
         <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] z-0"></div>
         
         <div className="container container-custom relative z-10 fade-in-up text-center">
            <div className="max-w-3xl mx-auto">
              <i className="fas fa-quote-right text-3xl mb-6 text-violet-400/50"></i>
              <blockquote className="text-2xl md:text-4xl font-serif font-medium leading-tight mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
                 "{t('home.daily_verse.content')}"
              </blockquote>
              <div className="flex items-center justify-center gap-4">
                  <div className="h-px w-8 bg-violet-500/50"></div>
                  <cite className="text-base md:text-lg text-violet-300 font-bold tracking-widest not-italic uppercase">
                     {t('home.daily_verse.citation')}
                  </cite>
                  <div className="h-px w-8 bg-violet-500/50"></div>
              </div>
            </div>
         </div>
      </section>



      {/* Newsletter Section - Minimalist */}
      <section className="py-20 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="container container-custom fade-in-up">
           <div className="flex flex-col md:flex-row items-center justify-between gap-12 max-w-5xl mx-auto">
              <div className="md:w-1/2">
                  <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white flex items-center gap-3">
                     <i className="fas fa-paper-plane text-violet-600"></i>
                     {t('home.newsletter.title')}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                     {t('home.newsletter.description')}
                  </p>
               </div>

               <div className="md:w-1/2 w-full">
                  <form className="flex gap-3">
                     <input 
                        type="email" 
                        placeholder={t('home.newsletter.placeholder')} 
                        className="flex-1 px-5 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all shadow-sm"
                        required
                     />
                     <button 
                        type="submit" 
                        className="px-6 py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-all shadow-lg shadow-violet-500/20"
                     >
                        Subscribe
                     </button>
                  </form>
                  <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                     <i className="fas fa-shield-alt"></i> {t('home.newsletter.note')}
                  </p>
              </div>
           </div>
        </div>
      </section>
    </main>
  );
}
