"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
   const { user, logout, isAdmin } = useAuth(); // isAdmin added
   
   const handleLogout = async () => {
     try {
       await logout();
       setUserDropdownOpen(false);
       setIsOpen(false);
       router.push('/');
     } catch (error) {
       console.error('Failed to logout', error);
     }
   };
 
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
     { href: '/resources', label: "Resources" }, // Unified Hub
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
             {user ? (
                <div className="relative">
                   <button 
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-gray-50 transition-colors"
                   >
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 relative">
                         {user.photoURL ? (
                            <Image 
                               src={user.photoURL} 
                               alt={user.displayName || 'User'} 
                               fill
                               sizes="40px"
                               className="object-cover"
                            />
                         ) : (
                            <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                               {user.email?.charAt(0).toUpperCase()}
                            </div>
                         )}
                      </div>
                      <span className="text-sm font-semibold max-w-[100px] truncate hidden xl:block">
                         {user.displayName?.split(' ')[0] || 'User'}
                      </span>
                      {isAdmin && (
                        <span className="hidden xl:inline-block px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold uppercase rounded ml-1">Admin</span>
                      )}
                      <i className="fas fa-chevron-down text-xs text-gray-400"></i>
                   </button>
 
                   {userDropdownOpen && (
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-fade-in-up">
                         <div className="px-4 py-3 border-b border-gray-50 mb-1">
                            <p className="text-sm font-bold text-gray-900 truncate">{user.displayName}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            <p className="text-[10px] text-gray-400 mt-1">Role: {isAdmin ? 'Admin' : 'User'}</p>
                         </div>
                         
                         {isAdmin && (
                            <Link 
                               href="/admin" 
                               className="block px-4 py-2 text-sm text-purple-700 font-bold hover:bg-purple-50"
                               onClick={() => setUserDropdownOpen(false)}
                            >
                               <i className="fas fa-tachometer-alt me-2"></i> Dashboard
                            </Link>
                         )}
 
                         <Link 
                            href="/account" 
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                            onClick={() => setUserDropdownOpen(false)}
                         >
                            <i className="fas fa-user-circle me-2"></i> My Account
                         </Link>
                         <button 
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
                         >
                            <i className="fas fa-sign-out-alt me-2"></i> Logout
                         </button>
                      </div>
                   )}
               </div>
            ) : (
               <Link href="/login" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold shadow-sm transition-all text-sm flex items-center gap-2">
                  <i className="fas fa-user"></i> Login
               </Link>
            )}

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
             {user ? (
               <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-200">
                     <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 relative">
                        {user.photoURL ? (
                           <Image 
                              src={user.photoURL} 
                              alt={user.displayName || 'User'} 
                              fill
                              className="object-cover"
                           />
                        ) : (
                           <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                              {user.email?.charAt(0).toUpperCase()}
                           </div>
                        )}
                     </div>
                     <div>
                        <p className="font-bold text-gray-900">{user.displayName || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{user.email}</p>
                     </div>
                  </div>
                  <Link 
                     href="/account"
                     className="w-full block text-center px-5 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-sm transition-all text-sm mb-2"
                     onClick={() => setIsOpen(false)}
                  >
                     My Account
                  </Link>
                  <button 
                     onClick={handleLogout}
                     className="w-full text-center px-5 py-2 bg-white border border-red-100 text-red-600 hover:bg-red-50 rounded-lg font-bold shadow-sm transition-all text-sm"
                  >
                     Logout
                  </button>
               </div>
             ) : (
               <Link 
                  href="/login" 
                  className="w-full text-center px-5 py-3 bg-blue-600 text-white rounded-lg font-bold shadow-sm"
                  onClick={() => setIsOpen(false)}
               >
                  Login
               </Link>
             )}
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
