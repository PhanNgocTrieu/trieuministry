"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc, updateDoc, orderBy, query } from "firebase/firestore";
import Link from "next/link";
import ConfirmModal from "@/components/admin/ConfirmModal";
import Image from "next/image";
import TableSkeleton from "@/components/admin/TableSkeleton";

interface Appeal {
    id: string;
    title: string;
    target: string;
    currentAmount: number;
    status: 'pending' | 'active' | 'completed' | 'closed';
    name: string;
    createdAt: any;
}

export default function AdminAppealsPage() {
    const [appeals, setAppeals] = useState<Appeal[]>([]);
    const [loading, setLoading] = useState(true);
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

    const fetchAppeals = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "appeals"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const list: Appeal[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                list.push({ id: doc.id, ...data } as Appeal);
            });
            setAppeals(list);
        } catch (error) {
            console.error("Error fetching appeals:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppeals();
    }, []);

    const handleDelete = async (id: string) => {
        openModal(
            "Delete Appeal",
            "Are you sure you want to delete this appeal request? This action cannot be undone.",
            async () => {
                try {
                    await deleteDoc(doc(db, "appeals", id));
                    setAppeals(appeals.filter(p => p.id !== id));
                } catch (error) {
                    console.error("Error deleting appeal:", error);
                    alert("Failed to delete appeal");
                }
            },
            true
        );
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            await updateDoc(doc(db, "appeals", id), { status: newStatus });
            setAppeals(appeals.map(a => a.id === id ? { ...a, status: newStatus as any } : a));
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        }
    };

    if (loading) {
       return (
             <div>
                 <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Appeal Management</h1>
                </div>
                <TableSkeleton cols={5} />
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
                <h1 className="text-2xl font-bold text-gray-900">Appeals & Donations Management</h1>
                <Link href="/admin/appeals/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
                    <i className="fas fa-plus"></i> Create Appeal
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Title / Requester</th>
                            <th scope="col" className="px-6 py-3">Target Amount</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appeals.map((item) => (
                            <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{item.title}</div>
                                    <div className="text-xs text-gray-500">By: {item.name}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{Number(item.target).toLocaleString()} VND</div>
                                    <div className="text-xs text-gray-500">Raised: {item.currentAmount?.toLocaleString() || 0}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <select 
                                        value={item.status}
                                        onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
                                        className={`px-2 py-1 rounded text-xs font-bold uppercase border-none focus:ring-0 cursor-pointer ${
                                            {
                                                pending: 'bg-yellow-100 text-yellow-700',
                                                active: 'bg-green-100 text-green-700',
                                                completed: 'bg-blue-100 text-blue-700',
                                                closed: 'bg-gray-100 text-gray-700'
                                            }[item.status] || 'bg-gray-100'
                                        }`}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="active">Active</option>
                                        <option value="completed">Completed</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4">
                                    {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="px-6 py-4 flex gap-3">
                                    <Link href={`/admin/appeals/${item.id}/edit`} className="text-blue-500 hover:text-blue-700" title="Edit">
                                        <i className="fas fa-edit"></i>
                                    </Link>
                                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700" title="Delete">
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {appeals.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    No appeal requests found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
