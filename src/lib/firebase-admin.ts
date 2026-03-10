import "server-only";

import * as admin from "firebase-admin";

interface FirebaseAdminConfig {
    projectId: string;
    clientEmail: string;
    privateKey: string;
}

function formatPrivateKey(key: string) {
    if (!key) return "";
    return key.replace(/\\n/g, "\n");
}

export function createFirebaseAdminApp(params: FirebaseAdminConfig) {
    const privateKey = formatPrivateKey(params.privateKey);

    if (admin.apps.length > 0) {
        return admin.app();
    }

    if (!privateKey) {
        console.error("Firebase Admin Error: FIREBASE_PRIVATE_KEY is missing or empty.");
    }

    const cert = admin.credential.cert({
        projectId: params.projectId,
        clientEmail: params.clientEmail,
        privateKey: privateKey,
    });

    return admin.initializeApp({
        credential: cert,
        projectId: params.projectId,
    });
}

export async function initAdmin() {
    const params = {
        projectId: process.env.FIREBASE_PROJECT_ID as string,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,
        privateKey: process.env.FIREBASE_PRIVATE_KEY as string,
    };

    return createFirebaseAdminApp(params);
}
