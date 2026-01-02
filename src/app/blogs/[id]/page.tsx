"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, orderBy, getDocs, where, addDoc, serverTimestamp, onSnapshot, Timestamp } from 'firebase/firestore';

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
    coverImage?: string; // Added field
}

interface Comment {
    id: string;
    text: string;
    userId: string;
    userName: string;
    userAvatar: string;
    createdAt: any; // Timestamp
}

  // ... imports
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useModal } from '@/context/ModalContext';

export default function BlogDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { t } = useLanguage(); 
  const { user } = useAuth();
  const { showAlert } = useModal();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [adjacentPosts, setAdjacentPosts] = useState<{ prev: BlogPost | null, next: BlogPost | null }>({ prev: null, next: null });
  
  // Comment State
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Fetch Comments
  useEffect(() => {
    if (!id) return;

    // Use a subcollection: blogs/{blogId}/comments
    // Or a top-level collection with blogId field. Plan said subcollection: blogs/{id}/comments
    // Actually, for simplicity and scalability, subcollection is good.
    // Let's check the plan again: "blogs/{id}/comments"
    
    // BUT: The ID might be a slug or a doc ID. 
    // The fetching logic determines the *actual* document ID in `currentBlog.id`.
    // We should only start listening when `blog` is set.
    
    if(!blog?.id) return;

    const commentsRef = collection(db, 'blogs', blog.id, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedComments: Comment[] = [];
        snapshot.forEach((doc) => {
            fetchedComments.push({ id: doc.id, ...doc.data() } as Comment);
        });
        setComments(fetchedComments);
    });

    return () => unsubscribe();
  }, [blog?.id]);

  const handlePostComment = async () => {
      if (!user || !commentText.trim() || !blog?.id) return;
      
      setSubmittingComment(true);
      try {
          const commentsRef = collection(db, 'blogs', blog.id, 'comments');
          await addDoc(commentsRef, {
              text: commentText.trim(),
              userId: user.uid,
              userName: user.displayName || 'Anonymous',
              userAvatar: user.photoURL || '',
              createdAt: serverTimestamp()
          });
          setCommentText('');
      } catch (error) {
          console.error("Error posting comment:", error);
          showAlert("Error", t('common.error'));
      } finally {
          setSubmittingComment(false);
      }
  };

  // ... fetch logic (unchanged) ...
  useEffect(() => {
    const fetchData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            // 1. Try Fetch by Doc ID (Primary)
            let currentBlog: BlogPost | null = null;
            let docSnap = null;
            
            // Try as direct ID first
            const docRef = doc(db, "blogs", id);
            docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                currentBlog = { id: docSnap.id, ...docSnap.data() } as BlogPost;
            } else {
                // 2. Fallback: Try Fetch by Slug
                const qSlug = query(collection(db, "blogs"), where("slug", "==", id));
                const slugSnap = await getDocs(qSlug);
                
                if (!slugSnap.empty) {
                    const d = slugSnap.docs[0];
                    currentBlog = { id: d.id, ...d.data() } as BlogPost;
                }
            }

            if (!currentBlog) {
                setBlog(null);
                setLoading(false);
                return;
            }

            setBlog(currentBlog);

            // 3. Fetch All Blogs to determine Next/Prev
            const q = query(collection(db, "blogs"), orderBy("date", "desc"));
            const querySnapshot = await getDocs(q);
            const allBlogs: BlogPost[] = [];
            querySnapshot.forEach((d) => {
                 const data = d.data();
                 if (data.status === 'approved') {
                     allBlogs.push({ id: d.id, ...data } as BlogPost);
                 }
            });

            const currentIndex = allBlogs.findIndex(b => b.id === currentBlog!.id);
            const newerPost = currentIndex > 0 ? allBlogs[currentIndex - 1] : null; 
            const olderPost = currentIndex < allBlogs.length - 1 ? allBlogs[currentIndex + 1] : null; 

            setAdjacentPosts({
                prev: newerPost, 
                next: olderPost  
            });

        } catch (error) {
            console.error("Error fetching blog data:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, [id]);

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                  <div className="loading-spinner mb-4 w-12 h-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
                  <p className="text-gray-500 font-medium animate-pulse">{t('blogs.detail.loading')}</p>
              </div>
          </div>
      );
  }

  if (!blog) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-300 text-5xl">
                <i className="far fa-file-excel"></i>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{t('blogs.detail.not_found_title')}</h1>
            <p className="text-gray-500 mb-8 max-w-md text-center text-lg">
                {t('blogs.detail.not_found_desc')}
            </p>
            <Link href="/blogs" className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                {t('blogs.detail.back_to_blogs')}
            </Link>
        </div>
    );
  }

  return (
    <main className="bg-[#f8fafc] min-h-screen">
      {/* 1. Immersive Hero Section */}
      <header className="relative py-32 lg:py-48 bg-gray-900 text-white overflow-hidden">
         {/* Abstract Background Pattern or Cover Image */}
         <div className="absolute inset-0 z-0">
             {blog.coverImage ? (
                <>
                    <img 
                        src={blog.coverImage} 
                        alt="Background" 
                        className="w-full h-full object-cover opacity-40 blur-sm scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>
                </>
             ) : (
                <>
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 opacity-90"></div>
                    <div className="absolute -top-[50%] -left-[20%] w-[100%] h-[200%] bg-gradient-to-tr from-blue-500/20 to-transparent rotate-12 blur-3xl"></div>
                    <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                </>
             )}
         </div>

         <div className="container container-custom relative z-10 text-center max-w-4xl mx-auto px-4">
             <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider mb-8 text-blue-200 shadow-sm">
                 <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                 {blog.category}
             </div>
             
             <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight tracking-tight text-white drop-shadow-sm">
                 {blog.title}
             </h1>
             
             <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-base md:text-lg text-blue-100/90 font-medium">
                 <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
                     <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                         <i className="fas fa-user text-xs text-white"></i>
                     </div>
                     <span>{blog.author}</span>
                 </div>
                 <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
                     <i className="far fa-calendar-alt text-blue-300"></i>
                     <span>{blog.date}</span>
                 </div>
                 {/* Estimated Read Time (Mock) */}
                 <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
                     <i className="far fa-clock text-blue-300"></i>
                     <span>5 {t('blogs.min_read')}</span>
                 </div>
             </div>
         </div>
      </header>

      {/* 2. Overlapping Article Card */}
      <article className="container container-custom max-w-4xl mx-auto relative z-20 px-4">
         <div className="-mt-20 md:-mt-32 bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
             
             {/* Content Area */}
             <div className="p-8 md:p-16 lg:p-20">
                 <div className="prose prose-lg md:prose-xl prose-slate max-w-none 
                    prose-headings:font-bold prose-headings:text-gray-900 
                    prose-p:text-gray-600 prose-p:leading-relaxed prose-p:mb-6
                    prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                    prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50/50 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:not-italic prose-blockquote:rounded-r-lg
                    prose-img:rounded-2xl prose-img:shadow-lg">
                     <div dangerouslySetInnerHTML={{ __html: blog.content }}></div>
                 </div>

                 {/* Reading Feedback / Divider */}
                 <div className="w-24 h-1 bg-gray-100 mx-auto rounded-full my-16"></div>

                 {/* Tags & Tools */}
                 <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                    {/* Tags */}
                     <div className="flex flex-col gap-3">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('blogs.detail.tags')}</span>
                        <div className="flex flex-wrap gap-2">
                            {blog.tags?.map(tag => (
                                <span key={tag} className="bg-gray-50 text-gray-600 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-default border border-gray-100">
                                    #{tag}
                                </span>
                            )) || <span className="text-gray-400 italic">No tags</span>}
                        </div>
                     </div>

                     {/* Share Tools */}
                     <div className="flex flex-col gap-3">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('blogs.detail.share')}</span>
                        <div className="flex items-center gap-3">
                            <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`, '_blank')} className="w-12 h-12 rounded-xl bg-[#1877F2] text-white flex items-center justify-center hover:bg-[#166fe5] transition-all hover:-translate-y-1 shadow-md hover:shadow-lg" title="Share on Facebook">
                                <i className="fab fa-facebook-f text-lg"></i>
                            </button>
                            <button onClick={() => window.open(`https://twitter.com/intent/tweet?url=${window.location.href}&text=${blog.title}`, '_blank')} className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-all hover:-translate-y-1 shadow-md hover:shadow-lg" title="Share on X">
                                <i className="fab fa-twitter text-lg"></i>
                            </button>
                            <button onClick={() => { navigator.clipboard.writeText(window.location.href); showAlert('Info', t('blogs.detail.copied')); }} className="w-12 h-12 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-all hover:-translate-y-1 shadow-sm hover:shadow-md" title="Copy Link">
                                <i className="fas fa-link text-lg"></i>
                            </button>

                        </div>
                     </div>
                 </div>
             </div>
         </div>
      </article>

      {/* 3. Distinct Navigation Section */}
      <section className="bg-white border-t border-gray-100 mt-20 py-20">
         <div className="container container-custom max-w-5xl mx-auto px-4">
             <div className="text-center mb-12">
                 <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-2">{t('blogs.detail.keep_reading')}</h2>
                 <h3 className="text-2xl font-bold text-gray-900">{t('blogs.detail.explore_more')}</h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Previous (Older) */}
                 {adjacentPosts.prev ? (
                    <Link href={`/blogs/${adjacentPosts.prev.slug || adjacentPosts.prev.id}`} className="group relative block bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
                        <div className="absolute top-8 right-8 text-gray-200 group-hover:text-blue-100 transition-colors text-6xl opacity-20">
                            <i className="fas fa-arrow-left"></i>
                        </div>
                        <span className="inline-block px-3 py-1 rounded bg-white border border-gray-200 text-xs font-bold text-gray-400 uppercase mb-4 shadow-sm group-hover:text-blue-600 group-hover:border-blue-100">
                            {t('blogs.detail.previous')}
                        </span>
                        <h4 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors line-clamp-2 leading-tight">
                            {adjacentPosts.prev.title}
                        </h4>
                        <span className="text-gray-500 text-sm font-medium flex items-center gap-2">
                            <i className="fas fa-long-arrow-alt-left transform group-hover:-translate-x-1 transition-transform"></i> {t('blogs.detail.read_now')}
                        </span>
                    </Link>
                 ) : (
                    <div className="bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 flex items-center justify-center p-8 opacity-50">
                        <span className="text-gray-400 font-medium">{t('blogs.detail.no_newer')}</span>
                    </div>
                 )}

                 {/* Next (Newer) */}
                 {adjacentPosts.next ? (
                    <Link href={`/blogs/${adjacentPosts.next.slug || adjacentPosts.next.id}`} className="group relative block bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 text-right">
                        <div className="absolute top-8 left-8 text-gray-200 group-hover:text-blue-100 transition-colors text-6xl opacity-20">
                            <i className="fas fa-arrow-right"></i>
                        </div>
                        <span className="inline-block px-3 py-1 rounded bg-white border border-gray-200 text-xs font-bold text-gray-400 uppercase mb-4 shadow-sm group-hover:text-blue-600 group-hover:border-blue-100">
                            {t('blogs.detail.next')}
                        </span>
                        <h4 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors line-clamp-2 leading-tight">
                            {adjacentPosts.next.title}
                        </h4>
                        <span className="text-gray-500 text-sm font-medium flex items-center gap-2 justify-end">
                            {t('blogs.detail.read_now')} <i className="fas fa-long-arrow-alt-right transform group-hover:translate-x-1 transition-transform"></i>
                        </span>
                    </Link>
                 ) : (
                    <div className="bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 flex items-center justify-center p-8 opacity-50">
                        <span className="text-gray-400 font-medium">{t('blogs.detail.no_older')}</span>
                    </div>
                 )}
             </div>

             <div className="text-center mt-12">
                 <Link href="/blogs" className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white border-2 border-gray-200 text-gray-600 font-bold hover:border-gray-900 hover:text-gray-900 transition-all hover:shadow-lg">
                     <i className="fas fa-th-large"></i> {t('blogs.detail.view_all')}
                 </Link>
             </div>
         </div>
      </section>

      {/* 4. Comments Section (Distinct Background) */}
      <section className="bg-gray-50 border-t border-gray-200 py-20">
          <div className="container container-custom max-w-4xl mx-auto px-4">
              <div className="flex items-center justify-between mb-10">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg shadow-sm">
                          <i className="fas fa-comments"></i>
                      </span>
                      {t('blogs.detail.discussion')}
                  </h3>
                  <span className="bg-white px-3 py-1 rounded-full text-xs font-bold text-gray-500 border border-gray-200 uppercase tracking-wide">
                      {t('blogs.detail.comments_count').replace('{{count}}', comments.length.toString())}
                  </span>
              </div>
              
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-2 md:p-3 mb-10">
                  <div className="relative">
                      <textarea 
                        className={`w-full bg-gray-50 rounded-2xl p-4 md:p-6 pb-12 text-gray-700 placeholder-gray-400 text-lg resize-none min-h-[140px] focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-200 transition-all duration-200 border border-transparent ${
                            !user ? 'opacity-60 cursor-not-allowed' : ''
                        }`}
                        placeholder={user ? t('blogs.detail.placeholder_comment') : t('blogs.detail.sign_in_comment')}
                        disabled={!user || submittingComment}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                      ></textarea>
                      
                      {/* Bottom Action Bar (Inside relative container to overlap if needed, or just below) */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-3">
                           {user ? (
                               <>
                                   <div className="hidden md:flex items-center gap-2 mr-2">
                                       {user.photoURL ? (
                                           <img src={user.photoURL} alt={user.displayName || "User"} className="w-6 h-6 rounded-full border border-gray-200" />
                                       ) : (
                                           <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                                               {user.displayName?.charAt(0) || "U"}
                                           </div>
                                       )}
                                       <span className="text-xs font-semibold text-gray-500">{user.displayName}</span>
                                   </div>
                                   <button 
                                    onClick={handlePostComment}
                                    disabled={!user || !commentText.trim() || submittingComment}
                                    className={`px-6 py-2 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2 ${
                                        !user || !commentText.trim() || submittingComment
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5'
                                    }`}
                                   >
                                       {submittingComment ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-paper-plane text-xs"></i> {t('blogs.detail.post_comment')}</>}
                                   </button>
                               </>
                           ) : (
                               <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-3 border border-gray-100 shadow-sm">
                                   <span className="text-xs text-gray-500 font-medium">
                                       <i className="fas fa-lock mr-1 text-gray-400"></i> {t('blogs.detail.sign_in_comment')}
                                   </span>
                                   <Link href="/login" className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline">
                                       {t('nav.login')}
                                   </Link>
                               </div>
                           )}
                      </div>
                  </div>
              </div>

              {/* Comments List */}
              <div className="space-y-6">
                  {comments.length > 0 ? (
                      comments.map((comment) => (
                          <div key={comment.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-4">
                              <div className="flex-shrink-0">
                                  {comment.userAvatar ? (
                                      <img src={comment.userAvatar} alt={comment.userName} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                                  ) : (
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 text-blue-600 flex items-center justify-center text-lg font-bold shadow-inner">
                                          {comment.userName.charAt(0)}
                                      </div>
                                  )}
                              </div>
                              <div className="flex-grow">
                                  <div className="flex items-center justify-between mb-2">
                                      <h4 className="font-bold text-gray-900">{comment.userName}</h4>
                                      <span className="text-xs text-gray-400 font-medium">
                                          {/* Format timestamp if available, otherwise just say 'Just now' or allow the UI to update */}
                                          {comment.createdAt?.seconds ? new Date(comment.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                      </span>
                                  </div>
                                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                              </div>
                          </div>
                      ))
                  ) : (
                      <div className="text-center py-12">
                          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 text-gray-300 text-4xl mb-4">
                              <i className="far fa-comment-dots"></i>
                          </div>
                          <p className="text-gray-500 text-lg font-medium">{t('blogs.detail.no_comments')}</p>
                          <p className="text-gray-400 text-sm">{t('blogs.detail.be_first')}</p>
                      </div>
                  )}
              </div>
          </div>
      </section>
    </main>
  );
}
