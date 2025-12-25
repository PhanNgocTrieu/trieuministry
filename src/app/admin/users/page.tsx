"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc, query, orderBy, Timestamp } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import Image from "next/image";
import ConfirmModal from "@/components/admin/ConfirmModal";

interface UserData {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string;
    lastLogin: any;
    role?: string;
}

export default function UsersManagementPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "users"), orderBy("lastLogin", "desc"));
            const querySnapshot = await getDocs(q);
            const usersList: UserData[] = [];
            querySnapshot.forEach((doc) => {
                usersList.push({ uid: doc.id, ...doc.data() } as UserData);
            });
            setUsers(usersList);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isDangerous?: boolean;
    }>({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => {},
    });

    const openModal = (title: string, message: string, onConfirm: () => void, isDangerous = false) => {
        setModalConfig({ isOpen: true, title, message, onConfirm, isDangerous });
    };

    const handleDeleteUser = async (uid: string) => {
        openModal(
            "Delete User Profile",
            "WARNING: This only deletes the user 'profile' from database.\nThe login account (Firebase Auth) CANNOT be deleted from here without a backend.\n\nProceed to delete profile?",
            async () => {
                try {
                    await deleteDoc(doc(db, "users", uid));
                    setUsers(users.filter(u => u.uid !== uid));
                } catch (error) {
                    console.error("Error deleting user:", error);
                    alert("Failed to delete user profile.");
                }
            },
            true
        );
    };

    const handleResetPassword = async (email: string) => {
        if (!email) return alert("User has no email?");
        openModal(
            "Send Password Reset?",
            `Send a password reset email to ${email}?`,
            async () => {
                try {
                    await sendPasswordResetEmail(auth, email);
                    alert(`Password reset email sent to ${email}`);
                } catch (error: any) {
                    console.error("Error sending reset email:", error);
                    alert(`Failed to send email: ${error.message}`);
                }
            }
        );
    };

    if (loading) {
        return <div className="p-8 text-center">Loading users...</div>;
    }

    return (
        <div>
            <ConfirmModal 
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
                isDangerous={modalConfig.isDangerous}
            />

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
                    Total: {users.length}
                </span>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">User</th>
                                <th scope="col" className="px-6 py-3">Role</th>
                                <th scope="col" className="px-6 py-3">Last Login</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.uid} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 relative flex-shrink-0">
                                            {user.photoURL ? (
                                                <Image 
                                                    src={user.photoURL} 
                                                    alt={user.displayName || 'User'} 
                                                    fill
                                                    sizes="40px"
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                                                    {user.email?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{user.displayName || 'Unknown'}</div>
                                            <div className="text-xs text-gray-500">{user.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.email === 'pntrieu200799@gmail.com' || user.email === 'phantrieu580@gmail.com' ? (
                                            <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded">Admin</span>
                                        ) : (
                                            <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-1 rounded">User</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.lastLogin?.seconds ? new Date(user.lastLogin.seconds * 1000).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 flex gap-3">
                                        <button 
                                            onClick={() => handleResetPassword(user.email)}
                                            className="text-blue-600 hover:text-blue-800 font-medium text-xs border border-blue-200 px-2 py-1 rounded hover:bg-blue-50"
                                            title="Send Password Reset Email"
                                        >
                                            <i className="fas fa-key margin-right-1"></i> Reset Pass
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteUser(user.uid)}
                                            className="text-red-500 hover:text-red-700 ml-2"
                                            title="Delete User Data"
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
