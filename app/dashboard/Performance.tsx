"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type PerfResp = {
  ok?: boolean;
  summary?: {
    total_forecast_rows?: number;
    dismissed_count?: number;
    active_trades_count?: number;
    closed_trades_count?: number;
    taken_trades_count?: number;
    total_realized_pnl?: number;
    avg_closed_pnl_pct?: number | null;
    closed_win_rate?: number | null;
    server_time?: number;
  } | null;
  error?: string;
};

function money(v: number) {
  const sign = v > 0 ? "+" : v < 0 ? "-" : "";
  return `${sign}$${Math.abs(v).toFixed(2)}`;
}

function pct(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "—";
  const n = Number(v);
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

const Performance: React.FC = () => {
  const searchParams = useSearchParams();
  const isDemo = useMemo(() => searchParams.get("demo") === "1", [searchParams]);

  const [summary, setSummary] = useState<PerfResp["summary"]>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (isDemo) return;

    let cancelled = false;

    const run = async () => {
      try {
        const res = await fetch("/api/performance-summary", { cache: "no-store" });
        const data = (await res.json()) as PerfResp;

        if (cancelled) return;

        if (!res.ok || data.ok === false) {
          setErr(data.error || "Failed to load performance summary");
          setSummary(null);
        } else {
          setErr(null);
          setSummary(data.summary ?? null);
        }
      } catch (e: any) {
        if (!cancelled) {
          setErr(e?.message ?? "Failed to load performance summary");
          setSummary(null);
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

  const activeTrades = summary?.active_trades_count ?? 0;
  const closedTrades = summary?.closed_trades_count ?? 0;
  const dismissed = summary?.dismissed_count ?? 0;
  const forecastRows = summary?.total_forecast_rows ?? 0;
  const takenTrades = summary?.taken_trades_count ?? activeTrades + closedTrades;
  const realizedPnl = summary?.total_realized_pnl ?? 0;
  const avgClosedPct = summary?.avg_closed_pnl_pct;
  const closedWinRate = summary?.closed_win_rate;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 px-8 py-7 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
            P&amp;L / Performance
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {isDemo
              ? "Track your actual trading results over time. (Demo UI)"
              : err
              ? `Live performance error: ${err}`
              : "Live performance from alerts you took, active trades, and closed trades."}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 text-sm">
          <PerfCard
            tone="blue"
            title="Forecast rows"
            value={isDemo ? "+$847" : `${forecastRows}`}
            detail={isDemo ? "5 trades · 4 winners" : "Total emitted alert rows"}
            winRate={isDemo ? "80%" : "LIVE"}
          />

          <PerfCard
            tone="purple"
            title="Taken trades"
            value={isDemo ? "+$3,412" : `${takenTrades}`}
            detail={
              isDemo
                ? "18 trades · 15 winners"
                : `${activeTrades} active · ${closedTrades} closed · ${dismissed} dismissed`
            }
            winRate={isDemo ? "83.3%" : "LIVE"}
          />

          <PerfCard
            tone="green"
            title="Realized P&L"
            value={isDemo ? "+$12,890" : money(realizedPnl)}
            detail={
              isDemo
                ? "67 trades · 58 winners"
                : avgClosedPct == null
                ? "Enter entry/exit prices to calculate P&L"
                : `Avg closed return: ${pct(avgClosedPct)}`
            }
            winRate={
              isDemo
                ? "86.6%"
                : closedWinRate == null
                ? "—"
                : `${closedWinRate.toFixed(2)}%`
            }
          />
        </div>

        <div className="mt-2 space-y-3 text-xs">
          <div className="font-semibold text-slate-900">Performance breakdown</div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-[10px] text-slate-500 font-semibold">By trade status</div>
              <BreakdownRow
                dotClass="bg-emerald-500"
                label="Active trades"
                value={isDemo ? "3 open" : `${activeTrades}`}
              />
              <BreakdownRow
                dotClass="bg-blue-500"
                label="Closed trades"
                value={isDemo ? "15 closed" : `${closedTrades}`}
              />
              <BreakdownRow
                dotClass="bg-slate-400"
                label="Dismissed alerts"
                value={isDemo ? "4 dismissed" : `${dismissed}`}
              />
            </div>

            <div className="space-y-2">
              <div className="text-[10px] text-slate-500 font-semibold">Closed trade results</div>
              <BreakdownRow
                label="Total realized P&L"
                value={isDemo ? "+$12,890" : money(realizedPnl)}
              />
              <BreakdownRow
                label="Average closed return"
                value={isDemo ? "+5.1%" : pct(avgClosedPct)}
              />
              <BreakdownRow
                label="Closed win rate"
                value={isDemo ? "86.6%" : closedWinRate == null ? "—" : `${closedWinRate.toFixed(2)}%`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 px-8 py-6 space-y-4">
        <div className="font-semibold text-slate-900 text-sm">Compare: Alerts vs. Your choices</div>

        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 flex flex-col justify-between">
            <div className="text-[10px] text-slate-500">All alerts emitted</div>
            <div className="mt-1 text-2xl font-semibold text-indigo-900">
              {isDemo ? "+4.8% avg" : `${forecastRows}`}
            </div>
            <div className="mt-1 text-[9px] text-slate-500">
              {isDemo
                ? "Based on sample data"
                : "Raw alert count only. Outcome tracking comes later."}
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 flex flex-col justify-between">
            <div className="text-[10px] text-slate-600">Your actual closed trades</div>
            <div className="mt-1 text-2xl font-semibold text-emerald-700">
              {isDemo ? "+5.1% avg" : money(realizedPnl)}
            </div>
            <div className="mt-1 text-[9px] text-emerald-600">
              {isDemo
                ? "You're selecting well!"
                : closedTrades === 0
                ? "Close trades with entry/exit prices to build P&L."
                : `${closedTrades} closed trades tracked.`}
            </div>
          </div>
        </div>

        <p className="text-[10px] text-slate-500">
          This page now uses your taken and closed trades. It does not count dismissed alerts as trades.
        </p>
      </div>
    </div>
  );
};

export default Performance;

function PerfCard({
  tone,
  title,
  value,
  detail,
  winRate,
}: {
  tone: "blue" | "purple" | "green";
  title: string;
  value: string;
  detail: string;
  winRate: string;
}) {
  const styles: Record<"blue" | "purple" | "green", string> = {
    blue: "bg-sky-50 border-sky-100",
    purple: "bg-fuchsia-50 border-fuchsia-100",
    green: "bg-emerald-50 border-emerald-100",
  };

  return (
    <div className={`rounded-2xl px-6 py-5 border flex flex-col justify-between ${styles[tone]}`}>
      <div className="text-[11px] text-slate-600 mb-1 font-medium">{title}</div>
      <div className="text-3xl font-semibold text-slate-900 leading-tight">{value}</div>
      <div className="mt-1 text-[10px] text-slate-600">{detail}</div>
      <div className="mt-4 pt-2 border-t border-white/60 text-[10px] text-slate-700 font-semibold">
        Win rate <span className="ml-1">{winRate}</span>
      </div>
    </div>
  );
}

function BreakdownRow({
  dotClass,
  label,
  value,
}: {
  dotClass?: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between text-[10px] bg-slate-50 rounded-xl px-3 py-2">
      <div className="flex items-center gap-2">
        {dotClass && <span className={`w-2 h-2 rounded-full ${dotClass}`} />}
        <span className="text-slate-700">{label}</span>
      </div>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}
