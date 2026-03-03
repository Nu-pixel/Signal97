"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type WatchItem =
  | string
  | {
      symbol: string;
      industry?: string | null;
      sector?: string | null;
    };

type WatchlistResp = {
  ok?: boolean;
  items: WatchItem[];
  source?: string | null;
  error?: string;
};

// OPTIONAL: If you later create a symbol->industry map file, paste/import it here.
// Example:
// const SYMBOL_INDUSTRY_MAP: Record<string, string> = { AAPL: "Technology", JPM: "Financials" };
const SYMBOL_INDUSTRY_MAP: Record<string, string> = {};

// Demo data (still supported)
const SAMPLE_ITEMS: WatchItem[] = [
  { symbol: "AAPL", industry: "Technology" },
  { symbol: "MSFT", industry: "Technology" },
  { symbol: "NVDA", industry: "Technology" },
  { symbol: "JPM", industry: "Financials" },
  { symbol: "BAC", industry: "Financials" },
  { symbol: "XOM", industry: "Energy" },
  { symbol: "CVX", industry: "Energy" },
  { symbol: "LLY", industry: "Healthcare" },
  { symbol: "UNH", industry: "Healthcare" },
  { symbol: "WMT", industry: "Consumer" },
];

function normalizeItem(x: WatchItem): { symbol: string; industry: string } {
  // If your API returns strings only, we try mapping via SYMBOL_INDUSTRY_MAP
  if (typeof x === "string") {
    const symbol = x.trim().toUpperCase();
    const mappedIndustry = SYMBOL_INDUSTRY_MAP[symbol];
    return { symbol, industry: mappedIndustry ?? "Unknown" };
  }

  const symbol = String(x.symbol ?? "").trim().toUpperCase();
  const industryRaw =
    (x.industry ?? x.sector ?? SYMBOL_INDUSTRY_MAP[symbol] ?? "Unknown") ??
    "Unknown";
  const industry = industryRaw.toString().trim() || "Unknown";

  return { symbol, industry };
}

// Deterministic “soft color” per group key (industry or letter group)
function hashToHue(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 360;
}

function groupTheme(groupKey: string) {
  const hue = hashToHue(groupKey.toLowerCase());
  return {
    bg: `hsla(${hue}, 70%, 96%, 1)`,
    border: `hsla(${hue}, 55%, 80%, 1)`,
    chipBg: `hsla(${hue}, 60%, 98%, 1)`,
    chipBorder: `hsla(${hue}, 45%, 78%, 1)`,
    chipText: `hsla(${hue}, 30%, 22%, 1)`,
  };
}

function fallbackGroupKey(symbol: string) {
  const c = (symbol?.[0] ?? "").toUpperCase();
  if (c >= "A" && c <= "Z") return c; // A, B, C...
  return "#";
}

const LiveWatchlist: React.FC = () => {
  const searchParams = useSearchParams();
  const isDemo = useMemo(() => searchParams.get("demo") === "1", [searchParams]);

  const [rawItems, setRawItems] = useState<WatchItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(!isDemo);

  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [collapseAll, setCollapseAll] = useState(false);

  useEffect(() => {
    if (isDemo) {
      setRawItems(SAMPLE_ITEMS);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/watchlist-live", { cache: "no-store" });
        const data = (await res.json()) as WatchlistResp;

        if (cancelled) return;

        if (!res.ok || data.ok === false) {
          setErr(data.error || "Failed to load live watchlist");
          setRawItems([]);
        } else {
          setErr(null);
          setRawItems(Array.isArray(data.items) ? data.items : []);
        }
      } catch (e: any) {
        if (!cancelled) {
          setErr(e?.message ?? "Failed to load live watchlist");
          setRawItems([]);
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

  const normalized = useMemo(() => {
    const items = (isDemo ? SAMPLE_ITEMS : rawItems).map(normalizeItem);

    // remove blanks + dedupe
    const seen = new Set<string>();
    const out: { symbol: string; industry: string }[] = [];

    for (const it of items) {
      if (!it.symbol) continue;
      if (seen.has(it.symbol)) continue;
      seen.add(it.symbol);
      out.push(it);
    }
    return out;
  }, [isDemo, rawItems]);

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return normalized;
    return normalized.filter(
      (x) => x.symbol.includes(q) || x.industry.toUpperCase().includes(q)
    );
  }, [normalized, query]);

  // Grouping logic:
  // - If industry is known -> group by industry
  // - Else -> group by first letter (A/B/C…)
  const grouped = useMemo(() => {
    const m = new Map<string, string[]>();

    for (const it of filtered) {
      const key =
        it.industry && it.industry !== "Unknown"
          ? it.industry
          : fallbackGroupKey(it.symbol);

      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(it.symbol);
    }

    const groups = Array.from(m.entries())
      .map(([groupKey, symbols]) => ({
        groupKey,
        symbols: symbols.sort((a, b) => a.localeCompare(b)),
      }))
      .sort(
        (a, b) =>
          b.symbols.length - a.symbols.length || a.groupKey.localeCompare(b.groupKey)
      );

    return groups;
  }, [filtered]);

  // Apply collapse all WITHOUT breaking local toggles while typing/searching
  useEffect(() => {
    if (!grouped.length) return;
    setCollapsed((prev) => {
      const next: Record<string, boolean> = { ...prev };
      for (const g of grouped) next[g.groupKey] = collapseAll;
      return next;
    });
  }, [collapseAll, grouped]);

  const totalSymbols = normalized.length;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-1">
            Live Watchlist
          </h1>
          <p className="text-xs text-slate-500">
            {isDemo
              ? "Demo mode. This shows the intended grouped chip layout."
              : loading
              ? "Loading live watchlist..."
              : err
              ? `Live watchlist error: ${err}`
              : `Live watchlist loaded (${totalSymbols} symbols).`}
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-2 w-full sm:w-[380px]">
          <div className="flex gap-2 w-full">
            <div className="flex-1">
              <label className="sr-only">Search</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search symbol or industry…"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <button
              onClick={() => setCollapseAll((v) => !v)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              title={collapseAll ? "Expand all" : "Collapse all"}
            >
              {collapseAll ? "Expand" : "Collapse"}
            </button>
          </div>

          <div className="text-[11px] text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">{filtered.length}</span>{" "}
            / <span className="font-semibold text-slate-700">{totalSymbols}</span>{" "}
            symbols
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {!grouped.length && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-600">
            No symbols to show.
          </div>
        )}

        {grouped.map((g) => {
          const theme = groupTheme(g.groupKey);
          const isCollapsed = collapsed[g.groupKey] ?? false;

          const headerLabel =
            g.groupKey.length === 1 && g.groupKey >= "A" && g.groupKey <= "Z"
              ? `Group ${g.groupKey}`
              : g.groupKey;

          return (
            <section
              key={g.groupKey}
              className="rounded-2xl border p-4"
              style={{
                backgroundColor: theme.bg,
                borderColor: theme.border,
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold text-slate-900">
                    {headerLabel}
                  </h2>
                  <span
                    className="text-[11px] px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.6)",
                      borderColor: theme.border,
                      color: "rgba(15,23,42,0.75)",
                    }}
                  >
                    {g.symbols.length}
                  </span>
                </div>

                <button
                  onClick={() =>
                    setCollapsed((prev) => ({
                      ...prev,
                      [g.groupKey]: !isCollapsed,
                    }))
                  }
                  className="text-xs px-3 py-1.5 rounded-xl border bg-white/60 hover:bg-white"
                  style={{ borderColor: theme.border }}
                >
                  {isCollapsed ? "Show" : "Hide"}
                </button>
              </div>

              {!isCollapsed && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                  {g.symbols.map((sym) => (
                    <div
                      key={`${g.groupKey}:${sym}`}
                      className="select-none rounded-xl border px-3 py-2 text-sm font-semibold tracking-wide text-center cursor-default hover:shadow-sm"
                      style={{
                        backgroundColor: theme.chipBg,
                        borderColor: theme.chipBorder,
                        color: theme.chipText,
                      }}
                      title={`${sym} • ${headerLabel}`}
                    >
                      {sym}
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default LiveWatchlist;
