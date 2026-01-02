"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import ImageUploader from "@/components/ImageUploader";
import AdminGuard from "@/components/admin/AdminGuard";
import { useModal } from "@/context/ModalContext";

interface MinistryImage {
  url: string;
  caption: string;
}

export default function CreateMinistryPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnUrl = searchParams.get('returnUrl') || '/admin/ministries'; // Default fallback
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        status: "active",
        visibility: "public",
        sharedWith: "" // Comma separated emails
    });
    const [images, setImages] = useState<MinistryImage[]>([]);
    const [uploadKey, setUploadKey] = useState(0);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageUploaded = (url: string) => {
        if (url) {
            setImages(prev => [...prev, { url, caption: "" }]);
            setUploadKey(prev => prev + 1); // Reset uploader
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const updateCaption = (index: number, caption: string) => {
        const newImages = [...images];
        newImages[index].caption = caption;
        setImages(newImages);
    };

    const { showAlert } = useModal(); // Added hook

    // ... existing state ...

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const sharedWithArray = formData.sharedWith.split(',').map(email => email.trim()).filter(email => email);

            await addDoc(collection(db, "ministries"), {
                title: formData.title,
                description: formData.description,
                status: formData.status,
                visibility: formData.visibility,
                sharedWith: sharedWithArray,
                images: images,
                authorId: user?.uid,
                authorName: user?.displayName || 'Admin',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            showAlert("Success", "Ministry added successfully!");
            router.push(returnUrl);
        } catch (error) {
            console.error("Error creating ministry:", error);
            showAlert("Error", "Failed to create ministry");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminGuard>
            <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link href={returnUrl} className="text-gray-500 hover:text-gray-700">
                    <i className="fas fa-arrow-left"></i> Back
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Add New Ministry</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Ministry Title</label>
                    <input 
                        type="text" 
                        name="title" 
                        required
                        value={formData.title} 
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Youth Mentorship Program"
                    />
                </div>

                {/* Image Gallery Section */}
                <div className="space-y-4">
                    <label className="text-sm font-bold text-gray-700">Gallery Images</label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {images.map((img, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50 relative">
                                <button 
                                    type="button" 
                                    onClick={() => removeImage(index)}
                                    className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-red-600 z-10"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                                <img src={img.url} alt="Uploaded" className="w-full h-40 object-cover rounded-md mb-2" />
                                <input 
                                    type="text" 
                                    placeholder="Image caption..."
                                    value={img.caption}
                                    onChange={(e) => updateCaption(index, e.target.value)}
                                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded outline-none focus:border-blue-500"
                                />
                            </div>
                        ))}
                        
                        {/* Upload Helper */}
                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center bg-gray-50 min-h-[240px] hover:bg-gray-50 transition-colors">
                           <div className="w-full max-w-[200px]">
                                <ImageUploader 
                                    key={uploadKey}
                                    onImageUploaded={handleImageUploaded} 
                                    folder="ministries" 
                                />
                           </div>
                           <p className="text-xs text-center text-gray-400 mt-2 font-medium">Click above to add an image</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Status</label>
                        <select 
                            name="status" 
                            value={formData.status} 
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="active">Active</option>
                            <option value="on-hold">On Hold</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Visibility</label>
                        <select 
                            name="visibility" 
                            value={formData.visibility} 
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="public">Public (Everyone)</option>
                            <option value="private">Private (Admin Only)</option>
                            <option value="shared">Shared (Specific Users)</option>
                        </select>
                    </div>
                </div>

                {formData.visibility === 'shared' && (
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">
                            Share with (Emails) <span className="text-gray-400 font-normal">- comma separated</span>
                        </label>
                        <textarea 
                            name="sharedWith" 
                            rows={2}
                            value={formData.sharedWith} 
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="user1@example.com, user2@example.com"
                        ></textarea>
                    </div>
                )}
                
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Description / Details</label>
                    <textarea 
                        name="description" 
                        required
                        rows={6}
                        value={formData.description} 
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe the ministry works..."
                    ></textarea>
                </div>

                <div className="pt-4 border-t border-gray-50 flex justify-end gap-3">
                    <Link href={returnUrl} className="px-6 py-2 border border-gray-200 text-gray-600 font-bold rounded-lg hover:bg-gray-50 transition-colors">
                        Cancel
                    </Link>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:bg-gray-400"
                    >
                        {loading ? 'Adding...' : 'Add Ministry'}
                    </button>
                </div>
            </form>
            </div>
        </AdminGuard>
    );
}
