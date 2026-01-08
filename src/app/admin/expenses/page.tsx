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

    if (loading || !isAdmin) return <div className="p-8 text-center text-slate-400">Loading...</div>;

    if (selectedUserId) {
         const selectedUser = users.find(u => u.id === selectedUserId);
         return (
             <div className="space-y-6">
                 <button 
                    onClick={() => setSelectedUserId(null)}
                    className="flex items-center text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 font-bold transition-colors"
                 >
                    <i className="fas fa-arrow-left mr-2"></i> Back to Users List
                 </button>
                 
                 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-4 rounded-xl flex items-center gap-4 mb-6 shadow-lg">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-sm relative">
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
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Managing expenses for: <span className="text-blue-600 dark:text-blue-400">{selectedUser?.displayName}</span></h2>
                        <p className="text-sm text-slate-500 dark:text-slate-500">{selectedUser?.email}</p>
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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">User Expenses Management</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8">Select a user to view and manage their personal expenses.</p>

            {loadingUsers ? (
                <div className="text-center py-10 text-slate-500">Loading users...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map(userData => (
                        <button 
                            key={userData.id}
                            onClick={() => setSelectedUserId(userData.id)}
                            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-lg hover:shadow-xl hover:border-blue-500/30 dark:hover:border-white/10 transition-all text-left flex items-center gap-4 group"
                        >
                            <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 relative shrink-0">
                                {userData.photoURL ? (
                                    <Image 
                                        src={userData.photoURL} 
                                        alt={userData.displayName || 'User'} 
                                        fill
                                        sizes="56px"
                                        className="object-cover group-hover:scale-110 transition-transform"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xl">
                                        {userData.displayName?.charAt(0) || 'U'}
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{userData.displayName || 'Unnamed User'}</h3>
                                <p className="text-sm text-slate-500 truncate">{userData.email}</p>
                                <span className="inline-block mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-2 py-1 rounded-md">
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
