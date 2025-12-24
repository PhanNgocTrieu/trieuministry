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
      <section className="py-20 relative text-white text-center flex items-center justify-center min-h-[400px] bg-fixed bg-center bg-cover" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('/images/hero_bg.png')" }}>
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
    </main>
  );
}
