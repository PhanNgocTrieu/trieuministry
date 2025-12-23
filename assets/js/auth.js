import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { app } from "./firebase-config.js";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Google Login
export async function loginWithGoogle() {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        console.log("Logged in user:", user);
        return user;
    } catch (error) {
        console.error("Login Error:", error);
        throw error;
    }
}

// Email Login
export async function loginWithEmail(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error("Email Login Error:", error);
        throw error;
    }
}

// Logout
export async function logout() {
    try {
        await signOut(auth);
        window.location.reload();
    } catch (error) {
        console.error("Logout Error:", error);
    }
}

// Auth State Monitor
export function monitorAuthState(callback) {
    onAuthStateChanged(auth, (user) => {
        callback(user);
    });
}
