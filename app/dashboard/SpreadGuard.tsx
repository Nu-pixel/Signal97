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

type SpreadInput = {
  name: string;
  buyLeg: Leg;
  sellLeg: Leg;
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

function contractSizeCheck(
  desiredContracts: number,
  buyVolume: number,
  buyOpenInterest: number,
  sellVolume: number,
  sellOpenInterest: number,
  buyGrade: string,
  sellGrade: string
) {
  const weakestVolume = Math.min(buyVolume, sellVolume);
  const weakestOI = Math.min(buyOpenInterest, sellOpenInterest);

  let status = "SAFE SMALL SIZE";
  let maxSuggested = 1;
  let explanation = "";

  if (buyGrade === "BAD" || sellGrade === "BAD") {
    maxSuggested = 1;
    status = desiredContracts <= 1 ? "TEST SIZE ONLY" : "TOO LARGE";
    explanation =
      "One leg has weak liquidity. That does not mean nobody can buy from you later, but your exit price is less predictable.";
  } else if (buyGrade.includes("SMALL") || sellGrade.includes("SMALL")) {
    maxSuggested = 5;
    status = desiredContracts <= 5 ? "SMALL SIZE OK" : "TOO LARGE";
    explanation =
      "Liquidity is usable, but not strong enough for large size. 1–5 contracts is the safer range.";
  } else {
    maxSuggested = 20;
    status = desiredContracts <= 20 ? "SIZE OK" : "CHECK BEFORE SCALING";
    explanation =
      "Liquidity looks acceptable, but still use limit orders. For larger size, split orders and check live fills.";
  }

  if (weakestVolume < desiredContracts) {
    status = "TOO LARGE";
    explanation +=
      " Your desired contracts are larger than today’s weakest-leg volume, so fills may be slow or expensive.";
  }

  return {
    status,
    desiredContracts,
    maxSuggested,
    weakestVolume,
    weakestOpenInterest: weakestOI,
    explanation,
    beginnerNote:
      "Volume is today’s activity. Open interest is currently open contracts. Low volume/OI does not prove you cannot exit later, but it means the contract is less active and exit pricing may be worse.",
  };
}

function evaluateSpread(params: {
  name: string;
  direction: Direction;
  stockPrice: number;
  targetPct: number;
  contracts: number;
  buyLeg: Leg;
  sellLeg: Leg;
}) {
  const { name, direction, stockPrice, targetPct, contracts, buyLeg, sellLeg } = params;

  const pctRaw = targetPct;
  const pct = pctRaw > 1 ? pctRaw / 100 : pctRaw;
  const target = direction === "UP" ? stockPrice * (1 + pct) : stockPrice * (1 - pct);

  const buyStrike = n(buyLeg.strike);
  const sellStrike = n(sellLeg.strike);
  const width = Math.abs(sellStrike - buyStrike);

  const debit = n(buyLeg.ask) - n(sellLeg.bid);
  const maxLoss = debit * 100 * contracts;
  const maxProfit = (width - debit) * 100 * contracts;

  const breakeven = direction === "UP" ? buyStrike + debit : buyStrike - debit;
  const breakevenMovePct =
    direction === "UP"
      ? ((breakeven - stockPrice) / stockPrice) * 100
      : ((stockPrice - breakeven) / stockPrice) * 100;

  const netTheta = n(buyLeg.theta) + n(sellLeg.theta);
  const thetaDaily = netTheta * 100 * contracts;

  const [ivStatus, ivNote] = ivGrade((n(buyLeg.iv) + n(sellLeg.iv)) / 2);

  const buyLiq = liquidityGrade(
    n(buyLeg.volume),
    n(buyLeg.openInterest),
    n(buyLeg.bid),
    n(buyLeg.ask),
    contracts
  );

  const sellLiq = liquidityGrade(
    n(sellLeg.volume),
    n(sellLeg.openInterest),
    n(sellLeg.bid),
    n(sellLeg.ask),
    contracts
  );

  const totalSlip = buyLiq.totalSlip + sellLiq.totalSlip;

  const sizeCheck = contractSizeCheck(
    contracts,
    buyLiq.volume,
    buyLiq.openInterest,
    sellLiq.volume,
    sellLiq.openInterest,
    buyLiq.grade,
    sellLiq.grade
  );

  const intrinsicAtTarget =
    direction === "UP"
      ? Math.max(0, Math.min(target - buyStrike, width))
      : Math.max(0, Math.min(buyStrike - target, width));

  const fastValue = Math.min(width, intrinsicAtTarget * 0.95);
  const normalValue = Math.min(width, intrinsicAtTarget * 0.8);
  const slowValue = Math.min(width, intrinsicAtTarget * 0.65);

  const fastProfit = (fastValue - debit) * 100 * contracts + thetaDaily * 2 - totalSlip;
  const normalProfit = (normalValue - debit) * 100 * contracts + thetaDaily * 4 - totalSlip;
  const slowProfit = (slowValue - debit) * 100 * contracts + thetaDaily * 6 - totalSlip;
  const expectedProfit = fastProfit * 0.3 + normalProfit * 0.5 + slowProfit * 0.2;

  const rewardRisk = maxLoss > 0 ? maxProfit / maxLoss : 0;

  let decision = "EXECUTE";
  let score = 100;
  const notes: string[] = [];

  if (debit <= 0) {
    decision = "SKIP";
    score -= 100;
    notes.push("Invalid debit. Recheck bid/ask.");
  }

  if (breakevenMovePct > pctRaw + 0.5) {
    decision = "SKIP";
    score -= 40;
    notes.push("Breakeven is beyond the model target.");
  } else if (breakevenMovePct > 4.5) {
    decision = decision === "EXECUTE" ? "WATCH" : decision;
    score -= 15;
    notes.push("Breakeven needs more than about 4.5% move.");
  } else {
    score += 10;
    notes.push("Breakeven is inside the model move.");
  }

  if (debit > width * 0.65) {
    decision = "SKIP";
    score -= 30;
    notes.push("Debit is too expensive compared with spread width.");
  }

  if (buyLiq.grade === "BAD" || sellLiq.grade === "BAD") {
    decision = "SKIP";
    score -= 35;
    notes.push("Liquidity is too weak. Exit price may be worse than expected.");
  } else if (buyLiq.grade.includes("SMALL") || sellLiq.grade.includes("SMALL")) {
    decision = decision === "EXECUTE" ? "WATCH / SMALL SIZE ONLY" : decision;
    score -= 15;
    notes.push("Liquidity is usable, but only for small size.");
  } else {
    score += 10;
    notes.push("Liquidity looks tradable with limit orders.");
  }

  if (sizeCheck.status === "TOO LARGE") {
    decision = "SKIP";
    score -= 25;
    notes.push("Your selected contract size is too large for current liquidity.");
  }

  if (expectedProfit <= 0) {
    decision = "SKIP";
    score -= 25;
    notes.push("Estimated profit after theta and slippage is weak.");
  }

  if (rewardRisk < 0.75) {
    decision = decision === "EXECUTE" ? "WATCH" : decision;
    score -= 10;
    notes.push("Reward/risk is not ideal.");
  }

  return {
    name,
    direction,
    optionWord: direction === "UP" ? "Call" : "Put",
    buyStrike,
    sellStrike,
    width,
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
    sizeCheck,
    decision,
    score,
    notes,
    rewardRisk,
  };
}

export default function SpreadGuard() {
  const [hasCompared, setHasCompared] = useState(false);

  const [ticker, setTicker] = useState("TSM");
  const [direction, setDirection] = useState<Direction>("UP");
  const [stockPrice, setStockPrice] = useState("403.27");
  const [targetPct, setTargetPct] = useState("4");
  const [expiration, setExpiration] = useState("May 8");
  const [contracts, setContracts] = useState("1");
  const [strikes, setStrikes] = useState("397.5,400,402.5,405,407.5,410,412.5,415,420");

  const [spreadA, setSpreadA] = useState<SpreadInput>({
    name: "Candidate A",
    buyLeg: {
      strike: "402.5",
      bid: "14.80",
      ask: "15.80",
      volume: "56",
      openInterest: "25",
      iv: "0.5179",
      theta: "-0.6699",
    },
    sellLeg: {
      strike: "415",
      bid: "9.65",
      ask: "10.25",
      volume: "386",
      openInterest: "274",
      iv: "0.5216",
      theta: "0.6507",
    },
  });

  const [spreadB, setSpreadB] = useState<SpreadInput>({
    name: "Candidate B",
    buyLeg: {
      strike: "405",
      bid: "13.40",
      ask: "14.30",
      volume: "0",
      openInterest: "0",
      iv: "0.52",
      theta: "-0.65",
    },
    sellLeg: {
      strike: "415",
      bid: "9.65",
      ask: "10.25",
      volume: "386",
      openInterest: "274",
      iv: "0.5216",
      theta: "0.6507",
    },
  });

  const updateTopInput = (setter: (v: string) => void, value: string) => {
    setter(value);
    setHasCompared(false);
  };

  const candidates = useMemo(() => {
    const price = n(stockPrice);
    const pct = n(targetPct) > 1 ? n(targetPct) / 100 : n(targetPct);
    const list = strikes
      .split(",")
      .map((x) => Number(x.trim()))
      .filter(Boolean)
      .sort((a, b) => a - b);

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

  const resultA = useMemo(
    () =>
      evaluateSpread({
        name: "Candidate A",
        direction,
        stockPrice: n(stockPrice),
        targetPct: n(targetPct),
        contracts: n(contracts),
        buyLeg: spreadA.buyLeg,
        sellLeg: spreadA.sellLeg,
      }),
    [direction, stockPrice, targetPct, contracts, spreadA]
  );

  const resultB = useMemo(
    () =>
      evaluateSpread({
        name: "Candidate B",
        direction,
        stockPrice: n(stockPrice),
        targetPct: n(targetPct),
        contracts: n(contracts),
        buyLeg: spreadB.buyLeg,
        sellLeg: spreadB.sellLeg,
      }),
    [direction, stockPrice, targetPct, contracts, spreadB]
  );

  const final = useMemo(() => {
    const validA = resultA.decision !== "SKIP";
    const validB = resultB.decision !== "SKIP";

    if (!validA && !validB) {
      return {
        decision: "SKIP BOTH",
        action: "Skip both spreads for now.",
        why:
          "Both candidates failed safety checks. The usual causes are weak liquidity, bad size, expensive debit, or weak expected profit.",
        next:
          "Check nearby strikes with stronger volume/open interest and tighter bid/ask spreads.",
        winner: null as any,
      };
    }

    const winner =
      validA && validB
        ? resultA.score >= resultB.score
          ? resultA
          : resultB
        : validA
        ? resultA
        : resultB;

    const loser = winner.name === "Candidate A" ? resultB : resultA;

    return {
      decision: winner.decision,
      action: `${winner.name} wins: Buy ${winner.buyStrike} ${winner.optionWord} / Sell ${winner.sellStrike} ${winner.optionWord}`,
      why:
        `${winner.name} scored better overall. ` +
        `Winner score: ${winner.score}. Other score: ${loser.score}. ` +
        `It was compared using breakeven, bid/ask width, volume, open interest, theta, slippage, expected profit, and contract-size safety.`,
      next:
        winner.decision === "EXECUTE"
          ? "Use a limit order only. Do not use a market order."
          : "This is not a clean full-size trade. Use small size only or keep checking better strikes.",
      winner,
    };
  }, [resultA, resultB]);

  const setLeg = (
    candidate: "A" | "B",
    side: "buyLeg" | "sellLeg",
    key: keyof Leg,
    value: string
  ) => {
    setHasCompared(false);
    const setter = candidate === "A" ? setSpreadA : setSpreadB;

    setter((p) => ({
      ...p,
      [side]: {
        ...p[side],
        [key]: value,
      },
    }));
  };

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-1 shadow-xl">
      <div className="rounded-[1.8rem] bg-gradient-to-br from-white via-slate-50 to-blue-50 p-5 space-y-5">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <div className="text-2xl font-bold text-slate-950 tracking-tight">
              SpreadGuard
            </div>
            <p className="text-sm text-slate-600 max-w-2xl mt-1">
              Compare two debit spreads side-by-side before risking real money.
              Enter both choices, then press Compare Spreads.
            </p>
          </div>

          <div className="rounded-full bg-slate-950 text-white px-4 py-2 text-xs font-semibold shadow-sm">
            {hasCompared ? final.decision : "WAITING TO COMPARE"}
          </div>
        </div>

        <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-900">
          <b>Beginner rule:</b> Stage 1 only suggests strike pairs. It does not approve the trade.
          The final decision happens only after you enter data for both Candidate A and Candidate B and click Compare Spreads.
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Input label="Ticker" value={ticker} onChange={(v) => updateTopInput(setTicker, v)} />
          <Select label="Direction" value={direction} onChange={(v) => updateTopInput((x) => setDirection(x as Direction), v)} />
          <Input label="Stock price" value={stockPrice} onChange={(v) => updateTopInput(setStockPrice, v)} />
          <Input label="Target %" value={targetPct} onChange={(v) => updateTopInput(setTargetPct, v)} />
          <Input label="Expiration" value={expiration} onChange={(v) => updateTopInput(setExpiration, v)} />
          <Input label="Contracts" value={contracts} onChange={(v) => updateTopInput(setContracts, v)} />
        </div>

        <label className="block text-sm">
          <span className="font-semibold text-slate-700">
            Visible strikes, comma separated
          </span>
          <textarea
            value={strikes}
            onChange={(e) => updateTopInput(setStrikes, e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
          />
        </label>

        <div className="rounded-3xl bg-white/90 border border-slate-200 p-4 shadow-sm">
          <div className="font-bold text-slate-950 mb-1">
            Step 1 — Two strike ideas to check
          </div>
          <div className="text-sm text-slate-500 mb-3">
            These are only generated from stock price, direction, target %, and visible strikes.
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {candidates.map((c, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm"
              >
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  Suggested Candidate {i + 1}
                </div>
                <div className="text-lg font-bold text-slate-950 mt-1">
                  Buy {c.buy} / Sell {c.sell}
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  Width {c.width} · Target ${c.target}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Sell zone: {c.zone}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <SpreadEditor
            title="Candidate A"
            subtitle="Example: Buy 402.5 / Sell 415"
            result={resultA}
            spread={spreadA}
            onChange={(side, key, value) => setLeg("A", side, key, value)}
          />

          <SpreadEditor
            title="Candidate B"
            subtitle="Example: Buy 405 / Sell 415"
            result={resultB}
            spread={spreadB}
            onChange={(side, key, value) => setLeg("B", side, key, value)}
          />
        </div>

        {!hasCompared ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-6 text-center shadow-sm">
            <div className="text-xl font-bold text-slate-950">
              Enter both spread choices, then compare.
            </div>
            <p className="mt-2 text-sm text-slate-500 max-w-2xl mx-auto">
              SpreadGuard will compare breakeven, liquidity, bid/ask width, theta,
              estimated slippage, estimated profit, and whether your contract size is safe.
            </p>

            <button
              type="button"
              onClick={() => setHasCompared(true)}
              className="mt-5 rounded-2xl bg-slate-950 px-7 py-3 text-sm font-bold text-white shadow-lg hover:bg-slate-800 active:scale-[0.99]"
            >
              Compare Spreads
            </button>
          </div>
        ) : (
          <div className="rounded-3xl bg-slate-950 text-white p-6 space-y-3 shadow-xl">
            <div className="text-xs uppercase tracking-wide text-blue-200">
              Final comparison result
            </div>
            <div className="text-2xl font-bold">{final.action}</div>
            <div className="text-sm text-slate-200">{final.why}</div>
            <div className="text-sm text-slate-300">
              <b>Next:</b> {final.next}
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-yellow-50 border border-yellow-100 p-4 text-sm text-yellow-900 space-y-2">
          <div className="font-bold">Liquidity reminder for beginners</div>
          <div>
            Volume is today’s activity. Open interest is currently open contracts.
            Low volume/OI does not prove you cannot exit later, but it means the option is less active and your exit price may be worse.
          </div>
          <div>
            Because this is a spread, risk is more controlled than buying one single option,
            but both legs still need a fair fill. Use limit orders only.
          </div>
          <div>
            Profit numbers are estimates after theta and estimated slippage.
            They are not guaranteed because the exit bid/ask can change.
          </div>
        </div>
      </div>
    </div>
  );
}

function SpreadEditor({
  title,
  subtitle,
  spread,
  result,
  onChange,
}: {
  title: string;
  subtitle: string;
  spread: SpreadInput;
  result: any;
  onChange: (side: "buyLeg" | "sellLeg", key: keyof Leg, value: string) => void;
}) {
  const decisionClass =
    result.decision === "EXECUTE"
      ? "bg-emerald-100 text-emerald-700"
      : result.decision.includes("WATCH")
      ? "bg-amber-100 text-amber-700"
      : "bg-rose-100 text-rose-700";

  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-bold text-slate-950">{title}</div>
          <div className="text-xs text-slate-500">{subtitle}</div>
          <div className="text-sm font-semibold text-slate-700 mt-1">
            Buy {result.buyStrike} / Sell {result.sellStrike}
          </div>
        </div>

        <div className={`rounded-full px-3 py-1 text-xs font-bold ${decisionClass}`}>
          {result.decision}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <LegBox
          title="Buy leg"
          leg={spread.buyLeg}
          onChange={(k, v) => onChange("buyLeg", k, v)}
        />
        <LegBox
          title="Sell leg"
          leg={spread.sellLeg}
          onChange={(k, v) => onChange("sellLeg", k, v)}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Stat label="Breakeven move" value={`${money(result.breakevenMovePct)}%`} />
        <Stat label="Cost / max loss" value={`$${money(result.maxLoss)}`} />
        <Stat label="Max profit" value={`$${money(result.maxProfit)}`} />
        <Stat label="Expected profit" value={`$${money(result.expectedProfit)}`} />
        <Stat label="Theta/day" value={`$${money(result.thetaDaily)}`} />
        <Stat label="Est. slippage" value={`$${money(result.totalSlip)}`} />
        <Stat label="Fast profit" value={`$${money(result.fastProfit)}`} />
        <Stat label="Slow profit" value={`$${money(result.slowProfit)}`} />
      </div>

      <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs space-y-1">
        <div>
          <b>Buy liquidity:</b> {result.buyLiq.grade} · spread {result.buyLiq.spreadPct}% · OI {result.buyLiq.openInterest} · volume {result.buyLiq.volume}
        </div>
        <div>
          <b>Sell liquidity:</b> {result.sellLiq.grade} · spread {result.sellLiq.spreadPct}% · OI {result.sellLiq.openInterest} · volume {result.sellLiq.volume}
        </div>
        <div>
          <b>Size safety:</b> {result.sizeCheck.status} — suggested max {result.sizeCheck.maxSuggested}
        </div>
        <div>
          <b>IV:</b> {result.ivStatus} — {result.ivNote}
        </div>
        <div>
          <b>Notes:</b> {result.notes.join(" ")}
        </div>
      </div>
    </div>
  );
}

function LegBox({
  title,
  leg,
  onChange,
}: {
  title: string;
  leg: Leg;
  onChange: (key: keyof Leg, value: string) => void;
}) {
  const keys = Object.keys(leg) as (keyof Leg)[];

  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
      <div className="text-xs font-bold text-slate-700 mb-2">{title}</div>
      <div className="grid grid-cols-2 gap-2">
        {keys.map((k) => (
          <Input
            key={k}
            label={k}
            value={leg[k]}
            onChange={(v) => onChange(k, v)}
          />
        ))}
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-[10px] font-semibold text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-[10px] font-semibold text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
      >
        <option value="UP">UP</option>
        <option value="DOWN">DOWN</option>
      </select>
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
      <div className="text-[10px] font-medium text-slate-500">{label}</div>
      <div className="text-sm font-bold text-slate-950">{value}</div>
    </div>
  );
}
