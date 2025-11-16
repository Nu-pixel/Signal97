"use client";

import React from "react";
import { Activity, Eye, Bell, BarChart2, ArrowRight } from "lucide-react";

export default function CommandCenter() {
  return (
    <div className="space-y-6">
      {/* Today at a glance */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          Today at a glance
        </h1>

        {/* Stat cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          {/* Market mood */}
          <div className="flex flex-col justify-between bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium">
                <Activity className="w-4 h-4" />
                <span>Market mood</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
                Calm
              </span>
            </div>
            <div className="text-lg md:text-xl font-semibold text-emerald-900 leading-snug">
              Good conditions
            </div>
          </div>

          {/* Watching */}
          <div className="flex flex-col justify-between bg-sky-50 border border-sky-100 rounded-2xl px-4 py-4">
            <div className="flex items-center gap-2 text-sky-600 text-xs font-medium mb-2">
              <Eye className="w-4 h-4" />
              <span>Watching</span>
            </div>
            <div className="text-lg md:text-xl font-semibold text-slate-900">
              18 symbols
            </div>
          </div>

          {/* New alerts today */}
          <div className="flex flex-col justify-between bg-amber-50 border border-amber-100 rounded-2xl px-4 py-4">
            <div className="flex items-center gap-2 text-amber-600 text-xs font-medium mb-2">
              <Bell className="w-4 h-4" />
              <span>New alerts today</span>
            </div>
            <div className="text-[11px] text-slate-800 leading-snug font-semibold">
              GO: 5 · SCALP: 3 · WAIT: 2
            </div>
          </div>

          {/* Open trades */}
          <div className="flex flex-col justify-between bg-purple-50 border border-purple-100 rounded-2xl px-4 py-4">
            <div className="flex items-center gap-2 text-purple-600 text-xs font-medium mb-2">
              <BarChart2 className="w-4 h-4" />
              <span>Open trades</span>
            </div>
            <div className="flex items-baseline gap-1">
              <div className="text-lg md:text-xl font-semibold text-slate-900">
                3
              </div>
              <div className="text-xs font-semibold text-emerald-600">
                (+4.2%)
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="border-t border-slate-100 pt-4">
          <div className="text-xs text-slate-500 mb-2">Quick actions (demo)</div>
          <div className="flex flex-wrap gap-2">
            <QuickAction>View alerts</QuickAction>
            <QuickAction>Check trades</QuickAction>
            <QuickAction>Performance report</QuickAction>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Recent activity (sample)
        </h2>
        <div className="space-y-3">
          <ActivityRow
            label="GO"
            labelClass="bg-emerald-100 text-emerald-700"
            title="PLTR qualified"
            subtitle="Call bias · 2 hours ago"
          />
          <ActivityRow
            label="TRADE"
            labelClass="bg-sky-100 text-sky-700"
            title="LCID reached +4% target"
            subtitle="3 hours ago"
          />
          <ActivityRow
            label="SCALP"
            labelClass="bg-amber-100 text-amber-700"
            title="SOFI qualified"
            subtitle="Put bias · 4 hours ago"
          />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ children }: { children: React.ReactNode }) {
  return (
    <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all">
      {children}
      <ArrowRight className="w-3 h-3 text-slate-400" />
    </button>
  );
}

function ActivityRow({
  label,
  labelClass,
  title,
  subtitle,
}: {
  label: string;
  labelClass: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50/70 hover:bg-slate-50 transition-colors">
      <span
        className={`px-3 py-1 rounded-full text-[10px] font-semibold ${labelClass}`}
      >
        {label}
      </span>
      <div className="flex flex-col">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <div className="text-[10px] text-slate-500">{subtitle}</div>
      </div>
    </div>
  );
}
