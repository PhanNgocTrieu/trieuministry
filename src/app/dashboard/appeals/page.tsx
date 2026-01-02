"use client";

import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface MyAppeal {
    id: string;
    title: string;
    content: string;
    target: string;
    currentAmount: number;
    status: string;
    createdAt: any;
    type: string;
}

export default function MyAppealsPage() {
    const { user } = useAuth();
    const [appeals, setAppeals] = useState<MyAppeal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "appeals"),
            where("authorId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: MyAppeal[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                // Filter out official appeals if any accidentally got mixed in, though query shouldn't return them if logic is correct
                if (data.type !== 'official') {
                    list.push({ id: doc.id, ...data } as MyAppeal);
                }
            });
            setAppeals(list);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching my appeals:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp.seconds * 1000).toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">My Appeals</h1>
                <p className="text-gray-500">Track the status of your fundraising requests.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500">
                                <th className="px-6 py-4 font-bold">Appeal Details</th>
                                <th className="px-6 py-4 font-bold">Progress</th>
                                <th className="px-6 py-4 font-bold">Status</th>
                                <th className="px-6 py-4 font-bold text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {appeals.length > 0 ? (
                                appeals.map((appeal) => (
                                    <tr key={appeal.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{appeal.title}</div>
                                            <div className="text-xs text-gray-400 mt-1 line-clamp-1">{appeal.content}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1 min-w-[150px]">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-500">Raised:</span>
                                                    <span className="font-bold text-gray-900">
                                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(appeal.currentAmount || 0)}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                    <div 
                                                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
                                                        style={{ width: `${Math.min(100, ((appeal.currentAmount || 0) / parseInt(appeal.target || '1')) * 100)}%` }}
                                                    ></div>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-500">Target:</span>
                                                    <span className="font-mono text-gray-600">
                                                        {appeal.target ? parseInt(appeal.target).toLocaleString() : 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize
                                                ${appeal.status === 'published' ? 'bg-green-100 text-green-700' : 
                                                  appeal.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                  appeal.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                                  'bg-red-100 text-red-700'}`}>
                                                {appeal.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-gray-500">
                                            {formatDate(appeal.createdAt)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                        <i className="fas fa-inbox text-4xl mb-3 opacity-20"></i>
                                        <p>You haven't submitted any appeals yet.</p>
                                        <Link href="/donate" className="inline-block mt-4 text-blue-600 hover:text-blue-800 text-sm font-bold">
                                            Submit a Request
                                        </Link>
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
