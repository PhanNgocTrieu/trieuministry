"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc, query, orderBy, Timestamp, updateDoc } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import TableSkeleton from "@/components/admin/TableSkeleton";
import { useModal } from "@/context/ModalContext";

interface UserData {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string;
    lastLogin: any;
    role?: string;
    emailVerified?: boolean;
    adminVerified?: boolean;
}

export default function UsersManagementPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const { showAlert, showConfirm } = useModal();

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

    const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState<string | null>(null);

    const handleRoleSelect = (uid: string, newRole: string) => {
        setPendingChanges(prev => ({ ...prev, [uid]: newRole }));
    };

    const saveRoleChange = async (uid: string) => {
        const newRole = pendingChanges[uid];
        if (!newRole) return;
        
        setSaving(uid);
        try {
            await updateDoc(doc(db, "users", uid), {
                role: newRole
            });
            setUsers(users.map(user => 
                user.uid === uid ? { ...user, role: newRole } : user
            ));
            
            // Clear pending change
            setPendingChanges(prev => {
                const next = { ...prev };
                delete next[uid];
                return next;
            });
            showAlert("Success", "User role updated successfully!");
        } catch (error) {
            console.error("Error updating role:", error);
            showAlert("Error", "Failed to update role");
        } finally {
            setSaving(null);
        }
    };

    const handleDeleteUser = async (uid: string) => {
        showConfirm(
            "Delete User Account",
            "WARNING: This will delete the user's login account (Firebase Auth) AND their profile data.\nThis action cannot be undone.\n\nProceed to delete?",
            async () => {
                try {
                    // 1. Delete from Authentication (Server-side)
                    if (auth.currentUser) {
                        const token = await auth.currentUser.getIdToken();
                        const response = await fetch('/api/admin/users/delete', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ uid })
                        });

                        if (!response.ok) {
                            const data = await response.json();
                            throw new Error(data.error || 'Failed to delete from Auth');
                        }
                    }

                    // 2. Delete from Firestore (Client-side)
                    await deleteDoc(doc(db, "users", uid));
                    setUsers(users.filter(u => u.uid !== uid));
                    showAlert("Success", "User account deleted successfully.");
                } catch (error: any) {
                    console.error("Error deleting user:", error);
                    showAlert("Error", `Failed to delete user: ${error.message}`);
                }
            },
            true
        );
    };

    const handleVerifyToggle = async (uid: string, currentStatus: boolean) => {
        showConfirm(
            currentStatus ? "Revoke Verification?" : "Manually Verify User?",
            currentStatus 
                ? "This will revoke the manual verification status. If the user verified their email, they will still be verified." 
                : "This will manually verify the user, checking the 'isVerified' flag regardless of email status.",
            async () => {
                try {
                    await updateDoc(doc(db, "users", uid), {
                        adminVerified: !currentStatus
                    });
                    setUsers(users.map(u => u.uid === uid ? { ...u, adminVerified: !currentStatus } : u));
                } catch (error) {
                    console.error("Error toggling verification:", error);
                    showAlert("Error", "Failed to update verification status.");
                }
            },
            currentStatus // 'isDangerous' flag reused here logic-wise
        );
    };

    const handleResetPassword = async (email: string) => {
        if (!email) return showAlert("Error", "User has no email?");
        showConfirm(
            "Send Password Reset?",
            `Send a password reset email to ${email}?`,
            async () => {
                try {
                    await sendPasswordResetEmail(auth, email);
                    showAlert("Success", `Password reset email sent to ${email}`);
                } catch (error: any) {
                    console.error("Error sending reset email:", error);
                    showAlert("Error", `Failed to send email: ${error.message}`);
                }
            }
        );
    };

    if (loading) {
        return (
            <div>
                 <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
                </div>
                <TableSkeleton cols={4} />
            </div>
        );
    }


    return (
        <div>

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
                <span className="bg-blue-500/10 text-blue-400 text-sm font-medium px-2.5 py-0.5 rounded border border-blue-500/20">
                    Total: {users.length}
                </span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                        <thead className="text-xs text-slate-700 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/5">
                            <tr>
                                <th scope="col" className="px-6 py-3">User</th>
                                <th scope="col" className="px-6 py-3">Role</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3">Last Login</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                            {users.map((user) => (
                                <tr key={user.uid} className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 relative flex-shrink-0">
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
                                            <div className="font-bold text-slate-900 dark:text-white">{user.displayName || 'Unknown'}</div>
                                            <div className="text-xs text-slate-500">{user.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {(user.email === 'pntrieu200799@gmail.com' || user.email === 'phantrieu580@gmail.com') ? (
                                            <span className="bg-blue-600/10 text-blue-500 text-xs font-bold px-2 py-1 rounded border border-blue-600/20">
                                                <i className="fas fa-lock mr-1"></i> Root Admin
                                            </span>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <select 
                                                    value={pendingChanges[user.uid] || user.role || 'user'}
                                                    onChange={(e) => handleRoleSelect(user.uid, e.target.value)}
                                                    disabled={saving === user.uid}
                                                    className={`text-xs font-bold px-2 py-1 rounded border cursor-pointer outline-none focus:ring-2 focus:ring-blue-500 ${
                                                        (pendingChanges[user.uid] || user.role) === 'admin' ? 'bg-blue-600/10 text-blue-700 dark:text-blue-500 border-blue-600/20' :
                                                        (pendingChanges[user.uid] || user.role) === 'volunteer' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' :
                                                        'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-white/10'
                                                    }`}
                                                >
                                                    <option value="user" className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">User</option>
                                                    <option value="volunteer" className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">Volunteer</option>
                                                    <option value="admin" className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">Admin</option>
                                                </select>
                                                
                                                {/* Show Save Button if there's a pending change */}
                                                {pendingChanges[user.uid] && pendingChanges[user.uid] !== user.role && (
                                                    <button
                                                        onClick={() => saveRoleChange(user.uid)}
                                                        disabled={saving === user.uid}
                                                        className="bg-blue-600 text-white p-1 rounded hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
                                                        title="Save Role Change"
                                                    >
                                                        {saving === user.uid ? (
                                                            <i className="fas fa-spinner fa-spin text-xs"></i>
                                                        ) : (
                                                            <i className="fas fa-save text-xs"></i>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 items-start">
                                            {user.emailVerified ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20" title="Verified via Email Link">
                                                    <i className="fas fa-envelope mr-1"></i> Email Verified
                                                </span>
                                            ) : user.adminVerified ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20" title="Manually Verified by Admin">
                                                        <i className="fas fa-user-check mr-1"></i> Admin Verified
                                                    </span>
                                                    <button 
                                                        onClick={() => handleVerifyToggle(user.uid, true)}
                                                        className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 text-xs underline"
                                                    >
                                                        Revoke
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                                        <i className="fas fa-hourglass-half mr-1"></i> Pending
                                                    </span>
                                                    <button 
                                                        onClick={() => handleVerifyToggle(user.uid, false)}
                                                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline"
                                                    >
                                                        Verify
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.lastLogin?.seconds ? new Date(user.lastLogin.seconds * 1000).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 flex gap-3">
                                        <button 
                                            onClick={() => handleResetPassword(user.email)}
                                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-xs border border-blue-500/30 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                            title="Send Password Reset Email"
                                        >
                                            <i className="fas fa-key margin-right-1"></i> Reset Pass
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteUser(user.uid)}
                                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 ml-2 hover:bg-red-50 dark:hover:bg-red-500/10 p-1 rounded transition-colors"
                                            title="Delete User Data"
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
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
