"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    author: string;
    date: string;
    status: 'approved' | 'pending';
    category: string;
    excerpt: string;
    content: string;
    tags: string[];
}

export default function BlogsPage() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [allBlogs, setAllBlogs] = useState<BlogPost[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
        setLoading(true);
        try {
            // Fetch only approved blogs
            const q = query(
                collection(db, "blogs"), 
                where("status", "==", "approved"),
                orderBy("date", "desc")
            );
            const querySnapshot = await getDocs(q);
            const list: BlogPost[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Ensure all required fields exist
                list.push({ 
                    title: data.title,
                    slug: data.slug,
                    author: data.author,
                    date: data.date,
                    status: data.status,
                    category: data.category,
                    excerpt: data.excerpt,
                    content: data.content,
                    tags: data.tags || [],
                    id: doc.id // ID must overwrite any data.id
                } as BlogPost);
            });
            setAllBlogs(list);
            setFilteredBlogs(list);
        } catch (error) {
            console.error("Error fetching blogs:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchBlogs();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    });

    const hiddenElements = document.querySelectorAll('.fade-in-up');
    hiddenElements.forEach((el) => observer.observe(el));

    return () => {
      hiddenElements.forEach((el) => observer.unobserve(el));
    };
  }, [loading]); // Add loading dependence to re-trigger on content load

  useEffect(() => {
    let results = allBlogs;

    if (searchTerm) {
      results = results.filter(blog => 
        blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (category) {
      results = results.filter(blog => blog.category === category);
    }

    setFilteredBlogs(results);
  }, [searchTerm, category, allBlogs]);

  // Extract unique categories for filter
  const categories = Array.from(new Set(allBlogs.map(blog => blog.category)));

  return (
    <main className="bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
      {/* Hero Section */}
      <section className="bg-white dark:bg-slate-900 py-16 lg:py-20 relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-50 to-transparent dark:from-blue-900/20 skew-x-12 opacity-50 z-0"></div>
         <div className="container container-custom relative z-10 fade-in-up">
            <div className="max-w-3xl">
               <span className="text-blue-600 dark:text-blue-400 font-bold tracking-wider text-sm uppercase mb-2 block">
                  {t('blogs.hero.subtitle')}
               </span>
               <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-white leading-tight">
                  {t('blogs.hero.title')}
               </h1>
               <p className="text-xl text-gray-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                  Explore articles, testimonies, and spiritual reflections to encourage your daily walk with God.
               </p>
            </div>
         </div>
      </section>

      {/* Filter Section */}
      <section className="py-8 bg-white dark:bg-slate-900 sticky top-[72px] z-30 shadow-sm transition-all border-b border-gray-100 dark:border-white/5">
         <div className="container container-custom">
             <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                
                {/* Search */}
                <div className="relative w-full md:w-96">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="fas fa-search text-gray-400"></i>
                   </div>
                   <input 
                      type="text" 
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-full leading-5 bg-gray-50 dark:bg-slate-800 placeholder-gray-400 dark:placeholder-slate-500 text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                      placeholder={t('blogs.list.search_placeholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                   />
                </div>

                {/* Filters */}
                <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                   <button 
                      onClick={() => setCategory('')}
                      className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all ${category === '' ? 'bg-black dark:bg-white text-white dark:text-slate-900 shadow-md' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                   >
                      {t('blogs.list.category_all')}
                   </button>
                   {categories.map((cat) => (
                      <button 
                         key={cat}
                         onClick={() => setCategory(cat)}
                         className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all ${category === cat ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                      >
                         {cat}
                      </button>
                   ))}
                </div>
             </div>
         </div>
      </section>

      {/* Blog List */}
      <section className="py-16">
         <div className="container container-custom">
            
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="loading-spinner"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {filteredBlogs.map((blog) => (
                  <article key={blog.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full group border border-gray-100 dark:border-white/5">
                     <Link href={`/blogs/${blog.id}`} className="block relative h-60 w-full overflow-hidden bg-gray-200 dark:bg-slate-800">
                        {/* 
                           In a real app, use Next/Image. 
                           For now, we might not have these images, so a placeholder logic or correct paths are needed.
                        */}
                        <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-300 dark:text-blue-500/50 group-hover:scale-105 transition-transform duration-500">
                           <i className="fas fa-image text-5xl opacity-50"></i>
                        </div>
                        <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 shadow-sm">
                           {blog.category}
                        </div>
                     </Link>
                     
                     <div className="p-6 md:p-8 flex flex-col flex-grow">
                        <div className="flex items-center text-xs text-gray-400 dark:text-slate-500 mb-4 gap-3">
                           <span className="flex items-center"><i className="far fa-calendar-alt mr-1"></i> {blog.date}</span>
                           <span className="w-1 h-1 bg-gray-300 dark:bg-slate-600 rounded-full"></span>
                           <span className="flex items-center"><i className="far fa-user mr-1"></i> {blog.author}</span>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                           <Link href={`/blogs/${blog.id}`}>
                              {blog.title}
                           </Link>
                        </h3>

                        <p className="text-gray-500 dark:text-slate-400 mb-6 line-clamp-3 text-sm flex-grow leading-relaxed">
                           {blog.excerpt}
                        </p>

                        <div className="pt-6 border-t border-gray-50 dark:border-white/5 mt-auto flex items-center justify-between">
                            <Link href={`/blogs/${blog.id}`} className="text-blue-600 dark:text-blue-400 font-bold text-sm hover:underline flex items-center group/link">
                              Read Article <i className="fas fa-arrow-right ml-2 transition-transform group-hover/link:translate-x-1"></i>
                            </Link>

                            <div className="flex gap-1">
                               {blog.tags.slice(0, 2).map(tag => (
                                  <span key={tag} className="text-xs text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded-md">#{tag}</span>
                               ))}
                            </div>
                        </div>
                     </div>
                  </article>
               ))}
            </div>
            )}

            {filteredBlogs.length === 0 && (
               <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                  <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl text-gray-300 dark:text-slate-600">
                     <i className="fas fa-search"></i>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t('blogs.list.empty_title') || 'No posts found'}</h3>
                  <p className="text-gray-500 max-w-sm mx-auto">
                     We couldn't find any articles matching "<strong>{searchTerm}</strong>". Try adjusting your search or filters.
                  </p>
                  <button 
                     onClick={() => {setSearchTerm(''); setCategory('');}}
                     className="mt-6 px-6 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded-lg transition-colors"
                  >
                     Clear Filters
                  </button>
               </div>
            )}
         </div>
      </section>
    </main>
  );
}
