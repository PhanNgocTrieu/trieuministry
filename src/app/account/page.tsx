"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AccountPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen pt-24 bg-gray-50 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">My Account</h1>
        
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="flex-shrink-0">
               <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-100 relative">
                  {user.photoURL ? (
                    <Image 
                       src={user.photoURL} 
                       alt={user.displayName || 'User'} 
                       fill
                       className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                       {user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
               </div>
            </div>
            
            <div className="flex-grow text-center md:text-left">
               <h2 className="text-2xl font-bold text-gray-900 mb-1">{user.displayName || 'User'}</h2>
               <p className="text-gray-500 mb-4">{user.email}</p>
               
               <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                     Verified User
                  </span>
                  <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                     Active
                  </span>
               </div>
            </div>

            <div className="flex-shrink-0">
               <button 
                  onClick={() => logout().then(() => router.push('/'))}
                  className="px-6 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors"
               >
                  Sign Out
               </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* My Prayers Section */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                     <i className="fas fa-praying-hands text-blue-600"></i> My Prayers
                  </h3>
                  <button className="text-blue-600 text-sm font-bold hover:underline">View All</button>
               </div>
               
               <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
                  <i className="fas fa-bible text-4xl mb-3 opacity-20"></i>
                  <p>You haven't added any prayer requests yet.</p>
                  <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">
                     Add Prayer Request
                  </button>
               </div>
            </div>

            {/* Account Settings */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
               <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <i className="fas fa-cog text-gray-600"></i> Settings
               </h3>
               
               <ul className="space-y-4">
                  <li>
                     <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left">
                        <span className="font-medium text-gray-700">Edit Profile</span>
                        <i className="fas fa-chevron-right text-gray-400"></i>
                     </button>
                  </li>
                  <li>
                     <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left">
                        <span className="font-medium text-gray-700">Change Password</span>
                        <i className="fas fa-chevron-right text-gray-400"></i>
                     </button>
                  </li>
                  <li>
                     <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left">
                        <span className="font-medium text-gray-700">Notifications</span>
                        <i className="fas fa-chevron-right text-gray-400"></i>
                     </button>
                  </li>
               </ul>
            </div>
        </div>
      </div>
    </main>
  );
}
