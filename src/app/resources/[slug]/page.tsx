"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound, useParams } from 'next/navigation';
import { allMockResources } from '@/data/mockResources';
import { useLanguage } from '@/context/LanguageContext';

export default function ResourceDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { t } = useLanguage();
  // Fallback find by slug
  const resource = allMockResources.find(r => r.slug === slug);

  if (!resource) {
      return notFound();
  }

  return (
    <main className="bg-gray-50 min-h-screen pb-20">
        {/* Breadcrumb Navigation */}
        <section className="bg-white border-b border-gray-200 py-4 pt-24">
            <div className="container container-custom px-4">
                <div className="text-sm text-gray-500 font-medium flex items-center gap-2">
                    <Link href="/resources" className="hover:text-blue-600">{t('resources.detail.breadcrumb')}</Link>
                    <i className="fas fa-chevron-right text-xs text-gray-300"></i>
                    <span className="text-gray-900">{resource.title}</span>
                </div>
            </div>
        </section>

        <section className="container container-custom max-w-5xl mx-auto py-12 px-4">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex flex-col md:flex-row">
                {/* Left: Cover Image */}
                <div className="hidden md:block w-1/3 min-h-[400px] bg-gray-100 relative">
                     <Image 
                        src={resource.coverImage} 
                        alt={resource.title}
                        fill
                        className="object-cover"
                     />
                </div>
                
                {/* Mobile Cover */}
                <div className="md:hidden w-full h-64 relative">
                     <Image 
                        src={resource.coverImage} 
                        alt={resource.title}
                        fill
                        className="object-cover"
                     />
                </div>

                {/* Right: Info */}
                <div className="flex-1 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
                    <div className="flex items-center gap-4 mb-6">
                        <span className="bg-blue-100 text-blue-600 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider">
                            {resource.category}
                        </span>
                        <span className="text-gray-400 text-sm font-medium">
                            <i className="far fa-calendar-alt mr-2"></i> {resource.date}
                        </span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                        {resource.title}
                    </h1>

                    <p className="text-gray-600 text-lg leading-relaxed mb-8">
                        {resource.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-6 mb-10 text-sm text-gray-500 border-t border-b border-gray-100 py-6">
                        <div className="flex items-center gap-2">
                            <i className="fas fa-user-circle text-gray-400 text-lg"></i>
                            <span>{t('resources.detail.author')} <strong className="text-gray-900">{resource.author}</strong></span>
                        </div>
                        <div className="w-px h-4 bg-gray-300 hidden sm:block"></div>
                        <div className="flex items-center gap-2">
                             <i className="fas fa-file-pdf text-red-400 text-lg"></i>
                             <span>{t('resources.detail.format')} <strong className="text-gray-900">PDF</strong></span>
                        </div>
                        <div className="w-px h-4 bg-gray-300 hidden sm:block"></div>
                        <div className="flex items-center gap-2">
                             <i className="fas fa-hdd text-gray-400 text-lg"></i>
                             <span>{t('resources.detail.size')} <strong className="text-gray-900">{resource.size || '300 KB'}</strong></span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <a 
                            href={resource.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-center hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-3"
                        >
                            <i className="fas fa-download"></i> {t('resources.detail.download')}
                        </a>
                        <button 
                            onClick={() => window.open(resource.fileUrl, '_blank')}
                            className="bg-white border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-bold text-center hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center justify-center gap-3"
                        >
                            <i className="far fa-eye"></i> {t('resources.detail.preview')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Warning / Note */}
            <div className="mt-8 text-center bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-blue-800 text-sm">
                    <i className="fas fa-info-circle mr-2"></i>
                    {t('resources.detail.login_note')}
                </p>
            </div>
        </section>
    </main>
  );
}
