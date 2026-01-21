"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import AdminGuard from "@/components/admin/AdminGuard";
import FileUploader from "@/components/FileUploader";
import ImageUploader from "@/components/ImageUploader";
import { useModal } from "@/context/ModalContext";
import { logActivity } from "@/lib/activity-logger";

export default function EditSongPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { user } = useAuth();
    const { showAlert } = useModal();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        artist: "",
        type: "sheet" as "sheet" | "audio",
        duration: "",
    });

    const [coverImage, setCoverImage] = useState<string>("");
    const [fileUrl, setFileUrl] = useState("");

    useEffect(() => {
        const fetchSong = async () => {
            try {
                const docRef = doc(db, "songs", id);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData({
                        title: data.title || "",
                        artist: data.artist || "",
                        type: data.type || "sheet",
                        duration: data.duration || "",
                    });
                    setCoverImage(data.cover || "");
                    setFileUrl(data.fileUrl || "");
                } else {
                    showAlert("Error", "Song not found");
                    router.push("/admin/resources");
                }
            } catch (error) {
                console.error("Error fetching song:", error);
                showAlert("Error", "Failed to load song");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchSong();
    }, [id, router, showAlert]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileUploaded = (url: string, name: string) => {
        setFileUrl(url);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.title.trim()) {
            showAlert("Error", "Please enter a title");
            return;
        }

        setSaving(true);

        try {
            const docRef = doc(db, "songs", id);
            await updateDoc(docRef, {
                ...formData,
                cover: coverImage,
                fileUrl,
                updatedAt: serverTimestamp(),
            });

            await logActivity('songs', 'update', `Updated song: ${formData.title}`);

            showAlert("Success", "Song updated successfully!");
            router.push("/admin/resources");
        } catch (error) {
            console.error("Error updating song:", error);
            showAlert("Error", "Failed to update song");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminGuard>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-slate-500">Loading song...</div>
                </div>
            </AdminGuard>
        );
    }

    return (
        <AdminGuard>
            <div className="max-w-4xl mx-auto mb-20">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/admin/resources" className="inline-flex items-center gap-2 text-slate-500 hover:text-amber-600 transition-colors mb-6">
                        <i className="fas fa-arrow-left"></i>
                        <span>Back to Resources</span>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Song</h1>
                        <p className="text-xs text-slate-500">ID: {id}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-white/5 p-6 space-y-6">
                    
                    {/* Title & Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Title *</label>
                            <input
                                type="text"
                                name="title"
                                required
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Type</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white font-medium"
                            >
                                <option value="sheet">🎼 Sheet Music</option>
                                <option value="audio">🎵 Audio File</option>
                            </select>
                        </div>
                    </div>

                    {/* Artist & Duration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Artist / Author</label>
                            <input
                                type="text"
                                name="artist"
                                value={formData.artist}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Duration / Pages</label>
                            <input
                                type="text"
                                name="duration"
                                value={formData.duration}
                                onChange={handleChange}
                                placeholder="e.g. 3:45 or 2 pages"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white font-medium"
                            />
                        </div>
                    </div>

                    {/* Cover Image */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-400">Cover Image</label>
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
                                <div className="flex flex-col items-center justify-center min-h-[150px]">
                                    <div className="w-full max-w-[200px]">
                                        <ImageUploader
                                            onImageUploaded={(url) => setCoverImage(url)}
                                            folder="songs/covers"
                                        />
                                    </div>
                                    <p className="text-sm text-slate-500 mt-4">Upload a cover image</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-400">File</label>
                        <div className="border border-slate-200 dark:border-white/10 rounded-xl p-6 bg-slate-50 dark:bg-slate-800/50">
                            {fileUrl ? (
                                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
                                            <i className={`fas ${formData.type === 'sheet' ? 'fa-file-pdf' : 'fa-music'}`}></i>
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white line-clamp-1">Current File</p>
                                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-500 hover:text-amber-600">
                                                View File
                                            </a>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFileUrl("")}
                                        className="text-slate-400 hover:text-amber-500"
                                    >
                                        Change
                                    </button>
                                </div>
                            ) : (
                                <FileUploader
                                    onFileUploaded={handleFileUploaded}
                                    folder="songs/files"
                                    accept={formData.type === 'sheet' ? ".pdf" : ".mp3,.wav"}
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
                            className="px-6 py-2.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors shadow-lg shadow-amber-900/30 disabled:opacity-50 flex items-center gap-2"
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
