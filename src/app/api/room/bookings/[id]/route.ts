import { NextRequest, NextResponse } from "next/server";
import { initAdmin } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!id) {
             return NextResponse.json({ error: "Missing booking ID" }, { status: 400 });
        }
        
        const url = new URL(req.url);
        const type = url.searchParams.get("type");
        const groupId = url.searchParams.get("groupId");
        const startTimeStr = url.searchParams.get("startTime");

        await initAdmin();
        const db = admin.firestore();

        // Check if booking exists to enforce 2-minute rule
        const bookingDoc = await db.collection("room_bookings").doc(id).get();
        if (!bookingDoc.exists) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }
        
        const bookingData = bookingDoc.data()!;
        const createdAtTime = new Date(bookingData.createdAt || 0).getTime();
        const diffMinutes = (Date.now() - createdAtTime) / 1000 / 60;
        const isWithin2Mins = diffMinutes <= 2;

        const authHeader = req.headers.get("Authorization");
        let isAdminOk = false;
        
        if (authHeader?.startsWith("Bearer ")) {
             const token = authHeader.split("Bearer ")[1];
             try {
                 await admin.auth().verifyIdToken(token);
                 isAdminOk = true; // Token verified
             } catch (e) {
                 // ignore, isAdminOk remains false
             }
        }

        if (!isAdminOk && !isWithin2Mins) {
             return NextResponse.json({ error: "Unauthorized. Bạn chỉ có thể xoá lịch trong vòng 2 phút đầu." }, { status: 401 });
        }
        
        
        if (type === "group" && groupId) {
             // Delete all bookings with this groupId
             const snapshot = await db.collection("room_bookings").where("groupId", "==", groupId).get();
             if (snapshot.size === 0) {
                 return NextResponse.json({ error: "No bookings found for this group" }, { status: 404 });
             }
             
             const batch = db.batch();
             snapshot.forEach(doc => {
                 batch.delete(doc.ref);
             });
             await batch.commit();
        } else if (type === "future" && groupId && startTimeStr) {
             // Delete future (and current) bookings with this groupId
             const targetTime = new Date(startTimeStr).getTime();
             if (isNaN(targetTime)) {
                 return NextResponse.json({ error: "Invalid startTime" }, { status: 400 });
             }
             
             const snapshot = await db.collection("room_bookings").where("groupId", "==", groupId).get();
             if (snapshot.size === 0) {
                 return NextResponse.json({ error: "No bookings found for this group" }, { status: 404 });
             }
             
             const batch = db.batch();
             let deletedCount = 0;
             snapshot.forEach(doc => {
                 const data = doc.data();
                 const bTime = new Date(data.startTime).getTime();
                 if (bTime >= targetTime) {
                     batch.delete(doc.ref);
                     deletedCount++;
                 }
             });
             
             if (deletedCount > 0) {
                 await batch.commit();
             }
        } else {
             // Delete single booking
             await db.collection("room_bookings").doc(id).delete();
        }
        
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting booking:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: "Missing booking ID" }, { status: 400 });
        }

        await initAdmin();
        const db = admin.firestore();

        const bookingDoc = await db.collection("room_bookings").doc(id).get();
        if (!bookingDoc.exists) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        const bookingData = bookingDoc.data()!;
        const createdAtTime = new Date(bookingData.createdAt || 0).getTime();
        const diffMinutes = (Date.now() - createdAtTime) / 1000 / 60;
        const isWithin2Mins = diffMinutes <= 2;

        const authHeader = req.headers.get("Authorization");
        let isAdminOk = false;
        
        if (authHeader?.startsWith("Bearer ")) {
             const token = authHeader.split("Bearer ")[1];
             try {
                 await admin.auth().verifyIdToken(token);
                 isAdminOk = true;
             } catch (e) {}
        }

        if (!isAdminOk && !isWithin2Mins) {
             return NextResponse.json({ error: "Unauthorized. Bạn chỉ có thể chỉnh sửa lịch trong vòng 2 phút đầu." }, { status: 401 });
        }

        const payload = await req.json();
        const { name, startTime, endTime, personInCharge, phone, color, editFuture } = payload;

        if (!name || !startTime || !endTime) {
            return NextResponse.json({ error: "Thiếu thông tin đăng ký." }, { status: 400 });
        }

        const startBase = new Date(startTime).getTime();
        const endBase = new Date(endTime).getTime();
        
        if (startBase >= endBase) {
             return NextResponse.json({ error: "Thời gian bắt đầu phải trước thời gian kết thúc." }, { status: 400 });
        }

        const isBulkEdit = editFuture === true && !!bookingData.groupId;
        let updatedBookings: any[] = [];
        
        if (isBulkEdit) {
            // Find all future occurrences in the series
            const currentBookingStartTime = new Date(bookingData.startTime).getTime();
            const seriesSnapshot = await db.collection("room_bookings")
                .where("groupId", "==", bookingData.groupId)
                .get();
                
            const futureDocs = seriesSnapshot.docs.filter((doc) => {
                const docStart = new Date(doc.data().startTime).getTime();
                return docStart >= currentBookingStartTime;
            });
            
            // Calculate time shift delta relative to the original booking
            const startTimeDeltaMs = startBase - currentBookingStartTime;
            const originalDurationMs = new Date(bookingData.endTime).getTime() - currentBookingStartTime;
            const newDurationMs = endBase - startBase;

            // Prepare all the specific time blocks we'll be trying to book
            const newTimeBlocks = futureDocs.map((doc) => {
                 const docData = doc.data() as any;
                 const originalDocStart = new Date(docData.startTime).getTime();
                 const newDocStart = originalDocStart + startTimeDeltaMs;
                 const newDocEnd = newDocStart + newDurationMs;
                 return { id: doc.id, newStart: newDocStart, newEnd: newDocEnd, ...docData };
            });

            // Minimum timestamp of any overlapping potential
            const earliestStart = Math.min(...newTimeBlocks.map(b => b.newStart));
            const overlapSnapshot = await db.collection("room_bookings")
                 .where("endTime", ">", new Date(earliestStart).toISOString())
                 .get();
            
            // Check for overlap against ANY doc that isn't part of the ones we're updating
            const docsToUpdateIds = new Set(newTimeBlocks.map(b => b.id));
            
            for (const doc of overlapSnapshot.docs) {
                 if (docsToUpdateIds.has(doc.id)) continue; // skip the ones we're moving
                 
                 const data = doc.data();
                 const existStart = new Date(data.startTime).getTime();
                 const existEnd = new Date(data.endTime).getTime();
                 
                 for (const block of newTimeBlocks) {
                     if (block.newStart < existEnd && block.newEnd > existStart) {
                         return NextResponse.json({ error: `Đã có trùng lặp vào khoảng thời gian của một hoặc nhiều sự kiện lặp lại (ví dụ vào lúc ${new Date(block.newStart).toLocaleString('vi-VN')}). Vui lòng chọn giờ khác.` }, { status: 400 });
                     }
                 }
            }

            // Execute batch update
            const batch = db.batch();
            for (const block of newTimeBlocks) {
                const docRef = db.collection("room_bookings").doc(block.id);
                const updateData = {
                    name: name.trim(),
                    startTime: new Date(block.newStart).toISOString(),
                    endTime: new Date(block.newEnd).toISOString(),
                    personInCharge,
                    phone,
                    color
                };
                batch.update(docRef, updateData);
                updatedBookings.push({ id: block.id, ...updateData, groupId: bookingData.groupId, recurringMode: block.recurringMode, recurringEndDate: block.recurringEndDate });
            }
            await batch.commit();
            
        } else {
            // Check for single overlap, excluding the current booking itself
            const snapshot = await db.collection("room_bookings")
                 .where("endTime", ">", startTime)
                 .get();
                 
            for (const doc of snapshot.docs) {
                 if (doc.id === id) continue; // skip self
                 const data = doc.data();
                 const existStart = new Date(data.startTime).getTime();
                 const existEnd = new Date(data.endTime).getTime();
                 if (startBase < existEnd && endBase > existStart) {
                     return NextResponse.json({ error: `Đã có trùng lặp vào khoảng thời gian này. Vui lòng chọn giờ khác.` }, { status: 400 });
                 }
            }
    
            await db.collection("room_bookings").doc(id).update({
                 name: name.trim(),
                 startTime,
                 endTime,
                 personInCharge,
                 phone,
                 color
            });
            updatedBookings.push({ id, name: name.trim(), startTime, endTime, personInCharge, phone, color, groupId: bookingData.groupId, recurringMode: bookingData.recurringMode, recurringEndDate: bookingData.recurringEndDate });
        }

        return NextResponse.json({ success: true, updated: updatedBookings });

    } catch (error: any) {
        console.error("Error updating booking:", error);
        return NextResponse.json({ error: "Lỗi hệ thống khi chỉnh sửa phòng." }, { status: 500 });
    }
}

