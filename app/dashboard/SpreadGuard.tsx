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

function badgeStyle(text: string) {
  if (text.includes("EXECUTE") || text.includes("SIZE OK") || text.includes("GOOD")) {
    return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-300/15 dark:text-emerald-100 dark:border-emerald-200/25";
  }
  if (text.includes("WATCH") || text.includes("SMALL") || text.includes("TEST")) {
    return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-300/15 dark:text-amber-100 dark:border-amber-200/25";
  }
  return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-500/15 dark:text-rose-100 dark:border-rose-300/25";
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
      "One leg has weak liquidity. You may still exit later, but the exit price is less predictable.";
  } else if (buyGrade.includes("SMALL") || sellGrade.includes("SMALL")) {
    maxSuggested = 5;
    status = desiredContracts <= 5 ? "SMALL SIZE OK" : "TOO LARGE";
    explanation = "Liquidity is usable, but not strong enough for large size.";
  } else {
    maxSuggested = 20;
    status = desiredContracts <= 20 ? "SIZE OK" : "CHECK BEFORE SCALING";
    explanation = "Liquidity looks acceptable. Still use limit orders.";
  }

  if (weakestVolume < desiredContracts) {
    status = "TOO LARGE";
    explanation += " Your desired contracts are larger than today’s weakest-leg volume.";
  }

  return {
    status,
    desiredContracts,
    maxSuggested,
    weakestVolume,
    weakestOpenInterest: weakestOI,
    explanation,
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

  const entrySlip = buyLiq.entrySlip + sellLiq.entrySlip;
  const exitSlip = buyLiq.exitSlip + sellLiq.exitSlip;
  
  // Debit already uses buy ask - sell bid, so entry slippage is already included.
  // Only subtract exit slippage from profit estimates.
  const totalSlip = entrySlip + exitSlip;
  const profitSlip = exitSlip;

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

  const fastProfit = (fastValue - debit) * 100 * contracts + thetaDaily * 2 - profitSlip;
  const normalProfit = (normalValue - debit) * 100 * contracts + thetaDaily * 4 - profitSlip;
  const slowProfit = (slowValue - debit) * 100 * contracts + thetaDaily * 6 - profitSlip;
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
    const worstSpreadPct = Math.max(buyLiq.spreadPct, sellLiq.spreadPct);
  
    if (worstSpreadPct > 20 || expectedProfit <= 0) {
      decision = "SKIP";
      score -= 35;
      notes.push(
        "Liquidity is weak AND the bid/ask or profit estimate is bad. You may have trouble exiting at a fair price."
      );
    } else {
      decision = decision === "EXECUTE" ? "WATCH / TEST SIZE ONLY" : decision;
      score -= 20;
      notes.push(
        "Liquidity is weak, but not automatically impossible. Use 1 contract only, use a limit order, and only take it if the live fill is fair."
      );
    }
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
    notes.push("Contract size is too large for current liquidity.");
  }


  if (expectedProfit < -10) {
    decision = "SKIP";
    score -= 25;
    notes.push("Estimated profit after theta and slippage is meaningfully negative.");
  } else if (expectedProfit <= 0) {
    decision = decision === "EXECUTE" ? "WATCH / TEST SIZE ONLY" : decision;
    score -= 10;
    notes.push("Estimated profit is slightly negative, so this is not clean. Only test-size if the live fill is good.");
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
  const [candidateMode, setCandidateMode] = useState<"STRICT" | "FLEXIBLE">("STRICT");

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

  const [spreadC, setSpreadC] = useState<SpreadInput>({
    name: "Candidate C",
    buyLeg: {
      strike: "177.5",
      bid: "",
      ask: "",
      volume: "",
      openInterest: "",
      iv: "",
      theta: "",
    },
    sellLeg: {
      strike: "185",
      bid: "",
      ask: "",
      volume: "",
      openInterest: "",
      iv: "",
      theta: "",
    },
  });

  const [spreadD, setSpreadD] = useState<SpreadInput>({
    name: "Candidate D",
    buyLeg: {
      strike: "180",
      bid: "",
      ask: "",
      volume: "",
      openInterest: "",
      iv: "",
      theta: "",
    },
    sellLeg: {
      strike: "185",
      bid: "",
      ask: "",
      volume: "",
      openInterest: "",
      iv: "",
      theta: "",
    },
  });

  const updateTopInput = (setter: (v: string) => void, value: string) => {
    setter(value);
    setHasCompared(false);
  };


  const candidateInfo = useMemo(() => {
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
    const targetSell = (low + high) / 2;

    const strictOut: any[] = [];
    const flexibleOut: any[] = [];

    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];

        const buy = direction === "UP" ? a : b;
        const sell = direction === "UP" ? b : a;

        // Buy leg should stay reasonably close to current price.
        if (direction === "UP" && buy > price * 1.03) continue;
        if (direction === "DOWN" && buy < price * 0.97) continue;

        const sellInsideTargetZone = sell >= low && sell <= high;

        const candidate = {
          buy,
          sell,
          width: Math.abs(sell - buy),
          target: money(target),
          zone: `${money(low)} to ${money(high)}`,
          strict: sellInsideTargetZone,
          distanceFromZone: sellInsideTargetZone
            ? 0
            : direction === "UP"
            ? sell < low
              ? low - sell
              : sell - high
            : sell > high
            ? sell - low
            : high - sell,
          label: sellInsideTargetZone
            ? "Strict target-zone fit"
            : "Flexible / aggressive",
        };

        if (sellInsideTargetZone) {
          strictOut.push(candidate);
        }

        // Flexible allows sell strikes outside the target zone,
        // but still ranks closest-to-zone first.
        flexibleOut.push(candidate);
      }
    }

    const sorter = (x: any, y: any) => {
      const xSellFit = Math.abs(x.sell - targetSell);
      const ySellFit = Math.abs(y.sell - targetSell);
      const xBuyFit = Math.abs(x.buy - price);
      const yBuyFit = Math.abs(y.buy - price);

      return xSellFit - ySellFit || xBuyFit - yBuyFit;
    };

    const strictSorted = strictOut.sort(sorter);
    const flexibleSorted = flexibleOut.sort((x, y) => {
      // Prefer strict candidates first, then closest flexible candidates.
      if (x.strict !== y.strict) return x.strict ? -1 : 1;
      return sorter(x, y);
    });

    const fallbackUsed =
      candidateMode === "STRICT" &&
      strictSorted.length === 0 &&
      flexibleSorted.length > 0;

    const shown =
      candidateMode === "STRICT"
        ? strictSorted.length > 0
          ? strictSorted.slice(0, 4)
          : flexibleSorted.slice(0, 4)
        : flexibleSorted.slice(0, 4);

    return {
      candidates: shown,
      strictCount: strictSorted.length,
      flexibleCount: flexibleSorted.length,
      target: money(target),
      zone: `${money(low)} to ${money(high)}`,
      mode: candidateMode,
      fallbackUsed,
    };
  }, [direction, stockPrice, targetPct, strikes, candidateMode]);

  const candidates = candidateInfo.candidates;

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
  const resultC = useMemo(
    () =>
      evaluateSpread({
        name: "Candidate C",
        direction,
        stockPrice: n(stockPrice),
        targetPct: n(targetPct),
        contracts: n(contracts),
        buyLeg: spreadC.buyLeg,
        sellLeg: spreadC.sellLeg,
      }),
    [direction, stockPrice, targetPct, contracts, spreadC]
  );

  const resultD = useMemo(
    () =>
      evaluateSpread({
        name: "Candidate D",
        direction,
        stockPrice: n(stockPrice),
        targetPct: n(targetPct),
        contracts: n(contracts),
        buyLeg: spreadD.buyLeg,
        sellLeg: spreadD.sellLeg,
      }),
    [direction, stockPrice, targetPct, contracts, spreadD]
  );

  const final = useMemo(() => {
    const results = [resultA, resultB, resultC, resultD];
    const valid = results.filter((r) => r.decision !== "SKIP");

    if (valid.length === 0) {
      return {
        decision: "SKIP ALL",
        action: "Skip all four spreads for now.",
        why:
          "All candidates failed safety checks. The usual causes are weak liquidity, bad size, expensive debit, or weak expected profit.",
        next:
          "Check nearby strikes with stronger volume/open interest and tighter bid/ask spreads.",
        winner: null as any,
      };
    }

    const winner = [...valid].sort((a, b) => b.score - a.score)[0];

    const runnerUp = [...results]
      .filter((r) => r.name !== winner.name)
      .sort((a, b) => b.score - a.score)[0];

    return {
      decision: winner.decision,
      action: `${winner.name} wins: Buy ${winner.buyStrike} ${winner.optionWord} / Sell ${winner.sellStrike} ${winner.optionWord}`,
      why:
        `${winner.name} scored best overall. Winner score: ${winner.score}. ` +
        `Next closest: ${runnerUp.name} with score ${runnerUp.score}.`,
      next:
        winner.decision === "EXECUTE"
          ? "Use a limit order only. Do not use a market order."
          : "This is not a clean full-size trade. Use small size only or keep checking better strikes.",
      winner,
    };
  }, [resultA, resultB, resultC, resultD]);

  const applyCandidateToSlot = (slot: "A" | "B" | "C" | "D", candidate: any) => {
    setHasCompared(false);
  
    const setter =
      slot === "A"
        ? setSpreadA
        : slot === "B"
        ? setSpreadB
        : slot === "C"
        ? setSpreadC
        : setSpreadD;
  
    setter((p) => ({
      ...p,
      buyLeg: {
        ...p.buyLeg,
        strike: String(candidate.buy),
      },
      sellLeg: {
        ...p.sellLeg,
        strike: String(candidate.sell),
      },
    }));
  };
  
  const loadTopFourCandidates = () => {
    if (candidates[0]) applyCandidateToSlot("A", candidates[0]);
    if (candidates[1]) applyCandidateToSlot("B", candidates[1]);
    if (candidates[2]) applyCandidateToSlot("C", candidates[2]);
    if (candidates[3]) applyCandidateToSlot("D", candidates[3]);
  }; 
  
  const setLeg = (
    candidate: "A" | "B" | "C" | "D",
    side: "buyLeg" | "sellLeg",
    key: keyof Leg,
    value: string
  ) => {
    setHasCompared(false);
  
    const setter =
      candidate === "A"
        ? setSpreadA
        : candidate === "B"
        ? setSpreadB
        : candidate === "C"
        ? setSpreadC
        : setSpreadD;
  
    setter((p) => ({
      ...p,
      [side]: {
        ...p[side],
        [key]: value,
      },
    }));
  };

  return (
    <div className="rounded-[2rem] bg-gradient-to-br from-indigo-600 via-sky-500 to-emerald-400 p-1 shadow-2xl dark:shadow-[0_22px_70px_rgba(0,0,0,0.35)]">
      <div className="rounded-[1.8rem] bg-gradient-to-br from-white via-sky-50 to-emerald-50 p-5 space-y-5 transition-colors dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_34%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_30%),linear-gradient(135deg,#101827_0%,#162335_55%,#0b111c_100%)] dark:text-white">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <div className="inline-flex rounded-full border border-indigo-200 bg-indigo-100 text-indigo-700 px-3 py-1 text-xs font-bold mb-2 dark:border-indigo-300/20 dark:bg-indigo-300/10 dark:text-indigo-100">
              Signal 97 Options Tool
            </div>
            <div className="text-3xl font-black text-slate-950 tracking-tight dark:text-white">
              SpreadGuard
            </div>
            <p className="text-sm text-slate-600 max-w-2xl mt-1 dark:text-slate-300">
              Compare two debit spreads before risking real money. Fill both candidates,
              then press <b>Compare Spreads</b>.
            </p>
          </div>

          <div className={`rounded-full border px-4 py-2 text-xs font-black shadow-sm ${badgeStyle(hasCompared ? final.decision : "WATCH")}`}>
            {hasCompared ? final.decision : "WAITING TO COMPARE"}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <InfoCard
            color="blue"
            title="1. Pick the alert"
            text="Enter ticker, direction, price, target %, expiration, and contract count."
          />
          <InfoCard
            color="emerald"
            title="2. Fill both spreads"
            text="Enter bid, ask, volume, open interest, IV, and theta for Candidates A, B, C, and D."
          />
          <InfoCard
            color="amber"
            title="3. Compare"
            text="The tool chooses the cleaner spread or tells you to skip both."
          />
        </div>

        <div className="rounded-3xl border border-sky-100 bg-white/90 p-4 shadow-sm dark:border-white/15 dark:bg-[#0b1423]/85 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="text-sm font-bold text-slate-900 dark:text-white mb-3 dark:text-white">Alert inputs</div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Input label="Ticker" value={ticker} onChange={(v) => updateTopInput(setTicker, v)} />
            <Select label="Direction" value={direction} onChange={(v) => updateTopInput((x) => setDirection(x as Direction), v)} />
            <Input label="Stock price" value={stockPrice} onChange={(v) => updateTopInput(setStockPrice, v)} />
            <Input label="Target %" value={targetPct} onChange={(v) => updateTopInput(setTargetPct, v)} />
            <Input label="Expiration" value={expiration} onChange={(v) => updateTopInput(setExpiration, v)} />
            <Input label="Contracts" value={contracts} onChange={(v) => updateTopInput(setContracts, v)} />
          </div>
        </div>

        <label className="block text-sm rounded-3xl border border-sky-100 bg-white/90 p-4 shadow-sm dark:border-white/15 dark:bg-[#0b1423]/85 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <span className="font-bold text-slate-900 dark:text-white">
            Visible strikes, comma separated
          </span>
          <textarea
            value={strikes}
            onChange={(e) => updateTopInput(setStrikes, e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm focus:ring-2 focus:ring-sky-300 dark:border-white/15 dark:bg-[#111827] dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </label>

        <div className="rounded-3xl border border-sky-100 bg-white/90 p-4 shadow-sm dark:border-white/15 dark:bg-[#0b1423]/85 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
            <div>
              <div className="font-black text-slate-950 mb-1 dark:text-white">
                Step 1 — Two strike ideas to check
              </div>
        
              <div className="text-sm text-slate-500 dark:text-slate-400">
                These are only suggestions from price, direction, target %, and strike list.
                They are not approved trades yet.
              </div>
        
              <div className="text-xs text-slate-400 mt-1 dark:text-slate-500">
                Target ${candidateInfo.target} · Strict sell zone: {candidateInfo.zone}
              </div>
        
              {candidates.length > 0 && (
                <button
                  type="button"
                  onClick={loadTopFourCandidates}
                  className="mt-3 rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-slate-800"
                >
                  Use these 4 spreads for Candidate A/B/C/D
                </button>
              )}
            </div>
        
            <div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-white/[0.05]">
              <button
                type="button"
                onClick={() => setCandidateMode("STRICT")}
                className={
                  "px-3 py-1.5 rounded-xl text-xs font-black transition " +
                  (candidateMode === "STRICT"
                    ? "bg-white text-slate-950 shadow-sm dark:bg-cyan-300/15 dark:text-white"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white")
                }
              >
                Strict
              </button>
        
              <button
                type="button"
                onClick={() => setCandidateMode("FLEXIBLE")}
                className={
                  "px-3 py-1.5 rounded-xl text-xs font-black transition " +
                  (candidateMode === "FLEXIBLE"
                    ? "bg-white text-slate-950 shadow-sm dark:bg-cyan-300/15 dark:text-white"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white")
                }
              >
                Flexible
              </button>
            </div>
          </div>

          {candidateMode === "STRICT" && candidateInfo.strictCount === 0 && (
            <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-100">
              <div className="font-black">No strict candidates found.</div>
              <div className="mt-1 text-xs leading-relaxed">
                Your sell strikes are outside the current target zone. Try adding strikes near{" "}
                ${candidateInfo.zone}, or switch to <b>Flexible</b> mode to see more aggressive ideas.
              </div>
            </div>
          )}

          {candidateMode === "FLEXIBLE" &&
            candidateInfo.strictCount === 0 &&
            candidateInfo.flexibleCount > 0 && (
              <div className="mb-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-300/25 dark:bg-sky-300/10 dark:text-sky-100">
                <div className="font-black">Flexible mode is showing aggressive ideas.</div>
                <div className="mt-1 text-xs leading-relaxed">
                  These candidates may be outside the strict target zone, so they may need a larger
                  move than the model target. Use this only when you intentionally want more upside risk.
                </div>
              </div>
            )}

          {candidateInfo.flexibleCount === 0 && (
            <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-300/25 dark:bg-rose-500/10 dark:text-rose-100">
              <div className="font-black">No candidates found from this strike list.</div>
              <div className="mt-1 text-xs leading-relaxed">
                Add more strikes around the current price and the target price, then try again.
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-3">
            {candidates.map((c, i) => (
              <div
                key={i}
                className={`rounded-2xl border p-4 shadow-sm ${
                  i === 0
                    ? "bg-gradient-to-br from-blue-50 to-white border-blue-100 dark:from-[#0f1d33] dark:to-[#0b1423] dark:border-blue-300/20 dark:from-[#0f1d33] dark:to-[#0b1423] dark:border-blue-300/20"
                    : "bg-gradient-to-br from-emerald-50 to-white border-emerald-100 dark:from-[#0d2421] dark:to-[#0b1423] dark:border-emerald-300/20 dark:from-[#0d2421] dark:to-[#0b1423] dark:border-emerald-300/20"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Suggested Candidate {i + 1}
                  </div>

                  <div
                    className={
                      "rounded-full px-2 py-0.5 text-[9px] font-black border " +
                      (c.strict
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-300/10 dark:text-emerald-100 dark:border-emerald-200/20"
                        : "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-300/10 dark:text-amber-100 dark:border-amber-200/20")
                    }
                  >
                    {c.strict ? "STRICT" : "FLEXIBLE"}
                  </div>
                </div>

                <div className="text-xl font-black text-slate-950 dark:text-white mt-1 dark:text-white">
                  Buy {c.buy} / Sell {c.sell}
                </div>

                <div className="text-sm text-slate-600 mt-1 dark:text-slate-300">
                  Width {c.width} · Target ${c.target}
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 dark:text-slate-400">
                  Sell zone: {c.zone}
                </div>

                <div className="text-[10px] text-slate-400 mt-1 dark:text-slate-500">
                  {c.label}
                  {!c.strict &&
                    ` · ${money(c.distanceFromZone)} away from strict zone`}
                </div>
                
                <div className="text-[10px] text-slate-400 mt-1 dark:text-slate-500">
                  {c.label}
                  {!c.strict &&
                    ` · ${money(c.distanceFromZone)} away from strict zone`}
                </div>

                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() =>
                      applyCandidateToSlot(
                        i === 0 ? "A" : i === 1 ? "B" : i === 2 ? "C" : "D",
                        c
                      )
                    }
                    className={
                      "rounded-xl px-4 py-2 text-[10px] font-black text-white shadow-sm " +
                      (i === 0
                        ? "bg-blue-600 hover:bg-blue-700"
                        : i === 1
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : i === 2
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "bg-amber-600 hover:bg-amber-700")
                    }
                  >
                    Use as Candidate{" "}
                    {i === 0 ? "A" : i === 1 ? "B" : i === 2 ? "C" : "D"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <SpreadEditor
            title="Candidate A"
            theme="blue"
            subtitle="Conservative spread choice"
            result={resultA}
            spread={spreadA}
            onChange={(side, key, value) => setLeg("A", side, key, value)}
          />
        
          <SpreadEditor
            title="Candidate B"
            theme="emerald"
            subtitle="Second conservative spread choice"
            result={resultB}
            spread={spreadB}
            onChange={(side, key, value) => setLeg("B", side, key, value)}
          />
        
          <SpreadEditor
            title="Candidate C"
            theme="blue"
            subtitle="Alternative spread choice"
            result={resultC}
            spread={spreadC}
            onChange={(side, key, value) => setLeg("C", side, key, value)}
          />
        
          <SpreadEditor
            title="Candidate D"
            theme="emerald"
            subtitle="Second alternative spread choice"
            result={resultD}
            spread={spreadD}
            onChange={(side, key, value) => setLeg("D", side, key, value)}
          />
        </div>

        {!hasCompared ? (
          <div className="rounded-3xl border-2 border-dashed border-indigo-200 bg-white/90 p-7 text-center shadow-sm dark:border-indigo-300/25 dark:bg-[#0b1423]/85">
            <div className="text-2xl font-black text-slate-950 dark:text-white">
              Ready to compare both spreads?
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              I will compare breakeven, liquidity, bid/ask width, theta, estimated
              slippage, expected profit, and whether your contract size is safe.
            </p>

            <button
              type="button"
              onClick={() => setHasCompared(true)}
              className="mt-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 px-8 py-3 text-sm font-black text-white shadow-lg hover:opacity-90 active:scale-[0.99]"
            >
              Compare Spreads
            </button>
          </div>
        ) : (
          <div className={`rounded-3xl border p-6 space-y-3 shadow-xl ${badgeStyle(final.decision)} bg-opacity-80`}>
            <div className="text-xs uppercase tracking-wide opacity-80">
              Final comparison result
            </div>
            <div className="text-2xl font-black">{final.action}</div>
            <div className="text-sm">{final.why}</div>
            <div className="text-sm">
              <b>Next:</b> {final.next}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4 text-sm text-yellow-900 space-y-2 dark:border-yellow-300/25 dark:bg-yellow-300/10 dark:text-yellow-100">
          <div className="font-black">Beginner liquidity reminder</div>
          <div>
            <b>Volume</b> is today’s activity. <b>Open interest</b> is currently open contracts.
            Low volume/OI does not prove you cannot exit later, but it means the option is less active.
          </div>
          <div>
            A debit spread controls risk better than buying one single option, but both legs still need a fair fill.
            Use limit orders only.
          </div>
          <div>
            Profit numbers are estimates after theta and estimated slippage. They are not guaranteed.
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, text, color }: { title: string; text: string; color: "blue" | "emerald" | "amber" }) {
  const cls =
    color === "blue"
      ? "bg-blue-50 border-blue-100 text-blue-900 dark:bg-blue-300/10 dark:border-blue-300/25 dark:text-blue-100"
      : color === "emerald"
      ? "bg-emerald-50 border-emerald-100 text-emerald-900 dark:bg-emerald-300/10 dark:border-emerald-300/25 dark:text-emerald-100"
      : "bg-amber-50 border-amber-100 text-amber-900 dark:bg-amber-300/10 dark:border-amber-300/25 dark:text-amber-100";

  return (
    <div className={`rounded-2xl border p-4 text-sm shadow-sm ${cls}`}>
      <div className="font-black">{title}</div>
      <div className="mt-1 opacity-90">{text}</div>
    </div>
  );
}

function SpreadEditor({
  title,
  subtitle,
  spread,
  result,
  onChange,
  theme,
}: {
  title: string;
  subtitle: string;
  spread: SpreadInput;
  result: any;
  onChange: (side: "buyLeg" | "sellLeg", key: keyof Leg, value: string) => void;
  theme: "blue" | "emerald";
}) {
  const cardTheme =
    theme === "blue"
      ? "from-blue-50 to-white border-blue-100 dark:from-[#0f1d33] dark:to-[#0b1423] dark:border-blue-300/20"
      : "from-emerald-50 to-white border-emerald-100 dark:from-[#0d2421] dark:to-[#0b1423] dark:border-emerald-300/20";

  return (
    <div className={`rounded-3xl bg-gradient-to-br ${cardTheme} border p-5 shadow-sm space-y-5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xl font-black text-slate-950 dark:text-white">{title}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</div>
          <div className="text-sm font-bold text-slate-700 mt-1 dark:text-slate-200">
            Buy {result.buyStrike} / Sell {result.sellStrike}
          </div>
        </div>

        <div className={`rounded-full border px-3 py-1 text-xs font-black ${badgeStyle(result.decision)}`}>
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
        <Stat label="Breakeven move" value={`${money(result.breakevenMovePct)}%`} help="Lower is better." />
        <Stat label="Cost / max loss" value={`$${money(result.maxLoss)}`} help="Most you can lose." />
        <Stat label="Max profit" value={`$${money(result.maxProfit)}`} help="Best case near expiration." />
        <Stat label="Expected profit" value={`$${money(result.expectedProfit)}`} help="After theta/slippage estimate." />
        <Stat label="Theta/day" value={`$${money(result.thetaDaily)}`} help="Time decay estimate." />
        <Stat label="Est. slippage" value={`$${money(result.totalSlip)}`} help="Bid/ask cost estimate." />
        <Stat label="Fast profit" value={`$${money(result.fastProfit)}`} help="If target hits fast." />
        <Stat label="Slow profit" value={`$${money(result.slowProfit)}`} help="If target takes longer." />
      </div>

      <div className="rounded-2xl border border-white bg-white/80 p-4 text-xs space-y-1 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
        <div>
          <b>Buy liquidity:</b> {result.buyLiq.grade} · spread{" "}
          {result.buyLiq.spreadPct}% · OI {result.buyLiq.openInterest} · volume{" "}
          {result.buyLiq.volume}
        </div>
        <div>
          <b>Sell liquidity:</b> {result.sellLiq.grade} · spread{" "}
          {result.sellLiq.spreadPct}% · OI {result.sellLiq.openInterest} · volume{" "}
          {result.sellLiq.volume}
        </div>
        <div>
          <b>Size safety:</b> {result.sizeCheck.status} — suggested max{" "}
          {result.sizeCheck.maxSuggested}
        </div>
        <div>
          <b>IV:</b> {result.ivStatus} — {result.ivNote}
        </div>
        <div>
          <b>Notes:</b> {result.notes.join(" ")}
        </div>
      </div>

      <ReasonBox result={result} />
    </div>
  );
}

function ReasonBox({ result }: { result: any }) {
  const badReasons: string[] = [];

  if (result.breakevenMovePct > 4.5) {
    badReasons.push(
      `Breakeven needs ${money(result.breakevenMovePct)}%. That may be too much if your model expects about a 4% move.`
    );
  }

  if (result.buyLiq.grade === "BAD") {
    badReasons.push(
      `Buy leg liquidity is BAD. Volume ${result.buyLiq.volume}, OI ${result.buyLiq.openInterest}, bid/ask spread ${result.buyLiq.spreadPct}%. This does not mean you cannot exit, but the exit price may be worse.`
    );
  }

  if (result.sellLiq.grade === "BAD") {
    badReasons.push(
      `Sell leg liquidity is BAD. Volume ${result.sellLiq.volume}, OI ${result.sellLiq.openInterest}, bid/ask spread ${result.sellLiq.spreadPct}%. One weak leg can make the whole spread harder to close cleanly.`
    );
  }

  if (result.debit > result.width * 0.65) {
    badReasons.push(
      `The spread is too expensive. You are paying ${money(result.debit)} for a ${result.width}-wide spread, which leaves limited upside.`
    );
  }
  
  if (result.rewardRisk < 0.75) {
    badReasons.push(
      `Reward vs risk is weak. The potential profit is not large enough compared to what you are risking.`
    );
  }
  
  if (result.expectedProfit <= 0) {
    badReasons.push(
      "Estimated profit is negative after theta and slippage. That means the stock could move correctly, but the spread may still not pay enough."
    );
  }

  if (result.sizeCheck.status === "TOO LARGE") {
    badReasons.push(
      `The contract size is too large for current liquidity. Suggested max: ${result.sizeCheck.maxSuggested}.`
    );
  }

  if (badReasons.length === 0) {
    badReasons.push(
      "No major red flag found. Still use a limit order and confirm the live fill before entering."
    );
  }

  return (
    <div
      className={
        "rounded-2xl border p-4 text-xs space-y-2 " +
        (result.decision === "SKIP"
          ? "bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-500/10 dark:border-rose-300/25 dark:text-rose-100"
          : result.decision.includes("WATCH")
          ? "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-300/10 dark:border-amber-300/25 dark:text-amber-100"
          : "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-300/10 dark:border-emerald-300/25 dark:text-emerald-100")
      }
    >
      <div className="text-sm font-black">
        {result.decision === "SKIP"
          ? "Why this says SKIP"
          : result.decision.includes("WATCH")
          ? "Why this needs caution"
          : "Why this passed"}
      </div>

      <ol className="list-decimal pl-4 space-y-1">
        {badReasons.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ol>

      <div className="pt-1 text-[11px] opacity-90">
        Plain English: low volume or low open interest does not prove there will
        be no buyer later. It means the contract is less active, so you may need
        to accept a worse price to close.
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
    <div className="rounded-2xl border border-white bg-white/80 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-xs font-black text-slate-700 mb-2 dark:text-slate-200">{title}</div>
      <div className="grid grid-cols-2 gap-2">
        {keys.map((k) => (
          <Input key={k} label={k} value={leg[k]} onChange={(v) => onChange(k, v)} />
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
      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none shadow-sm focus:ring-2 focus:ring-sky-300 dark:border-white/15 dark:bg-[#111827] dark:text-slate-100 dark:placeholder:text-slate-500"
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
      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none shadow-sm focus:ring-2 focus:ring-sky-300 dark:border-white/15 dark:bg-[#111827] dark:text-slate-100 dark:placeholder:text-slate-500"
      >
        <option value="UP">UP</option>
        <option value="DOWN">DOWN</option>
      </select>
    </label>
  );
}

function Stat({ label, value, help }: { label: string; value: string; help: string }) {
  return (
    <div className="rounded-2xl border border-white bg-white/80 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{label}</div>
      <div className="text-sm font-black text-slate-950 dark:text-white">{value}</div>
      <div className="text-[10px] text-slate-400 mt-0.5 dark:text-slate-500">{help}</div>
    </div>
  );
}
