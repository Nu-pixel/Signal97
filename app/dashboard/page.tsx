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
    <main className="relative min-h-screen overflow-hidden bg-[#05070c] text-slate-100 transition-colors">
      {/* High-end dark finance/AI background */}
      <div
        className="
          pointer-events-none fixed inset-0 z-0
          bg-[radial-gradient(circle_at_18%_12%,rgba(59,130,246,0.18),transparent_28%),radial-gradient(circle_at_82%_14%,rgba(20,184,166,0.13),transparent_30%),radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.16),transparent_38%),linear-gradient(135deg,#030406_0%,#07101d_38%,#081827_72%,#030406_100%)]
        "
      />

      {/* Subtle technical grid/noise feel */}
      <div
        className="
          pointer-events-none fixed inset-0 z-0 opacity-[0.16]
          [background-image:linear-gradient(rgba(148,163,184,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)]
          [background-size:72px_72px]
        "
      />

      {/* Soft vignette like premium AI sites */}
      <div
        className="
          pointer-events-none fixed inset-0 z-0
          bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.20)_58%,rgba(0,0,0,0.58)_100%)]
        "
      />

      {/* Top bar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#070b13]/88 backdrop-blur-2xl shadow-[0_18px_70px_rgba(0,0,0,0.40)]">
        <div className="w-full max-w-[1500px] mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-semibold shadow-[0_0_24px_rgba(37,99,235,0.55)]">
              97
            </div>

            <div>
              <div className="font-semibold text-slate-100 flex items-center gap-2">
                Signal 97 · Workspace
                <span
                  className={
                    "px-2 py-0.5 rounded-full text-[10px] font-semibold border " +
                    (isDemo
                      ? "bg-orange-400/15 text-orange-200 border-orange-300/25"
                      : "bg-emerald-400/15 text-emerald-200 border-emerald-300/25")
                  }
                >
                  {isDemo ? "DEMO" : "LIVE"}
                </span>
              </div>

              <div className="text-[10px] text-slate-400 font-medium">
                {isDemo
                  ? "Showing sample UI data (demo mode)."
                  : "Showing live-connected pages (when wired)."}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-300">
            <span>demo@signal97.com</span>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-full border border-white/20 text-slate-200 hover:bg-white/10 hover:text-white transition"
            >
              Log out
            </button>
          </div>
        </div>

        {/* Tabs row */}
        <div className="dashboard-tabs-row w-full border-t border-white/[0.04] border-b border-white/10 bg-[#09111f]/92 backdrop-blur-2xl shadow-sm/40">
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
                        ? "bg-[#050816] text-white ring-1 ring-cyan-200/45 shadow-[0_0_28px_rgba(56,189,248,0.20)]"
                        : "text-slate-300 hover:text-white hover:bg-white/10")
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
        className={`relative z-10 w-full ${pageMaxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6`}
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
    <main className="relative min-h-screen overflow-hidden bg-[#05070c] text-slate-100">
      <div
        className="
          pointer-events-none fixed inset-0 z-0
          bg-[radial-gradient(circle_at_18%_12%,rgba(59,130,246,0.18),transparent_28%),radial-gradient(circle_at_82%_14%,rgba(20,184,166,0.13),transparent_30%),linear-gradient(135deg,#030406_0%,#07101d_45%,#081827_100%)]
        "
      />

      <div className="relative z-10 max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-[#111c2e]/90 border border-white/10 rounded-3xl p-6 shadow-[0_18px_70px_rgba(0,0,0,0.35)]">
          <div className="h-6 w-56 bg-slate-800 rounded mb-3" />
          <div className="h-3 w-72 bg-slate-800 rounded mb-6" />
          <div className="grid md:grid-cols-4 gap-4">
            <div className="h-24 bg-slate-800 rounded-2xl" />
            <div className="h-24 bg-slate-800 rounded-2xl" />
            <div className="h-24 bg-slate-800 rounded-2xl" />
            <div className="h-24 bg-slate-800 rounded-2xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
