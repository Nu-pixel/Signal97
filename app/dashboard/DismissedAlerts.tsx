"use client";

import React, { useEffect, useState } from "react";

type DismissedItem = {
  key?: string;
  alert_key?: string;
  reason?: string;
  dismissed_at?: number;
  dismissed_at_iso?: string;
  alert?: Record<string, any>;
};

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || data?.detail || `HTTP ${res.status}`);
  }

  return data;
}

function symbolOf(item: DismissedItem) {
  const a = item.alert || {};
  return String(a.symbol || a.ticker || "—").toUpperCase();
}

function dateOf(epoch?: number) {
  return epoch ? new Date(epoch * 1000).toLocaleString() : "—";
}

function dismissedReason(reason?: string) {
  return reason === "expired_20_days"
    ? "Older than 20 days"
    : "Dismissed manually";
}

export default function DismissedAlerts() {
  const [items, setItems] = useState<DismissedItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/dismissed-alerts", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.ok === false) {
      setErr(data.error || "Failed to load dismissed alerts");
      setItems([]);
      return;
    }

    setErr(null);
    setItems(Array.isArray(data.alerts) ? data.alerts : []);
  }

  useEffect(() => {
    load();
    const id = window.setInterval(load, 15000);
    return () => window.clearInterval(id);
  }, []);

  async function restore(item: DismissedItem) {
    const key = item.alert_key || item.key || "";

    try {
      setBusy(key);

      await postJson("/api/restore-alert", {
        alert_key: key,
        alert: item.alert,
      });

      await load();
    } catch (e: any) {
      setErr(e?.message || "Failed to restore alert");
    } finally {
      setBusy(null);
    }
  }

  async function remove(item: DismissedItem) {
    const key = item.alert_key || item.key || "";

    try {
      setBusy(key);

      await postJson("/api/remove-dismissed-alert", {
        alert_key: key,
        alert: item.alert,
      });

      await load();
    } catch (e: any) {
      setErr(e?.message || "Failed to remove alert");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section
      className="
        relative overflow-hidden rounded-[32px] p-6 md:p-7 space-y-6 transition-colors
        border border-slate-200 bg-white text-slate-900 shadow-[0_18px_55px_rgba(15,23,42,0.10)]
        dark:border-white/15 dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_34%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_30%),linear-gradient(135deg,#101827_0%,#162335_55%,#0b111c_100%)] dark:text-white dark:shadow-[0_22px_70px_rgba(0,0,0,0.32)]
      "
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 dark:opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] [background-size:38px_38px]" />

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-rose-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-100">
            Dismissed inbox
          </div>

          <h1 className="mt-4 text-3xl md:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
            Dismissed Alerts
          </h1>

          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Alerts you dismissed, plus alerts automatically moved here after 20 days.
          </p>

          {err && (
            <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 dark:border-rose-300/20 dark:bg-rose-500/10 dark:text-rose-100">
              {err}
            </p>
          )}
        </div>

        {/* Separator */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            Removed from action inbox
          </span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
        </div>

        {/* Empty state */}
        {!items.length && (
          <div
            className="
              rounded-3xl border border-dashed px-6 py-10 text-center transition-colors
              border-slate-200 bg-gradient-to-br from-slate-50 to-white
              dark:border-white/15 dark:bg-[linear-gradient(135deg,#0b1423_0%,#111c2e_55%,#08111f_100%)]
            "
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-white/[0.06] dark:text-slate-200">
              ✕
            </div>

            <h2 className="text-lg font-bold text-slate-950 dark:text-white">
              No dismissed alerts yet
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-400">
              Alerts you dismiss from the Signal97 Alerts page will appear here.
              You can restore them back to the alert inbox or remove them from the
              dismissed list.
            </p>

            <div className="mt-5 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-200">
              Dismissed alerts stay separate from active trades.
            </div>
          </div>
        )}

        {/* Dismissed list */}
        {!!items.length && (
          <div className="space-y-4">
            {items.map((item) => {
              const key = item.alert_key || item.key || symbolOf(item);
              const a = item.alert || {};
              const direction = String(
                a.direction_rule_direction || a.direction || "—"
              ).toUpperCase();

              return (
                <div
                  key={key}
                  className="
                    rounded-3xl border p-5 transition-colors
                    border-slate-200 bg-slate-50 shadow-sm
                    dark:border-white/15 dark:bg-[#0b1423]/80 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]
                  "
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-xl font-black text-slate-950 dark:text-white">
                          {symbolOf(item)}
                        </div>

                        <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-700 dark:border-rose-200/25 dark:bg-rose-300/10 dark:text-rose-200">
                          Dismissed
                        </span>

                        <span
                          className={
                            "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase " +
                            (direction.includes("UP") || direction.includes("CALL")
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-200/25 dark:bg-emerald-300/10 dark:text-emerald-200"
                              : direction.includes("DOWN") || direction.includes("PUT")
                              ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-200/25 dark:bg-orange-300/10 dark:text-orange-200"
                              : "border-slate-200 bg-white text-slate-600 dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-300")
                          }
                        >
                          {direction}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
                        <InfoBlock
                          label="Reason"
                          value={dismissedReason(item.reason)}
                        />
                        <InfoBlock
                          label="Dismissed"
                          value={dateOf(item.dismissed_at)}
                        />
                        <InfoBlock
                          label="Forecast time"
                          value={a.forecast_time_12h_ct || a.forecast_time || "—"}
                        />
                        <InfoBlock
                          label="Direction"
                          value={a.direction_rule_direction || a.direction || "—"}
                        />
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                      <button
                        onClick={() => restore(item)}
                        disabled={busy === key}
                        className="
                          rounded-2xl border px-4 py-2 text-xs font-bold transition-all
                          border-slate-300 bg-white text-slate-800 hover:-translate-y-[1px] hover:bg-slate-50 disabled:opacity-50
                          dark:border-white/20 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/10
                        "
                      >
                        {busy === key ? "Working..." : "Back to Signal97 Alerts"}
                      </button>

                      <button
                        onClick={() => remove(item)}
                        disabled={busy === key}
                        className="
                          rounded-2xl border px-4 py-2 text-xs font-bold transition-all
                          border-rose-200 bg-rose-50 text-rose-700 hover:-translate-y-[1px] hover:bg-rose-100 disabled:opacity-50
                          dark:border-rose-300/25 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20
                        "
                      >
                        {busy === key ? "Working..." : "Remove from Dismissed"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function InfoBlock({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </div>
      <div className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">
        {value}
      </div>
    </div>
  );
}
