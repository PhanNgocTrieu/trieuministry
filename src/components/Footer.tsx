"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const Footer = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { t } = useLanguage();
  const pathname = usePathname();
  const { user } = useAuth();

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

  // Don't render Footer on admin pages, or on /lib if not logged in
  if (pathname?.startsWith('/admin') || (pathname?.startsWith('/lib') && !user)) {
    return null;
  }


  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      <footer className="bg-white dark:bg-slate-950 text-slate-600 dark:text-white py-24 mt-0 border-t border-slate-200 dark:border-white/5 relative overflow-hidden transition-colors">
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-transparent dark:from-slate-900/30 dark:to-transparent pointer-events-none"></div>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500 opacity-40 dark:opacity-60"></div>
        
        {/* Gradient blobs */}
        <div className="absolute bottom-[-150px] right-[-150px] w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/5 to-violet-500/5 dark:from-indigo-500/10 dark:to-violet-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-[-100px] left-[-150px] w-[500px] h-[500px] bg-gradient-to-br from-violet-500/5 to-cyan-500/5 dark:from-violet-500/10 dark:to-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="container container-custom relative z-10">
          <div className="flex flex-wrap -mx-4 mb-16">
             {/* Brand Column */}
             <div className="w-full md:w-5/12 px-4 mb-12 md:mb-0">
               <div className="mb-8 flex items-center gap-3">
                   <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/25">
                        <i className="fas fa-church text-lg"></i>
                   </div>
                   <h4 className="font-black text-2xl bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white">
                      {t('nav.brand')}
                   </h4>
               </div>
               <p className="text-slate-500 dark:text-slate-400 mb-10 pr-4 leading-relaxed text-lg max-w-sm">
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
               <h5 className="font-bold mb-8 text-slate-900 dark:text-white text-lg flex items-center gap-3">
                    <span className="w-8 h-1 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"></span>
                    {t('footer.links_title')}
               </h5>
               <ul className="space-y-4 text-slate-500 dark:text-slate-400">
                  {['home', 'about', 'docs', 'prayers', 'donate'].map((link) => (
                      <li key={link}>
                        <Link href={link === 'home' ? '/' : link === 'about' ? '/profile' : `/${link}`} className="group flex items-center gap-3 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                            <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-violet-500 group-hover:scale-125 transition-all"></span>
                            {t(`nav.${link}`)}
                        </Link>
                      </li>
                  ))}
               </ul>
             </div>

             {/* Contact Column */}
             <div className="w-full md:w-4/12 px-4">
                <h5 className="font-bold mb-8 text-slate-900 dark:text-white text-lg flex items-center gap-3">
                    <span className="w-8 h-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full"></span>
                    {t('footer.contact_title')}
                </h5>
               <ul className="space-y-6 text-slate-500 dark:text-slate-400">
                  <li className="flex items-start group">
                     <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mr-4 shrink-0 shadow-md border border-slate-100 dark:border-white/5 group-hover:scale-110 group-hover:shadow-indigo-500/20 transition-all">
                        <i className="fas fa-map-marker-alt"></i>
                     </div>
                     <div>
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Address</span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{t('footer.address')}</span>
                     </div>
                  </li>
                  <li className="flex items-start group">
                     <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-rose-500 dark:text-rose-400 mr-4 shrink-0 shadow-md border border-slate-100 dark:border-white/5 group-hover:scale-110 group-hover:shadow-rose-500/20 transition-all">
                        <i className="fas fa-envelope"></i>
                     </div>
                     <div>
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Email</span>
                        <a href="mailto:phantrieu580@gmail.com" className="text-slate-700 dark:text-slate-300 font-medium hover:text-violet-600 dark:hover:text-violet-400 transition-colors">phantrieu580@gmail.com</a>
                     </div>
                  </li>
                  <li className="flex items-start group">
                     <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-emerald-500 dark:text-emerald-400 mr-4 shrink-0 shadow-md border border-slate-100 dark:border-white/5 group-hover:scale-110 group-hover:shadow-emerald-500/20 transition-all">
                        <i className="fas fa-phone-alt"></i>
                     </div>
                     <div>
                         <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Phone</span>
                         <a href="tel:0974210249" className="text-slate-700 dark:text-slate-300 font-medium hover:text-violet-600 dark:hover:text-violet-400 transition-colors">0974 210 249</a>
                     </div>
                  </li>
               </ul>
             </div>
          </div>

          <div className="border-t border-slate-200 dark:border-white/5 pt-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-sm text-slate-500 font-medium" dangerouslySetInnerHTML={{ __html: t('footer.copyright') }}></p>
            </div>
            <div className="flex items-center gap-6 flex-wrap justify-center">
                 {['Privacy Policy', 'Terms of Service'].map(item => (
                     <a key={item} href="#" className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 uppercase tracking-wider transition-colors">
                         {item}
                     </a>
                 ))}
                 <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                 <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                     Made with <i className="fas fa-heart text-rose-500 animate-pulse"></i> by <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-500">TrieuMinistry</span>
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
