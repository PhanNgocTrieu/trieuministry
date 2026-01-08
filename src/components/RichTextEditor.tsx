"use client";

import React, { useEffect, useRef, useState } from 'react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import mammoth from 'mammoth';

import { useModal } from '@/context/ModalContext';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const docInputRef = useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    const [isUploading, setIsUploading] = useState(false);
    const { showAlert } = useModal();

    // Commands to execute
    const execCommand = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        syncContent();
        editorRef.current?.focus();
    };

    const syncContent = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
            updateToolbarState();
        }
    };

    // --- Image Upload Logic ---
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const storageRef = ref(storage, `blog_content/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);
            
            uploadTask.on('state_changed', null, null, async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                // Insert image at cursor
                execCommand('insertImage', url);
                setIsUploading(false);
            });
        } catch (error) {
            console.error("Image upload failed", error);
            showAlert("Error", "Failed to upload image.");
            setIsUploading(false);
        }
    };

    // --- Document Import Logic ---
    const handleDocImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.name.endsWith('.docx')) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const arrayBuffer = event.target?.result as ArrayBuffer;
                try {
                    const result = await mammoth.convertToHtml({ arrayBuffer });
                    // Append or replace content? Let's append for safety
                    const newContent = (editorRef.current?.innerHTML || '') + result.value;
                    if (editorRef.current) editorRef.current.innerHTML = newContent;
                    onChange(newContent);
                } catch (err) {
                    console.error("Mammoth conversion error", err);
                    showAlert("Error", "Failed to convert Word document.");
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            showAlert("Info", "Only .docx files are supported for rich import currently.");
        }
    };

    // State for toolbar active buttons
    const [activeFormats, setActiveFormats] = useState<string[]>([]);
    const updateToolbarState = () => {
        const formats = [];
        if (document.queryCommandState('bold')) formats.push('bold');
        if (document.queryCommandState('italic')) formats.push('italic');
        if (document.queryCommandState('underline')) formats.push('underline');
        if (document.queryCommandState('strikeThrough')) formats.push('strikeThrough');
        if (document.queryCommandState('insertUnorderedList')) formats.push('ul');
        if (document.queryCommandState('insertOrderedList')) formats.push('ol');
        if (document.queryCommandState('justifyLeft')) formats.push('justifyLeft');
        if (document.queryCommandState('justifyCenter')) formats.push('justifyCenter');
        if (document.queryCommandState('justifyRight')) formats.push('justifyRight');
        setActiveFormats(formats);
    };

    // Sync value to innerHTML -- ONLY if not focused or if empty (reset)
    useEffect(() => {
        if (editorRef.current) {
            const currentHTML = editorRef.current.innerHTML;
            if (value !== currentHTML) {
                if (document.activeElement !== editorRef.current) {
                     editorRef.current.innerHTML = value;
                } else if (value === '' && currentHTML !== '<br>') {
                     editorRef.current.innerHTML = '';
                }
            }
        }
    }, [value]);

    return (
        <div className={`border rounded-2xl overflow-hidden bg-white dark:bg-slate-950 transition-all shadow-sm ${isFocused ? 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/30' : 'border-slate-200 dark:border-slate-700'}`}>
            {/* Hidden Inputs */}
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload} 
            />
            <input 
                type="file" 
                ref={docInputRef} 
                className="hidden" 
                accept=".docx"
                onChange={handleDocImport} 
            />

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 select-none">
                <ToolbarButton icon="fa-undo" onClick={() => execCommand('undo')} title="Undo" />
                <ToolbarButton icon="fa-redo" onClick={() => execCommand('redo')} title="Redo" />
                
                <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>

                {/* Font Size */}
                <select 
                    onChange={(e) => execCommand('fontSize', e.target.value)}
                    className="h-8 text-sm border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 focus:ring-blue-500 focus:border-blue-500 text-slate-700 dark:text-slate-300 font-medium px-1 outline-none"
                    defaultValue="3"
                >
                    <option value="1">Small</option>
                    <option value="3">Normal</option>
                    <option value="5">Large</option>
                    <option value="7">Huge</option>
                </select>

                <div className="w-px h-4 bg-gray-300 mx-1"></div>

                <ToolbarButton icon="fa-bold" isActive={activeFormats.includes('bold')} onClick={() => execCommand('bold')} title="Bold" />
                <ToolbarButton icon="fa-italic" isActive={activeFormats.includes('italic')} onClick={() => execCommand('italic')} title="Italic" />
                <ToolbarButton icon="fa-underline" isActive={activeFormats.includes('underline')} onClick={() => execCommand('underline')} title="Underline" />
                
                <div className="w-px h-4 bg-gray-300 mx-1"></div>

                <ToolbarButton icon="fa-align-left" isActive={activeFormats.includes('justifyLeft')} onClick={() => execCommand('justifyLeft')} title="Align Left" />
                <ToolbarButton icon="fa-align-center" isActive={activeFormats.includes('justifyCenter')} onClick={() => execCommand('justifyCenter')} title="Align Center" />
                <ToolbarButton icon="fa-align-right" isActive={activeFormats.includes('justifyRight')} onClick={() => execCommand('justifyRight')} title="Align Right" />

                <div className="w-px h-4 bg-gray-300 mx-1"></div>

                <ToolbarButton icon="fa-list-ul" isActive={activeFormats.includes('ul')} onClick={() => execCommand('insertUnorderedList')} title="Bullet List" />
                <ToolbarButton icon="fa-list-ol" isActive={activeFormats.includes('ol')} onClick={() => execCommand('insertOrderedList')} title="Numbered List" />
                
                <div className="w-px h-4 bg-gray-300 mx-1"></div>

                <ToolbarButton 
                    icon={isUploading ? "fa-spinner fa-spin" : "fa-image"} 
                    onClick={() => fileInputRef.current?.click()} 
                    title="Insert Image" 
                />
                 <ToolbarButton 
                    icon="fa-file-import" 
                    onClick={() => docInputRef.current?.click()} 
                    title="Import DOCX" 
                />
            </div>

            {/* Editable Area */}
            <div className="relative group">
                <style jsx global>{`
                    .editor-content h1 { font-size: 2em; font-weight: 800; margin: 0.67em 0; }
                    .editor-content h2 { font-size: 1.5em; font-weight: 700; margin: 0.83em 0; }
                    .editor-content img { max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
                `}</style>
                <div 
                    ref={editorRef}
                    className="editor-content p-4 min-h-[400px] outline-none text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-950"
                    contentEditable
                    onInput={(e) => {
                        onChange(e.currentTarget.innerHTML);
                        updateToolbarState();
                    }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyUp={updateToolbarState}
                    onMouseUp={updateToolbarState}
                    style={{ whiteSpace: 'pre-wrap' }}
                />
                
                {placeholder && !value && (
                    <div className="absolute top-4 left-4 text-slate-400 dark:text-slate-600 pointer-events-none select-none">
                        {placeholder}
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper Component (Same as before)
const ToolbarButton = ({ icon, label, onClick, title, textInfo, isActive = false }: { icon: string, label?: string, onClick: () => void, title: string, textInfo?: string, isActive?: boolean }) => (
    <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onClick(); }} // Prevent focus loss
        className={`p-2 rounded-lg transition-all flex items-center gap-1 min-w-[32px] justify-center relative group ${
            isActive ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10'
        }`}
        title={title}
    >
        <i className={`fas ${icon} ${textInfo === 'sm' ? 'text-xs' : ''}`}></i>
        {label && <span className={`font-bold ${textInfo === 'sm' ? 'text-xs' : 'text-sm'}`}>{label}</span>}
    </button>
);
