"use client";

import React from "react";
import CalendarView from "@/components/room/CalendarView";
import { useAuth } from "@/context/AuthContext";

export default function RoomBookingPage() {
    const { user } = useAuth();
    
    // Anyone logged in via AuthContext is considered an admin capable of deleting.
    const isAdmin = !!user;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-12 px-4">
            <div className="container container-custom max-w-7xl mx-auto">
                
                <div className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
                        Đặt Phòng Họp
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">
                        Vui lòng kiểm tra lịch trống và đăng ký khung giờ sử dụng phòng.
                    </p>
                </div>

                <CalendarView isAdmin={isAdmin} />
                
                {/* Contact Info Footer */}
                <div className="mt-16 bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-2xl flex items-center justify-center text-2xl mb-6">
                        <i className="fas fa-headset"></i>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        Thông tin hỗ trợ
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
                        Nếu bạn có nhu cầu thay đổi, hủy lịch hoặc cần hỗ trợ khác, vui lòng liên hệ Admin qua các kênh sau:
                    </p>
                    
                    <div className="flex flex-col md:flex-row gap-6 justify-center w-full max-w-3xl">
                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex-1 border border-slate-100 dark:border-slate-800">
                            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700">
                                <i className="fas fa-user text-sm"></i>
                            </div>
                            <div className="text-left py-1 overflow-hidden">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Người liên hệ</div>
                                <div className="font-semibold text-slate-800 dark:text-white text-sm whitespace-nowrap">Phan Ngọc Triều</div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex-1 border border-slate-100 dark:border-slate-800">
                            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700">
                                <i className="fas fa-phone-alt text-sm"></i>
                            </div>
                            <div className="text-left py-1 overflow-hidden">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Số điện thoại</div>
                                <div className="font-semibold text-slate-800 dark:text-white text-sm whitespace-nowrap">0974 210 249</div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex-1 border border-slate-100 dark:border-slate-800">
                            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700">
                                <i className="fas fa-envelope text-sm"></i>
                            </div>
                            <div className="text-left py-1 overflow-hidden">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</div>
                                <div className="font-semibold text-slate-800 dark:text-white text-sm whitespace-nowrap truncate max-w-[130px]">phantrieu580@gmail.com</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
