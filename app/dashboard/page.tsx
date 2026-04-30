"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import CommandCenter from "./CommandCenter";
import LiveWatchlist from "./LiveWatchlist";
import ActiveTrades from "./ActiveTrades";
import Performance from "./Performance";
import Tools from "./Tools";
import Settings from "./Settings";
import LiveAlertsPanel from "./LiveAlertsPanel";
import TakenClosedAlerts from "./TakenClosedAlerts";
import DismissedAlerts from "./DismissedAlerts";

const TABS = [
  "Command Center",
  "Live Watchlist",
  "Signal 97 Alerts",
  "Active Trades",
  "Taken / Closed Alerts",
  "Dismissed Alerts",
  "P&L / Performance",
  "Tools",
  "Settings",
] as const;

type Tab = (typeof TABS)[number];

const SETTINGS_KEY = "signal97_user_settings_v1";

function applyDashboardTheme() {
  if (typeof window === "undefined") return;

  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const theme = parsed?.theme === "dark" ? "dark" : "light";

    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  } catch {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  }
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardInner />
    </Suspense>
  );
}

function DashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isDemo = useMemo(() => searchParams.get("demo") === "1", [searchParams]);
  const [activeTab, setActiveTab] = useState<Tab>("Command Center");

  const pageMaxWidth = "max-w-[1500px]";

  useEffect(() => {
    applyDashboardTheme();

    const onSettingsChanged = () => applyDashboardTheme();

    window.addEventListener("signal97-settings-changed", onSettingsChanged);
    window.addEventListener("storage", onSettingsChanged);

    return () => {
      window.removeEventListener("signal97-settings-changed", onSettingsChanged);
      window.removeEventListener("storage", onSettingsChanged);
    };
  }, []);

  const handleLogout = () => {
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-[#0b1220] transition-colors">
      {/* Top bar */}
      <header className="sticky top-0 z-50 w-full bg-white dark:bg-[#111c2e] border-b border-slate-100 dark:border-slate-800">
        <div className="w-full max-w-[1500px] mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-semibold shadow-sm">
              97
            </div>

            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Signal 97 · Workspace
                <span
                  className={
                    "px-2 py-0.5 rounded-full text-[10px] font-semibold " +
                    (isDemo
                      ? "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300")
                  }
                >
                  {isDemo ? "DEMO" : "LIVE"}
                </span>
              </div>

              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {isDemo
                  ? "Showing sample UI data (demo mode)."
                  : "Showing live-connected pages (when wired)."}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span>demo@signal97.com</span>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Log out
            </button>
          </div>
        </div>

        {/* Tabs row */}
        <div className="dashboard-tabs-row w-full bg-white dark:bg-[#0f1a2b] border-b border-slate-200 dark:border-slate-800 shadow-sm/40">
          <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-2 py-3 text-sm">
              {TABS.map((tab) => {
                const isActiveTab = tab === activeTab;

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={
                      "px-4 py-2 rounded-full whitespace-nowrap transition-all " +
                      (isActiveTab
                        ? "bg-slate-900 text-white dark:bg-sky-500 dark:text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800")
                    }
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Tab content */}
      <section
        className={`w-full ${pageMaxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6`}
      >
        {activeTab === "Command Center" && (
          <CommandCenter onNavigate={setActiveTab} />
        )}

        {activeTab === "Live Watchlist" && <LiveWatchlist />}
        {activeTab === "Signal 97 Alerts" && <LiveAlertsPanel />}
        {activeTab === "Active Trades" && <ActiveTrades />}
        {activeTab === "Taken / Closed Alerts" && <TakenClosedAlerts />}
        {activeTab === "Dismissed Alerts" && <DismissedAlerts />}
        {activeTab === "P&L / Performance" && <Performance />}
        {activeTab === "Tools" && <Tools />}
        {activeTab === "Settings" && <Settings />}
      </section>
    </main>
  );
}

function DashboardSkeleton() {
  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-[#07111f]">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="h-6 w-56 bg-slate-100 dark:bg-slate-800 rounded mb-3" />
          <div className="h-3 w-72 bg-slate-100 dark:bg-slate-800 rounded mb-6" />
          <div className="grid md:grid-cols-4 gap-4">
            <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
            <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
            <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
            <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
