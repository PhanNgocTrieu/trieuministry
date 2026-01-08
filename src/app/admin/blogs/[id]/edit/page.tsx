"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { useModal } from '@/context/ModalContext';

export default function EditBlogPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { showAlert } = useModal();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        category: "Faith",
        excerpt: "",
        content: "",
        tags: "",
        status: "approved"
    });

    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const fetchBlog = async () => {
            try {
                const docRef = doc(db, "blogs", id);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData({
                        title: data.title || "",
                        slug: data.slug || "",
                        category: data.category || "Faith",
                        excerpt: data.excerpt || "",
                        content: data.content || "",
                        tags: Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags || ""),
                        status: data.status || "pending"
                    });
                } else {
                    showAlert("Error", "Blog post not found");
                    router.push("/admin/blogs");
                }
            } catch (error) {
                console.error("Error fetching blog:", error);
                showAlert("Error", "Error loading blog details");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchBlog();
    }, [id, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const docRef = doc(db, "blogs", id);
            await updateDoc(docRef, {
                ...formData,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(t => t),
                updatedAt: serverTimestamp()
            });

            setShowSuccess(true);
            // Router push is handled in modal close
        } catch (error) {
            console.error("Error updating blog:", error);
            showAlert("Error", "Failed to update blog post");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-400">Loading blog details...</div>;

    if (showSuccess) {
         return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg p-8 text-center animate-in zoom-in-95 duration-200 border border-white/10">
                    <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                        <i className="fas fa-check text-4xl text-green-400"></i>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Changes Saved!</h2>
                    <p className="text-slate-400 mb-8 text-lg">
                        The blog post has been successfully updated.
                    </p>
                    <button 
                        onClick={() => router.push("/admin/blogs")}
                        className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-500 hover:scale-[0.98] transition-all"
                    >
                        Back to Dashboard
                    </button>
                    <button 
                        onClick={() => setShowSuccess(false)}
                        className="mt-3 text-slate-500 hover:text-slate-300 font-medium text-sm"
                    >
                        Stay on this page
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/blogs" className="text-slate-400 hover:text-white transition-colors">
                    <i className="fas fa-arrow-left"></i> Back
                </Link>
                <div className="flex-1">
                     <h1 className="text-2xl font-bold text-white">Edit Blog Post</h1>
                     <p className="text-xs text-slate-500">ID: {id}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-slate-900 rounded-xl shadow-lg border border-white/5 p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">Title</label>
                        <input 
                            type="text" 
                            name="title" 
                            required
                            value={formData.title} 
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder-slate-600"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">Slug (URL)</label>
                        <input 
                            type="text" 
                            name="slug" 
                            required
                            value={formData.slug} 
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder-slate-600"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">Category</label>
                        <select 
                            name="category" 
                            value={formData.category} 
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white"
                        >
                            <option value="Faith">Faith</option>
                            <option value="Ministry">Ministry</option>
                            <option value="Theology">Theology</option>
                            <option value="Life">Life</option>
                            <option value="Testimony">Testimony</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">Status</label>
                        <select 
                            name="status" 
                            value={formData.status} 
                            onChange={handleChange}
                            className={`w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold ${formData.status === 'approved' ? 'text-green-400' : 'text-yellow-400'}`}
                        >
                            <option value="approved">Approved</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>

                     <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">Tags</label>
                        <input 
                            type="text" 
                            name="tags" 
                            value={formData.tags} 
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-slate-600"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400">Short Excerpt</label>
                    <textarea 
                        name="excerpt" 
                        required
                        rows={3}
                        value={formData.excerpt} 
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-slate-600"
                    ></textarea>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400">Content (HTML allowed)</label>
                    <textarea 
                        name="content" 
                        required
                        rows={15}
                        value={formData.content} 
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm text-white placeholder-slate-600"
                    ></textarea>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                    <Link href="/admin/blogs" className="px-6 py-2 border border-white/10 text-slate-400 font-bold rounded-lg hover:bg-slate-800 transition-colors">
                        Cancel
                    </Link>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/30 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
