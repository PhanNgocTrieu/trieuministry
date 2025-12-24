"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { t, language, setLanguage } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggle = () => setIsOpen(!isOpen);

  const isActive = (path: string) => pathname === path ? 'text-blue-600 font-bold' : 'text-gray-600 hover:text-blue-600';

  const switchLanguage = (lang: 'en' | 'vi') => {
    setLanguage(lang);
    setIsOpen(false);
  };

  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/profile', label: t('nav.about') },
    { href: '/blogs', label: t('nav.blogs') },
    { href: '/docs', label: t('nav.docs') },
    { href: '/ministry', label: t('nav.ministry') },
    { href: '/prayers', label: t('nav.prayers') },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md py-2' : 'bg-white shadow-sm py-4'}`}>
      <div className="container mx-auto px-4 lg:px-8 flex justify-between items-center">
        {/* Brand */}
        <Link href="/" className="text-xl md:text-2xl font-bold text-blue-600 flex items-center gap-2">
          <i className="fas fa-church"></i>
          <span>{t('nav.brand')}</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-6">
          <ul className="flex items-center gap-6">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={`text-base font-medium transition-colors ${isActive(link.href)}`}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-4 border-l border-gray-200 pl-6">
             {/* Action Buttons */}
            <Link href="/login" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold shadow-sm transition-all text-sm flex items-center gap-2">
               <i className="fas fa-user"></i> Login
            </Link>

            <Link href="/donate" className="px-5 py-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white rounded-full font-semibold transition-all text-sm">
              {t('nav.donate')}
            </Link>

            {/* Language Switcher */}
            <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
               <button 
                 onClick={() => switchLanguage('vi')} 
                 className={`px-3 py-1 text-xs rounded-md font-bold transition-all ${language === 'vi' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
               >
                 VI
               </button>
               <button 
                 onClick={() => switchLanguage('en')} 
                 className={`px-3 py-1 text-xs rounded-md font-bold transition-all ${language === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
               >
                 EN
               </button>
            </div>
          </div>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="lg:hidden p-2 text-gray-600 hover:text-blue-600 focus:outline-none"
          onClick={toggle}
          aria-label="Toggle navigation"
        >
          <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'} text-2xl`}></i>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`lg:hidden bg-white border-t overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
          <ul className="flex flex-col gap-3">
             {navLinks.map((link) => (
              <li key={link.href}>
                <Link 
                  href={link.href} 
                  className={`block py-2 text-lg font-medium border-b border-gray-100 ${isActive(link.href)}`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          
          <div className="flex flex-col gap-3 mt-2">
            <Link href="/login" className="w-full text-center px-5 py-3 bg-blue-600 text-white rounded-lg font-bold shadow-sm">
               Login
            </Link>
            <Link href="/donate" className="w-full text-center px-5 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-bold">
              {t('nav.donate')}
            </Link>
             <div className="flex justify-center gap-4 py-2">
               <button onClick={() => switchLanguage('vi')} className={`font-bold ${language === 'vi' ? 'text-blue-600' : 'text-gray-500'}`}>Tiếng Việt</button>
               <span className="text-gray-300">|</span>
               <button onClick={() => switchLanguage('en')} className={`font-bold ${language === 'en' ? 'text-blue-600' : 'text-gray-500'}`}>English</button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
