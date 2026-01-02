"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc, where } from "firebase/firestore";
import Link from "next/link";
import TableSkeleton from "@/components/admin/TableSkeleton";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    author: string;
    authorId?: string;
    date: string;
    status: 'approved' | 'pending';
    category: string;
}

interface BlogsManagerProps {
    mode: 'personal' | 'approve' | 'admin';
    basePath: string; // e.g. /admin/blogs, /volunteer/blogs
}

export default function BlogsManager({ mode, basePath }: BlogsManagerProps) {
    const { user, isAdmin } = useAuth();
    const { showAlert, showConfirm } = useModal();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPosts = async () => {
        if (!user) return;
        setLoading(true);
        try {
            let q;
            const blogsRef = collection(db, "blogs");

            if (mode === 'personal') {
                 q = query(blogsRef, where("authorId", "==", user.uid), orderBy("date", "desc"));
            } else if (mode === 'approve') {
                // Determine if we show strictly pending or all pending
                q = query(blogsRef, where("status", "==", "pending"), orderBy("date", "desc"));
            } else {
                 // Admin: show all
                 q = query(blogsRef, orderBy("date", "desc"));
            }

            const querySnapshot = await getDocs(q);
            const list: BlogPost[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data() as Omit<BlogPost, 'id'>;
                list.push({ ...data, id: doc.id });
            });
            setPosts(list);
        } catch (error) {
            console.error("Error fetching blogs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchPosts();
        }
    }, [user, mode]);



    const handleDelete = async (id: string) => {
        showConfirm(
            "Delete Post",
            "Are you sure you want to delete this post? This action cannot be undone.",
            async () => {
                try {
                    await deleteDoc(doc(db, "blogs", id));
                     setPosts(prev => prev.filter(p => p.id !== id));
                     showAlert("Success", "Post deleted successfully.");
                } catch (error: any) {
                    console.error("Error deleting post:", error);
                    showAlert("Error", `Failed to delete post: ${error.message}`);
                }
            },
            true
        );
    };

    const handleApprove = async (id: string) => {
        showConfirm(
            "Approve Blog Post",
            "Are you sure you want to approve this blog post?",
            async () => {
                try {
                    await updateDoc(doc(db, "blogs", id), { status: 'approved' });
                    // Refresh or update local state
                    if (mode === 'approve') {
                         // Remove from list if we only show pending
                         setPosts(prev => prev.filter(p => p.id !== id));
                    } else {
                         setPosts(prev => prev.map(p => p.id === id ? { ...p, status: 'approved' } : p));
                    }
                    showAlert("Success", "Post approved successfully.");
                } catch (error) {
                    console.error("Error approving post:", error);
                    showAlert("Error", "Failed to approve post");
                }
            }
        );
    };

    if (loading) {
        return (
             <div>
                <TableSkeleton cols={5} />
            </div>
        );
    }

    return (
        <div>


            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    {mode === 'personal' ? 'My Blogs' : mode === 'approve' ? 'Pending Approval' : 'Blog Management'}
                </h1>
                <div className="flex gap-3">
                    {mode === 'personal' || mode === 'admin' ? (
                        <Link href={`${basePath}/create`} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
                            <i className="fas fa-plus"></i> New Post
                        </Link>
                    ) : null}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Title</th>
                            <th scope="col" className="px-6 py-3">Author</th>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {posts.map((post) => (
                            <tr key={post.id} className={`border-b hover:bg-gray-50 ${post.status === 'pending' ? 'bg-yellow-50/50' : 'bg-white'}`}>
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    {post.title}
                                    <div className="text-xs text-gray-400 font-normal">{post.slug}</div>
                                </td>
                                <td className="px-6 py-4">{post.author}</td>
                                <td className="px-6 py-4">{post.date}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                        post.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {post.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 flex gap-3">
                                    {/* Action: Approve (Only for Pending and if allowed) */}
                                    {post.status === 'pending' && (mode === 'approve' || mode === 'admin') && (
                                        <button 
                                            onClick={() => handleApprove(post.id)}
                                            className="text-green-600 hover:text-green-800 bg-green-100 hover:bg-green-200 p-2 rounded-lg transition-colors" 
                                            title="Approve"
                                        >
                                            <i className="fas fa-check"></i>
                                        </button>
                                    )}

                                    <Link href={`/blogs/${post.slug || post.id}`} target="_blank" className="text-gray-400 hover:text-blue-600 p-2 transition-colors" title="View">
                                        <i className="fas fa-external-link-alt"></i>
                                    </Link>
                                    {(mode === 'admin' || (mode === 'personal' && post.authorId === user?.uid)) && (
                                        <Link href={`${basePath}/${post.id}/edit`} className="text-blue-500 hover:text-blue-700 p-2 transition-colors" title="Edit">
                                            <i className="fas fa-edit"></i>
                                        </Link>
                                    )}
                                    {(mode === 'admin' || (mode === 'personal' && post.authorId === user?.uid)) && (
                                        <button onClick={() => handleDelete(post.id)} className="text-red-500 hover:text-red-700 p-2 transition-colors" title="Delete">
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {posts.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No blogs found.
                    </div>
                )}
            </div>
        </div>
    );
}
