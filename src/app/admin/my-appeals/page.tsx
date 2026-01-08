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

export default function AdminMyAppealsPage() {
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
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">My Ministry Appeals</h1>
                    <p className="text-slate-400">Track the status of your personal fundraising requests.</p>
                </div>
                <Link 
                    href="/donate" 
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-900/20 font-bold flex items-center gap-2"
                >
                    <i className="fas fa-plus"></i> New Request
                </Link>
            </div>

            <div className="bg-slate-900 rounded-xl shadow-lg border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800/50 border-b border-white/5 text-xs uppercase text-slate-400">
                                <th className="px-6 py-4 font-bold">Appeal Details</th>
                                <th className="px-6 py-4 font-bold">Progress</th>
                                <th className="px-6 py-4 font-bold">Status</th>
                                <th className="px-6 py-4 font-bold text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {appeals.length > 0 ? (
                                appeals.map((appeal) => (
                                    <tr key={appeal.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-white">{appeal.title}</div>
                                            <div className="text-xs text-slate-400 mt-1 line-clamp-1">{appeal.content}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1 min-w-[150px]">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-slate-500">Raised:</span>
                                                    <span className="font-bold text-green-400">
                                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(appeal.currentAmount || 0)}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-slate-800 rounded-full h-1.5 border border-white/5">
                                                    <div 
                                                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                                                        style={{ width: `${Math.min(100, ((appeal.currentAmount || 0) / parseInt(appeal.target || '1')) * 100)}%` }}
                                                    ></div>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-slate-500">Target:</span>
                                                    <span className="font-mono text-slate-400">
                                                        {appeal.target ? parseInt(appeal.target).toLocaleString() : 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border
                                                ${appeal.status === 'published' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                                                  appeal.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                  appeal.status === 'completed' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                  'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                {appeal.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-slate-500">
                                            {formatDate(appeal.createdAt)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                        <i className="fas fa-inbox text-4xl mb-3 opacity-20"></i>
                                        <p>You haven't submitted any appeals yet.</p>
                                        <Link href="/donate" className="inline-block mt-4 text-blue-400 hover:text-blue-300 text-sm font-bold hover:underline">
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
