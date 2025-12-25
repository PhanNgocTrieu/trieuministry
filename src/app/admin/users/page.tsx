"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import Image from "next/image";

interface UserData {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string;
    lastLogin: any;
}

export default function UsersManagementPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // Note: 'users' collection is created by syncUserToFirestore in AuthContext
                const q = query(collection(db, "users"), orderBy("lastLogin", "desc"));
                const querySnapshot = await getDocs(q);
                const usersList: UserData[] = [];
                querySnapshot.forEach((doc) => {
                    usersList.push(doc.data() as UserData);
                });
                setUsers(usersList);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    if (loading) {
        return <div className="p-8 text-center">Loading users...</div>;
    }

    return (
        <div>
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
                                <th scope="col" className="px-6 py-3">Status</th>
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
                                        {user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? (
                                            <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded">Admin</span>
                                        ) : (
                                            <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-1 rounded">User</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.lastLogin?.seconds ? new Date(user.lastLogin.seconds * 1000).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="flex items-center gap-1 text-green-600 font-medium">
                                            <i className="fas fa-circle text-[8px]"></i> Active
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                       <button className="text-blue-600 hover:underline font-medium">Edit</button>
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
