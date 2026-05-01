"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Activity, Eye, Bell, BarChart2, ArrowRight, Radio, ShieldCheck } from "lucide-react";

type RawAlert = {
  symbol?: string;
  forecast_time?: string;
  forecast_time_12h_ct?: string;
  entry_time?: string;
  entry_time_12h_ct?: string;
  direction?: string;
  direction_rule_direction?: string;
  signal?: string;
  forecast_pct?: number | string;
  raw_hit_price?: number | string;
  alert_key?: string;
};

type LiveWatchlistResp = {
  ok?: boolean;
  items?: any[];
  error?: string;
};

type LiveAlertsResp = {
  ok?: boolean;
  alerts?: RawAlert[];
  error?: string;
};

type TradesResp = {
  ok?: boolean;
  trades?: any[];
  error?: string;
};

type DismissedResp = {
  ok?: boolean;
  alerts?: any[];
  error?: string;
};

type CommandCenterProps = {
  onNavigate?: (
    tab:
      | "Signal 97 Alerts"
      | "Active Trades"
      | "P&L / Performance"
      | "Live Watchlist"
      | "Taken / Closed Alerts"
      | "Dismissed Alerts"
      | "Tools"
  ) => void;
};

function parseAlertTime(alert: RawAlert): number {
  const rawTime =
    alert.forecast_time ||
    alert.forecast_time_12h_ct ||
    alert.entry_time ||
    alert.entry_time_12h_ct ||
    "";

  const t = new Date(rawTime).getTime();
  return Number.isFinite(t) ? t : 0;
}

function getAlertDirection(alert: RawAlert): "UP" | "DOWN" | "OTHER" {
  const raw = String(
    alert.direction_rule_direction ||
      alert.direction ||
      alert.signal ||
      ""
  ).toUpperCase();

  if (raw.includes("UP") || raw.includes("CALL") || raw.includes("SUNRISE")) {
    return "UP";
  }

  if (raw.includes("DOWN") || raw.includes("PUT") || raw.includes("SNOWFALL")) {
    return "DOWN";
  }

  return "OTHER";
}

function formatLastUpdated(ts: number | null) {
  if (!ts) return "No live alert time yet";
  return `Latest: ${new Date(ts).toLocaleString()}`;
}

function formatTime(ts: number | string | undefined | null) {
  if (!ts) return "—";

  const n = typeof ts === "number" ? ts * 1000 : new Date(ts).getTime();
  if (!Number.isFinite(n)) return "—";

  return new Date(n).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function symbolOf(x: any) {
  return String(x?.symbol || x?.alert?.symbol || x?.ticker || "—").toUpperCase();
}

function activityTimeValue(item: any) {
  const raw =
    item?.forecast_time ||
    item?.alert?.forecast_time ||
    item?.closed_at ||
    item?.taken_at ||
    item?.dismissed_at ||
    item?.time;

  if (typeof raw === "number") return raw * 1000;

  const t = new Date(raw || "").getTime();
  return Number.isFinite(t) ? t : 0;
}

export default function CommandCenter({ onNavigate }: CommandCenterProps) {
  const [watching, setWatching] = useState<number>(0);
  const [recentAlerts, setRecentAlerts] = useState<RawAlert[]>([]);
  const [openTrades, setOpenTrades] = useState<any[]>([]);
  const [closedTrades, setClosedTrades] = useState<any[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [connOk, setConnOk] = useState<boolean>(false);
  const [checkedAt, setCheckedAt] = useState<string>("");

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setErr(null);

        const [wRes, aRes, tRes, cRes, dRes] = await Promise.all([
          fetch("/api/watchlist-live", { cache: "no-store" }),
          fetch("/api/live-alerts", { cache: "no-store" }),
          fetch("/api/active-trades", { cache: "no-store" }),
          fetch("/api/closed-trades", { cache: "no-store" }),
          fetch("/api/dismissed-alerts", { cache: "no-store" }),
        ]);

        const wJson: LiveWatchlistResp = wRes.ok ? await wRes.json() : {};
        const aJson: LiveAlertsResp = aRes.ok ? await aRes.json() : {};
        const tJson: TradesResp = tRes.ok ? await tRes.json() : {};
        const cJson: TradesResp = cRes.ok ? await cRes.json() : {};
        const dJson: DismissedResp = dRes.ok ? await dRes.json() : {};

        if (!alive) return;

        setWatching(Array.isArray(wJson.items) ? wJson.items.length : 0);
        setRecentAlerts(Array.isArray(aJson.alerts) ? aJson.alerts : []);
        setOpenTrades(Array.isArray(tJson.trades) ? tJson.trades : []);
        setClosedTrades(Array.isArray(cJson.trades) ? cJson.trades : []);
        setDismissedAlerts(Array.isArray(dJson.alerts) ? dJson.alerts : []);

        setConnOk(Boolean(wRes.ok && aRes.ok && tRes.ok));
        setCheckedAt(new Date().toLocaleString());

        if (
          !wRes.ok ||
          !aRes.ok ||
          !tRes.ok ||
          !cRes.ok ||
          !dRes.ok ||
          tJson.ok === false ||
          cJson.ok === false ||
          dJson.ok === false
        ) {
          setErr(
            tJson.error ||
              cJson.error ||
              dJson.error ||
              aJson.error ||
              wJson.error ||
              (!wRes.ok
                ? "watchlist-live failed"
                : !aRes.ok
                ? "live-alerts failed"
                : !tRes.ok
                ? "active-trades failed"
                : !cRes.ok
                ? "closed-trades failed"
                : "dismissed-alerts failed")
          );
        }
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "Failed to load dashboard stats");
        setConnOk(false);
        setCheckedAt(new Date().toLocaleString());
      }
    }

    load();
    const id = setInterval(load, 15000);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  const last24hAlerts = useMemo(() => {
    return recentAlerts.filter((a) => {
      const t = parseAlertTime(a);
      return t > 0 && t >= oneDayAgo;
    });
  }, [recentAlerts, oneDayAgo]);

  const upCount = useMemo(
    () => last24hAlerts.filter((a) => getAlertDirection(a) === "UP").length,
    [last24hAlerts]
  );

  const downCount = useMemo(
    () => last24hAlerts.filter((a) => getAlertDirection(a) === "DOWN").length,
    [last24hAlerts]
  );

  const otherCount = Math.max(0, last24hAlerts.length - upCount - downCount);

  const latestAlertTime =
    recentAlerts
      .map(parseAlertTime)
      .filter((t) => t > 0)
      .sort((a, b) => b - a)[0] || null;

  const recentAlertDetail =
    last24hAlerts.length > 0
      ? `Last 24h: ${last24hAlerts.length} alerts · ${upCount} UP · ${downCount} DOWN${
          otherCount ? ` · ${otherCount} other` : ""
        }`
      : "Last 24h: 0 alerts · quiet";

  const recentAlertSubtext = err
    ? `Live alert warning: ${err}`
    : formatLastUpdated(latestAlertTime);

  const alertMood = useMemo(() => {
    if (last24hAlerts.length === 0) {
      return {
        badge: "QUIET",
        text: "Quiet / No Strong Edge",
        detail: "0 alerts in the last 24h",
        cardClass:
          "bg-[#111827] border-white/10 text-slate-100",
        iconClass: "text-slate-300",
        badgeClass: "bg-white/10 text-slate-200 border border-white/10",
        textClass: "text-white",
      };
    }

    const totalDirectional = upCount + downCount;

    if (totalDirectional === 0) {
      return {
        badge: "MIXED",
        text: "Mixed Alert Conditions",
        detail: `${last24hAlerts.length} alerts · direction unclear`,
        cardClass:
          "bg-[#122033] border-blue-400/25 text-slate-100",
        iconClass: "text-blue-300",
        badgeClass: "bg-blue-400/15 text-blue-200 border border-blue-300/20",
        textClass: "text-white",
      };
    }

    const upShare = upCount / totalDirectional;
    const downShare = downCount / totalDirectional;

    if (upShare >= 0.6) {
      return {
        badge: "UP BIAS",
        text: "Bullish Alert Bias",
        detail: `${upCount} UP · ${downCount} DOWN in the last 24h`,
        cardClass:
          "bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_34%),#102323] border-emerald-300/35 text-slate-100",
        iconClass: "text-emerald-300",
        badgeClass: "bg-emerald-300/15 text-emerald-100 border border-emerald-200/25",
        textClass: "text-emerald-100",
      };
    }

    if (downShare >= 0.6) {
      return {
        badge: "DOWN BIAS",
        text: "Bearish Alert Bias",
        detail: `${upCount} UP · ${downCount} DOWN in the last 24h`,
        cardClass:
          "bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.16),transparent_34%),#271c16] border-orange-300/35 text-slate-100",
        iconClass: "text-orange-300",
        badgeClass: "bg-orange-300/15 text-orange-100 border border-orange-200/25",
        textClass: "text-orange-100",
      };
    }

    return {
      badge: "MIXED",
      text: "Mixed Alert Conditions",
      detail: `${upCount} UP · ${downCount} DOWN in the last 24h`,
      cardClass:
        "bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_34%),#122033] border-blue-300/30 text-slate-100",
      iconClass: "text-blue-300",
      badgeClass: "bg-blue-300/15 text-blue-100 border border-blue-200/25",
      textClass: "text-blue-100",
    };
  }, [last24hAlerts.length, upCount, downCount]);

  const recentActivity = useMemo(() => {
    const events: { time: number; label: string; tone: string }[] = [];

    for (const a of recentAlerts.slice(-10)) {
      const t = parseAlertTime(a);
      if (!t) continue;

      const dir = getAlertDirection(a);
      events.push({
        time: t,
        label: `${symbolOf(a)} ${dir === "OTHER" ? "" : dir} alert emitted`.trim(),
        tone:
          dir === "UP"
            ? "text-emerald-300"
            : dir === "DOWN"
            ? "text-orange-300"
            : "text-slate-300",
      });
    }

    for (const t of openTrades.slice(0, 10)) {
      const tv = activityTimeValue(t);
      if (!tv) continue;

      events.push({
        time: tv,
        label: `${symbolOf(t)} trade taken`,
        tone: "text-violet-300",
      });
    }

    for (const t of closedTrades.slice(0, 10)) {
      const tv = activityTimeValue(t);
      if (!tv) continue;

      events.push({
        time: tv,
        label: `${symbolOf(t)} trade closed`,
        tone: "text-emerald-300",
      });
    }

    for (const d of dismissedAlerts.slice(0, 10)) {
      const tv = activityTimeValue(d);
      if (!tv) continue;

      events.push({
        time: tv,
        label: `${symbolOf(d)} alert dismissed`,
        tone: "text-slate-300",
      });
    }

    return events.sort((a, b) => b.time - a.time).slice(0, 8);
  }, [recentAlerts, openTrades, closedTrades, dismissedAlerts]);

  return (
    <div className="space-y-6">
      {/* HERO / COMMAND CENTER */}
      <section className="relative overflow-hidden rounded-[32px] border border-white/15 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_30%),linear-gradient(135deg,#101827_0%,#162335_55%,#0b111c_100%)] p-6 md:p-7 shadow-[0_22px_70px_rgba(0,0,0,0.32)]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:38px_38px]" />

        <div className="relative z-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-100">
                <Radio className="h-3 w-3" />
                Live command layer
              </div>

              <h1 className="mt-4 text-3xl md:text-4xl font-black tracking-tight text-white">
                Signal97 Command Center
              </h1>

              <p className="mt-2 max-w-2xl text-sm md:text-base text-slate-300">
                Live signal monitoring, alert mood, open trade status, and system health in one trading workspace.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs text-slate-300 backdrop-blur">
              <div className="flex items-center gap-2">
                <ShieldCheck className={connOk ? "h-4 w-4 text-emerald-300" : "h-4 w-4 text-rose-300"} />
                <span className="font-semibold text-white">VM Connection:</span>
                <span>{connOk ? "Connected" : "Not connected"}</span>
                <span>{connOk ? "✅" : "❌"}</span>
              </div>

              {checkedAt ? (
                <div className="mt-1 text-[10px] text-slate-400">
                  Checked: {checkedAt}
                </div>
              ) : null}
            </div>
          </div>

          {err && (
            <div className="mt-5 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-100">
              Live load warning: {err}
            </div>
          )}

          <div className="mt-7 grid gap-4 md:grid-cols-4">
            <div className={`flex min-h-[170px] flex-col justify-between rounded-3xl border px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${alertMood.cardClass}`}>
              <div className="flex items-center justify-between gap-3">
                <div className={`flex items-center gap-2 text-xs font-semibold ${alertMood.iconClass}`}>
                  <Activity className="h-4 w-4" />
                  <span>Signal97 Alert Mood</span>
                </div>

                <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${alertMood.badgeClass}`}>
                  {alertMood.badge}
                </span>
              </div>

              <div className={`text-xl md:text-2xl font-black leading-tight ${alertMood.textClass}`}>
                {alertMood.text}
              </div>

              <div className="text-[11px] text-slate-300">
                {alertMood.detail}
              </div>
            </div>

            <MetricCard
              icon={<Eye className="h-4 w-4" />}
              label="Watching"
              value={watching.toLocaleString()}
              suffix="symbols"
              accent="blue"
            />

            <div className="flex min-h-[170px] flex-col justify-between rounded-3xl border border-orange-300/25 bg-[radial-gradient(circle_at_top_right,rgba(251,146,60,0.13),transparent_34%),#151f2e] px-5 py-5 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-orange-300 text-xs font-semibold">
                  <Bell className="h-4 w-4" />
                  <span>Recent Signal97 Alerts</span>
                </div>

                <span
                  className={
                    "rounded-full border px-2 py-0.5 text-[9px] font-bold " +
                    (last24hAlerts.length === 0
                      ? "border-white/10 bg-white/10 text-slate-200"
                      : upCount > downCount
                      ? "border-emerald-200/25 bg-emerald-300/15 text-emerald-100"
                      : downCount > upCount
                      ? "border-orange-200/25 bg-orange-300/15 text-orange-100"
                      : "border-blue-200/25 bg-blue-300/15 text-blue-100")
                  }
                >
                  {last24hAlerts.length === 0
                    ? "QUIET"
                    : upCount > downCount
                    ? "UP BIAS"
                    : downCount > upCount
                    ? "DOWN BIAS"
                    : "MIXED"}
                </span>
              </div>

              <div>
                <div className="text-3xl font-black text-white">
                  {last24hAlerts.length.toLocaleString()}
                </div>

                <div className="mt-1 text-[11px] text-slate-300 leading-snug">
                  {recentAlertDetail}
                </div>
              </div>

              <div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <MiniCount label="UP" value={upCount} tone="up" />
                  <MiniCount label="DOWN" value={downCount} tone="down" />
                  <MiniCount label="OTHER" value={otherCount} tone="other" />
                </div>

                <div className="mt-2 text-[9px] text-slate-400">
                  {recentAlertSubtext}
                </div>
              </div>
            </div>

            <MetricCard
              icon={<BarChart2 className="h-4 w-4" />}
              label="Open trades"
              value={openTrades.length.toLocaleString()}
              suffix="currently marked as taken"
              accent="purple"
            />
          </div>

          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="mb-3 text-xs font-semibold text-slate-400">
              Quick actions
            </div>

            <div className="flex flex-wrap gap-2">
              <QuickAction onClick={() => onNavigate?.("Signal 97 Alerts")}>
                View alerts
              </QuickAction>

              <QuickAction onClick={() => onNavigate?.("Active Trades")}>
                Check trades
              </QuickAction>

              <QuickAction onClick={() => onNavigate?.("P&L / Performance")}>
                Performance report
              </QuickAction>

              <QuickAction onClick={() => onNavigate?.("Tools")}>
                Open tools
              </QuickAction>
            </div>
          </div>
        </div>
      </section>

      {/* RECENT ACTIVITY */}
      <section className="relative overflow-hidden rounded-[32px] border border-white/15 bg-[linear-gradient(135deg,#101827_0%,#162335_55%,#0b111c_100%)] p-6 md:p-7 shadow-[0_22px_70px_rgba(0,0,0,0.28)]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:38px_38px]" />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                Activity stream
              </div>

              <h2 className="mt-1 text-xl font-black text-white">
                Recent Activity
              </h2>
            </div>

            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold text-slate-300">
              {recentActivity.length} latest
            </div>
          </div>

          {recentActivity.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-5 text-xs text-slate-400">
              No recent live activity yet. New alerts, taken trades, closed trades, and dismissed alerts will appear here.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {recentActivity.map((item, idx) => (
                <div
                  key={`${item.time}-${idx}`}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#0b1423]/80 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-slate-300 shadow-[0_0_14px_rgba(148,163,184,0.45)]" />

                  <div className="min-w-0">
                    <div className={`text-xs font-bold ${item.tone}`}>
                      {formatTime(item.time / 1000)} — {item.label}
                    </div>

                    <div className="text-[10px] text-slate-500">
                      {new Date(item.time).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  suffix,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix: string;
  accent: "blue" | "purple";
}) {
  const styles =
    accent === "blue"
      ? {
          card: "border-blue-300/25 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_34%),#121f33]",
          icon: "text-blue-300",
        }
      : {
          card: "border-violet-300/25 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.16),transparent_34%),#19172f]",
          icon: "text-violet-300",
        };

  return (
    <div className={`flex min-h-[170px] flex-col justify-between rounded-3xl border px-5 py-5 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${styles.card}`}>
      <div className={`flex items-center gap-2 text-xs font-semibold ${styles.icon}`}>
        {icon}
        <span>{label}</span>
      </div>

      <div>
        <div className="text-3xl font-black text-white">
          {value}
        </div>

        <div className="mt-1 text-[11px] text-slate-400">
          {suffix}
        </div>
      </div>
    </div>
  );
}

function MiniCount({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "up" | "down" | "other";
}) {
  const cls =
    tone === "up"
      ? "text-emerald-200 bg-emerald-300/10 border-emerald-200/20"
      : tone === "down"
      ? "text-orange-200 bg-orange-300/10 border-orange-200/20"
      : "text-slate-200 bg-white/5 border-white/10";

  return (
    <div className={`rounded-xl border px-2 py-1 ${cls}`}>
      <div className="text-sm font-black">{value}</div>
      <div className="text-[8px] font-bold">{label}</div>
    </div>
  );
}

function QuickAction({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-200 transition-all hover:-translate-y-[1px] hover:border-emerald-300/35 hover:bg-emerald-300/10 hover:text-white"
    >
      {children}
      <ArrowRight className="h-3 w-3 text-slate-400 transition group-hover:text-emerald-200" />
    </button>
  );
}
