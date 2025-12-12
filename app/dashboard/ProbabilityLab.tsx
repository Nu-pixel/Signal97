"use client";

import React from "react";

const ProbabilityLab: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Top card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 px-8 py-7 space-y-6">
        {/* Heading */}
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Probability Lab
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Historical context for how similar alerts behaved. No formulas, just
            typical ranges. Hypothetical only — not guarantees.
          </p>
        </div>

        {/* 3 metric cards */}
        <div className="grid md:grid-cols-3 gap-5 text-sm">
          {/* GO Alerts */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-6 py-5 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] text-white font-semibold">
                GO
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-600/10 text-emerald-800 text-[10px] font-semibold">
                GO Alerts
              </span>
            </div>
            <div className="text-[11px] text-emerald-800/90">
              Historical hit rate (0–7 days)
            </div>
            <div className="mt-1 text-4xl font-semibold text-emerald-900 leading-tight">
              88.9%
            </div>
            <div className="mt-1 text-[10px] text-emerald-800/80">
              reached +4% or more
            </div>
            <div className="mt-6 border-t border-emerald-200 pt-3 text-[10px] text-emerald-800/90">
              When above $3:&nbsp;
              <span className="font-semibold text-emerald-900">92.3%</span>
            </div>
          </div>

          {/* SCALP Alerts */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl px-6 py-5 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-[10px] text-white font-semibold">
                ⇄
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 text-[10px] font-semibold">
                SCALP Alerts
              </span>
            </div>
            <div className="text-[11px] text-amber-900/90">Typical window</div>
            <div className="mt-1 text-4xl font-semibold text-amber-900 leading-tight">
              0–3 days
            </div>
            <div className="mt-1 text-[10px] text-amber-800/90">
              faster moves
            </div>
            <div className="mt-6 border-t border-amber-200 pt-3 text-[10px] text-amber-900/90">
              Target ranges:&nbsp;
              <span className="font-semibold text-amber-700">2–6%</span>
            </div>
          </div>

          {/* All Alerts */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-6 py-5 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white font-semibold">
                ↗
              </span>
              <span className="px-3 py-1 rounded-full bg-indigo-600/10 text-indigo-800 text-[10px] font-semibold">
                All Alerts
              </span>
            </div>
            <div className="text-[11px] text-indigo-900/90">
              Average gain (winners)
            </div>
            <div className="mt-1 text-4xl font-semibold text-indigo-900 leading-tight">
              +6.4%
            </div>
            <div className="mt-1 text-[10px] text-indigo-800/90">
              when target hit
            </div>
            <div className="mt-6 border-t border-indigo-200 pt-3 text-[10px] text-indigo-900/90">
              Typical hold time:&nbsp;
              <span className="font-semibold text-indigo-800">2–5 days</span>
            </div>
          </div>
        </div>

        {/* Yellow disclaimer bar */}
        <div className="mt-2 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 text-[10px] text-amber-900 leading-relaxed">
          <span className="font-semibold">Important:&nbsp;</span>
          These are historical, hypothetical results from backtesting. Past
          performance does not guarantee future results. Real trading outcomes
          will differ. This is context, not a promise.
        </div>
      </div>

      {/* Understanding the data */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 px-8 py-6 text-xs text-slate-700 space-y-2">
        <h2 className="text-base font-semibold text-slate-900 mb-1">
          Understanding the data
        </h2>
        <p>
          The Probability Lab shows how alerts with similar characteristics
          performed historically. This gives you context for decision-making.
        </p>
        <p>
          <span className="font-semibold">What we measure:</span> Price movement
          within specified timeframes, typical ranges, and how often targets
          were reached.
        </p>
        <p>
          <span className="font-semibold">What we don&apos;t show:</span> Exact
          formulas, proprietary scoring, or guarantees. The underlying model
          stays internal to protect its integrity.
        </p>
      </div>
    </div>
  );
};

export default ProbabilityLab;
