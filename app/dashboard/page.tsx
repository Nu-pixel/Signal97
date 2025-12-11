"use client";

import { useState } from "react";
import CommandCenter from "./CommandCenter";
import LiveWatchlist from "./LiveWatchlist";
import ProbabilityLab from "./ProbabilityLab";
import ActiveTrades from "./ActiveTrades";
import Performance from "./Performance";
import Tools from "./Tools";
import Settings from "./Settings";
import LiveAlertsPanel from "./LiveAlertsPanel";


const TABS = [
  "Command Center",
  "Live Watchlist",
  "Signal 97 Alerts",
  "Probability Lab",
  "Active Trades",
  "P&L / Performance",
  "Tools",
  "Settings",
] as const;

type Tab = (typeof TABS)[number];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Command Center");

  const handleLogout = () => {
    window.location.href = "/";
  };

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      {/* Top bar */}
      <header className="w-full bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-semibold">
              97
            </div>
            <div>
              <div className="font-semibold text-slate-900">
                Signal 97 · Demo workspace
              </div>
              <div className="text-[10px] text-orange-500 font-medium">
                Sample data only
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
      <div className="w-full bg-white shadow-sm/40">
        <div className="max-w-6xl mx-auto px-6 flex gap-3 overflow-x-auto py-3 text-sm">
          {TABS.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={
                  "px-4 py-2 rounded-full whitespace-nowrap transition-all " +
                  (isActive
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

      {/* Tab content */}
      <section className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {activeTab === "Command Center" && <CommandCenter />}
        {activeTab === "Live Watchlist" && <LiveWatchlist />}
        {activeTab === "Signal 97 Alerts" && <LiveAlertsPanel />}
        {activeTab === "Probability Lab" && <ProbabilityLab />}
        {activeTab === "Active Trades" && <ActiveTrades />}
        {activeTab === "P&L / Performance" && <Performance />}
        {activeTab === "Tools" && <Tools />}
        {activeTab === "Settings" && <Settings />}
      </section>
    </main>
  );
}
