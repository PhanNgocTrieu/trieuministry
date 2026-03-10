"use client";

import React, { useState, useEffect } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { RoomBooking } from "@/types/room";
import BookingModal from "./BookingModal";
import { useAuth } from "@/context/AuthContext";

interface CalendarViewProps {
    isAdmin: boolean;
}

export default function CalendarView({ isAdmin }: CalendarViewProps) {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [bookings, setBookings] = useState<RoomBooking[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedTimeStr, setSelectedTimeStr] = useState<string>("08:00");
    const [bookingToEdit, setBookingToEdit] = useState<RoomBooking | null>(null);
    
    // Delete Modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [bookingToDelete, setBookingToDelete] = useState<RoomBooking | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Current time for 2-minute rule
    const [nowTime, setNowTime] = useState(Date.now());
    useEffect(() => {
        const interval = setInterval(() => setNowTime(Date.now()), 10000);
        return () => clearInterval(interval);
    }, []);

    const isWithin2Mins = (booking: RoomBooking) => {
        if (!booking.createdAt) return false;
        const diffValid = (nowTime - new Date(booking.createdAt).getTime()) / 60000;
        return diffValid <= 2;
    };

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/room/bookings", { cache: "no-store" });
            const data = await res.json();
            if (Array.isArray(data)) {
                setBookings(data);
            }
        } catch (error) {
            console.error("Error fetching bookings:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday as first day

    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
    
    // Time slots from 07:00 to 22:00
    const timeSlots = [];
    for (let i = 7; i <= 21; i++) {
        timeSlots.push(`${i.toString().padStart(2, '0')}:00`);
        timeSlots.push(`${i.toString().padStart(2, '0')}:30`);
    }

    const handlePrevWeek = () => setCurrentDate(addDays(currentDate, -7));
    const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));
    const handleToday = () => setCurrentDate(new Date());

    const handleSlotClick = (dayStr: Date, timeStr: string) => {
        setBookingToEdit(null);
        setSelectedDate(dayStr);
        setSelectedTimeStr(timeStr);
        setIsModalOpen(true);
    };

    const handleEditBookingClick = (booking: RoomBooking) => {
        setBookingToEdit(booking);
        setIsModalOpen(true);
    };

    const handleBookingSuccess = (updatedBookings: RoomBooking[]) => {
        if (bookingToEdit && updatedBookings.length === 1) {
             const updated = updatedBookings[0];
             setBookings(bookings.map(b => b.id === updated.id ? { ...b, ...updated } : b));
        } else {
             setBookings([...bookings, ...updatedBookings]);
        }
    };

    const handleDeleteBookingClick = async (booking: RoomBooking) => {
        if (!booking.groupId) {
             if (confirm(`Bạn có chắc chắn muốn xoá lịch đặt phòng của ${booking.name}?`)) {
                 // Direct delete for non-recurring
                 setBookingToDelete(booking);
                 // We need to wait for state to set, but it's simpler to just call a modified executeDelete
                 executeDirectDelete(booking, "single");
             }
             return;
        }
        setBookingToDelete(booking);
        setIsDeleteModalOpen(true);
    };

    const executeDirectDelete = async (booking: RoomBooking, deleteType: "single" | "future") => {
        setIsDeleting(true);
        try {
            let userToken = "";
            if (user) {
                userToken = await user.getIdToken();
            }
            
            let queryParam = "";
            if (booking.groupId && deleteType === "future") {
                queryParam = `?type=future&groupId=${booking.groupId}&startTime=${encodeURIComponent(booking.startTime)}`;
            }
            
            const res = await fetch(`/api/room/bookings/${booking.id}${queryParam}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${userToken}`
                }
            });
            const data = await res.json();
            if (res.ok) {
                if (deleteType === "future" && booking.groupId) {
                    const targetStartTime = new Date(booking.startTime).getTime();
                    setBookings(bookings.filter(b => {
                        if (b.groupId !== booking.groupId) return true;
                        const bStartTime = new Date(b.startTime).getTime();
                        return bStartTime < targetStartTime;
                    }));
                } else {
                     setBookings(bookings.filter(b => b.id !== booking.id));
                }
            } else {
                alert(data.error || "Không thể xoá lịch.");
            }
        } catch (err) {
            alert("Lỗi kết nối khi xoá lịch.");
        } finally {
            setIsDeleting(false);
        }
    };

    const executeDelete = async (deleteType: "single" | "future") => {
        if (!bookingToDelete) return;
        await executeDirectDelete(bookingToDelete, deleteType);
        setIsDeleteModalOpen(false);
        setBookingToDelete(null);
    };



    // Helper to check if a slot is booked
    const getBookingForSlot = (day: Date, timeStr: string) => {
        const slotStart = new Date(`${format(day, "yyyy-MM-dd")}T${timeStr}:00`).getTime();
        const slotEnd = slotStart + 30 * 60000; // 30 mins

        return bookings.find(b => {
             const bStart = new Date(b.startTime).getTime();
             const bEnd = new Date(b.endTime).getTime();
             return slotStart >= bStart && slotStart < bEnd; 
        });
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Calendar Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                 <div className="flex items-center gap-4">
                     <button onClick={handlePrevWeek} className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                         <i className="fas fa-chevron-left text-slate-600 dark:text-slate-400"></i>
                     </button>
                     <div className="text-lg font-bold text-slate-800 dark:text-white min-w-[150px] text-center">
                         Tháng {format(currentDate, "MM/yyyy")}
                     </div>
                     <button onClick={handleNextWeek} className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                         <i className="fas fa-chevron-right text-slate-600 dark:text-slate-400"></i>
                     </button>
                 </div>
                 
                 <div className="flex gap-3">
                     <button onClick={handleToday} className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                         Hôm nay
                     </button>
                     <button onClick={() => { setBookingToEdit(null); setSelectedDate(new Date()); setIsModalOpen(true); }} className="px-4 py-2 rounded-xl text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-500/20 transition-all">
                         <i className="fas fa-plus mr-2"></i> Đăng ký
                     </button>
                 </div>
            </div>

            {/* Calendar Grid */}
            <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                    {/* Days Header */}
                    <div className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="p-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider border-r border-slate-200 dark:border-slate-800">
                            Giờ
                        </div>
                        {weekDays.map((day, idx) => {
                            const isToday = isSameDay(day, new Date());
                            return (
                                <div key={idx} className={`p-4 text-center border-r border-slate-200 dark:border-slate-800 ${isToday ? 'bg-violet-50 dark:bg-violet-900/20' : ''}`}>
                                    <div className={`text-xs font-bold uppercase mb-1 ${isToday ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500'}`}>
                                        {format(day, "EEEE")}
                                    </div>
                                    <div className={`text-xl font-black ${isToday ? 'text-violet-600 dark:text-violet-400' : 'text-slate-800 dark:text-white'}`}>
                                        {format(day, "dd")}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Time Slots */}
                    <div className="relative">
                        {loading && (
                            <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
                                <i className="fas fa-spinner fa-spin text-3xl text-violet-600"></i>
                            </div>
                        )}
                        
                        {timeSlots.map((time, timeIdx) => (
                            <div key={timeIdx} className="grid grid-cols-8 border-b border-slate-100 dark:border-slate-800/50">
                                <div className="p-3 text-center text-xs font-medium text-slate-500 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                    {time}
                                </div>
                                {weekDays.map((day, dayIdx) => {
                                    const booking = getBookingForSlot(day, time);
                                    
                                    // Check if this slot is the START of a booking to render the content, 
                                    // otherwise just render it colored
                                    const isStartOfBooking = booking && new Date(booking.startTime).getTime() === new Date(`${format(day, "yyyy-MM-dd")}T${time}:00`).getTime();
                                    
                                    return (
                                        <div 
                                            key={`${dayIdx}-${timeIdx}`} 
                                            className={`relative border-r border-slate-100 dark:border-slate-800/50 min-h-[48px] group transition-colors ${booking ? 'bg-rose-100 dark:bg-rose-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer'}`}
                                            onClick={() => !booking && handleSlotClick(day, time)}
                                        >
                                            {isStartOfBooking && booking && (
                                                <div className="absolute inset-x-1 top-1 z-10 p-1.5 px-2 bg-rose-500 text-white rounded-md shadow-md text-xs font-medium leading-tight override-height cursor-default group hover:z-20" style={{ minHeight: '38px' }}>
                                                    <div className="font-bold truncate pr-3" title={booking.name}>
                                                        {booking.recurringMode && booking.recurringMode !== "none" && (
                                                             <i className="fas fa-sync-alt mr-1 text-[10px] opacity-70"></i>
                                                        )}
                                                        {booking.name}
                                                    </div>
                                                    
                                                    {(isAdmin || isWithin2Mins(booking)) && (
                                                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-1 transition-all">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleEditBookingClick(booking); }}
                                                                className="w-5 h-5 bg-white/20 hover:bg-white text-white hover:text-blue-500 rounded-sm flex items-center justify-center transition-all bg-white/20 shadow-sm"
                                                                title="Chỉnh sửa (Chỉ có thể sửa trong 2 phút đầu)"
                                                            >
                                                                <i className="fas fa-edit text-[9px]"></i>
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteBookingClick(booking); }}
                                                                className="w-5 h-5 bg-white/20 hover:bg-white text-white hover:text-red-500 rounded-sm flex items-center justify-center transition-all bg-red-800/20 shadow-sm"
                                                                title="Xoá lịch"
                                                            >
                                                                <i className="fas fa-times text-[9px]"></i>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {!booking && (
                                                <div className="opacity-0 group-hover:opacity-100 absolute inset-0 flex items-center justify-center text-violet-400">
                                                    <i className="fas fa-plus text-xs"></i>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            <BookingModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleBookingSuccess}
                initialDate={selectedDate}
                initialTimeStr={selectedTimeStr}
                editingBooking={bookingToEdit}
            />

            {/* Custom Delete Modal */}
            {isDeleteModalOpen && bookingToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Xoá lịch đặt phòng</h3>
                            <p className="text-sm text-slate-500 mt-2">
                                Bạn đang xoá lịch của <span className="font-semibold text-slate-700 dark:text-slate-300">{bookingToDelete.name}</span> 
                                vào lúc {format(new Date(bookingToDelete.startTime), 'HH:mm dd/MM/yyyy')}.
                            </p>
                        </div>
                        
                        <div className="p-6 flex flex-col gap-3">
                            <button
                                onClick={() => executeDelete("single")}
                                disabled={isDeleting}
                                className="w-full py-2.5 px-4 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-xl font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center justify-center disabled:opacity-50"
                            >
                                {isDeleting ? <i className="fas fa-spinner fa-spin"></i> : "Chỉ sự kiện này"}
                            </button>
                            
                            {bookingToDelete.groupId && (
                                <button
                                    onClick={() => executeDelete("future")}
                                    disabled={isDeleting}
                                    className="w-full py-2.5 px-4 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center disabled:opacity-50 shadow-lg shadow-red-500/20"
                                >
                                    {isDeleting ? <i className="fas fa-spinner fa-spin"></i> : "Sự kiện này và các sự kiện sau"}
                                </button>
                            )}
                            
                            <button
                                onClick={() => {
                                    setIsDeleteModalOpen(false);
                                    setBookingToDelete(null);
                                }}
                                disabled={isDeleting}
                                className="w-full py-2.5 px-4 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors mt-2"
                            >
                                Huỷ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

