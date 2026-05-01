"use client";

import React, { useRef, useState } from "react";
import SpreadGuard from "./SpreadGuard";
import DistanceFromHitCalculator from "./DistanceFromHitCalculator";


const Tools: React.FC = () => {
  const spreadRef = useRef<HTMLDivElement | null>(null);
  const riskRef = useRef<HTMLDivElement | null>(null);
  const distanceRef = useRef<HTMLDivElement | null>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div
      className="
        space-y-8
        [&_input]:text-sm
        [&_select]:text-sm
        [&_textarea]:text-sm
        [&_label>span]:text-xs
        [&_p]:text-sm
        [&_table]:text-xs
        dark:[&_.bg-white]:!bg-[#0b1423]
        dark:[&_.bg-slate-50]:!bg-[#111827]
        dark:[&_.bg-slate-100]:!bg-[#1e2a3a]
        dark:[&_.border-slate-100]:!border-white/15
        dark:[&_.border-slate-200]:!border-white/15
        dark:[&_.text-slate-950]:!text-white
        dark:[&_.text-slate-900]:!text-white
        dark:[&_.text-slate-800]:!text-slate-100
        dark:[&_.text-slate-700]:!text-slate-200
        dark:[&_.text-slate-600]:!text-slate-300
        dark:[&_.text-slate-500]:!text-slate-400
        dark:[&_.from-white]:!from-[#101827]
        dark:[&_.via-indigo-50]:!via-[#162335]
        dark:[&_.via-emerald-50]:!via-[#162335]
        dark:[&_.via-amber-50]:!via-[#162335]
        dark:[&_.to-sky-50]:!to-[#0b111c]
        dark:[&_.to-emerald-50]:!to-[#0b111c]
        dark:[&_.bg-indigo-100]:!bg-indigo-300/10
        dark:[&_.bg-emerald-50]:!bg-emerald-300/10
        dark:[&_.bg-amber-50]:!bg-amber-300/10
        dark:[&_.bg-rose-50]:!bg-rose-500/10
      "
    >
      <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-white via-indigo-50 to-sky-50 px-6 py-5 shadow-sm dark:border-white/15 dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_34%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_30%),linear-gradient(135deg,#101827_0%,#162335_55%,#0b111c_100%)] dark:text-white dark:shadow-[0_22px_70px_rgba(0,0,0,0.32)]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-700 dark:border-indigo-300/20 dark:bg-indigo-300/10 dark:text-indigo-100">
              Signal97 toolkit
            </div>

            <h1 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              Trading Tools
            </h1>

            <p className="mt-1 text-sm text-slate-600 max-w-2xl dark:text-slate-300">
              Practical tools for sizing, sanity-checking, and reviewing Signal97
              alerts before risking real money.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <ToolJumpButton onClick={() => scrollTo(spreadRef)}>
              SpreadGuard
            </ToolJumpButton>

            <ToolJumpButton onClick={() => scrollTo(riskRef)}>
              Risk tools
            </ToolJumpButton>

            <ToolJumpButton onClick={() => scrollTo(distanceRef)}>
              Distance calculator
            </ToolJumpButton>
          </div>
        </div>
      </div>

      <div ref={spreadRef} id="spreadguard" className="scroll-mt-28">
        <SpreadGuard />
      </div>

      <section
        ref={riskRef}
        id="risk-tools"
        className="scroll-mt-28 rounded-[2rem] bg-gradient-to-br from-emerald-500 via-sky-500 to-indigo-500 p-1 shadow-2xl dark:shadow-[0_22px_70px_rgba(0,0,0,0.35)]"
      >
        <div className="rounded-[1.8rem] bg-gradient-to-br from-white via-emerald-50 to-sky-50 p-5 space-y-5 dark:bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_34%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_30%),linear-gradient(135deg,#101827_0%,#162335_55%,#0b111c_100%)] dark:text-white">
          <ToolSectionHeader
            badge="Risk tools"
            title="Risk + Option Sanity Checks"
            subtitle="Use these before entering a trade to check option risk, stock risk, liquidity, and whether the setup is too aggressive."
            status="Pre-trade review"
          />

          <div className="grid xl:grid-cols-2 gap-5">
            <OptionRiskCard />
            <RiskGuard />
          </div>
        </div>
      </section>



      <section
        ref={distanceRef}
        id="distance-calculator"
        className="scroll-mt-28 rounded-[2rem] bg-gradient-to-br from-amber-400 via-sky-500 to-emerald-500 p-1 shadow-2xl dark:shadow-[0_22px_70px_rgba(0,0,0,0.35)]"
      >
        <div className="rounded-[1.8rem] bg-gradient-to-br from-white via-amber-50 to-emerald-50 p-5 space-y-5 dark:bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.11),transparent_34%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_30%),linear-gradient(135deg,#101827_0%,#162335_55%,#0b111c_100%)] dark:text-white">
          <ToolSectionHeader
            badge="Entry helper"
            title="Distance From Hit Price"
            subtitle="Check whether the current price is still close to the original Signal97 hit-bar price or whether the move has already run too far."
            status="Entry timing"
          />

          <DistanceFromHitCalculator />
        </div>
      </section>
    </div>
  );
};

export default Tools;

function ToolJumpButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-950 hover:bg-slate-950 hover:text-white dark:border-white/15 dark:bg-white/[0.05] dark:text-slate-200 dark:hover:border-cyan-300/35 dark:hover:bg-cyan-300/10 dark:hover:text-white"
    >
      {children}
    </button>
  );
}

function ToolSectionHeader({
  badge,
  title,
  subtitle,
  status,
}: {
  badge: string;
  title: string;
  subtitle: string;
  status: string;
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
      <div>
        <div className="inline-flex rounded-full border border-indigo-200 bg-indigo-100 text-indigo-700 px-3 py-1 text-xs font-bold mb-2 dark:border-indigo-300/20 dark:bg-indigo-300/10 dark:text-indigo-100">
          {badge}
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight dark:text-white">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-600 max-w-3xl dark:text-slate-300">
          {subtitle}
        </p>
      </div>

      <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm dark:border-white/15 dark:bg-white/[0.05] dark:text-slate-200">
        {status}
      </div>
    </div>
  );
}

/* ========= Option Risk Card (converted to React, light theme) ========= */

const OptionRiskCard: React.FC = () => {
  const [state, setState] = useState({
    underPrice: 5.55,
    strike: 7.5,
    premium: 0.2,
    type: "call",
    dte: 14,
    iv: 158,
    bidSize: 136,
    askSize: 720,
    oi: 7279,
    bid: 0.15,
    ask: 0.2,
    delta: 0.21,
  });

  const onChange = (field: keyof typeof state, v: string) => {
    const n = field === "type" ? v : parseFloat(v) || 0;
    setState((s) => ({ ...s, [field]: n as any }));
  };

  const {
    score,
    tier,
    barWidth,
    decisionHtml,
    reasonsHtml,
    pillClass,
  } = computeOptionRisk(state);

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-3 dark:border-white/15 dark:bg-[#0b1423]/85 dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-white">
            Signal 97 Option Risk
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Rate a contract: safer / okay / risky / lotto / skip.
          </div>
        </div>
        <div className="text-[10px] text-slate-500 dark:text-slate-400">
          Example: VERI $5.55 → $7.5C
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-[10px]">
        <Field
          label="Underlying price ($)"
          value={state.underPrice}
          onChange={(v) => onChange("underPrice", v)}
        />
        <Field
          label="Strike ($)"
          value={state.strike}
          onChange={(v) => onChange("strike", v)}
        />
        <Field
          label="Premium / Ask ($)"
          value={state.premium}
          onChange={(v) => onChange("premium", v)}
        />

        <SelectField
          label="Type"
          value={state.type}
          onChange={(v) => onChange("type", v)}
        >
          <option value="call">Call</option>
          <option value="put">Put</option>
        </SelectField>
        <Field
          label="Days to expiry"
          value={state.dte}
          onChange={(v) => onChange("dte", v)}
        />
        <Field
          label="Implied vol (%)"
          value={state.iv}
          onChange={(v) => onChange("iv", v)}
        />

        <Field
          label="Bid size"
          value={state.bidSize}
          onChange={(v) => onChange("bidSize", v)}
        />
        <Field
          label="Ask size"
          value={state.askSize}
          onChange={(v) => onChange("askSize", v)}
        />
        <Field
          label="Open interest"
          value={state.oi}
          onChange={(v) => onChange("oi", v)}
        />

        <Field
          label="Bid ($)"
          value={state.bid}
          onChange={(v) => onChange("bid", v)}
        />
        <Field
          label="Ask ($)"
          value={state.ask}
          onChange={(v) => onChange("ask", v)}
        />
        <Field
          label="Delta (abs)"
          value={state.delta}
          onChange={(v) => onChange("delta", v)}
        />
      </div>

      <div className={pillClass}>
        <span>{tier}</span>
        <span className="text-[9px] text-slate-800/80 dark:text-slate-200/80">
          Score {score} / 100
        </span>
      </div>

      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden dark:bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500"
          style={{ width: `${barWidth}%` }}
        />
      </div>

      <div
        className="text-[10px] text-slate-800"
        dangerouslySetInnerHTML={{ __html: decisionHtml }}
      />
      <div
        className="text-[9px] text-slate-600 space-y-1"
        dangerouslySetInnerHTML={{ __html: reasonsHtml }}
      />
    </div>
  );
};

function computeOptionRisk(s: any) {
  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

  const {
    underPrice: P,
    strike: K,
    premium: prem,
    type,
    dte,
    iv,
    bid,
    ask,
    bidSize,
    askSize,
    oi,
    delta,
  } = s;

  if (!P || !K || !prem) {
    return {
      score: 0,
      tier: "—",
      barWidth: 0,
      decisionHtml: "Fill the fields to evaluate this contract.",
      reasonsHtml: "",
      pillClass:
        "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-medium",
    };
  }

  const breakeven =
    type === "call" ? K + prem : K - prem;
  const beDistPct =
    type === "call"
      ? ((breakeven - P) / P) * 100
      : ((P - breakeven) / P) * 100;

  const spread =
    ask > 0 && bid >= 0 ? (ask - bid) / ask : 0.5;

  const beRisk = clamp((beDistPct - 5) / 25, 0, 1);
  const timeRisk = clamp((21 - dte) / 21, 0, 1);
  const ivRisk = clamp((iv - 60) / 140, 0, 1);
  const liqBad = bidSize + askSize < 200 || oi < 500 ? 1 : 0;
  const spreadRisk = clamp((spread - 0.15) / 0.25, 0, 1);
  const liqRisk = clamp(0.6 * spreadRisk + 0.4 * liqBad, 0, 1);
  const deltaRisk = clamp((0.35 - Math.abs(delta || 0)) / 0.35, 0, 1);

  const risk =
    0.3 * beRisk +
    0.2 * timeRisk +
    0.2 * ivRisk +
    0.2 * liqRisk +
    0.1 * deltaRisk;

  const score = Math.round(risk * 100);
  let tier = "";
  let pillClass = "";

  if (score < 35) {
    tier = "Low risk";
    pillClass =
      "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold";
  } else if (score < 70) {
    tier = "Medium risk";
    pillClass =
      "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold";
  } else {
    tier = "High risk";
    pillClass =
      "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-[10px] font-semibold";
  }

  let decision = "";
  if (score <= 25) {
    decision =
      '<span class="font-semibold">✅ Safer choice.</span> Contract looks reasonable; normal planned size can be OK if thesis makes sense.';
  } else if (score <= 45) {
    decision =
      '<span class="font-semibold">✅ OK, smaller size.</span> A few warnings. Use less size than usual.';
  } else if (score <= 65) {
    decision =
      '<span class="font-semibold">🟡 Risky.</span> Only small, tightly managed size.';
  } else if (score <= 85) {
    decision =
      '<span class="font-semibold">🔴 Very risky.</span> Treat as lotto; only what you can fully lose.';
  } else {
    decision =
      '<span class="font-semibold">⛔ Skip.</span> Contract is built poorly for you; look for a cleaner one.';
  }

  const reasons: string[] = [];

  let beComment =
    beDistPct <= 10
      ? "easy to reach vs many contracts (safer)."
      : beDistPct <= 25
      ? "doable but needs a solid move."
      : "a big jump; very aggressive.";
  reasons.push(
    `<strong>1. Break-even distance:</strong> Needs ~${beDistPct.toFixed(
      1
    )}% move just to break even — ${beComment}`
  );

  let timeComment =
    dte >= 21
      ? "plenty of time; lowers risk."
      : dte >= 10
      ? "some time left; moderate."
      : "very little time; aggressive.";
  reasons.push(
    `<strong>2. Time remaining:</strong> ${dte} day(s) to expiry — ${timeComment}`
  );

  let ivComment =
    iv <= 60
      ? "normal; price not overly pumped."
      : iv <= 120
      ? "elevated; be more selective."
      : "very high; premium can decay fast.";
  reasons.push(
    `<strong>3. Contract cost (IV):</strong> ~${iv.toFixed(
      0
    )}% implied vol — ${ivComment}`
  );

  const spreadPct = spread * 100;
  let liqComment =
    spreadPct <= 10 && oi >= 500
      ? "easy fills; healthy."
      : spreadPct <= 25 && oi >= 100
      ? "tradable but expect some slippage."
      : "thin/wide; slippage risk is real.";
  reasons.push(
    `<strong>4. Liquidity:</strong> Spread ~${spreadPct.toFixed(
      1
    )}% with OI ${oi} — ${liqComment}`
  );

  let dComment =
    Math.abs(delta) >= 0.55
      ? "moves strongly with stock."
      : Math.abs(delta) >= 0.3
      ? "balanced responsiveness."
      : "barely reacts; more lotto-style.";
  reasons.push(
    `<strong>5. Delta:</strong> ${delta.toFixed(2)} — ${dComment}`
  );

  return {
    score,
    tier,
    barWidth: score,
    pillClass,
    decisionHtml: decision,
    reasonsHtml: reasons.join("<br>"),
  };
}

const Field = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: string) => void;
}) => (
  <label className="flex flex-col gap-1">
    <span className="text-[9px] text-slate-500 dark:text-slate-400">{label}</span>
    <input
      type="number"
      step="any"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-400 dark:border-white/15 dark:bg-[#111827] dark:text-slate-100 dark:placeholder:text-slate-500"
    />
  </label>
);

const SelectField = ({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) => (
  <label className="flex flex-col gap-1">
    <span className="text-[9px] text-slate-500 dark:text-slate-400">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-400 dark:border-white/15 dark:bg-[#111827] dark:text-slate-100"
    >
      {children}
    </select>
  </label>
);

/* ========= RiskGuard + Max Gain Calculator (light, condensed) ========= */

const parseNumber = (v: string | number) => {
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? 0 : n;
};

type RiskMode = "low" | "medium" | "high";

interface RiskInputs {
  marketCap: number;
  pe: number;
  dividendYield: number;
  avgVolume: number;
  volume: number;
  wkHigh: number;
  wkLow: number;
  currentPrice: number;
}

interface RiskResult {
  score: number;
  notes: string[];
  redFlags: string[];
  verdict: "Safe" | "Caution" | "Avoid";
  color: string;
  liqRatio: number;
}

const NOTE_EXPLANATIONS: Record<string, string> = {
  "Good liquidity: active vs average":
    "Stock usually trades solid volume and today is active. Easier fills.",
  "OK liquidity":
    "Tradable, but don’t oversize. Spread/liquidity are acceptable.",
  "Weak intraday volume vs average":
    "Today is quieter than normal. Consider smaller size.",
  "Small cap: treat as speculative":
    "Smaller company; price can move faster and react to news.",
  "Large cap stability":
    "Bigger company; usually more stable and harder to manipulate.",
  "Reasonable P/E":
    "Price vs. earnings looks normal; nothing wild at first glance.",
  "Very high P/E (priced for perfection)":
    "Priced for big growth; disappointments can hit hard.",
  "Unprofitable: speculative":
    "Losing money; more story-driven and volatile.",
  "Near 52w low: could be value or broken; confirm trend":
    "Close to yearly low; check chart/news whether it’s basing or breaking.",
  "Near 52w high: momentum zone":
    "Close to yearly high; momentum strong but pullbacks can be sharp.",
};

const REDFLAG_EXPLANATIONS: Record<string, string> = {
  "Very low average volume (<150k)":
    "Thinly traded; hard to get in/out without moving price.",
  "Micro-cap < $100M (very high risk)":
    "Tiny company; moves fast and is easier to manipulate.",
  "Negative earnings in Low Risk mode":
    "Low-risk mode prefers profitable companies.",
  "Extreme dividend yield (>10%)":
    "Very high yield can be a stress signal, not a free lunch.",
};

const computeRiskScore = (
  inp: RiskInputs,
  mode: RiskMode
): RiskResult => {
  const {
    marketCap,
    pe,
    dividendYield,
    avgVolume,
    volume,
    wkHigh,
    wkLow,
    currentPrice,
  } = inp;

  let score = 0;
  const notes: string[] = [];
  const redFlags: string[] = [];

  const liqRatio = avgVolume > 0 ? volume / avgVolume : 0;
  if (avgVolume < 150_000) {
    redFlags.push("Very low average volume (<150k)");
    score -= 3;
  } else if (avgVolume >= 1_000_000 && liqRatio >= 0.15) {
    score += 2;
    notes.push("Good liquidity: active vs average");
  } else if (avgVolume >= 300_000 && liqRatio >= 0.1) {
    score += 1;
    notes.push("OK liquidity");
  } else {
    score -= 1;
    notes.push("Weak intraday volume vs average");
  }

  if (marketCap < 100_000_000) {
    redFlags.push("Micro-cap < $100M (very high risk)");
    score -= 3;
  } else if (marketCap < 300_000_000) {
    score -= 1;
    notes.push("Small cap: treat as speculative");
  } else if (marketCap >= 5_000_000_000) {
    score += 2;
    notes.push("Large cap stability");
  } else if (marketCap >= 1_000_000_000) {
    score += 1;
  }

  if (pe > 0) {
    if (pe >= 5 && pe <= 40) {
      score += 1;
      notes.push("Reasonable P/E");
    } else if (pe > 80) {
      score -= 1;
      notes.push("Very high P/E (priced for perfection)");
    }
  } else if (pe < 0) {
    if (mode === "low") {
      redFlags.push("Negative earnings in Low Risk mode");
      score -= 2;
    } else {
      score -= 1;
      notes.push("Unprofitable: speculative");
    }
  }

  if (dividendYield > 10) {
    redFlags.push("Extreme dividend yield (>10%)");
    score -= 2;
  }

  if (wkHigh > wkLow && currentPrice > 0) {
    const pos = (currentPrice - wkLow) / (wkHigh - wkLow);
    if (pos < 0.05) {
      notes.push("Near 52w low: could be value or broken; confirm trend");
    } else if (pos > 0.95) {
      notes.push("Near 52w high: momentum zone");
    }
  }

  const hasRed = redFlags.length > 0;
  let verdict: RiskResult["verdict"] = "Caution";
  let color = "bg-amber-500";

  if (mode === "low") {
    if (hasRed || score < 2) {
      verdict = "Avoid";
      color = "bg-rose-500";
    } else {
      verdict = "Safe";
      color = "bg-emerald-500";
    }
  } else if (mode === "medium") {
    if (hasRed && score < 0) {
      verdict = "Avoid";
      color = "bg-rose-500";
    } else if (score >= 1) {
      verdict = "Safe";
      color = "bg-emerald-500";
    } else {
      verdict = "Caution";
      color = "bg-amber-500";
    }
  } else {
    if (hasRed && score < -3) {
      verdict = "Avoid";
      color = "bg-rose-600";
    } else if (score >= 0) {
      verdict = "Safe";
      color = "bg-emerald-500";
    } else {
      verdict = "Caution";
      color = "bg-amber-500";
    }
  }

  return { score, notes, redFlags, verdict, color, liqRatio };
};

const RiskGuard: React.FC = () => {
  const [mode, setMode] = useState<RiskMode>("low");
  const [notesOpen, setNotesOpen] = useState<Record<number, boolean>>({});
  const [flagsOpen, setFlagsOpen] = useState<Record<number, boolean>>({});
  const [input, setInput] = useState({
    marketCap: "256420000",
    pe: "-19.3",
    dividendYield: "0",
    avgVolume: "6780000",
    volume: "53070",
    wkHigh: "18.15",
    wkLow: "1.62",
    currentPrice: "8.22",
  });

  const parsed: RiskInputs = {
    marketCap: parseNumber(input.marketCap),
    pe: parseNumber(input.pe),
    dividendYield: parseNumber(input.dividendYield),
    avgVolume: parseNumber(input.avgVolume),
    volume: parseNumber(input.volume),
    wkHigh: parseNumber(input.wkHigh),
    wkLow: parseNumber(input.wkLow),
    currentPrice: parseNumber(input.currentPrice),
  };

  const { score, notes, redFlags, verdict, color, liqRatio } =
    computeRiskScore(parsed, mode);

  const upd = (field: keyof typeof input, v: string) => {
    setInput((p) => ({ ...p, [field]: v }));
    setNotesOpen({});
    setFlagsOpen({});
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-3 dark:border-white/15 dark:bg-[#0b1423]/85 dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-white">
            Signal 97 · Risk Guard
          </div>
          <p className="text-[10px] text-slate-500">
            Quick pre-filter: does this stock fit your risk mode?
          </p>
        </div>
        <div className="flex gap-1">
          {(["low", "medium", "high"] as RiskMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={
                "px-2 py-0.5 rounded-full text-[9px] border " +
                (mode === m
                  ? "bg-slate-900 text-white border-slate-900"
                  : "text-slate-500 border-slate-200")
              }
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <MiniField label="Market cap ($)" v={input.marketCap} onCh={(v) => upd("marketCap", v)} />
        <MiniField label="P/E" v={input.pe} onCh={(v) => upd("pe", v)} />
        <MiniField label="Dividend yield (%)" v={input.dividendYield} onCh={(v) => upd("dividendYield", v)} />
        <MiniField label="Avg volume" v={input.avgVolume} onCh={(v) => upd("avgVolume", v)} />
        <MiniField label="Today volume" v={input.volume} onCh={(v) => upd("volume", v)} />
        <MiniField label="52w high" v={input.wkHigh} onCh={(v) => upd("wkHigh", v)} />
        <MiniField label="52w low" v={input.wkLow} onCh={(v) => upd("wkLow", v)} />
        <MiniField label="Current price" v={input.currentPrice} onCh={(v) => upd("currentPrice", v)} />
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <div>
          <div className="text-[9px] uppercase text-slate-500 dark:text-slate-400">
            Risk verdict
          </div>
          <div
            className={`inline-flex items-center gap-2 mt-1 px-3 py-1 rounded-full text-[10px] font-semibold text-white ${color}`}
          >
            <span>{verdict}</span>
            <span className="text-[9px] text-white/80">
              score {score >= 0 ? "+" : ""}
              {score}
            </span>
          </div>
        </div>
        <div className="text-[9px] text-slate-500 text-right dark:text-slate-400">
          Mode: <span className="font-semibold">{mode}</span>
          <br />
          Liquidity ratio: {liqRatio.toFixed(2)}x
        </div>
      </div>

      {redFlags.length > 0 && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-2 text-[9px] text-rose-700 space-y-1 dark:border-rose-300/20 dark:bg-rose-500/10 dark:text-rose-200">
          <div className="font-semibold">Hard blocks:</div>
          {redFlags.map((r, i) => (
            <div key={i}>
              <button
                type="button"
                className="font-medium underline-offset-2 hover:underline"
                onClick={() =>
                  setFlagsOpen((p) => ({ ...p, [i]: !p[i] }))
                }
              >
                {r}
              </button>
              {flagsOpen[i] && REDFLAG_EXPLANATIONS[r] && (
                <div className="mt-0.5 text-rose-600">
                  {REDFLAG_EXPLANATIONS[r]}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {notes.length > 0 && (
        <div className="rounded-xl bg-slate-50 p-2 text-[9px] text-slate-700 space-y-1 dark:bg-white/[0.04] dark:text-slate-300">
          <div className="font-semibold text-[9px]">
            Notes (tap to expand):
          </div>
          {notes.map((n, i) => (
            <div key={i}>
              <button
                type="button"
                className="underline-offset-2 hover:underline"
                onClick={() =>
                  setNotesOpen((p) => ({ ...p, [i]: !p[i] }))
                }
              >
                {n}
              </button>
              {notesOpen[i] && NOTE_EXPLANATIONS[n] && (
                <div className="mt-0.5 text-slate-600 dark:text-slate-400">
                  {NOTE_EXPLANATIONS[n]}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="text-[9px] text-slate-500 bg-slate-50 rounded-xl p-2 dark:bg-white/[0.04] dark:text-slate-400">
        Use Risk Guard as a pre-filter next to Signal 97 alerts. It does not
        replace your own judgment or guarantee outcomes.
      </div>

      <Signal97ProfitCalculator />
    </div>
  );
};

const MiniField = ({
  label,
  v,
  onCh,
}: {
  label: string;
  v: string;
  onCh: (v: string) => void;
}) => (
  <label className="flex flex-col gap-0.5">
    <span className="text-[8px] text-slate-500">{label}</span>
    <input
      value={v}
      onChange={(e) => onCh(e.target.value)}
      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[9px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-400 dark:border-white/15 dark:bg-[#111827] dark:text-slate-100 dark:placeholder:text-slate-500"
    />
  </label>
);

/* Max Gain Calculator (compact) */

type Side = "CALL" | "PUT";

const Signal97ProfitCalculator: React.FC = () => {
  const [side, setSide] = useState<Side>("CALL");
  const [hit, setHit] = useState("25.00");
  const [entry, setEntry] = useState("25.00");
  const [mg7, setMg7] = useState("4");

  const hitPrice = parseNumber(hit);
  const entryPrice = parseNumber(entry);
  const mg = parseNumber(mg7) || 4;

  let target = 0,
    edgeFromHit = 0,
    edgeFromEntry = 0,
    earlyMove = 0;

  if (hitPrice > 0 && entryPrice > 0) {
    if (side === "CALL") {
      target = hitPrice * (1 + mg / 100);
      edgeFromHit = (target / hitPrice - 1) * 100;
      edgeFromEntry = (target / entryPrice - 1) * 100;
      earlyMove = (entryPrice / hitPrice - 1) * 100;
    } else {
      target = hitPrice * (1 - mg / 100);
      edgeFromHit = (hitPrice / target - 1) * 100;
      edgeFromEntry = (entryPrice / target - 1) * 100;
      earlyMove = (entryPrice / hitPrice - 1) * 100;
    }
  }

  const fmt = (v: number) =>
    Number.isFinite(v)
      ? v.toFixed(2).replace(/-0\.00/, "0.00")
      : "--";

  return (
    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-[9px] text-slate-700 space-y-2 dark:bg-white/[0.04] dark:text-slate-300">
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold text-[10px] dark:text-white">
          Max Gain Calculator
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            className={
              "px-2 py-0.5 rounded-full border text-[8px] " +
              (side === "CALL"
                ? "bg-emerald-500/10 border-emerald-400 text-emerald-700"
                : "border-slate-300 text-slate-500")
            }
            onClick={() => setSide("CALL")}
          >
            CALL
          </button>
          <button
            type="button"
            className={
              "px-2 py-0.5 rounded-full border text-[8px] " +
              (side === "PUT"
                ? "bg-rose-500/10 border-rose-400 text-rose-700"
                : "border-slate-300 text-slate-500")
            }
            onClick={() => setSide("PUT")}
          >
            PUT
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MiniField
          label={side === "CALL" ? "Hit bar high ($)" : "Hit bar low ($)"}
          v={hit}
          onCh={setHit}
        />
        <MiniField
          label="Your entry ($)"
          v={entry}
          onCh={setEntry}
        />
        <MiniField
          label="Max Growth D7 %"
          v={mg7}
          onCh={setMg7}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-slate-500 dark:text-slate-400">Model target</div>
          <div className="font-semibold text-slate-900 dark:text-white">
            ${fmt(target)}
          </div>
          <div className="mt-1 text-slate-500 dark:text-slate-400">
            Edge from hit:{" "}
            <span className="font-semibold text-emerald-600">
              {fmt(edgeFromHit)}%
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-slate-500 dark:text-slate-400">Potential from entry</div>
          <div
            className={
              "font-semibold " +
              (edgeFromEntry >= 0
                ? "text-emerald-600"
                : "text-rose-500")
            }
          >
            {fmt(edgeFromEntry)}%
          </div>
          <div className="mt-1 text-slate-500 dark:text-slate-400">
            Chase/dip vs hit:{" "}
            <span
              className={
                "font-semibold " +
                (earlyMove <= 0
                  ? "text-emerald-600"
                  : "text-amber-500")
              }
            >
              {fmt(earlyMove)}%
            </span>
          </div>
        </div>
      </div>

      <div className="text-[8px] text-slate-500 dark:text-slate-400">
        If potential from entry is tiny, risk/reward is poor. If it&apos;s
        still meaningful (e.g. 4–6%+), the move hasn&apos;t fully run away.
      </div>
    </div>
  );
};
