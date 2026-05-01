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
      {/* MAIN PERFORMANCE PANEL */}
      <section
        className="
          relative overflow-hidden rounded-[32px] p-6 md:p-7 space-y-7 transition-colors
          border border-slate-200 bg-white text-slate-900 shadow-[0_18px_55px_rgba(15,23,42,0.10)]
          dark:border-white/15 dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_34%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_30%),linear-gradient(135deg,#101827_0%,#162335_55%,#0b111c_100%)] dark:text-white dark:shadow-[0_22px_70px_rgba(0,0,0,0.32)]
        "
      >
        <div className="pointer-events-none absolute inset-0 opacity-0 dark:opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] [background-size:38px_38px]" />

        <div className="relative z-10 space-y-7">
          {/* Header */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-100">
              P&amp;L dashboard
            </div>

            <h1 className="mt-4 text-3xl md:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
              P&amp;L / Performance
            </h1>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {isDemo
                ? "Track your actual trading results over time. (Demo UI)"
                : err
                ? `Live performance error: ${err}`
                : "Live performance from alerts you took, active trades, and closed trades."}
            </p>
          </div>

          {/* Top cards */}
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

          {/* Separator */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Performance breakdown
            </span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          </div>

          {/* Breakdown */}
          <div className="grid md:grid-cols-2 gap-5 text-xs">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-[#0b1423]/80">
              <div className="mb-3 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                By trade status
              </div>

              <div className="space-y-2">
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
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-[#0b1423]/80">
              <div className="mb-3 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Closed trade results
              </div>

              <div className="space-y-2">
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
                  value={
                    isDemo
                      ? "86.6%"
                      : closedWinRate == null
                      ? "—"
                      : `${closedWinRate.toFixed(2)}%`
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARE PANEL */}
      <section
        className="
          relative overflow-hidden rounded-[32px] p-6 md:p-7 space-y-5 transition-colors
          border border-slate-200 bg-white text-slate-900 shadow-[0_18px_55px_rgba(15,23,42,0.10)]
          dark:border-white/15 dark:bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_30%),linear-gradient(135deg,#101827_0%,#162335_55%,#0b111c_100%)] dark:text-white dark:shadow-[0_22px_70px_rgba(0,0,0,0.28)]
        "
      >
        <div className="pointer-events-none absolute inset-0 opacity-0 dark:opacity-[0.13] [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:38px_38px]" />

        <div className="relative z-10 space-y-5">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Compare results
            </div>

            <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">
              Alerts vs. Your choices
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5 text-sm">
            <CompareCard
              tone="indigo"
              title="All alerts emitted"
              value={isDemo ? "+4.8% avg" : `${forecastRows}`}
              detail={
                isDemo
                  ? "Based on sample data"
                  : "Raw alert count only. Outcome tracking comes later."
              }
            />

            <CompareCard
              tone="emerald"
              title="Your actual closed trades"
              value={isDemo ? "+5.1% avg" : money(realizedPnl)}
              detail={
                isDemo
                  ? "You're selecting well!"
                  : closedTrades === 0
                  ? "Close trades with entry/exit prices to build P&L."
                  : `${closedTrades} closed trades tracked.`
              }
            />
          </div>

          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            This page now uses your taken and closed trades. It does not count dismissed alerts as trades.
          </p>
        </div>
      </section>
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
  const styles: Record<
    "blue" | "purple" | "green",
    {
      card: string;
      title: string;
      value: string;
    }
  > = {
    blue: {
      card:
        "border-sky-200 bg-sky-50 dark:border-sky-300/25 dark:bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_34%),#0b1423]",
      title: "text-sky-700 dark:text-sky-200",
      value: "text-slate-950 dark:text-white",
    },
    purple: {
      card:
        "border-fuchsia-200 bg-fuchsia-50 dark:border-fuchsia-300/25 dark:bg-[radial-gradient(circle_at_top_right,rgba(217,70,239,0.14),transparent_34%),#120f22]",
      title: "text-fuchsia-700 dark:text-fuchsia-200",
      value: "text-slate-950 dark:text-white",
    },
    green: {
      card:
        "border-emerald-200 bg-emerald-50 dark:border-emerald-300/30 dark:bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_34%),#09201d]",
      title: "text-emerald-700 dark:text-emerald-200",
      value: "text-emerald-700 dark:text-emerald-300",
    },
  };

  return (
    <div
      className={`
        rounded-3xl border px-6 py-5 flex min-h-[160px] flex-col justify-between shadow-sm transition-colors
        dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]
        ${styles[tone].card}
      `}
    >
      <div>
        <div className={`text-[11px] mb-1 font-bold uppercase tracking-wide ${styles[tone].title}`}>
          {title}
        </div>

        <div className={`text-3xl font-black leading-tight ${styles[tone].value}`}>
          {value}
        </div>

        <div className="mt-2 text-[10px] text-slate-600 dark:text-slate-300">
          {detail}
        </div>
      </div>

      <div className="mt-4 border-t border-slate-200 pt-3 text-[10px] font-bold text-slate-700 dark:border-white/10 dark:text-slate-300">
        Win rate <span className="ml-1 text-slate-950 dark:text-white">{winRate}</span>
      </div>
    </div>
  );
}

function CompareCard({
  tone,
  title,
  value,
  detail,
}: {
  tone: "indigo" | "emerald";
  title: string;
  value: string;
  detail: string;
}) {
  const styles =
    tone === "indigo"
      ? {
          card:
            "border-indigo-200 bg-indigo-50 dark:border-indigo-300/25 dark:bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_34%),#0b1423]",
          value: "text-indigo-900 dark:text-indigo-200",
        }
      : {
          card:
            "border-emerald-200 bg-emerald-50 dark:border-emerald-300/30 dark:bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_34%),#09201d]",
          value: "text-emerald-700 dark:text-emerald-300",
        };

  return (
    <div
      className={`
        rounded-3xl border px-5 py-5 flex min-h-[120px] flex-col justify-between shadow-sm transition-colors
        dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]
        ${styles.card}
      `}
    >
      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </div>

      <div className={`mt-1 text-2xl font-black ${styles.value}`}>
        {value}
      </div>

      <div className="mt-2 text-[9px] text-slate-500 dark:text-slate-400">
        {detail}
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
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[10px] dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center gap-2">
        {dotClass && <span className={`w-2 h-2 rounded-full ${dotClass}`} />}
        <span className="font-medium text-slate-700 dark:text-slate-300">
          {label}
        </span>
      </div>

      <span className="font-bold text-slate-950 dark:text-white">
        {value}
      </span>
    </div>
  );
}
