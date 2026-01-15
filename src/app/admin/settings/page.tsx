"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, writeBatch, query, where, Timestamp } from "firebase/firestore";
import AdminGuard from '@/components/admin/AdminGuard';
import { useModal } from '@/context/ModalContext';
import { subDays, format } from 'date-fns';

interface ResetOption {
    id: string;
    label: string;
    description: string;
    collections: string[]; // Actual Firestore collection names
    danger?: boolean;
}

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [cleanupStatus, setCleanupStatus] = useState("");
    
    // Selective Reset State
    const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());

    const { showConfirm, showAlert } = useModal();

    const resetOptions: ResetOption[] = [
        { 
            id: 'users', 
            label: 'Users & Profiles', 
            description: 'Deletes all user documents. Auth accounts remain.', 
            collections: ['users'] 
        },
        { 
            id: 'prayers', 
            label: 'Prayers & Intercession', 
            description: 'Deletes all prayer targets (Personal, Ministry, Intercession).', 
            collections: ['intercession_targets', 'personal_prayer_targets', 'ministry_prayer_targets'] 
        },
        { 
            id: 'ministry', 
            label: 'Ministries', 
            description: 'Deletes all ministry updates and content.', 
            collections: ['ministries'] 
        },
        { 
            id: 'wallets', 
            label: 'Wallets & Finance', 
            description: 'Deletes all wallets and financial records.', 
            collections: ['wallets'] 
        },
        { 
            id: 'content', 
            label: 'Content (Blogs & Goals)', 
            description: 'Deletes all blog posts and ministry goals.', 
            collections: ['blogs', 'ministry_goals', 'personal_goals'] 
        },
        { 
            id: 'logs', 
            label: 'System & Discipline Logs', 
            description: 'Deletes all discipline history and activity logs.', 
            collections: ['discipline_logs'] 
        }
    ];

    const toggleOption = (id: string) => {
        const next = new Set(selectedOptions);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedOptions(next);
    };

    const handleResetClick = () => {
        if (selectedOptions.size === 0) {
            showAlert("No Selection", "Please select at least one category to reset.");
            return;
        }

        const selectedLabels = resetOptions
            .filter(opt => selectedOptions.has(opt.id))
            .map(opt => `• ${opt.label}`)
            .join("\n");

        showConfirm(
            "⚠️ DANGER: Confirm Database Reset",
            `You are about to PERMANENTLY DELETE data from:\n\n${selectedLabels}\n\nThis action cannot be undone. Are you sure?`,
            executeSelectiveReset,
            true,
            "YES, DELETE SELECTED DATA",
            "Cancel"
        );
    };

    const executeSelectiveReset = async () => {
        setLoading(true);
        setStatus("Initializing reset protocol...");
        
        try {
            let totalDeleted = 0;
            const targetCollections: string[] = [];

            // Gather all collections to be wiped
            resetOptions.forEach(opt => {
                if (selectedOptions.has(opt.id)) {
                    targetCollections.push(...opt.collections);
                }
            });

            for (const colName of targetCollections) {
                setStatus(prev => prev + `\nScanning '${colName}'...`);
                
                const q = collection(db, colName);
                const snapshot = await getDocs(q);
                
                if (snapshot.empty) {
                    setStatus(prev => prev + ` (Empty)`);
                    continue;
                }

                // Batch delete (chunking by 500)
                const chunks = [];
                let currentChunk = writeBatch(db);
                let count = 0;

                snapshot.docs.forEach((doc, index) => {
                    currentChunk.delete(doc.ref);
                    count++;
                    if ((index + 1) % 400 === 0) {
                        chunks.push(currentChunk);
                        currentChunk = writeBatch(db);
                    }
                });
                chunks.push(currentChunk);

                for (const batch of chunks) {
                    await batch.commit();
                }

                setStatus(prev => prev + `\nSuccessfully deleted ${count} documents from '${colName}'.`);
                totalDeleted += count;
            }

            setStatus(prev => prev + `\n\n✅ AUTO-RESET COMPLETE.\nTotal Deleted: ${totalDeleted} documents.`);
            setSelectedOptions(new Set()); // Reset selection
            showAlert("Reset Complete", `Successfully deleted ${totalDeleted} documents from selected categories.`);
        } catch (error: any) {
            console.error("Reset Error:", error);
            setStatus(prev => prev + `\n❌ CRITICAL ERROR: ${error.message}`);
            showAlert("Execution Error", "An error occurred during the reset process.");
        } finally {
            setLoading(false);
        }
    };

    const handleCleanupLogs = async () => {
        setLoading(true);
        setCleanupStatus("Starting log cleanup...");
        try {
            // Delete logs older than 90 days
            const cutoffDate = format(subDays(new Date(), 90), 'yyyy-MM-dd');
            setCleanupStatus(prev => prev + `\nTargeting logs before: ${cutoffDate}`);

            const q = query(
                collection(db, 'discipline_logs'),
                where('date', '<', cutoffDate)
            );

            const snapshot = await getDocs(q);
            setCleanupStatus(prev => prev + `\nFound ${snapshot.size} old logs.`);

            if (snapshot.size > 0) {
                 const batch = writeBatch(db);
                 snapshot.docs.forEach(doc => batch.delete(doc.ref));
                 await batch.commit();
                 setCleanupStatus(prev => prev + `\n✅ Cleanup successful! Removed ${snapshot.size} records.`);
            } else {
                setCleanupStatus(prev => prev + `\nDatabase is clean. No old logs found.`);
            }
            
        } catch (error: any) {
            setCleanupStatus(prev => prev + `\n❌ Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminGuard>
            <div className="max-w-4xl mx-auto pb-20">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-slate-900 text-xl">
                        <i className="fas fa-cogs"></i>
                    </div>
                    <div>
                         <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Settings</h1>
                         <p className="text-slate-500 dark:text-slate-400">System configuration and data management</p>
                    </div>
                </div>

                {/* Section 1: Database Management */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-white/5 overflow-hidden mb-10">
                    <div className="p-6 border-b border-purple-100 dark:border-white/5 bg-gradient-to-r from-purple-50 to-white dark:from-slate-800 dark:to-slate-900">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <i className="fas fa-database text-purple-600 dark:text-purple-400"></i>
                            Database Reset
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Select specific data categories to wipe. This is generally used for testing or hard resets.
                        </p>
                    </div>
                    
                    <div className="p-6 md:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            {resetOptions.map(option => (
                                <div 
                                    key={option.id}
                                    onClick={() => toggleOption(option.id)}
                                    className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer group ${
                                        selectedOptions.has(option.id)
                                            ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                                            : 'border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                                    }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                                            selectedOptions.has(option.id)
                                                ? 'bg-red-500 border-red-500 text-white'
                                                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                        }`}>
                                            {selectedOptions.has(option.id) && <i className="fas fa-check text-xs"></i>}
                                        </div>
                                        <div>
                                            <h3 className={`font-bold mb-1 ${
                                                selectedOptions.has(option.id) ? 'text-red-700 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'
                                            }`}>
                                                {option.label}
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                                {option.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-white/5 gap-4">
                            <div className="text-sm text-slate-500 font-medium">
                                Selected: <span className="text-slate-900 dark:text-white font-bold">{selectedOptions.size}</span> categories
                            </div>
                            <button 
                                onClick={handleResetClick}
                                disabled={loading || selectedOptions.size === 0}
                                className={`px-8 py-3 rounded-lg font-bold text-white shadow-lg transition-all flex items-center gap-2 ${
                                    loading || selectedOptions.size === 0
                                        ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed shadow-none' 
                                        : 'bg-red-600 hover:bg-red-700 hover:shadow-red-500/30 hover:scale-105 active:scale-95'
                                }`}
                            >
                                <i className="fas fa-trash-alt"></i>
                                {loading ? 'Processing Deletion...' : 'Delete Selected Data'}
                            </button>
                        </div>

                        {status && (
                            <div className="mt-6 p-4 bg-slate-950 text-green-400 font-mono text-xs rounded-xl overflow-x-auto whitespace-pre-wrap border border-slate-800 shadow-inner max-h-60 overflow-y-auto custom-scrollbar">
                                <div className="flex items-center gap-2 text-slate-500 mb-2 border-b border-slate-800 pb-2">
                                    <i className="fas fa-terminal"></i> Console Output
                                </div>
                                {status}
                            </div>
                        )}
                    </div>
                </div>

                {/* Section 2: Maintenance Tools */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-white/5 p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg">
                                <i className="fas fa-broom"></i>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">Cleanup Logs</h3>
                                <p className="text-xs text-slate-500">Prune system logs older than 90 days.</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                            Keeps the database healthy by removing old 'discipline_logs' records. Does not affect user profiles or active prayers.
                        </p>
                        <button 
                            onClick={handleCleanupLogs}
                            disabled={loading}
                            className="w-full py-2.5 rounded-lg border border-blue-200 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors text-sm"
                        >
                            Run Cleanup Task
                        </button>
                         {cleanupStatus && (
                            <div className="mt-4 text-xs font-mono text-slate-500 whitespace-pre-wrap bg-slate-50 dark:bg-black/20 p-2 rounded border border-slate-100 dark:border-white/5">
                                {cleanupStatus}
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-white/5 p-6 opacity-60 pointer-events-none grayscale">
                        <div className="flex items-center gap-4 mb-4">
                             <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-lg">
                                <i className="fas fa-box-open"></i>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Orphaned Data</h3>
                                <p className="text-xs text-slate-500">Find & remove unlinked items.</p>
                            </div>
                        </div>
                         <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                            Scans for wallet items, comments, or goals that are missing their parent container and removes them.
                        </p>
                        <button className="w-full py-2.5 rounded-lg border border-orange-200 text-orange-600 font-bold text-sm">
                            Coming Soon
                        </button>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-10 text-center text-xs text-slate-400">
                    <p>System Version v1.0.0 (Phase 6)</p>
                    <p className="mt-1">Admin: {process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'Not configured'}</p>
                </div>

            </div>
        </AdminGuard>
    );
}
