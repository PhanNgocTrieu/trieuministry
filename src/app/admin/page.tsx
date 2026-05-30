"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getCountFromServer,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { ActivityLog } from "@/lib/activity-logger";
import Link from "next/link";

const timeAgo = (date: Date) => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
};

const QUICK_ACTIONS = [
  {
    href: "/admin/appeals",
    icon: "fa-envelope-open-text",
    label: "Appeals",
    desc: "View & manage letters",
    color: "text-blue-700 dark:text-blue-400",
  },
  {
    href: "/admin/sponsors",
    icon: "fa-hand-holding-usd",
    label: "Sponsors",
    desc: "Financial commitments",
    color: "text-teal-700 dark:text-teal-400",
  },
  {
    href: "/admin/users",
    icon: "fa-users",
    label: "Users",
    desc: "Manage accounts & roles",
    color: "text-slate-700 dark:text-slate-300",
  },
  {
    href: "/admin/tasks",
    icon: "fa-tasks",
    label: "Tasks",
    desc: "Ministry task board",
    color: "text-amber-700 dark:text-amber-400",
  },
];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    users: 0,
    prayers: 0,
    pendingBlogs: 0,
    visits: 0,
    prayersBreakdown: { personal: 0, community: 0, answered: 0 },
  });
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersSnap = await getCountFromServer(collection(db, "users"));
        const prayersColl = collection(db, "prayers");
        const totalPrayersSnap = await getCountFromServer(prayersColl);
        const personalSnap = await getCountFromServer(query(prayersColl, where("scope", "==", "personal")));
        const communitySnap = await getCountFromServer(query(prayersColl, where("scope", "==", "community")));
        const answeredSnap = await getCountFromServer(query(prayersColl, where("status", "==", "answered")));
        const blogsSnap = await getCountFromServer(
          query(collection(db, "blogs"), where("status", "==", "pending"))
        );

        let visitsCount = 0;
        try {
          const visitsDoc = await getDoc(doc(db, "stats", "general"));
          if (visitsDoc.exists()) visitsCount = visitsDoc.data().totalVisits || 0;
        } catch (e) {
          console.error("Error fetching visits:", e);
        }

        try {
          const activitiesQ = query(collection(db, "activities"), orderBy("timestamp", "desc"), limit(10));
          const activitiesSnap = await getDocs(activitiesQ);
          setActivities(
            activitiesSnap.docs.map((d) => {
              const data = d.data();
              return {
                ...data,
                timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(),
              } as ActivityLog;
            })
          );
        } catch (e) {
          console.error("Error fetching activities:", e);
        }

        setStats({
          users: usersSnap.data().count,
          prayers: totalPrayersSnap.data().count,
          pendingBlogs: blogsSnap.data().count,
          visits: visitsCount,
          prayersBreakdown: {
            personal: personalSnap.data().count,
            community: communitySnap.data().count,
            answered: answeredSnap.data().count,
          },
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchStats();
  }, [user]);

  const firstName = user?.displayName?.split(" ")[0] || "Admin";

  const statCards = [
    {
      label: "Total Users",
      value: stats.users,
      icon: "fa-users",
      accent: "linear-gradient(90deg, #1d4ed8, #3b82f6)",
    },
    {
      label: "Prayer Requests",
      value: stats.prayers,
      icon: "fa-praying-hands",
      accent: "linear-gradient(90deg, #0d9488, #0891b2)",
      breakdown: stats.prayersBreakdown,
    },
    {
      label: "Pending Blogs",
      value: stats.pendingBlogs,
      icon: "fa-blog",
      accent: "linear-gradient(90deg, #334155, #64748b)",
    },
    {
      label: "Site Visits",
      value: stats.visits,
      icon: "fa-chart-line",
      accent: "linear-gradient(90deg, #059669, #10b981)",
      suffix: "live",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="admin-panel relative overflow-hidden p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1">
              Welcome back
            </p>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {firstName}, here&apos;s your overview
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm md:text-base">
              Monitor activity, users, and ministry tools from one place.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href="/admin/users" className="btn-3d !py-2.5 !px-5 !text-sm">
              <i className="fas fa-users" />
              Users
            </Link>
            <Link href="/admin/settings" className="btn-3d btn-3d-outline !py-2.5 !px-5 !text-sm">
              <i className="fas fa-cogs" />
              Settings
            </Link>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="admin-stat-card p-6"
            style={{ "--stat-accent": card.accent } as React.CSSProperties & Record<string, string>}
          >
            <div className="flex items-start justify-between mb-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {card.label}
              </p>
              <div className="icon-3d w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-700/20 text-blue-700 dark:text-blue-400 text-sm">
                <i className={`fas ${card.icon}`} />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
              {loading ? (
                <div className="h-9 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
              ) : (
                card.value.toLocaleString()
              )}
            </div>
            {card.suffix && !loading && (
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live tracking
              </p>
            )}
            {card.breakdown && !loading && (
              <div className="grid grid-cols-3 gap-1 mt-4 pt-4 border-t border-slate-200 dark:border-white/5 text-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Public</p>
                  <p className="text-sm font-bold text-teal-600 dark:text-teal-400">{card.breakdown.community}</p>
                </div>
                <div className="border-x border-slate-200 dark:border-white/5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Private</p>
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{card.breakdown.personal}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Answered</p>
                  <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{card.breakdown.answered}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="lg:col-span-1 admin-panel p-6">
          <h3 className="text-base font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <i className="fas fa-bolt text-amber-500" />
            Quick Actions
          </h3>
          <div className="space-y-3">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="admin-quick-action flex items-center gap-4 p-4 group"
              >
                <div className="icon-3d w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-400 shrink-0 group-hover:bg-blue-700 group-hover:text-white transition-colors">
                  <i className={`fas ${action.icon}`} />
                </div>
                <div className="min-w-0">
                  <p className={`font-bold text-sm ${action.color}`}>{action.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{action.desc}</p>
                </div>
                <i className="fas fa-chevron-right text-xs text-slate-300 dark:text-slate-600 ml-auto group-hover:text-blue-600 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div className="lg:col-span-2 admin-panel p-6">
          <h3 className="text-base font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <i className="fas fa-history text-blue-600" />
            Recent Activity
          </h3>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <i className="fas fa-inbox text-3xl mb-3 opacity-40" />
              <p>No recent activity yet.</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
              {activities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      activity.type === "prayer"
                        ? "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400"
                        : activity.type === "blog"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    <i
                      className={`fas ${
                        activity.type === "prayer"
                          ? "fa-praying-hands"
                          : activity.type === "blog"
                            ? "fa-blog"
                            : "fa-info-circle"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs text-slate-400">{timeAgo(activity.timestamp)}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border ${
                          activity.action === "create"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : activity.action === "update"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                              : activity.action === "delete"
                                ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                                : "bg-slate-500/10 text-slate-500 border-slate-500/20"
                        }`}
                      >
                        {activity.action}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
