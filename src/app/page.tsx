"use client";

import React, { useEffect } from 'react';
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import AmbientBackground from "@/components/ui/AmbientBackground";
import TiltCard from "@/components/ui/TiltCard";

function stripWrappingQuotes(text: string) {
  return text.replace(/^["'""「]|["'""」]$/g, "").trim();
}

export default function Home() {
  const { t } = useLanguage();

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1 });

    const hiddenElements = document.querySelectorAll('.fade-in-up');
    hiddenElements.forEach((el) => observer.observe(el));

    return () => {
      hiddenElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <main className="overflow-hidden">
      {/* Hero Section */}
      <header className="relative min-h-[92vh] flex items-center justify-center text-center px-4 overflow-hidden pt-20 perspective-container">
        <AmbientBackground variant="hero" />

        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,700px)] h-[min(90vw,700px)] rounded-full border border-blue-600/10 dark:border-blue-500/10 animate-pulse-slow" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(70vw,500px)] h-[min(70vw,500px)] rounded-full border border-blue-700/10 dark:border-blue-600/10" style={{ animation: "pulse-slow 8s ease-in-out infinite reverse" }} />
        </div>

        <div className="container container-custom relative z-10 fade-in-up">
          <div className="max-w-5xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-3d shadow-lg mb-8 hover:scale-105 transition-transform cursor-default group">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-r from-blue-600 to-teal-500" />
              </span>
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300 tracking-wide uppercase">
                Faith • Hope • Love
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight leading-[0.95]">
              <span className="text-slate-900 dark:text-white">{t('home.hero.title')}</span>
              <span className="text-aurora text-glow">.</span>
            </h1>

            <p className="text-lg md:text-xl mb-12 text-slate-500 dark:text-slate-400 leading-relaxed font-medium max-w-2xl mx-auto">
              {t('home.hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto">
              <Link href="/donate" className="btn-3d">
                <i className="fas fa-heart" />
                <span>{t('home.hero.cta_donate')}</span>
              </Link>
              <Link href="/resources" className="btn-3d btn-3d-outline">
                <i className="fas fa-book-open text-blue-700 dark:text-blue-500" />
                <span>{t('nav.resources')}</span>
              </Link>
            </div>

            <div className="mt-16 flex flex-wrap justify-center gap-8 md:gap-12">
              {[
                { value: "100+", label: "Lives Touched", icon: "fa-users" },
                { value: "24/7", label: "Prayer Support", icon: "fa-praying-hands" },
                { value: "∞", label: "God's Love", icon: "fa-heart" },
              ].map((stat) => (
                <div key={stat.label} className="stat-pill-3d px-6 py-4 text-center min-w-[120px]">
                  <div className="icon-3d w-10 h-10 mx-auto mb-2 bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-500 rounded-xl">
                    <i className={`fas ${stat.icon}`} />
                  </div>
                  <div className="text-2xl font-black text-aurora">{stat.value}</div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce-subtle text-slate-400">
          <i className="fas fa-chevron-down text-xl" />
        </div>
      </header>

      {/* Mission Bento Grid */}
      <section className="py-28 relative border-t border-slate-200/80 dark:border-white/5">
        <AmbientBackground variant="section" className="opacity-50" />

        <div className="container container-custom relative z-10">
          <div className="text-center mb-20 fade-in-up max-w-3xl mx-auto">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-500 mb-4">
              Our Mission
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
              {t('home.mission.title')}
            </h2>
            <div className="h-1.5 w-20 bg-gradient-to-r from-blue-700 via-teal-500 to-cyan-500 rounded-full mx-auto shadow-lg shadow-blue-600/30" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-2 gap-6 h-auto md:h-[580px] perspective-container">
            <TiltCard className="md:row-span-2 p-8 flex flex-col justify-between group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-700/10 dark:bg-blue-700/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="icon-3d w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-700 text-white text-2xl mb-6">
                  <i className="fas fa-users" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 leading-tight">
                  {t('home.mission.mission_1.title')}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                  {t('home.mission.mission_1.content')}
                </p>
              </div>
              <div className="relative z-10 mt-6">
                <span className="text-blue-700 dark:text-blue-500 font-bold text-sm flex items-center gap-2 group-hover:gap-4 transition-all">
                  Learn More <i className="fas fa-long-arrow-alt-right" />
                </span>
              </div>
            </TiltCard>

            <TiltCard className="md:col-span-2 p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 group overflow-hidden" maxTilt={8}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-teal-600 to-blue-800 animate-gradient opacity-100" />
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

              <div className="relative z-10 flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-4 backdrop-blur-md border border-white/20">
                  <i className="fas fa-star text-amber-300" /> Featured Ministry
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 text-glow">
                  {t('home.mission.mission_2.title')}
                </h3>
                <p className="text-white/85 text-base leading-relaxed mb-6 max-w-lg">
                  {t('home.mission.mission_2.content')}
                </p>
              </div>
              <div className="relative z-10 w-full md:w-1/3 flex justify-center">
                <div className="w-32 h-32 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-xl border border-white/30 text-5xl text-white shadow-2xl shadow-blue-900/30 animate-float-3d">
                  <i className="fas fa-praying-hands" />
                </div>
              </div>
            </TiltCard>

            <TiltCard className="p-8 group" maxTilt={10}>
              <div className="icon-3d w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white text-xl mb-4">
                <i className="fas fa-hand-holding-heart" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {t('home.mission.mission_3.title')}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                {t('home.mission.mission_3.content')}
              </p>
            </TiltCard>

            <TiltCard className="p-8 flex items-center justify-center text-center group bg-gradient-to-br from-slate-100 to-blue-50 dark:from-slate-800 dark:to-blue-950/50" maxTilt={8}>
              <div>
                <div className="text-5xl font-black text-aurora mb-1">100+</div>
                <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs">
                  Lives Touched
                </p>
              </div>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* Daily Verse */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-950 z-0" />
        <div
          className="absolute inset-0 z-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <AmbientBackground variant="subtle" className="opacity-40" />

        <div className="container container-custom relative z-10 fade-in-up">
          <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-blue-500 mb-10">
            Daily Scripture
          </p>

          <div className="max-w-4xl mx-auto relative">
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-blue-600/40 via-slate-600/20 to-teal-600/30 blur-sm" />

            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 via-blue-700 to-teal-600" />

              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 px-8 py-12 md:px-14 md:py-16">
                <div className="flex justify-center mb-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center text-blue-400">
                    <i className="fas fa-book-open text-lg" />
                  </div>
                </div>

                <span
                  className="block text-center text-7xl md:text-8xl font-serif text-blue-600/20 leading-none select-none -mb-4"
                  aria-hidden
                >
                  &ldquo;
                </span>

                <blockquote className="relative text-lg md:text-xl lg:text-2xl text-slate-200 leading-[1.75] font-normal text-center max-w-3xl mx-auto mb-10">
                  {stripWrappingQuotes(t("home.daily_verse.content"))}
                </blockquote>

                <footer className="flex items-center justify-center gap-4">
                  <div className="h-px w-16 bg-gradient-to-r from-transparent to-blue-600/60" />
                  <cite className="text-sm font-bold text-blue-400 uppercase tracking-[0.2em] not-italic px-5 py-2 rounded-full bg-blue-600/10 border border-blue-600/25">
                    {t("home.daily_verse.citation")}
                  </cite>
                  <div className="h-px w-16 bg-gradient-to-l from-transparent to-blue-600/60" />
                </footer>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 border-t border-slate-200/80 dark:border-white/5 relative">
        <div className="container container-custom fade-in-up">
          <TiltCard className="p-8 md:p-12 max-w-5xl mx-auto" maxTilt={6}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="md:w-1/2 text-center md:text-left">
                <div className="icon-3d w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-500 text-xl mb-4 inline-flex">
                  <i className="fas fa-paper-plane" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">
                  {t('home.newsletter.title')}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t('home.newsletter.description')}
                </p>
              </div>

              <div className="md:w-1/2 w-full">
                <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
                  <input
                    type="email"
                    placeholder={t('home.newsletter.placeholder')}
                    className="form-input flex-1 rounded-2xl"
                    required
                  />
                  <button type="submit" className="btn-3d whitespace-nowrap">
                    Subscribe
                  </button>
                </form>
                <p className="text-xs text-slate-400 mt-3 flex items-center justify-center md:justify-start gap-1">
                  <i className="fas fa-shield-alt" /> {t('home.newsletter.note')}
                </p>
              </div>
            </div>
          </TiltCard>
        </div>
      </section>
    </main>
  );
}
