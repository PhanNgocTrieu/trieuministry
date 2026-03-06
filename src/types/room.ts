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
}

export interface RoomBookingPayload {
  name: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  recurringMode: RecurringMode;
  recurringEndDate?: string; // ISO String (required if recurringMode is not 'none')
}

