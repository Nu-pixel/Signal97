"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import CommandCenter from "./CommandCenter";
import LiveWatchlist from "./LiveWatchlist";
import ActiveTrades from "./ActiveTrades";
import Performance from "./Performance";
import Tools from "./Tools";
import Settings from "./Settings";
import LiveAlertsPanel from "./LiveAlertsPanel";
import TakenClosedAlerts from "./TakenClosedAlerts";
import DismissedAlerts from "./DismissedAlerts";

const TABS = [
  "Command Center",
  "Live Watchlist",
  "Signal 97 Alerts",
  "Active Trades",
  "Taken / Closed Alerts",
  "Dismissed Alerts",
  "P&L / Performance",
  "Tools",
  "Settings",
] as const;

type Tab = (typeof TABS)[number];

type IconName =
  | "menu"
  | "close"
  | "dashboard"
  | "bell"
  | "wallet"
  | "eye"
  | "more"
  | "trend"
  | "archive"
  | "inbox"
  | "tool"
  | "settings"
  | "logout"
  | "chevron";

const SETTINGS_KEY = "signal97_user_settings_v1";

function applyDashboardTheme() {
  if (typeof window === "undefined") return;

  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const theme = parsed?.theme === "dark" ? "dark" : "light";

    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  } catch {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  }
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardInner />
    </Suspense>
  );
}

function DashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isDemo = useMemo(() => searchParams.get("demo") === "1", [searchParams]);
  const [activeTab, setActiveTab] = useState<Tab>("Command Center");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pageMaxWidth = "max-w-[1500px]";

  useEffect(() => {
    applyDashboardTheme();

    const onSettingsChanged = () => applyDashboardTheme();

    window.addEventListener("signal97-settings-changed", onSettingsChanged);
    window.addEventListener("storage", onSettingsChanged);

    return () => {
      window.removeEventListener("signal97-settings-changed", onSettingsChanged);
      window.removeEventListener("storage", onSettingsChanged);
    };
  }, []);

  const goToTab = (tab: Tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
    router.push("/");
  };

  const activeTitle = activeTab === "Command Center" ? "Command Center" : activeTab;

  return (
    <main
      className="
        relative min-h-screen overflow-x-hidden transition-colors
        bg-[radial-gradient(circle_at_top_left,rgba(219,234,254,0.60),transparent_32%),radial-gradient(circle_at_top_right,rgba(209,250,229,0.48),transparent_30%),linear-gradient(135deg,#f8fafc_0%,#eef4fb_48%,#e8f1f8_100%)]
        text-slate-900
        dark:bg-[#05070c]
        dark:text-slate-100
      "
    >
      {/* LIGHT MODE BACKGROUND */}
      <div
        className="
          pointer-events-none fixed inset-0 z-0 opacity-100 dark:opacity-0
          bg-[radial-gradient(circle_at_18%_12%,rgba(37,99,235,0.12),transparent_30%),radial-gradient(circle_at_82%_14%,rgba(16,185,129,0.10),transparent_32%),linear-gradient(135deg,#f8fafc_0%,#eef4fb_50%,#e8f1f8_100%)]
        "
      />

      {/* DARK MODE HIGH-END BACKGROUND */}
      <div
        className="
          pointer-events-none fixed inset-0 z-0 opacity-0 dark:opacity-100
          bg-[radial-gradient(circle_at_18%_12%,rgba(59,130,246,0.18),transparent_28%),radial-gradient(circle_at_82%_14%,rgba(20,184,166,0.13),transparent_30%),radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.16),transparent_38%),linear-gradient(135deg,#030406_0%,#07101d_38%,#081827_72%,#030406_100%)]
        "
      />

      {/* DARK MODE SUBTLE GRID */}
      <div
        className="
          pointer-events-none fixed inset-0 z-0 opacity-0 dark:opacity-[0.16]
          [background-image:linear-gradient(rgba(148,163,184,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)]
          [background-size:72px_72px]
        "
      />

      {/* DARK MODE VIGNETTE */}
      <div
        className="
          pointer-events-none fixed inset-0 z-0 opacity-0 dark:opacity-100
          bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.20)_58%,rgba(0,0,0,0.58)_100%)]
        "
      />

      {/* DESKTOP TOP BAR + TABS */}
      <header
        className="
          hidden md:block fixed top-0 left-0 right-0 z-[100] w-full border-b backdrop-blur-2xl transition-colors
          bg-white/92 border-slate-200 shadow-sm
          dark:bg-[#070b13]/92 dark:border-white/10 dark:shadow-[0_18px_70px_rgba(0,0,0,0.40)]
        "
      >
        <div className="w-full max-w-[1500px] mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-semibold shadow-sm dark:shadow-[0_0_24px_rgba(37,99,235,0.55)]">
              97
            </div>

            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Signal 97 · Workspace
                <span
                  className={
                    "px-2 py-0.5 rounded-full text-[10px] font-semibold border " +
                    (isDemo
                      ? "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-400/15 dark:text-orange-200 dark:border-orange-300/25"
                      : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-400/15 dark:text-emerald-200 dark:border-emerald-300/25")
                  }
                >
                  {isDemo ? "DEMO" : "LIVE"}
                </span>
              </div>

              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {isDemo
                  ? "Showing sample UI data (demo mode)."
                  : "Showing live-connected pages (when wired)."}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-300">
            <span>demo@signal97.com</span>

            <button
              onClick={handleLogout}
              className="
                px-3 py-1.5 rounded-full border transition
                border-slate-200 text-slate-600 hover:bg-slate-50
                dark:border-white/20 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white
              "
            >
              Log out
            </button>
          </div>
        </div>

        {/* Desktop tabs row */}
        <div
          className="
            dashboard-tabs-row w-full border-t border-b backdrop-blur-2xl transition-colors
            bg-white/90 border-slate-200 shadow-sm/40
            dark:bg-[#09111f]/95 dark:border-white/10
          "
        >
          <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-2 py-3 text-sm">
              {TABS.map((tab) => {
                const isActiveTab = tab === activeTab;

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={
                      "px-4 py-2 rounded-full whitespace-nowrap transition-all " +
                      (isActiveTab
                        ? "bg-slate-950 text-white shadow-sm dark:bg-[#050816] dark:text-white dark:ring-1 dark:ring-cyan-200/45 dark:shadow-[0_0_28px_rgba(56,189,248,0.20)]"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/10")
                    }
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE TOP BAR */}
      <header
        className="
          md:hidden fixed top-0 left-0 right-0 z-[100] border-b backdrop-blur-2xl transition-colors
          bg-white/92 border-slate-200 shadow-sm
          dark:bg-[#070b13]/94 dark:border-white/10 dark:shadow-[0_18px_70px_rgba(0,0,0,0.40)]
        "
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-sm font-black text-white shadow-sm dark:shadow-[0_0_24px_rgba(37,99,235,0.55)]">
              97
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="truncate text-lg font-black tracking-tight text-slate-950 dark:text-white">
                  Signal97
                </div>

                <span
                  className={
                    "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide " +
                    (isDemo
                      ? "border-orange-200 bg-orange-100 text-orange-700 dark:border-orange-300/25 dark:bg-orange-400/15 dark:text-orange-200"
                      : "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-300/25 dark:bg-emerald-400/15 dark:text-emerald-200")
                  }
                >
                  {isDemo ? "Demo" : "Live"}
                </span>
              </div>

              <div className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {activeTitle}
              </div>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="
              inline-flex h-10 w-10 items-center justify-center rounded-2xl border shadow-sm transition
              border-slate-200 bg-white text-slate-700 hover:bg-slate-50
              dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100 dark:hover:bg-white/10
            "
            aria-label="Open menu"
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER BACKDROP */}
      {mobileMenuOpen && (
        <button
          className="md:hidden fixed inset-0 z-[110] bg-black/40 backdrop-blur-[1px]"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close menu backdrop"
        />
      )}

      {/* MOBILE RIGHT DRAWER */}
      <aside
        className={`
          md:hidden fixed right-0 top-0 z-[120] h-full w-[86%] max-w-sm transform border-l shadow-2xl transition-transform duration-300
          border-slate-200 bg-white
          dark:border-white/10 dark:bg-[#0b1423]
          ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-white/10">
            <div>
              <div className="text-lg font-black text-slate-950 dark:text-white">
                Workspace Menu
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                demo@signal97.com
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="
                inline-flex h-10 w-10 items-center justify-center rounded-2xl border
                border-slate-200 bg-white text-slate-700
                dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100
              "
              aria-label="Close menu"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <MenuSectionLabel>Workspace</MenuSectionLabel>
            <MobileDrawerItem
              icon="dashboard"
              label="Command Center"
              active={activeTab === "Command Center"}
              onClick={() => goToTab("Command Center")}
            />
            <MobileDrawerItem
              icon="eye"
              label="Live Watchlist"
              active={activeTab === "Live Watchlist"}
              onClick={() => goToTab("Live Watchlist")}
            />
            <MobileDrawerItem
              icon="bell"
              label="Signal 97 Alerts"
              active={activeTab === "Signal 97 Alerts"}
              onClick={() => goToTab("Signal 97 Alerts")}
            />
            <MobileDrawerItem
              icon="wallet"
              label="Active Trades"
              active={activeTab === "Active Trades"}
              onClick={() => goToTab("Active Trades")}
            />

            <MenuSectionLabel>History</MenuSectionLabel>
            <MobileDrawerItem
              icon="archive"
              label="Taken / Closed Alerts"
              active={activeTab === "Taken / Closed Alerts"}
              onClick={() => goToTab("Taken / Closed Alerts")}
            />
            <MobileDrawerItem
              icon="inbox"
              label="Dismissed Alerts"
              active={activeTab === "Dismissed Alerts"}
              onClick={() => goToTab("Dismissed Alerts")}
            />
            <MobileDrawerItem
              icon="trend"
              label="P&L / Performance"
              active={activeTab === "P&L / Performance"}
              onClick={() => goToTab("P&L / Performance")}
            />

            <MenuSectionLabel>Utilities</MenuSectionLabel>
            <MobileDrawerItem
              icon="tool"
              label="Tools"
              active={activeTab === "Tools"}
              onClick={() => goToTab("Tools")}
            />
            <MobileDrawerItem
              icon="settings"
              label="Settings"
              active={activeTab === "Settings"}
              onClick={() => goToTab("Settings")}
            />

            <MenuSectionLabel>Account</MenuSectionLabel>
            <MobileDrawerItem
              icon="logout"
              label="Log out"
              danger
              onClick={handleLogout}
            />
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <nav
        className="
          md:hidden fixed bottom-0 left-0 right-0 z-[100] border-t px-2 py-2 backdrop-blur-2xl transition-colors
          border-slate-200 bg-white/95
          dark:border-white/10 dark:bg-[#070b13]/95
        "
      >
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          <BottomNavButton
            icon="dashboard"
            label="Home"
            active={activeTab === "Command Center"}
            onClick={() => setActiveTab("Command Center")}
          />
          <BottomNavButton
            icon="bell"
            label="Alerts"
            active={activeTab === "Signal 97 Alerts"}
            onClick={() => setActiveTab("Signal 97 Alerts")}
          />
          <BottomNavButton
            icon="wallet"
            label="Trades"
            active={activeTab === "Active Trades"}
            onClick={() => setActiveTab("Active Trades")}
          />
          <BottomNavButton
            icon="eye"
            label="Watch"
            active={activeTab === "Live Watchlist"}
            onClick={() => setActiveTab("Live Watchlist")}
          />
          <BottomNavButton
            icon="more"
            label="More"
            active={
              activeTab === "P&L / Performance" ||
              activeTab === "Taken / Closed Alerts" ||
              activeTab === "Dismissed Alerts" ||
              activeTab === "Tools" ||
              activeTab === "Settings"
            }
            onClick={() => setMobileMenuOpen(true)}
          />
        </div>
      </nav>

      {/* Tab content */}
      <section
        className={`relative z-10 w-full ${pageMaxWidth} mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-40 pb-28 md:pb-8 space-y-6`}
      >
        {activeTab === "Command Center" && (
          <CommandCenter onNavigate={setActiveTab} />
        )}

        {activeTab === "Live Watchlist" && <LiveWatchlist />}
        {activeTab === "Signal 97 Alerts" && <LiveAlertsPanel />}
        {activeTab === "Active Trades" && <ActiveTrades />}
        {activeTab === "Taken / Closed Alerts" && <TakenClosedAlerts />}
        {activeTab === "Dismissed Alerts" && <DismissedAlerts />}
        {activeTab === "P&L / Performance" && <Performance />}
        {activeTab === "Tools" && <Tools />}
        {activeTab === "Settings" && <Settings />}
      </section>
    </main>
  );
}

function BottomNavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: IconName;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-semibold transition " +
        (active
          ? "bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950"
          : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10")
      }
    >
      <Icon name={icon} className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}

function MenuSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pb-2 pt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
      {children}
    </div>
  );
}

function MobileDrawerItem({
  icon,
  label,
  active,
  danger,
  onClick,
}: {
  icon: IconName;
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition " +
        (danger
          ? "text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
          : active
          ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
          : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5")
      }
    >
      <span className="flex items-center gap-3">
        <span
          className={
            active
              ? "text-current"
              : "text-slate-500 dark:text-slate-400"
          }
        >
          <Icon name={icon} className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold">{label}</span>
      </span>

      <Icon name="chevron" className="h-4 w-4 opacity-60" />
    </button>
  );
}

function Icon({
  name,
  className = "h-4 w-4",
}: {
  name: IconName;
  className?: string;
}) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": "true",
  };

  switch (name) {
    case "menu":
      return (
        <svg {...common}>
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
        </svg>
      );

    case "close":
      return (
        <svg {...common}>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      );

    case "dashboard":
      return (
        <svg {...common}>
          <path d="M3 13h8V3H3v10Z" />
          <path d="M13 21h8V11h-8v10Z" />
          <path d="M13 3v6h8V3h-8Z" />
          <path d="M3 21h8v-6H3v6Z" />
        </svg>
      );

    case "bell":
      return (
        <svg {...common}>
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
      );

    case "wallet":
      return (
        <svg {...common}>
          <path d="M3 7h18v14H3z" />
          <path d="M3 7V5a2 2 0 0 1 2-2h14" />
          <path d="M16 14h.01" />
        </svg>
      );

    case "eye":
      return (
        <svg {...common}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );

    case "more":
      return (
        <svg {...common}>
          <circle cx="5" cy="12" r="1" />
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
        </svg>
      );

    case "trend":
      return (
        <svg {...common}>
          <path d="m3 17 6-6 4 4 8-8" />
          <path d="M14 7h7v7" />
        </svg>
      );

    case "archive":
      return (
        <svg {...common}>
          <path d="M3 5h18v4H3z" />
          <path d="M5 9v12h14V9" />
          <path d="M10 13h4" />
        </svg>
      );

    case "inbox":
      return (
        <svg {...common}>
          <path d="M4 4h16l-2 10h-4a4 4 0 0 1-8 0H2L4 4Z" />
          <path d="M2 14v6h20v-6" />
        </svg>
      );

    case "tool":
      return (
        <svg {...common}>
          <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-3 3-2.4-2.4 3-3Z" />
        </svg>
      );

    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3-.2-.1a1.7 1.7 0 0 0-2-.1 1.7 1.7 0 0 0-1 1.5V22h-3v-.3a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-2 .1l-.2.1-2-3 .1-.1A1.7 1.7 0 0 0 6.6 15 1.7 1.7 0 0 0 5 14H4v-4h1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L6.2 7l2-3 .2.1a1.7 1.7 0 0 0 2 .1 1.7 1.7 0 0 0 1-1.5V2h3v.3a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 2-.1l.2-.1 2 3-.1.1A1.7 1.7 0 0 0 18.4 9c.3.6.9 1 1.6 1h1v4h-1c-.7 0-1.3.4-1.6 1Z" />
        </svg>
      );

    case "logout":
      return (
        <svg {...common}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      );

    case "chevron":
      return (
        <svg {...common}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      );

    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

function DashboardSkeleton() {
  return (
    <main
      className="
        relative min-h-screen overflow-x-hidden transition-colors
        bg-[radial-gradient(circle_at_top_left,rgba(219,234,254,0.60),transparent_32%),radial-gradient(circle_at_top_right,rgba(209,250,229,0.48),transparent_30%),linear-gradient(135deg,#f8fafc_0%,#eef4fb_48%,#e8f1f8_100%)]
        dark:bg-[#05070c]
      "
    >
      <div
        className="
          pointer-events-none fixed inset-0 z-0 opacity-0 dark:opacity-100
          bg-[radial-gradient(circle_at_18%_12%,rgba(59,130,246,0.18),transparent_28%),radial-gradient(circle_at_82%_14%,rgba(20,184,166,0.13),transparent_30%),linear-gradient(135deg,#030406_0%,#07101d_45%,#081827_100%)]
        "
      />

      <div className="relative z-10 max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white dark:bg-[#111c2e]/90 border border-slate-100 dark:border-white/10 rounded-3xl p-6 shadow-sm dark:shadow-[0_18px_70px_rgba(0,0,0,0.35)]">
          <div className="h-6 w-56 bg-slate-100 dark:bg-slate-800 rounded mb-3" />
          <div className="h-3 w-72 bg-slate-100 dark:bg-slate-800 rounded mb-6" />
          <div className="grid md:grid-cols-4 gap-4">
            <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
            <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
            <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
            <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
