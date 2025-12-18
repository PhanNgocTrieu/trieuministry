import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCn_mealz-OoEI9jBav5jhoq-sxeQhaS8M",
    authDomain: "trieuministry.firebaseapp.com",
    projectId: "trieuministry",
    storageBucket: "trieuministry.firebasestorage.app",
    messagingSenderId: "741896838004",
    appId: "1:741896838004:web:024ebc3397658df76aaa21",
    measurementId: "G-ZDWXMP9CZ9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

// Expose for Global Usage (Router, etc)
window.analytics = analytics;
window.logEvent = logEvent;
window.db = db;
window.auth = auth;

export { db, analytics, logEvent, auth, onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, signOut };
