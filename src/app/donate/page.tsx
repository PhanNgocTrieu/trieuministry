"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { useModal } from '@/context/ModalContext';
import AmbientBackground from '@/components/ui/AmbientBackground';
import TiltCard from '@/components/ui/TiltCard';

interface FundraisingAppeal {
  id: string;
  title: string;
  titleEn: string;
  description?: string;
  descriptionEn?: string;
  pdfUrl?: string;
  pdfUrlEn?: string;
  coverImage?: string;
  folderName: string;
}

const ACCOUNT_NUMBER = '0974210249';
const ACCOUNT_HOLDER = 'PHAN NGOC TRIEU';
const BANK_NAME = 'MB Bank';

export default function DonatePage() {
  const { t, language } = useLanguage();
  const { showAlert } = useModal();

  const [appeals, setAppeals] = useState<FundraisingAppeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [qrSrc, setQrSrc] = useState('/donate/personal_qr.jpg');

  useEffect(() => {
    fetch('/api/appeals/fundraising')
      .then((res) => res.json())
      .then((data) => {
        setAppeals(data.appeals || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching fundraising appeals:', error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('active');
      });
    }, { threshold: 0.08 });

    document.querySelectorAll('.fade-in-up').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading]);

  const getContent = (vi: string | undefined, en: string | undefined) => {
    if (language === 'en' && en && en.trim().length > 0) return en;
    return vi || '';
  };

  const copyToClipboard = async (text: string, field: string, alertTitle: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      showAlert(alertTitle, text);
    } catch {
      showAlert('Error', 'Could not copy to clipboard.');
    }
  };

  const latestAppealId = appeals.length > 0 ? appeals[0].id : null;

  return (
    <div className="bg-[var(--background)] text-[var(--text-primary)] min-h-screen transition-colors duration-300">

      {/* Hero */}
      <section className="relative pt-28 pb-20 md:pt-32 md:pb-28 overflow-hidden border-b border-[var(--border-color)]">
        <AmbientBackground variant="hero" />

        <div className="container container-custom relative z-10">
          <div className="max-w-3xl mx-auto text-center fade-in-up">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-3d text-blue-700 dark:text-blue-400 text-sm font-bold mb-6">
              <i className="fas fa-heart text-amber-500" />
              {t('donate.hero.badge')}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
              {t('donate.hero.title')}
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-10">
              {t('donate.hero.subtitle')}
            </p>

            <blockquote className="text-left md:text-center px-6 py-5 rounded-2xl glass-3d border border-blue-200/50 dark:border-blue-500/20">
              <p className="italic text-slate-700 dark:text-slate-300 text-base md:text-lg leading-relaxed">
                {t('donate.verse.content')}
              </p>
              <cite className="block text-sm font-bold text-blue-700 dark:text-blue-400 mt-3 not-italic">
                {t('donate.verse.address')}
              </cite>
            </blockquote>
          </div>
        </div>
      </section>

      {/* Appeal intro + Bank details */}
      <section className="py-20 md:py-28 relative">
        <AmbientBackground variant="section" className="opacity-40" />

        <div className="container container-custom relative z-10 space-y-12">
          <div className="max-w-3xl mx-auto text-center fade-in-up">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400 mb-3">
              {t('donate.appeal.title')}
            </span>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              {t('donate.appeal.content')}
            </p>
          </div>

          <div className="max-w-4xl mx-auto fade-in-up">
            <TiltCard className="p-6 md:p-10" maxTilt={6}>
              <div className="absolute top-0 right-0 w-72 h-72 bg-blue-600/10 dark:bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

              <div className="relative z-10">
                <div className="flex flex-wrap items-center gap-3 mb-8">
                  <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
                    {t('donate.personal.badge')}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                    {t('donate.personal.title')}
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                  <div className="flex flex-col items-center">
                    <div className="w-full max-w-[260px] p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 shadow-sm">
                      <div className="aspect-square rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 relative overflow-hidden">
                        <Image
                          src={qrSrc}
                          alt={t('donate.qr.title')}
                          fill
                          className="object-cover"
                          onError={() => setQrSrc('/qr-placeholder.svg')}
                        />
                      </div>
                      <p className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mt-3 tracking-widest">
                        {t('donate.qr.title')}
                      </p>
                      <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {t('donate.qr.instruction')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      {t('donate.bank.title')}
                    </p>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">
                          {t('donate.bank.bank_label')}
                        </label>
                        <p className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                          <span className="icon-3d w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-sm">
                            <i className="fas fa-university" />
                          </span>
                          {BANK_NAME}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">
                          {t('donate.bank.account_number_label')}
                        </label>
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="text-2xl font-mono font-bold text-slate-900 dark:text-white tracking-wider">
                            {ACCOUNT_NUMBER}
                          </p>
                          <button
                            onClick={() => copyToClipboard(ACCOUNT_NUMBER, 'account', t('donate.bank.copy'))}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                              copiedField === 'account'
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400'
                            }`}
                          >
                            <i className={`fas ${copiedField === 'account' ? 'fa-check' : 'fa-copy'}`} />
                            {t('donate.bank.copy')}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">
                          {t('donate.bank.account_name_label')}
                        </label>
                        <p className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                          {ACCOUNT_HOLDER}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">
                          {t('donate.bank.content_label')}
                        </label>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          Donation / Dâng hiến
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* Fundraising appeal letters (PDF from filesystem) */}
      <section className="py-20 md:py-28 border-t border-[var(--border-color)] bg-slate-50/80 dark:bg-slate-900/30 relative">
        <AmbientBackground variant="section" className="opacity-30" />

        <div className="container container-custom relative z-10">
          <div className="mb-12 fade-in-up">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
              {t('donate.ministry.badge')}
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
              {t('donate.ministry.title')}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              {t('donate.ministry.appeal')}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-20 fade-in-up">
              <div className="loading-spinner mb-4 mx-auto" />
              <p className="text-slate-500 dark:text-slate-400">Loading...</p>
            </div>
          ) : appeals.length === 0 ? (
            <div className="text-center py-20 px-6 rounded-3xl glass-3d border border-dashed border-slate-300 dark:border-slate-700 fade-in-up max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-5 text-slate-400 dark:text-slate-500">
                <i className="fas fa-file-pdf text-2xl" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {t('donate.js_appeals.empty')}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('donate.fundraising.empty_hint')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
              {appeals.map((appeal) => {
                const isLatest = appeal.id === latestAppealId;
                const title = getContent(appeal.title, appeal.titleEn);
                const description = getContent(appeal.description, appeal.descriptionEn);
                const primaryPdf =
                  language === 'en' && appeal.pdfUrlEn ? appeal.pdfUrlEn : appeal.pdfUrl || appeal.pdfUrlEn;
                const hasVi = !!appeal.pdfUrl;
                const hasEn = !!appeal.pdfUrlEn;

                return (
                  <article
                    key={appeal.id}
                    className={`premium-card flex flex-col h-full overflow-hidden fade-in-up group ${
                      isLatest
                        ? 'ring-2 ring-blue-500/60 dark:ring-blue-400/50'
                        : ''
                    }`}
                  >
                    <div className="h-44 relative overflow-hidden bg-gradient-to-br from-blue-100 to-teal-50 dark:from-slate-800 dark:to-slate-900">
                      {appeal.coverImage ? (
                        <img
                          src={appeal.coverImage}
                          alt={title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-16 h-16 rounded-2xl bg-white/80 dark:bg-slate-800/80 flex items-center justify-center text-red-500 dark:text-red-400 shadow-lg">
                            <i className="fas fa-file-pdf text-3xl" />
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      {isLatest && (
                        <div className="absolute top-3 right-3">
                          <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg">
                            {t('donate.fundraising.latest')}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 leading-snug">
                        {title}
                      </h3>

                      {description && (
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-3 mb-5 flex-1">
                          {description}
                        </p>
                      )}

                      {primaryPdf && (
                        <a
                          href={primaryPdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-400 hover:underline mb-4"
                        >
                          <i className="fas fa-external-link-alt text-xs" />
                          {t('donate.fundraising.read_pdf')}
                        </a>
                      )}

                      <div className="mt-auto pt-4 border-t border-slate-200 dark:border-white/10 flex gap-2">
                        {hasVi && (
                          <a
                            href={appeal.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/25 hover:text-blue-700 dark:hover:text-blue-400 text-sm font-semibold transition-colors"
                          >
                            <i className="fas fa-download text-xs" />
                            {t('donate.fundraising.download_vi')}
                          </a>
                        )}
                        {hasEn && (
                          <a
                            href={appeal.pdfUrlEn}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/25 hover:text-blue-700 dark:hover:text-blue-400 text-sm font-semibold transition-colors"
                          >
                            <i className="fas fa-download text-xs" />
                            {t('donate.fundraising.download_en')}
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Thank you */}
      <section className="py-20 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 dark:from-slate-950 dark:via-blue-950/80 dark:to-slate-950" />
        <AmbientBackground variant="subtle" className="opacity-30" />

        <div className="container container-custom relative z-10">
          <div className="max-w-3xl mx-auto text-center fade-in-up">
            <div className="icon-3d w-14 h-14 rounded-2xl bg-white/10 text-amber-400 text-xl mx-auto mb-6">
              <i className="fas fa-praying-hands" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-5">
              {t('donate.thanks.title')}
            </h2>
            <p className="text-slate-300 leading-relaxed mb-6">
              {t('donate.thanks.content')}
            </p>
            <p className="text-slate-400 text-sm leading-relaxed italic border-t border-white/10 pt-6">
              {t('donate.appeal.closing')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
