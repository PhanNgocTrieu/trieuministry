"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ImageUploader from '@/components/ImageUploader';

export default function AccountPage() {
  const { user, loading, logout, resetPassword } = useAuth();
  const router = useRouter();

  // Settings State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true); // Dummy state for now

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
        setNewName(user.displayName || '');
        setNewPhotoUrl(user.photoURL || '');
    }
  }, [user, loading, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!auth.currentUser) return;

      setIsSaving(true);
      try {
          // 1. Update Auth Profile
          await updateProfile(auth.currentUser, {
              displayName: newName,
              photoURL: newPhotoUrl
          });

          // 2. Update Firestore User Doc
          const userRef = doc(db, 'users', auth.currentUser.uid);
          await updateDoc(userRef, {
              displayName: newName,
              photoURL: newPhotoUrl
          });

          // 3. User context auto-updates via onAuthStateChanged or we can force reload
          // However, for immediate UI feedback, we rely on the auth state listener.
          
          setIsEditingProfile(false);
          alert("Profile updated successfully!");
      } catch (error) {
          console.error("Error updating profile:", error);
          alert("Failed to update profile.");
      } finally {
          setIsSaving(false);
      }
  };

  const handlePasswordReset = async () => {
      if (!user?.email) return;
      if (confirm(`Send a password reset email to ${user.email}?`)) {
          try {
              await resetPassword(user.email);
              alert("Password reset email sent! Please check your inbox.");
          } catch (error) {
              console.error("Error sending reset email:", error);
              alert("Failed to send reset email.");
          }
      }
  };

  const handleImageUploaded = (url: string) => {
      setNewPhotoUrl(url);
  };

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
               <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-100 relative group">
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
                  <button onClick={() => router.push('/prayers')} className="text-blue-600 text-sm font-bold hover:underline">View All</button>
               </div>
               
               <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
                  <i className="fas fa-bible text-4xl mb-3 opacity-20"></i>
                  <p>Check your prayer requests status.</p>
                  <button onClick={() => router.push('/prayers')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">
                     Go to Prayers
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
                     <button 
                        onClick={() => setIsEditingProfile(true)}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                     >
                        <span className="font-medium text-gray-700">Edit Profile</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">Name, Photo</span>
                            <i className="fas fa-chevron-right text-gray-400"></i>
                        </div>
                     </button>
                  </li>
                  <li>
                     <button 
                        onClick={handlePasswordReset}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                     >
                        <span className="font-medium text-gray-700">Change Password</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">Via Email</span>
                            <i className="fas fa-chevron-right text-gray-400"></i>
                        </div>
                     </button>
                  </li>
                  <li>
                     <button 
                        onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                     >
                        <span className="font-medium text-gray-700">Notifications</span>
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${notificationsEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${notificationsEnabled ? 'left-6' : 'left-1'}`}></div>
                        </div>
                     </button>
                  </li>
               </ul>
            </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">Edit Profile</h3>
                    <button onClick={() => setIsEditingProfile(false)} className="text-gray-400 hover:text-gray-600">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                    <div className="flex flex-col items-center mb-4">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-100 mb-3 relative">
                            {newPhotoUrl ? (
                                <img src={newPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                                    <i className="fas fa-user text-3xl"></i>
                                </div>
                            )}
                        </div>
                        <div className="w-full">
                            <ImageUploader onImageUploaded={handleImageUploaded} folder="users" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Display Name</label>
                        <input 
                            type="text" 
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your name"
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button 
                            type="button" 
                            onClick={() => setIsEditingProfile(false)}
                            className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSaving}
                            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </main>
  );
}
