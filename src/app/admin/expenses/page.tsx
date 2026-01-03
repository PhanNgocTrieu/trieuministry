"use client";

import React, { useState, useEffect } from "react";
import ExpensesManager from "@/components/dashboard/ExpensesManager";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";

interface UserData {
    id: string;
    displayName: string;
    email: string;
    photoURL?: string;
}

export default function AdminExpensesPage() {
    const { user, isAdmin, loading } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push('/');
        }
    }, [isAdmin, loading, router]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "users"));
                const userList: UserData[] = [];
                querySnapshot.forEach((doc) => {
                    userList.push({ id: doc.id, ...doc.data() } as UserData);
                });
                setUsers(userList);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoadingUsers(false);
            }
        };

        if (isAdmin) {
            fetchUsers();
        }
    }, [isAdmin]);

    if (loading || !isAdmin) return <div className="p-8 text-center">Loading...</div>;

    if (selectedUserId) {
         const selectedUser = users.find(u => u.id === selectedUserId);
         return (
             <div className="space-y-6">
                 <button 
                    onClick={() => setSelectedUserId(null)}
                    className="flex items-center text-gray-500 hover:text-blue-600 font-bold transition-colors"
                 >
                    <i className="fas fa-arrow-left mr-2"></i> Back to Users List
                 </button>
                 
                 <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm relative">
                        {selectedUser?.photoURL ? (
                            <Image 
                                src={selectedUser.photoURL} 
                                alt={selectedUser.displayName || 'User'} 
                                fill
                                sizes="48px"
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                {selectedUser?.displayName?.charAt(0) || 'U'}
                            </div>
                        )}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Managing expenses for: <span className="text-blue-600">{selectedUser?.displayName}</span></h2>
                        <p className="text-sm text-gray-500">{selectedUser?.email}</p>
                    </div>
                 </div>

                 <ExpensesManager 
                    basePath="/admin/expenses" 
                    scope="personal" // Managing their personal expenses
                    targetUserId={selectedUserId}
                 />
             </div>
         );
    }

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">User Expenses Management</h1>
            <p className="text-gray-500 mb-8">Select a user to view and manage their personal expenses.</p>

            {loadingUsers ? (
                <div className="text-center py-10 text-gray-500">Loading users...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map(userData => (
                        <button 
                            key={userData.id}
                            onClick={() => setSelectedUserId(userData.id)}
                            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left flex items-center gap-4 group"
                        >
                            <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-200 relative shrink-0">
                                {userData.photoURL ? (
                                    <Image 
                                        src={userData.photoURL} 
                                        alt={userData.displayName || 'User'} 
                                        fill
                                        sizes="56px"
                                        className="object-cover group-hover:scale-110 transition-transform"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xl">
                                        {userData.displayName?.charAt(0) || 'U'}
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{userData.displayName || 'Unnamed User'}</h3>
                                <p className="text-sm text-gray-500 truncate">{userData.email}</p>
                                <span className="inline-block mt-2 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                    Manage Expenses <i className="fas fa-arrow-right ml-1"></i>
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
