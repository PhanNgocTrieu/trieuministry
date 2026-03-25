"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { RoomCleaning, RoomCleaningPayload } from "@/types/room";
import { useAuth } from "@/context/AuthContext";

interface CleaningModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (cleaning: RoomCleaning) => void;
    initialDate?: Date;
    editingCleaning?: RoomCleaning | null;
}

export default function CleaningModal({
    isOpen,
    onClose,
    onSuccess,
    initialDate,
    editingCleaning
}: CleaningModalProps) {
    const { user } = useAuth();
    
    const [cleanerName, setCleanerName] = useState("");
    const [dateStr, setDateStr] = useState("");
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setError("");
            
            if (editingCleaning) {
                setCleanerName(editingCleaning.cleanerName);
                setDateStr(editingCleaning.date);
            } else {
                setCleanerName("");
                const baseDate = initialDate || new Date();
                setDateStr(format(baseDate, "yyyy-MM-dd"));
            }
        }
    }, [isOpen, initialDate, editingCleaning]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        
        if (!cleanerName.trim()) {
            setError("Vui lòng nhập tên người dọn phòng.");
            return;
        }
        
        try {
            setLoading(true);
            
            const payload: RoomCleaningPayload = {
                date: dateStr,
                cleanerName: cleanerName.trim()
            };
            
            let userToken = "";
            if (user) {
                userToken = await user.getIdToken();
            }

            const headers: Record<string, string> = {
                "Content-Type": "application/json"
            };
            if (userToken) {
                headers["Authorization"] = `Bearer ${userToken}`;
            }

            const res = await fetch("/api/room/cleanings", {
                method: "POST", 
                headers,
                body: JSON.stringify(payload)
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                setError(data.error || "Có lỗi xảy ra khi lưu.");
            } else {
                onSuccess(data as RoomCleaning);
                onClose();
            }
        } catch (err: any) {
            setError("Lỗi kết nối. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">{editingCleaning ? "Sửa lịch dọn phòng vệ sinh" : "Thêm lịch dọn phòng vệ sinh"}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                        <i className="fas fa-times text-lg"></i>
                    </button>
                </div>
                
                <div className="p-6">
                    <form id="cleaning-form" onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 mb-4 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-sm flex items-start gap-2">
                                 <i className="fas fa-exclamation-circle mt-0.5"></i>
                                 <span>{error}</span>
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ngày dọn phòng</label>
                            <input
                                type="date"
                                value={dateStr}
                                onChange={e => setDateStr(e.target.value)}
                                min={!editingCleaning ? format(new Date(), "yyyy-MM-dd") : undefined}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-slate-800 dark:text-white outline-none transition-all"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Tên người dọn <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={cleanerName}
                                onChange={e => setCleanerName(e.target.value)}
                                placeholder="Nhập tên người dọn dẹp..."
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-slate-800 dark:text-white outline-none transition-all"
                                required
                            />
                        </div>
                    </form>
                </div>
                
                <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        form="cleaning-form"
                        disabled={loading}
                        className="flex-1 py-2.5 px-4 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex justify-center items-center shadow-lg shadow-emerald-500/20"
                    >
                        {loading ? <i className="fas fa-spinner fa-spin"></i> : "Lưu Lịch"}
                    </button>
                </div>
            </div>
        </div>
    );
}
