"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Activity, Eye, Bell, BarChart2, ArrowRight } from "lucide-react";

type PerfResp = {
  ok?: boolean;
  summary?: {
    total_forecast_rows?: number;
    dismissed_count?: number;
    active_trades_count?: number;
    closed_trades_count?: number;
    server_time?: number;
  } | null;
};

type WatchlistResp = { ok?: boolean; items?: string[] };
type AlertsResp = { alerts?: any[] };

export default function CommandCenter() {
  const searchParams = useSearchParams();
  const isDemo = useMemo(() => searchParams.get("demo") === "1", [searchParams]);

  const [watchCount, setWatchCount] = useState<number>(0);
  const [activeTrades, setActiveTrades] = useState<number>(0);
  const [newAlerts, setNewAlerts] = useState<number>(0);

  useEffect(() => {
    if (isDemo) return;

    let cancelled = false;

    const run = async () => {
      try {
        const [wRes, pRes, aRes] = await Promise.all([
          fetch("/api/watchlist-live", { cache: "no-store" }),
          fetch("/api/performance-summary", { cache: "no-store" }),
          fetch("/api/live-alerts", { cache: "no-store" }),
        ]);

        const w = (await wRes.json()) as WatchlistResp;
        const p = (await pRes.json()) as PerfResp;
        const a = (await aRes.json()) as AlertsResp;

        if (cancelled) return;

        setWatchCount(Array.isArray(w.items) ? w.items.length : 0);
        setActiveTrades(p.summary?.active_trades_count ?? 0);
        setNewAlerts(Array.isArray(a.alerts) ? a.alerts.length : 0);
      } catch {
        if (!cancelled) {
          setWatchCount(0);
          setActiveTrades(0);
          setNewAlerts(0);
        }
      }
    };

    run();
    const id = window.setInterval(run, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [isDemo]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          Today at a glance
        </h1>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="flex flex-col justify-between bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium">
                <Activity className="w-4 h-4" />
                <span>Market mood</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
                Calm
              </span>
            </div>
            <div className="text-lg md:text-xl font-semibold text-emerald-900 leading-snug">
              Good conditions
            </div>
          </div>

          <div className="flex flex-col justify-between bg-sky-50 border border-sky-100 rounded-2xl px-4 py-4">
            <div className="flex items-center gap-2 text-sky-600 text-xs font-medium mb-2">
              <Eye className="w-4 h-4" />
              <span>Watching</span>
            </div>
            <div className="text-lg md:text-xl font-semibold text-slate-900">
              {isDemo ? "18 symbols" : `${watchCount} symbols`}
            </div>
          </div>

          <div className="flex flex-col justify-between bg-amber-50 border border-amber-100 rounded-2xl px-4 py-4">
            <div className="flex items-center gap-2 text-amber-600 text-xs font-medium mb-2">
              <Bell className="w-4 h-4" />
              <span>Recent alerts</span>
            </div>
            <div className="text-[11px] text-slate-800 leading-snug font-semibold">
              {isDemo ? "GO: 5 · SCALP: 3 · WAIT: 2" : `${newAlerts} alerts (latest batch)`}
            </div>
          </div>

          <div className="flex flex-col justify-between bg-purple-50 border border-purple-100 rounded-2xl px-4 py-4">
            <div className="flex items-center gap-2 text-purple-600 text-xs font-medium mb-2">
              <BarChart2 className="w-4 h-4" />
              <span>Open trades</span>
            </div>
            <div className="flex items-baseline gap-1">
              <div className="text-lg md:text-xl font-semibold text-slate-900">
                {isDemo ? "3" : String(activeTrades)}
              </div>
              <div className="text-xs font-semibold text-emerald-600">
                {isDemo ? "(+4.2%)" : ""}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <div className="text-xs text-slate-500 mb-2">
            Quick actions {isDemo ? "(demo)" : "(live)"}
          </div>
          <div className="flex flex-wrap gap-2">
            <QuickAction>View alerts</QuickAction>
            <QuickAction>Check trades</QuickAction>
            <QuickAction>Performance report</QuickAction>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Recent activity {isDemo ? "(sample)" : "(live soon)"}
        </h2>

        <div className="space-y-3">
          <ActivityRow label="GO" labelClass="bg-emerald-100 text-emerald-700" title="PLTR qualified" subtitle="Call bias · 2 hours ago" />
          <ActivityRow label="TRADE" labelClass="bg-sky-100 text-sky-700" title="LCID reached +4% target" subtitle="3 hours ago" />
          <ActivityRow label="SCALP" labelClass="bg-amber-100 text-amber-700" title="SOFI qualified" subtitle="Put bias · 4 hours ago" />
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

function ActivityRow({
  label,
  labelClass,
  title,
  subtitle,
}: {
  label: string;
  labelClass: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50/70 hover:bg-slate-50 transition-colors">
      <span className={`px-3 py-1 rounded-full text-[10px] font-semibold ${labelClass}`}>
        {label}
      </span>
      <div className="flex flex-col">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <div className="text-[10px] text-slate-500">{subtitle}</div>
      </div>
    </div>
  );
}
