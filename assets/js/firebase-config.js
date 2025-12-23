import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBwsAzJR6M0lbk43k-WSRTabqaRSa2tNXk",
    authDomain: "trieuministry-w.firebaseapp.com",
    projectId: "trieuministry-w",
    storageBucket: "trieuministry-w.firebasestorage.app",
    messagingSenderId: "217860039598",
    appId: "1:217860039598:web:e6b2bf7b5d3e642ee45e3f",
    measurementId: "G-MCPY8SLH55"
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

export { app, db, analytics, logEvent, auth, onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, signOut };
