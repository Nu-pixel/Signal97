"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type WatchlistResp = {
  ok?: boolean;
  items: string[];
  source?: string | null;
  error?: string;
};

const SAMPLE_ROWS = [
  { symbol: "PLTR", bias: "Call", trigger: "Triggered", time: "6h", expires: "1d 18h" },
  { symbol: "TSLA", bias: "Put", trigger: "2.3%", time: "12h", expires: "1d 12h" },
  { symbol: "RIVN", bias: "Call", trigger: "1.8%", time: "8h", expires: "1d 16h" },
  { symbol: "LCID", bias: "Call", trigger: "Triggered", time: "14h", expires: "10h" },
];

const LiveWatchlist: React.FC = () => {
  const searchParams = useSearchParams();
  const isDemo = useMemo(() => searchParams.get("demo") === "1", [searchParams]);

  const [items, setItems] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(!isDemo);

  useEffect(() => {
    if (isDemo) return;

    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/watchlist-live", { cache: "no-store" });
        const data = (await res.json()) as WatchlistResp;

        if (cancelled) return;

        if (!res.ok || data.ok === false) {
          setErr(data.error || "Failed to load live watchlist");
          setItems([]);
        } else {
          setErr(null);
          setItems(Array.isArray(data.items) ? data.items : []);
        }
      } catch (e: any) {
        if (!cancelled) {
          setErr(e?.message ?? "Failed to load live watchlist");
          setItems([]);
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
    if (isDemo) return SAMPLE_ROWS;

    // VM currently only returns symbol list; keep your table layout but fill what we can.
    return (items || []).slice(0, 200).map((symbol) => ({
      symbol,
      bias: "—",
      trigger: "Watching",
      time: "—",
      expires: "—",
    }));
  }, [isDemo, items]);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">
        Live Watchlist
      </h1>

      <p className="text-xs text-slate-500 mb-4">
        {isDemo
          ? "Names auto-expire after 2 days if they don't qualify. Sample data only."
          : loading
          ? "Loading live watchlist..."
          : err
          ? `Live watchlist error: ${err}`
          : `Live watchlist loaded (${rows.length} symbols).`}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[11px] text-slate-500 border-b border-slate-100">
            <tr>
              <th className="py-2 text-left">Symbol</th>
              <th className="py-2 text-left">Bias</th>
              <th className="py-2 text-left">% to trigger</th>
              <th className="py-2 text-left">Time in watch</th>
              <th className="py-2 text-left">Expires</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => (
              <tr key={r.symbol} className="border-b border-slate-50">
                <td className="py-2 font-semibold text-slate-900">{r.symbol}</td>

                <td className="py-2">
                  <span className="px-2 py-0.5 rounded-full text-[9px] bg-slate-100 text-slate-700">
                    {r.bias}
                  </span>
                </td>

                <td className="py-2 text-slate-700">
                  {r.trigger === "Triggered" ? (
                    <span className="px-2 py-0.5 text-[9px] rounded-full bg-sky-600 text-white">
                      Triggered
                    </span>
                  ) : (
                    r.trigger
                  )}
                </td>

                <td className="py-2 text-slate-700">{r.time}</td>
                <td className="py-2 text-slate-700">{r.expires}</td>
              </tr>
            ))}

            {!rows.length && (
              <tr>
                <td className="py-4 text-xs text-slate-500" colSpan={5}>
                  No rows to show.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LiveWatchlist;
