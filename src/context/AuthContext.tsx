"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
    User, 
    onAuthStateChanged, 
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    signUp: (email: string, pass: string, name: string) => Promise<void>;
    signIn: (email: string, pass: string) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    const syncUserToFirestore = async (user: User) => {
        try {
            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                lastLogin: serverTimestamp(),
            }, { merge: true });
        } catch (error) {
            console.error("Error syncing user to Firestore", error);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                if (currentUser.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
                    setIsAdmin(true);
                } else {
                    setIsAdmin(false);
                }
                // Sync user to Firestore
                await syncUserToFirestore(currentUser);
            } else {
                setIsAdmin(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error signing in with Google", error);
            throw error;
        }
    };

    const signUp = async (email: string, pass: string, name: string) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            await updateProfile(userCredential.user, { displayName: name });
            // Sync new user immediately
            await syncUserToFirestore({ ...userCredential.user, displayName: name } as User);
        } catch (error) {
            console.error("Error signing up", error);
            throw error;
        }
    }

    const signIn = async (email: string, pass: string) => {
        try {
             await signInWithEmailAndPassword(auth, email, pass);
        } catch (error) {
            console.error("Error signing in", error);
            throw error;
        }
    }

    const resetPassword = async (email: string) => {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            console.error("Error resetting password", error);
            throw error;
        }
    }

    const logout = async () => {
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error("Error signing out", error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout, signUp, signIn, resetPassword, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
