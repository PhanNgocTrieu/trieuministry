"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import RoleGuard from "@/components/RoleGuard";

const navSections = [
  {
    title: "Personal",
    items: [
      { href: "/admin", label: "Dashboard", icon: "fa-tachometer-alt", exact: true },
      { href: "/admin/appeals", label: "Appeals", icon: "fa-envelope-open-text" },
      { href: "/admin/sponsors", label: "Sponsors", icon: "fa-hand-holding-heart" },
      { href: "/admin/goals", label: "Goals", icon: "fa-bullseye" },
      { href: "/admin/discipline", label: "Discipline", icon: "fa-dumbbell" },
      { href: "/admin/tasks", label: "Tasks", icon: "fa-tasks" },
      { href: "/admin/expenses", label: "My Expenses", icon: "fa-coins" },
      { href: "/admin/bibleschedule", label: "Bible Schedule", icon: "fa-calendar-check" },
    ],
  },
  {
    title: "Management",
    items: [
      { href: "/admin/users", label: "Users", icon: "fa-users" },
      { href: "/admin/wallets", label: "Wallets", icon: "fa-wallet" },
      { href: "/admin/settings", label: "Settings", icon: "fa-cogs" },
    ],
  },
];

function getPageTitle(pathname: string) {
  for (const section of navSections) {
    for (const item of section.items) {
      if (item.exact ? pathname === item.href : pathname.startsWith(item.href)) {
        return item.label;
      }
    }
  }
  return "Admin";
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const pageTitle = getPageTitle(pathname ?? "/admin");

  const isLinkActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname?.startsWith(href + "/");

  return (
    <RoleGuard requireRole="admin">
      <div className="admin-shell min-h-screen flex font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`admin-sidebar fixed top-0 left-0 z-50 h-full w-72 shadow-2xl transition-transform duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="admin-sidebar-brand h-20 flex items-center justify-between px-5">
              <Link href="/" className="flex items-center gap-3 min-w-0">
                <div className="icon-3d w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-blue-900 text-white shrink-0">
                  <i className="fas fa-church text-sm" />
                </div>
                <div className="min-w-0">
                  <span className="font-black text-base text-slate-900 dark:text-white block truncate">
                    TrieuMinistry
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                    Admin
                  </span>
                </div>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <i className="fas fa-times" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-5 custom-scrollbar">
              {navSections.map((section, idx) => (
                <div key={section.title}>
                  {idx > 0 && <div className="mx-2 mb-4 h-px bg-slate-200 dark:bg-white/5" />}
                  <p className="px-3 mb-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    {section.title}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const active = isLinkActive(item.href, item.exact);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                            active
                              ? "admin-nav-active"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          <span
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-sm ${
                              active
                                ? "bg-blue-700 text-white shadow-md shadow-blue-900/30"
                                : "bg-slate-100 dark:bg-slate-800/80 text-blue-700 dark:text-blue-400"
                            }`}
                          >
                            <i className={`fas ${item.icon}`} />
                          </span>
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="border-t border-slate-200 dark:border-white/5 bg-slate-50/80 dark:bg-slate-900/40">
              <div className="px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-white/5">
                <button
                  onClick={toggleTheme}
                  className="icon-3d w-8 h-8 bg-white dark:bg-slate-800 text-slate-600 dark:text-amber-400 border border-slate-200 dark:border-white/10"
                  title="Toggle Theme"
                >
                  {theme === "dark" ? <i className="fas fa-sun text-xs" /> : <i className="fas fa-moon text-xs" />}
                </button>
                <div className="flex bg-white dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-white/10">
                  {(["vi", "en"] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`px-2.5 py-1 text-[10px] rounded-md font-bold uppercase transition-all ${
                        language === lang
                          ? "bg-blue-700 text-white"
                          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4 flex items-center gap-3">
                <img
                  src={user?.photoURL || "https://ui-avatars.com/api/?name=Admin+User&background=1d4ed8&color=fff"}
                  alt="Admin"
                  className="w-10 h-10 rounded-xl border-2 border-slate-200 dark:border-white/10 shrink-0 object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {user?.displayName || "Admin"}
                  </p>
                  <button
                    onClick={logout}
                    className="text-xs text-slate-500 hover:text-red-600 dark:hover:text-red-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5"
                  >
                    <i className="fas fa-sign-out-alt" /> Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-h-screen lg:ml-72">
          <header className="sticky top-0 z-30 glass-3d border-b border-slate-200/80 dark:border-white/5">
            <div className="h-16 flex items-center justify-between px-4 md:px-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 text-slate-500 hover:text-blue-700 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <i className="fas fa-bars text-lg" />
                </button>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 hidden sm:block">
                    Admin Panel
                  </p>
                  <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{pageTitle}</h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all"
                >
                  <i className="fas fa-external-link-alt text-xs" />
                  View Site
                </Link>
                <button
                  onClick={toggleTheme}
                  className="lg:hidden icon-3d w-9 h-9 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-amber-400"
                >
                  {theme === "dark" ? <i className="fas fa-sun" /> : <i className="fas fa-moon" />}
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-8 lg:p-10 max-w-[1920px] w-full mx-auto">{children}</main>
        </div>
      </div>
    </RoleGuard>
  );
}
