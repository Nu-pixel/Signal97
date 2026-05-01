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
  const raw = String(
    t.side || a.direction_rule_direction || a.direction || a.side || ""
  ).toUpperCase();

  if (raw.includes("UP") || raw.includes("CALL") || raw.includes("SUNRISE")) {
    return "Call";
  }

  if (raw.includes("DOWN") || raw.includes("PUT") || raw.includes("SNOWFALL")) {
    return "Put";
  }

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
        note: t.taken_at
          ? `Taken ${new Date(t.taken_at * 1000).toLocaleString()}`
          : "Active",
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
    <div
      className="
        relative overflow-hidden rounded-[32px] p-6 space-y-6 transition-colors
        border border-slate-200 bg-white text-slate-900 shadow-[0_18px_55px_rgba(15,23,42,0.10)]
        dark:border-white/15
        dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_34%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_30%),linear-gradient(135deg,#101827_0%,#162335_55%,#0b111c_100%)]
        dark:text-white dark:shadow-[0_22px_70px_rgba(0,0,0,0.32)]
      "
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 dark:opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] [background-size:38px_38px]" />

      <div className="relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-100">
            Active trade ledger
          </div>

          <h1 className="mt-4 text-3xl md:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
            Active Trades
          </h1>

          <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">
            {loading
              ? "Loading active trades..."
              : err
              ? `Active trades error: ${err}`
              : `Live active trades loaded (${rows.length}).`}
          </p>

          <p className="text-[11px] text-slate-500 mt-1 dark:text-slate-400">
            Enter your real fill price, shares/contracts, notes, and exit price before closing.
          </p>
        </div>
        <div className="mt-6 mb-5 h-px w-full bg-slate-200 dark:bg-white/10" />
        <div className="mt-7 overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead className="text-[11px] text-slate-500 border-b border-slate-100 dark:text-slate-300 dark:border-white/25">
              <tr>
                <th className="py-3 text-left font-bold">Symbol</th>
                <th className="py-3 text-left font-bold">Side</th>
                <th className="py-3 text-left font-bold">Type</th>
                <th className="py-3 text-left font-bold">Entry price</th>
                <th className="py-3 text-left font-bold">Shares / units</th>
                <th className="py-3 text-left font-bold">Contracts</th>
                <th className="py-3 text-left font-bold">Exit price</th>
                <th className="py-3 text-left font-bold">Est. P&amp;L</th>
                <th className="py-3 text-left font-bold">Notes</th>
                <th className="py-3 text-left font-bold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r: any) => {
                const d = r.draft || {};

                return (
                  <tr
                    key={r.id}
                    className="border-b border-slate-100 align-top dark:border-white/20"
                  >
                    <td className="py-4 font-semibold text-slate-950 dark:text-white">
                      {r.symbol}
                      <div className="text-[9px] text-slate-400 font-normal dark:text-slate-400">
                        {r.note}
                      </div>
                    </td>

                    <td className="py-4">
                      <span
                        className={
                          "px-2 py-0.5 rounded-full text-[9px] font-semibold " +
                          (r.side === "Call"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-300/12 dark:text-emerald-100 dark:border-emerald-200/25"
                            : r.side === "Put"
                            ? "bg-orange-50 text-orange-700 border border-orange-100 dark:bg-orange-300/12 dark:text-orange-100 dark:border-orange-200/25"
                            : "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-white/10 dark:text-slate-200 dark:border-white/10")
                        }
                      >
                        {r.side}
                      </span>
                    </td>

                    <td className="py-4">
                      <select
                        value={String(d.instrument_type || "stock")}
                        onChange={(e) =>
                          updateDraft(r.id, "instrument_type", e.target.value)
                        }
                        className={inputClass}
                      >
                        <option value="stock">Stock</option>
                        <option value="option">Option</option>
                      </select>
                    </td>

                    <td className="py-4">
                      <input
                        value={String(d.entry_price ?? "")}
                        onChange={(e) =>
                          updateDraft(r.id, "entry_price", e.target.value)
                        }
                        placeholder="ex: 1.25"
                        className={inputClass}
                      />
                    </td>

                    <td className="py-4">
                      <input
                        value={String(d.quantity ?? "")}
                        onChange={(e) =>
                          updateDraft(r.id, "quantity", e.target.value)
                        }
                        placeholder="shares"
                        className={inputClass}
                      />
                    </td>

                    <td className="py-4">
                      <input
                        value={String(d.contracts ?? "")}
                        onChange={(e) =>
                          updateDraft(r.id, "contracts", e.target.value)
                        }
                        placeholder="contracts"
                        className={inputClass}
                      />
                    </td>

                    <td className="py-4">
                      <input
                        value={String(d.exit_price ?? "")}
                        onChange={(e) =>
                          updateDraft(r.id, "exit_price", e.target.value)
                        }
                        placeholder="when sold"
                        className={inputClass}
                      />
                    </td>

                    <td className="py-4 text-emerald-600 font-bold dark:text-emerald-300">
                      {d.pnl != null
                        ? `${money(d.pnl)} (${d.pnl_pct ?? "—"}%)`
                        : "—"}
                    </td>

                    <td className="py-4">
                      <input
                        value={String(d.notes ?? "")}
                        onChange={(e) => updateDraft(r.id, "notes", e.target.value)}
                        placeholder="notes"
                        className="w-44 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:ring-4 focus:ring-slate-200/70 dark:border-white/25 dark:bg-[#0b1423]/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-emerald-300/10"
                      />
                    </td>

                    <td className="py-4">
                      <div className="flex flex-col gap-2">
                        <button
                          className={primaryButtonClass}
                          disabled={busyKey === r.id}
                          onClick={() => onSave(r)}
                        >
                          {busyKey === r.id ? "Saving..." : "Save"}
                        </button>

                        <button
                          className={secondaryButtonClass}
                          disabled={busyKey === r.id}
                          onClick={() => onBackToAlerts(r)}
                        >
                          Back to alerts
                        </button>

                        <button
                          className={secondaryButtonClass}
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

              {!rows.length && !loading && (
                <tr>
                  <td className="py-6" colSpan={10}>
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white px-6 py-10 text-center dark:border-white/15 dark:bg-[linear-gradient(135deg,#0b1423_0%,#111c2e_55%,#08111f_100%)]">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-100">
                        ↗
                      </div>

                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        No active trades yet
                      </h2>

                      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-300">
                        When you click{" "}
                        <span className="font-semibold text-slate-700 dark:text-white">
                          Take
                        </span>{" "}
                        on a Signal97 alert, it appears here so you can enter your
                        real fill price, shares/contracts, notes, exit price, and
                        close the trade into your P&amp;L.
                      </p>

                      <div className="mt-5 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-200">
                        Go to Signal97 Alerts and take an alert to start tracking.
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid md:grid-cols-3 gap-4 text-sm">
          <Summary label="Active trades" value={String(rows.length)} />
          <Summary label="Closed trades" value="See Taken / Closed Alerts" />
          <Summary label="P&L" value="Calculated after close" />
        </div>
      </div>
    </div>
  );
};

export default ActiveTrades;

const inputClass =
  "w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:ring-4 focus:ring-slate-200/70 dark:border-white/25 dark:bg-[#0b1423]/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-emerald-300/10";

const primaryButtonClass =
  "px-3 py-2 rounded-xl border border-slate-900 bg-slate-950 text-xs font-semibold text-white transition hover:bg-black disabled:opacity-50 dark:border-sky-300/25 dark:bg-sky-500/90 dark:text-white dark:hover:bg-sky-400";

const secondaryButtonClass =
  "px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/20 dark:bg-white/[0.04] dark:text-slate-100 dark:hover:bg-white/[0.08]";

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 dark:border-white/10 dark:bg-[#0b1423]/85">
      <div className="text-[10px] text-slate-500 mb-1 dark:text-slate-400">
        {label}
      </div>
      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-300">
        {value}
      </div>
    </div>
  );
}
