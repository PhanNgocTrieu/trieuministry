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
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/blogs" className="text-gray-500 hover:text-gray-700">
                    <i className="fas fa-arrow-left"></i> Back
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Create New Blog Post</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Title</label>
                        <input 
                            type="text" 
                            name="title" 
                            required
                            value={formData.title} 
                            onChange={handleChange}
                            onBlur={generateSlug}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="Enter blog title"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Slug (URL)</label>
                        <input 
                            type="text" 
                            name="slug" 
                            required
                            value={formData.slug} 
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="walking-in-faith"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Category</label>
                        <select 
                            name="category" 
                            value={formData.category} 
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="Faith">Faith</option>
                            <option value="Ministry">Ministry</option>
                            <option value="Theology">Theology</option>
                            <option value="Life">Life</option>
                            <option value="Testimony">Testimony</option>
                        </select>
                    </div>

                     <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Tags (comma separated)</label>
                        <input 
                            type="text" 
                            name="tags" 
                            value={formData.tags} 
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="faith, prayer, god"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Short Excerpt</label>
                    <textarea 
                        name="excerpt" 
                        required
                        rows={3}
                        value={formData.excerpt} 
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Brief summary of the post..."
                    ></textarea>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Content (HTML allowed)</label>
                    <textarea 
                        name="content" 
                        required
                        rows={10}
                        value={formData.content} 
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                        placeholder="<p>Write your content here...</p>"
                    ></textarea>
                    <p className="text-xs text-gray-500">Currently only basic HTML is supported. Markdown or Rich Text Editor coming soon.</p>
                </div>

                <div className="pt-4 border-t border-gray-50 flex justify-end gap-3">
                    <Link href="/admin/blogs" className="px-6 py-2 border border-gray-200 text-gray-600 font-bold rounded-lg hover:bg-gray-50 transition-colors">
                        Cancel
                    </Link>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:bg-gray-400"
                    >
                        {loading ? 'Publishing...' : 'Publish Post'}
                    </button>
                </div>
            </form>
        </div>
    );
}
