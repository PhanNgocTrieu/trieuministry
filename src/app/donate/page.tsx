"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import CreateAppealModal from '@/components/CreateAppealModal';

interface Appeal {
    id: string;
    title: string;
    content: string;
    target: number;
    currentAmount: number;
    name: string;
    createdAt: any;
    bankQR?: string;
    currency?: string;
}

import { useModal } from '@/context/ModalContext';

export default function DonatePage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const { showAlert } = useModal();

  useEffect(() => {
    // Fetch Published User Appeals
    const q = query(
        collection(db, "appeals"), 
        where("type", "==", "user_request"),
        where("status", "==", "published"),
        orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: Appeal[] = [];
        snapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() } as Appeal);
        });
        setAppeals(list);
    }, (error) => {
        console.error("Error fetching appeals:", error);
    });

    return () => unsubscribe();
  }, []);

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    showAlert("Info", message); 
  };

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="bg-white py-16 lg:py-24">
        <div className="container container-custom">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-7/12">
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-800 flex items-center gap-3">
                <i className="fas fa-hand-holding-heart text-blue-600"></i>
                {t('donate.hero.title')}
              </h1>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                {t('donate.hero.subtitle')}
              </p>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg">
                <p className="text-gray-700 italic font-serif text-lg mb-2">
                  <i className="fas fa-quote-left mr-2 text-yellow-600 opacity-50"></i>
                  {t('donate.verse.content')}
                </p>
                <p className="text-right text-gray-500 font-semibold mb-0">
                  {t('donate.verse.address')}
                </p>
              </div>
            </div>
            <div className="lg:w-5/12 text-center">
               <div className="relative w-full max-w-md mx-auto aspect-square lg:aspect-auto h-[400px]">
                  <Image 
                    src="/hero_donate.png" 
                    alt="Giving" 
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-500"
                  />
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Personal Donation Section */}
      <section className="py-20 lg:py-24">
        <div className="container container-custom">
          <div className="flex items-center mb-8 gap-3">
            <h2 className="text-3xl font-bold text-blue-600 flex items-center">
              <i className="fas fa-user-circle mr-3"></i>
              {t('donate.personal.title')}
            </h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold uppercase tracking-wide">
              {t('donate.personal.badge')}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Bank Info */}
            <div className="bg-white rounded-2xl shadow-lg p-8 transform transition hover:-translate-y-1 hover:shadow-xl duration-300">
               <h3 className="text-2xl font-bold text-gray-800 mb-8 flex items-center">
                  <i className="fas fa-university mr-3 text-blue-600"></i>
                  {t('donate.bank.title')}
               </h3>

               <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">{t('donate.bank.bank_label')}</label>
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                          <i className="fas fa-landmark text-xl"></i>
                       </div>
                       <div>
                          <h5 className="font-bold text-xl text-gray-800">MB Bank</h5>
                          <span className="text-gray-500 text-sm">Ngân hàng Quân đội</span>
                       </div>
                    </div>
                  </div>

                  <div>
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">{t('donate.bank.account_number_label')}</label>
                     <div className="flex bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                        <input 
                           type="text" 
                           readOnly 
                           value="0974210249" 
                           className="flex-1 bg-transparent px-4 py-3 font-mono text-xl font-bold text-gray-800 focus:outline-none" 
                        />
                        <button 
                           onClick={() => copyToClipboard('0974210249', 'Copied account number!')}
                           className="px-6 bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 transition-colors"
                        >
                           {t('donate.bank.copy')}
                        </button>
                     </div>
                  </div>

                  <div>
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">{t('donate.bank.account_name_label')}</label>
                     <h4 className="text-2xl font-bold text-gray-800">PHAN NGOC TRIEU</h4>
                  </div>

                  <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">{t('donate.bank.content_label')}</label>
                      <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm">
                         <i className="fas fa-info-circle mr-2"></i> [Your Name] donate for TrieuMinistry
                      </div>
                  </div>
               </div>
            </div>

            {/* QR Code */}
             <div className="flex items-center justify-center">
               <div className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full text-center">
                  <h5 className="font-bold text-gray-500 mb-6 uppercase tracking-widest">{t('donate.qr.title')}</h5>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 inline-block mb-4">
                     <div className="relative w-48 h-48">
                        <Image 
                           src="/donate/personal_qr.jpg" 
                           alt="QR Code" 
                           fill
                           sizes="192px"
                           className="object-contain rounded-lg"
                        />
                     </div>
                  </div>
                  <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
                     <i className="fas fa-camera"></i>
                     {t('donate.qr.instruction')}
                  </p>
               </div>
             </div>
          </div>
          
           {/* Thank You Note */}
           <div className="mt-12 max-w-4xl mx-auto">
              <div className="bg-green-50 border-l-4 border-green-500 p-8 rounded-r-xl shadow-sm">
                 <div className="flex gap-4">
                    <i className="fas fa-quote-left text-4xl text-green-300"></i>
                    <div>
                       <h5 className="font-bold text-green-700 mb-2">{t('donate.thanks.title')}</h5>
                       <p className="text-gray-700 leading-relaxed italic">
                          {t('donate.thanks.content')}
                       </p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Ministry Appeals Section */}
      <section className="py-20 bg-gray-100">
         <div className="container container-custom">
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-10 gap-4">
               <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-bold text-gray-800 flex items-center">
                     <i className="fas fa-bullhorn mr-3 text-yellow-500"></i>
                     {t('donate.ministry.title')}
                  </h2>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold uppercase tracking-wide">
                     {t('donate.ministry.badge')}
                  </span>
               </div>
               <button 
                  onClick={() => setShowModal(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
               >
                  <i className="fas fa-envelope-open-text"></i>
                  {t('donate.ministry.request_btn')}
               </button>
            </div>
            
            {appeals.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {appeals.map((appeal) => (
                      <div key={appeal.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all group">
                         {/* Card Header */}
                         <div className="p-6 pb-4">
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('donate.ministry.appeal')}</span>
                                <span className="text-xs text-gray-400">
                                    {appeal.createdAt?.seconds ? new Date(appeal.createdAt.seconds * 1000).toLocaleDateString() : ''}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">{appeal.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs">
                                    <i className="fas fa-user"></i>
                                </div>
                                <span className="font-bold">{appeal.name}</span>
                            </div>
                            <p className="text-gray-600 text-sm line-clamp-3 mb-4">{appeal.content}</p>
                         </div>

                         {/* Funding Progress (Optional - simplified for now) */}
                         <div className="px-6 pb-6">
                             <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                 <div className="flex justify-between items-end">
                                     <div className="flex-1 mr-4">
                                         <div className="mb-3">
                                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest block mb-1">Raised</span>
                                            <span className="text-lg font-extrabold text-blue-600 block leading-none">
                                                {new Intl.NumberFormat(appeal.currency === 'USD' ? 'en-US' : 'vi-VN', { style: 'currency', currency: appeal.currency || 'VND' }).format(Number(appeal.currentAmount || 0))}
                                            </span>
                                         </div>
                                         <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                                            <div 
                                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
                                                style={{ width: `${Math.min(100, ((appeal.currentAmount || 0) / appeal.target) * 100)}%` }}
                                            ></div>
                                         </div>

                                         <div>
                                             <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest block mb-1">Target Goal</span>
                                             <span className="text-sm font-bold text-gray-900 block leading-none">
                                                 {new Intl.NumberFormat(appeal.currency === 'USD' ? 'en-US' : 'vi-VN', { style: 'currency', currency: appeal.currency || 'VND' }).format(Number(appeal.target || 0))}
                                             </span>
                                         </div>
                                     </div>
                                     <Link 
                                         href={`/ministry/appeals/${appeal.id}`} 
                                         className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-md group-hover:scale-110 duration-200"
                                     >
                                         <i className="fas fa-arrow-right"></i>
                                     </Link>
                                 </div>
                             </div>
                         </div>
                      </div>
                  ))}
               </div>
            ) : (
                <div className="text-center py-12 text-gray-400">
                    <p className="mb-4 text-6xl opacity-20"><i className="fas fa-inbox"></i></p>
                    <p>{t('donate.js_appeals.empty')}</p>
                </div>
            )}
         </div>
      </section>

      {/* Modal Overlay */}
      <CreateAppealModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </main>
  );
}
