"use client";

import React, { useMemo, useState } from "react";

type Direction = "UP" | "DOWN";

type Leg = {
  strike: string;
  bid: string;
  ask: string;
  volume: string;
  openInterest: string;
  iv: string;
  theta: string;
};

const n = (v: string | number) => Number(v) || 0;
const money = (v: number) => Math.round(v * 100) / 100;

function ivGrade(iv: number) {
  if (iv < 0.4) return ["LOW", "Options are relatively cheap."];
  if (iv < 0.75) return ["NORMAL", "IV is reasonable."];
  if (iv < 1.2) return ["HIGH", "Options are expensive. Spread helps reduce IV risk."];
  return ["VERY HIGH", "Very expensive options. IV crush can hurt."];
}

function liquidityGrade(volume: number, openInterest: number, bid: number, ask: number, contracts: number) {
  const spread = Math.max(0, ask - bid);
  const mid = bid + ask > 0 ? (bid + ask) / 2 : 0;
  const spreadPct = mid > 0 ? spread / mid : 999;

  let score = 0;

  if (volume >= 500) score += 3;
  else if (volume >= 100) score += 2;
  else if (volume >= 25) score += 1;

  if (openInterest >= 1000) score += 3;
  else if (openInterest >= 250) score += 2;
  else if (openInterest >= 50) score += 1;

  if (spreadPct <= 0.05) score += 3;
  else if (spreadPct <= 0.1) score += 2;
  else if (spreadPct <= 0.2) score += 1;

  let grade = "BAD";
  let contractRange = "0–1 contract only, or skip.";
  let action = "Avoid unless testing with tiny size.";
  let slipFactor = 0.5;

  if (score >= 7) {
    grade = "GOOD";
    contractRange = "1–20+ contracts depending on account size.";
    action = "Tradable with limit orders.";
    slipFactor = 0.15;
  } else if (score >= 4) {
    grade = "OK / SMALL SIZE ONLY";
    contractRange = "1–5 contracts preferred.";
    action = "Use small size. Do not scale until fills prove clean.";
    slipFactor = 0.3;
  }

  const entrySlip = spread * slipFactor * 100 * contracts;
  const exitSlip = spread * slipFactor * 100 * contracts;

  return {
    grade,
    score,
    spread: money(spread),
    spreadPct: money(spreadPct * 100),
    volume,
    openInterest,
    contractRange,
    action,
    entrySlip: money(entrySlip),
    exitSlip: money(exitSlip),
    totalSlip: money(entrySlip + exitSlip),
  };
}

export default function SpreadGuard() {
  const [ticker, setTicker] = useState("TSM");
  const [direction, setDirection] = useState<Direction>("UP");
  const [stockPrice, setStockPrice] = useState("403.27");
  const [targetPct, setTargetPct] = useState("4");
  const [expiration, setExpiration] = useState("May 8");
  const [contracts, setContracts] = useState("1");
  const [strikes, setStrikes] = useState("397.5,400,402.5,405,407.5,410,412.5,415,420");

  const [buyLeg, setBuyLeg] = useState<Leg>({
    strike: "402.5",
    bid: "14.80",
    ask: "15.80",
    volume: "56",
    openInterest: "25",
    iv: "0.5179",
    theta: "-0.6699",
  });

  const [sellLeg, setSellLeg] = useState<Leg>({
    strike: "415",
    bid: "9.65",
    ask: "10.25",
    volume: "386",
    openInterest: "274",
    iv: "0.5216",
    theta: "0.6507",
  });

  const candidates = useMemo(() => {
    const price = n(stockPrice);
    const pct = n(targetPct) > 1 ? n(targetPct) / 100 : n(targetPct);
    const list = strikes.split(",").map((x) => Number(x.trim())).filter(Boolean).sort((a, b) => a - b);

    const target = direction === "UP" ? price * (1 + pct) : price * (1 - pct);
    const move = Math.abs(target - price);

    const low = direction === "UP" ? price + move * 0.7 : price - move * 0.9;
    const high = direction === "UP" ? price + move * 0.9 : price - move * 0.7;

    const out: any[] = [];

    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];

        const buy = direction === "UP" ? a : b;
        const sell = direction === "UP" ? b : a;

        if (direction === "UP" && buy > price * 1.03) continue;
        if (direction === "DOWN" && buy < price * 0.97) continue;
        if (!(sell >= low && sell <= high)) continue;

        out.push({
          buy,
          sell,
          width: Math.abs(sell - buy),
          target: money(target),
          zone: `${money(low)} to ${money(high)}`,
          note:
            "Fast pick: sell strike captures 70%–90% of the model move, while buy strike stays close to current price.",
        });
      }
    }

    return out
      .sort((x, y) => {
        const targetSell = (low + high) / 2;
        const xSellFit = Math.abs(x.sell - targetSell);
        const ySellFit = Math.abs(y.sell - targetSell);
        const xBuyFit = Math.abs(x.buy - price);
        const yBuyFit = Math.abs(y.buy - price);
        return xSellFit - ySellFit || xBuyFit - yBuyFit;
      })
      .slice(0, 2);
  }, [direction, stockPrice, targetPct, strikes]);

  const result = useMemo(() => {
    const price = n(stockPrice);
    const pct = n(targetPct) > 1 ? n(targetPct) / 100 : n(targetPct);
    const c = n(contracts);

    const target = direction === "UP" ? price * (1 + pct) : price * (1 - pct);

    const buyStrike = n(buyLeg.strike);
    const sellStrike = n(sellLeg.strike);
    const width = Math.abs(sellStrike - buyStrike);

    const debit = n(buyLeg.ask) - n(sellLeg.bid);
    const maxLoss = debit * 100 * c;
    const maxProfit = (width - debit) * 100 * c;

    const breakeven = direction === "UP" ? buyStrike + debit : buyStrike - debit;
    const breakevenMovePct =
      direction === "UP"
        ? ((breakeven - price) / price) * 100
        : ((price - breakeven) / price) * 100;

    const netTheta = n(buyLeg.theta) + n(sellLeg.theta);
    const thetaDaily = netTheta * 100 * c;

    const [ivStatus, ivNote] = ivGrade((n(buyLeg.iv) + n(sellLeg.iv)) / 2);

    const buyLiq = liquidityGrade(n(buyLeg.volume), n(buyLeg.openInterest), n(buyLeg.bid), n(buyLeg.ask), c);
    const sellLiq = liquidityGrade(n(sellLeg.volume), n(sellLeg.openInterest), n(sellLeg.bid), n(sellLeg.ask), c);
    const totalSlip = buyLiq.totalSlip + sellLiq.totalSlip;

    const intrinsicAtTarget =
      direction === "UP"
        ? Math.max(0, Math.min(target - buyStrike, width))
        : Math.max(0, Math.min(buyStrike - target, width));

    const fastValue = Math.min(width, intrinsicAtTarget * 0.95);
    const normalValue = Math.min(width, intrinsicAtTarget * 0.8);
    const slowValue = Math.min(width, intrinsicAtTarget * 0.65);

    const fastProfit = (fastValue - debit) * 100 * c + thetaDaily * 2 - totalSlip;
    const normalProfit = (normalValue - debit) * 100 * c + thetaDaily * 4 - totalSlip;
    const slowProfit = (slowValue - debit) * 100 * c + thetaDaily * 6 - totalSlip;
    const expectedProfit = fastProfit * 0.3 + normalProfit * 0.5 + slowProfit * 0.2;

    const rewardRisk = maxLoss > 0 ? maxProfit / maxLoss : 0;

    let decision = "EXECUTE";
    const notes: string[] = [];

    if (debit <= 0) {
      decision = "SKIP";
      notes.push("Invalid debit. Check bid/ask values.");
    } else if (breakevenMovePct > n(targetPct) + 0.5) {
      decision = "SKIP";
      notes.push("Breakeven is beyond your model target. This option structure asks for too much movement.");
    } else if (breakevenMovePct > 4.5) {
      decision = "WATCH";
      notes.push("Breakeven needs more than ~4.5% move. That is stretched for your model.");
    } else if (debit > width * 0.65) {
      decision = "SKIP";
      notes.push("Debit is too expensive compared with spread width.");
    } else if (buyLiq.grade === "BAD" || sellLiq.grade === "BAD") {
      decision = "SKIP";
      notes.push("Liquidity is too weak. You may overpay entering and get underpaid exiting.");
    } else if (buyLiq.grade.includes("SMALL") || sellLiq.grade.includes("SMALL")) {
      decision = "WATCH / SMALL SIZE ONLY";
      notes.push("Liquidity is usable, but only for small size.");
    } else if (expectedProfit <= 0) {
      decision = "SKIP";
      notes.push("Expected profit after theta and slippage is weak.");
    } else if (rewardRisk < 0.75) {
      decision = "WATCH";
      notes.push("Reward/risk is not ideal.");
    } else {
      notes.push("Trade structure is valid. Use limit order only.");
    }

    return {
      target,
      debit,
      breakeven,
      breakevenMovePct,
      maxLoss,
      maxProfit,
      totalSlip,
      fastProfit,
      normalProfit,
      slowProfit,
      expectedProfit,
      thetaDaily,
      ivStatus,
      ivNote,
      buyLiq,
      sellLiq,
      decision,
      notes,
    };
  }, [direction, stockPrice, targetPct, contracts, buyLeg, sellLeg]);

  const setLeg = (which: "buy" | "sell", key: keyof Leg, value: string) => {
    if (which === "buy") setBuyLeg((p) => ({ ...p, [key]: value }));
    else setSellLeg((p) => ({ ...p, [key]: value }));
  };

  return (
    <div className="rounded-3xl bg-white shadow-sm border border-slate-100 p-5 space-y-4">
      <div>
        <div className="text-sm font-semibold text-slate-900">SpreadGuard</div>
        <p className="text-[10px] text-slate-500">
          Fast debit spread checker. Only enter the few numbers that prevent the biggest mistakes:
          bad liquidity, high theta decay, weak open interest, and breakeven beyond your model move.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-100 text-blue-800 rounded-xl p-3 text-[10px]">
        Rule of thumb: for a 4% Signal 97 alert, prefer spreads where breakeven needs about 4.5% move or less.
        Lower breakeven is better because the trade can profit before the full target.
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[10px]">
        <Input label="Ticker" value={ticker} onChange={setTicker} />
        <Select label="Direction" value={direction} onChange={(v) => setDirection(v as Direction)} />
        <Input label="Stock price" value={stockPrice} onChange={setStockPrice} />
        <Input label="Target %" value={targetPct} onChange={setTargetPct} />
        <Input label="Expiration" value={expiration} onChange={setExpiration} />
        <Input label="Contracts" value={contracts} onChange={setContracts} />
      </div>

      <label className="block text-[10px]">
        <span className="text-slate-500">Visible strikes, comma separated</span>
        <textarea
          value={strikes}
          onChange={(e) => setStrikes(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-[10px]"
        />
      </label>

      <div className="bg-slate-50 rounded-2xl p-3 text-[10px]">
        <div className="font-semibold mb-2">Stage 1 — Top 2 candidate spreads</div>
        {candidates.map((c, i) => (
          <div key={i} className="border-b border-slate-200 py-1">
            {i + 1}) Buy {c.buy} / Sell {c.sell} | Width {c.width} | Target ${c.target} | Sell zone {c.zone}
            <div className="text-slate-500">{c.note}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <LegBox title="Buy Leg" leg={buyLeg} onChange={(k, v) => setLeg("buy", k, v)} />
        <LegBox title="Sell Leg" leg={sellLeg} onChange={(k, v) => setLeg("sell", k, v)} />
      </div>

      <div className="rounded-2xl border border-slate-200 p-4 text-[10px] space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-slate-900">Final Decision</div>
          <div className="px-3 py-1 rounded-full bg-slate-900 text-white text-[10px]">{result.decision}</div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Stat label="Target" value={`$${money(result.target)}`} />
          <Stat label="Breakeven" value={`$${money(result.breakeven)}`} />
          <Stat label="Breakeven Move" value={`${money(result.breakevenMovePct)}%`} />
          <Stat label="Cost / Max Loss" value={`$${money(result.maxLoss)}`} />
          <Stat label="Max Profit" value={`$${money(result.maxProfit)}`} />
          <Stat label="Est. Slippage" value={`$${money(result.totalSlip)}`} />
          <Stat label="Theta / Day" value={`$${money(result.thetaDaily)}`} />
          <Stat label="Expected Profit" value={`$${money(result.expectedProfit)}`} />
        </div>

        <div className="grid md:grid-cols-3 gap-2">
          <Stat label="Fast Profit" value={`$${money(result.fastProfit)}`} />
          <Stat label="Normal Profit" value={`$${money(result.normalProfit)}`} />
          <Stat label="Slow Profit" value={`$${money(result.slowProfit)}`} />
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-amber-800">
          <b>Liquidity:</b> This affects both entry and exit. Weak liquidity means you may overpay when buying and get underpaid when selling.
        </div>

        <div className="grid md:grid-cols-2 gap-2">
          <LiquidityCard title="Buy Leg Liquidity" data={result.buyLiq} />
          <LiquidityCard title="Sell Leg Liquidity" data={result.sellLiq} />
        </div>

        <div className="bg-slate-50 rounded-xl p-3">
          <div><b>IV:</b> {result.ivStatus} — {result.ivNote}</div>
          <div><b>Notes:</b> {result.notes.join(" ")}</div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[9px] text-slate-500">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-[10px]" />
    </label>
  );
}

function Select({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[9px] text-slate-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-[10px]">
        <option value="UP">UP</option>
        <option value="DOWN">DOWN</option>
      </select>
    </label>
  );
}

function LegBox({ title, leg, onChange }: { title: string; leg: Leg; onChange: (k: keyof Leg, v: string) => void }) {
  const keys = Object.keys(leg) as (keyof Leg)[];
  return (
    <div className="bg-slate-50 rounded-2xl p-3 text-[10px]">
      <div className="font-semibold mb-2">{title}</div>
      <div className="grid grid-cols-2 gap-2">
        {keys.map((k) => (
          <Input key={k} label={k} value={leg[k]} onChange={(v) => onChange(k, v)} />
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-2">
      <div className="text-slate-500">{label}</div>
      <div className="font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function LiquidityCard({ title, data }: { title: string; data: any }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 space-y-1">
      <div className="font-semibold">{title}: {data.grade}</div>
      <div>Suggested size: {data.contractRange}</div>
      <div>Bid/ask spread: {data.spread} ({data.spreadPct}%)</div>
      <div>Entry slippage estimate: ${data.entrySlip}</div>
      <div>Exit slippage estimate: ${data.exitSlip}</div>
      <div className="text-slate-600">{data.action}</div>
    </div>
  );
}
