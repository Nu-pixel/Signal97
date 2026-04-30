"use client";

import React, { useEffect, useState } from "react";

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

const SETTINGS_KEY = "signal97_user_settings_v1";

const DEFAULT_SETTINGS: Signal97Settings = {
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

function loadSettings(): Signal97Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;

    return {
      ...DEFAULT_SETTINGS,
      ...JSON.parse(raw),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(next: Signal97Settings) {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("signal97-settings-changed"));
}

export default function Settings() {
  const [settings, setSettings] = useState<Signal97Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);

    document.documentElement.style.colorScheme = loaded.theme;
    document.documentElement.classList.toggle("dark", loaded.theme === "dark");
  }, []);

  function update<K extends keyof Signal97Settings>(
    key: K,
    value: Signal97Settings[K]
  ) {
    const next = {
      ...settings,
      [key]: value,
    };

    setSettings(next);
    saveSettings(next);

    if (key === "theme") {
      document.documentElement.style.colorScheme = String(value);
      document.documentElement.classList.toggle("dark", value === "dark");
    }
  }

  function resetDefaults() {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
    document.documentElement.style.colorScheme = DEFAULT_SETTINGS.theme;
    document.documentElement.classList.remove("dark");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-white via-sky-50 to-emerald-50 px-8 py-7 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center rounded-full bg-slate-950 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              Preferences
            </div>

            <h1 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight text-slate-950">
              Settings
            </h1>

            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              Control which alerts appear, how the dashboard feels, and what
              notification level you prefer.
            </p>
          </div>

          <button
            onClick={resetDefaults}
            className="w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Reset defaults
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-slate-100 shadow-sm px-8 py-7 space-y-6">
        <SettingsBlock
          iconBg="bg-sky-100"
          iconDot="bg-sky-500"
          title="Notification Preference"
          subtitle="This saves your notification preference. VM notification enforcement can be wired next."
        >
          <ChoiceGroup
            value={settings.notifyMode}
            options={[
              {
                value: "TIER1",
                label: "Only Tier 1",
                description: "Notify only for top-confidence alerts.",
              },
              {
                value: "TIER1_TIER2",
                label: "Tier 1 + Tier 2",
                description: "Notify for top and strong-confidence alerts.",
              },
              {
                value: "ALL",
                label: "All alerts",
                description: "Notify for every alert tier.",
              },
            ]}
            onChange={(v) => update("notifyMode", v as NotifyMode)}
          />
        </SettingsBlock>

        <SettingsBlock
          iconBg="bg-emerald-100"
          iconDot="bg-emerald-500"
          title="Alert Tiers to Show"
          subtitle="Choose which confidence tiers appear in Signal97 Alerts."
        >
          <div className="grid md:grid-cols-2 gap-3">
            <SettingsToggle
              title="Show Tier 1 alerts"
              description="Top Confidence alerts."
              enabled={settings.showTier1}
              onChange={(v) => update("showTier1", v)}
            />

            <SettingsToggle
              title="Show Tier 2 alerts"
              description="Strong Confidence alerts."
              enabled={settings.showTier2}
              onChange={(v) => update("showTier2", v)}
            />

            <SettingsToggle
              title="Show Tier 3 alerts"
              description="Speculative / riskier alerts."
              enabled={settings.showTier3}
              onChange={(v) => update("showTier3", v)}
            />

            <SettingsToggle
              title="Show Standard alerts"
              description="Alerts without a clean tier marker."
              enabled={settings.showStandard}
              onChange={(v) => update("showStandard", v)}
            />
          </div>
        </SettingsBlock>

        <SettingsBlock
          iconBg="bg-rose-100"
          iconDot="bg-rose-500"
          title="Direction Filters"
          subtitle="Choose whether UP and DOWN alerts should appear."
        >
          <div className="grid md:grid-cols-2 gap-3">
            <SettingsToggle
              title="Show UP alerts"
              description="CALL / Sunrise-bias alerts."
              enabled={settings.showUp}
              onChange={(v) => update("showUp", v)}
            />

            <SettingsToggle
              title="Show DOWN alerts"
              description="PUT / Snowfall-bias alerts."
              enabled={settings.showDown}
              onChange={(v) => update("showDown", v)}
            />
          </div>
        </SettingsBlock>

        <SettingsBlock
          iconBg="bg-amber-100"
          iconDot="bg-amber-500"
          title="Alert Age"
          subtitle="Hide old alerts from the active alert inbox."
        >
          <label className="block rounded-2xl bg-white border border-slate-100 px-4 py-3">
            <div className="text-xs font-semibold text-slate-900">
              Hide alerts older than X days
            </div>
            <div className="text-[10px] text-slate-500 mb-2">
              Example: 20 means alerts older than 20 days are hidden.
            </div>

            <input
              type="number"
              min={1}
              max={365}
              value={settings.hideOlderThanDays}
              onChange={(e) =>
                update(
                  "hideOlderThanDays",
                  Math.max(1, Number(e.target.value) || 20)
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-sky-300"
            />
          </label>
        </SettingsBlock>

        <SettingsBlock
          iconBg="bg-purple-100"
          iconDot="bg-purple-500"
          title="Display Preferences"
          subtitle="Control how much detail the dashboard shows."
        >
          <ChoiceGroup
            value={settings.viewDensity}
            options={[
              {
                value: "comfortable",
                label: "Comfortable",
                description: "More spacing and easier reading.",
              },
              {
                value: "compact",
                label: "Compact",
                description: "Tighter cards with less vertical space.",
              },
            ]}
            onChange={(v) => update("viewDensity", v as ViewDensity)}
          />

          <ChoiceGroup
            value={settings.theme}
            options={[
              {
                value: "light",
                label: "Light mode",
                description: "Bright, clean dashboard.",
              },
              {
                value: "dark",
                label: "Dark mode",
                description: "Saves the preference; full dark styling can be expanded later.",
              },
            ]}
            onChange={(v) => update("theme", v as ThemeMode)}
          />

          <SettingsToggle
            title="Show advanced metrics"
            description="Show probability fields like success, sub-4 risk, edge, and flow on alert cards."
            enabled={settings.showAdvancedMetrics}
            onChange={(v) => update("showAdvancedMetrics", v)}
          />
        </SettingsBlock>
      </div>
    </div>
  );
}

function SettingsBlock({
  iconBg,
  iconDot,
  title,
  subtitle,
  children,
}: {
  iconBg: string;
  iconDot: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-slate-50 px-5 py-5 space-y-4">
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 w-7 h-7 rounded-full ${iconBg} flex items-center justify-center`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${iconDot}`} />
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </div>

      {children}
    </section>
  );
}

function SettingsToggle({
  title,
  description,
  enabled,
  onChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-white border border-slate-100 px-4 py-3">
      <div>
        <div className="text-xs font-semibold text-slate-900">{title}</div>
        <div className="text-[10px] text-slate-500 mt-0.5">{description}</div>
      </div>

      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={
          "h-6 w-11 rounded-full flex items-center px-1 transition " +
          (enabled ? "bg-slate-950 justify-end" : "bg-slate-200 justify-start")
        }
        aria-label={title}
      >
        <span className="h-4 w-4 rounded-full bg-white shadow-sm" />
      </button>
    </div>
  );
}

function ChoiceGroup({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string; description: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid md:grid-cols-3 gap-3">
      {options.map((opt) => {
        const active = value === opt.value;

        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={
              "text-left rounded-2xl border px-4 py-3 transition shadow-sm " +
              (active
                ? "bg-slate-950 text-white border-slate-950"
                : "bg-white text-slate-800 border-slate-100 hover:border-slate-300")
            }
          >
            <div className="text-xs font-bold">{opt.label}</div>
            <div
              className={
                "text-[10px] mt-1 " +
                (active ? "text-slate-300" : "text-slate-500")
              }
            >
              {opt.description}
            </div>
          </button>
        );
      })}
    </div>
  );
}
