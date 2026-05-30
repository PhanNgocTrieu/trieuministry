"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { signUp } = useAuth();
  const { theme } = useTheme();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
        setError("Password should be at least 6 characters");
        return;
    }

    setLoading(true);
    try {
      await signUp(email, password, name);
      router.push('/');
    } catch (err: any) {
        if (err.code === 'auth/email-already-in-use') {
            setError("Email is already in use");
        } else {
            setError("Failed to create an account");
        }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center py-20 px-4 overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
       
       {/* Background Effects */}
       <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-sky-500/10 dark:bg-sky-600/10 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 dark:bg-blue-700/10 rounded-full blur-[100px]"></div>
       </div>

       <div className="w-full max-w-md relative z-10 animate-fade-in-up">
           <div className="text-center mb-10">
               <Link href="/" className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-800 shadow-lg shadow-blue-600/30 text-white mb-6 transform hover:scale-105 transition-transform">
                   <i className="fas fa-church text-2xl"></i>
               </Link>
               <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-3">Join Our Family</h1>
               <p className="text-slate-500 dark:text-slate-400">Create an account to get started</p>
           </div>
           
           <div className="premium-glass-panel p-8 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden backdrop-blur-2xl">
               {error && (
                   <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-600/10 border border-amber-200 dark:border-amber-600/20 flex items-start gap-3 fade-in">
                       <i className="fas fa-exclamation-circle text-amber-600 mt-0.5"></i>
                       <p className="text-sm font-medium text-red-600 dark:text-amber-500">{error}</p>
                   </div>
               )}

               <form onSubmit={handleRegister} className="space-y-6">
                    <div>
                       <label className="block text-xs font-bold uppercase text-slate-500 mb-2 pl-1">Full Name</label>
                       <div className="relative">
                           <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                           <input
                               type="text"
                               required
                               placeholder="John Doe"
                               value={name}
                               onChange={(e) => setName(e.target.value)}
                               className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all dark:text-white font-medium"
                           />
                       </div>
                   </div>

                   <div>
                       <label className="block text-xs font-bold uppercase text-slate-500 mb-2 pl-1">Email Address</label>
                       <div className="relative">
                           <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                           <input
                               type="email"
                               required
                               placeholder="you@example.com"
                               value={email}
                               onChange={(e) => setEmail(e.target.value)}
                               className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all dark:text-white font-medium"
                           />
                       </div>
                   </div>

                   <div>
                       <label className="block text-xs font-bold uppercase text-slate-500 mb-2 pl-1">Password</label>
                       <div className="relative">
                           <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                           <input
                               type="password"
                               required
                               placeholder="••••••••"
                               value={password}
                               onChange={(e) => setPassword(e.target.value)}
                               className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all dark:text-white font-medium"
                           />
                       </div>
                   </div>

                   <div>
                       <label className="block text-xs font-bold uppercase text-slate-500 mb-2 pl-1">Confirm Password</label>
                       <div className="relative">
                           <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                           <input
                               type="password"
                               required
                               placeholder="••••••••"
                               value={confirmPassword}
                               onChange={(e) => setConfirmPassword(e.target.value)}
                               className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all dark:text-white font-medium"
                           />
                       </div>
                   </div>

                   <button
                       type="submit"
                       disabled={loading}
                       className="w-full py-4 bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                   >
                       {loading ? <div className="loading-spinner-sm border-white"></div> : 'Create Account'}
                   </button>
               </form>
           </div>
           
           <p className="text-center mt-8 text-slate-500 dark:text-slate-400">
               Already have an account?{' '}
               <Link href="/login" className="font-bold text-blue-700 dark:text-blue-500 hover:underline">
                   Sign in instead
               </Link>
           </p>
       </div>
    </main>
  );
}
