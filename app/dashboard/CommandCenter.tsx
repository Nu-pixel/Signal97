"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Activity, Eye, Bell, BarChart2, ArrowRight } from "lucide-react";

type LiveWatchlistResp = { items?: string[] };
type LiveAlertsResp = { alerts?: any[] };
type TradesResp = { trades?: any[] };

export default function CommandCenter() {
  const [watching, setWatching] = useState<number>(0);
  const [alertsCount, setAlertsCount] = useState<number>(0);
  const [openTrades, setOpenTrades] = useState<number>(0);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setErr(null);

        const [wRes, aRes, tRes] = await Promise.all([
          fetch("/api/live-watchlist", { cache: "no-store" }),
          fetch("/api/live-alerts", { cache: "no-store" }),
          fetch("/api/trades", { cache: "no-store" }),
        ]);

        const wJson: LiveWatchlistResp = wRes.ok ? await wRes.json() : {};
        const aJson: LiveAlertsResp = aRes.ok ? await aRes.json() : {};
        const tJson: TradesResp = tRes.ok ? await tRes.json() : {};

        if (!alive) return;

        setWatching(Array.isArray(wJson.items) ? wJson.items.length : 0);
        setAlertsCount(Array.isArray(aJson.alerts) ? aJson.alerts.length : 0);
        setOpenTrades(Array.isArray(tJson.trades) ? tJson.trades.length : 0);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "Failed to load live stats");
      }
    }

    load();
    const id = setInterval(load, 15_000); // refresh
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const marketMood = useMemo(() => {
    // Keep static for now. Later we can wire a /market/mood endpoint from news/sentiment.
    return { badge: "Calm", text: "Good conditions" };
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          Today at a glance
        </h1>

        {err && (
          <div className="mb-4 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3">
            Live load warning: {err}
          </div>
        )}

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="flex flex-col justify-between bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium">
                <Activity className="w-4 h-4" />
                <span>Market mood</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
                {marketMood.badge}
              </span>
            </div>
            <div className="text-lg md:text-xl font-semibold text-emerald-900 leading-snug">
              {marketMood.text}
            </div>
          </div>

          <div className="flex flex-col justify-between bg-sky-50 border border-sky-100 rounded-2xl px-4 py-4">
            <div className="flex items-center gap-2 text-sky-600 text-xs font-medium mb-2">
              <Eye className="w-4 h-4" />
              <span>Watching</span>
            </div>
            <div className="text-lg md:text-xl font-semibold text-slate-900">
              {watching.toLocaleString()} symbols
            </div>
          </div>

          <div className="flex flex-col justify-between bg-amber-50 border border-amber-100 rounded-2xl px-4 py-4">
            <div className="flex items-center gap-2 text-amber-600 text-xs font-medium mb-2">
              <Bell className="w-4 h-4" />
              <span>Recent alerts</span>
            </div>
            <div className="text-[11px] text-slate-800 leading-snug font-semibold">
              {alertsCount.toLocaleString()} alerts (latest batch)
            </div>
          </div>

          <div className="flex flex-col justify-between bg-purple-50 border border-purple-100 rounded-2xl px-4 py-4">
            <div className="flex items-center gap-2 text-purple-600 text-xs font-medium mb-2">
              <BarChart2 className="w-4 h-4" />
              <span>Open trades</span>
            </div>
            <div className="text-lg md:text-xl font-semibold text-slate-900">
              {openTrades.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <div className="text-xs text-slate-500 mb-2">Quick actions (live)</div>
          <div className="flex flex-wrap gap-2">
            <QuickAction>View alerts</QuickAction>
            <QuickAction>Check trades</QuickAction>
            <QuickAction>Performance report</QuickAction>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Recent activity (live soon)
        </h2>
        <div className="text-xs text-slate-500">
          Next step: we’ll populate this from live alerts + trade events.
        </div>
      </div>
    </div>
  );
}

function QuickAction({ children }: { children: React.ReactNode }) {
  return (
    <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all">
      {children}
      <ArrowRight className="w-3 h-3 text-slate-400" />
    </button>
  );
}
