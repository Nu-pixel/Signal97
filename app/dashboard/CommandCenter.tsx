"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Activity, Eye, Bell, BarChart2, ArrowRight } from "lucide-react";

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
        cardClass: "bg-slate-50 border-slate-100",
        iconClass: "text-slate-600",
        badgeClass: "bg-slate-100 text-slate-700",
        textClass: "text-slate-900",
      };
    }

    const totalDirectional = upCount + downCount;

    if (totalDirectional === 0) {
      return {
        badge: "MIXED",
        text: "Mixed Alert Conditions",
        detail: `${last24hAlerts.length} alerts · direction unclear`,
        cardClass: "bg-blue-50 border-blue-100",
        iconClass: "text-blue-600",
        badgeClass: "bg-blue-100 text-blue-700",
        textClass: "text-blue-900",
      };
    }

    const upShare = upCount / totalDirectional;
    const downShare = downCount / totalDirectional;

    if (upShare >= 0.6) {
      return {
        badge: "UP BIAS",
        text: "Bullish Alert Bias",
        detail: `${upCount} UP · ${downCount} DOWN in the last 24h`,
        cardClass: "bg-emerald-50 border-emerald-100",
        iconClass: "text-emerald-600",
        badgeClass: "bg-emerald-100 text-emerald-700",
        textClass: "text-emerald-900",
      };
    }

    if (downShare >= 0.6) {
      return {
        badge: "DOWN BIAS",
        text: "Bearish Alert Bias",
        detail: `${upCount} UP · ${downCount} DOWN in the last 24h`,
        cardClass: "bg-orange-50 border-orange-100",
        iconClass: "text-orange-600",
        badgeClass: "bg-orange-100 text-orange-700",
        textClass: "text-orange-900",
      };
    }

    return {
      badge: "MIXED",
      text: "Mixed Alert Conditions",
      detail: `${upCount} UP · ${downCount} DOWN in the last 24h`,
      cardClass: "bg-blue-50 border-blue-100",
      iconClass: "text-blue-600",
      badgeClass: "bg-blue-100 text-blue-700",
      textClass: "text-blue-900",
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
            ? "text-emerald-700"
            : dir === "DOWN"
            ? "text-orange-700"
            : "text-slate-700",
      });
    }

    for (const t of openTrades.slice(0, 10)) {
      const tv = activityTimeValue(t);
      if (!tv) continue;

      events.push({
        time: tv,
        label: `${symbolOf(t)} trade taken`,
        tone: "text-purple-700",
      });
    }

    for (const t of closedTrades.slice(0, 10)) {
      const tv = activityTimeValue(t);
      if (!tv) continue;

      events.push({
        time: tv,
        label: `${symbolOf(t)} trade closed`,
        tone: "text-emerald-700",
      });
    }

    for (const d of dismissedAlerts.slice(0, 10)) {
      const tv = activityTimeValue(d);
      if (!tv) continue;

      events.push({
        time: tv,
        label: `${symbolOf(d)} alert dismissed`,
        tone: "text-slate-700",
      });
    }

    return events.sort((a, b) => b.time - a.time).slice(0, 8);
  }, [recentAlerts, openTrades, closedTrades, dismissedAlerts]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          Today at a glance
        </h1>

        <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-700">
          <span className="font-semibold">VM Connection:</span>{" "}
          {connOk ? "Connected ✅" : "Not connected ❌"}
          {checkedAt ? (
            <span className="text-slate-500"> (checked: {checkedAt})</span>
          ) : null}
        </div>

        {err && (
          <div className="mb-4 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3">
            Live load warning: {err}
          </div>
        )}

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div
            className={`flex flex-col justify-between border rounded-2xl px-4 py-4 ${alertMood.cardClass}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className={`flex items-center gap-2 text-xs font-medium ${alertMood.iconClass}`}
              >
                <Activity className="w-4 h-4" />
                <span>Signal97 Alert Mood</span>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-[10px] font-semibold ${alertMood.badgeClass}`}
              >
                {alertMood.badge}
              </span>
            </div>

            <div
              className={`text-lg md:text-xl font-semibold leading-snug ${alertMood.textClass}`}
            >
              {alertMood.text}
            </div>

            <div className="mt-1 text-[10px] text-slate-500">
              {alertMood.detail}
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
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-amber-600 text-xs font-medium">
                <Bell className="w-4 h-4" />
                <span>Recent Signal97 Alerts</span>
              </div>

              <span
                className={
                  "rounded-full px-2 py-0.5 text-[9px] font-semibold " +
                  (last24hAlerts.length === 0
                    ? "bg-slate-100 text-slate-600"
                    : upCount > downCount
                    ? "bg-emerald-100 text-emerald-700"
                    : downCount > upCount
                    ? "bg-orange-100 text-orange-700"
                    : "bg-blue-100 text-blue-700")
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

            <div className="text-lg md:text-xl font-semibold text-slate-900">
              {last24hAlerts.length.toLocaleString()}
            </div>

            <div className="mt-1 text-[10px] text-slate-600 leading-snug">
              {recentAlertDetail}
            </div>

            <div className="mt-2 grid grid-cols-3 gap-1 text-center">
              <div className="rounded-xl bg-white/70 px-2 py-1">
                <div className="text-sm font-semibold text-emerald-700">{upCount}</div>
                <div className="text-[8px] text-emerald-700">UP</div>
              </div>

              <div className="rounded-xl bg-white/70 px-2 py-1">
                <div className="text-sm font-semibold text-orange-700">{downCount}</div>
                <div className="text-[8px] text-orange-700">DOWN</div>
              </div>

              <div className="rounded-xl bg-white/70 px-2 py-1">
                <div className="text-sm font-semibold text-slate-700">{otherCount}</div>
                <div className="text-[8px] text-slate-600">OTHER</div>
              </div>
            </div>

            <div className="mt-2 text-[9px] text-slate-400">
              {recentAlertSubtext}
            </div>
          </div>

          <div className="flex flex-col justify-between bg-purple-50 border border-purple-100 rounded-2xl px-4 py-4">
            <div className="flex items-center gap-2 text-purple-600 text-xs font-medium mb-2">
              <BarChart2 className="w-4 h-4" />
              <span>Open trades</span>
            </div>

            <div className="text-lg md:text-xl font-semibold text-slate-900">
              {openTrades.length.toLocaleString()}
            </div>

            <div className="mt-1 text-[10px] text-slate-500">
              Trades currently marked as taken
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <div className="text-xs text-slate-500 mb-2">Quick actions</div>

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

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Recent Activity
        </h2>

        {recentActivity.length === 0 ? (
          <div className="text-xs text-slate-500">
            No recent live activity yet. New alerts, taken trades, closed trades,
            and dismissed alerts will appear here.
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((item, idx) => (
              <div
                key={`${item.time}-${idx}`}
                className="flex items-start gap-3 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3"
              >
                <div className="mt-1 h-2 w-2 rounded-full bg-slate-300" />

                <div className="min-w-0">
                  <div className={`text-xs font-semibold ${item.tone}`}>
                    {formatTime(item.time / 1000)} — {item.label}
                  </div>

                  <div className="text-[10px] text-slate-400">
                    {new Date(item.time).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
    >
      {children}
      <ArrowRight className="w-3 h-3 text-slate-400" />
    </button>
  );
}
