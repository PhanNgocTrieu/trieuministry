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

// Register with Email
export async function registerWithEmail(email, password, fullName) {
    try {
        const { createUserWithEmailAndPassword, updateProfile } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update Profile with Name
        if (fullName) {
            await updateProfile(user, {
                displayName: fullName
            });
            // Reload user to update local state
            await user.reload();
        }

        return user;
    } catch (error) {
        console.error("Registration Error:", error);
        throw error;
    }
}
