"use client";

import React from "react";

type AlertTone = "go" | "scalp" | "wait";

interface Alert {
  sym: string;
  tone: AlertTone;
  side: string;
  window: string;
  qualified: string;
  took?: boolean;
}

const alerts: Alert[] = [
  {
    sym: "PLTR",
    tone: "go",
    side: "Call bias",
    window: "0–7 days",
    qualified: "2h ago",
    took: true,
  },
  {
    sym: "LCID",
    tone: "go",
    side: "Call bias",
    window: "0–7 days",
    qualified: "4h ago",
    took: true,
  },
  {
    sym: "SOFI",
    tone: "scalp",
    side: "Put bias",
    window: "0–3 days",
    qualified: "6h ago",
  },
  {
    sym: "RIVN",
    tone: "scalp",
    side: "Call bias",
    window: "0–3 days",
    qualified: "7h ago",
  },
  {
    sym: "TSLA",
    tone: "wait",
    side: "Neutral bias",
    window: "Monitoring",
    qualified: "7h ago",
  },
];

const toneBg: Record<AlertTone, string> = {
  go: "bg-emerald-50 border border-emerald-100",
  scalp: "bg-amber-50 border border-amber-100",
  wait: "bg-slate-50 border border-slate-100",
};

const toneLabel: Record<AlertTone, string> = {
  go: "GO",
  scalp: "SCALP",
  wait: "WAIT",
};

const toneLabelClass: Record<AlertTone, string> = {
  go: "bg-emerald-600 text-white",
  scalp: "bg-amber-500 text-white",
  wait: "bg-slate-500 text-white",
};

const SignalAlerts: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Signal 97 Alerts
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Only alerts that pass our rules appear here. No random call-outs.
        </p>
      </div>

      <div className="space-y-4">
        {alerts.map((a) => (
          <div
            key={a.sym}
            className={`${toneBg[a.tone]} rounded-3xl px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`}
          >
            {/* Left side: symbol + details */}
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <div className="text-xl font-semibold text-slate-900">
                  {a.sym}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-semibold ${toneLabelClass[a.tone]}`}
                >
                  {toneLabel[a.tone]}
                </span>
              </div>
              <div className="text-[11px] leading-relaxed text-slate-700">
                <div>
                  <span className="font-semibold">Side:</span> {a.side}
                </div>
                <div>
                  <span className="font-semibold">Window:</span> {a.window}
                </div>
                <div className="text-slate-500">
                  Qualified {a.qualified}
                </div>
              </div>
            </div>

            {/* Right side: action button */}
            <div className="flex items-end sm:items-center">
              <button className="px-4 py-2 rounded-full bg-slate-900 text-white text-[10px] font-semibold shadow-sm hover:bg-black transition-colors">
                {a.took ? "I took this" : "Mark as taken"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SignalAlerts;
