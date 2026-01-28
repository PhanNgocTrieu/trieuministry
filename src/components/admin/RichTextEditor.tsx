"use client";

import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import React from 'react';

// Dynamic import to avoid SSR issues with Quills
const ReactQuill = dynamic(async () => {
    const { default: RQ } = await import('react-quill-new');
    return ({ forwardedRef, ...props }: any) => <RQ ref={forwardedRef} {...props} />;
}, { 
    ssr: false,
    loading: () => <div className="h-40 w-full bg-slate-800 animate-pulse rounded-lg"></div>
});

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

const modules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'blockquote'],
        ['clean']
    ],
};

export default function RichTextEditor({ value, onChange, placeholder, className = "" }: RichTextEditorProps) {
    return (
        <div className={`rich-text-editor ${className}`}>
            <style jsx global>{`
                .rich-text-editor .ql-toolbar {
                    background: transparent;
                    border: none !important;
                    border-bottom: 1px solid #e2e8f0 !important;
                    padding: 1rem;
                }
                .dark .rich-text-editor .ql-toolbar {
                    background: transparent;
                    border-bottom: 1px solid rgba(255,255,255,0.05) !important;
                }

                .rich-text-editor .ql-container {
                    background: transparent;
                    border: none !important;
                    font-size: 1.1rem;
                    color: #334155;
                    min-height: 200px;
                }
                .dark .rich-text-editor .ql-container {
                    color: #e2e8f0 !important;
                }
                
                .rich-text-editor .ql-editor {
                    padding: 2rem;
                    line-height: 1.8;
                }
                .rich-text-editor .ql-editor.ql-blank::before {
                    left: 2rem;
                    color: #94a3b8;
                    font-style: italic;
                }

                .dark .rich-text-editor .ql-container * {
                    color: white !important;
                    stroke: white !important;
                }

                .rich-text-editor .ql-stroke {
                    stroke: #64748b !important;
                }
                .dark .rich-text-editor .ql-stroke {
                    stroke: #94a3b8 !important;
                }

                .rich-text-editor .ql-fill {
                    fill: #64748b !important;
                }
                .dark .rich-text-editor .ql-fill {
                    fill: #94a3b8 !important;
                }

                .rich-text-editor .ql-picker {
                    color: #64748b !important;
                }
                .dark .rich-text-editor .ql-picker {
                    color: #94a3b8 !important;
                }

                .rich-text-editor .ql-picker-options {
                    background-color: #ffffff !important;
                    border: 1px solid #cbd5e1 !important;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    border-radius: 0.5rem;
                }
                .dark .rich-text-editor .ql-picker-options {
                    background-color: #1e293b !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                }

                .rich-text-editor .ql-active .ql-stroke {
                    stroke: #3b82f6 !important;
                }
                .rich-text-editor .ql-active .ql-fill {
                    fill: #3b82f6 !important;
                }
            `}</style>
            <ReactQuill 
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                placeholder={placeholder}
            />
        </div>
    );
}

