"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc, query, orderBy, Timestamp, updateDoc } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import Image from "next/image";
import ConfirmModal from "@/components/admin/ConfirmModal";
import TableSkeleton from "@/components/admin/TableSkeleton";

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
        isDangerous: false,
    });

    const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState<string | null>(null);

    const openModal = (title: string, message: string, onConfirm: () => void, isDangerous = false) => {
        setModalConfig({ isOpen: true, title, message, onConfirm, isDangerous });
    };

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
             alert("User role updated successfully!");
        } catch (error) {
            console.error("Error updating role:", error);
            alert("Failed to update role");
        } finally {
            setSaving(null);
        }
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
        return (
            <div>
                 <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                </div>
                <TableSkeleton cols={4} />
            </div>
        );
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
                                        {(user.email === 'pntrieu200799@gmail.com' || user.email === 'phantrieu580@gmail.com') ? (
                                            <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded border border-purple-200">
                                                <i className="fas fa-lock mr-1"></i> Root Admin
                                            </span>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <select 
                                                    value={pendingChanges[user.uid] || user.role || 'user'}
                                                    onChange={(e) => handleRoleSelect(user.uid, e.target.value)}
                                                    disabled={saving === user.uid}
                                                    className={`text-xs font-bold px-2 py-1 rounded border cursor-pointer outline-none focus:ring-2 focus:ring-blue-500 ${
                                                        (pendingChanges[user.uid] || user.role) === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                        (pendingChanges[user.uid] || user.role) === 'volunteer' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        'bg-gray-50 text-gray-700 border-gray-200'
                                                    }`}
                                                >
                                                    <option value="user">User</option>
                                                    <option value="volunteer">Volunteer</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                                
                                                {/* Show Save Button if there's a pending change */}
                                                {pendingChanges[user.uid] && pendingChanges[user.uid] !== user.role && (
                                                    <button
                                                        onClick={() => saveRoleChange(user.uid)}
                                                        disabled={saving === user.uid}
                                                        className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700 transition-colors shadow-sm"
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
