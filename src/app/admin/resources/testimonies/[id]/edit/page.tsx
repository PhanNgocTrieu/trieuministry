"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import AdminGuard from "@/components/admin/AdminGuard";
import RichTextEditor from "@/components/RichTextEditor";
import ImageUploader from "@/components/ImageUploader";
import { useModal } from "@/context/ModalContext";
import { logActivity } from "@/lib/activity-logger";

export default function EditTestimonyPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { user } = useAuth();
    const { showAlert } = useModal();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        excerpt: "",
        content: "",
        status: "draft" as "draft" | "published",
    });

    const [coverImage, setCoverImage] = useState<string>("");

    useEffect(() => {
        const fetchTestimony = async () => {
            try {
                const docRef = doc(db, "testimonies", id);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData({
                        title: data.title || "",
                        excerpt: data.excerpt || "",
                        content: data.content || "",
                        status: data.status || "draft",
                    });
                    setCoverImage(data.coverImage || "");
                } else {
                    showAlert("Error", "Testimony not found");
                    router.push("/admin/resources");
                }
            } catch (error) {
                console.error("Error fetching testimony:", error);
                showAlert("Error", "Failed to load testimony");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchTestimony();
    }, [id, router, showAlert]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.title.trim()) {
            showAlert("Error", "Please enter a title");
            return;
        }

        setSaving(true);

        try {
            const docRef = doc(db, "testimonies", id);
            await updateDoc(docRef, {
                title: formData.title,
                excerpt: formData.excerpt,
                content: formData.content,
                status: formData.status,
                coverImage: coverImage,
                updatedAt: serverTimestamp(),
            });

            await logActivity('testimonies', 'update', `Updated testimony: ${formData.title}`);

            showAlert("Success", "Testimony updated successfully!");
            router.push("/admin/resources");
        } catch (error) {
            console.error("Error updating testimony:", error);
            showAlert("Error", "Failed to update testimony");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminGuard>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-slate-500">Loading testimony...</div>
                </div>
            </AdminGuard>
        );
    }

    return (
        <AdminGuard>
            <div className="max-w-4xl mx-auto mb-20">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/admin/resources" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-6">
                        <i className="fas fa-arrow-left"></i>
                        <span>Back to Resources</span>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Testimony</h1>
                        <p className="text-xs text-slate-500">ID: {id}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-white/5 p-6 space-y-6">
                    
                    {/* Status Row */}
                    <div className="flex justify-end">
                        <div className="w-40 space-y-2">
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
                            placeholder="Enter testimony title..."
                        />
                    </div>

                    {/* Excerpt */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-400">
                            Excerpt
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
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Content</label>
                        <RichTextEditor
                            value={formData.content}
                            onChange={(html) => setFormData({ ...formData, content: html })}
                            placeholder="Write the testimony here..."
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
                            disabled={saving}
                            className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/30 disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-save"></i>
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </AdminGuard>
    );
}
