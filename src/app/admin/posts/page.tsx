"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import AdminGuard from "@/components/admin/AdminGuard";
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

export default function AdminPostsPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'post' | 'testimony'>('all');
    const { showConfirm, showAlert } = useModal();

    useEffect(() => {
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: Post[] = [];
            snapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() } as Post);
            });
            setPosts(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleDelete = (id: string, title: string) => {
        showConfirm(
            "Delete Post",
            `Are you sure you want to delete "${title}"? This action cannot be undone.`,
            async () => {
                try {
                    await deleteDoc(doc(db, "posts", id));
                    showAlert("Success", "Post deleted successfully!");
                } catch (error) {
                    console.error("Error deleting post:", error);
                    showAlert("Error", "Failed to delete post");
                }
            },
            true // isDangerous
        );
    };

    const filteredPosts = filter === 'all' 
        ? posts 
        : posts.filter(p => p.type === filter);

    return (
        <AdminGuard>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Posts & Testimonies</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage blog posts and testimonies for the resources page</p>
                    </div>
                    <Link 
                        href="/admin/posts/create"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-900/30"
                    >
                        <i className="fas fa-plus"></i>
                        <span>New Post</span>
                    </Link>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6">
                    {[
                        { id: 'all', label: 'All', icon: 'fa-th-large' },
                        { id: 'post', label: 'Posts', icon: 'fa-newspaper' },
                        { id: 'testimony', label: 'Testimonies', icon: 'fa-comment-medical' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id as any)}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
                                filter === tab.id
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            <i className={`fas ${tab.icon}`}></i>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Posts List */}
                {loading ? (
                    <div className="text-center py-12 text-slate-500">Loading...</div>
                ) : filteredPosts.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-newspaper text-2xl text-slate-400"></i>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No posts yet</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">Create your first post or testimony</p>
                        <Link 
                            href="/admin/posts/create"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all"
                        >
                            <i className="fas fa-plus"></i>
                            <span>Create Post</span>
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Title</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                                    <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredPosts.map(post => (
                                    <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                {post.coverImage ? (
                                                    <img src={post.coverImage} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                        <i className="fas fa-file-alt text-slate-400"></i>
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
                                                post.type === 'testimony' 
                                                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                            }`}>
                                                {post.type === 'testimony' ? 'Testimony' : 'Post'}
                                            </span>
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
                                                    href={`/admin/posts/${post.id}/edit`}
                                                    className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
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
        </AdminGuard>
    );
}
