"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();
  const { theme } = useTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      router.push('/');
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError("Incorrect email or password. Please try again.");
      } else {
        setError("Failed to sign in. Please check your connection and try again.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await signInWithGoogle();
      router.push('/');
    } catch (err) {
       setError("Failed to sign in with Google.");
       console.error(err);
    }
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center py-20 px-4 overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
       
       {/* Background Effects */}
       <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-violet-500/10 dark:bg-violet-600/10 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[100px]"></div>
       </div>

       <div className="w-full max-w-md relative z-10 animate-fade-in-up">
           <div className="text-center mb-10">
               <Link href="/" className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/30 text-white mb-6 transform hover:scale-105 transition-transform">
                   <i className="fas fa-church text-2xl"></i>
               </Link>
               <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-3">Welcome Back</h1>
               <p className="text-slate-500 dark:text-slate-400">Sign in to continue to your account</p>
           </div>
           
           <div className="premium-glass-panel p-8 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden backdrop-blur-2xl">
               {error && (
                   <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-start gap-3 fade-in">
                       <i className="fas fa-exclamation-circle text-rose-500 mt-0.5"></i>
                       <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
                   </div>
               )}

               <form onSubmit={handleLogin} className="space-y-6">
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
                               className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all dark:text-white font-medium"
                           />
                       </div>
                   </div>

                   <div>
                       <div className="flex justify-between items-center mb-2 pl-1">
                           <label className="block text-xs font-bold uppercase text-slate-500">Password</label>
                           <Link href="/forgot-password" className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline">
                               Forgot password?
                           </Link>
                       </div>
                       <div className="relative">
                           <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                           <input
                               type="password"
                               required
                               placeholder="••••••••"
                               value={password}
                               onChange={(e) => setPassword(e.target.value)}
                               className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all dark:text-white font-medium"
                           />
                       </div>
                   </div>

                   <button
                       type="submit"
                       disabled={loading}
                       className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                   >
                       {loading ? <div className="loading-spinner-sm border-white"></div> : 'Sign In'}
                   </button>
               </form>

               <div className="my-8 flex items-center gap-4">
                   <div className="h-px bg-slate-200 dark:bg-white/10 flex-1"></div>
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Or continue with</span>
                   <div className="h-px bg-slate-200 dark:bg-white/10 flex-1"></div>
               </div>

               <button
                   onClick={handleGoogleLogin}
                   className="w-full py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 group"
               >
                   <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-5 w-5 group-hover:scale-110 transition-transform" />
                   <span>Sign in with Google</span>
               </button>
           </div>
           
           <p className="text-center mt-8 text-slate-500 dark:text-slate-400">
               Don't have an account?{' '}
               <Link href="/register" className="font-bold text-violet-600 dark:text-violet-400 hover:underline">
                   Create an account
               </Link>
           </p>
       </div>
    </main>
  );
}
