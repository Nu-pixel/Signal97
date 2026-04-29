"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type VmTrade = {
  trade_id?: string;
  alert_key?: string;
  taken_at?: number;
  status?: string;
  symbol?: string;
  side?: string;
  entry_price?: string | number;
  exit_price?: string | number;
  quantity?: string | number;
  contracts?: string | number;
  instrument_type?: string;
  notes?: string;
  pnl?: number | null;
  pnl_pct?: number | null;
  alert?: Record<string, any>;
};

type TradesResp = { ok?: boolean; trades: VmTrade[]; error?: string };

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data?.ok === false) {
    const msg = data?.error || data?.detail || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

function money(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : "—";
}

function prettySide(t: VmTrade) {
  const a = t.alert || {};
  const raw = String(t.side || a.direction_rule_direction || a.direction || a.side || "").toUpperCase();

  if (raw.includes("UP") || raw.includes("CALL") || raw.includes("SUNRISE")) return "Call";
  if (raw.includes("DOWN") || raw.includes("PUT") || raw.includes("SNOWFALL")) return "Put";

  return raw || "—";
}

function symbolOf(t: VmTrade) {
  const a = t.alert || {};
  return String(t.symbol || a.symbol || a.ticker || "—").toUpperCase();
}

const ActiveTrades: React.FC = () => {
  const searchParams = useSearchParams();
  const isDemo = useMemo(() => searchParams.get("demo") === "1", [searchParams]);

  const [trades, setTrades] = useState<VmTrade[]>([]);
  const [drafts, setDrafts] = useState<Record<string, VmTrade>>({});
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(!isDemo);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const loadTrades = async () => {
    const res = await fetch("/api/active-trades", { cache: "no-store" });
    const data = (await res.json()) as TradesResp;

    if (!res.ok || data.ok === false) {
      setErr(data.error || "Failed to load active trades");
      setTrades([]);
      return;
    }

    const next = Array.isArray(data.trades) ? data.trades : [];
    setErr(null);
    setTrades(next);

    setDrafts((old) => {
      const copy = { ...old };

      for (const t of next) {
        const id = t.trade_id || t.alert_key || symbolOf(t);
        copy[id] = { ...t, ...(copy[id] || {}) };
      }

      return copy;
    });
  };

  useEffect(() => {
    if (isDemo) return;

    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        await loadTrades();
      } catch (e: any) {
        if (!cancelled) {
          setErr(e?.message ?? "Failed to load active trades");
          setTrades([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    const id = window.setInterval(run, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [isDemo]);

  const rows = useMemo(() => {
    return (trades || []).map((t) => {
      const id = t.trade_id || t.alert_key || symbolOf(t);
      const d = drafts[id] || t;

      return {
        id,
        trade_id: t.trade_id,
        alert_key: t.alert_key,
        symbol: symbolOf(t),
        side: prettySide(t),
        draft: d,
        note: t.taken_at ? `Taken ${new Date(t.taken_at * 1000).toLocaleString()}` : "Active",
      };
    });
  }, [trades, drafts]);

  const updateDraft = (id: string, field: keyof VmTrade, value: any) => {
    setDrafts((old) => ({
      ...old,
      [id]: {
        ...(old[id] || {}),
        [field]: value,
      },
    }));
  };

  const onSave = async (row: any) => {
    const id = row.id;

    try {
      setBusyKey(id);

      await postJson("/api/update-trade", {
        trade_id: row.trade_id,
        alert_key: row.alert_key,
        ...drafts[id],
      });

      await loadTrades();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save trade");
    } finally {
      setBusyKey(null);
    }
  };

  const onBackToAlerts = async (row: any) => {
    const id = row.id;

    try {
      setBusyKey(id);

      await postJson("/api/restore-trade", {
        trade_id: row.trade_id,
        alert_key: row.alert_key,
      });

      await loadTrades();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to restore trade to alerts");
    } finally {
      setBusyKey(null);
    }
  };

  const onClose = async (row: any) => {
    const id = row.id;

    try {
      setBusyKey(id);

      await postJson("/api/close-trade", {
        trade_id: row.trade_id,
        alert_key: row.alert_key,
        ...drafts[id],
      });

      await loadTrades();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to close trade");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Active Trades</h1>
        <p className="text-xs text-slate-500">
          {loading
            ? "Loading active trades..."
            : err
            ? `Active trades error: ${err}`
            : `Live active trades loaded (${rows.length}).`}
        </p>
        <p className="text-[11px] text-slate-500 mt-1">
          Enter your real fill price, shares/contracts, notes, and exit price before closing.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1100px]">
          <thead className="text-[11px] text-slate-500 border-b border-slate-100">
            <tr>
              <th className="py-2 text-left">Symbol</th>
              <th className="py-2 text-left">Side</th>
              <th className="py-2 text-left">Type</th>
              <th className="py-2 text-left">Entry price</th>
              <th className="py-2 text-left">Shares / units</th>
              <th className="py-2 text-left">Contracts</th>
              <th className="py-2 text-left">Exit price</th>
              <th className="py-2 text-left">Est. P&amp;L</th>
              <th className="py-2 text-left">Notes</th>
              <th className="py-2 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r: any) => {
              const d = r.draft || {};

              return (
                <tr key={r.id} className="border-b border-slate-50 align-top">
                  <td className="py-2 font-semibold text-slate-900">
                    {r.symbol}
                    <div className="text-[9px] text-slate-400 font-normal">{r.note}</div>
                  </td>

                  <td className="py-2">
                    <span
                      className={
                        "px-2 py-0.5 rounded-full text-[9px] " +
                        (r.side === "Call"
                          ? "bg-emerald-50 text-emerald-700"
                          : r.side === "Put"
                          ? "bg-orange-50 text-orange-700"
                          : "bg-slate-100 text-slate-700")
                      }
                    >
                      {r.side}
                    </span>
                  </td>

                  <td className="py-2">
                    <select
                      value={String(d.instrument_type || "stock")}
                      onChange={(e) => updateDraft(r.id, "instrument_type", e.target.value)}
                      className="w-24 rounded-md border px-2 py-1 text-xs"
                    >
                      <option value="stock">Stock</option>
                      <option value="option">Option</option>
                    </select>
                  </td>

                  <td className="py-2">
                    <input
                      value={String(d.entry_price ?? "")}
                      onChange={(e) => updateDraft(r.id, "entry_price", e.target.value)}
                      placeholder="ex: 1.25"
                      className="w-24 rounded-md border px-2 py-1 text-xs"
                    />
                  </td>

                  <td className="py-2">
                    <input
                      value={String(d.quantity ?? "")}
                      onChange={(e) => updateDraft(r.id, "quantity", e.target.value)}
                      placeholder="shares"
                      className="w-24 rounded-md border px-2 py-1 text-xs"
                    />
                  </td>

                  <td className="py-2">
                    <input
                      value={String(d.contracts ?? "")}
                      onChange={(e) => updateDraft(r.id, "contracts", e.target.value)}
                      placeholder="contracts"
                      className="w-24 rounded-md border px-2 py-1 text-xs"
                    />
                  </td>

                  <td className="py-2">
                    <input
                      value={String(d.exit_price ?? "")}
                      onChange={(e) => updateDraft(r.id, "exit_price", e.target.value)}
                      placeholder="when sold"
                      className="w-24 rounded-md border px-2 py-1 text-xs"
                    />
                  </td>

                  <td className="py-2 text-emerald-600 font-semibold">
                    {d.pnl != null ? `${money(d.pnl)} (${d.pnl_pct ?? "—"}%)` : "—"}
                  </td>

                  <td className="py-2">
                    <input
                      value={String(d.notes ?? "")}
                      onChange={(e) => updateDraft(r.id, "notes", e.target.value)}
                      placeholder="notes"
                      className="w-44 rounded-md border px-2 py-1 text-xs"
                    />
                  </td>

                  <td className="py-2">
                    <div className="flex flex-col gap-1">
                      <button
                        className="px-3 py-1.5 rounded-md border text-xs hover:bg-black/5 disabled:opacity-50"
                        disabled={busyKey === r.id}
                        onClick={() => onSave(r)}
                      >
                        {busyKey === r.id ? "Saving..." : "Save"}
                      </button>

                      <button
                        className="px-3 py-1.5 rounded-md border text-xs hover:bg-black/5 disabled:opacity-50"
                        disabled={busyKey === r.id}
                        onClick={() => onBackToAlerts(r)}
                      >
                        Back to alerts
                      </button>

                      <button
                        className="px-3 py-1.5 rounded-md border text-xs hover:bg-black/5 disabled:opacity-50"
                        disabled={busyKey === r.id}
                        onClick={() => onClose(r)}
                      >
                        {busyKey === r.id ? "Working..." : "Close"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {!rows.length && (
              <tr>
                <td className="py-4 text-xs text-slate-500" colSpan={10}>
                  No active trades yet. Use “Take” on an alert to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid md:grid-cols-3 gap-4 text-sm">
        <Summary label="Active trades" value={String(rows.length)} />
        <Summary label="Closed trades" value="See Taken / Closed Alerts" />
        <Summary label="P&L" value="Calculated after close" />
      </div>
    </div>
  );
};

export default ActiveTrades;

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-2xl p-4">
      <div className="text-[10px] text-slate-500 mb-1">{label}</div>
      <div className="text-lg font-semibold text-emerald-600">{value}</div>
    </div>
  );
}
