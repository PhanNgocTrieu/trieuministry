"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import ConfirmModal from "@/components/admin/ConfirmModal";
import initialBlogs from "@/data/blogs.json"; // Import static data for migration

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    author: string;
    date: string;
    status: 'approved' | 'pending';
    category: string;
}

export default function AdminBlogsPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [migrating, setMigrating] = useState(false);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "blogs"), orderBy("date", "desc"));
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
        fetchPosts();
    }, []);

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isDangerous?: boolean;
    }>({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => {},
    });

    const openModal = (title: string, message: string, onConfirm: () => void, isDangerous = false) => {
        setModalConfig({ isOpen: true, title, message, onConfirm, isDangerous });
    };

    const handleMigrate = async () => {
        openModal(
            "Migrate Data",
            "This will upload static JSON blogs to Firestore. Continue?",
            async () => {
                setMigrating(true);
                try {
                    const batch = writeBatch(db);
                    initialBlogs.forEach(blog => {
                        const docRef = doc(db, "blogs", blog.slug); 
                        batch.set(docRef, {
                            ...blog,
                            status: 'approved',
                            createdAt: serverTimestamp(),
                            updatedAt: serverTimestamp()
                        });
                    });
                    await batch.commit();
                    alert("Migration successful!");
                    fetchPosts();
                } catch (error) {
                    console.error("Migration failed:", error);
                    alert("Migration failed. Check console.");
                } finally {
                    setMigrating(false);
                }
            }
        );
    };

    const handleDelete = async (id: string) => {
        openModal(
            "Delete Post",
            "Are you sure you want to delete this post? This action cannot be undone.",
            async () => {
                console.log("Attempting to delete blog with ID:", id);
                try {
                    await deleteDoc(doc(db, "blogs", id));
                    setPosts(posts.filter(p => p.id !== id));
                } catch (error: any) {
                    console.error("Error deleting post:", error);
                    alert(`Failed to delete post: ${error.message}`);
                }
            },
            true
        );
    };

    const handleApprove = async (id: string) => {
        openModal(
            "Approve Blog Post",
            "Are you sure you want to approve this blog post? It will become visible to all users.",
            async () => {
                try {
                    await updateDoc(doc(db, "blogs", id), { status: 'approved' });
                    setPosts(posts.map(p => p.id === id ? { ...p, status: 'approved' } : p));
                } catch (error) {
                    console.error("Error approving post:", error);
                    alert("Failed to approve post");
                }
            }
        );
    };

    if (loading) return <div className="p-8 text-center">Loading blogs...</div>;

    return (
        <div>
            <ConfirmModal 
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
                isDangerous={modalConfig.isDangerous}
            />

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
                <div className="flex gap-3">
                    <button 
                        onClick={handleMigrate}
                        disabled={migrating}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"
                    >
                         {migrating ? 'Migrating...' : <><i className="fas fa-database"></i> Migrate Data</>}
                    </button>
                    <Link href="/admin/blogs/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
                        <i className="fas fa-plus"></i> New Post
                    </Link>
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
                                    {/* Action: Approve (Only for Pending) */}
                                    {post.status === 'pending' && (
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
                                    <Link href={`/admin/blogs/${post.id}/edit`} className="text-blue-500 hover:text-blue-700 p-2 transition-colors" title="Edit">
                                        <i className="fas fa-edit"></i>
                                    </Link>
                                    <button onClick={() => handleDelete(post.id)} className="text-red-500 hover:text-red-700 p-2 transition-colors" title="Delete/Reject">
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
