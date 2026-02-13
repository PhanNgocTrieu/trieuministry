"use client";

import React, { useState, useRef } from 'react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface FileUploaderProps {
    onFileUploaded: (url: string, type: 'image' | 'pdf', fileName: string) => void;
    currentFile?: string;
    folder?: string;
    accept?: string;
    label?: string;
}

export default function FileUploader({ onFileUploaded, currentFile, folder = 'uploads', accept = "image/*,application/pdf", label = "Click to upload file" }: FileUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    // Determine file type from currentFile extension or assume image if not pdf
    const [preview, setPreview] = useState(currentFile || '');
    const [fileType, setFileType] = useState<'image' | 'pdf'>(currentFile?.includes('.pdf') ? 'pdf' : 'image');
    
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        const isPdf = file.type === 'application/pdf';
        const isImage = file.type.startsWith('image/');

        if (!isPdf && !isImage) {
            setError('Please upload a valid image or PDF.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            setError('File size should be less than 10MB.');
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
                const type = isPdf ? 'pdf' : 'image';
                setFileType(type);
                onFileUploaded(downloadURL, type, file.name);
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
                accept={accept}
                className="hidden" 
            />
            
            {!preview ? (
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-all ${uploading ? 'pointer-events-none opacity-50' : ''}`}
                >
                    <div className="text-slate-400 mb-2 text-3xl">
                        <i className="fas fa-cloud-upload-alt"></i>
                    </div>
                    <p className="font-bold text-slate-500 dark:text-slate-400">{label}</p>
                    <p className="text-xs text-slate-400 mt-1">PDF or Images (Max 10MB)</p>
                </div>
            ) : (
                <div className="relative rounded-xl overflow-hidden group border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    
                    {fileType === 'image' ? (
                        <img src={preview} alt="Uploaded" className="w-full h-64 object-cover" />
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-4">
                            <i className="fas fa-file-pdf text-6xl text-rose-500"></i>
                            <a href={preview} target="_blank" rel="noopener noreferrer" className="text-sm font-bold hover:underline truncate max-w-xs">
                                View PDF
                            </a>
                        </div>
                    )}
                    
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-white text-slate-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-100 transition-colors"
                        >
                            Change
                        </button>
                        <button 
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setPreview('');
                                onFileUploaded('', 'image', '');
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
                <div className="mt-3 h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-violet-600 transition-all duration-300" 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            )}

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
    );
}
