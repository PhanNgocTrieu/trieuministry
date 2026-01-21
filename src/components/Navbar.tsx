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
     ? 'text-violet-600 dark:text-violet-400 font-bold' 
     : 'text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl';
   
   const isActiveMobile = (path: string) => pathname === path 
     ? 'text-violet-600 dark:text-violet-400 font-bold bg-violet-50 dark:bg-violet-500/10 border-l-2 border-violet-500 pl-3' 
     : 'text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-white pl-4';

   const switchLanguage = (lang: 'en' | 'vi') => {
     setLanguage(lang);
     setIsOpen(false);
   };

   const navLinks = [
     { href: '/', label: t('nav.home') },
     { href: '/profile', label: t('nav.about') },
     { href: '/resources', label: t('nav.resources') },
     { href: '/ministry', label: t('nav.ministry') },
     { href: '/prayers', label: t('nav.prayers') },
   ];

   // Don't render Navbar on admin pages
   if (pathname?.startsWith('/admin')) {
     return null;
   }

   return (
     <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
       scrolled 
         ? 'bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-slate-200/50 dark:border-white/5 py-3 shadow-lg shadow-slate-200/20 dark:shadow-none' 
         : 'bg-transparent border-transparent py-5'
     }`}>
       <div className="container mx-auto px-4 lg:px-8 flex justify-between items-center">
         {/* Brand */}
         <Link href="/" className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5 hover:scale-105 transition-transform group">
           <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/25 group-hover:shadow-violet-500/40 transition-shadow">
             <i className="fas fa-church text-sm"></i>
           </div>
           <span className="tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">{t('nav.brand')}</span>
         </Link>

         {/* Desktop Menu */}
         <div className="hidden lg:flex items-center gap-6">
           <ul className="flex items-center gap-1">
             {navLinks.map((link) => (
               <li key={link.href}>
                 <Link href={link.href} className={`px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${isActive(link.href)}`}>
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
                      className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                   >
                      <div className="w-8 h-8 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-white/20 relative bg-slate-100 dark:bg-slate-800 shadow-sm">
                         {user.photoURL ? (
                            <Image 
                               src={user.photoURL} 
                               alt={user.displayName || 'User'} 
                               fill
                               sizes="40px"
                               className="object-cover"
                            />
                         ) : (
                            <div className="w-full h-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                               {user.email?.charAt(0).toUpperCase()}
                            </div>
                         )}
                      </div>
                      <span className="text-sm font-semibold max-w-[100px] truncate hidden xl:block text-slate-700 dark:text-slate-200 whitespace-nowrap">
                         {user.displayName?.split(' ')[0] || 'User'}
                      </span>
                      {isAdmin && (
                        <span className="hidden xl:inline-block px-2 py-0.5 bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30 text-[10px] font-bold uppercase rounded-md ml-1 whitespace-nowrap">{t('nav.admin_role')}</span>
                      )}
                      {isVolunteer && (
                        <span className="hidden xl:inline-block px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-bold uppercase rounded-md ml-1 whitespace-nowrap">Volunteer</span>
                      )}
                       <i className="fas fa-chevron-down text-xs text-slate-400 transition-transform" style={{ transform: userDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}></i>
                   </button>

                   {userDropdownOpen && (
                      <div className="absolute right-0 top-full mt-3 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-white/10 py-2 animate-fadeIn backdrop-blur-xl overflow-hidden">
                         <div className="px-4 py-4 border-b border-slate-100 dark:border-white/5 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.displayName}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{user.email}</p>
                            <div className="flex items-center gap-2 mt-3">
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Role:</span>
                                {isAdmin ? (
                                    <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30 text-[10px] font-bold uppercase rounded-md whitespace-nowrap">{t('nav.admin_role')}</span>
                                ) : isVolunteer ? (
                                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-bold uppercase rounded-md whitespace-nowrap">Volunteer</span>
                                ) : (
                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 text-[10px] font-bold uppercase rounded-md whitespace-nowrap">{t('nav.user_role')}</span>
                                )}
                            </div>
                         </div>
                         
                         <div className="p-2">
                           <Link 
                              href="/admin" 
                              className="flex items-center gap-3 px-4 py-3 text-sm text-violet-600 dark:text-violet-400 font-bold hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors rounded-xl"
                              onClick={() => setUserDropdownOpen(false)}
                           >
                              <i className="fas fa-tachometer-alt w-5"></i> {t('nav.dashboard_admin')}
                           </Link>

                           <Link 
                              href="/account" 
                              className="flex items-center gap-3 px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors rounded-xl"
                              onClick={() => setUserDropdownOpen(false)}
                           >
                              <i className="fas fa-user-circle w-5"></i> {t('nav.my_account')}
                           </Link>
                         </div>
                         
                         <div className="p-2 border-t border-slate-100 dark:border-white/5">
                           <button 
                              onClick={handleLogout}
                              className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 font-medium transition-colors rounded-xl"
                           >
                              <i className="fas fa-sign-out-alt w-5"></i> {t('nav.logout')}
                           </button>
                         </div>
                      </div>
                   )}
               </div>
            ) : (
               <Link href="/login" className="px-5 py-2.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-xl font-semibold backdrop-blur-sm transition-all text-sm flex items-center gap-2 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10">
                  <i className="fas fa-user"></i> {t('nav.login')}
               </Link>
            )}

            <Link href="/donate" className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-lg hover:shadow-violet-500/30 text-white rounded-xl font-bold transition-all text-sm transform hover:-translate-y-0.5 whitespace-nowrap">
              {t('nav.donate')}
            </Link>

            {/* Theme Toggle */}
            <button
               onClick={toggleTheme}
               className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all hover:scale-105"
               aria-label="Toggle Theme"
            >
               {theme === 'dark' ? <i className="fas fa-sun"></i> : <i className="fas fa-moon"></i>}
            </button>

            {/* Language Switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-800/50 rounded-xl p-1 gap-1 border border-slate-200 dark:border-white/5">
               <button 
                 onClick={() => switchLanguage('vi')} 
                 className={`px-3 py-1.5 text-xs rounded-lg font-bold transition-all ${language === 'vi' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
               >
                 VI
               </button>
               <button 
                 onClick={() => switchLanguage('en')} 
                 className={`px-3 py-1.5 text-xs rounded-lg font-bold transition-all ${language === 'en' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
               >
                 EN
               </button>
            </div>
          </div>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="lg:hidden p-2.5 text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-white focus:outline-none hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
          onClick={toggle}
          aria-label="Toggle navigation"
        >
          <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 overflow-hidden transition-all duration-400 ease-out ${isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="container mx-auto px-4 py-6 flex flex-col gap-6">
          <ul className="flex flex-col gap-1">
             {navLinks.map((link) => (
              <li key={link.href}>
                <Link 
                  href={link.href} 
                  className={`block py-3.5 text-base font-medium transition-colors rounded-xl ${isActiveMobile(link.href)}`}
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
                   className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-white font-bold text-sm border border-slate-200 dark:border-white/5"
                >
                   {theme === 'dark' ? (
                      <>
                        <i className="fas fa-sun text-amber-500"></i> Light Mode
                      </>
                   ) : (
                      <>
                        <i className="fas fa-moon text-violet-500"></i> Dark Mode
                      </>
                   )}
                </button>
             </div>

             {user ? (
               <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-4 mb-5 pb-5 border-b border-slate-200 dark:border-white/5">
                     <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-white/10 relative bg-slate-200 dark:bg-slate-700 shadow-md">
                        {user.photoURL ? (
                           <Image 
                              src={user.photoURL} 
                              alt={user.displayName || 'User'} 
                              fill
                              sizes="56px"
                              className="object-cover"
                           />
                        ) : (
                           <div className="w-full h-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-lg font-bold">
                              {user.email?.charAt(0).toUpperCase()}
                           </div>
                        )}
                     </div>
                     <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-slate-900 dark:text-white">{user.displayName || 'User'}</p>
                             {isAdmin ? (
                                <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30 text-[10px] font-bold uppercase rounded-md">{t('nav.admin_role')}</span>
                             ) : isVolunteer ? (
                                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-bold uppercase rounded-md">Volunteer</span>
                             ) : (
                                <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 text-[10px] font-bold uppercase rounded-md">{t('nav.user_role')}</span>
                             )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px] mt-1">{user.email}</p>
                     </div>
                  </div>
                  
                   <Link 
                      href="/admin"
                      className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-violet-50 dark:bg-violet-600/20 text-violet-600 dark:text-violet-300 border border-violet-100 dark:border-violet-500/30 rounded-xl font-bold transition-all text-sm mb-3 hover:bg-violet-100 dark:hover:bg-violet-600/30"
                      onClick={() => setIsOpen(false)}
                   >
                      <i className="fas fa-tachometer-alt"></i> {t('nav.dashboard_admin')}
                   </Link>

                  <Link 
                     href="/account"
                     className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl font-bold transition-all text-sm mb-3 hover:bg-slate-300 dark:hover:bg-slate-600"
                     onClick={() => setIsOpen(false)}
                  >
                     <i className="fas fa-user-circle"></i> {t('nav.my_account')}
                  </Link>
                  <button 
                     onClick={handleLogout}
                     className="w-full text-center px-5 py-3.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-100 dark:border-red-500/20 rounded-xl font-bold transition-all text-sm"
                  >
                     {t('nav.logout')}
                  </button>
               </div>
             ) : (
               <Link 
                  href="/login" 
                  className="w-full text-center px-5 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  onClick={() => setIsOpen(false)}
               >
                  {t('nav.login')}
               </Link>
             )}
            <Link 
              href="/donate" 
              className="w-full text-center px-5 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-violet-500/25"
              onClick={() => setIsOpen(false)}
            >
              {t('nav.donate')}
            </Link>
             <div className="flex justify-center gap-4 py-3 mt-2">
               <button onClick={() => switchLanguage('vi')} className={`font-bold transition-colors ${language === 'vi' ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500'}`}>Tiếng Việt</button>
               <span className="text-slate-300 dark:text-slate-700">|</span>
               <button onClick={() => switchLanguage('en')} className={`font-bold transition-colors ${language === 'en' ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500'}`}>English</button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
