"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const { 
      user, 
      loading, 
      logout,
      isAdmin,
      isVolunteer 
   } = useAuth();
   const { theme, toggleTheme } = useTheme();
   
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
       setScrolled(window.scrollY > 20);
     };

     const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setUserDropdownOpen(false);
        }
      };
 
     window.addEventListener('scroll', handleScroll);
     document.addEventListener('mousedown', handleClickOutside);
     return () => {
        window.removeEventListener('scroll', handleScroll);
        document.removeEventListener('mousedown', handleClickOutside);
     };
   }, []);
 
   const toggle = () => setIsOpen(!isOpen);
 
   const isActive = (path: string) => pathname === path 
     ? 'text-purple-600 dark:text-purple-400 font-bold' 
     : 'text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg';
   
   const isActiveMobile = (path: string) => pathname === path 
     ? 'text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-white/5 border-l-2 border-purple-500 pl-3' 
     : 'text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-white pl-4';

   const switchLanguage = (lang: 'en' | 'vi') => {
     setLanguage(lang);
     setIsOpen(false);
   };

   const navLinks = [
     { href: '/', label: t('nav.home') },
     { href: '/profile', label: t('nav.about') },
     // Appeals is hidden from public nav, accessible via Admin or direct link
     { href: '/resources', label: t('nav.resources') }, // Unified Hub
     { href: '/ministry', label: t('nav.ministry') },
     { href: '/prayers', label: t('nav.prayers') },
   ];

   return (
     <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled ? 'bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-slate-200 dark:border-white/5 py-3 shadow-sm dark:shadow-none' : 'bg-transparent border-transparent py-5'}`}>
       <div className="container mx-auto px-4 lg:px-8 flex justify-between items-center">
         {/* Brand */}
         <Link href="/" className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 hover:scale-105 transition-transform">
           <i className="fas fa-church text-purple-600 dark:text-purple-500"></i>
           <span className="tracking-tight">{t('nav.brand')}</span>
         </Link>

         {/* Desktop Menu */}
         <div className="hidden lg:flex items-center gap-6">
           <ul className="flex items-center gap-2">
             {navLinks.map((link) => (
               <li key={link.href}>
                 <Link href={link.href} className={`px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${isActive(link.href)}`}>
                   {link.label}
                 </Link>
               </li>
             ))}
           </ul>

           <div className="flex items-center gap-4 border-l border-slate-200 dark:border-white/10 pl-6">
              {/* Action Buttons */}
             {user ? (
                <div className="relative" ref={dropdownRef}>
                   <button 
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                   >
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-white/20 relative bg-slate-100 dark:bg-slate-800">
                         {user.photoURL ? (
                            <Image 
                               src={user.photoURL} 
                               alt={user.displayName || 'User'} 
                               fill
                               sizes="40px"
                               className="object-cover"
                            />
                         ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                               {user.email?.charAt(0).toUpperCase()}
                            </div>
                         )}
                      </div>
                      <span className="text-sm font-semibold max-w-[100px] truncate hidden xl:block text-slate-700 dark:text-slate-200 whitespace-nowrap">
                         {user.displayName?.split(' ')[0] || 'User'}
                      </span>
                      {isAdmin && (
                        <span className="hidden xl:inline-block px-1.5 py-0.5 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 text-[10px] font-bold uppercase rounded ml-1 whitespace-nowrap">{t('nav.admin_role')}</span>
                      )}
                      {isVolunteer && (
                        <span className="hidden xl:inline-block px-1.5 py-0.5 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-300 border border-green-200 dark:border-green-500/30 text-[10px] font-bold uppercase rounded ml-1 whitespace-nowrap">Volunteer</span>
                      )}
                       <i className="fas fa-chevron-down text-xs text-slate-500"></i>
                   </button>

                   {userDropdownOpen && (
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 py-2 animate-fade-in-up backdrop-blur-xl">
                         <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 mb-2 bg-slate-50 dark:bg-slate-800/50">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.displayName}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                            <div className="flex items-center gap-1 mt-2">
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Role:</span>
                                {isAdmin ? (
                                    <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 text-[10px] font-bold uppercase rounded whitespace-nowrap">{t('nav.admin_role')}</span>
                                ) : isVolunteer ? (
                                    <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-300 border border-green-200 dark:border-green-500/30 text-[10px] font-bold uppercase rounded whitespace-nowrap">Volunteer</span>
                                ) : (
                                    <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 text-[10px] font-bold uppercase rounded whitespace-nowrap">{t('nav.user_role')}</span>
                                )}
                            </div>
                         </div>
                         
                         <Link 
                            href="/admin" 
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-600 dark:text-purple-400 font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                            onClick={() => setUserDropdownOpen(false)}
                         >
                            <i className="fas fa-tachometer-alt w-5"></i> {t('nav.dashboard_admin')}
                         </Link>

                         <Link 
                            href="/account" 
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                            onClick={() => setUserDropdownOpen(false)}
                         >
                            <i className="fas fa-user-circle w-5"></i> {t('nav.my_account')}
                         </Link>
                         <div className="h-px bg-slate-100 dark:bg-white/5 my-1"></div>
                         <button 
                            onClick={handleLogout}
                            className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 font-medium transition-colors"
                         >
                            <i className="fas fa-sign-out-alt w-5"></i> {t('nav.logout')}
                         </button>
                      </div>
                   )}
               </div>
            ) : (
               <Link href="/login" className="px-5 py-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-full font-semibold backdrop-blur-sm transition-all text-sm flex items-center gap-2 border border-slate-200 dark:border-white/5">
                  <i className="fas fa-user"></i> {t('nav.login')}
               </Link>
            )}

            <Link href="/donate" className="px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg hover:shadow-purple-500/30 text-white rounded-full font-bold transition-all text-sm transform hover:-translate-y-0.5 whitespace-nowrap">
              {t('nav.donate')}
            </Link>

            {/* Theme Toggle */}
            <button
               onClick={toggleTheme}
               className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-yellow-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
               aria-label="Toggle Theme"
            >
               {theme === 'dark' ? <i className="fas fa-sun"></i> : <i className="fas fa-moon"></i>}
            </button>

            {/* Language Switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-800/50 rounded-lg p-1 gap-1 border border-slate-200 dark:border-white/5">
               <button 
                 onClick={() => switchLanguage('vi')} 
                 className={`px-3 py-1 text-xs rounded-md font-bold transition-all ${language === 'vi' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
               >
                 VI
               </button>
               <button 
                 onClick={() => switchLanguage('en')} 
                 className={`px-3 py-1 text-xs rounded-md font-bold transition-all ${language === 'en' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
               >
                 EN
               </button>
            </div>
          </div>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-white focus:outline-none"
          onClick={toggle}
          aria-label="Toggle navigation"
        >
          <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'} text-2xl`}></i>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="container mx-auto px-4 py-6 flex flex-col gap-6">
          <ul className="flex flex-col gap-2">
             {navLinks.map((link) => (
              <li key={link.href}>
                <Link 
                  href={link.href} 
                  className={`block py-3 text-lg font-medium transition-colors ${isActiveMobile(link.href)}`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          
          <div className="flex flex-col gap-4 pt-4 border-t border-slate-200 dark:border-white/10">  
             <div className="flex justify-between items-center px-2">
                <span className="text-sm font-bold text-slate-500 uppercase">Theme</span>
                <button
                   onClick={toggleTheme}
                   className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-white font-bold text-sm"
                >
                   {theme === 'dark' ? (
                      <>
                        <i className="fas fa-sun text-yellow-500"></i> Light Mode
                      </>
                   ) : (
                      <>
                        <i className="fas fa-moon text-purple-500"></i> Dark Mode
                      </>
                   )}
                </button>
             </div>

             {user ? (
               <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200 dark:border-white/5">
                     <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 relative bg-slate-200 dark:bg-slate-700">
                        {user.photoURL ? (
                           <Image 
                              src={user.photoURL} 
                              alt={user.displayName || 'User'} 
                              fill
                              sizes="48px"
                              className="object-cover"
                           />
                        ) : (
                           <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-base font-bold">
                              {user.email?.charAt(0).toUpperCase()}
                           </div>
                        )}
                     </div>
                     <div>
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 dark:text-white">{user.displayName || 'User'}</p>
                             {isAdmin ? (
                                <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 text-[10px] font-bold uppercase rounded">{t('nav.admin_role')}</span>
                             ) : isVolunteer ? (
                                <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-300 border border-green-200 dark:border-green-500/30 text-[10px] font-bold uppercase rounded">Volunteer</span>
                             ) : (
                                <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 text-[10px] font-bold uppercase rounded">{t('nav.user_role')}</span>
                             )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{user.email}</p>
                     </div>
                  </div>
                  
                   <Link 
                      href="/admin"
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-purple-50 dark:bg-purple-600/20 text-purple-600 dark:text-purple-300 border border-purple-100 dark:border-purple-500/30 rounded-lg font-bold transition-all text-sm mb-2 hover:bg-purple-100 dark:hover:bg-purple-600/30"
                      onClick={() => setIsOpen(false)}
                   >
                      <i className="fas fa-tachometer-alt"></i> {t('nav.dashboard_admin')}
                   </Link>

                  <Link 
                     href="/account"
                     className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg font-bold transition-all text-sm mb-2 hover:bg-slate-300 dark:hover:bg-slate-600"
                     onClick={() => setIsOpen(false)}
                  >
                     <i className="fas fa-user-circle"></i> {t('nav.my_account')}
                  </Link>
                  <button 
                     onClick={handleLogout}
                     className="w-full text-center px-5 py-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-100 dark:border-red-500/20 rounded-lg font-bold transition-all text-sm"
                  >
                     {t('nav.logout')}
                  </button>
               </div>
             ) : (
               <Link 
                  href="/login" 
                  className="w-full text-center px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                  onClick={() => setIsOpen(false)}
               >
                  {t('nav.login')}
               </Link>
             )}
            <Link 
              href="/donate" 
              className="w-full text-center px-5 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-bold shadow-lg shadow-purple-900/20"
              onClick={() => setIsOpen(false)}
            >
              {t('nav.donate')}
            </Link>
             <div className="flex justify-center gap-4 py-2 mt-2">
               <button onClick={() => switchLanguage('vi')} className={`font-bold transition-colors ${language === 'vi' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500'}`}>Tiếng Việt</button>
               <span className="text-slate-300 dark:text-slate-700">|</span>
               <button onClick={() => switchLanguage('en')} className={`font-bold transition-colors ${language === 'en' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500'}`}>English</button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
