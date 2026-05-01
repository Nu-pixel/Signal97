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
      {/* TOP SETTINGS HERO */}
      <div
        className="
          relative overflow-hidden rounded-[32px] px-8 py-7 transition-colors
          border border-slate-200 bg-white text-slate-900 shadow-[0_18px_55px_rgba(15,23,42,0.10)]
          dark:border-white/15 dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_34%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_30%),linear-gradient(135deg,#101827_0%,#162335_55%,#0b111c_100%)] dark:text-white dark:shadow-[0_22px_70px_rgba(0,0,0,0.32)]
        "
      >
        <div className="pointer-events-none absolute inset-0 opacity-0 dark:opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] [background-size:38px_38px]" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-100">
              Preferences
            </div>

            <h1 className="mt-4 text-3xl md:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
              Settings
            </h1>

            <p className="mt-2 text-sm text-slate-600 max-w-2xl dark:text-slate-300">
              Control which alerts appear, how the dashboard feels, and what
              notification level you prefer.
            </p>
          </div>

          <button
            onClick={resetDefaults}
            className="
              w-fit rounded-full border px-4 py-2 text-xs font-semibold shadow-sm transition
              border-slate-200 bg-white text-slate-700 hover:bg-slate-50
              dark:border-white/15 dark:bg-white/[0.05] dark:text-slate-200 dark:hover:border-cyan-300/35 dark:hover:bg-cyan-300/10 dark:hover:text-white
            "
          >
            Reset defaults
          </button>
        </div>
      </div>

      {/* SETTINGS BODY PANEL */}
      <div
        className="
          relative overflow-hidden rounded-[32px] px-8 py-7 space-y-6 transition-colors
          border border-slate-200 bg-white text-slate-900 shadow-[0_18px_55px_rgba(15,23,42,0.10)]
          dark:border-white/15 dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_34%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_30%),linear-gradient(135deg,#101827_0%,#162335_55%,#0b111c_100%)] dark:text-white dark:shadow-[0_22px_70px_rgba(0,0,0,0.30)]
        "
      >
        <div className="pointer-events-none absolute inset-0 opacity-0 dark:opacity-[0.14] [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:38px_38px]" />

        <div className="relative z-10 space-y-6">
          <SettingsBlock
            iconBg="bg-sky-100 dark:bg-sky-300/10"
            iconDot="bg-sky-500 dark:bg-sky-300"
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
            iconBg="bg-emerald-100 dark:bg-emerald-300/10"
            iconDot="bg-emerald-500 dark:bg-emerald-300"
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
            iconBg="bg-rose-100 dark:bg-rose-300/10"
            iconDot="bg-rose-500 dark:bg-rose-300"
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
            iconBg="bg-amber-100 dark:bg-amber-300/10"
            iconDot="bg-amber-500 dark:bg-amber-300"
            title="Alert Age"
            subtitle="Hide old alerts from the active alert inbox."
          >
            <label
              className="
                block rounded-2xl px-4 py-3 transition-colors
                border border-slate-200 bg-white shadow-sm
                dark:border-white/10 dark:bg-[#0b1423]/80 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]
              "
            >
              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                Hide alerts older than X days
              </div>

              <div className="text-[10px] text-slate-500 mb-2 dark:text-slate-400">
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
                className="
                  w-full rounded-xl px-3 py-2 text-sm outline-none transition
                  border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-sky-300
                  dark:border-white/15 dark:bg-[#111827] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-cyan-300/30
                "
              />
            </label>
          </SettingsBlock>

          <SettingsBlock
            iconBg="bg-purple-100 dark:bg-purple-300/10"
            iconDot="bg-purple-500 dark:bg-purple-300"
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
                  description: "High-end dark trading dashboard.",
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
    <section
      className="
        rounded-3xl px-5 py-5 space-y-4 transition-colors
        border border-slate-200 bg-slate-50
        dark:border-white/10 dark:bg-[#0b1423]/80 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]
      "
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 w-7 h-7 rounded-full ${iconBg} flex items-center justify-center`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${iconDot}`} />
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {title}
          </h2>

          <p className="text-[11px] text-slate-500 mt-0.5 dark:text-slate-400">
            {subtitle}
          </p>
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
    <div
      className="
        flex items-center justify-between gap-4 rounded-2xl px-4 py-3 transition-colors
        border border-slate-200 bg-white shadow-sm
        dark:border-white/10 dark:bg-[#111827]/80 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]
      "
    >
      <div>
        <div className="text-xs font-semibold text-slate-900 dark:text-white">
          {title}
        </div>

        <div className="text-[10px] text-slate-500 mt-0.5 dark:text-slate-400">
          {description}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={
          "h-6 w-11 rounded-full flex items-center px-1 transition " +
          (enabled
            ? "bg-slate-950 justify-end dark:bg-cyan-300/25 dark:ring-1 dark:ring-cyan-300/30"
            : "bg-slate-200 justify-start dark:bg-white/10")
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
                ? "bg-slate-950 text-white border-slate-950 dark:bg-[#050816] dark:text-white dark:border-cyan-300/25 dark:shadow-[0_0_22px_rgba(34,211,238,0.10)]"
                : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 dark:bg-[#111827]/80 dark:text-slate-200 dark:border-white/10 dark:hover:border-cyan-300/25 dark:hover:bg-cyan-300/10")
            }
          >
            <div className="text-xs font-bold">{opt.label}</div>

            <div
              className={
                "text-[10px] mt-1 " +
                (active
                  ? "text-slate-300 dark:text-slate-300"
                  : "text-slate-500 dark:text-slate-400")
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
