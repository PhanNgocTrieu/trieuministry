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
      <footer className="bg-white dark:bg-slate-950 text-slate-600 dark:text-white py-20 mt-0 border-t border-slate-200 dark:border-white/5 relative overflow-hidden transition-colors">
        {/* Decorative background glow */}
        <div className="absolute inset-0 bg-slate-50/50 dark:bg-slate-900/50 pointer-events-none"></div>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20 dark:opacity-40"></div>
        <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-purple-600/5 dark:bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="container container-custom relative z-10">
          <div className="flex flex-wrap -mx-4 mb-16">
             {/* Brand Column */}
             <div className="w-full md:w-5/12 px-4 mb-12 md:mb-0">
               <div className="mb-6 flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                        <i className="fas fa-church"></i>
                   </div>
                   <h4 className="font-black text-2xl bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white">
                      {t('nav.brand')}
                   </h4>
               </div>
               <p className="text-slate-500 dark:text-slate-400 mb-8 pr-4 leading-relaxed text-lg max-w-sm">
                  {t('footer.description')}
               </p>
               <div className="flex gap-4">
                  <a href="https://www.facebook.com/trieu.phanngoc.31/" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] transition-all transform hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/20 group">
                     <i className="fab fa-facebook-f text-xl"></i>
                  </a>
                  <a href="https://www.youtube.com/@trieuphanngoc3549" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-[#FF0000] hover:text-white hover:border-[#FF0000] transition-all transform hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/20 group">
                     <i className="fab fa-youtube text-xl"></i>
                  </a>
                  <a href="https://github.com/PhanNgocTrieu" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 hover:border-slate-900 dark:hover:border-white transition-all transform hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-500/20 group">
                     <i className="fab fa-github text-xl"></i>
                  </a>
               </div>
             </div>

             {/* Links */}
             <div className="w-full md:w-3/12 px-4 mb-10 md:mb-0">
               <h5 className="font-bold mb-8 text-slate-900 dark:text-white text-lg flex items-center gap-2">
                    <span className="w-8 h-[2px] bg-purple-500 rounded-full"></span>
                    {t('footer.links_title')}
               </h5>
               <ul className="space-y-4 text-slate-500 dark:text-slate-400">
                  {['home', 'about', 'blogs', 'docs', 'prayers', 'donate'].map((link) => (
                      <li key={link}>
                        <Link href={link === 'home' ? '/' : link === 'about' ? '/profile' : `/${link}`} className="group flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-blue-500 transition-colors"></span>
                            {t(`nav.${link}`)}
                        </Link>
                      </li>
                  ))}
               </ul>
             </div>

             {/* Contact Column */}
             <div className="w-full md:w-4/12 px-4">
                <h5 className="font-bold mb-8 text-slate-900 dark:text-white text-lg flex items-center gap-2">
                    <span className="w-8 h-[2px] bg-blue-500 rounded-full"></span>
                    {t('footer.contact_title')}
                </h5>
               <ul className="space-y-6 text-slate-500 dark:text-slate-400">
                  <li className="flex items-start group">
                     <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-500 mr-4 shrink-0 shadow-sm border border-slate-100 dark:border-white/5 group-hover:scale-110 transition-transform">
                        <i className="fas fa-map-marker-alt"></i>
                     </div>
                     <div>
                        <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Address</span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{t('footer.address')}</span>
                     </div>
                  </li>
                  <li className="flex items-start group">
                     <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-red-500 dark:text-red-400 mr-4 shrink-0 shadow-sm border border-slate-100 dark:border-white/5 group-hover:scale-110 transition-transform">
                        <i className="fas fa-envelope"></i>
                     </div>
                     <div>
                        <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Email</span>
                        <a href="mailto:phantrieu580@gmail.com" className="text-slate-700 dark:text-slate-300 font-medium hover:text-blue-600 transition-colors">phantrieu580@gmail.com</a>
                     </div>
                  </li>
                  <li className="flex items-start group">
                     <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-green-500 dark:text-green-400 mr-4 shrink-0 shadow-sm border border-slate-100 dark:border-white/5 group-hover:scale-110 transition-transform">
                        <i className="fas fa-phone-alt"></i>
                     </div>
                     <div>
                         <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Phone</span>
                         <a href="tel:0974210249" className="text-slate-700 dark:text-slate-300 font-medium hover:text-blue-600 transition-colors">0974 210 249</a>
                     </div>
                  </li>
               </ul>
             </div>
          </div>

          <div className="border-t border-slate-200 dark:border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-sm text-slate-500 font-medium" dangerouslySetInnerHTML={{ __html: t('footer.copyright') }}></p>
            </div>
            <div className="flex items-center gap-6">
                 {['Privacy Policy', 'Terms of Service'].map(item => (
                     <a key={item} href="#" className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 uppercase tracking-wider transition-colors">
                         {item}
                     </a>
                 ))}
                 <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                 <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
                     Made with <i className="fas fa-heart text-red-500 animate-pulse"></i> by TrieuMinistry
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
