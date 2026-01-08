"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";

export default function CreateBlogPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { showAlert } = useModal();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        category: "Faith",
        excerpt: "",
        content: "",
        tags: "",
        image: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const generateSlug = () => {
        const slug = formData.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
        setFormData(prev => ({ ...prev, slug }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await addDoc(collection(db, "blogs"), {
                ...formData,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(t => t),
                author: user?.displayName || "Admin",
                date: new Date().toISOString().split('T')[0],
                status: "approved",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            showAlert("Success", "Blog post created successfully!");
            router.push("/admin/blogs");
        } catch (error) {
            console.error("Error creating blog:", error);
            showAlert("Error", "Failed to create blog post");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/blogs" className="text-slate-400 hover:text-white transition-colors">
                    <i className="fas fa-arrow-left"></i> Back
                </Link>
                <h1 className="text-2xl font-bold text-white">Create New Blog Post</h1>
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
                            onBlur={generateSlug}
                            className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder-slate-600"
                            placeholder="Enter blog title"
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
                            className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-300 placeholder-slate-600"
                            placeholder="walking-in-faith"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <label className="text-sm font-bold text-slate-400">Tags (comma separated)</label>
                        <input 
                            type="text" 
                            name="tags" 
                            value={formData.tags} 
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-slate-600"
                            placeholder="faith, prayer, god"
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
                        placeholder="Brief summary of the post..."
                    ></textarea>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400">Content (HTML allowed)</label>
                    <textarea 
                        name="content" 
                        required
                        rows={10}
                        value={formData.content} 
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm text-white placeholder-slate-600"
                        placeholder="<p>Write your content here...</p>"
                    ></textarea>
                    <p className="text-xs text-slate-500">Currently only basic HTML is supported. Markdown or Rich Text Editor coming soon.</p>
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
                        {loading ? 'Publishing...' : 'Publish Post'}
                    </button>
                </div>
            </form>
        </div>
    );
}
