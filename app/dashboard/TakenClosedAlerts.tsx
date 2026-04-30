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
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Taken / Closed Alerts</h1>
        <p className="text-xs text-slate-500 mt-1">
          Closed trades stay here as your trading journal and feed the P&amp;L page.
        </p>
        {err && <p className="text-xs text-rose-600 mt-2">{err}</p>}
      </div>

      {!trades.length && (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white px-6 py-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-700">
            ✓
          </div>
      
          <h2 className="text-lg font-bold text-slate-900">
            No closed trades yet
          </h2>
      
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
            Closed trades will appear here after you take an alert, enter your trade
            details, and close it from the Active Trades page. This becomes your
            trading journal and feeds the P&amp;L page.
          </p>
      
          <div className="mt-5 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm">
            Close an active trade to build your journal.
          </div>
        </div>
      )}

      <div className="space-y-3">
        {trades.map((t) => {
          const id = t.trade_id || t.alert_key || symbolOf(t);

          return (
            <div key={id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-slate-900">{symbolOf(t)}</div>
                  <div className="text-xs text-slate-600">
                    Status: {t.status || "closed"} · Side: {t.side || "—"}
                  </div>
                  <div className="text-xs text-slate-500">
                    Taken: {dateOf(t.taken_at)} · Closed: {dateOf(t.closed_at)}
                  </div>
                  <div className="text-xs text-slate-500">
                    Entry: {money(t.entry_price)} · Exit: {money(t.exit_price)} · Type: {t.instrument_type || "stock"}
                  </div>
                  <div className="text-xs text-slate-500">
                    Shares/units: {t.quantity || "—"} · Contracts: {t.contracts || "—"}
                  </div>
                  <div className="text-sm font-semibold mt-2 text-emerald-700">
                    P&amp;L: {t.pnl != null ? `${money(t.pnl)} (${t.pnl_pct ?? "—"}%)` : "—"}
                  </div>
                  {t.notes && <div className="text-xs text-slate-500 mt-1">Notes: {t.notes}</div>}
                </div>

                <button
                  onClick={() => restore(t)}
                  disabled={busy === id}
                  className="px-3 py-1.5 rounded-md border text-xs hover:bg-white disabled:opacity-50"
                >
                  {busy === id ? "Working..." : "Back to Signal97 Alerts"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
