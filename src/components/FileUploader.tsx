"use client";

import React, { useState, useRef } from 'react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface FileUploaderProps {
    onFileUploaded: (url: string, fileName: string) => void;
    currentFile?: string;
    folder?: string;
    accept?: string;
    label?: string;
}

export default function FileUploader({ 
    onFileUploaded, 
    currentFile, 
    folder = 'uploads', 
    accept = '.pdf',
    label = 'Upload File'
}: FileUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [fileUrl, setFileUrl] = useState(currentFile || '');
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync fileUrl with currentFile prop
    React.useEffect(() => {
        setFileUrl(currentFile || '');
    }, [currentFile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            setError('File size should be less than 10MB.');
            return;
        }

        setError('');
        setUploading(true);
        setFileName(file.name);

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
                setFileUrl(downloadURL);
                onFileUploaded(downloadURL, file.name);
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
            
            {!fileUrl ? (
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all ${uploading ? 'pointer-events-none opacity-50' : ''}`}
                >
                    <div className="text-gray-400 mb-2 text-2xl">
                        <i className="fas fa-file-pdf"></i>
                    </div>
                    <p className="font-bold text-gray-500">{label}</p>
                    <p className="text-xs text-gray-400 mt-1">Max 10MB</p>
                </div>
            ) : (
                <div className="relative rounded-xl border border-blue-100 bg-blue-50 p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-file-pdf text-xl"></i>
                        </div>
                        <div className="min-w-0">
                             <p className="font-bold text-gray-800 text-sm truncate">{fileName || 'File Uploaded'}</p>
                             <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">View File</a>
                        </div>
                    </div>
                    
                    <button 
                         type="button"
                         onClick={() => {
                            setFileUrl('');
                            setFileName('');
                            onFileUploaded('', '');
                         }}
                         className="text-gray-400 hover:text-red-500 p-2 transition-colors"
                         title="Remove file"
                    >
                        <i className="fas fa-trash-alt"></i>
                    </button>
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
