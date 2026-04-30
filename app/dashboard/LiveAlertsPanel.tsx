"use client";

import { useEffect, useMemo, useState } from "react";

// This matches the columns coming from forecast_scored.csv / /alerts/live
type RawAlert = {
  alert_key?: string;

  symbol?: string;
  direction?: string;
  direction_rule_direction?: string;
  entry_time_12h_ct?: string;
  forecast_time_12h_ct?: string;
  forecast_time?: string; // ISO fallback
  forecast_pct?: number | string;
  signal?: string;
  entry_price?: number | string;
  price?: number | string;
  close?: number | string;
  raw_hit_price?: number | string;
  forecast_confidence?: number | string;
  rule_label?: string;
  direction_rule?: string;
  direction_rule_view?: string;

  flow_score?: number | string;
  edge_z?: number | string;
  edge_p?: number | string;
  sub4_risk?: number | string;
  lda_edge_p?: number | string;
  lda_sub4_p?: number | string;
  tail_concord3?: number | string;
  tail_concordX?: number | string;
  tail_guard_score?: number | string;

  success7d_prob?: number | string;
  success7d_low?: number | string;
  success7d_high?: number | string;
  success7d_n_eff?: number | string;
  success7d_cal?: number | string;
  direction_score?: number | string;

  tp1_pct?: number | string;
  tp2_pct?: number | string;
  stop_pct?: number | string;
  trail_trigger_pct?: number | string;
};

type DirectionTone = "up" | "down" | "flat";
type ConfidenceTier = {
  tier: "Tier 1" | "Tier 2" | "Tier 3" | "Standard";
  title: string;
  description: string;
  className: string;
};
type NotifyMode = "TIER1" | "TIER1_TIER2" | "ALL";
type ViewDensity = "compact" | "comfortable";
type ThemeMode = "light" | "dark";

type Signal97Settings = {
  notifyMode: NotifyMode;

  showTier1: boolean;
  showTier2: boolean;
  showTier3: boolean;
  showStandard: boolean;

  showUp: boolean;
  showDown: boolean;

  hideOlderThanDays: number;

  viewDensity: ViewDensity;
  theme: ThemeMode;
  showAdvancedMetrics: boolean;
};

type AlertQuickFilters = {
  direction: "ALL" | "UP" | "DOWN";
  minPrice: string;
  maxPrice: string;
};
interface AlertCardData {
  symbol: string;
  directionText: string;
  tone: DirectionTone;
  entryTime: string;
  forecastTime: string;
  forecastPct?: number;
  signal?: string;
  rawHitPrice?: number;
  forecastConfidence?: number;
  confidenceTier: ConfidenceTier;
  directionRuleDirection?: string;
  // All extra fields:
  rule_label?: string;
  direction_rule?: string;
  direction_rule_view?: string;

  flow_score?: number;
  edge_z?: number;
  edge_p?: number;
  sub4_risk?: number;
  lda_edge_p?: number;
  lda_sub4_p?: number;
  tail_concord3?: number;
  tail_concordX?: number;
  tail_guard_score?: number;

  success7d_prob?: number;
  success7d_low?: number;
  success7d_high?: number;
  success7d_n_eff?: number;
  success7d_cal?: number;
  direction_score?: number;

  tp1_pct?: number;
  tp2_pct?: number;
  stop_pct?: number;
  trail_trigger_pct?: number;
}

const toneBg: Record<DirectionTone, string> = {
  up: "bg-emerald-50 border border-emerald-100",
  down: "bg-rose-50 border border-rose-100",
  flat: "bg-slate-50 border border-slate-100",
};

const toneLabel: Record<DirectionTone, string> = {
  up: "UP",
  down: "DOWN",
  flat: "NEUTRAL",
};

const toneLabelClass: Record<DirectionTone, string> = {
  up: "bg-emerald-600 text-white",
  down: "bg-rose-500 text-white",
  flat: "bg-slate-500 text-white",
};

// ---------- helpers ----------

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || (data as any)?.ok === false) {
    const msg =
      (data as any)?.error || (data as any)?.detail || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

function asNumber(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
const SETTINGS_KEY = "signal97_user_settings_v1";

const DEFAULT_ALERT_SETTINGS: Signal97Settings = {
  notifyMode: "ALL",

  showTier1: true,
  showTier2: true,
  showTier3: true,
  showStandard: true,

  showUp: true,
  showDown: true,

  hideOlderThanDays: 20,

  viewDensity: "comfortable",
  theme: "light",
  showAdvancedMetrics: true,
};

function readAlertSettings(): Signal97Settings {
  if (typeof window === "undefined") return DEFAULT_ALERT_SETTINGS;

  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_ALERT_SETTINGS;

    return {
      ...DEFAULT_ALERT_SETTINGS,
      ...JSON.parse(raw),
    };
  } catch {
    return DEFAULT_ALERT_SETTINGS;
  }
}

function alertTimeMs(raw: RawAlert): number {
  const rawTime =
    raw.forecast_time ||
    raw.forecast_time_12h_ct ||
    raw.entry_time_12h_ct ||
    "";

  const t = new Date(rawTime).getTime();
  return Number.isFinite(t) ? t : 0;
}

function alertPrice(raw: RawAlert, card: AlertCardData): number | undefined {
  return (
    asNumber(raw.raw_hit_price) ??
    asNumber(raw.entry_price) ??
    asNumber(raw.price) ??
    asNumber(raw.close) ??
    card.rawHitPrice
  );
}

function passesSettings(
  row: { raw: RawAlert; card: AlertCardData },
  settings: Signal97Settings
): boolean {
  const tier = row.card.confidenceTier.tier;

  if (tier === "Tier 1" && !settings.showTier1) return false;
  if (tier === "Tier 2" && !settings.showTier2) return false;
  if (tier === "Tier 3" && !settings.showTier3) return false;
  if (tier === "Standard" && !settings.showStandard) return false;

  if (row.card.tone === "up" && !settings.showUp) return false;
  if (row.card.tone === "down" && !settings.showDown) return false;

  const maxAgeDays = Number(settings.hideOlderThanDays) || 20;
  const t = alertTimeMs(row.raw);

  if (t > 0 && Date.now() - t > maxAgeDays * 24 * 60 * 60 * 1000) {
    return false;
  }

  return true;
}

function passesQuickFilters(
  row: { raw: RawAlert; card: AlertCardData },
  filters: AlertQuickFilters
): boolean {
  if (filters.direction === "UP" && row.card.tone !== "up") return false;
  if (filters.direction === "DOWN" && row.card.tone !== "down") return false;

  const minPrice = Number(filters.minPrice);
  const maxPrice = Number(filters.maxPrice);
  const price = alertPrice(row.raw, row.card);

  if (filters.minPrice.trim() !== "") {
    if (price === undefined || !Number.isFinite(minPrice) || price < minPrice) {
      return false;
    }
  }

  if (filters.maxPrice.trim() !== "") {
    if (price === undefined || !Number.isFinite(maxPrice) || price > maxPrice) {
      return false;
    }
  }

  return true;
}
function getConfidenceTier(raw: RawAlert): ConfidenceTier {
  const directionRule = String(raw.direction_rule || "");
  const directionRuleView = String(raw.direction_rule_view || "");
  const forecastConfidence = String(raw.forecast_confidence || "");
  const ruleLabel = String(raw.rule_label || "");
  const signal = String(raw.signal || "");

  const text = [
    directionRule,
    directionRuleView,
    forecastConfidence,
    ruleLabel,
    signal,
  ].join(" ");

  const hasDart = text.includes("🎯");
  const hasSunrise = text.includes("🌅");
  const hasSnowfall = text.includes("❄");
  const hasChick = text.includes("🐣");

  // Tier 1: top confidence marker, like "🎯🌅 FJ1" or "🎯❄️ ..."
  if (hasDart && (hasSunrise || hasSnowfall)) {
    return {
      tier: "Tier 1",
      title: "Top Confidence",
      description: "Top Signal97 confidence tier based on probability rule marker.",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  }

  // Tier 2: Sunrise/Snowfall marker without dart
  if (hasSunrise || hasSnowfall) {
    return {
      tier: "Tier 2",
      title: "Strong Confidence",
      description: "Strong Signal97 confidence tier based on probability rule marker.",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    };
  }

  // Tier 3: chick marker, riskier setup
  if (hasChick) {
    return {
      tier: "Tier 3",
      title: "Speculative",
      description: "Riskier Signal97 confidence tier. Use more caution.",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    };
  }

  return {
    tier: "Standard",
    title: "Standard Alert",
    description: "No Signal97 tier marker detected.",
    className: "bg-slate-50 text-slate-700 border-slate-200",
  };
}
function deduceTone(
  directionRuleDirection?: string,
  direction?: string
): DirectionTone {
  const d = (directionRuleDirection || direction || "").toUpperCase();

  if (
    d.includes("UP") ||
    d.includes("CALL") ||
    d.includes("LONG") ||
    d.includes("SUNRISE")
  ) {
    return "up";
  }

  if (
    d.includes("DOWN") ||
    d.includes("PUT") ||
    d.includes("SHORT") ||
    d.includes("SNOWFALL")
  ) {
    return "down";
  }

  return "flat";
}

function prettyDirection(
  directionRuleDirection?: string,
  direction?: string
): string {
  const d = (directionRuleDirection || direction || "").toUpperCase();

  if (d.includes("UP") || d.includes("CALL") || d.includes("SUNRISE")) {
    return "Up move (CALL / Sunrise bias)";
  }

  if (d.includes("DOWN") || d.includes("PUT") || d.includes("SNOWFALL")) {
    return "Down move (PUT / Snowfall bias)";
  }

  return directionRuleDirection || direction || "Neutral / not set";
}

function formatTimeLabel(t12h?: string, iso?: string): string {
  if (t12h && t12h.trim().length > 0) return t12h;
  if (!iso) return "";

  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "";

  return dt.toLocaleString();
}

function mapRawToCard(raw: RawAlert): AlertCardData {
  const symbol = raw.symbol || "?";
  const tone = deduceTone(raw.direction_rule_direction, raw.direction);
  const directionText = prettyDirection(
    raw.direction_rule_direction,
    raw.direction
  );

  const forecastPct = asNumber(raw.forecast_pct);
  const rawHitPrice = asNumber(raw.raw_hit_price);
  const forecastConfidence = asNumber(raw.forecast_confidence);
  const confidenceTier = getConfidenceTier(raw);
  return {
    symbol,
    tone,
    directionText,
    entryTime: formatTimeLabel(raw.entry_time_12h_ct, undefined),
    forecastTime: formatTimeLabel(raw.forecast_time_12h_ct, raw.forecast_time),
    forecastPct,
    signal: raw.signal,
    rawHitPrice,
    forecastConfidence,
    confidenceTier,
    directionRuleDirection: raw.direction_rule_direction,

    rule_label: raw.rule_label,
    direction_rule: raw.direction_rule,
    direction_rule_view: raw.direction_rule_view,

    flow_score: asNumber(raw.flow_score),
    edge_z: asNumber(raw.edge_z),
    edge_p: asNumber(raw.edge_p),
    sub4_risk: asNumber(raw.sub4_risk),
    lda_edge_p: asNumber(raw.lda_edge_p),
    lda_sub4_p: asNumber(raw.lda_sub4_p),
    tail_concord3: asNumber(raw.tail_concord3),
    tail_concordX: asNumber(raw.tail_concordX),
    tail_guard_score: asNumber(raw.tail_guard_score),

    success7d_prob: asNumber(raw.success7d_prob),
    success7d_low: asNumber(raw.success7d_low),
    success7d_high: asNumber(raw.success7d_high),
    success7d_n_eff: asNumber(raw.success7d_n_eff),
    success7d_cal: asNumber(raw.success7d_cal),
    direction_score: asNumber(raw.direction_score),

    tp1_pct: asNumber(raw.tp1_pct),
    tp2_pct: asNumber(raw.tp2_pct),
    stop_pct: asNumber(raw.stop_pct),
    trail_trigger_pct: asNumber(raw.trail_trigger_pct),
  };
}

// ---------- main component ----------

export default function LiveAlertsPanel() {
  const [allAlerts, setAllAlerts] = useState<
    { raw: RawAlert; card: AlertCardData }[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [alertSettings, setAlertSettings] =
    useState<Signal97Settings>(DEFAULT_ALERT_SETTINGS);

  const [quickFilters, setQuickFilters] = useState<AlertQuickFilters>({
    direction: "ALL",
    minPrice: "",
    maxPrice: "",
  });

  const alerts = useMemo(() => {
    return allAlerts.filter(
      (row) =>
        passesSettings(row, alertSettings) &&
        passesQuickFilters(row, quickFilters)
    );
  }, [allAlerts, alertSettings, quickFilters]);

  // key for "button busy" so users can't double-click Take/Dismiss/Star
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // pinned alerts only affect UI order
  const [pinnedKeys, setPinnedKeys] = useState<Set<string>>(new Set());

  function makeKey(a: RawAlert) {
    // Prefer VM-generated key. Fallback is kept for older rows.
    if (a.alert_key) return String(a.alert_key);

    return [
      a.symbol || "",
      a.direction_rule_direction || a.direction || "",
      a.forecast_time || a.forecast_time_12h_ct || "",
      a.entry_time_12h_ct || "",
      String(a.forecast_pct ?? ""),
    ].join("|");
  }

  function togglePin(key: string) {
    setPinnedKeys((old) => {
      const next = new Set(old);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  }

  async function loadAlerts() {
    try {
      const res = await fetch("/api/live-alerts", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      const rawAlerts: RawAlert[] = data.alerts ?? [];

      const mapped = rawAlerts
        .map((r) => ({ raw: r, card: mapRawToCard(r) }))
        .sort((a, b) => {
          const ak = makeKey(a.raw);
          const bk = makeKey(b.raw);

          const ap = pinnedKeys.has(ak) ? 1 : 0;
          const bp = pinnedKeys.has(bk) ? 1 : 0;

          // Pinned alerts first
          if (bp !== ap) return bp - ap;

          // Newest alerts first
          const at = new Date(
            a.raw.forecast_time || a.raw.forecast_time_12h_ct || 0
          ).getTime();

          const bt = new Date(
            b.raw.forecast_time || b.raw.forecast_time_12h_ct || 0
          ).getTime();

          return bt - at;
        });


      setAllAlerts(mapped);
    } catch (err) {
      console.error("Failed to load alerts", err);
    } finally {
      setLoading(false);
    }
  }

  // Take = move to Active Trades and remove from Signal97 Alerts
  async function onTake(rawAlert: RawAlert) {
    const key = makeKey(rawAlert);
    setBusyKey(key);

    try {
      await postJson("/api/take-alert", { alert: rawAlert });

      // Immediately remove from this page
      setAllAlerts((prev) => prev.filter((x) => makeKey(x.raw) !== key));
    } finally {
      setBusyKey(null);
    }
  }

  // Dismiss = move to Dismissed Alerts and remove from Signal97 Alerts
  async function onDismiss(rawAlert: RawAlert) {
    const key = makeKey(rawAlert);
    setBusyKey(key);

    try {
      await postJson("/api/dismiss-alert", {
        alert: rawAlert,
        reason: "manual",
      });

      // Immediately remove from this page
      setAllAlerts((prev) => prev.filter((x) => makeKey(x.raw) !== key));
    } finally {
      setBusyKey(null);
    }
  }

  useEffect(() => {
    loadAlerts();
    const id = setInterval(loadAlerts, 15000);
    return () => clearInterval(id);
    // pinnedKeys is included so Star/Pin re-sorts alerts
  }, [pinnedKeys]);

  useEffect(() => {
    const apply = () => {
      const next = readAlertSettings();
      setAlertSettings(next);

      document.documentElement.style.colorScheme = next.theme;
      document.documentElement.classList.toggle("dark", next.theme === "dark");
    };

    apply();

    window.addEventListener("signal97-settings-changed", apply);
    window.addEventListener("storage", apply);

    return () => {
      window.removeEventListener("signal97-settings-changed", apply);
      window.removeEventListener("storage", apply);
    };
  }, []);
  
  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <div className="text-sm text-slate-500">Loading live alerts…</div>
      </div>
    );
  }

  if (!allAlerts.length) {
    const sample: AlertCardData = {
      symbol: "AAPL",
      tone: "up",
      directionText: "Up move (CALL / Sunrise bias)",
      entryTime: "12/09/2025 9:40 AM CT",
      forecastTime: "12/09/2025 9:45 AM CT",
      forecastPct: 5,
      confidenceTier: {
        tier: "Tier 1",
        title: "Top Confidence",
        description: "Top Signal97 confidence tier based on probability rule marker.",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      },
      signal: "0.6% → 1.5% breakout",
      rawHitPrice: 195.25,
      forecastConfidence: 5,
      directionRuleDirection: "UP",
      rule_label: "💎 Confidence — 5% trial alert for 1.5 (CALL)",
      direction_rule_view: "Direction: UP · Flow: GO",
    };

    return (
      <div className="space-y-5">
        <AlertsPageHeader alerts={allAlerts} />

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-5">
          <p className="text-xs text-slate-500">
            No live alerts yet. When a new alert fires, you&apos;ll see:
          </p>

          <AlertBubble
            alert={sample}
            rawAlert={{}}
            busy={false}
            pinned={false}
            onTake={async () => window.alert("No live alerts yet.")}
            onDismiss={async () => window.alert("No live alerts yet.")}
            compact={alertSettings.viewDensity === "compact"}
            showAdvancedMetrics={alertSettings.showAdvancedMetrics}
            onTogglePin={() => window.alert("No live alerts yet.")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <AlertsPageHeader alerts={alerts} />

      <AlertFilterPanel
        allCount={allAlerts.length}
        filteredCount={alerts.length}
        filters={quickFilters}
        onChange={setQuickFilters}
      />

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-4">
        {!alerts.length && (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white px-6 py-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              ⌕
            </div>

            <h2 className="text-lg font-bold text-slate-900">
              No alerts match your filters
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
              Try switching to All directions, clearing the price range, or changing
              your alert tier settings.
            </p>
          </div>
        )}

        {alerts.map((a, idx) => {
          const key = makeKey(a.raw);
          const busy = busyKey === key;

          return (
            <AlertBubble
              key={key || idx}
              alert={a.card}
              rawAlert={a.raw}
              busy={busy}
              pinned={pinnedKeys.has(key)}
              onTake={onTake}
              onDismiss={onDismiss}
              compact={alertSettings.viewDensity === "compact"}
              showAdvancedMetrics={alertSettings.showAdvancedMetrics}
              onTogglePin={() => togglePin(key)}
            />
          );
        })}
      </div>
    </div>
  );
}

function AlertsPageHeader({
  alerts,
}: {
  alerts: { raw: RawAlert; card: AlertCardData }[];
}) {
  const total = alerts.length;

  const tier1 = alerts.filter((a) => a.card.confidenceTier.tier === "Tier 1").length;
  const tier2 = alerts.filter((a) => a.card.confidenceTier.tier === "Tier 2").length;
  const tier3 = alerts.filter((a) => a.card.confidenceTier.tier === "Tier 3").length;
  const standard = alerts.filter((a) => a.card.confidenceTier.tier === "Standard").length;

  const up = alerts.filter((a) => a.card.tone === "up").length;
  const down = alerts.filter((a) => a.card.tone === "down").length;

  const statusText =
    total === 0
      ? "No live alerts"
      : `${total} live alert${total === 1 ? "" : "s"}`;

  return (
    <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-white via-sky-50 to-emerald-50 px-6 py-5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center rounded-full bg-slate-950 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Action inbox
          </div>

          <h1 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight text-slate-950">
            Signal97 Alerts
          </h1>

          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            Fresh, actionable alerts only. Taken alerts move to Active Trades,
            dismissed alerts leave this inbox, and old alerts are archived.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm">
            {statusText}
          </span>

          <span className="rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            {up} UP
          </span>

          <span className="rounded-full bg-rose-50 border border-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700">
            {down} DOWN
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
        <HeaderStat label="Tier 1" value={tier1} tone="emerald" />
        <HeaderStat label="Tier 2" value={tier2} tone="blue" />
        <HeaderStat label="Tier 3" value={tier3} tone="amber" />
        <HeaderStat label="Standard" value={standard} tone="slate" />
      </div>
    </div>
  );
}

function HeaderStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "blue" | "amber" | "slate";
}) {
  const toneClass: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    slate: "bg-slate-50 text-slate-700 border-slate-100",
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClass[tone]}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}


function AlertBubble({
  alert,
  rawAlert,
  busy,
  pinned,
  compact,
  showAdvancedMetrics,
  onTake,
  onDismiss,
  onTogglePin,
}: {
  alert: AlertCardData;
  rawAlert: RawAlert;
  busy: boolean;
  pinned: boolean;
  compact: boolean;
  showAdvancedMetrics: boolean;
  onTake: (a: RawAlert) => Promise<void>;
  onDismiss: (a: RawAlert) => Promise<void>;
  onTogglePin: () => void;
}) {
  return (
    <div
      className={`${toneBg[alert.tone]} rounded-3xl border shadow-sm ${
        compact ? "px-4 py-4" : "px-5 py-5"
      }`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.45fr_0.9fr] gap-5 lg:items-stretch">
        {/* COLUMN 1 — identity / direction / tier */}
        <div className="flex flex-col justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-2xl font-bold tracking-tight text-slate-950">
                {alert.symbol}
              </div>

              <span
                className={`px-3 py-1 rounded-full text-[10px] font-bold ${toneLabelClass[alert.tone]}`}
              >
                {toneLabel[alert.tone]}
              </span>

              {pinned && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                  ★ Pinned
                </span>
              )}
            </div>

            <div className="mt-2 text-xs font-medium text-slate-700">
              {alert.directionText}
            </div>

            <div className="mt-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Confidence tier
              </div>

              <span
                className={`mt-1 inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold ${alert.confidenceTier.className}`}
                title={alert.confidenceTier.description}
              >
                {alert.confidenceTier.tier} · {alert.confidenceTier.title}
              </span>
            </div>
          </div>

          {alert.signal && (
            <div className="rounded-2xl bg-white/60 border border-white/70 px-3 py-2 text-[11px] text-slate-600">
              <span className="font-semibold text-slate-700">Signal:</span>{" "}
              {alert.signal}
            </div>
          )}
        </div>

        {/* COLUMN 2 — price / target / time */}
        <div className="grid grid-cols-2 gap-3">
          <MiniMetric
            label="Target"
            value={
              alert.forecastPct != null
                ? `${alert.forecastPct}% move`
                : "—"
            }
            tone={
              alert.tone === "up"
                ? "emerald"
                : alert.tone === "down"
                ? "rose"
                : "slate"
            }
          />

          <MiniMetric
            label="Hit-bar price"
            value={
              alert.rawHitPrice != null
                ? `$${alert.rawHitPrice.toFixed(2)}`
                : "—"
            }
            tone="blue"
          />

          <MiniMetric
            label="Entry time"
            value={alert.entryTime || "—"}
            tone="slate"
          />

          <MiniMetric
            label="Forecast time"
            value={alert.forecastTime || "—"}
            tone="slate"
          />

          <MiniMetric
            label="TP1 / TP2"
            value={fmtPair(alert.tp1_pct, alert.tp2_pct, true)}
            tone="emerald"
          />

          <MiniMetric
            label="Stop"
            value={fmt(alert.stop_pct, true)}
            tone="amber"
          />
        </div>

        {/* COLUMN 3 — actions / quick risk context */}
        <div className="flex flex-col justify-between gap-4">
          {showAdvancedMetrics && (
            <div className="rounded-2xl bg-white/60 border border-white/70 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-2">
                Quick context
              </div>

              <div className="grid grid-cols-2 gap-2">
                <MiniMetric
                  label="Success"
                  value={fmt(alert.success7d_prob, true)}
                  tone="emerald"
                />

                <MiniMetric
                  label="Sub-4 risk"
                  value={fmt(alert.sub4_risk)}
                  tone="amber"
                />

                <MiniMetric
                  label="Edge"
                  value={fmt(alert.edge_p)}
                  tone="blue"
                />

                <MiniMetric
                  label="Flow"
                  value={fmt(alert.flow_score)}
                  tone="slate"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <ActionButton
              variant="primary"
              disabled={busy}
              onClick={() => onTake(rawAlert)}
            >
              {busy ? "..." : "Take"}
            </ActionButton>

            <ActionButton
              disabled={busy}
              onClick={() => onDismiss(rawAlert)}
            >
              Dismiss
            </ActionButton>

            <ActionButton
              variant={pinned ? "warning" : "default"}
              disabled={busy}
              onClick={onTogglePin}
              title="Pin this alert to the top"
            >
              {pinned ? "★" : "☆ Star"}
            </ActionButton>
          </div>
        </div>
      </div>
      {/* Dropdown */}
      <details className="mt-4 bg-white/70 rounded-2xl px-4 py-3 text-[11px] text-slate-700">
        <summary className="cursor-pointer font-semibold text-slate-800">
          View full Signal 97 breakdown
        </summary>

        <div className="mt-2 space-y-2">
          <InfoRow
            label="Clean confidence tier"
            explain="Professional tier label translated from the Signal97 probability rule marker."
            value={`${alert.confidenceTier.tier} — ${alert.confidenceTier.title}. ${alert.confidenceTier.description}`}
          />

          {alert.rule_label && (
            <InfoRow
              label="Rule label"
              explain="Short description of the confidence rule that fired."
              value={alert.rule_label}
            />
          )}

          {alert.direction_rule_view && (
            <InfoRow
              label="Direction rule"
              explain="Human-readable summary of how direction was decided."
              value={alert.direction_rule_view}
            />
          )}

          <SectionLabel>Probability & edge</SectionLabel>

          <InfoRow
            label="Flow score"
            explain="How strong the short-term flow/momentum looks here."
            value={fmt(alert.flow_score)}
          />

          <InfoRow
            label="Edge z"
            explain="How far this setup is from the average (std devs)."
            value={fmt(alert.edge_z)}
          />

          <InfoRow
            label="Edge p"
            explain="Probability this pattern is part of a profitable cluster (0–1)."
            value={fmt(alert.edge_p)}
          />

          <InfoRow
            label="Sub-4 risk"
            explain="Risk that price fails to clear the 4% region (0–1)."
            value={fmt(alert.sub4_risk)}
          />

          <InfoRow
            label="LDA edge p"
            explain="Probability from LDA model that this looks like past wins."
            value={fmt(alert.lda_edge_p)}
          />

          <InfoRow
            label="LDA sub4 p"
            explain="Probability from LDA that this stalls under 4%."
            value={fmt(alert.lda_sub4_p)}
          />

          <InfoRow
            label="Tail concord (3 / X)"
            explain="How well this matches strong winners."
            value={fmtPair(alert.tail_concord3, alert.tail_concordX)}
          />

          <InfoRow
            label="Tail guard score"
            explain="Guardrail score (high = more cautious)."
            value={fmt(alert.tail_guard_score)}
          />

          <SectionLabel>7-day outcome probabilities</SectionLabel>

          <InfoRow
            label="Success 7d prob"
            explain="Estimated chance this succeeds within 7 days."
            value={fmt(alert.success7d_prob, true)}
          />

          <InfoRow
            label="Success range (low–high)"
            explain="Confidence interval for 7-day success."
            value={
              alert.success7d_low != null && alert.success7d_high != null
                ? `${fmt(alert.success7d_low, true)} – ${fmt(
                    alert.success7d_high,
                    true
                  )}`
                : "—"
            }
          />

          <InfoRow
            label="Effective samples"
            explain="Number of past similar alerts used."
            value={fmt(alert.success7d_n_eff, false)}
          />

          <InfoRow
            label="Calibrated success"
            explain="Final calibrated success probability."
            value={fmt(alert.success7d_cal, true)}
          />

          <InfoRow
            label="Direction score"
            explain="Confidence the move is in this direction."
            value={fmt(alert.direction_score)}
          />

          <SectionLabel>Stops & targets</SectionLabel>

          <InfoRow
            label="TP1 / TP2"
            explain="Suggested take-profit levels."
            value={fmtPair(alert.tp1_pct, alert.tp2_pct, true)}
          />

          <InfoRow
            label="Stop loss"
            explain="Suggested max loss."
            value={fmt(alert.stop_pct, true)}
          />

          <InfoRow
            label="Trail trigger"
            explain="Where trailing stop may start."
            value={fmt(alert.trail_trigger_pct, true)}
          />
        </div>
      </details>
    </div>
  );
}
function AlertFilterPanel({
  allCount,
  filteredCount,
  filters,
  onChange,
}: {
  allCount: number;
  filteredCount: number;
  filters: AlertQuickFilters;
  onChange: (next: AlertQuickFilters) => void;
}) {
  const update = (patch: Partial<AlertQuickFilters>) => {
    onChange({
      ...filters,
      ...patch,
    });
  };

  const clear = () => {
    onChange({
      direction: "ALL",
      minPrice: "",
      maxPrice: "",
    });
  };

  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-sm px-5 py-4">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-slate-900">
            Alert filters
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Showing {filteredCount} of {allCount} live alerts.
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div>
            <div className="text-[10px] font-semibold text-slate-500 mb-1">
              Direction
            </div>

            <div className="flex rounded-2xl bg-slate-100 p-1">
              <FilterButton
                active={filters.direction === "ALL"}
                onClick={() => update({ direction: "ALL" })}
              >
                All
              </FilterButton>

              <FilterButton
                active={filters.direction === "UP"}
                onClick={() => update({ direction: "UP" })}
              >
                UP
              </FilterButton>

              <FilterButton
                active={filters.direction === "DOWN"}
                onClick={() => update({ direction: "DOWN" })}
              >
                DOWN
              </FilterButton>
            </div>
          </div>

          <PriceInput
            label="Min price"
            value={filters.minPrice}
            onChange={(v) => update({ minPrice: v })}
          />

          <PriceInput
            label="Max price"
            value={filters.maxPrice}
            onChange={(v) => update({ maxPrice: v })}
          />

          <button
            type="button"
            onClick={clear}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl px-3 py-1.5 text-xs font-bold transition " +
        (active
          ? "bg-white text-slate-950 shadow-sm"
          : "text-slate-500 hover:text-slate-800")
      }
    >
      {children}
    </button>
  );
}

function PriceInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <div className="text-[10px] font-semibold text-slate-500 mb-1">
        {label}
      </div>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ex: 10"
        inputMode="decimal"
        className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-sky-300"
      />
    </label>
  );
}
function MiniMetric({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string;
  tone?: "emerald" | "rose" | "amber" | "blue" | "slate";
}) {
  const toneClass: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    slate: "bg-white/70 text-slate-700 border-white/80",
  };

  return (
    <div className={`rounded-2xl border px-3 py-2 ${toneClass[tone]}`}>
      <div className="text-[9px] font-semibold uppercase tracking-wide opacity-70">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-bold leading-tight">{value}</div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  variant = "default",
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "primary" | "warning";
  title?: string;
}) {
  const variantClass: Record<string, string> = {
    primary:
      "bg-slate-950 text-white border-slate-950 hover:bg-slate-800",
    warning:
      "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200",
    default:
      "bg-white/80 text-slate-800 border-slate-200 hover:bg-white",
  };

  return (
    <button
      className={`rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm transition disabled:opacity-50 ${variantClass[variant]}`}
      disabled={disabled}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
}
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 mb-1 text-[10px] font-semibold uppercase text-slate-500">
      {children}
    </div>
  );
}

function InfoRow({
  label,
  explain,
  value,
}: {
  label: string;
  explain: string;
  value: string | number | undefined;
}) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-slate-800">{label}</div>
      <div className="text-[10px] text-slate-500">{explain}</div>
      <div className="text-[11px] text-slate-800 mt-0.5">
        {value !== undefined && value !== "" ? value : "—"}
      </div>
    </div>
  );
}

function fmt(v?: number, asPercent = false): string {
  if (v === undefined || Number.isNaN(v)) return "—";
  if (asPercent) return `${(v * 100).toFixed(1)}%`;
  return v.toFixed(3);
}

function fmtPair(a?: number, b?: number, asPercent = false): string {
  const va = fmt(a, asPercent);
  const vb = fmt(b, asPercent);

  if (va === "—" && vb === "—") return "—";

  return `${va} / ${vb}`;
}
