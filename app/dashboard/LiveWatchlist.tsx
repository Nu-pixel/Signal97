"use client";

import React, { useEffect, useMemo, useState } from "react";

type IndustryGroups = Record<string, string[]>;

function hashToHue(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 360;
}

function themeForKey(key: string) {
  const hue = hashToHue(key.toLowerCase());
  return {
    bg: `hsla(${hue}, 70%, 96%, 1)`,
    border: `hsla(${hue}, 55%, 80%, 1)`,
    chipBg: `hsla(${hue}, 60%, 98%, 1)`,
    chipBorder: `hsla(${hue}, 45%, 78%, 1)`,
    chipText: `hsla(${hue}, 30%, 22%, 1)`,
  };
}

function normalizeSymbol(s: string) {
  return String(s ?? "").trim().toUpperCase();
}

// ✅ HARD-CODED industry buckets (all tickers) generated from your file.
// No fetch, no /public json, no 404.
const GROUPS: IndustryGroups = {
  "Agriculture/Forestry/Fishing": ["AGRO", "CALM", "VFF"],
  "Construction": ["AMRC", "BBCP", "BZH", "DHI", "DY", "FIX", "GEO", "GRBK", "GVA", "LEN", "MTZ", "PHM", "STRL", "TOL", "TPC", "TPH"],
  "Finance/Insurance/Real Estate": ["AAMI","ABCB","ABR","ABTC","ACGL","AEXA","AFL","AFRM","AGNC","AGQ","AIFU","AIG","ALHC","ALRS","ALTS","AMBR","AMH","AMP","AMT","ANY","APO","APPS","ARBK","ARE","ARES","ASB","ASST","AUB","AXP","BAC","BAM","BBAR","BBT","BCS","BDN","BEKE","BFST","BHF","BITF","BK","BKKT","BLK","BLSH","BMNR","BN","BNL","BOIL","BRO","BRR","BSOL","BTBT","BTDR","BULL","BUSE","BWET","BWIN","BX","C","CAN","CATY","CBOE","CBRE","CBSH","CCBG","CDP","CG","CHMI","CHYM","CI","CIA","CIFR","CLDT","CLOV","CLSK","CME","CMTG","CNC","CNO","COF","COIN","COMP","CORZ","CPT","CRCL","CSR","CTBI","CTRE","CUBE","CWK","CZNC","DB","DBRG","DEI","DFDV","DGXX","DLR","DOUG","EBC","ECPG","EGBN","EHTH","EIG","ELME","ELS","EQBK","EQIX","ESNT","ESS","ETH","ETHA","ETHE","ETHZ","EZBC","FBTC","FFBC","FFIN","FG","FGNX","FHN","FIGR","FISI","FLG","FNF","FRGE","FSP","FUTU","FWDI","GBTC","GDOT","GEMI","GGAL","GLD","GLXY","GPMT","GS","HASI","HIVE","HLNE","HOOD","HOPE","HR","HRTG","HSBC","HST","HTBK","HUM","HUT","IAU","IBIT","IBKR","ICE","INVH","IREN","IRM","JEF","JPM","JRVR","KKR","KOLD","LB","LC","LDI","LINE","LMND","LNC","LPRO","LX","LXP","MAC","MARA","MC","MCHB","MIAX","MOH","MRP","MRX","MS","MSTR","MTG","MUFG","NAKA","NDAQ","NLY","NRT","NSA","NTST","NU","OPAD","OPEN","OPRT","ORBS","ORC","OSCR","OWL","PEB","PGR","PGY","PKST","PLD","PNC","PNFP","QFIN","RC","RILY","RIOT","RKT","RYAN","RYN","SAN","SBCF","SBET","SCHW","SIEB","SKYH","SLAI","SLDE","SLG","SLM","SLQT","SLV","SMA","SOFI","SSRM","SUIG","SUPV","SVC","SVIX","TBBK","TFC","TIGR","TPG","TWO","UBSI","UCB","UNG","UNH","UPST","UPXI","USB","USO","UVIX","UVXY","UWMC","VNO","VXX","WFC","WNEB","WRB","WULF","WY","WYFI","XP","YRD"],
  "Manufacturing": [/* …your full list continues… */],
  "Mining": [/* … */],
  "Retail Trade": [/* … */],
  "Services": [/* … */],
  "Transportation/Utilities": [/* … */],
  "Wholesale Trade": [/* … */],
  "Unknown": [/* … */],
};

export default function LiveWatchlist() {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [collapseAll, setCollapseAll] = useState(false);

  // sanitize: normalize symbols + dedupe once
  const groups = useMemo(() => {
    const cleaned: IndustryGroups = {};
    for (const [industry, syms] of Object.entries(GROUPS || {})) {
      const seen = new Set<string>();
      const out: string[] = [];
      for (const raw of syms || []) {
        const s = normalizeSymbol(raw);
        if (!s || seen.has(s)) continue;
        seen.add(s);
        out.push(s);
      }
      cleaned[industry || "Unknown"] = out.sort((a, b) => a.localeCompare(b));
    }
    return cleaned;
  }, []);

  const totalSymbols = useMemo(() => {
    const all = Object.values(groups).flat();
    return new Set(all).size;
  }, [groups]);

  const groupedFiltered = useMemo(() => {
    const q = query.trim().toUpperCase();
    const out: { industry: string; symbols: string[] }[] = [];

    for (const [industry, syms] of Object.entries(groups)) {
      const industryMatch = !q || industry.toUpperCase().includes(q);
      const symbols = !q ? syms : syms.filter((s) => industryMatch || s.includes(q));
      if (symbols.length) out.push({ industry, symbols });
    }

    // biggest industries first; Unknown last
    out.sort((a, b) => {
      if (a.industry === "Unknown" && b.industry !== "Unknown") return 1;
      if (b.industry === "Unknown" && a.industry !== "Unknown") return -1;
      return b.symbols.length - a.symbols.length || a.industry.localeCompare(b.industry);
    });

    return out;
  }, [groups, query]);

  useEffect(() => {
    setCollapsed((prev) => {
      const next = { ...prev };
      for (const g of groupedFiltered) next[g.industry] = collapseAll;
      return next;
    });
  }, [collapseAll, groupedFiltered]);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-1">Live Watchlist</h1>
          <p className="text-xs text-slate-500">
            Loaded {totalSymbols} symbols across {Object.keys(groups).length} industry groups.
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-2 w-full sm:w-[420px]">
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
            <span className="font-semibold text-slate-700">
              {groupedFiltered.reduce((acc, g) => acc + g.symbols.length, 0)}
            </span>{" "}
            / <span className="font-semibold text-slate-700">{totalSymbols}</span> symbols
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {groupedFiltered.length === 0 && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-600">
            No symbols to show.
          </div>
        )}

        {groupedFiltered.map((g) => {
          const theme = themeForKey(g.industry);
          const isCollapsed = collapsed[g.industry] ?? false;

          return (
            <section
              key={g.industry}
              className="rounded-2xl border p-4"
              style={{ backgroundColor: theme.bg, borderColor: theme.border }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold text-slate-900">{g.industry}</h2>
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
                    setCollapsed((prev) => ({ ...prev, [g.industry]: !isCollapsed }))
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
                      key={`${g.industry}:${sym}`}
                      className="select-none rounded-xl border px-3 py-2 text-sm font-semibold tracking-wide text-center cursor-default hover:shadow-sm"
                      style={{
                        backgroundColor: theme.chipBg,
                        borderColor: theme.chipBorder,
                        color: theme.chipText,
                      }}
                      title={`${sym} • ${g.industry}`}
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
}
