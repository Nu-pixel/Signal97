"use client";

import React, { useEffect, useState } from "react";

type Trade = {
  trade_id?: string;
  alert_key?: string;
  symbol?: string;
  side?: string;
  status?: string;
  entry_price?: string | number;
  exit_price?: string | number;
  quantity?: string | number;
  contracts?: string | number;
  instrument_type?: string;
  notes?: string;
  pnl?: number | null;
  pnl_pct?: number | null;
  taken_at?: number;
  closed_at?: number;
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

function money(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : "—";
}

function symbolOf(t: Trade) {
  const a = t.alert || {};
  return String(t.symbol || a.symbol || a.ticker || "—").toUpperCase();
}

function dateOf(epoch?: number) {
  return epoch ? new Date(epoch * 1000).toLocaleString() : "—";
}

export default function TakenClosedAlerts() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/closed-trades", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.ok === false) {
      setErr(data.error || "Failed to load closed trades");
      setTrades([]);
      return;
    }

    setErr(null);
    setTrades(Array.isArray(data.trades) ? data.trades : []);
  }

  useEffect(() => {
    load();
    const id = window.setInterval(load, 15000);
    return () => window.clearInterval(id);
  }, []);

  async function restore(t: Trade) {
    const id = t.trade_id || t.alert_key || "";

    try {
      setBusy(id);

      await postJson("/api/restore-trade", {
        trade_id: t.trade_id,
        alert_key: t.alert_key,
      });

      await load();
    } catch (e: any) {
      setErr(e?.message || "Failed to restore closed trade");
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
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-100">
            Trade journal
          </div>

          <h1 className="mt-4 text-3xl md:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
            Taken / Closed Alerts
          </h1>

          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Closed trades stay here as your trading journal and feed the P&amp;L page.
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
          </span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
        </div>

        {/* Empty state */}
        {!trades.length && (
          <div
            className="
              rounded-3xl border border-dashed px-6 py-10 text-center transition-colors
              border-slate-200 bg-gradient-to-br from-slate-50 to-white
              dark:border-white/15 dark:bg-[linear-gradient(135deg,#0b1423_0%,#111c2e_55%,#08111f_100%)]
            "
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-200">
              ✓
            </div>

            <h2 className="text-lg font-bold text-slate-950 dark:text-white">
              No closed trades yet
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-400">
              Closed trades will appear here after you take an alert, enter your trade
              details, and close it from the Active Trades page. This becomes your
              trading journal and feeds the P&amp;L page.
            </p>

            <div className="mt-5 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-200">
              Close an active trade to build your journal.
            </div>
          </div>
        )}

        {/* Closed trades list */}
        {!!trades.length && (
          <div className="space-y-4">
            {trades.map((t) => {
              const id = t.trade_id || t.alert_key || symbolOf(t);

              return (
                <div
                  key={id}
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
                          {symbolOf(t)}
                        </div>

                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-300">
                          {t.status || "closed"}
                        </span>

                        <span
                          className={
                            "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase " +
                            (String(t.side || "").toLowerCase().includes("call")
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-200/25 dark:bg-emerald-300/10 dark:text-emerald-200"
                              : String(t.side || "").toLowerCase().includes("put")
                              ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-200/25 dark:bg-orange-300/10 dark:text-orange-200"
                              : "border-slate-200 bg-white text-slate-600 dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-300")
                          }
                        >
                          {t.side || "—"}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
                        <InfoBlock label="Taken" value={dateOf(t.taken_at)} />
                        <InfoBlock label="Closed" value={dateOf(t.closed_at)} />
                        <InfoBlock label="Entry" value={money(t.entry_price)} />
                        <InfoBlock label="Exit" value={money(t.exit_price)} />
                        <InfoBlock label="Type" value={t.instrument_type || "stock"} />
                        <InfoBlock label="Shares / units" value={t.quantity || "—"} />
                        <InfoBlock label="Contracts" value={t.contracts || "—"} />
                      </div>

                      <div className="mt-4 text-sm font-black text-emerald-700 dark:text-emerald-300">
                        P&amp;L:{" "}
                        {t.pnl != null
                          ? `${money(t.pnl)} (${t.pnl_pct ?? "—"}%)`
                          : "—"}
                      </div>

                      {t.notes && (
                        <div className="mt-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            Notes:
                          </span>{" "}
                          {t.notes}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => restore(t)}
                      disabled={busy === id}
                      className="
                        shrink-0 rounded-2xl border px-4 py-2 text-xs font-bold transition-all
                        border-slate-300 bg-white text-slate-800 hover:-translate-y-[1px] hover:bg-slate-50 disabled:opacity-50
                        dark:border-white/20 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/10
                      "
                    >
                      {busy === id ? "Working..." : "Back to Signal97 Alerts"}
                    </button>
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
