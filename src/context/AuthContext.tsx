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
import { doc, setDoc, serverTimestamp, getDoc, onSnapshot } from "firebase/firestore";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    signUp: (email: string, pass: string, name: string) => Promise<void>;
    signIn: (email: string, pass: string) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    isAdmin: boolean;
    isVolunteer: boolean;
    role: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isVolunteer, setIsVolunteer] = useState(false);
    const [role, setRole] = useState<string | null>(null);

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
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) {
                setLoading(false);
                setIsAdmin(false);
                setIsVolunteer(false);
                setRole(null);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        let unsubscribeSnapshot: (() => void) | undefined;

        const setupUserListener = async () => {
            if (user) {
                // 1. Sync user basic info (fire and forget)
                syncUserToFirestore(user);

                // 2. Real-time Role Listener
                const userRef = doc(db, "users", user.uid);
                unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
                    let userRole = 'user';
                    
                    if (docSnap.exists()) {
                        const userData = docSnap.data();
                        userRole = userData.role || 'user';
                    }
                    
                    setRole(userRole);

                    // 3. Determine Permissions
                    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
                    const allowedAdmins = ['phantrieu580@gmail.com', 'pntrieu200799@gmail.com'];
                    
                    const userEmail = user.email || '';
                    const isHardcodedAdmin = (adminEmail && userEmail === adminEmail) || allowedAdmins.includes(userEmail);
                    const isDbAdmin = userRole === 'admin';

                    if (isHardcodedAdmin || isDbAdmin) {
                        setIsAdmin(true);
                        setIsVolunteer(false);
                    } else if (userRole === 'volunteer') {
                        setIsAdmin(false);
                        setIsVolunteer(true);
                    } else {
                        setIsAdmin(false);
                        setIsVolunteer(false);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Error listening to user role:", error);
                    setLoading(false);
                });
            } else {
                setLoading(false);
            }
        };

        setupUserListener();

        return () => {
            if (unsubscribeSnapshot) unsubscribeSnapshot();
        };
    }, [user]);

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
        <AuthContext.Provider value={{
        user,
        loading,
        signInWithGoogle,
        logout,
        signUp,
        signIn,
        resetPassword,
        isAdmin,
        isVolunteer,
        role
    }}>
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
