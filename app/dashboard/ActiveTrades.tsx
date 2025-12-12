"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type VmTrade = {
  trade_id?: string;
  alert_key?: string;
  taken_at?: number;
  status?: string;
  alert?: Record<string, any>;
};

type TradesResp = {
  ok?: boolean;
  trades: VmTrade[];
  error?: string;
};

const SAMPLE_ROWS = [
  { symbol: "PLTR", side: "Call", size: "5 contracts", entry: "$24.50", current: "$25.60", pnl: "+4.5%" },
  { symbol: "LCID", side: "Call", size: "10 contracts", entry: "$3.20", current: "$3.33", pnl: "+4.1%" },
  { symbol: "NIO", side: "Call", size: "8 contracts", entry: "$6.80", current: "$7.05", pnl: "+3.7%" },
];

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as any)?.error || (data as any)?.detail || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

const ActiveTrades: React.FC = () => {
  const searchParams = useSearchParams();
  const isDemo = useMemo(() => searchParams.get("demo") === "1", [searchParams]);

  const [trades, setTrades] = useState<VmTrade[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(!isDemo);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const loadTrades = async () => {
    const res = await fetch("/api/active-trades", { cache: "no-store" });
    const data = (await res.json()) as TradesResp;

    if (!res.ok || data.ok === false) {
      setErr(data.error || "Failed to load active trades");
      setTrades([]);
    } else {
      setErr(null);
      setTrades(Array.isArray(data.trades) ? data.trades : []);
    }
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
    if (isDemo) {
      return SAMPLE_ROWS.map((r, i) => ({
        id: `demo-${i}`,
        ...r,
        note: "Demo row",
        trade_id: undefined,
        alert_key: undefined,
      }));
    }

    return (trades || []).map((t) => {
      const a = t.alert || {};
      const symbol = String(a.symbol || a.ticker || "").toUpperCase() || "—";
      const sideRaw = String(a.direction || a.side || "").toUpperCase();
      const prettySide =
        sideRaw === "CALL" ? "Call" : sideRaw === "PUT" ? "Put" : sideRaw ? sideRaw : "—";

      return {
        id: t.trade_id || t.alert_key || symbol,
        trade_id: t.trade_id,
        alert_key: t.alert_key,
        symbol,
        side: prettySide,
        size: "—",
        entry: a.entry_price ? `$${Number(a.entry_price).toFixed(2)}` : "—",
        current: "—",
        pnl: "—",
        note: t.taken_at ? `Taken ${new Date(t.taken_at * 1000).toLocaleString()}` : "Active",
      };
    });
  }, [isDemo, trades]);

  const onClose = async (row: any) => {
    const key = row.id;
    try {
      setBusyKey(key);
      // best effort: send both ids, VM can choose
      await postJson("/api/close-trade", {
        trade_id: row.trade_id,
        alert_key: row.alert_key,
        symbol: row.symbol,
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
          {isDemo
            ? "Based only on trades you marked as taken. Sample data."
            : loading
            ? "Loading active trades..."
            : err
            ? `Active trades error: ${err}`
            : `Live active trades loaded (${rows.length}).`}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[11px] text-slate-500 border-b border-slate-100">
            <tr>
              <th className="py-2 text-left">Symbol</th>
              <th className="py-2 text-left">Side</th>
              <th className="py-2 text-left">Size</th>
              <th className="py-2 text-left">Entry</th>
              <th className="py-2 text-left">Current</th>
              <th className="py-2 text-left">P&amp;L</th>
              <th className="py-2 text-left">Note</th>
              <th className="py-2 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="border-b border-slate-50">
                <td className="py-2 font-semibold text-slate-900">{r.symbol}</td>
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
                <td className="py-2 text-slate-700">{r.size}</td>
                <td className="py-2 text-slate-700">{r.entry}</td>
                <td className="py-2 text-slate-700">{r.current}</td>
                <td className="py-2 text-emerald-600 font-semibold">{r.pnl}</td>
                <td className="py-2 text-slate-500 text-[10px]">{r.note}</td>
                <td className="py-2">
                  <button
                    className="px-3 py-1.5 rounded-md border text-xs hover:bg-black/5 disabled:opacity-50"
                    disabled={isDemo || busyKey === r.id}
                    onClick={() => onClose(r)}
                    title="Close/remove from Active Trades"
                  >
                    {busyKey === r.id ? "Closing..." : "Close"}
                  </button>
                </td>
              </tr>
            ))}

            {!rows.length && (
              <tr>
                <td className="py-4 text-xs text-slate-500" colSpan={8}>
                  No active trades yet. (Use “Take” on an alert to create one.)
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid md:grid-cols-3 gap-4 text-sm">
        <Summary label="Active trades" value={String(rows.length)} />
        <Summary label="Closed trades" value="—" />
        <Summary label="P&amp;L" value="—" />
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
