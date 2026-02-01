"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, updateDoc, doc, serverTimestamp, increment } from 'firebase/firestore';
import { useLanguage } from '@/context/LanguageContext';


interface Prayer {
  id: string;
  content: string;
  authorName: string; // "Anonymous" or user's name
  authorId?: string; // Optional: link to user profile
  createdAt: any;
  status: 'not_prayed' | 'prayed';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  prayCount: number;
  isPrivate: boolean;
  tags?: string[];
}

export default function PrayersPage() {
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);

  
  // New Prayer Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPrayerContent, setNewPrayerContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  
  // Detailed View (Master-Detail pattern)
  const [selectedPrayerId, setSelectedPrayerId] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<'all' | 'not_prayed' | 'prayed' | 'pending'>('all'); // Added pending for admins
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const q = query(collection(db, "prayers"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prayersList: Prayer[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Prayer;
        // Logic:
        // 1. If Admin: Show everything (sort of, or let filters handle it)
        // 2. If User: Show 'approved' OR 'private' & yours
        // 3. If Anonymous/Visitor: Only 'approved'

        const isAuthor = user?.uid && data.authorId === user.uid;
        const isApproved = data.approvalStatus === 'approved';
        const isPending = data.approvalStatus === 'pending' || !data.approvalStatus; // Treat undefined as pending if needed, or handle legacy

        if (isAdmin) {
             // Admin sees everything
             prayersList.push({ ...data, id: doc.id });
        } else {
             // Regular user
             if (isApproved && !data.isPrivate) {
                 prayersList.push({ ...data, id: doc.id });
             } else if (isAuthor) {
                 // Author sees their own notes (pending or private)
                 prayersList.push({ ...data, id: doc.id });
             }
        }
      });
      setPrayers(prayersList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isAdmin]); // Re-run when auth state changes

  const handleApprove = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      try {
          await updateDoc(doc(db, "prayers", id), {
              approvalStatus: 'approved',
              approvedAt: serverTimestamp(),
              approvedBy: user?.uid
          });
          // Optional: toast success
      } catch (err) {
          console.error("Error approving:", err);
      }
  };

  const handleReject = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(!window.confirm("Are you sure you want to reject/delete this request?")) return;
      try {
          await updateDoc(doc(db, "prayers", id), {
              approvalStatus: 'rejected' // or deleteDoc
          });
          // Or delete: await deleteDoc(doc(db, "prayers", id));
      } catch (err) {
          console.error("Error rejecting:", err);
      }
  };

  const handleAddPrayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrayerContent.trim()) return;

    try {
      await addDoc(collection(db, "prayers"), {
        content: newPrayerContent,
        authorName: isAnonymous ? "Anonymous" : (user?.displayName || "Anonymous"),
        authorId: isAnonymous ? null : (user?.uid || null),
        createdAt: serverTimestamp(),
        status: 'not_prayed',
        approvalStatus: 'pending', 
        prayCount: 0,
        isPrivate: isPrivate,
        tags: []
      });
      setNewPrayerContent('');
      setShowAddModal(false);
      alert("Thank you! Your prayer request has been submitted and is pending approval.");
    } catch (error) {
      console.error("Error adding prayer:", error);
    }
  };

  const handlePrayClick = async (id: string, currentStatus: string) => {
    const prayerRef = doc(db, "prayers", id);
    try {
        await updateDoc(prayerRef, {
            prayCount: increment(1),
            status: 'prayed'
        });
    } catch (error) {
        console.error("Error updating prayer count:", error);
    }
  };

  const filteredPrayers = prayers.filter(p => {
    // 1. Private filter (already handled in fetching/snapshot logic mainly, but double check)
    // If not admin and private and not ours -> hidden (already filtered above)
    
    // 2. Status filter
    // If filter is 'pending' -> only show pending
    if (filterStatus === 'pending') {
        return p.approvalStatus === 'pending';
    }
    
    if (filterStatus !== 'all' && p.status !== filterStatus) {
        return false;
    }

    // 3. Search query
    if (searchQuery && !p.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    // 4. Hide Rejected unless specifically looking for them (or just hide always)
    if (p.approvalStatus === 'rejected' && !isAdmin) return false; // Admins might see rejected if they want?

    return true;
  });

  const selectedPrayer = prayers.find(p => p.id === selectedPrayerId);

  const handlePrayerSelect = (id: string) => {
      setSelectedPrayerId(id);
      if (window.innerWidth < 768) {
          const detailElement = document.getElementById('prayer-detail-view');
          if (detailElement) detailElement.scrollIntoView({ behavior: 'smooth' });
      }
  };

  return (
    <main className="bg-white dark:bg-slate-950 min-h-screen font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">
      
      {/* SECTION 1: HERO */}
      <section className="relative pt-32 pb-16 overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-500 border-b border-slate-200 dark:border-white/5">
         {/* ... Backgrounds ... */}
         <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-violet-500/10 dark:bg-violet-600/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="container container-custom relative z-10 text-center">
            {/* ... Hero Content ... */}
             <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-bold mb-6 border border-indigo-200 dark:border-indigo-500/30">
               <i className="fas fa-praying-hands mr-2"></i> Prayer Wall
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
               Share Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">Prayer Needs</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
               "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God." - Philippians 4:6
            </p>
            

        </div>
      </section>

      {/* SECTION 2: CONTENT */}
      <section className="py-12 bg-white dark:bg-slate-950 min-h-screen">
          <div className="container container-custom">
             <div className="flex flex-col lg:flex-row gap-8">
                
                {/* LEFT COLUMN: LIST */}
                <div className="w-full lg:w-5/12 xl:w-4/12 flex flex-col h-[calc(100vh-140px)] sticky top-24">
                   
                   {/* Search & Actions */}
                   <div className="mb-6 space-y-4">
                      {/* Search Input ... */}
                      <div className="relative">
                         <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                         <input 
                            type="text" 
                            placeholder="Search prayers..." 
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all dark:text-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                         />
                      </div>
                      
                      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                         <button onClick={() => setFilterStatus('all')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${filterStatus === 'all' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>All</button>
                         <button onClick={() => setFilterStatus('not_prayed')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${filterStatus === 'not_prayed' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Needs Prayer</button>
                         <button onClick={() => setFilterStatus('prayed')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${filterStatus === 'prayed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Prayed For</button>
                         {isAdmin && (
                            <button onClick={() => setFilterStatus('pending')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${filterStatus === 'pending' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Pending Approval</button>
                         )}
                      </div>
                      
                      <button 
                        onClick={() => setShowAddModal(true)}
                        className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-lg hover:shadow-violet-500/30 text-white font-bold rounded-xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                      >
                         <i className="fas fa-plus-circle"></i> Submit Prayer Request
                      </button>
                   </div>

                   {/* Scrollable List */}
                   <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                      {loading ? (
                         <div className="text-center py-10">
                            <div className="loading-spinner mb-2"></div>
                            <p className="text-slate-500">Loading requests...</p>
                         </div>
                      ) : filteredPrayers.length === 0 ? (
                         <div className="text-center py-10 opacity-70">
                            <i className="fas fa-inbox text-4xl mb-3 text-slate-300 dark:text-slate-700"></i>
                            <p className="text-slate-500 font-medium">No prayers found</p>
                         </div>
                      ) : (
                         filteredPrayers.map(prayer => (
                            <div 
                               key={prayer.id}
                               onClick={() => handlePrayerSelect(prayer.id)}
                               className={`p-5 rounded-2xl cursor-pointer transition-all border group relative overflow-hidden ${selectedPrayerId === prayer.id ? 'bg-violet-50 dark:bg-violet-600/10 border-violet-500 ring-1 ring-violet-500/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-500/50 hover:shadow-md'}`}
                            >
                               {/* Left Accent Bar */}
                               <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${selectedPrayerId === prayer.id ? 'bg-violet-500' : 'bg-transparent group-hover:bg-violet-300'}`}></div>
                               
                               <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-2">
                                     <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${prayer.authorName === 'Anonymous' ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300'}`}>
                                        {prayer.authorName.charAt(0).toUpperCase()}
                                     </div>
                                     <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{prayer.authorName}</span>
                                  </div>
                                  <span className="text-xs text-slate-400 font-medium">
                                     {prayer.createdAt?.seconds ? new Date(prayer.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                  </span>
                               </div>
                               
                               <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 mb-3 leading-relaxed">
                                  {prayer.content}
                                </p>
                               
                               <div className="flex items-center justify-between">
                                  <div className="flex gap-2">
                                     {prayer.status === 'not_prayed' ? (
                                        <span className="text-[10px] font-bold uppercase bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded border border-amber-100 dark:border-amber-500/20">Needs Prayer</span>
                                     ) : (
                                        <span className="text-[10px] font-bold uppercase bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-500/20">Prayed</span>
                                     )}
                                     {prayer.isPrivate && (
                                         <span className="text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700"><i className="fas fa-lock mr-1"></i> Private</span>
                                     )}
                                     {isAdmin && prayer.approvalStatus === 'pending' && (
                                         <span className="text-[10px] font-bold uppercase bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-500/20"><i className="fas fa-clock mr-1"></i> Pending</span>
                                     )}
                                  </div>
                                  
                                  {/* Admin Actions */}
                                  {isAdmin && prayer.approvalStatus === 'pending' ? (
                                      <div className="flex gap-1.5">
                                          <button onClick={(e) => handleApprove(e, prayer.id)} className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 flex items-center justify-center transition-colors" title="Approve">
                                              <i className="fas fa-check text-xs"></i>
                                          </button>
                                          <button onClick={(e) => handleReject(e, prayer.id)} className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-500/30 flex items-center justify-center transition-colors" title="Reject">
                                              <i className="fas fa-times text-xs"></i>
                                          </button>
                                       </div>
                                  ) : (
                                      <div className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400 text-xs font-bold bg-violet-50 dark:bg-violet-500/10 px-2 py-1 rounded-lg">
                                         <i className="fas fa-praying-hands"></i> {prayer.prayCount}
                                      </div>
                                  )}
                               </div>
                            </div>
                         ))
                      )}
                   </div>
                </div>

                {/* RIGHT COLUMN: DETAIL VIEW */}
                <div id="prayer-detail-view" className="w-full lg:w-7/12 xl:w-8/12 pl-0 lg:pl-8 border-l border-slate-200 dark:border-slate-800 hidden lg:block">
                    {selectedPrayer ? (
                        <div className="sticky top-28 animate-fadeIn">
                             {/* Card Header */}
                             <div className="premium-glass-panel rounded-[2rem] p-8 md:p-12 relative overflow-hidden">
                                {/* Decorative BG */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-[80px]"></div>
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]"></div>
                                
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg ${selectedPrayer.authorName === 'Anonymous' ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-gradient-to-br from-violet-500 to-indigo-500 text-white'}`}>
                                            {selectedPrayer.authorName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedPrayer.authorName}</h3>
                                            <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                <i className="far fa-clock"></i>
                                                {selectedPrayer.createdAt?.seconds ? new Date(selectedPrayer.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                                            </p>
                                        </div>
                                        <div className="ml-auto">
                                            {selectedPrayer.isPrivate && (
                                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500" title="Private Request">
                                                    <i className="fas fa-lock"></i>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-10 text-lg md:text-2xl leading-relaxed text-slate-700 dark:text-slate-200 font-light">
                                        "{selectedPrayer.content}"
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-slate-200 dark:border-white/10">
                                        <div className="flex items-center gap-2">
                                            <div className="text-3xl font-extrabold text-violet-600 dark:text-violet-400">{selectedPrayer.prayCount}</div>
                                            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide leading-tight">
                                                People have<br/>prayed
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={() => handlePrayClick(selectedPrayer.id, selectedPrayer.status)}
                                            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-lg hover:shadow-violet-500/30 text-white font-bold rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-3 relative overflow-hidden group"
                                        >
                                            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                            <i className="fas fa-praying-hands relative z-10"></i>
                                            <span className="relative z-10">{selectedPrayer.status === 'not_prayed' ? 'I Will Pray' : 'Pray Again'}</span>
                                        </button>
                                    </div>
                                </div>
                             </div>

                             {/* Encouragement Section Placeholder */}
                             <div className="mt-8 text-center p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                                 <p className="text-slate-500 italic">"Therefore encourage one another and build each other up, just as in fact you are doing." - 1 Thessalonians 5:11</p>
                             </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-600 flex-col gap-4 min-h-[400px]">
                            <i className="fas fa-church text-6xl opacity-20"></i>
                            <p className="font-medium text-lg">Select a prayer request to view details</p>
                        </div>
                    )}
                </div>
                
                {/* Mobile Detail Overlay (Optional, or just scroll to section) */}
                {selectedPrayer && (
                   <div className="lg:hidden fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col animate-slideUp overflow-auto">
                      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 sticky top-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md">
                         <button onClick={() => setSelectedPrayerId(null)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                            <i className="fas fa-arrow-left"></i>
                         </button>
                         <h3 className="font-bold text-lg">Prayer Details</h3>
                      </div>
                      <div className="p-6">
                           <div className="premium-card p-8 rounded-2xl shadow-lg relative overflow-hidden mb-6">
                               <div className="flex items-center gap-4 mb-6">
                                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold shadow-sm ${selectedPrayer.authorName === 'Anonymous' ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-gradient-to-br from-violet-500 to-indigo-500 text-white'}`}>
                                        {selectedPrayer.authorName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedPrayer.authorName}</h3>
                                        <p className="text-slate-500 text-sm">{selectedPrayer.createdAt?.seconds ? new Date(selectedPrayer.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</p>
                                    </div>
                                </div>
                                <div className="text-xl text-slate-700 dark:text-slate-300 mb-8 leading-relaxed font-light">
                                    "{selectedPrayer.content}"
                                </div>
                                <button 
                                    onClick={() => handlePrayClick(selectedPrayer.id, selectedPrayer.status)}
                                    className="w-full py-4 bg-violet-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                                >
                                    <i className="fas fa-praying-hands"></i>
                                    {selectedPrayer.status === 'not_prayed' ? 'I Will Pray' : 'Pray Again'}
                                </button>
                           </div>
                           
                           {/* Stats */}
                           <div className="grid grid-cols-2 gap-4">
                               <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl text-center border border-slate-200 dark:border-slate-800">
                                   <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{selectedPrayer.prayCount}</div>
                                   <div className="text-xs text-slate-500 uppercase font-bold">Prayer Count</div>
                               </div>
                               <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl text-center border border-slate-200 dark:border-slate-800">
                                   <div className={`text-sm font-bold mt-2 uppercase ${selectedPrayer.status === 'prayed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                       {selectedPrayer.status === 'not_prayed' ? 'Needs Prayer' : 'Prayed For'}
                                   </div>
                                    <div className="text-xs text-slate-500 uppercase font-bold mt-1">Status</div>
                               </div>
                           </div>
                      </div>
                   </div>
                )}
             </div>
          </div>
      </section>

      {/* Add Prayer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           {/* Backdrop */}
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
           
           {/* Modal Content */}
           <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-fadeInUp border border-slate-200 dark:border-slate-800">
               <div className="text-center mb-8">
                   <div className="w-16 h-16 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
                       <i className="fas fa-pen-fancy"></i>
                   </div>
                   <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Submit Prayer Request</h3>
                   <p className="text-slate-500 mt-2">Share your burden, and we will pray with you.</p>
               </div>
               
               <form onSubmit={handleAddPrayer}>
                   <div className="mb-6">
                       <textarea
                          placeholder="Type your prayer request here..."
                          className="w-full h-40 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none resize-none text-slate-700 dark:text-slate-200 transition-all text-lg"
                          value={newPrayerContent}
                          onChange={(e) => setNewPrayerContent(e.target.value)}
                          required
                       ></textarea>
                   </div>
                   
                   <div className="flex flex-col gap-3 mb-8">
                       <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                           <input type="checkbox" checked={isAnonymous} onChange={() => setIsAnonymous(!isAnonymous)} className="w-5 h-5 rounded text-violet-600 focus:ring-violet-500 border-gray-300" />
                           <span className="text-slate-700 dark:text-slate-300 font-medium select-none">Stay Anonymous</span>
                       </label>
                       
                       {user && (
                           <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                               <input type="checkbox" checked={isPrivate} onChange={() => setIsPrivate(!isPrivate)} className="w-5 h-5 rounded text-violet-600 focus:ring-violet-500 border-gray-300" />
                               <span className="text-slate-700 dark:text-slate-300 font-medium select-none">Private <span className="text-slate-400 text-sm font-normal">(Only visible to you)</span></span>
                           </label>
                       )}
                   </div>
                   
                   <div className="flex gap-4">
                       <button 
                          type="button" 
                          onClick={() => setShowAddModal(false)}
                          className="flex-1 py-4 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                       >
                          Cancel
                       </button>
                       <button 
                          type="submit" 
                          className="flex-1 py-4 rounded-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transform hover:-translate-y-1 transition-all"
                       >
                          Submit Prayer
                       </button>
                   </div>
               </form>
           </div>
        </div>
      )}

    </main>
  );
}
