"use client";

import { useState } from "react";

type MoveExplanation = {
  title: string;
  subtitle: string;
  tone: string;
};

function classifyMove(pctDiff: number | null): MoveExplanation {
  if (pctDiff === null) {
    return {
      title: "",
      subtitle: "",
      tone: "",
    };
  }

  // pctDiff = % move from raw_hit_price to current_price
  if (pctDiff <= -5) {
    return {
      title: "Much better price than the alert",
      subtitle:
        "Current price is clearly lower than the forecast hit price. If everything else still looks good, this is a cheaper entry than the original alert.",
      tone: "text-emerald-600",
    };
  }

  if (pctDiff < -1) {
    return {
      title: "Slightly better price than the alert",
      subtitle:
        "Current price is a bit lower than the hit price. You are getting a small discount compared to the original alert.",
      tone: "text-emerald-500",
    };
  }

  if (Math.abs(pctDiff) <= 0.5) {
    return {
      title: "Very close to the alert price",
      subtitle:
        "Current price is almost the same as the hit price. Your entry is basically the same as the original alert.",
      tone: "text-slate-600",
    };
  }

  if (pctDiff < 3) {
    return {
      title: "A little more expensive than the alert",
      subtitle:
        "Current price is above the hit price. You are paying a bit more than the original alert saw.",
      tone: "text-amber-500",
    };
  }

  return {
    title: "Much more expensive than the alert",
    subtitle:
      "Current price is clearly above the hit price. This is a more aggressive entry and may be higher-risk.",
    tone: "text-rose-500",
  };
}

export default function DistanceFromHitCalculator() {
  const [symbol, setSymbol] = useState("");
  const [rawHit, setRawHit] = useState<string>("");
  const [current, setCurrent] = useState<string>("");

  const rawHitNum = rawHit === "" ? null : Number(rawHit);
  const currentNum = current === "" ? null : Number(current);

  const pctDiff =
    rawHitNum && currentNum
      ? ((currentNum - rawHitNum) / rawHitNum) * 100
      : null;

  const moveText =
    pctDiff !== null ? `${pctDiff >= 0 ? "+" : ""}${pctDiff.toFixed(2)}%` : "";

  const explanation = classifyMove(pctDiff);

  return (
    <div className="rounded-3xl bg-white shadow-sm border border-slate-100 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Distance from Raw Hit Price
          </h2>
          <p className="text-[10px] text-slate-500">
            Compare today&apos;s price to the forecast hit price from Signal 97.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-medium text-slate-600">
          Entry helper
        </span>
      </div>

      {/* Inputs */}
      <div className="grid gap-3 md:grid-cols-3 text-[10px]">
        <label className="flex flex-col gap-1">
          <span className="text-[9px] text-slate-500">Symbol (optional)</span>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="AAPL, TSLA, SOXL..."
            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-400"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[9px] text-slate-500">Raw hit price</span>
          <input
            type="number"
            step="0.01"
            value={rawHit}
            onChange={(e) => setRawHit(e.target.value)}
            placeholder="e.g. 10.50"
            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-400"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[9px] text-slate-500">Current price</span>
          <input
            type="number"
            step="0.01"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="live price now"
            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-400"
          />
        </label>
      </div>

      {/* Outputs */}
      <div className="grid gap-3 md:grid-cols-2">
        {/* Left: numeric move */}
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-[9px] uppercase text-slate-500">
            Move since hit
          </div>
          <div className="mt-1 text-lg font-semibold">
            {pctDiff !== null ? (
              <span
                className={
                  pctDiff >= 0 ? "text-emerald-600" : "text-rose-500"
                }
              >
                {moveText}
              </span>
            ) : (
              <span className="text-slate-500 text-[11px]">
                Enter both prices to see the move.
              </span>
            )}
          </div>
          <div className="mt-1 text-[10px] text-slate-600">
            {rawHitNum && currentNum && (
              <>
                From{" "}
                <span className="font-mono text-slate-900">
                  {rawHitNum.toFixed(2)}
                </span>{" "}
                to{" "}
                <span className="font-mono text-slate-900">
                  {currentNum.toFixed(2)}
                </span>
                {symbol && (
                  <>
                    {" "}
                    on <span className="font-semibold">{symbol}</span>
                  </>
                )}
                .
              </>
            )}
          </div>
        </div>

        {/* Right: interpretation */}
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-[9px] uppercase text-slate-500">
            Simple explanation
          </div>
          {pctDiff !== null ? (
            <div className="mt-1 text-[11px]">
              <div className={`font-semibold ${explanation.tone}`}>
                {explanation.title}
              </div>
              <p className="mt-1 text-slate-600 text-[10px] leading-relaxed">
                {explanation.subtitle}
              </p>
              <p className="mt-2 text-slate-500 text-[9px]">
                This only compares prices. Always combine it with your risk plan
                and what Signal&nbsp;97 + Probability say about the setup.
              </p>
            </div>
          ) : (
            <p className="mt-1 text-slate-500 text-[9px]">
              Once you enter both prices, this panel will explain in simple
              terms if today&apos;s price is better, similar, or worse than the
              alert price.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
