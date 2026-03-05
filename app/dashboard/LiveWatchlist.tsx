"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type IndustryGroups = Record<string, string[]>;

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function normalizeSymbol(s: string) {
  return String(s ?? "").trim().toUpperCase();
}

function hashToHue(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 360;
}

function themeForKey(key: string) {
  const hue = hashToHue(key.toLowerCase());
  return {
    hue,
    // translucent “bubble” colors
    fillA: `hsla(${hue}, 85%, 55%, 0.55)`,
    fillB: `hsla(${hue}, 85%, 45%, 0.35)`,
    stroke: `hsla(${hue}, 85%, 70%, 0.65)`,
    glow: `hsla(${hue}, 90%, 70%, 0.85)`,
    text: `hsla(${hue}, 30%, 96%, 0.95)`,
    textDim: `hsla(${hue}, 25%, 92%, 0.78)`,
  };
}

/**
 * Simple bubble packing:
 * - sort by radius desc
 * - place the biggest in the center
 * - spiral-search for a non-overlapping spot for each next bubble
 * This is fast and works great for ~10–60 sectors.
 */
type Bubble = {
  key: string;
  n: number;
  r: number;
  x: number;
  y: number;
};

function packBubbles(keys: Array<{ key: string; n: number }>, W: number, H: number): Bubble[] {
  const pad = 10;
  const minR = 38;
  const maxR = Math.min(W, H) * 0.22;

  const nMax = Math.max(1, ...keys.map((k) => k.n));
  const scale = (n: number) => {
    // sqrt scaling feels “bubble chart”-correct
    const t = Math.sqrt(n / nMax);
    return minR + t * (maxR - minR);
  };

  const bubbles: Bubble[] = keys
    .map((k) => ({ key: k.key, n: k.n, r: scale(k.n), x: 0, y: 0 }))
    .sort((a, b) => b.r - a.r);

  const cx = W / 2;
  const cy = H / 2;

  const collides = (b: Bubble) => {
    for (const o of placed) {
      const dx = b.x - o.x;
      const dy = b.y - o.y;
      const rr = b.r + o.r + pad;
      if (dx * dx + dy * dy < rr * rr) return true;
    }
    return false;
  };

  const within = (b: Bubble) => {
    // keep bubbles within a soft boundary
    return (
      b.x - b.r > 10 &&
      b.y - b.r > 10 &&
      b.x + b.r < W - 10 &&
      b.y + b.r < H - 10
    );
  };

  const placed: Bubble[] = [];
  for (let i = 0; i < bubbles.length; i++) {
    const b = bubbles[i];

    if (i === 0) {
      b.x = cx;
      b.y = cy;
      placed.push(b);
      continue;
    }

    // spiral search
    let angle = 0;
    let radius = 0;
    let found = false;

    for (let step = 0; step < 6000; step++) {
      angle += 0.35;
      radius += 0.22; // slowly expand
      b.x = cx + Math.cos(angle) * radius * 10;
      b.y = cy + Math.sin(angle) * radius * 10;

      if (!within(b)) continue;
      if (!collides(b)) {
        found = true;
        break;
      }
    }

    if (!found) {
      // fallback: just clamp somewhere
      b.x = Math.max(b.r + 10, Math.min(W - b.r - 10, b.x));
      b.y = Math.max(b.r + 10, Math.min(H - b.r - 10, b.y));
    }

    placed.push({ ...b });
  }

  return placed;
}

export default function LiveWatchlist() {
  // ✅ PASTE YOUR FULL HARD-CODED GROUPS OBJECT HERE (sector -> tickers).
  // Use the same exact GROUPS you already have.
  const GROUPS: IndustryGroups = {
    /* paste your full groups here */
  };

  const [query, setQuery] = useState("");
  const [view, setView] = useState<"bubbles" | "list">("bubbles");
  const [activeSector, setActiveSector] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Responsive container measure
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 1000, h: 560 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      const w = Math.max(720, Math.floor(rect.width));
      const h = Math.max(520, Math.floor(rect.height));
      setSize({ w, h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 1300);
    return () => window.clearTimeout(id);
  }, [toast]);

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setToast(`Copied ${text}`);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setToast(`Copied ${text}`);
    }
  }

  // sanitize groups once
  const groups = useMemo(() => {
    const cleaned: IndustryGroups = {};
    for (const [sector, syms] of Object.entries(GROUPS)) {
      const seen = new Set<string>();
      const out: string[] = [];
      for (const raw of syms || []) {
        const s = normalizeSymbol(raw);
        if (!s || seen.has(s)) continue;
        seen.add(s);
        out.push(s);
      }
      cleaned[sector || "Unknown"] = out.sort((a, b) => a.localeCompare(b));
    }
    return cleaned;
  }, []);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return groups;

    const out: IndustryGroups = {};
    for (const [sector, syms] of Object.entries(groups)) {
      const sectorMatch = sector.toUpperCase().includes(q);
      const keep = syms.filter((s) => sectorMatch || s.includes(q));
      if (keep.length) out[sector] = keep;
    }
    return out;
  }, [groups, query]);

  const totals = useMemo(() => {
    const all = Object.values(groups).flat();
    const allSet = new Set(all);
    const shown = Object.values(filteredGroups).flat();
    const shownSet = new Set(shown);
    return {
      total: allSet.size,
      shown: shownSet.size,
      sectors: Object.keys(groups).length,
      sectorsShown: Object.keys(filteredGroups).length,
    };
  }, [groups, filteredGroups]);

  // Build bubble data from filteredGroups so bubbles shrink/grow with search
  const bubbles = useMemo(() => {
    const list = Object.entries(filteredGroups)
      .map(([key, syms]) => ({ key, n: syms.length }))
      .sort((a, b) => b.n - a.n);

    return packBubbles(list, size.w, size.h);
  }, [filteredGroups, size.w, size.h]);

  const activeSymbols = useMemo(() => {
    if (!activeSector) return [];
    return filteredGroups[activeSector] || groups[activeSector] || [];
  }, [activeSector, filteredGroups, groups]);

  return (
    <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
              Live Watchlist — Bubble Map
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              {totals.shown} / {totals.total} tickers • {totals.sectorsShown} / {totals.sectors} sectors
              <span className="ml-2 text-slate-400">•</span>
              <span className="ml-2 text-slate-500">Click bubble to open. Click ticker to copy.</span>
            </p>
          </div>

          <div className="flex flex-col gap-2 w-full md:w-[560px]">
            <div className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ticker or sector…"
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-slate-200/70"
              />

              <button
                onClick={() => setView((v) => (v === "bubbles" ? "list" : "bubbles"))}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
                title="Toggle view"
              >
                {view === "bubbles" ? "List view" : "Bubble view"}
              </button>

              <button
                onClick={() => {
                  setQuery("");
                  setActiveSector(null);
                }}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
                title="Reset"
              >
                Reset
              </button>
            </div>

            {activeSector && (
              <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm">
                <div className="truncate">
                  <span className="font-semibold text-slate-900">{activeSector}</span>
                  <span className="mx-2 text-slate-300">•</span>
                  <span className="text-slate-600">{activeSymbols.length} tickers</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(activeSymbols.join(", "))}
                    className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50"
                  >
                    Copy all
                  </button>
                  <button
                    onClick={() => setActiveSector(null)}
                    className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
          <div className="px-4 py-2 rounded-2xl bg-slate-900 text-white text-sm shadow-lg">
            {toast}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {view === "bubbles" ? (
          <div
            ref={wrapRef}
            className="relative w-full rounded-[28px] overflow-hidden border border-slate-200"
            style={{
              height: 560,
              background:
                "radial-gradient(circle at 30% 20%, rgba(99,102,241,0.20), transparent 45%), radial-gradient(circle at 70% 30%, rgba(16,185,129,0.18), transparent 45%), radial-gradient(circle at 55% 80%, rgba(244,63,94,0.14), transparent 45%), linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(180deg, #071821 0%, #0a1f2a 40%, #06151d 100%)",
              backgroundSize: "auto, auto, auto, 48px 48px, 48px 48px, auto",
            }}
          >
            {/* SVG bubbles */}
            <svg width={size.w} height={size.h} className="absolute inset-0">
              <defs>
                {bubbles.map((b) => {
                  const t = themeForKey(b.key);
                  const id = `grad-${hashToHue(b.key)}`;
                  return (
                    <radialGradient key={id} id={id} cx="35%" cy="30%" r="75%">
                      <stop offset="0%" stopColor={t.fillA} />
                      <stop offset="65%" stopColor={t.fillB} />
                      <stop offset="100%" stopColor="rgba(0,0,0,0.10)" />
                    </radialGradient>
                  );
                })}
                <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {bubbles.map((b) => {
                const t = themeForKey(b.key);
                const gradId = `grad-${hashToHue(b.key)}`;
                const isActive = activeSector === b.key;

                return (
                  <g
                    key={b.key}
                    style={{ cursor: "pointer" }}
                    onClick={() => setActiveSector((cur) => (cur === b.key ? null : b.key))}
                    onMouseEnter={() => {
                      /* bring-to-front effect via re-render not needed; glow handles it */
                    }}
                  >
                    {/* outer glow ring on active */}
                    {isActive && (
                      <circle
                        cx={b.x}
                        cy={b.y}
                        r={b.r + 6}
                        fill="transparent"
                        stroke={t.glow}
                        strokeWidth={2}
                        opacity={0.9}
                        filter="url(#softGlow)"
                      />
                    )}

                    <circle
                      cx={b.x}
                      cy={b.y}
                      r={b.r}
                      fill={`url(#${gradId})`}
                      stroke={t.stroke}
                      strokeWidth={1.25}
                      opacity={0.95}
                      filter="url(#softGlow)"
                    />

                    {/* glossy highlight */}
                    <ellipse
                      cx={b.x - b.r * 0.22}
                      cy={b.y - b.r * 0.28}
                      rx={b.r * 0.35}
                      ry={b.r * 0.22}
                      fill="rgba(255,255,255,0.18)"
                      opacity={0.75}
                    />

                    {/* text */}
                    <text
                      x={b.x}
                      y={b.y - 6}
                      textAnchor="middle"
                      fill={t.text}
                      fontSize={Math.max(12, Math.min(22, b.r * 0.22))}
                      fontWeight={700}
                      style={{ pointerEvents: "none" }}
                    >
                      {b.key.length > 18 ? b.key.slice(0, 18) + "…" : b.key}
                    </text>

                    <text
                      x={b.x}
                      y={b.y + 18}
                      textAnchor="middle"
                      fill={t.textDim}
                      fontSize={Math.max(11, Math.min(18, b.r * 0.18))}
                      fontWeight={600}
                      style={{ pointerEvents: "none" }}
                    >
                      {b.n} tickers
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* helper hint */}
            <div className="absolute bottom-4 left-4 text-xs text-white/80 bg-black/30 backdrop-blur px-3 py-2 rounded-2xl border border-white/10">
              Tip: Click a bubble to open tickers. Search changes bubble sizes.
            </div>
          </div>
        ) : (
          // List view fallback (still pretty)
          <div className="space-y-4">
            {Object.entries(filteredGroups)
              .sort((a, b) => b[1].length - a[1].length)
              .map(([sector, syms]) => {
                const t = themeForKey(sector);
                const open = activeSector === sector;

                return (
                  <div
                    key={sector}
                    className="rounded-[28px] border border-slate-200 p-5 shadow-sm hover:shadow-md transition"
                    style={{ backgroundColor: `hsla(${t.hue}, 70%, 97%, 1)` }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">{sector}</div>
                        <div className="text-xs text-slate-600 mt-1">{syms.length} tickers</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(syms.join(", "))}
                          className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                        >
                          Copy all
                        </button>
                        <button
                          onClick={() => setActiveSector((cur) => (cur === sector ? null : sector))}
                          className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                        >
                          {open ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    {open && (
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-2">
                        {syms.map((sym) => (
                          <button
                            key={`${sector}:${sym}`}
                            type="button"
                            onClick={() => copyToClipboard(sym)}
                            className="rounded-2xl border border-slate-200 bg-white/70 hover:bg-white text-slate-800 text-sm font-semibold px-3 py-2 transition hover:-translate-y-[1px]"
                            title="Click to copy"
                          >
                            {sym}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* Active sector tickers below bubbles */}
        {view === "bubbles" && activeSector && (
          <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-base font-semibold text-slate-900 truncate">{activeSector}</div>
                <div className="text-xs text-slate-600 mt-1">{activeSymbols.length} tickers</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(activeSymbols.join(", "))}
                  className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50"
                >
                  Copy all
                </button>
                <button
                  onClick={() => setActiveSector(null)}
                  className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
              {activeSymbols.map((sym) => (
                <button
                  key={`${activeSector}:${sym}`}
                  type="button"
                  onClick={() => copyToClipboard(sym)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white text-slate-900 text-sm font-semibold px-3 py-2 transition hover:-translate-y-[1px] hover:shadow-sm"
                  title="Click to copy"
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
