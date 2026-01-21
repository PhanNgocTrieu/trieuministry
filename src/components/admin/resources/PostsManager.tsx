"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, where } from "firebase/firestore";
import { useModal } from "@/context/ModalContext";

interface Post {
    id: string;
    title: string;
    excerpt: string;
    type: 'post' | 'testimony';
    status: 'draft' | 'published';
    author: string;
    coverImage?: string;
    createdAt: any;
}

export default function PostsManager() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const { showConfirm, showAlert } = useModal();

    useEffect(() => {
        // Filter specifically for 'post' type if you want strict separation, 
        // OR keep strictly 'posts' collection but filter by type field if mixed.
        // Based on previous code, 'posts' collection had both.
        // BUT 'testimonies' might be separate now?
        // Let's assume 'posts' collection contains BLOG POSTS.
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: Post[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data() as any;
                // Ideally filter here or in query if mixed. 
                // Previous CreatePostPage saved type='post' or 'testimony' to 'posts' collection?
                // Wait, I created a separate 'testimonies' collection earlier. 
                // So 'posts' collection should primarily be for Blog Posts.
                // Let's just show everything in 'posts' collection here, but filter UI might be needed if mixed.
                // For safety, let's filter by type == 'post' if possible, or just show all.
                if (data.type === 'post' || !data.type) { 
                     list.push({ id: doc.id, ...data } as Post);
                }
            });
            setPosts(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleDelete = (id: string, title: string) => {
        showConfirm(
            "Delete Post",
            `Are you sure you want to delete "${title}"?`,
            async () => {
                try {
                    await deleteDoc(doc(db, "posts", id));
                    showAlert("Success", "Post deleted successfully!");
                } catch (error) {
                    console.error("Error deleting post:", error);
                    showAlert("Error", "Failed to delete post");
                }
            },
            true
        );
    };

    return (
        <div>
           <div className="flex justify-end mb-6">
                <Link 
                    href="/admin/resources/posts/create"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-900/30"
                >
                    <i className="fas fa-plus"></i>
                    <span>New Post</span>
                </Link>
           </div>

            {loading ? (
                <div className="text-center py-12 text-slate-500">Loading...</div>
            ) : posts.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-newspaper text-2xl text-slate-400"></i>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No posts yet</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">Create the first blog post</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Title</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                                <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {posts.map(post => (
                                <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            {post.coverImage ? (
                                                <img src={post.coverImage} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                    <i className="fas fa-newspaper text-slate-400"></i>
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white">{post.title}</div>
                                                <div className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{post.excerpt}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                            post.status === 'published' 
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                        }`}>
                                            {post.status === 'published' ? 'Published' : 'Draft'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                        {post.createdAt?.seconds 
                                            ? new Date(post.createdAt.seconds * 1000).toLocaleDateString()
                                            : 'N/A'
                                        }
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link 
                                                href={`/admin/resources/posts/${post.id}/edit`}
                                                className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors"
                                                title="Edit"
                                            >
                                                <i className="fas fa-edit"></i>
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(post.id, post.title)}
                                                className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                                title="Delete"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
