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

        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
             return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const token = authHeader.split("Bearer ")[1];
        await initAdmin();
        
        try {
            await admin.auth().verifyIdToken(token);
        } catch (e) {
             return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }
        
        const db = admin.firestore();
        
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

