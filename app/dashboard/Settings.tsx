"use client";

import React from "react";

const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 px-8 py-7 space-y-6">
        {/* Heading */}
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
            Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Customize your Signal 97 experience.
          </p>
        </div>

        {/* Notification Preferences */}
        <SettingsBlock
          iconBg="bg-sky-100"
          iconDot="bg-sky-500"
          title="Notification Preferences"
        >
          <SettingsRow
            title="Email notifications"
            description="Get alerts via email"
            enabled
          />
          <SettingsRow
            title="App notifications"
            description="Push notifications in the app"
            enabled
          />
          <SettingsRow
            title="Telegram notifications"
            description="Receive alerts via Telegram"
            enabled={false}
            dim
          />
        </SettingsBlock>

        {/* Alert Preferences */}
        <SettingsBlock
          iconBg="bg-amber-100"
          iconDot="bg-amber-500"
          title="Alert Preferences"
        >
          <div className="space-y-3">
            <div className="text-[10px] text-slate-500">
              Which alert labels to show
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill color="emerald">GO ✓</Pill>
              <Pill color="orange">SCALP ✓</Pill>
              <Pill color="slate">WAIT ✓</Pill>
            </div>
            <div className="text-[9px] text-slate-400">
              All labels enabled (default)
            </div>
          </div>

          <Divider />

          <SimpleSelect label="Max alerts per day" value="Unlimited" />
        </SettingsBlock>

        {/* General Preferences */}
        <SettingsBlock
          iconBg="bg-purple-100"
          iconDot="bg-purple-500"
          title="General Preferences"
        >
          <SimpleSelect label="Timezone" value="Eastern (EST)" />
        </SettingsBlock>
      </div>
    </div>
  );
};

export default Settings;

/* --- pieces --- */

function SettingsBlock({
  iconBg,
  iconDot,
  title,
  children,
}: {
  iconBg: string;
  iconDot: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-slate-50 rounded-2xl px-4 py-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <div className={`w-6 h-6 rounded-full ${iconBg} flex items-center justify-center`}>
          <span className={`w-2 h-2 rounded-full ${iconDot}`} />
        </div>
        <span>{title}</span>
      </div>
      {children}
    </section>
  );
}

function SettingsRow({
  title,
  description,
  enabled,
  dim,
}: {
  title: string;
  description: string;
  enabled: boolean;
  dim?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3 rounded-2xl ${
        dim ? "bg-white/40" : "bg-white"
      } border border-slate-100`}
    >
      <div className="flex flex-col">
        <div className={`text-xs font-medium ${dim ? "text-slate-400" : "text-slate-900"}`}>
          {title}
        </div>
        <div className="text-[9px] text-slate-500">{description}</div>
      </div>
      <Toggle on={enabled} dim={dim} />
    </div>
  );
}

function Toggle({ on, dim }: { on: boolean; dim?: boolean }) {
  return (
    <div
      className={
        "w-9 h-5 rounded-full flex items-center px-1 transition-colors " +
        (on
          ? "bg-slate-900 justify-end"
          : dim
          ? "bg-slate-200 justify-start"
          : "bg-slate-300 justify-start")
      }
    >
      <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
    </div>
  );
}

function Pill({
  color,
  children,
}: {
  color: "emerald" | "orange" | "slate";
  children: React.ReactNode;
}) {
  const map = {
    emerald: "bg-emerald-500 text-white",
    orange: "bg-orange-500 text-white",
    slate: "bg-slate-500 text-white",
  } as const;

  return (
    <span className={`px-3 py-1 rounded-full text-[9px] font-semibold ${map[color]}`}>
      {children}
    </span>
  );
}

function Divider() {
  return <div className="h-px bg-slate-100 my-2" />;
}

function SimpleSelect({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-2">
      <div className="text-[10px] text-slate-500 mb-1">{label}</div>
      <div className="w-full bg-white rounded-xl px-3 py-2 border border-slate-100 text-[10px] text-slate-700 flex items-center justify-between">
        <span>{value}</span>
        <span className="text-slate-400 text-[9px]">▾</span>
      </div>
    </div>
  );
}
