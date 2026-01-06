"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyEmailPage() {
    const { user, sendVerificationEmail, logout } = useAuth();
    const router = useRouter();
    const [sending, setSending] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [message, setMessage] = useState("");
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    useEffect(() => {
        if (!user) {
            router.push("/login");
        } else if (user.emailVerified) {
            router.push("/");
        }
    }, [user, router]);

    // Polling to check if email is verified
    useEffect(() => {
        if (!user || user.emailVerified) return;

        const interval = setInterval(async () => {
            try {
                await user.reload();
                if (user.emailVerified) {
                    // Verification detected!
                    // We force a hard reload to ensure all contexts (AuthContext, Firestore listeners) update cleanly
                    window.location.reload(); 
                }
            } catch (error) {
                console.error("Error checking verification status", error);
            }
        }, 3000); // Check every 3 seconds

        return () => clearInterval(interval);
    }, [user]);

    const handleManualCheck = async () => {
        setVerifying(true);
        try {
            if (user) {
                await user.reload();
                if (user.emailVerified) {
                    window.location.reload();
                } else {
                    setMessage("Email is not verified yet. Please check your inbox.");
                }
            }
        } catch (error) {
            console.error("Error checking verification", error);
        } finally {
            setVerifying(false);
        }
    };

    const handleResend = async () => {
        setSending(true);
        setMessage("");
        try {
            await sendVerificationEmail();
            setMessage("Verification email sent! Please check your inbox.");
            setCountdown(60); // Start 60s cooldown on success
        } catch (error: any) {
            if (error.code === 'auth/too-many-requests') {
                setMessage("Too many requests. Please wait a moment before trying again.");
                setCountdown(60); // Also cooldown on error to prevent spamming
            } else {
                setMessage(error.message || "Error sending email. Please try again later.");
            }
        } finally {
            setSending(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center text-blue-600 mb-6">
                    <i className="fas fa-envelope-open-text text-5xl"></i>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Verify you email
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    We sent an email to <span className="font-medium text-gray-900">{user.email}</span>
                </p>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Just click on the link in that email to complete your signup. 
                </p>
                <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <i className="fas fa-exclamation-triangle text-yellow-500"></i>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                <strong>Can't find the email?</strong><br/>
                                Please check your <strong>Spam</strong> or <strong>Junk</strong> folder.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 space-y-4">
                    
                    {message && (
                         <div className={`p-4 rounded-md ${message.includes('Error') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
                            {message}
                        </div>
                    )}

                    <button
                        onClick={handleResend}
                        disabled={sending || countdown > 0}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sending ? "Sending..." : countdown > 0 ? `Resend available in ${countdown}s` : "Resend Verification Email"}
                    </button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or</span>
                        </div>
                    </div>

                    <button
                        onClick={() => logout()}
                        className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Sign out
                    </button>
                    
                     <div className="text-center mt-4">
                        <button 
                            onClick={handleManualCheck}
                            disabled={verifying}
                            className="text-sm text-blue-600 hover:text-blue-500 flex items-center justify-center gap-2 mx-auto"
                        >
                            {verifying ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sync-alt"></i>}
                            I have verified my email
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
