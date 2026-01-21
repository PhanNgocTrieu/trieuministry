"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import AdminGuard from "@/components/admin/AdminGuard";
import RichTextEditor from "@/components/RichTextEditor";
import ImageUploader from "@/components/ImageUploader";
import { useModal } from "@/context/ModalContext";
import { logActivity } from "@/lib/activity-logger";

export default function CreateTestimonyPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { showAlert } = useModal();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        excerpt: "",
        content: "",
        status: "draft" as "draft" | "published",
    });

    const [coverImage, setCoverImage] = useState<string>("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.title.trim()) {
            showAlert("Error", "Please enter a title");
            return;
        }
        if (!formData.content.trim()) {
            showAlert("Error", "Please enter content");
            return;
        }

        setLoading(true);

        try {
            // Generate slug from title
            const slug = formData.title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .substring(0, 60);

            await addDoc(collection(db, "testimonies"), {
                title: formData.title,
                slug: slug,
                excerpt: formData.excerpt || formData.content.replace(/<[^>]*>/g, '').substring(0, 150),
                content: formData.content,
                status: formData.status,
                coverImage: coverImage,
                author: user?.displayName || "Admin",
                authorId: user?.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            await logActivity('testimonies', 'create', `Created new testimony: ${formData.title}`);

            showAlert("Success", "Testimony created successfully!");
            router.push("/admin/resources");
        } catch (error) {
            console.error("Error creating testimony:", error);
            showAlert("Error", "Failed to create testimony");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminGuard>
            <div className="max-w-4xl mx-auto mb-20">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/admin/resources" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-6">
                    <i className="fas fa-arrow-left"></i>
                    <span>Back to Resources</span>
                </Link>    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create New Testimony</h1>
                </div>

                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-white/5 p-6 space-y-6">
                    
                    {/* Status Row */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-medium"
                        >
                            <option value="draft">📝 Draft</option>
                            <option value="published">🌐 Published</option>
                        </select>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Title *</label>
                        <input
                            type="text"
                            name="title"
                            required
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white text-lg font-medium placeholder-slate-400"
                            placeholder="Enter the title..."
                        />
                    </div>

                    {/* Excerpt */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-400">
                            Excerpt <span className="font-normal text-slate-500">(optional)</span>
                        </label>
                        <textarea
                            name="excerpt"
                            rows={2}
                            value={formData.excerpt}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400"
                            placeholder="Brief summary..."
                        />
                    </div>

                    {/* Cover Image */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Cover Image</label>
                        <div className="border border-slate-200 dark:border-white/10 rounded-xl p-6 bg-slate-50 dark:bg-slate-800/50">
                            {coverImage ? (
                                <div className="relative group max-w-md mx-auto">
                                    <img src={coverImage} alt="Cover" className="w-full h-auto rounded-lg shadow-md" />
                                    <button
                                        type="button"
                                        onClick={() => setCoverImage("")}
                                        className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm transition-colors"
                                        title="Remove Image"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center min-h-[150px]">
                                    <div className="w-full max-w-[200px]">
                                        <ImageUploader
                                            onImageUploaded={(url) => setCoverImage(url)}
                                            folder="testimonies"
                                        />
                                    </div>
                                    <p className="text-sm text-slate-500 mt-4">Upload a cover image</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Content *</label>
                        <RichTextEditor
                            value={formData.content}
                            onChange={(html) => setFormData({ ...formData, content: html })}
                            placeholder="Share the testimony..."
                        />
                    </div>

                    {/* Submit Buttons */}
                    <div className="pt-6 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3">
                        <Link
                            href="/admin/resources"
                            className="px-6 py-2.5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/30 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-save"></i>
                                    Create Testimony
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </AdminGuard>
    );
}
