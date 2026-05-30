"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import AmbientBackground from "@/components/ui/AmbientBackground";
import TiltCard from "@/components/ui/TiltCard";

type TabType = "founder" | "calling" | "vision" | "mission" | "values" | "heart";

const TABS: { id: TabType; icon: string; labelKey: string }[] = [
  { id: "founder", icon: "fa-user-tie", labelKey: "profile.founder.label" },
  { id: "calling", icon: "fa-envelope-open-text", labelKey: "profile.calling.title" },
  { id: "heart", icon: "fa-hand-holding-heart", labelKey: "profile.heart.title" },
  { id: "vision", icon: "fa-eye", labelKey: "profile.vision.title" },
  { id: "mission", icon: "fa-bullseye", labelKey: "profile.mission.title" },
  { id: "values", icon: "fa-bible", labelKey: "profile.values.title" },
];

const SOCIAL_LINKS = [
  { href: "https://www.facebook.com/trieu.phanngoc.31/", icon: "fab fa-facebook-f", label: "Facebook", hover: "hover:bg-[#1877F2]" },
  { href: "https://www.youtube.com/@trieuphanngoc3549", icon: "fab fa-youtube", label: "YouTube", hover: "hover:bg-red-600" },
  { href: "mailto:phantrieu580@gmail.com", icon: "fas fa-envelope", label: "Email", hover: "hover:bg-blue-700" },
];

/** Shared 2-column grid: left rail (240px) + main content — used in hero & tabs */
const PAGE_GRID = "max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-8 lg:gap-10 lg:items-start";

const BODY_TEXT = "text-slate-600 dark:text-slate-400 leading-[1.85] text-base md:text-[1.05rem] text-left";

export default function ProfilePage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>("founder");
  const age = new Date().getFullYear() - 1999;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("active");
        });
      },
      { threshold: 0.08 }
    );
    document.querySelectorAll(".fade-in-up").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] transition-colors duration-300 pb-24">

      {/* Hero */}
      <section className="relative pt-28 pb-16 md:pt-32 md:pb-20 overflow-hidden">
        <AmbientBackground variant="hero" />

        <div className="container container-custom relative z-10">
          <div className={`${PAGE_GRID} fade-in-up`}>

            {/* Left rail — portrait (aligns with sidebar below) */}
            <div className="flex justify-center lg:justify-start lg:pt-1">
              <div className="relative shrink-0">
                <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-blue-600/20 via-teal-500/10 to-cyan-500/20 dark:from-blue-500/25 dark:via-teal-400/15 blur-sm" />
                <div className="relative w-40 h-40 sm:w-44 sm:h-44 lg:w-[208px] lg:h-[208px] rounded-[1.75rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl shadow-blue-900/10 dark:shadow-black/40">
                  <Image
                    src="/profile/profile.jpg"
                    alt="Phan Ngoc Trieu"
                    fill
                    sizes="208px"
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
                  <i className="fas fa-cross text-xs" />
                </div>
              </div>
            </div>

            {/* Main intro */}
            <div className="min-w-0 text-center lg:text-left">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-3d text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
                </span>
                TrieuMinistry
              </span>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-2 tracking-tight leading-tight">
                Phan Ngọc Triều
              </h1>

              <p className="text-blue-700 dark:text-blue-400 font-bold text-xs sm:text-sm uppercase tracking-[0.18em] mb-4">
                {t("profile.founder.role")} · {t("profile.founder.label")}
              </p>

              <p className={`${BODY_TEXT} mb-5`}>
                {t("profile.hero.subtitle")}
              </p>

              <blockquote className="mb-6 px-5 py-4 rounded-2xl glass-3d border border-blue-200/40 dark:border-blue-500/20 text-left">
                <p className="text-slate-700 dark:text-slate-300 italic text-base leading-[1.75]">
                  {t("profile.founder.quote")}
                </p>
              </blockquote>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 mb-5">
                {SOCIAL_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target={link.href.startsWith("mailto") ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-sm font-semibold border border-slate-200 dark:border-white/10 ${link.hover} hover:text-white hover:border-transparent transition-all`}
                  >
                    <i className={`${link.icon} w-4 text-center`} />
                    {link.label}
                  </a>
                ))}
              </div>

              <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                {[
                  { icon: "fa-praying-hands", label: t("profile.calling.title") },
                  { icon: "fa-eye", label: t("profile.vision.title") },
                  { icon: "fa-bullseye", label: t("profile.mission.title") },
                ].map((pill) => (
                  <span
                    key={pill.label}
                    className="stat-pill-3d inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300"
                  >
                    <i className={`fas ${pill.icon} text-blue-600 dark:text-blue-400 w-4 text-center`} />
                    {pill.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider — spaced from hero & content below */}
      <div className="container container-custom py-6 md:py-8">
        <div className="max-w-6xl mx-auto p-4">
          <div
            className="h-px bg-slate-200/80 dark:bg-white/10"
            role="separator"
            aria-hidden
          />
        </div>
      </div>

      {/* Tabs + content — same grid as hero */}
      <div className="container container-custom pt-10 md:pt-14 pb-10 md:pb-14">
        <div className={`${PAGE_GRID}`}>

          {/* Sidebar — aligns with portrait column */}
          <aside className="fade-in-up lg:sticky lg:top-28">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 px-1 text-center lg:text-left">
              {t("profile.hero.title")}
            </p>
            <nav className="glass-3d p-1.5 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible hide-scrollbar rounded-2xl">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap lg:w-full text-left ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-lg shadow-blue-600/25"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <i
                    className={`fas ${tab.icon} w-5 shrink-0 text-center ${
                      activeTab === tab.id ? "text-white" : "text-blue-600 dark:text-blue-400"
                    }`}
                  />
                  <span className="truncate">{t(tab.labelKey)}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Content panel — aligns with hero intro column */}
          <div className="min-w-0 fade-in-up">
            <TiltCard className="p-6 sm:p-8 md:p-10" maxTilt={3}>
              {activeTab === "founder" && (
                <TabPanel>
                  <TabHeader icon="fa-user-tie" title={t("profile.founder.label")} subtitle={t("profile.founder.role")} />
                  <p className={`${BODY_TEXT} mb-8`}>
                    {t("profile.founder.bio").replace("{{age}}", String(age))}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(t("profile.founder.highlights") as unknown as { icon: string; label: string; sub: string }[]).map((item) => (
                      <div
                        key={item.label}
                        className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/8 h-full"
                      >
                        <span className="icon-3d w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shrink-0 text-sm">
                          <i className={`fas ${item.icon}`} />
                        </span>
                        <div className="min-w-0 pt-0.5">
                          <p className="font-bold text-slate-900 dark:text-white text-sm leading-snug">{item.label}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">{item.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabPanel>
              )}

              {activeTab === "calling" && (
                <TabPanel>
                  <TabHeader icon="fa-envelope-open-text" title={t("profile.calling.title")} />
                  <div className={`space-y-5 ${BODY_TEXT}`}>
                    <p>{t("profile.calling.content_1")}</p>
                    <p>{t("profile.calling.content_2")}</p>
                  </div>
                  <div className="mt-8 py-7 px-6 rounded-2xl bg-gradient-to-br from-blue-50 to-teal-50/50 dark:from-blue-950/40 dark:to-slate-900/60 border border-blue-100 dark:border-blue-500/20 text-left">
                    <p className="text-xl md:text-2xl font-black text-blue-800 dark:text-blue-300 italic leading-snug">
                      &ldquo;Here I am, Lord. Send me!&rdquo;
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Isaiah 6:8</p>
                  </div>
                </TabPanel>
              )}

              {activeTab === "heart" && (
                <TabPanel>
                  <TabHeader icon="fa-hand-holding-heart" title={t("profile.heart.title")} />
                  <div className="space-y-3">
                    {(t("profile.heart.items") as unknown as string[]).map((item, index) => (
                      <ListItem key={index} index={index + 1}>
                        {item}
                      </ListItem>
                    ))}
                  </div>
                </TabPanel>
              )}

              {activeTab === "vision" && (
                <TabPanel>
                  <TabHeader icon="fa-eye" title={t("profile.vision.title")} />
                  <p className={BODY_TEXT}>{t("profile.vision.content")}</p>
                </TabPanel>
              )}

              {activeTab === "mission" && (
                <TabPanel>
                  <TabHeader icon="fa-bullseye" title={t("profile.mission.title")} />
                  <p className={BODY_TEXT}>{t("profile.mission.content")}</p>
                </TabPanel>
              )}

              {activeTab === "values" && (
                <TabPanel>
                  <TabHeader icon="fa-bible" title={t("profile.values.title")} />
                  <div className="space-y-3">
                    {(t("profile.values.items") as unknown as { title: string; content: string }[]).map(
                      (value, index) => (
                        <div
                          key={index}
                          className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/8"
                        >
                          <h5 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-teal-500 text-white flex items-center justify-center shrink-0 text-xs font-black">
                              {index + 1}
                            </span>
                            <span className="leading-snug">{value.title}</span>
                          </h5>
                          <p className={`${BODY_TEXT} pl-11`}>{value.content}</p>
                        </div>
                      )
                    )}
                  </div>
                </TabPanel>
              )}
            </TiltCard>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabPanel({ children }: { children: React.ReactNode }) {
  return <div className="animate-fadeIn">{children}</div>;
}

function TabHeader({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-4 mb-7 pb-5 border-b border-slate-200 dark:border-white/10">
      <div className="icon-3d w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-lg shrink-0">
        <i className={`fas ${icon}`} />
      </div>
      <div className="min-w-0">
        <h4 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          {title}
        </h4>
        {subtitle && (
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function ListItem({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 items-start p-5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/8">
      <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-teal-500 text-white flex items-center justify-center shrink-0 text-xs font-black">
        {index}
      </span>
      <p className={`${BODY_TEXT} flex-1 min-w-0 !text-[0.98rem] md:!text-[1.02rem]`}>{children}</p>
    </div>
  );
}
