"use client";

import React, { useState, useEffect } from "react";
import { format, parse, addMonths } from "date-fns";
import { RoomBookingPayload, RoomBooking, RecurringMode, BookingColorCategories } from "@/types/room";
import { useAuth } from "@/context/AuthContext";

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (bookings: RoomBooking[]) => void;
    initialDate?: Date;
    initialTimeStr?: string; // format "HH:mm"
    editingBooking?: RoomBooking | null;
}

export default function BookingModal({
    isOpen,
    onClose,
    onSuccess,
    initialDate,
    initialTimeStr,
    editingBooking
}: BookingModalProps) {
    const { user } = useAuth();
    
    const [name, setName] = useState("");
    const [dateStr, setDateStr] = useState("");
    const [startTimeStr, setStartTimeStr] = useState("");
    const [endTimeStr, setEndTimeStr] = useState("");
    const [recurringMode, setRecurringMode] = useState<RecurringMode>("none");
    const [recurringEndDateStr, setRecurringEndDateStr] = useState("");
    const [personInCharge, setPersonInCharge] = useState("");
    const [phone, setPhone] = useState("");
    const [color, setColor] = useState(BookingColorCategories[0].value);
    const [editFuture, setEditFuture] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setError("");
            
            if (editingBooking) {
                setName(editingBooking.name);
                const startDate = new Date(editingBooking.startTime);
                const endDate = new Date(editingBooking.endTime);
                setDateStr(format(startDate, "yyyy-MM-dd"));
                setStartTimeStr(format(startDate, "HH:mm"));
                setEndTimeStr(format(endDate, "HH:mm"));
                setRecurringMode(editingBooking.recurringMode || "none");
                setRecurringEndDateStr(editingBooking.recurringEndDate ? format(new Date(editingBooking.recurringEndDate), "yyyy-MM-dd") : format(addMonths(startDate, 1), "yyyy-MM-dd"));
                setPersonInCharge(editingBooking.personInCharge || "");
                setPhone(editingBooking.phone || "");
                setColor(editingBooking.color || "#8b5cf6");
                setEditFuture(false);
            } else {
                setName("");
                setRecurringMode("none");
                setPersonInCharge("");
                setPhone("");
                setColor(BookingColorCategories[0].value);
                setEditFuture(false);
                
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
        }
    }, [isOpen, initialDate, initialTimeStr, editingBooking]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        
        if (!name.trim()) {
            setError("Vui lòng nhập mục đích sử dụng.");
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
                recurringEndDate: finalRecurringEnd,
                personInCharge: personInCharge.trim(),
                phone: phone.trim(),
                color,
                editFuture
            };
            
            const url = editingBooking ? `/api/room/bookings/${editingBooking.id}` : "/api/room/bookings";
            const method = editingBooking ? "PUT" : "POST";

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

            const res = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(payload)
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                setError(data.error || "Có lỗi xảy ra khi đăng ký.");
            } else {
                // Return array of bookings whether create or update
                const successData = editingBooking ? (Array.isArray(data.updated) ? data.updated : [data.updated]) : (data as RoomBooking[]);
                onSuccess(successData);
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
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">{editingBooking ? "Chỉnh sửa phòng" : "Đăng ký phòng"}</h2>
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
                                Mục đích sử dụng <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Nhập mục đích sử dụng..."
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-slate-800 dark:text-white outline-none transition-all"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Người chịu trách nhiệm
                                </label>
                                <input
                                    type="text"
                                    value={personInCharge}
                                    onChange={e => setPersonInCharge(e.target.value)}
                                    placeholder="Nhập tên..."
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-slate-800 dark:text-white outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Số điện thoại
                                </label>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="Nhập SĐT..."
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-slate-800 dark:text-white outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Phân loại lịch</label>
                            <div className="grid grid-cols-2 gap-3">
                                {BookingColorCategories.map((c) => (
                                    <button
                                        key={c.value}
                                        type="button"
                                        onClick={() => setColor(c.value)}
                                        className={`flex items-center gap-2 p-2 rounded-xl border-2 transition-all ${color === c.value ? 'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20 shadow-sm' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                                    >
                                        <div className="w-5 h-5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: c.value }}></div>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 text-left">{c.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ngày đăng ký</label>
                            <input
                                type="date"
                                value={dateStr}
                                onChange={e => setDateStr(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-slate-800 dark:text-white outline-none transition-all"
                                required
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Từ giờ</label>
                                <select
                                    value={startTimeStr}
                                    onChange={e => setStartTimeStr(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-slate-800 dark:text-white outline-none transition-all"
                                >
                                    {timeOptions.map(t => <option key={`start-${t}`} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Đến giờ</label>
                                <select
                                    value={endTimeStr}
                                    onChange={e => setEndTimeStr(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-slate-800 dark:text-white outline-none transition-all"
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
                                disabled={!!editingBooking}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-slate-800 dark:text-white outline-none transition-all mb-3 disabled:opacity-50"
                            >
                                <option value="none">Không lặp lại (1 lần)</option>
                                <option value="weekly">Hàng Tuần (Mỗi {dateStr ? format(parse(dateStr, 'yyyy-MM-dd', new Date()), 'EEEE') : 'tuần'})</option>
                                <option value="monthly">Hàng Tháng</option>
                            </select>

                            {recurringMode !== "none" && (
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                    <label className="block text-sm font-medium text-blue-800 dark:text-blue-400 mb-1">
                                        Kết thúc lặp lại vào ngày
                                    </label>
                                    <input
                                        type="date"
                                        value={recurringEndDateStr}
                                        onChange={e => setRecurringEndDateStr(e.target.value)}
                                        min={dateStr}
                                        className="w-full px-4 py-2 border border-blue-200 dark:border-blue-800 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-slate-800/80 dark:text-white outline-none transition-all text-sm"
                                        required
                                    />
                                    <p className="mt-2 text-xs text-blue-700/70 dark:text-blue-500/70">
                                        Hệ thống sẽ tự động đăng ký các ngày tương tự cho đến ngày này. Tối đa 500 buổi.
                                    </p>
                                </div>
                            )}

                            {editingBooking && editingBooking.groupId && (
                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl flex items-start gap-3">
                                    <div className="flex-shrink-0 pt-0.5">
                                        <input
                                            type="checkbox"
                                            id="editFuture"
                                            checked={editFuture}
                                            onChange={(e) => setEditFuture(e.target.checked)}
                                            className="w-4 h-4 text-blue-600 rounded border-blue-300 focus:ring-blue-500 dark:bg-slate-800 dark:border-blue-700 cursor-pointer"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="editFuture" className="block text-sm font-medium text-blue-800 dark:text-blue-300 cursor-pointer">
                                            Áp dụng cho tất cả các kiện lặp lại sau này
                                        </label>
                                        <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                                            Nếu chọn, mọi thay đổi (tên, giờ, màu...) ở sự kiện này sẽ được sửa đồng loạt cho các sự kiện tiếp theo trong chuỗi.
                                        </p>
                                    </div>
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
                        className="flex-1 py-2.5 px-4 bg-blue-700 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex justify-center items-center shadow-lg shadow-blue-600/20"
                    >
                        {loading ? <i className="fas fa-spinner fa-spin"></i> : "Xác nhận Lịch"}
                    </button>
                </div>
            </div>
        </div>
    );
}

