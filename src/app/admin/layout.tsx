"use client";

import AdminGuard from "@/components/admin/AdminGuard";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { logout } = useAuth();

    const isActive = (path: string) => pathname === path ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white';

    return (
        <AdminGuard>
            <div className="min-h-screen bg-gray-100 flex">
                {/* Sidebar */}
                <aside className="w-64 bg-gray-900 text-white flex-shrink-0 hidden lg:flex flex-col">
                    <div className="p-6 border-b border-gray-800 flex items-center gap-2">
                         <i className="fas fa-church text-xl text-blue-500"></i>
                         <span className="text-xl font-bold">Ministry Admin</span>
                    </div>
                    
                    <nav className="flex-1 p-4 space-y-2">
                        <Link href="/admin" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin')}`}>
                            <i className="fas fa-tachometer-alt w-5 text-center"></i>
                            Dashboard
                        </Link>
                        <Link href="/admin/users" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/users')}`}>
                            <i className="fas fa-users w-5 text-center"></i>
                            Users
                        </Link>
                         <Link href="/admin/prayers" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/prayers')}`}>
                            <i className="fas fa-praying-hands w-5 text-center"></i>
                            Prayers
                        </Link>
                        <Link href="/admin/blogs" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/blogs')}`}>
                            <i className="fas fa-blog w-5 text-center"></i>
                            Blogs
                        </Link>
                    </nav>

                    <div className="p-4 border-t border-gray-800">
                        <button 
                            onClick={() => logout()}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-gray-800 hover:text-red-300 w-full transition-colors"
                        >
                            <i className="fas fa-sign-out-alt w-5 text-center"></i>
                            Logout
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* Top Mobile Header */}
                    <header className="lg:hidden bg-gray-900 text-white p-4 flex justify-between items-center shadow-md">
                         <div className="flex items-center gap-2">
                             <i className="fas fa-church text-blue-500"></i>
                             <span className="font-bold">Admin</span>
                         </div>
                         <button className="text-gray-300 hover:text-white">
                             <i className="fas fa-bars text-xl"></i>
                         </button>
                    </header>

                    <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </AdminGuard>
    );
}
