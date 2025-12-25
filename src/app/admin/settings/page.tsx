"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, writeBatch } from "firebase/firestore";

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");

    const handleResetDatabase = async () => {
        const confirmMessage = "DANGER: This will PERMANENTLY DELETE all Users, Prayers, and Blogs data from Firestore.\n\nAre you sure you want to proceed?";
        if (!confirm(confirmMessage)) return;
        if (!confirm("Are you really sure? This action cannot be undone.")) return;
        
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
            alert("Database has been reset successfully.");
        } catch (error: any) {
            console.error(error);
            setStatus(prev => prev + `\n❌ Error: ${error.message}`);
            alert("An error occurred. Check the log.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">System Settings</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-50">
                    <h2 className="text-lg font-bold text-red-600 flex items-center gap-2">
                        <i className="fas fa-exclamation-triangle"></i> Danger Zone
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Irreversible actions for system management. Proceed with caution.
                    </p>
                </div>
                
                <div className="p-6 bg-red-50/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-gray-900">Reset Database</h3>
                            <p className="text-sm text-gray-500">
                                Wipes all data from <strong>Users</strong>, <strong>Prayers</strong>, and <strong>Blogs</strong> collections.
                                <br/>Does not delete Authentication accounts.
                            </p>
                        </div>
                        <button 
                            onClick={handleResetDatabase}
                            disabled={loading}
                            className={`px-5 py-2.5 rounded-lg font-bold text-white shadow-sm transition-all
                                ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 hover:shadow-md'}
                            `}
                        >
                            {loading ? 'Processing...' : 'Reset All Data'}
                        </button>
                    </div>

                    {status && (
                        <div className="mt-6 p-4 bg-gray-900 text-green-400 font-mono text-xs rounded-lg overflow-x-auto whitespace-pre-wrap border border-gray-800">
                            {status}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                 <h2 className="text-lg font-bold text-gray-900 mb-4">Application Information</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="p-3 bg-gray-50 rounded-lg">
                         <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Admin Email</span>
                         <span className="font-mono text-sm">{process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'Not configured'}</span>
                     </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                         <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Version</span>
                         <span className="font-mono text-sm">v1.0.0 (Phase 6)</span>
                     </div>
                 </div>
            </div>
        </div>
    );
}
