"use client";

import { useState } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import PostsManager from "@/components/admin/resources/PostsManager";
import TestimoniesManager from "@/components/admin/resources/TestimoniesManager";
import DocumentsManager from "@/components/admin/resources/DocumentsManager";
import SongsManager from "@/components/admin/resources/SongsManager";

export default function AdminResourcesPage() {
    const [activeTab, setActiveTab] = useState<'posts' | 'testimonies' | 'documents' | 'songs'>('posts');

    const tabs = [
        { id: 'posts', label: 'Blog Posts', icon: 'fas fa-newspaper', color: 'violet' },
        { id: 'testimonies', label: 'Testimonies', icon: 'fas fa-bullhorn', color: 'indigo' },
        { id: 'documents', label: 'Documents', icon: 'fas fa-file-alt', color: 'rose' },
        { id: 'songs', label: 'Translated Songs', icon: 'fas fa-music', color: 'amber' },
    ];

    return (
        <AdminGuard>
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Resources Management</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage all ministry resources in one place</p>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-8 bg-white dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200 dark:border-white/5 backdrop-blur-sm">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-200 ${
                                activeTab === tab.id
                                    ? `bg-${tab.color}-600 text-white shadow-lg shadow-${tab.color}-900/30`
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            <i className={tab.icon}></i>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="min-h-[500px]">
                    {activeTab === 'posts' && <PostsManager />}
                    {activeTab === 'testimonies' && <TestimoniesManager />}
                    {activeTab === 'documents' && <DocumentsManager />}
                    {activeTab === 'songs' && <SongsManager />}
                </div>
            </div>
        </AdminGuard>
    );
}
