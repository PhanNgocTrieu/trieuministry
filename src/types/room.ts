export type RecurringMode = "none" | "weekly" | "monthly";

export interface RoomBooking {
  id: string;
  name: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  createdAt: string; // ISO String
  recurringMode?: RecurringMode; // none, weekly, monthly
  recurringEndDate?: string;     // ISO String
  groupId?: string;              // unique ID for a recurring series
  personInCharge?: string;
  phone?: string;
  color?: string;
}

export interface RoomBookingPayload {
  name: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  recurringMode: RecurringMode;
  recurringEndDate?: string; // ISO String (required if recurringMode is not 'none')
  personInCharge?: string;
  phone?: string;
  color?: string;
  editFuture?: boolean;
}

export const BookingColorCategories = [
    { value: '#3b82f6', label: 'Lịch cố định' }, // Xanh dương
    { value: '#10b981', label: 'Lịch linh hoạt' }, // Xanh ngọc
    { value: '#f59e0b', label: 'Sự kiện' }, // Vàng
    { value: '#ef4444', label: 'Lịch mới' } // Đỏ
];

export interface RoomCleaning {
    id: string;
    date: string; // YYYY-MM-DD
    cleanerName: string;
    createdAt: string;
}

export interface RoomCleaningPayload {
    date: string; // YYYY-MM-DD
    cleanerName: string;
}
