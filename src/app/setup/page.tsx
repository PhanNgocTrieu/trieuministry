"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { collection, getDocs, deleteDoc, doc, writeBatch } from "firebase/firestore";
import { useModal } from "@/context/ModalContext";

export default function SetupPage() {
    const [loading, setLoading] = useState(false);

    const [status, setStatus] = useState("");
    const { showAlert } = useModal();

    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    // Assuming the user added this var. If not, they'll need to type it or add it.
    // For security, password really shouldn't be in NEXT_PUBLIC_ env, but for this local setup tool it's acceptable if the user insisted.
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD; 



    const handleCreateAdmin = async () => {
        if (!adminEmail || !adminPassword) {
            showAlert("Error", "Missing NEXT_PUBLIC_ADMIN_EMAIL or NEXT_PUBLIC_ADMIN_PASSWORD in .env.local");
            return;
        }

        setLoading(true);
        setStatus("Creating Admin Account...");
        try {
            // Create in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
            await updateProfile(userCredential.user, {
                displayName: "System Admin",
                photoURL: "https://ui-avatars.com/api/?name=Admin&background=random"
            });
            
            setStatus(`Admin created successfully!\nEmail: ${adminEmail}\nUID: ${userCredential.user.uid}`);
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/email-already-in-use') {
                setStatus(`Error: Email ${adminEmail} is already registered. Please delete it in Firebase Console first if you want to recreate it.`);
            } else {
                setStatus(`Error creating admin: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
                <h1 className="text-2xl font-bold mb-6 text-gray-900 border-b pb-2">Admin Account Setup</h1>
                
                <div className="space-y-6">
                    <div>
                        <p className="text-sm text-gray-500 mb-3">
                            This tool helps you initialize the Admin account using credentials defined in <code>.env.local</code>.
                        </p>
                        <div className="bg-gray-50 p-3 rounded mb-3 text-xs font-mono text-gray-600 border border-gray-200">
                             EMAIL: {adminEmail || 'Not set'}<br/>
                             PASS: {adminPassword ? '******' : 'Not set'}
                        </div>
                        <button 
                            onClick={handleCreateAdmin}
                            disabled={loading}
                            className="w-full py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition-colors"
                        >
                            Create Admin Account
                        </button>
                    </div>

                    {status && (
                        <div className="mt-4 p-4 bg-gray-900 text-green-400 font-mono text-xs rounded overflow-x-auto whitespace-pre-wrap">
                            {status}
                        </div>
                    )}
                    
                    <div className="pt-4 border-t text-center">
                        <a href="/" className="text-blue-600 hover:underline text-sm">Return to Home</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
