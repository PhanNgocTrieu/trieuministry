import { NextRequest, NextResponse } from "next/server";
import { initAdmin } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";

export const dynamic = "force-dynamic";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!id) {
             return NextResponse.json({ error: "Missing cleaning ID" }, { status: 400 });
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
             return NextResponse.json({ error: "Unauthorized. Bạn phải là Admin để xoá lịch dọn phòng vệ sinh." }, { status: 401 });
        }

        await initAdmin();
        const db = admin.firestore();
        
        await db.collection("room_cleanings").doc(id).delete();
        
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting room cleaning:", error);
        return NextResponse.json({ error: error.message || "Không thể xoá lịch dọn phòng vệ sinh." }, { status: 500 });
    }
}
