"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';

export default function ProfilePage() {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    });

    const hiddenElements = document.querySelectorAll('.fade-in-up');
    hiddenElements.forEach((el) => observer.observe(el));

    return () => {
      hiddenElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <main className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-gray-900 to-blue-900 text-white py-20 lg:py-28 text-center relative overflow-hidden">
         <div className="absolute inset-0 bg-[url('/hero_bg.png')] bg-cover opacity-20 bg-center"></div>
         <div className="container container-custom relative z-10 fade-in-up">
             <h1 className="text-4xl md:text-6xl font-bold mb-4">{t('profile.hero.title')}</h1>
             <p className="text-lg md:text-2xl text-blue-100 max-w-2xl mx-auto">
                 {t('profile.hero.subtitle')}
             </p>
         </div>
      </section>

      {/* About Founder */}
      <section className="py-20 lg:py-24">
          <div className="container container-custom">
              <div className="flex flex-col lg:flex-row items-center gap-12 bg-white rounded-3xl">
                  <div className="lg:w-5/12 text-center fade-in-up">
                      <div className="relative inline-block">
                          <div className="w-72 h-72 rounded-full overflow-hidden border-8 border-white shadow-2xl relative z-10">
                              <Image 
                                 src="/profile/profile.jpg" 
                                 alt="Phan Ngoc Trieu" 
                                 fill
                                 className="object-cover"
                              />
                          </div>
                          <div className="absolute top-10 -right-4 w-20 h-20 bg-blue-100 rounded-full blur-xl z-0"></div>
                          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-yellow-100 rounded-full blur-xl z-0"></div>
                          
                          <div className="absolute bottom-6 right-0 bg-blue-600 text-white p-4 rounded-full shadow-lg z-20">
                              <i className="fas fa-quote-right text-xl"></i>
                          </div>
                      </div>
                  </div>
                  
                  <div className="lg:w-7/12 fade-in-up" style={{ animationDelay: '0.2s' }}>
                      <span className="text-blue-600 font-bold tracking-widest text-xs uppercase mb-2 block">
                          {t('profile.founder.label')}
                      </span>
                      <h2 className="text-4xl font-bold text-gray-900 mb-6">Phan Ngọc Triều</h2>
                      <blockquote className="text-xl text-gray-600 italic border-l-4 border-blue-200 pl-6 py-2 mb-6">
                          {t('profile.founder.quote')}
                      </blockquote>
                      
                      {/* Bio Content - Placeholder for now as it needs dynamic content from profile.js/json in legacy */}
                      <div className="text-gray-600 space-y-4 mb-8 text-justify leading-relaxed">
                          <p>
                              Sinh ra và lớn lên trong một gia đình Cơ Đốc, tôi đã sớm cảm nhận được tình yêu thương của Chúa. 
                              Tuy nhiên, hành trình đức tin thực sự bắt đầu khi tôi đối diện với những thử thách lớn trong cuộc sống.
                          </p>
                          <p>
                              Qua những năm tháng tôi luyện, Chúa đã đặt vào lòng tôi một khải tượng rõ ràng về việc xây dựng 
                              một cộng đồng nơi mọi người được khích lệ, trang bị và cùng nhau tăng trưởng trong ân điển.
                          </p>
                      </div>

                      <div className="flex gap-4">
                          <a href="https://www.facebook.com/trieu.phanngoc.31/" target="_blank" className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-all">
                              <i className="fab fa-facebook-f"></i>
                          </a>
                          <a href="https://www.youtube.com/@trieuphanngoc3549" target="_blank" className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-red-600 hover:border-red-600 hover:text-white transition-all">
                              <i className="fab fa-youtube"></i>
                          </a>
                          <a href="https://github.com/PhanNgocTrieu" target="_blank" className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-900 hover:border-gray-900 hover:text-white transition-all">
                              <i className="fab fa-github"></i>
                          </a>
                          <a href="mailto:phantrieu580@gmail.com" className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-green-600 hover:border-green-600 hover:text-white transition-all">
                              <i className="fas fa-envelope"></i>
                          </a>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* The Calling Section */}
      <section className="py-20 bg-gray-50">
          <div className="container container-custom max-w-4xl">
              <div className="text-center mb-12 fade-in-up">
                  <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">{t('profile.calling.title')}</h2>
                  <div className="w-20 h-1 bg-blue-600 mx-auto rounded-full"></div>
              </div>

              <div className="fade-in-up">
                  <div className={`bg-white p-8 md:p-12 rounded-2xl shadow-sm relative transition-[max-height] duration-700 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[3000px]' : 'max-h-[400px]'}`}>
                      <div className="font-serif text-lg leading-loose text-gray-700 space-y-6 text-justify">
                          <p>{t('profile.calling.content_1')}</p>
                          <p>{t('profile.calling.content_2')}</p>
                      </div>
                      
                      <div className={`absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white via-white/80 to-transparent transition-opacity duration-500 ${isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}></div>
                  </div>
              </div>
              
              <div className="text-center mt-8">
                  <button 
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="px-8 py-2 border-2 border-blue-600 text-blue-600 font-bold rounded-full hover:bg-blue-600 hover:text-white transition-colors"
                  >
                      {isExpanded ? 'Show Less' : t('common.read_more')} {isExpanded ? <i className="fas fa-chevron-up ml-2"></i> : <i className="fas fa-chevron-down ml-2"></i>}
                  </button>
              </div>
          </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20 lg:py-28">
          <div className="container container-custom">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Vision */}
                  <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-50 hover:-translate-y-2 transition-transform duration-300 fade-in-up items-center text-center">
                      <div className="w-16 h-16 mx-auto bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl mb-6">
                          <i className="fas fa-eye"></i>
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 mb-4">{t('profile.vision.title')}</h4>
                      <p className="text-gray-500 leading-relaxed">
                          {t('profile.vision.content')}
                      </p>
                  </div>

                  {/* Mission */}
                  <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-50 hover:-translate-y-2 transition-transform duration-300 fade-in-up items-center text-center" style={{ animationDelay: '0.1s' }}>
                      <div className="w-16 h-16 mx-auto bg-red-50 text-red-600 rounded-full flex items-center justify-center text-2xl mb-6">
                          <i className="fas fa-bullseye"></i>
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 mb-4">{t('profile.mission.title')}</h4>
                      <p className="text-gray-500 leading-relaxed">
                          {t('profile.mission.content')}
                      </p>
                  </div>

                  {/* Values */}
                  <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-50 hover:-translate-y-2 transition-transform duration-300 fade-in-up items-center text-center" style={{ animationDelay: '0.2s' }}>
                      <div className="w-16 h-16 mx-auto bg-green-50 text-green-600 rounded-full flex items-center justify-center text-2xl mb-6">
                          <i className="fas fa-heart"></i>
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 mb-4">{t('profile.values.title')}</h4>
                      <p className="text-gray-500 leading-relaxed">
                          {t('profile.values.content')}
                      </p>
                  </div>
              </div>
          </div>
      </section>
    </main>
  );
}
