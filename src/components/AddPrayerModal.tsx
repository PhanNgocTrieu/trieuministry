"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { logActivity } from "@/lib/activity-logger";

interface AddPrayerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function AddPrayerModal({ isOpen, onClose, onSuccess }: AddPrayerModalProps) {
    const [loading, setLoading] = useState(false);
    const { showAlert } = useModal();
    const { isAdmin, user } = useAuth();
    const [prayerType, setPrayerType] = useState<'personal' | 'community'>('community'); // Default public for everyone, Admin can change

    const [formData, setFormData] = useState({
        name: user?.displayName || "",
        content: ""
    });

    useEffect(() => {
        if (user?.displayName) {
            setFormData(prev => ({ ...prev, name: user.displayName! }));
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.content.trim()) return;

        setLoading(true);
        try {
            await addDoc(collection(db, "prayers"), {
                name: formData.name || "Anonymous",
                content: formData.content,
                status: "not_prayed", // Default status
                type: isAdmin ? prayerType : "community", // Only Admin can choose personal (private/ministry), users are always community (public)

                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            await logActivity(
                'prayer', 
                'create', 
                `New ${prayerType} prayer request: ${formData.content.substring(0, 30)}${formData.content.length > 30 ? '...' : ''}`,
                { user: formData.name, scope: prayerType }
            );

            setFormData({ name: "", content: "" });
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error("Error adding prayer:", error);
            showAlert("Error", "Failed to add prayer request.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">Add Personal Prayer</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Your Name (Optional)</label>
                        <input 
                            type="text" 
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Enter your name..."
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Prayer Request</label>
                        <textarea 
                            rows={4}
                            required
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            placeholder="Share your prayer request..."
                            value={formData.content}
                            onChange={(e) => setFormData({...formData, content: e.target.value})}
                        ></textarea>
                    </div>

                    {/* Admin Only: Type Selection */}
                    {isAdmin && (
                        <div className="space-y-2">
                             <label className="text-sm font-bold text-gray-700">Visibility (Admin Only)</label>
                             <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="prayerType"
                                        value="personal"
                                        checked={prayerType === 'personal'}
                                        onChange={() => setPrayerType('personal')}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-sm text-gray-600">Private (Ministry Page)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="prayerType"
                                        value="community"
                                        checked={prayerType === 'community'}
                                        onChange={() => setPrayerType('community')}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-sm text-gray-600">Public (Prayers Page)</span>
                                </label>
                             </div>
                        </div>
                    )}

                    <div className="pt-2 flex justify-end gap-3">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-200 text-gray-600 font-bold rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                        >
                            {loading ? 'Submitting...' : 'Submit Prayer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
