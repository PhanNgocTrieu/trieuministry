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

                {/* Booking Notes */}
                <div className="mb-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-amber-800 dark:text-amber-500 mb-3 flex items-center gap-2">
                        <i className="fas fa-exclamation-triangle"></i>
                        Lưu ý quan trọng khi đặt phòng
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-amber-700 dark:text-amber-400/90 ml-2">
                        <li>Khi mới đặt lịch họp, bạn chỉ có quyền tự <strong>xóa/chỉnh sửa trong vòng 2 phút đầu tiên</strong>. Sau 2 phút, thông tin sẽ được khóa lại.</li>
                        <li>Để thay đổi thông tin sau thời gian này, vui lòng liên hệ trực tiếp với người chịu trách nhiệm quản lý.</li>
                    </ul>
                </div>

                {/* Contact Info Footer (Moved to top) */}
                <div className="mb-8 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        Thông tin hỗ trợ
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
                        Nếu bạn có nhu cầu thay đổi, hủy lịch hoặc cần hỗ trợ khác, vui lòng liên hệ Admin qua các kênh sau:
                    </p>
                    
                    <div className="flex flex-col md:flex-row gap-6 justify-center w-full max-w-5xl">
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
                                <div className="font-semibold text-slate-800 dark:text-white text-sm whitespace-nowrap">phantrieu580@gmail.com</div>
                            </div>
                        </div>
                    </div>
                </div>

                <CalendarView isAdmin={isAdmin} />

            </div>
        </div>
    );
}
