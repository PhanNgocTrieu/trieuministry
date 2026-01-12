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
                    background: #f8fafc;
                    border-color: #cbd5e1 !important;
                    border-top-left-radius: 0.5rem;
                    border-top-right-radius: 0.5rem;
                }
                .dark .rich-text-editor .ql-toolbar {
                    background: #1e293b;
                    border-color: rgba(255,255,255,0.1) !important;
                }

                .rich-text-editor .ql-container {
                    background: #ffffff;
                    border-color: #cbd5e1 !important;
                    border-bottom-left-radius: 0.5rem;
                    border-bottom-right-radius: 0.5rem;
                    font-size: 1rem;
                    color: #0f172a;
                    min-height: 200px;
                }
                .dark .rich-text-editor .ql-container {
                    background: #1e293b;
                    border-color: rgba(255,255,255,0.1) !important;
                    color: white;
                }

                .rich-text-editor .ql-editor.ql-blank::before {
                    color: #94a3b8;
                    font-style: normal;
                }
                .dark .rich-text-editor .ql-editor.ql-blank::before {
                    color: #475569;
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
                    border-color: #cbd5e1 !important;
                }
                .dark .rich-text-editor .ql-picker-options {
                    background-color: #1e293b !important;
                    border-color: rgba(255,255,255,0.1) !important;
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

