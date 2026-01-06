"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp, getDocs, collection, setDoc } from "firebase/firestore";
import Link from "next/link";
import ImageUploader from "@/components/ImageUploader";
import { useModal } from "@/context/ModalContext";

interface MinistryImage {
  url: string;
  caption: string;
}

export default function EditMinistryPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { showAlert } = useModal();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        category: "General",
        description: "",
        prayerNeeds: "", // Added
        status: "active",
        visibility: "public",
        sharedWith: "" // Comma separated emails
    });
    const [coverImage, setCoverImage] = useState<string>(""); // Single Image
    const [uploadKey, setUploadKey] = useState(0);
    const [isCustomCategory, setIsCustomCategory] = useState(false);

    const [categories, setCategories] = useState<string[]>([]);

    // Fetch existing categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                // Fetch from explicit categories collection
                const catsSnapshot = await getDocs(collection(db, "ministry_categories"));
                const storedCategories = new Set<string>();
                catsSnapshot.forEach(doc => {
                    storedCategories.add(doc.data().name);
                });

                // Also fetch from existing ministries (legacy support)
                const ministriesSnapshot = await getDocs(collection(db, "ministries"));
                ministriesSnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.category) {
                        storedCategories.add(data.category);
                    }
                });

                // Merge default and existing unique categories
                setCategories(prev => Array.from(new Set([...prev, ...Array.from(storedCategories)])).sort());
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };

        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchMinistry = async () => {
            try {
                const docRef = doc(db, "ministries", id);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData({
                        title: data.title || "",
                        category: data.category || "General",
                        description: data.description || "",
                        prayerNeeds: data.prayerNeeds || "",
                        status: data.status || "active",
                        visibility: data.visibility || "public",
                        sharedWith: data.sharedWith?.join(', ') || ""
                    });
                    
                    // Handle image migration: try coverImage, fallback to first image in 'images' array
                    if (data.coverImage) {
                        setCoverImage(data.coverImage);
                    } else if (data.images && data.images.length > 0) {
                        setCoverImage(data.images[0].url);
                    }
                } else {
                    showAlert("Error", "Ministry not found");
                    router.push("/admin/ministries");
                }
            } catch (error) {
                console.error("Error fetching ministry:", error);
                showAlert("Error", "Error loading ministry details");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchMinistry();
    }, [id, router, showAlert]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageUploaded = (url: string) => {
        if (url) {
            setCoverImage(url);
            setUploadKey(prev => prev + 1);
        }
    };

    const removeImage = () => {
        setCoverImage("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const sharedWithArray = formData.sharedWith.split(',').map(email => email.trim()).filter(email => email);

            // Auto-save category if new
            const categoryName = formData.category || "General";
            if (!categories.includes(categoryName)) {
                try {
                    const catId = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
                    await setDoc(doc(db, "ministry_categories", catId), {
                        name: categoryName,
                        createdAt: serverTimestamp()
                    });
                } catch (err) {
                    console.error("Error auto-saving category:", err);
                }
            }

            const docRef = doc(db, "ministries", id);
            await updateDoc(docRef, {
                title: formData.title,
                category: categoryName,
                description: formData.description,
                prayerNeeds: formData.prayerNeeds, // Save prayer needs
                status: formData.status,
                visibility: formData.visibility,
                sharedWith: sharedWithArray,
                coverImage: coverImage, // Save single image
                updatedAt: serverTimestamp()
            });

            showAlert("Success", "Ministry updated successfully!");
            router.push("/admin/ministries");
        } catch (error) {
            console.error("Error updating ministry:", error);
            showAlert("Error", "Failed to update ministry");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading ministry details...</div>;

    return (
        <div className="max-w-4xl mx-auto mb-20">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/ministries" className="text-gray-500 hover:text-gray-700">
                    <i className="fas fa-arrow-left"></i> Back
                </Link>
                <div className="flex-1">
                     <h1 className="text-2xl font-bold text-gray-900">Edit Ministry</h1>
                     <p className="text-xs text-gray-500">ID: {id}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Ministry Title</label>
                        <input 
                            type="text" 
                            name="title" 
                            required
                            value={formData.title} 
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Category</label>
                        <div className="flex gap-2">
                            {isCustomCategory ? (
                                <input 
                                    type="text" 
                                    name="category" 
                                    required
                                    value={formData.category} 
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-blue-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
                                    placeholder="Type new category name..."
                                    autoFocus
                                />
                            ) : (
                                <select
                                    name="category"
                                    required
                                    value={formData.category}
                                    onChange={(e) => {
                                        if (e.target.value === '__NEW__') {
                                            setIsCustomCategory(true);
                                            setFormData(prev => ({ ...prev, category: '' }));
                                        } else {
                                            handleChange(e);
                                        }
                                    }}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select a category...</option>
                                    {categories.map((cat, idx) => (
                                        <option key={idx} value={cat}>{cat}</option>
                                    ))}
                                    <option value="__NEW__" className="font-bold text-blue-600">+ Create New Category</option>
                                </select>
                            )}
                            
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCustomCategory(!isCustomCategory);
                                    if (!isCustomCategory) setFormData(prev => ({ ...prev, category: '' }));
                                }}
                                className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
                                title={isCustomCategory ? "Select Existing" : "Create New"}
                            >
                                <i className={`fas ${isCustomCategory ? 'fa-list' : 'fa-plus'}`}></i>
                            </button>
                        </div>
                        {isCustomCategory && (
                            <p className="text-xs text-blue-500 mt-1">
                                <i className="fas fa-info-circle"></i> New category will be saved automatically.
                            </p>
                        )}
                        {!isCustomCategory && (
                             <p className="text-xs text-gray-400 mt-1">
                                Can't find it? <button type="button" onClick={() => setIsCustomCategory(true)} className="text-blue-600 hover:underline">Create new</button> or <Link href="/admin/ministries/categories" className="text-blue-600 hover:underline">Manage Categories</Link>
                            </p>
                        )}
                    </div>
                </div>

                {/* Single Image Section */}
                <div className="space-y-4">
                    <label className="text-sm font-bold text-gray-700">Cover Image</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 bg-gray-50">
                        {coverImage ? (
                            <div className="relative group max-w-md mx-auto">
                                <img src={coverImage} alt="Cover" className="w-full h-auto rounded-lg shadow-md" />
                                <button 
                                    type="button" 
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm transition-colors"
                                    title="Remove Image"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center min-h-[200px]">
                                <div className="w-full max-w-[200px]">
                                     <ImageUploader 
                                         key={uploadKey}
                                         onImageUploaded={handleImageUploaded} 
                                         folder="ministries" 
                                     />
                                </div>
                                <p className="text-sm text-gray-500 mt-4">Upload a representative image for this ministry.</p>
                            </div>
                        )}
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
                    <label className="text-sm font-bold text-gray-700">Ministry Descriptions</label>
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

                 <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <span className="bg-orange-100 text-orange-700 p-1 rounded"><i className="fas fa-pray"></i></span>
                        Prayer Needs & Topics
                        <span className="text-gray-400 font-normal ml-auto text-xs">(Specific prayer points for this ministry)</span>
                    </label>
                    <textarea 
                        name="prayerNeeds" 
                        rows={4}
                        value={formData.prayerNeeds} 
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-orange-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 bg-orange-50/30"
                        placeholder="List the specific prayer needs for this ministry..."
                    ></textarea>
                </div>

                <div className="pt-4 border-t border-gray-50 flex justify-end gap-3">
                    <Link href="/admin/ministries" className="px-6 py-2 border border-gray-200 text-gray-600 font-bold rounded-lg hover:bg-gray-50 transition-colors">
                        Cancel
                    </Link>
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:bg-gray-400"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
