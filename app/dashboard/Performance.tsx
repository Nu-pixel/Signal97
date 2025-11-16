"use client";

import React from "react";

const Performance: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Top main card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 px-8 py-7 space-y-6">
        {/* Heading */}
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
            P&amp;L / Performance
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track your actual results over time.
          </p>
        </div>

        {/* Summary stats row */}
        <div className="grid md:grid-cols-3 gap-5 text-sm">
          <PerfCard
            tone="blue"
            title="This Week"
            value="+$847"
            detail="5 trades · 4 winners"
            winRate="80%"
          />
          <PerfCard
            tone="purple"
            title="This Month"
            value="+$3,412"
            detail="18 trades · 15 winners"
            winRate="83.3%"
          />
          <PerfCard
            tone="green"
            title="All Time"
            value="+$12,890"
            detail="67 trades · 58 winners"
            winRate="86.6%"
          />
        </div>

        {/* Breakdown */}
        <div className="mt-2 space-y-3 text-xs">
          <div className="font-semibold text-slate-900">
            Performance breakdown
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* By alert label */}
            <div className="space-y-2">
              <div className="text-[10px] text-slate-500 font-semibold">
                By alert label
              </div>
              <BreakdownRow
                dotClass="bg-emerald-500"
                label="GO alerts"
                value="+5.2% avg"
              />
              <BreakdownRow
                dotClass="bg-orange-500"
                label="SCALP alerts"
                value="+3.8% avg"
              />
            </div>

            {/* By timeframe */}
            <div className="space-y-2">
              <div className="text-[10px] text-slate-500 font-semibold">
                By timeframe
              </div>
              <BreakdownRow
                label="0–3 days"
                value="68% win rate"
              />
              <BreakdownRow
                label="0–7 days"
                value="89% win rate"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Compare card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 px-8 py-6 space-y-4">
        <div className="font-semibold text-slate-900 text-sm">
          Compare: Alerts vs. Your choices
        </div>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          {/* All alerts */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 flex flex-col justify-between">
            <div className="text-[10px] text-slate-500">
              All alerts (if taken)
            </div>
            <div className="mt-1 text-2xl font-semibold text-indigo-900">
              +4.8% avg
            </div>
            <div className="mt-1 text-[9px] text-slate-500">
              Based on sample data
            </div>
          </div>

          {/* Your choices */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 flex flex-col justify-between">
            <div className="text-[10px] text-slate-600">
              Your actual trades
            </div>
            <div className="mt-1 text-2xl font-semibold text-emerald-700">
              +5.1% avg
            </div>
            <div className="mt-1 text-[9px] text-emerald-600">
              You&apos;re selecting well!
            </div>
          </div>
        </div>
        <p className="text-[10px] text-slate-500">
          This comparison shows how your choices stack up against taking every alert blindly.
        </p>
      </div>
    </div>
  );
};

export default Performance;

/* --- pieces --- */

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
  const styles: Record<typeof tone, string> = {
    blue: "bg-sky-50 border-sky-100",
    purple: "bg-fuchsia-50 border-fuchsia-100",
    green: "bg-emerald-50 border-emerald-100",
  };

  return (
    <div
      className={`rounded-2xl px-6 py-5 border flex flex-col justify-between ${styles[tone]}`}
    >
      <div className="text-[11px] text-slate-600 mb-1 font-medium">
        {title}
      </div>
      <div className="text-3xl font-semibold text-slate-900 leading-tight">
        {value}
      </div>
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
        {dotClass && (
          <span
            className={`w-2 h-2 rounded-full ${dotClass}`}
          />
        )}
        <span className="text-slate-700">{label}</span>
      </div>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}
