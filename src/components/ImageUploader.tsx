"use client";

import React, { useState, useRef } from 'react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface ImageUploaderProps {
    onImageUploaded: (url: string) => void;
    currentImage?: string;
    folder?: string;
}

export default function ImageUploader({ onImageUploaded, currentImage, folder = 'blog_images' }: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [preview, setPreview] = useState(currentImage || '');
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file (JPG, PNG, GIF).');
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            setError('Image size should be less than 5MB.');
            return;
        }

        setError('');
        setUploading(true);

        // Create storage ref
        const timestamp = Date.now();
        const storageRef = ref(storage, `${folder}/${timestamp}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setProgress(p);
            },
            (err) => {
                console.error("Upload failed:", err);
                setError('Upload failed. Please try again.');
                setUploading(false);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                setPreview(downloadURL);
                onImageUploaded(downloadURL);
                setUploading(false);
                setProgress(0);
            }
        );
    };

    return (
        <div className="w-full">
            <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
            />
            
            {!preview ? (
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all ${uploading ? 'pointer-events-none opacity-50' : ''}`}
                >
                    <div className="text-gray-400 mb-2 text-3xl">
                        <i className="fas fa-image"></i>
                    </div>
                    <p className="font-bold text-gray-500">Click to upload cover image</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                </div>
            ) : (
                <div className="relative rounded-xl overflow-hidden group border border-gray-200 bg-gray-50">
                    <img src={preview} alt="Uploaded" className="w-full h-64 object-cover" />
                    
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-white text-gray-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors"
                        >
                            Change Image
                        </button>
                        <button 
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setPreview('');
                                onImageUploaded('');
                            }}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-600 transition-colors"
                        >
                            Remove
                        </button>
                    </div>
                </div>
            )}

            {/* Progress Bar */}
            {uploading && (
                <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-blue-600 transition-all duration-300" 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            )}

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
    );
}
