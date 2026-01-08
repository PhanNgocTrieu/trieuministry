"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, writeBatch } from "firebase/firestore";

import { useModal } from '@/context/ModalContext';

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");
    const { showConfirm, showAlert } = useModal();

    const handleResetClick = () => {
        showConfirm(
            "DANGER: Reset Database?",
            "This will PERMANENTLY DELETE ALL DATA from 'users', 'prayers', and 'blogs' collections.\n\nThis action cannot be undone. Are you absolutely sure?",
            confirmResetDatabase,
            true,
            "YES, DELETE EVERYTHING",
            "Cancel"
        );
    };

    const confirmResetDatabase = async () => {
        setLoading(true);
        setStatus("Starting database reset...");
        
        try {
            const collections = ["users", "prayers", "blogs"];
            let totalDeleted = 0;

            for (const colName of collections) {
                const q = collection(db, colName);
                const snapshot = await getDocs(q);
                const batch = writeBatch(db);
                let count = 0;
                
                snapshot.forEach((doc) => {
                    batch.delete(doc.ref);
                    count++;
                });

                if (count > 0) {
                    await batch.commit();
                    setStatus(prev => prev + `\nDeleted ${count} documents from '${colName}'...`);
                    totalDeleted += count;
                } else {
                    setStatus(prev => prev + `\nCollection '${colName}' is already empty.`);
                }
            }

            setStatus(prev => prev + `\n\n✅ Reset Complete! Total ${totalDeleted} documents deleted.`);
            showAlert("Success", "Database has been reset successfully.");
        } catch (error: any) {
            console.error(error);
            setStatus(prev => prev + `\n❌ Error: ${error.message}`);
            showAlert("Error", "An error occurred. Check the log.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">System Settings</h1>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-white/5 overflow-hidden mb-8">
                <div className="p-6 border-b border-red-500/20 bg-red-50 dark:bg-red-500/5">
                    <h2 className="text-lg font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                        <i className="fas fa-exclamation-triangle"></i> Danger Zone
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Irreversible actions for system management. Proceed with caution.
                    </p>
                </div>
                
                <div className="p-6 bg-red-50/50 dark:bg-red-900/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">Reset Database</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Wipes all data from <strong>Users</strong>, <strong>Prayers</strong>, and <strong>Blogs</strong> collections.
                                <br/>Does not delete Authentication accounts.
                            </p>
                        </div>
                        <button 
                            onClick={handleResetClick}
                            disabled={loading}
                            className={`px-5 py-2.5 rounded-lg font-bold text-white shadow-lg transition-all
                                ${loading ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 hover:shadow-red-900/30'}
                            `}
                        >
                            {loading ? 'Processing...' : 'Reset All Data'}
                        </button>
                    </div>

                    {status && (
                        <div className="mt-6 p-4 bg-slate-100 dark:bg-black text-green-600 dark:text-green-400 font-mono text-xs rounded-lg overflow-x-auto whitespace-pre-wrap border border-slate-200 dark:border-white/10">
                            {status}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-white/5 p-6">
                 {/* ... existing app info ... */}
                 <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Application Information</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-white/5">
                         <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Admin Email</span>
                         <span className="font-mono text-sm text-slate-700 dark:text-slate-300">{process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'Not configured'}</span>
                     </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-white/5">
                         <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Version</span>
                         <span className="font-mono text-sm text-slate-700 dark:text-slate-300">v1.0.0 (Phase 6)</span>
                     </div>
                 </div>
            </div>


        </div>
    );
}
