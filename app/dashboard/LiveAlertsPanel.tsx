"use client";

import { useEffect, useState } from "react";

// This matches the columns coming from forecast_scored.csv / /alerts/live
type RawAlert = {
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

function asNumber(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function deduceTone(directionRuleDirection?: string, direction?: string): DirectionTone {
  const d = (directionRuleDirection || direction || "").toUpperCase();
  if (d.includes("UP") || d.includes("CALL") || d.includes("LONG") || d.includes("SUNRISE")) {
    return "up";
  }
  if (d.includes("DOWN") || d.includes("PUT") || d.includes("SHORT") || d.includes("SNOWFALL")) {
    return "down";
  }
  return "flat";
}

function prettyDirection(directionRuleDirection?: string, direction?: string): string {
  const d = (directionRuleDirection || direction || "").toUpperCase();
  if (d.includes("UP") || d.includes("CALL") || d.includes("SUNRISE")) {
    return "Up move (CALL / Sunrise bias)";
  }
  if (d.includes("DOWN") || d.includes("PUT") || d.includes("SNOWFALL")) {
    return "Down move (PUT / Snowfall bias)";
  }
  return directionRuleDirection || direction || "Neutral / not set";
}

function formatTimeLabel(
  t12h?: string,
  iso?: string,
): string {
  if (t12h && t12h.trim().length > 0) return t12h;
  if (!iso) return "";
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) return "";
  return dt.toLocaleString();
}

function mapRawToCard(raw: RawAlert): AlertCardData {
  const symbol = raw.symbol || "?";
  const tone = deduceTone(raw.direction_rule_direction, raw.direction);
  const directionText = prettyDirection(raw.direction_rule_direction, raw.direction);

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
  const [alerts, setAlerts] = useState<AlertCardData[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAlerts() {
    try {
      const res = await fetch("/api/live-alerts", { cache: "no-store" });
      const data = await res.json();

      const rawAlerts: RawAlert[] = data.alerts ?? [];
      const mapped = rawAlerts.map(mapRawToCard);

      setAlerts(mapped);
    } catch (err) {
      console.error("Failed to load alerts", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlerts();
    const id = setInterval(loadAlerts, 15000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <div className="text-sm text-slate-500">Loading live alerts…</div>
      </div>
    );
  }

  // No real alerts yet → empty text + sample layout
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
            Only alerts that pass your Signal 97 rules appear here. No random call-outs.
          </p>
        </div>

        <p className="text-xs text-slate-500">
          No live alerts yet. When a new alert fires, you&apos;ll see:
        </p>
        <ul className="text-xs text-slate-500 list-disc list-inside space-y-1">
          <li>
            <strong>Color bubble</strong> based on <code>direction_rule_direction</code> (UP = green, DOWN = red).
          </li>
          <li>
            <strong>Top line:</strong> symbol, up/down bias, and target %.
          </li>
          <li>
            <strong>Core info:</strong> entry time, forecast time, forecast confidence, raw hit price.
          </li>
          <li>
            <strong>Dropdown:</strong> detailed rule, flow, probability, and risk settings explained in plain language.
          </li>
        </ul>

        <AlertBubble alert={sample} />
      </div>
    );
  }

  // Real alerts
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Signal 97 Alerts
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Only alerts that pass your Signal 97 + Probability rules appear here.
        </p>
      </div>

      <div className="space-y-4">
        {alerts
          .slice()
          .reverse()
          .map((a, idx) => (
            <AlertBubble key={idx} alert={a} />
          ))}
      </div>
    </div>
  );
}

// ---------- bubble card + dropdown details ----------

function AlertBubble({ alert }: { alert: AlertCardData }) {
  return (
    <div
      className={`${toneBg[alert.tone]} rounded-3xl px-6 py-5 flex flex-col gap-4`}
    >
      {/* Top row: symbol + quick summary */}
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
                <span className="font-semibold">Hit-bar price:</span>{" "}
                ${alert.rawHitPrice.toFixed(2)}
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

      {/* Dropdown: detailed metrics with explanations */}
      <details className="bg-white/70 rounded-2xl px-4 py-3 text-[11px] text-slate-700">
        <summary className="cursor-pointer font-semibold text-slate-800">
          View full Signal 97 breakdown
        </summary>

        <div className="mt-2 space-y-2">
          {/* Rule & direction */}
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

          {/* Probability layer */}
          <SectionLabel>Probability & edge</SectionLabel>

          <InfoRow
            label="Flow score"
            explain="How strong the short-term flow/momentum looks here."
            value={fmt(alert.flow_score)}
          />
          <InfoRow
            label="Edge z"
            explain="How far this setup is from the average, in standard deviations (higher = more unusual edge)."
            value={fmt(alert.edge_z)}
          />
          <InfoRow
            label="Edge p"
            explain="Probability that this pattern is part of a profitable cluster (0–1)."
            value={fmt(alert.edge_p)}
          />
          <InfoRow
            label="Sub-4 risk"
            explain="Risk that price fails to clear the 4% breakout region (0–1, higher = more danger)."
            value={fmt(alert.sub4_risk)}
          />
          <InfoRow
            label="LDA edge p"
            explain="Probability from the LDA model that this looks like past wins."
            value={fmt(alert.lda_edge_p)}
          />
          <InfoRow
            label="LDA sub4 p"
            explain="Probability from LDA that this stalls under 4%."
            value={fmt(alert.lda_sub4_p)}
          />
          <InfoRow
            label="Tail concord (3 / X)"
            explain="How well this move matches the behavior of strong winners in the tails."
            value={fmtPair(alert.tail_concord3, alert.tail_concordX)}
          />
          <InfoRow
            label="Tail guard score"
            explain="Extra guardrail score; high values lean toward WAIT / smaller size."
            value={fmt(alert.tail_guard_score)}
          />

          {/* Success probabilities */}
          <SectionLabel>7-day outcome probabilities</SectionLabel>

          <InfoRow
            label="Success 7d prob"
            explain="Model-estimated chance that this alert will succeed within 7 days."
            value={fmt(alert.success7d_prob, true)}
          />
          <InfoRow
            label="Success range (low–high)"
            explain="Confidence interval for the 7-day success chance."
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
            explain="Number of past similar alerts used for this estimate."
            value={fmt(alert.success7d_n_eff, false)}
          />
          <InfoRow
            label="Calibrated success"
            explain="Final, calibrated success probability after adjustments."
            value={fmt(alert.success7d_cal, true)}
          />
          <InfoRow
            label="Direction score"
            explain="How confidently the system believes the move is in this direction."
            value={fmt(alert.direction_score)}
          />

          {/* Risk & targets */}
          <SectionLabel>Stops & targets</SectionLabel>

          <InfoRow
            label="TP1 / TP2"
            explain="First and second take-profit levels suggested by Signal 97."
            value={fmtPair(alert.tp1_pct, alert.tp2_pct, true)}
          />
          <InfoRow
            label="Stop loss"
            explain="Suggested maximum loss (approximate) for this setup."
            value={fmt(alert.stop_pct, true)}
          />
          <InfoRow
            label="Trail trigger"
            explain="Where a trailing stop may start locking in profits."
            value={fmt(alert.trail_trigger_pct, true)}
          />
        </div>
      </details>
    </div>
  );
}

// Small helpers for the dropdown UI

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mt-3 mb-1 text-[10px] font-semibold uppercase text-slate-500">{children}</div>;
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
