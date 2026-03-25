import { NextRequest, NextResponse } from "next/server";
import { initAdmin } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { RoomCleaning, RoomCleaningPayload } from "@/types/room";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        await initAdmin();
        const db = admin.firestore();
        
        // Fetch cleanings from 1 month ago onwards
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const cutoffISO = oneMonthAgo.toISOString().split('T')[0];
        
        const snapshot = await db.collection("room_cleanings")
            .where("date", ">=", cutoffISO)
            .get();
        
        const cleanings: RoomCleaning[] = [];
        snapshot.forEach(doc => {
            cleanings.push({ id: doc.id, ...doc.data() } as RoomCleaning);
        });
        
        return NextResponse.json(cleanings, {
            headers: {
                "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
            }
        });
    } catch (error: any) {
        console.error("Error fetching room cleanings:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const payload: RoomCleaningPayload = await req.json();
        const { date, cleanerName } = payload;
        
        if (!date || !cleanerName) {
            return NextResponse.json({ error: "Thiếu thông tin phân công dọn phòng." }, { status: 400 });
        }
        
        const authHeader = req.headers.get("Authorization");
        let isAdminOk = false;
        
        if (authHeader?.startsWith("Bearer ")) {
             const token = authHeader.split("Bearer ")[1];
             try {
                 await admin.auth().verifyIdToken(token);
                 isAdminOk = true; 
             } catch (e) {
                 // ignore
             }
        }

        if (!isAdminOk) {
             return NextResponse.json({ error: "Unauthorized. Bạn phải là Admin." }, { status: 401 });
        }
        
        await initAdmin();
        const db = admin.firestore();
        
        const snapshot = await db.collection("room_cleanings")
            .where("date", "==", date)
            .limit(1)
            .get();
            
        let docRef;
        const nowIso = new Date().toISOString();
        let isUpdate = false;
        
        if (!snapshot.empty) {
            docRef = snapshot.docs[0].ref;
            isUpdate = true;
        } else {
            docRef = db.collection("room_cleanings").doc();
        }
        
        const recordData = {
            date,
            cleanerName,
            createdAt: isUpdate ? snapshot.docs[0].data().createdAt : nowIso,
            updatedAt: nowIso
        };
        
        await docRef.set(recordData, { merge: true });
        
        return NextResponse.json({ id: docRef.id, ...recordData });
    } catch (error: any) {
        console.error("Error creating/updating room cleaning:", error);
        return NextResponse.json({ error: error.message || "Lỗi hệ thống khi phân công dọn phòng." }, { status: 500 });
    }
}
