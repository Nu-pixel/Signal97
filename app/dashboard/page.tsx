"use client";

import React, { Suspense, useMemo, useState } from "react";
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

export default function DashboardPage() {
  // ✅ Wrap the component that uses useSearchParams in Suspense
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardInner />
    </Suspense>
  );
}

function DashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ ONLY demo when URL explicitly has ?demo=1
  const isDemo = useMemo(() => searchParams.get("demo") === "1", [searchParams]);

  const [activeTab, setActiveTab] = useState<Tab>("Command Center");

  const wideTabs = new Set<Tab>([
    "Live Watchlist",
    "Signal 97 Alerts",
    "Active Trades",
    "Taken / Closed Alerts",
    "Dismissed Alerts",
    "P&L / Performance",
    "Tools",
  ]);

  const pageMaxWidth = wideTabs.has(activeTab) ? "max-w-[1500px]" : "max-w-5xl";

  const handleLogout = () => {
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      {/* Top bar */}
      <header className="w-full bg-white border-b border-slate-100">       
        <div className="w-full max-w-[1500px] mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-semibold">
              97
            </div>

            <div>
              <div className="font-semibold text-slate-900 flex items-center gap-2">
                Signal 97 · Workspace
                <span
                  className={
                    "px-2 py-0.5 rounded-full text-[10px] font-semibold " +
                    (isDemo
                      ? "bg-orange-100 text-orange-700"
                      : "bg-emerald-100 text-emerald-700")
                  }
                >
                  {isDemo ? "DEMO" : "LIVE"}
                </span>
              </div>

              <div className="text-[10px] text-slate-500 font-medium">
                {isDemo
                  ? "Showing sample UI data (demo mode)."
                  : "Showing live-connected pages (when wired)."}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>demo@signal97.com</span>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            >
              Log out
            </button>
          </div>
        </div>
      </header>


      {/* Tabs row */}
      <div className="w-full bg-white border-b border-slate-200 shadow-sm/40">
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
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50")
                  }
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab content */}
      {/* Tab content */}
      <section
        className={`w-full ${pageMaxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6`}
      >
        {activeTab === "Command Center" && <CommandCenter onNavigate={setActiveTab} />}
        {activeTab === "Live Watchlist" && <LiveWatchlist />}
        {activeTab === "Signal 97 Alerts" && <LiveAlertsPanel />}
        {activeTab === "Active Trades" && <ActiveTrades />}
        {activeTab === "P&L / Performance" && <Performance />}
        {activeTab === "Tools" && <Tools />}
        {activeTab === "Settings" && <Settings />}
        {activeTab === "Taken / Closed Alerts" && <TakenClosedAlerts />}
        {activeTab === "Dismissed Alerts" && <DismissedAlerts />}  
      </section>
    </main>
  );
}

/** Simple placeholder while search params hydrate */
function DashboardSkeleton() {
  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <div className="h-6 w-56 bg-slate-100 rounded mb-3" />
          <div className="h-3 w-72 bg-slate-100 rounded mb-6" />
          <div className="grid md:grid-cols-4 gap-4">
            <div className="h-24 bg-slate-100 rounded-2xl" />
            <div className="h-24 bg-slate-100 rounded-2xl" />
            <div className="h-24 bg-slate-100 rounded-2xl" />
            <div className="h-24 bg-slate-100 rounded-2xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
