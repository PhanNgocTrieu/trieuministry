"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

const Footer = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      <footer className="bg-slate-950 text-white py-16 mt-0 border-t border-white/5 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
        <div className="absolute bottom-[-100px] right-[-100px] w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="container container-custom relative z-10">
          <div className="flex flex-wrap -mx-4 mb-12">
             {/* Brand Column */}
             <div className="w-full md:w-5/12 px-4 mb-10 md:mb-0">
               <h4 className="font-bold mb-6 text-white flex items-center text-2xl">
                  <i className="fas fa-church me-3 text-purple-500"></i>
                  {t('nav.brand')}
               </h4>
               <p className="text-slate-400 mb-6 pr-4 leading-relaxed">
                  {t('footer.description')}
               </p>
               <div className="flex gap-4">
                  <a href="https://www.facebook.com/trieu.phanngoc.31/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white hover:border-transparent transition-all transform hover:-translate-y-1">
                     <i className="fab fa-facebook-f"></i>
                  </a>
                  <a href="https://www.youtube.com/@trieuphanngoc3549" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-red-600 hover:text-white hover:border-transparent transition-all transform hover:-translate-y-1">
                     <i className="fab fa-youtube"></i>
                  </a>
                  <a href="https://github.com/PhanNgocTrieu" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-white hover:text-slate-900 hover:border-transparent transition-all transform hover:-translate-y-1">
                     <i className="fab fa-github"></i>
                  </a>
               </div>
             </div>

             {/* Links Column */}
             <div className="w-full md:w-3/12 px-4 mb-10 md:mb-0">
               <h5 className="font-bold mb-6 text-white text-lg">{t('footer.links_title')}</h5>
               <ul className="space-y-3 text-slate-400">
                  <li><Link href="/" className="hover:text-purple-400 transition-colors flex items-center gap-2"><i className="fas fa-chevron-right text-xs opacity-50"></i> {t('nav.home')}</Link></li>
                  <li><Link href="/profile" className="hover:text-purple-400 transition-colors flex items-center gap-2"><i className="fas fa-chevron-right text-xs opacity-50"></i> {t('nav.about')}</Link></li>
                  <li><Link href="/blogs" className="hover:text-purple-400 transition-colors flex items-center gap-2"><i className="fas fa-chevron-right text-xs opacity-50"></i> {t('nav.blogs')}</Link></li>
                  <li><Link href="/docs" className="hover:text-purple-400 transition-colors flex items-center gap-2"><i className="fas fa-chevron-right text-xs opacity-50"></i> {t('nav.docs')}</Link></li>
                  <li><Link href="/prayers" className="hover:text-purple-400 transition-colors flex items-center gap-2"><i className="fas fa-chevron-right text-xs opacity-50"></i> {t('nav.prayers')}</Link></li>
                  <li><Link href="/donate" className="hover:text-purple-400 transition-colors flex items-center gap-2"><i className="fas fa-chevron-right text-xs opacity-50"></i> {t('nav.donate')}</Link></li>
               </ul>
             </div>

             {/* Contact Column */}
             <div className="w-full md:w-4/12 px-4">
               <h5 className="font-bold mb-6 text-white text-lg">{t('footer.contact_title')}</h5>
               <ul className="space-y-4 text-slate-400">
                  <li className="flex items-start group">
                     <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-purple-500 mr-3 shrink-0 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                        <i className="fas fa-map-marker-alt text-sm"></i>
                     </div>
                     <span className="mt-1">{t('footer.address')}</span>
                  </li>
                  <li className="flex items-start group">
                     <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-purple-500 mr-3 shrink-0 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                        <i className="fas fa-envelope text-sm"></i>
                     </div>
                     <span className="mt-1">phantrieu580@gmail.com</span>
                  </li>
                  <li className="flex items-start group">
                     <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-purple-500 mr-3 shrink-0 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                        <i className="fas fa-phone-alt text-sm"></i>
                     </div>
                     <span className="mt-1">0974 210 249</span>
                  </li>
               </ul>
             </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-wrap items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-slate-500" dangerouslySetInnerHTML={{ __html: t('footer.copyright') }}></p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-slate-500 flex items-center justify-center md:justify-end gap-1">
                 Designed with <i className="fas fa-heart text-red-500 animate-pulse"></i> by TrieuMinistry
              </p>
            </div>
          </div>
        </div>
      </footer>

      <button 
        className={`back-to-top ${showBackToTop ? 'show' : ''}`} 
        aria-label="Back to top"
        onClick={scrollToTop}
      >
        <i className="fas fa-arrow-up"></i>
      </button>
    </>
  );
};

export default Footer;
