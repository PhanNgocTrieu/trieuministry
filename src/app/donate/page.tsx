"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function DonatePage() {
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    target: '',
    title: '',
    content: '',
    bankName: '',
    bankAccount: '',
    bankOwner: ''
  });

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    alert(message); 
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        await addDoc(collection(db, "appeals"), {
            ...formData,
            status: "pending", 
            type: "user_request", // Explicitly mark as user request
            currentAmount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        alert("Your appeal request has been submitted successfully! We will review it shortly.");
        setShowModal(false);
        setFormData({
            name: '',
            phone: '',
            target: '',
            title: '',
            content: '',
            bankName: '',
            bankAccount: '',
            bankOwner: ''
        });
    } catch (error) {
        console.error("Error submitting appeal:", error);
        alert("Failed to submit appeal. Please try again.");
    } finally {
        setLoading(false);
    }
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
            
            <div className="text-center py-12 text-gray-400">
               <p className="mb-4 text-6xl opacity-20"><i className="fas fa-inbox"></i></p>
               <p>{t('donate.js_appeals.empty')}</p>
            </div>
         </div>
      </section>

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
           <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10 backdrop-blur-md rounded-t-2xl">
                 <h5 className="text-xl font-bold text-blue-600 flex items-center gap-2">
                    <i className="fas fa-paper-plane"></i>
                    {t('donate.form.title')}
                 </h5>
                 <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                    <i className="fas fa-times text-lg"></i>
                 </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-4">
                 <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-2">
                     <i className="fas fa-info-circle"></i>
                     {t('donate.form.warning')}
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('donate.form.name')}</label>
                        <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('donate.form.phone')}</label>
                        <input type="text" name="phone" required value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('donate.form.appeal_title')}</label>
                    <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                 </div>

                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('donate.form.target')}</label>
                    <input type="number" name="target" required value={formData.target} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                 </div>

                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('donate.form.content')}</label>
                    <textarea name="content" required rows={4} value={formData.content} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                 </div>

                 <div className="pt-4 border-t border-gray-100">
                    <h6 className="font-bold text-gray-700 mb-3">{t('donate.form.bank_info')}</h6>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input type="text" name="bankName" placeholder={t('donate.form.bank_name')} value={formData.bankName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                        <input type="text" name="bankAccount" placeholder={t('donate.form.bank_account')} value={formData.bankAccount} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                        <input type="text" name="bankOwner" placeholder={t('donate.form.bank_owner')} value={formData.bankOwner} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                 </div>

                 <div className="pt-4 flex justify-end gap-3">
                    <button 
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                    >
                        {t('donate.form.cancel')}
                    </button>
                    <button 
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-sm disabled:bg-gray-400"
                    >
                        {loading ? 'Sending...' : t('donate.form.send')}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </main>
  );
}
