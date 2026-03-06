"use client";

import React, { useState, useEffect } from "react";
import { format, parse, addMonths } from "date-fns";
import { RoomBookingPayload, RoomBooking, RecurringMode } from "@/types/room";

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (bookings: RoomBooking[]) => void;
    initialDate?: Date;
    initialTimeStr?: string; // format "HH:mm"
}

export default function BookingModal({
    isOpen,
    onClose,
    onSuccess,
    initialDate,
    initialTimeStr
}: BookingModalProps) {
    const [name, setName] = useState("");
    const [dateStr, setDateStr] = useState("");
    const [startTimeStr, setStartTimeStr] = useState("");
    const [endTimeStr, setEndTimeStr] = useState("");
    const [recurringMode, setRecurringMode] = useState<RecurringMode>("none");
    const [recurringEndDateStr, setRecurringEndDateStr] = useState("");
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setName("");
            setError("");
            setRecurringMode("none");
            
            const baseDate = initialDate || new Date();
            setDateStr(format(baseDate, "yyyy-MM-dd"));
            // Default recurring end date to 1 month from now
            setRecurringEndDateStr(format(addMonths(baseDate, 1), "yyyy-MM-dd"));
            
            if (initialTimeStr) {
                setStartTimeStr(initialTimeStr);
                // default end time to 30 mins later
                const parsedStart = parse(initialTimeStr, "HH:mm", new Date());
                const endInitial = new Date(parsedStart.getTime() + 30 * 60000);
                setEndTimeStr(format(endInitial, "HH:mm"));
            } else {
                setStartTimeStr("08:00");
                setEndTimeStr("08:30");
            }
        }
    }, [isOpen, initialDate, initialTimeStr]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        
        if (!name.trim()) {
            setError("Vui lòng nhập tên người đăng ký.");
            return;
        }
        
        try {
            const startDateTimeStr = `${dateStr}T${startTimeStr}:00`;
            const endDateTimeStr = `${dateStr}T${endTimeStr}:00`;
            
            const startDateTime = new Date(startDateTimeStr);
            const endDateTime = new Date(endDateTimeStr);
            
            if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
                setError("Định dạng ngày giờ không hợp lệ.");
                return;
            }
            
            if (startDateTime >= endDateTime) {
                setError("Giờ kết thúc phải sau giờ bắt đầu.");
                return;
            }
            
            let finalRecurringEnd: string | undefined = undefined;
            if (recurringMode !== "none") {
                 const endDateObj = new Date(`${recurringEndDateStr}T23:59:59`);
                 if (isNaN(endDateObj.getTime()) || endDateObj < startDateTime) {
                      setError("Ngày kết thúc lặp lại phải hợp lệ và nằm sau ngày bắt đầu.");
                      return;
                 }
                 finalRecurringEnd = endDateObj.toISOString();
            }
            
            setLoading(true);
            
            const payload: RoomBookingPayload = {
                name: name.trim(),
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                recurringMode,
                recurringEndDate: finalRecurringEnd
            };
            
            const res = await fetch("/api/room/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                setError(data.error || "Có lỗi xảy ra khi đăng ký.");
            } else {
                // If the response is an array, it's successful occurrences
                onSuccess(data as RoomBooking[]);
                onClose();
            }
        } catch (err: any) {
            setError("Lỗi kết nối. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };
    
    // Generate time options (07:00 to 22:00 in 30min increments)
    const timeOptions = [];
    for (let i = 7; i <= 22; i++) {
        const hourStr = i.toString().padStart(2, '0');
        timeOptions.push(`${hourStr}:00`);
        if (i !== 22) { // don't push 22:30
             timeOptions.push(`${hourStr}:30`);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Đăng ký phòng</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                        <i className="fas fa-times text-lg"></i>
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <form id="booking-form" onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 mb-4 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-sm flex items-start gap-2">
                                 <i className="fas fa-exclamation-circle mt-0.5"></i>
                                 <span>{error}</span>
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Tên người đăng ký <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Nhập tên..."
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-800 dark:text-white outline-none transition-all"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ngày đăng ký</label>
                            <input
                                type="date"
                                value={dateStr}
                                onChange={e => setDateStr(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-800 dark:text-white outline-none transition-all"
                                required
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Từ giờ</label>
                                <select
                                    value={startTimeStr}
                                    onChange={e => setStartTimeStr(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-800 dark:text-white outline-none transition-all"
                                >
                                    {timeOptions.map(t => <option key={`start-${t}`} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Đến giờ</label>
                                <select
                                    value={endTimeStr}
                                    onChange={e => setEndTimeStr(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-800 dark:text-white outline-none transition-all"
                                >
                                    {timeOptions.map(t => <option key={`end-${t}`} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-4">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Chu kỳ lặp lại</label>
                            <select
                                value={recurringMode}
                                onChange={e => setRecurringMode(e.target.value as RecurringMode)}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-800 dark:text-white outline-none transition-all mb-3"
                            >
                                <option value="none">Không lặp lại (1 lần)</option>
                                <option value="weekly">Hàng Tuần (Mỗi {dateStr ? format(parse(dateStr, 'yyyy-MM-dd', new Date()), 'EEEE') : 'tuần'})</option>
                                <option value="monthly">Hàng Tháng</option>
                            </select>

                            {recurringMode !== "none" && (
                                <div className="p-4 bg-violet-50 dark:bg-violet-900/10 rounded-xl border border-violet-100 dark:border-violet-900/30">
                                    <label className="block text-sm font-medium text-violet-800 dark:text-violet-300 mb-1">
                                        Kết thúc lặp lại vào ngày
                                    </label>
                                    <input
                                        type="date"
                                        value={recurringEndDateStr}
                                        onChange={e => setRecurringEndDateStr(e.target.value)}
                                        min={dateStr}
                                        className="w-full px-4 py-2 border border-violet-200 dark:border-violet-800 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-800/80 dark:text-white outline-none transition-all text-sm"
                                        required
                                    />
                                    <p className="mt-2 text-xs text-violet-600/70 dark:text-violet-400/70">
                                        Hệ thống sẽ tự động đăng ký các ngày tương tự cho đến ngày này. Tối đa 500 buổi.
                                    </p>
                                </div>
                            )}
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
                        form="booking-form"
                        disabled={loading}
                        className="flex-1 py-2.5 px-4 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex justify-center items-center shadow-lg shadow-violet-500/20"
                    >
                        {loading ? <i className="fas fa-spinner fa-spin"></i> : "Xác nhận Lịch"}
                    </button>
                </div>
            </div>
        </div>
    );
}

