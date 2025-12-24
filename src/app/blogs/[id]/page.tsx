"use client";

import React from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import blogsData from '@/data/blogs.json';

export default function BlogDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const blog = blogsData.find((b) => b.id === id);

  if (!blog) {
    return notFound();
  }

  return (
    <main className="bg-white min-h-screen pb-20">
      {/* Header/Hero for Blog Article */}
      <header className="relative pt-32 pb-20 bg-gray-900 text-white overflow-hidden">
         <div className="absolute inset-0 bg-gray-800 opacity-50 z-0">
             {/* Dynamic background image would go here */}
         </div>
         <div className="container container-custom relative z-10 text-center max-w-4xl mx-auto">
             <div className="inline-block bg-blue-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                 {blog.category}
             </div>
             <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                 {blog.title}
             </h1>
             <div className="flex items-center justify-center gap-6 text-sm md:text-base text-gray-300">
                 <div className="flex items-center gap-2">
                     <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                         <i className="fas fa-user text-xs"></i>
                     </div>
                     <span className="font-semibold text-white">{blog.author}</span>
                 </div>
                 <div className="flex items-center gap-2">
                     <i className="far fa-calendar-alt"></i>
                     <span>{blog.date}</span>
                 </div>
             </div>
         </div>
      </header>

      {/* Article Content */}
      <article className="container container-custom max-w-3xl mx-auto -mt-10 relative z-20">
         <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
             <div className="prose prose-lg prose-blue max-w-none">
                 <div dangerouslySetInnerHTML={{ __html: blog.content }}></div>
             </div>

             {/* Tags */}
             <div className="mt-12 pt-8 border-t border-gray-100">
                 <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Tags</h4>
                 <div className="flex flex-wrap gap-2">
                     {blog.tags.map(tag => (
                         <span key={tag} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-md text-sm hover:bg-gray-200 transition-colors cursor-pointer">
                             #{tag}
                         </span>
                     ))}
                 </div>
             </div>
         </div>
      </article>

      {/* Navigation Footer */}
      <div className="container container-custom max-w-3xl mx-auto mt-12 text-center">
          <Link href="/blogs" className="inline-flex items-center text-gray-500 hover:text-blue-600 font-bold transition-colors gap-2 border border-gray-200 hover:border-blue-600 px-6 py-3 rounded-full bg-white hover:bg-blue-50">
              <i className="fas fa-arrow-left"></i>
              Back to all articles
          </Link>
      </div>
    </main>
  );
}
