"use client";

import { useEffect, useState } from "react";

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
  const [alerts, setAlerts] = useState<{ raw: RawAlert; card: AlertCardData }[]>(
    []
  );

  const [loading, setLoading] = useState(true);

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

      setAlerts(mapped);
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
      setAlerts((prev) => prev.filter((x) => makeKey(x.raw) !== key));
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
      setAlerts((prev) => prev.filter((x) => makeKey(x.raw) !== key));
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

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <div className="text-sm text-slate-500">Loading live alerts…</div>
      </div>
    );
  }

  if (!alerts.length) {
    const sample: AlertCardData = {
      symbol: "AAPL",
      tone: "up",
      directionText: "Up move (CALL / Sunrise bias)",
      entryTime: "12/09/2025 9:40 AM CT",
      forecastTime: "12/09/2025 9:45 AM CT",
      forecastPct: 5,
      signal: "0.6% → 1.5% breakout",
      rawHitPrice: 195.25,
      forecastConfidence: 5,
      directionRuleDirection: "UP",
      rule_label: "💎 Confidence — 5% trial alert for 1.5 (CALL)",
      direction_rule_view: "Direction: UP · Flow: GO",
    };

    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Signal 97 Alerts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Only fresh, actionable alerts that pass Signal 97 + Probability
            appear here.
          </p>
        </div>

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
          onTogglePin={() => window.alert("No live alerts yet.")}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Signal 97 Alerts
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Only fresh, actionable alerts that pass Signal 97 + Probability rules
          appear here.
        </p>
      </div>

      <div className="space-y-4">
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
              onTogglePin={() => togglePin(key)}
            />
          );
        })}
      </div>
    </div>
  );
}

function AlertBubble({
  alert,
  rawAlert,
  busy,
  pinned,
  onTake,
  onDismiss,
  onTogglePin,
}: {
  alert: AlertCardData;
  rawAlert: RawAlert;
  busy: boolean;
  pinned: boolean;
  onTake: (a: RawAlert) => Promise<void>;
  onDismiss: (a: RawAlert) => Promise<void>;
  onTogglePin: () => void;
}) {
  return (
    <div
      className={`${toneBg[alert.tone]} rounded-3xl px-6 py-5 flex flex-col gap-4`}
    >
      {/* Top row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="text-xl font-semibold text-slate-900">
              {alert.symbol}
            </div>

            <span
              className={`px-3 py-1 rounded-full text-[10px] font-semibold ${toneLabelClass[alert.tone]}`}
            >
              {toneLabel[alert.tone]}
            </span>

            {pinned && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                ★ Pinned
              </span>
            )}
          </div>

          <div className="text-[11px] leading-relaxed text-slate-700 space-y-0.5">
            <div>
              <span className="font-semibold">Direction:</span>{" "}
              {alert.directionText}
            </div>

            {alert.forecastPct != null && (
              <div>
                <span className="font-semibold">Target:</span>{" "}
                {alert.forecastPct}% expected move
              </div>
            )}

            {alert.forecastConfidence != null && (
              <div>
                <span className="font-semibold">Confidence tier:</span>{" "}
                {alert.forecastConfidence}%
              </div>
            )}

            {alert.rawHitPrice != null && (
              <div>
                <span className="font-semibold">Hit-bar price:</span> $
                {alert.rawHitPrice.toFixed(2)}
              </div>
            )}

            {alert.signal && (
              <div className="text-slate-500">
                <span className="font-semibold">Signal:</span> {alert.signal}
              </div>
            )}

            <div className="text-slate-500">
              <span className="font-semibold">Entry time:</span>{" "}
              {alert.entryTime || "—"}
            </div>

            <div className="text-slate-500">
              <span className="font-semibold">Forecast time:</span>{" "}
              {alert.forecastTime || "—"}
            </div>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-wrap gap-2">
        <button
          className="px-3 py-1.5 rounded-md border text-sm hover:bg-black/5 disabled:opacity-50"
          disabled={busy}
          onClick={() => onTake(rawAlert)}
        >
          {busy ? "Working..." : "Take"}
        </button>

        <button
          className="px-3 py-1.5 rounded-md border text-sm hover:bg-black/5 disabled:opacity-50"
          disabled={busy}
          onClick={() => onDismiss(rawAlert)}
        >
          Dismiss
        </button>

        <button
          className={
            "px-3 py-1.5 rounded-md border text-sm disabled:opacity-50 " +
            (pinned
              ? "bg-yellow-100 border-yellow-300 text-yellow-800"
              : "hover:bg-black/5")
          }
          disabled={busy}
          onClick={onTogglePin}
          title="Pin this alert to the top"
        >
          {pinned ? "★ Pinned" : "☆ Star"}
        </button>
      </div>

      {/* Dropdown */}
      <details className="bg-white/70 rounded-2xl px-4 py-3 text-[11px] text-slate-700">
        <summary className="cursor-pointer font-semibold text-slate-800">
          View full Signal 97 breakdown
        </summary>

        <div className="mt-2 space-y-2">
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
