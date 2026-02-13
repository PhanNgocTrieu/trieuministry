"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import AdminGuard from "@/components/admin/AdminGuard";
import FileUploader from "@/components/FileUploader";
import ImageUploader from "@/components/ImageUploader";
import { useModal } from "@/context/ModalContext";
import { logActivity } from "@/lib/activity-logger";

export default function CreateSongPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { showAlert } = useModal();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        artist: "",
        duration: "PDF",
        type: "sheet" as "sheet" | "audio",
    });

    const [coverImage, setCoverImage] = useState<string>("");
    const [fileData, setFileData] = useState<{ url: string, name: string } | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileUploaded = (url: string, type: 'image' | 'pdf', name: string) => {
        setFileData({ url, name });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.title.trim()) {
            showAlert("Error", "Please enter a title");
            return;
        }
        if (!fileData) {
            showAlert("Error", "Please upload the sheet music");
            return;
        }

        setLoading(true);

        try {
            await addDoc(collection(db, "songs"), {
                title: formData.title,
                artist: formData.artist,
                duration: formData.duration,
                type: formData.type,
                cover: coverImage,
                fileUrl: fileData.url,
                fileName: fileData.name,
                createdBy: user?.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            await logActivity('songs', 'create', `Added new song: ${formData.title}`);

            showAlert("Success", "Song added successfully!");
            router.push("/admin/resources");
        } catch (error) {
            console.error("Error creating song:", error);
            showAlert("Error", "Failed to create song");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminGuard>
            <div className="max-w-4xl mx-auto mb-20">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/admin/resources" className="inline-flex items-center gap-2 text-slate-500 hover:text-amber-600 transition-colors mb-6">
                    <i className="fas fa-arrow-left"></i>
                    <span>Back to Resources</span>
                </Link>    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Add New Song</h1>
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
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white font-medium"
                                placeholder="Song Title"
                            />
                        </div>

                        {/* Artist */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Artist / Author</label>
                            <input
                                type="text"
                                name="artist"
                                value={formData.artist}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white font-medium"
                                placeholder="e.g. Worship Team"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Type */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Type</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white font-medium"
                            >
                                <option value="sheet">📄 Sheet Music (PDF)</option>
                                <option value="audio">🎵 Audio</option>
                            </select>
                        </div>
                        
                         {/* Duration/Info */}
                         <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Info / Duration</label>
                            <input
                                type="text"
                                name="duration"
                                value={formData.duration}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white font-medium"
                                placeholder="e.g. 5:30 or PDF"
                            />
                        </div>
                    </div>

                    {/* Cover Image */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Cover Image <span className="font-normal text-slate-500">(Optional)</span></label>
                        <div className="border border-slate-200 dark:border-white/10 rounded-xl p-6 bg-slate-50 dark:bg-slate-800/50">
                            {coverImage ? (
                                <div className="relative group max-w-xs mx-auto">
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
                                <div className="flex flex-col items-center justify-center min-h-[120px]">
                                    <div className="w-full max-w-[200px]">
                                        <ImageUploader
                                            onImageUploaded={(url) => setCoverImage(url)}
                                            folder="songs"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Sheet Music / File *</label>
                         <div className="border border-slate-200 dark:border-white/10 rounded-xl p-6 bg-slate-50 dark:bg-slate-800/50">
                            {fileData ? (
                                <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="w-10 h-10 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center font-bold">PDF</div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="font-bold text-slate-900 dark:text-white truncate">{fileData.name}</div>
                                        <a href={fileData.url} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-500 hover:underline">View File</a>
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
                                    folder="songs"
                                    accept=".pdf"
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
                            className="px-6 py-2.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors shadow-lg shadow-amber-900/30 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-save"></i>
                                    Save Song
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </AdminGuard>
    );
}
