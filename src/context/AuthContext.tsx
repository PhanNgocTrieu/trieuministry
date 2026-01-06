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
    updateProfile,
    sendEmailVerification,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, getDoc, onSnapshot } from "firebase/firestore";
import { logActivity } from "@/lib/activity-logger";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    signUp: (email: string, pass: string, name: string) => Promise<void>;
    signIn: (email: string, pass: string) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    sendVerificationEmail: () => Promise<void>;
    isAdmin: boolean;
    isVolunteer: boolean;
    isVerified: boolean;
    role: string | null;
    updateUser: (displayName: string, photoURL: string) => Promise<void>;
    changePassword: (newPassword: string, currentPassword?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isVolunteer, setIsVolunteer] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [role, setRole] = useState<string | null>(null);

    const syncUserToFirestore = async (user: User) => {
        try {
            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                emailVerified: user.emailVerified,
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
                setIsVerified(false);
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

                    const isEmailVerified = user.emailVerified;
                    // Strict Rule: Must be verified to be admin/volunteer (unless hardcoded dev backdoor)
                    const isVerifiedRequirementMet = isEmailVerified || isHardcodedAdmin;

                    if ((isHardcodedAdmin || isDbAdmin) && isVerifiedRequirementMet) {
                        setIsAdmin(true);
                        setIsVolunteer(false);
                    } else if (userRole === 'volunteer' && isVerifiedRequirementMet) {
                        setIsAdmin(false);
                        setIsVolunteer(true);
                    } else {
                        setIsAdmin(false);
                        setIsVolunteer(false);
                    }
                    
                    // Determine if verified (either by email or admin override)
                    const userDataForVerify = docSnap.exists() ? docSnap.data() : null;
                    const isAdminVerified = userDataForVerify?.emailVerified === true; // Wait, I need to use a different field or reuse emailVerified?
                    // If I use emailVerified from Firestore, syncUserToFirestore overwrites it with user.emailVerified.
                    // So I should use 'adminVerified' field.
                    const isAdminOverride = userDataForVerify?.adminVerified === true;

                    setIsVerified(isEmailVerified || isAdminOverride);

                    setLoading(false);
                }, (error) => {
                    console.error("Error listening to user role:", error);
                    setLoading(false);
                });
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
            
            // Send verification email
            await sendEmailVerification(userCredential.user);

            // Sync new user immediately
            await syncUserToFirestore({ ...userCredential.user, displayName: name } as User);

            // Log activity
            await logActivity(
                'user', 
                'register', 
                `New user registered: ${name} (${email})`,
                { userId: userCredential.user.uid, email }
            );
        } catch (error) {
            console.error("Error signing up", error);
            throw error;
        }
    }

    const signIn = async (email: string, pass: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (error: any) {
            // Don't log expected user errors as console errors
            if (error.code !== 'auth/invalid-credential' && error.code !== 'auth/user-not-found' && error.code !== 'auth/wrong-password') {
                console.error("Error signing in", error);
            }
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

    const sendVerificationEmail = async () => {
        if (auth.currentUser) {
            await sendEmailVerification(auth.currentUser);
        }
    }

    const changePassword = async (newPassword: string, currentPassword?: string) => {
        if (auth.currentUser) {
            try {
                // If current password provided, try to re-authenticate first
                if (currentPassword && auth.currentUser.email) {
                    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
                    await reauthenticateWithCredential(auth.currentUser, credential);
                }
                
                await updatePassword(auth.currentUser, newPassword);
            } catch (error) {
                console.error("Error changing password", error);
                throw error;
            }
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
        sendVerificationEmail,
        isAdmin,
        isVolunteer,
        isVerified,
        role,
        updateUser: async (displayName: string, photoURL: string) => {
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { displayName, photoURL });
                await auth.currentUser.reload();
                // Create a new object to force re-render
                setUser({ ...auth.currentUser });
                // Also sync to firestore
                await syncUserToFirestore(auth.currentUser);
            }
        },
        changePassword
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
