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
      <header className="relative min-h-screen flex items-center justify-center text-center px-4 overflow-hidden">
        {/* Background Gradients */}
        {/* Background Gradients (Premium Light & Deep Dark) */}
        <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950 z-0 transition-colors duration-500">
             {/* Light Mode Gradient Mesh */}
             <div className="absolute inset-0 bg-[radial-gradient(at_top_left,_var(--tw-gradient-stops))] from-purple-100/40 via-blue-50/20 to-transparent dark:hidden opacity-100"></div>
             <div className="absolute inset-0 bg-[radial-gradient(at_bottom_right,_var(--tw-gradient-stops))] from-blue-100/40 via-purple-50/20 to-transparent dark:hidden opacity-100"></div>
             
             {/* Dark Mode Gradient Mesh */}
             <div className="hidden dark:block absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 opacity-80"></div>
             
             {/* Animated Blobs */}
             <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-500/20 dark:bg-purple-500/10 rounded-full blur-[100px] animate-pulse"></div>
             <div className="absolute bottom-[0%] left-[-10%] w-[600px] h-[600px] bg-blue-500/20 dark:bg-blue-600/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="container container-custom relative z-10 fade-in-up">
           <div className="max-w-4xl mx-auto">
              <span className="inline-block px-4 py-1.5 rounded-full bg-slate-800/50 border border-white/10 text-purple-300 text-sm font-bold mb-8 backdrop-blur-md">
                 ✝️ Faith • Hope • Love
              </span>
              <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 leading-tight drop-shadow-sm">
                {t('home.hero.title')}
              </h1>
              <p className="text-xl md:text-2xl mb-10 text-slate-600 dark:text-slate-300 leading-relaxed font-light">
                {t('home.hero.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-5">
                <Link 
                  href="/prayers" 
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:scale-105 inline-flex items-center justify-center text-lg"
                >
                  <i className="fas fa-praying-hands me-3"></i>
                  {t('home.hero.cta_prayer')}
                </Link>
                <Link 
                  href="/donate" 
                  className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10 rounded-xl font-bold transition-all hover:scale-105 inline-flex items-center justify-center text-lg hover:border-slate-300 dark:hover:border-white/20 shadow-lg shadow-slate-200/50 dark:shadow-none"
                >
                  <i className="fas fa-heart me-3 text-red-500"></i>
                  {t('home.hero.cta_donate')}
                </Link>
              </div>
           </div>
        </div>
      </header>

      {/* Why Join Section */}
      <section className="py-24 relative bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-white/5 transition-colors duration-300">
        <div className="container container-custom relative z-10">
          <div className="text-center mb-20 fade-in-up">
            <span className="text-purple-600 dark:text-purple-400 font-bold uppercase tracking-widest text-sm mb-3 block">
              {t('home.mission.label')}
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white">
              {t('home.mission.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center fade-in-up premium-glass-panel">
              <div className="w-20 h-20 bg-blue-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-8 text-3xl text-blue-600 dark:text-blue-400 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
                <i className="fas fa-users"></i>
              </div>
              <h4 className="font-bold text-2xl mb-4 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">{t('home.mission.mission_1.title')}</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">{t('home.mission.mission_1.content')}</p>
            </div>

            <div className="text-center fade-in-up premium-glass-panel" style={{ animationDelay: '0.1s' }}>
               <div className="w-20 h-20 bg-purple-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-8 text-3xl text-purple-600 dark:text-purple-400 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all">
                <i className="fas fa-praying-hands"></i>
              </div>
              <h4 className="font-bold text-2xl mb-4 text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">{t('home.mission.mission_2.title')}</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">{t('home.mission.mission_2.content')}</p>
            </div>

            <div className="text-center fade-in-up premium-glass-panel" style={{ animationDelay: '0.2s' }}>
               <div className="w-20 h-20 bg-green-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-8 text-3xl text-green-600 dark:text-green-400 group-hover:scale-110 group-hover:bg-green-500/20 transition-all">
                <i className="fas fa-hand-holding-heart"></i>
              </div>
              <h4 className="font-bold text-2xl mb-4 text-slate-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-300 transition-colors">{t('home.mission.mission_3.title')}</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">{t('home.mission.mission_3.content')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Verse Section */}
      <section className="py-20 relative text-white text-center flex items-center justify-center min-h-[400px] overflow-hidden">
         {/* Parallax-like Background */}
         <div className="absolute inset-0 bg-[url('/hero_bg.png')] bg-cover bg-fixed bg-center opacity-30 dark:opacity-30 mix-blend-multiply dark:mix-blend-normal"></div>
         <div className="absolute inset-0 bg-gradient-to-b from-purple-900 via-slate-900 to-slate-950 dark:from-slate-950 dark:via-slate-950/80 dark:to-slate-950 opacity-90 dark:opacity-100"></div>

         <div className="container container-custom fade-in-up relative z-10">
            <i className="fas fa-quote-left text-4xl mb-6 text-purple-500/30 block mx-auto"></i>
            <blockquote className="text-2xl md:text-3xl font-light italic font-serif mb-6 block mx-auto max-w-4xl leading-relaxed text-slate-100">
               {t('home.daily_verse.content')}
            </blockquote>
            <cite className="block text-lg md:text-xl text-purple-300 not-italic font-bold tracking-wide">
               — {t('home.daily_verse.citation')}
            </cite>
         </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 border-t border-slate-200 dark:border-white/5 relative overflow-hidden transition-colors">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="container container-custom text-center fade-in-up relative z-10">
             <div className="max-w-3xl mx-auto bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-10 md:p-14 rounded-[3rem] shadow-2xl dark:shadow-none border border-white dark:border-white/10 ring-1 ring-slate-200/50 dark:ring-transparent">
                <h2 className="text-4xl font-bold mb-8 text-slate-900 dark:text-white">{t('home.cta.title')}</h2>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                   <Link href="/prayers" className="px-10 py-4 border-2 border-purple-500/20 text-purple-600 dark:text-purple-300 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-xl font-bold transition-all text-lg flex items-center justify-center gap-2">
                      <i className="fas fa-praying-hands"></i>
                      {t('home.cta.btn_prayer')}
                   </Link>
                   <Link href="/donate" className="px-10 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:scale-105 rounded-xl font-bold shadow-lg shadow-purple-500/20 transition-all text-lg flex items-center justify-center gap-2">
                      <i className="fas fa-heart text-red-200"></i>
                      {t('home.cta.btn_donate')}
                   </Link>
                </div>
             </div>
          </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white relative overflow-hidden border-t border-slate-200 dark:border-white/5 transition-colors">
        <div className="container container-custom fade-in-up relative z-10">
           <div className="flex flex-col lg:flex-row items-center justify-between gap-12 glass-panel p-8 md:p-16 rounded-[2.5rem] shadow-premium relative overflow-hidden">
              {/* Glow effects inside card */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]"></div>
                            <div className="lg:w-1/2 text-center lg:text-left relative z-10">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-100 dark:bg-slate-700/50 text-purple-600 dark:text-purple-400 rounded-2xl mb-6 border border-purple-200 dark:border-white/10">
                     <i className="fas fa-envelope-open-text text-2xl"></i>
                  </div>
                  <h3 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">
                     {t('home.newsletter.title')}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                     {t('home.newsletter.description')}
                  </p>
               </div>

               <div className="lg:w-1/2 w-full relative z-10">
                  <form className="flex flex-col sm:flex-row gap-4">
                     <input 
                        type="email" 
                        placeholder={t('home.newsletter.placeholder')} 
                        className="flex-1 px-6 py-4 rounded-xl bg-white dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                        required
                     />
                     <button 
                        type="submit" 
                        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all transform hover:-translate-y-1 whitespace-nowrap"
                     >
                        {t('home.newsletter.button')}
                     </button>
                  </form>
                  <p className="text-xs text-slate-500 mt-4 text-center sm:text-left flex items-center justify-center sm:justify-start gap-2">
                     <i className="fas fa-lock opacity-50"></i> {t('home.newsletter.note')}
                  </p>
              </div>
           </div>
        </div>
      </section>
    </main>
  );
}
