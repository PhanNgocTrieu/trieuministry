import { NextRequest, NextResponse } from "next/server";
import { initAdmin } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { RoomBooking, RoomBookingPayload } from "@/types/room";

export async function GET() {
    try {
        await initAdmin();
        const db = admin.firestore();
        
        const snapshot = await db.collection("room_bookings").orderBy("startTime").get();
        const bookings: RoomBooking[] = [];
        
        // Setup 1 month ago cutoff
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const cutoffISO = oneMonthAgo.toISOString();
        
        const batch = db.batch();
        let deleteCount = 0;
        
        snapshot.forEach(doc => {
            const data = doc.data() as RoomBooking;
            if (data.endTime < cutoffISO) {
                 if (deleteCount < 500) { // Firestore batch limit
                     batch.delete(doc.ref);
                     deleteCount++;
                 }
            } else {
                 bookings.push({ ...data, id: doc.id });
            }
        });
        
        // Execute delete asynchronously so we don't slow down the response
        if (deleteCount > 0) {
            batch.commit().catch(e => console.error("Error auto-deleting old bookings:", e));
        }
        
        return NextResponse.json(bookings);
    } catch (error: any) {
         console.error("Error fetching bookings:", error);
         return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const payload: RoomBookingPayload = await req.json();
        const { name, startTime, endTime, recurringMode = "none", recurringEndDate } = payload;
        
        if (!name || !startTime || !endTime) {
            return NextResponse.json({ error: "Thiếu thông tin đăng ký." }, { status: 400 });
        }
        
        const startBase = new Date(startTime).getTime();
        const endBase = new Date(endTime).getTime();
        const duration = endBase - startBase;
        
        if (duration <= 0) {
             return NextResponse.json({ error: "Thời gian bắt đầu phải trước thời gian kết thúc." }, { status: 400 });
        }
        
        // Prepare occurrences
        const occurrences: { start: number, end: number }[] = [];
        
        if (recurringMode === "none") {
            occurrences.push({ start: startBase, end: endBase });
        } else {
            if (!recurringEndDate) {
                return NextResponse.json({ error: "Vui lòng chọn ngày kết thúc cho chế độ lặp lại." }, { status: 400 });
            }
            const endRepeatTime = new Date(recurringEndDate).getTime();
            if (isNaN(endRepeatTime) || endRepeatTime < startBase) {
                 return NextResponse.json({ error: "Ngày kết thúc lặp lại không hợp lệ." }, { status: 400 });
            }
            
            // Generate occurrences
            let currentStart = startBase;
            // safeguard max 500 occurrences to prevent abuse
            let count = 0; 
            while (currentStart <= endRepeatTime && count < 500) {
                occurrences.push({ start: currentStart, end: currentStart + duration });
                
                // Add interval
                const dateObj = new Date(currentStart);
                if (recurringMode === "weekly") {
                    dateObj.setDate(dateObj.getDate() + 7);
                } else if (recurringMode === "monthly") {
                    dateObj.setMonth(dateObj.getMonth() + 1);
                }
                currentStart = dateObj.getTime();
                count++;
            }
            
            if (occurrences.length === 0) {
                 return NextResponse.json({ error: "Không khởi tạo được lịch lặp nào." }, { status: 400 });
            }
        }
        
        await initAdmin();
        const db = admin.firestore();
        
        // To accurately validate multiple occurrences without pulling whole DB into memory if possible:
        // However, if the db isn't large, the safest is pulling all current future bookings and checking in memory.
        // We'll query only bookings from the first occurrence onwards
        const firstStart = new Date(occurrences[0].start).toISOString();
        const snapshot = await db.collection("room_bookings")
             .where("endTime", ">", firstStart)
             .get();
             
        const existingBookings: { start: number, end: number }[] = [];
        snapshot.forEach(doc => {
             const data = doc.data() as RoomBooking;
             existingBookings.push({
                 start: new Date(data.startTime).getTime(),
                 end: new Date(data.endTime).getTime()
             });
        });
        
        for (const occ of occurrences) {
            for (const exist of existingBookings) {
                 // Check overlap: start1 < end2 && end1 > start2
                 if (occ.start < exist.end && occ.end > exist.start) {
                      return NextResponse.json({ error: `Đã có trùng lặp vào khoảng thời gian ${new Date(occ.start).toLocaleString()}. Vui lòng chọn giờ khác.` }, { status: 400 });
                 }
            }
        }
        
        // Insert all occurrences
        const batch = db.batch();
        const groupId = occurrences.length > 1 ? db.collection("room_bookings").doc().id : undefined; // generate a pseudo ID for group
        const createdRecords: RoomBooking[] = [];
        const nowIso = new Date().toISOString();
        
        for (const occ of occurrences) {
            const docRef = db.collection("room_bookings").doc();
            const recordData: any = {
                name,
                startTime: new Date(occ.start).toISOString(),
                endTime: new Date(occ.end).toISOString(),
                createdAt: nowIso,
                recurringMode,
            };
            if (groupId) {
                recordData.groupId = groupId;
                recordData.recurringEndDate = recurringEndDate;
            }
            
            batch.set(docRef, recordData);
            createdRecords.push({ id: docRef.id, ...recordData });
        }
        
        await batch.commit();
        
        return NextResponse.json(createdRecords); // return array of created bookings
    } catch (error: any) {
         console.error("Error creating booking:", error);
         return NextResponse.json({ error: "Lỗi hệ thống khi đăng ký phòng." }, { status: 500 });
    }
}

