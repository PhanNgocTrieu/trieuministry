"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function MinistryPage() {
  const { t } = useLanguage();

  useEffect(() => {
    // Animation trigger
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

  // Temporary static data for demonstration - will be dynamic in Phase 4/5
  const prayers = [
    {
      id: 1,
      title: "Cầu nguyện cho chức vụ mới",
      date: "23/12/2025",
      content: "Xin Chúa ban ơn và dẫn dắt trong giai đoạn bắt đầu mục vụ trọn thời gian..."
    },
    {
      id: 2,
      title: "Cầu nguyện cho tài chính",
      date: "20/12/2025",
      content: "Xin Chúa chu cấp tài chính cho các dự án sắp tới..."
    }
  ];

  const letters = [
    {
      id: 1,
      title: "Thư ngỏ: Gây dựng quỹ học bổng",
      content: "Kêu gọi sự ủng hộ cho quỹ học bổng dành cho sinh viên vùng cao...",
      link: "#"
    },
    {
      id: 2,
      title: "Lời cảm ơn tháng 12",
      content: "Cảm tạ Chúa và tri ân các ân nhân đã đồng hành trong tháng qua...",
      link: "#"
    }
  ];

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="container container-custom text-center fade-in-up">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('ministry.hero.title')}</h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
            {t('ministry.hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Prayer Requests */}
            <div className="fade-in-up">
              <div className="bg-white rounded-xl shadow-sm h-full p-6 md:p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl mr-4">
                    <i className="fas fa-praying-hands"></i>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">{t('ministry.prayers.title')}</h3>
                </div>
                <p className="text-gray-500 mb-6">
                  {t('ministry.prayers.description')}
                </p>

                <div className="space-y-4">
                  {prayers.map((prayer) => (
                    <div key={prayer.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500 hover:bg-blue-50 transition-colors">
                      <h5 className="font-bold text-gray-800 mb-1">{prayer.title}</h5>
                      <small className="text-gray-400 block mb-2 flex items-center">
                        <i className="far fa-calendar-alt mr-2"></i>
                        {prayer.date}
                      </small>
                      <p className="text-gray-600 text-sm">{prayer.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Letters/Appeals */}
            <div className="fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="bg-white rounded-xl shadow-sm h-full p-6 md:p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-xl mr-4">
                    <i className="fas fa-envelope-open-text"></i>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">{t('ministry.letters.title')}</h3>
                </div>
                <p className="text-gray-500 mb-6">
                  {t('ministry.letters.description')}
                </p>

                <div className="space-y-4">
                  {letters.map((letter) => (
                    <div key={letter.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-white">
                      <h5 className="text-lg font-bold text-blue-600 mb-2">{letter.title}</h5>
                      <p className="text-gray-500 text-sm mb-4">
                        {letter.content}
                      </p>
                      <Link href={letter.link} className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 border border-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-full transition-colors">
                        Read Letter
                        <i className="fas fa-arrow-right ml-2"></i>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
