"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import AdminGuard from "@/components/admin/AdminGuard";
import FileUploader from "@/components/FileUploader";
import { useModal } from "@/context/ModalContext";
import { logActivity } from "@/lib/activity-logger";

export default function EditDocumentPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { user } = useAuth();
    const { showAlert } = useModal();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "teaching",
        author: "",
    });

    const [fileUrl, setFileUrl] = useState("");
    const [fileSize, setFileSize] = useState("");

    useEffect(() => {
        const fetchDocument = async () => {
            try {
                const docRef = doc(db, "documents", id);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData({
                        title: data.title || "",
                        description: data.description || "",
                        category: data.category || "teaching",
                        author: data.author || "",
                    });
                    setFileUrl(data.fileUrl || "");
                    setFileSize(data.size || "");
                } else {
                    showAlert("Error", "Document not found");
                    router.push("/admin/resources");
                }
            } catch (error) {
                console.error("Error fetching document:", error);
                showAlert("Error", "Failed to load document");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchDocument();
    }, [id, router, showAlert]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileUploaded = (url: string, type: 'image' | 'pdf', name: string) => {
        setFileUrl(url);
        // In a real scenario, you might want to get the size from metadata, 
        // but FileUploader might need to pass it back. 
        // For now, we'll leave size as existing or manual update if wanted.
        // Assuming file name has size info or we just skip size update on edit for now unless handled.
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.title.trim()) {
            showAlert("Error", "Please enter a title");
            return;
        }

        setSaving(true);

        try {
            const docRef = doc(db, "documents", id);
            await updateDoc(docRef, {
                ...formData,
                fileUrl,
                size: fileSize, // Preserve existing size or update if logic added
                updatedAt: serverTimestamp(),
            });

            await logActivity('documents', 'update', `Updated document: ${formData.title}`);

            showAlert("Success", "Document updated successfully!");
            router.push("/admin/resources");
        } catch (error) {
            console.error("Error updating document:", error);
            showAlert("Error", "Failed to update document");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminGuard>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-slate-500">Loading document...</div>
                </div>
            </AdminGuard>
        );
    }

    return (
        <AdminGuard>
            <div className="max-w-4xl mx-auto mb-20">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/admin/resources" className="inline-flex items-center gap-2 text-slate-500 hover:text-rose-600 transition-colors mb-6">
                        <i className="fas fa-arrow-left"></i>
                        <span>Back to Resources</span>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Document</h1>
                        <p className="text-xs text-slate-500">ID: {id}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-white/5 p-6 space-y-6">
                    
                    {/* Title & Category */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Title *</label>
                            <input
                                type="text"
                                name="title"
                                required
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white font-medium"
                            >
                                <option value="teaching">Teaching</option>
                                <option value="newsletter">Newsletter</option>
                                <option value="report">Report</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    {/* Author */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Author</label>
                        <input
                            type="text"
                            name="author"
                            value={formData.author}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white font-medium"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Description</label>
                        <textarea
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white placeholder-slate-400"
                        />
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-400">File</label>
                        <div className="border border-slate-200 dark:border-white/10 rounded-xl p-6 bg-slate-50 dark:bg-slate-800/50">
                            {fileUrl ? (
                                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center">
                                            <i className="fas fa-file-pdf"></i>
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white line-clamp-1">Current File</p>
                                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-rose-500 hover:text-rose-600">
                                                View File
                                            </a>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFileUrl("")}
                                        className="text-slate-400 hover:text-rose-500"
                                    >
                                        Change
                                    </button>
                                </div>
                            ) : (
                                <FileUploader
                                    onFileUploaded={handleFileUploaded}
                                    folder="documents"
                                    accept=".pdf,.doc,.docx"
                                />
                            )}
                        </div>
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
                            className="px-6 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-500 transition-colors shadow-lg shadow-rose-900/30 disabled:opacity-50 flex items-center gap-2"
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
