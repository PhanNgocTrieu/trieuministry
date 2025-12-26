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
    <main>
      {/* Hero Section */}
      <header className="hero-section text-center text-white flex items-center relative">
        <div className="overlay absolute inset-0 bg-black/50 z-0"></div>
        <div className="container container-custom relative z-10 fade-in-up py-20">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            {t('home.hero.title')}
          </h1>
          <p className="text-lg md:text-2xl mb-8 mx-auto max-w-2xl text-gray-200">
            {t('home.hero.subtitle')}
          </p>
          <div className="flex justify-center gap-4">
            <Link 
              href="/prayers" 
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition-all hover:-translate-y-1 shadow-lg inline-flex items-center"
            >
              <i className="fas fa-praying-hands me-2"></i>
              {t('home.hero.cta_prayer')}
            </Link>
            <Link 
              href="/donate" 
              className="px-6 py-3 border-2 border-white text-white hover:bg-white hover:text-black rounded-full font-semibold transition-all hover:-translate-y-1 shadow-lg inline-flex items-center"
            >
              <i className="fas fa-heart me-2"></i>
              {t('home.hero.cta_donate')}
            </Link>
          </div>
        </div>
      </header>

      {/* Why Join Section */}
      <section className="py-20 bg-gray-50">
        <div className="container container-custom">
          <div className="text-center mb-12 fade-in-up">
            <span className="text-blue-600 font-bold uppercase tracking-widest text-sm">
              {t('home.mission.label')}
            </span>
            <h2 className="text-3xl font-bold mt-2 text-gray-800">
              {t('home.mission.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center fade-in-up bg-white p-8 rounded-lg shadow-sm hover:-translate-y-2 transition-transform duration-300">
              <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                <i className="fas fa-users"></i>
              </div>
              <h4 className="font-bold text-xl mb-3 text-gray-800">{t('home.mission.mission_1.title')}</h4>
              <p className="text-gray-600">{t('home.mission.mission_1.content')}</p>
            </div>

            <div className="text-center fade-in-up bg-white p-8 rounded-lg shadow-sm hover:-translate-y-2 transition-transform duration-300" style={{ animationDelay: '0.1s' }}>
               <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                <i className="fas fa-praying-hands"></i>
              </div>
              <h4 className="font-bold text-xl mb-3 text-gray-800">{t('home.mission.mission_2.title')}</h4>
              <p className="text-gray-600">{t('home.mission.mission_2.content')}</p>
            </div>

            <div className="text-center fade-in-up bg-white p-8 rounded-lg shadow-sm hover:-translate-y-2 transition-transform duration-300" style={{ animationDelay: '0.2s' }}>
               <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                <i className="fas fa-hand-holding-heart"></i>
              </div>
              <h4 className="font-bold text-xl mb-3 text-gray-800">{t('home.mission.mission_3.title')}</h4>
              <p className="text-gray-600">{t('home.mission.mission_3.content')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Verse Section */}
      <section className="py-20 relative text-white text-center flex items-center justify-center min-h-[400px] bg-fixed bg-center bg-cover" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('/hero_bg.png')" }}>
         <div className="container container-custom fade-in-up">
            <i className="fas fa-quote-left text-5xl mb-6 opacity-50 block mx-auto"></i>
            <blockquote className="text-2xl md:text-3xl font-light italic font-serif mb-6 block mx-auto max-w-4xl">
               {t('home.daily_verse.content')}
            </blockquote>
            <cite className="block text-lg opacity-90 not-italic font-semibold">
               {t('home.daily_verse.citation')}
            </cite>
         </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-white">
         <div className="container container-custom text-center fade-in-up">
            <h2 className="text-3xl font-bold mb-8 text-gray-800">{t('home.cta.title')}</h2>
            <div className="flex justify-center gap-4">
               <Link href="/prayers" className="px-8 py-3 border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white rounded-full font-semibold transition-colors">
                  {t('home.cta.btn_prayer')}
               </Link>
               <Link href="/donate" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold shadow-md transition-transform hover:-translate-y-1">
                  {t('home.cta.btn_donate')}
               </Link>
            </div>
         </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-500 rounded-full blur-3xl"></div>
        </div>

        <div className="container container-custom fade-in-up relative z-10">
           <div className="flex flex-col lg:flex-row items-center justify-between gap-12 bg-gray-800/50 p-8 md:p-12 rounded-3xl border border-gray-700/50 backdrop-blur-sm">
              <div className="lg:w-1/2 text-center lg:text-left">
                 <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600/20 text-blue-400 rounded-xl mb-6">
                    <i className="fas fa-envelope-open-text text-xl"></i>
                 </div>
                 <h3 className="text-3xl font-bold mb-4">
                    Sign up for our Newsletter
                 </h3>
                 <p className="text-gray-400 text-lg leading-relaxed">
                    Receive the latest articles, testimonies, and updates from TrieuMinistry directly to your inbox every week.
                 </p>
              </div>

              <div className="lg:w-1/2 w-full">
                 <form className="flex flex-col sm:flex-row gap-3">
                    <input 
                       type="email" 
                       placeholder="Enter your email address" 
                       className="flex-1 px-6 py-4 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                       required
                    />
                    <button 
                       type="submit" 
                       className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/20 transition-all transform hover:-translate-y-1"
                    >
                       Subscribe
                    </button>
                 </form>
                 <p className="text-xs text-gray-500 mt-4 text-center sm:text-left">
                    <i className="fas fa-lock mr-1"></i> Your email is safe with us. No spam.
                 </p>
              </div>
           </div>
        </div>
      </section>
    </main>
  );
}
