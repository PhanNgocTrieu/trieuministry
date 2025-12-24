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
      <footer className="bg-dark text-white py-12 mt-12 border-t border-gray-800">
        <div className="container container-custom">
          <div className="flex flex-wrap -mx-4 mb-8">
             {/* Brand Column */}
             <div className="w-full md:w-5/12 px-4 mb-8 md:mb-0">
               <h4 className="font-bold mb-4 text-blue-500 flex items-center">
                  <i className="fas fa-church me-2"></i>
                  {t('nav.brand')}
               </h4>
               <p className="text-gray-400 mb-4 pr-4">
                  {t('footer.description')}
               </p>
               <div className="flex gap-3">
                  <a href="https://www.facebook.com/trieu.phanngoc.31/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-gray-600 flex items-center justify-center text-white hover:bg-white hover:text-blue-600 transition-all">
                     <i className="fab fa-facebook-f"></i>
                  </a>
                  <a href="https://www.youtube.com/@trieuphanngoc3549" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-gray-600 flex items-center justify-center text-white hover:bg-white hover:text-red-600 transition-all">
                     <i className="fab fa-youtube"></i>
                  </a>
                  <a href="https://github.com/PhanNgocTrieu" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-gray-600 flex items-center justify-center text-white hover:bg-white hover:text-gray-900 transition-all">
                     <i className="fab fa-github"></i>
                  </a>
               </div>
             </div>

             {/* Links Column */}
             <div className="w-full md:w-3/12 px-4 mb-8 md:mb-0">
               <h5 className="font-bold mb-4 text-white">{t('footer.links_title')}</h5>
               <ul className="space-y-2 text-gray-400">
                  <li><Link href="/" className="hover:text-white transition-colors">{t('nav.home')}</Link></li>
                  <li><Link href="/profile" className="hover:text-white transition-colors">{t('nav.about')}</Link></li>
                  <li><Link href="/blogs" className="hover:text-white transition-colors">{t('nav.blogs')}</Link></li>
                  <li><Link href="/docs" className="hover:text-white transition-colors">{t('nav.docs')}</Link></li>
                  <li><Link href="/prayers" className="hover:text-white transition-colors">{t('nav.prayers')}</Link></li>
                  <li><Link href="/donate" className="hover:text-white transition-colors">{t('nav.donate')}</Link></li>
               </ul>
             </div>

             {/* Contact Column */}
             <div className="w-full md:w-4/12 px-4">
               <h5 className="font-bold mb-4 text-white">{t('footer.contact_title')}</h5>
               <ul className="space-y-3 text-gray-400">
                  <li className="flex items-start">
                     <i className="fas fa-map-marker-alt mt-1 me-3 text-blue-500"></i>
                     <span>{t('footer.address')}</span>
                  </li>
                  <li className="flex items-start">
                     <i className="fas fa-envelope mt-1 me-3 text-blue-500"></i>
                     <span>phantrieu580@gmail.com</span>
                  </li>
                  <li className="flex items-start">
                     <i className="fas fa-phone-alt mt-1 me-3 text-blue-500"></i>
                     <span>0974 210 249</span>
                  </li>
               </ul>
             </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-wrap items-center">
            <div className="w-full md:w-1/2 text-center md:text-left mb-4 md:mb-0">
              <p className="text-sm text-gray-500" dangerouslySetInnerHTML={{ __html: t('footer.copyright') }}></p>
            </div>
            <div className="w-full md:w-1/2 text-center md:text-right">
              <p className="text-sm text-gray-500" dangerouslySetInnerHTML={{ __html: t('footer.designed_by') }}></p>
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
