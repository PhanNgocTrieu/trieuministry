"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import AdminGuard from "@/components/admin/AdminGuard";
import FileUploader from "@/components/FileUploader";
import { useModal } from "@/context/ModalContext";
import { logActivity } from "@/lib/activity-logger";

export default function CreateDocumentPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { showAlert } = useModal();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "Bible Study",
        author: "",
        date: new Date().toISOString().split('T')[0], // Default to today
    });

    const [fileData, setFileData] = useState<{ url: string, name: string, size?: string } | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileUploaded = (url: string, name: string) => {
        // Since FileUploader doesn't return size, we might skip it or estimate it
        // Ideally FileUploader should return metadata. For now just set URL and Name.
        setFileData({ url, name, size: 'Unknown' }); 
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.title.trim()) {
            showAlert("Error", "Please enter a title");
            return;
        }
        if (!fileData) {
            showAlert("Error", "Please upload a document");
            return;
        }

        setLoading(true);

        try {
            await addDoc(collection(db, "documents"), {
                title: formData.title,
                description: formData.description,
                category: formData.category,
                author: formData.author || "NTC Ministry",
                date: formData.date,
                fileUrl: fileData.url,
                fileName: fileData.name,
                size: fileData.size || "",
                createdBy: user?.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            await logActivity('documents', 'create', `Uploaded new document: ${formData.title}`);

            showAlert("Success", "Document uploaded successfully!");
            router.push("/admin/resources");
        } catch (error) {
            console.error("Error creating document:", error);
            showAlert("Error", "Failed to create document");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminGuard>
            <div className="max-w-4xl mx-auto mb-20">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/admin/resources" className="inline-flex items-center gap-2 text-slate-500 hover:text-rose-600 transition-colors mb-6">
                    <i className="fas fa-arrow-left"></i>
                    <span>Back to Resources</span>
                </Link>    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Upload Document</h1>
                </div>

                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-white/5 p-6 space-y-6">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Title *</label>
                            <input
                                type="text"
                                name="title"
                                required
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white font-medium"
                                placeholder="e.g., Worship Team Guidelines"
                            />
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white font-medium"
                            >
                                <option value="Bible Study">Bible Study</option>
                                <option value="Sharing">Sharing</option>
                                <option value="Guidelines">Guidelines</option>
                                <option value="Other">Other</option>
                            </select>
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
                                placeholder="e.g., Pastor Trieu"
                            />
                        </div>

                        {/* Date */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Display Date</label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white font-medium"
                            />
                        </div>
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
                            placeholder="Brief description of the document..."
                        />
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Document File (PDF) *</label>
                         <div className="border border-slate-200 dark:border-white/10 rounded-xl p-6 bg-slate-50 dark:bg-slate-800/50">
                            {fileData ? (
                                <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="w-10 h-10 rounded bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center font-bold">PDF</div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="font-bold text-slate-900 dark:text-white truncate">{fileData.name}</div>
                                        <a href={fileData.url} target="_blank" rel="noopener noreferrer" className="text-xs text-rose-500 hover:underline">View File</a>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => setFileData(null)}
                                        className="text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <i className="fas fa-times-circle text-xl"></i>
                                    </button>
                                </div>
                            ) : (
                                <FileUploader
                                    onFileUploaded={handleFileUploaded}
                                    folder="documents"
                                    acceptedFileTypes={['application/pdf']}
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
                            disabled={loading}
                            className="px-6 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-500 transition-colors shadow-lg shadow-rose-900/30 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-cloud-upload-alt"></i>
                                    Upload Document
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </AdminGuard>
    );
}
