"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type SectorGroups = Record<string, string[]>;

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
    fillA: `hsla(${hue}, 80%, 62%, 0.35)`,
    fillB: `hsla(${hue}, 80%, 52%, 0.22)`,
    stroke: `hsla(${hue}, 85%, 45%, 0.38)`,
    ring: `hsla(${hue}, 85%, 45%, 0.18)`,
    glow: `hsla(${hue}, 90%, 52%, 0.35)`,
    text: `hsla(${hue}, 30%, 18%, 0.92)`,
    textDim: `hsla(${hue}, 20%, 20%, 0.65)`,
    chipBg: `hsla(${hue}, 55%, 97%, 1)`,
    chipBorder: `hsla(${hue}, 55%, 82%, 1)`,
    chipText: `hsla(${hue}, 35%, 22%, 1)`,
  };
}

type Bubble = {
  key: string;
  n: number;
  r: number;
  x: number;
  y: number;
};

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

// Non-overlapping bubble layout (fast relaxation).
function packBubblesRelaxed(items: Array<{ key: string; n: number }>, W: number, H: number): Bubble[] {
  const pad = 18;
  const margin = 26;

  const nMax = Math.max(1, ...items.map((k) => k.n));

  // radii scale (sqrt) so big categories don't dominate too hard
  const minR = 48;
  const maxR = Math.min(W, H) * 0.19;
  const radiusFor = (n: number) => {
    const t = Math.sqrt(n / nMax);
    return minR + t * (maxR - minR);
  };

  const bubbles: Bubble[] = items
    .map((k) => ({ key: k.key, n: k.n, r: radiusFor(k.n), x: 0, y: 0 }))
    .sort((a, b) => b.r - a.r);

  // initial positions (sunflower / golden angle) spread across canvas
  const cx = W / 2;
  const cy = H / 2;
  const ga = Math.PI * (3 - Math.sqrt(5)); // golden angle
  const spread = Math.min(W, H) * 0.33;

  for (let i = 0; i < bubbles.length; i++) {
    const t = i / Math.max(1, bubbles.length - 1);
    const ang = i * ga;
    const rad = Math.sqrt(t) * spread;
    bubbles[i].x = cx + Math.cos(ang) * rad;
    bubbles[i].y = cy + Math.sin(ang) * rad;
  }

  const iter = 420;
  for (let step = 0; step < iter; step++) {
    // gentle pull to center (keeps layout compact)
    for (const b of bubbles) {
      b.x += (cx - b.x) * 0.002;
      b.y += (cy - b.y) * 0.002;
    }

    // resolve overlaps
    for (let i = 0; i < bubbles.length; i++) {
      for (let j = i + 1; j < bubbles.length; j++) {
        const a = bubbles[i];
        const b = bubbles[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        const minDist = a.r + b.r + pad;
        if (dist < minDist) {
          const push = (minDist - dist) / dist;
          const px = dx * push * 0.5;
          const py = dy * push * 0.5;
          // heavier bubble moves less
          const wa = 1 / (a.r * a.r);
          const wb = 1 / (b.r * b.r);
          const s = wa + wb;
          const ma = wb / s;
          const mb = wa / s;
          a.x -= px * ma;
          a.y -= py * ma;
          b.x += px * mb;
          b.y += py * mb;
        }
      }
    }

    // keep within bounds
    for (const b of bubbles) {
      b.x = clamp(b.x, margin + b.r, W - margin - b.r);
      b.y = clamp(b.y, margin + b.r, H - margin - b.r);
    }
  }

  return bubbles;
}

function splitLabel(label: string): string[] {
  // two-line labels for better readability inside bubbles
  if (label.length <= 16) return [label];
  // prefer split around " (" or " / " or " - " or last space near middle
  const preferred = [" (", " / ", " - "];
  for (const p of preferred) {
    const idx = label.indexOf(p);
    if (idx > 7 && idx < 22) {
      return [label.slice(0, idx).trim(), label.slice(idx).trim()];
    }
  }
  const mid = Math.floor(label.length / 2);
  let best = -1;
  for (let i = mid; i >= 10; i--) {
    if (label[i] === " ") {
      best = i;
      break;
    }
  }
  if (best === -1) return [label];
  return [label.slice(0, best).trim(), label.slice(best + 1).trim()];
}

// ✅ HARD-CODED sector buckets (ALL 2000 tickers) from your exported file
const GROUPS: SectorGroups = {
  "Agriculture/Forestry/Fishing": [
    "AGRO",
    "CALM",
    "VFF"
  ],
  "Communication Services (Telecom)": [
    "ADEA",
    "AMCX",
    "AMX",
    "ASTS",
    "CCOI",
    "CHTR",
    "CMCSA",
    "FOXA",
    "GLIBK",
    "GSAT",
    "GTN",
    "IHRT",
    "IHS",
    "IRDM",
    "LBRDK",
    "LUMN",
    "NMAX",
    "PSKY",
    "ROKU",
    "SATS",
    "SBGI",
    "SIRI",
    "SPIR",
    "SPOT",
    "SSP",
    "SURG",
    "T",
    "TDS",
    "TME",
    "TMUS",
    "TSAT",
    "TSQ",
    "TTGT",
    "UNIT",
    "UONEK",
    "VOD",
    "VSAT",
    "VZ",
    "WBD"
  ],
  "Construction": [
    "AMRC",
    "BBCP",
    "BZH",
    "DHI",
    "DY",
    "FIX",
    "GEO",
    "GRBK",
    "GVA",
    "LEN",
    "MTZ",
    "PHM",
    "STRL",
    "TOL",
    "TPC",
    "TPH"
  ],
  "Consumer (Retail)": [
    "AAP",
    "ABG",
    "ACI",
    "AEO",
    "AMZN",
    "ANF",
    "ARHS",
    "ARMK",
    "ASO",
    "BARK",
    "BBBY",
    "BBWI",
    "BBY",
    "BJ",
    "BKE",
    "BLMN",
    "BNED",
    "BROS",
    "BURL",
    "CAKE",
    "CAVA",
    "CBRL",
    "CHWY",
    "CMG",
    "COST",
    "CPNG",
    "CTRN",
    "CVNA",
    "CVS",
    "DBI",
    "DDL",
    "DG",
    "DKS",
    "DLTR",
    "DNUT",
    "DRI",
    "EAT",
    "ELA",
    "FIVE",
    "FLWS",
    "FND",
    "GAP",
    "GCO",
    "GCT",
    "GME",
    "GO",
    "HD",
    "JACK",
    "JD",
    "JMIA",
    "KMX",
    "KR",
    "KSS",
    "LESL",
    "LOW",
    "LUXE",
    "LVO",
    "M",
    "MCD",
    "OLLI",
    "PETS",
    "PLAY",
    "PLBY",
    "PLCE",
    "PTLO",
    "PZZA",
    "QVCGA",
    "REAL",
    "RH",
    "ROST",
    "RVLV",
    "SBUX",
    "SFIX",
    "SFM",
    "SG",
    "SHAK",
    "SIG",
    "STKS",
    "SVV",
    "TGT",
    "TJX",
    "TSCO",
    "TXRH",
    "ULTA",
    "URBN",
    "VIPS",
    "VRM",
    "VSCO",
    "W",
    "WEN",
    "WMT",
    "WOOF"
  ],
  "ETF (Commodity)": [
    "FCG",
    "GDX",
    "GDXJ",
    "GLD",
    "IAU",
    "SILJ",
    "SLV",
    "UNG",
    "USO",
    "XHB"
  ],
  "ETF (Index)": [
    "DIA",
    "DVY",
    "EDV",
    "EEM",
    "EFA",
    "EMB",
    "EWG",
    "EWJ",
    "EWZ",
    "FXI",
    "HYG",
    "IEF",
    "IVV",
    "IWM",
    "IYR",
    "LQD",
    "QQQ",
    "RSP",
    "SCHD",
    "SPY",
    "TLT",
    "VOO"
  ],
  "ETF (Leveraged/Inverse)": [
    "BDN",
    "BOIL",
    "BULL",
    "CCUP",
    "DRIP",
    "DUST",
    "ELDN",
    "FAS",
    "JDST",
    "KOLD",
    "LABD",
    "LABU",
    "MSTU",
    "MSTX",
    "MSTY",
    "MSTZ",
    "NUGT",
    "NVDL",
    "NVDS",
    "NVDU",
    "NVDX",
    "SMUP",
    "SOXL",
    "SOXS",
    "SPXL",
    "SPXS",
    "SPXU",
    "SQQQ",
    "SSO",
    "SVIX",
    "TECL",
    "TMF",
    "TNA",
    "TQQQ",
    "TSLL",
    "TSLQ",
    "TSLT",
    "TSLZ",
    "TZA",
    "UP",
    "UPRO",
    "UVIX",
    "UVXY",
    "VRDN",
    "VXX"
  ],
  "ETF (Sector)": [
    "ICLN",
    "JETS",
    "KRE",
    "KWEB",
    "URA",
    "XBI",
    "XLB",
    "XLC",
    "XLE",
    "XLF",
    "XLI",
    "XLK",
    "XLP",
    "XLU",
    "XLV",
    "XLY",
    "XOP",
    "XRT"
  ],
  "ETP (Crypto)": [
    "BITO",
    "BITX",
    "EETH",
    "ETH",
    "ETHA",
    "ETHD",
    "ETHE",
    "ETHT",
    "ETHZ",
    "FBTC",
    "GBTC",
    "IBIT"
  ],
  "Energy (Oil & Gas)": [
    "ACDC",
    "AESI",
    "AMPY",
    "APA",
    "AR",
    "BKV",
    "BTE",
    "CHRD",
    "CLB",
    "CNQ",
    "CRC",
    "CRGY",
    "CRK",
    "CTRA",
    "CVE",
    "DVN",
    "EC",
    "EOG",
    "EPSN",
    "EQT",
    "EXE",
    "FANG",
    "HAL",
    "HESM",
    "HP",
    "HPK",
    "KLXE",
    "KOS",
    "MGY",
    "NOG",
    "NUAI",
    "OBE",
    "OII",
    "OXY",
    "PBR",
    "RIG",
    "RRC",
    "SDRL",
    "SHEL",
    "SLB",
    "SM",
    "SOC",
    "TALO",
    "TTI",
    "VAL",
    "VIST",
    "VNOM",
    "VOC",
    "WDS",
    "WTTR",
    "XPRO"
  ],
  "Energy (Refining)": [
    "BP",
    "CLMT",
    "COP",
    "CVI",
    "CVX",
    "DK",
    "EQNR",
    "MPC",
    "PBF",
    "PSX",
    "SU",
    "VLO",
    "VVV",
    "XOM",
    "YPF"
  ],
  "Financials/Real Estate": [
    "AAMI",
    "ABCB",
    "ABR",
    "ABTC",
    "ACGL",
    "AEXA",
    "AFL",
    "AFRM",
    "AGNC",
    "AGQ",
    "AIFU",
    "AIG",
    "ALHC",
    "ALRS",
    "ALTS",
    "AMBR",
    "AMH",
    "AMP",
    "AMT",
    "ANY",
    "APO",
    "APPS",
    "ARBK",
    "ARE",
    "ARES",
    "ASB",
    "ASST",
    "AUB",
    "AXP",
    "BAC",
    "BAM",
    "BBAR",
    "BBT",
    "BCS",
    "BEKE",
    "BFST",
    "BHF",
    "BITF",
    "BK",
    "BKKT",
    "BLK",
    "BLSH",
    "BMNR",
    "BN",
    "BNL",
    "BRO",
    "BRR",
    "BSOL",
    "BTBT",
    "BTDR",
    "BUSE",
    "BWET",
    "BWIN",
    "BX",
    "C",
    "CAN",
    "CATY",
    "CBOE",
    "CBRE",
    "CBSH",
    "CCBG",
    "CDP",
    "CG",
    "CHMI",
    "CHYM",
    "CI",
    "CIA",
    "CIFR",
    "CLDT",
    "CLOV",
    "CLSK",
    "CME",
    "CMTG",
    "CNC",
    "CNO",
    "COF",
    "COIN",
    "COMP",
    "CORZ",
    "CPT",
    "CRCL",
    "CSR",
    "CTBI",
    "CTRE",
    "CUBE",
    "CWK",
    "CZNC",
    "DB",
    "DBRG",
    "DEI",
    "DFDV",
    "DGXX",
    "DLR",
    "DOUG",
    "EBC",
    "ECPG",
    "EGBN",
    "EHTH",
    "EIG",
    "ELME",
    "ELS",
    "EQBK",
    "EQIX",
    "ESNT",
    "ESS",
    "EZBC",
    "FFBC",
    "FFIN",
    "FG",
    "FGNX",
    "FHN",
    "FIGR",
    "FISI",
    "FLG",
    "FNF",
    "FRGE",
    "FSP",
    "FUTU",
    "FWDI",
    "GDOT",
    "GEMI",
    "GGAL",
    "GLXY",
    "GPMT",
    "GS",
    "HASI",
    "HIVE",
    "HLNE",
    "HOOD",
    "HOPE",
    "HR",
    "HRTG",
    "HSBC",
    "HST",
    "HTBK",
    "HUM",
    "HUT",
    "IBKR",
    "ICE",
    "INVH",
    "IREN",
    "IRM",
    "JEF",
    "JPM",
    "JRVR",
    "KKR",
    "LB",
    "LC",
    "LDI",
    "LINE",
    "LMND",
    "LNC",
    "LPRO",
    "LX",
    "LXP",
    "MAC",
    "MARA",
    "MC",
    "MCHB",
    "MIAX",
    "MOH",
    "MRP",
    "MRX",
    "MS",
    "MSTR",
    "MTG",
    "MUFG",
    "NAKA",
    "NDAQ",
    "NLY",
    "NRT",
    "NSA",
    "NTST",
    "NU",
    "OPAD",
    "OPEN",
    "OPRT",
    "ORBS",
    "ORC",
    "OSCR",
    "OWL",
    "PEB",
    "PGR",
    "PGY",
    "PKST",
    "PLD",
    "PNC",
    "PNFP",
    "QFIN",
    "RC",
    "RILY",
    "RIOT",
    "RKT",
    "RYAN",
    "RYN",
    "SAN",
    "SBCF",
    "SBET",
    "SCHW",
    "SIEB",
    "SKYH",
    "SLAI",
    "SLDE",
    "SLG",
    "SLM",
    "SLQT",
    "SMA",
    "SOFI",
    "SSRM",
    "SUIG",
    "SUPV",
    "SVC",
    "TBBK",
    "TFC",
    "TIGR",
    "TPG",
    "TWO",
    "UBSI",
    "UCB",
    "UNH",
    "UPST",
    "UPXI",
    "USB",
    "UWMC",
    "VNO",
    "WFC",
    "WNEB",
    "WRB",
    "WULF",
    "WY",
    "WYFI",
    "XP",
    "YRD"
  ],
  "Healthcare (Medical Devices)": [
    "ALC",
    "ALGN",
    "ANGO",
    "APT",
    "ATEC",
    "BAX",
    "BBNX",
    "BFLY",
    "BLFS",
    "BSX",
    "CLPT",
    "CNMD",
    "CODX",
    "CTSO",
    "CVRX",
    "DCTH",
    "DRIO",
    "DXCM",
    "EMBC",
    "ENOV",
    "ESTA",
    "EYE",
    "GEHC",
    "GKOS",
    "GMED",
    "HSDT",
    "HTFL",
    "INSP",
    "ISRG",
    "KRMD",
    "LFWD",
    "MBOT",
    "MDT",
    "MMM",
    "MYO",
    "NNOX",
    "NSPR",
    "NVST",
    "OBIO",
    "OM",
    "SGHT",
    "SKIN",
    "STAA",
    "STIM",
    "STSS",
    "STVN",
    "STXS",
    "TELA",
    "TMCI",
    "TMDX",
    "TNDM",
    "WRBY",
    "XAIR"
  ],
  "Healthcare (Pharma)": [
    "ABBV",
    "ABCL",
    "ABT",
    "ABVC",
    "ABVX",
    "ACAD",
    "ACB",
    "ACHV",
    "ACLX",
    "ACRS",
    "ACXP",
    "ADCT",
    "ADMA",
    "ADPT",
    "AGIO",
    "AKBA",
    "ALDX",
    "ALEC",
    "ALKS",
    "ALLO",
    "ALMS",
    "ALNY",
    "ALT",
    "ALXO",
    "AMGN",
    "AMLX",
    "AMRN",
    "ANAB",
    "ANNX",
    "ANRO",
    "ANVS",
    "APGE",
    "APLS",
    "AQST",
    "ARCT",
    "ARDX",
    "ARQT",
    "ASMB",
    "ATAI",
    "ATOS",
    "ATYR",
    "AUTL",
    "AVTX",
    "AXSM",
    "BBIO",
    "BCAB",
    "BCAX",
    "BCRX",
    "BEAM",
    "BHC",
    "BHVN",
    "BIIB",
    "BLRX",
    "BMEA",
    "BMRN",
    "BMY",
    "BNTC",
    "BTAI",
    "CABA",
    "CAPR",
    "CATX",
    "CCCC",
    "CELU",
    "CGC",
    "CGEM",
    "CGEN",
    "CMPS",
    "CNTA",
    "COGT",
    "CPIX",
    "CRBU",
    "CRDF",
    "CRMD",
    "CRON",
    "CRSP",
    "CRVS",
    "CTMX",
    "CTXR",
    "CVM",
    "CYRX",
    "CYTK",
    "DAWN",
    "DNA",
    "DNLI",
    "DNTH",
    "DYAI",
    "DYN",
    "EBS",
    "EDIT",
    "ELAN",
    "ELVN",
    "ENTA",
    "ENTX",
    "EOLS",
    "EQ",
    "ESPR",
    "EWTX",
    "EXEL",
    "FATE",
    "FBIO",
    "FDMT",
    "FHTX",
    "FULC",
    "GALT",
    "GERN",
    "GHRS",
    "GILD",
    "GLUE",
    "GMAB",
    "GOSS",
    "GPCR",
    "GSK",
    "HOWL",
    "HRMY",
    "HUMA",
    "HYFT",
    "IBRX",
    "IFRX",
    "IMMX",
    "IMNM",
    "IMRX",
    "INBX",
    "INDV",
    "INO",
    "INSM",
    "IOVA",
    "IRD",
    "IVVD",
    "JANX",
    "JAZZ",
    "JNJ",
    "JSPR",
    "KOD",
    "KPTI",
    "KROS",
    "KRRO",
    "KYTX",
    "LENZ",
    "LFCR",
    "LLY",
    "LNAI",
    "LNTH",
    "LQDA",
    "LRMR",
    "LTRN",
    "LXEO",
    "LXRX",
    "LYEL",
    "MBX",
    "MCRB",
    "MIRM",
    "MIST",
    "MLTX",
    "MLYS",
    "MNKD",
    "MRK",
    "MRNA",
    "MYGN",
    "NAGE",
    "NAMS",
    "NBP",
    "NEOG",
    "NGNE",
    "NKTX",
    "NMRA",
    "NNVC",
    "NRIX",
    "NRXP",
    "NTLA",
    "NUVB",
    "NVAX",
    "NVO",
    "OCUL",
    "OGN",
    "OLMA",
    "OMER",
    "ORGO",
    "ORKA",
    "OTLK",
    "PBYI",
    "PCRX",
    "PCVX",
    "PDSB",
    "PFE",
    "PGEN",
    "PLX",
    "PMVP",
    "PPBT",
    "PRAX",
    "PRGO",
    "PRLD",
    "PRME",
    "PROK",
    "PRPH",
    "PRQR",
    "PRTA",
    "PTCT",
    "PVLA",
    "QURE",
    "RANI",
    "RAPP",
    "RCKT",
    "REGN",
    "REPL",
    "RGC",
    "RIGL",
    "RLAY",
    "RLMD",
    "RMTI",
    "ROIV",
    "RVPH",
    "RXRX",
    "RZLT",
    "SANA",
    "SAVA",
    "SEPN",
    "SGMO",
    "SGMT",
    "SIGA",
    "SKYE",
    "SLN",
    "SLNO",
    "SLS",
    "SMMT",
    "SNDX",
    "SPRO",
    "SPRY",
    "SRPT",
    "SRRK",
    "STOK",
    "STRO",
    "SUPN",
    "SVRA",
    "SYRE",
    "TARA",
    "TARS",
    "TECH",
    "TECX",
    "TERN",
    "TEVA",
    "TGTX",
    "TLRY",
    "TNGX",
    "TNXP",
    "TNYA",
    "TRIB",
    "TRVI",
    "TSHA",
    "TVRD",
    "TWST",
    "UNCY",
    "UPB",
    "URGN",
    "VCEL",
    "VERA",
    "VERU",
    "VIR",
    "VKTX",
    "VNDA",
    "VOR",
    "VRTX",
    "VSTM",
    "VTYX",
    "VYGR",
    "WVE",
    "XENE",
    "XERS",
    "XFOR",
    "XNCR",
    "ZBIO",
    "ZLAB",
    "ZTS",
    "ZURA",
    "ZVRA"
  ],
  "Healthcare (Providers/Services)": [
    "AIRS",
    "AVAH",
    "BDSX",
    "BKD",
    "BTSG",
    "CAI",
    "CELC",
    "CYH",
    "DCGO",
    "FTRE",
    "GH",
    "GRAL",
    "HCSG",
    "HIMS",
    "LFMD",
    "LFST",
    "NTRA",
    "OPCH",
    "PACS",
    "PGNY",
    "PSNL",
    "RDNT",
    "SERA",
    "SGRY",
    "SRTA",
    "TDOC",
    "TOI",
    "UHS",
    "VCYT",
    "WGS",
    "XGN"
  ],
  "Manufacturing": [
    "A",
    "AA",
    "ABEV",
    "ABVE",
    "ACMR",
    "AEHR",
    "AGCO",
    "AIRJ",
    "ALB",
    "ALH",
    "ALTO",
    "AME",
    "AMPX",
    "AMRZ",
    "AMSC",
    "AMTX",
    "AOUT",
    "AP",
    "APD",
    "AQMS",
    "ARRY",
    "AS",
    "ASML",
    "ASPI",
    "ATER",
    "ATI",
    "AVD",
    "AVNT",
    "BC",
    "BE",
    "BG",
    "BIOX",
    "BIRK",
    "BLDP",
    "BLNK",
    "BNKK",
    "BOOM",
    "BRCC",
    "BRKR",
    "BRLT",
    "BUD",
    "BW",
    "BWEN",
    "BWXT",
    "BYND",
    "BYRN",
    "CAG",
    "CAL",
    "CAPT",
    "CAT",
    "CBAT",
    "CBUS",
    "CC",
    "CCU",
    "CE",
    "CELH",
    "CENX",
    "CF",
    "CGNX",
    "CHD",
    "CHPT",
    "CL",
    "CMC",
    "CMI",
    "CNH",
    "COCO",
    "CODI",
    "COHR",
    "COKE",
    "COLM",
    "CPB",
    "CR",
    "CRH",
    "CRI",
    "CROX",
    "CSL",
    "CSTM",
    "CSW",
    "CTAS",
    "CTKB",
    "CW",
    "CXT",
    "DAIO",
    "DAKT",
    "DE",
    "DECK",
    "DFLI",
    "DHR",
    "DOW",
    "DRS",
    "EAF",
    "ECL",
    "EL",
    "ELF",
    "EMR",
    "ENTG",
    "ENVX",
    "EOSE",
    "EPAC",
    "ERII",
    "ESI",
    "ETN",
    "EYPT",
    "FCEL",
    "FIGS",
    "FLNC",
    "FLO",
    "FLY",
    "FOSL",
    "FOXF",
    "FRPT",
    "FTI",
    "FTK",
    "GD",
    "GE",
    "GEOS",
    "GEV",
    "GGB",
    "GLW",
    "GNRC",
    "GNSS",
    "GOOS",
    "GPK",
    "GPRO",
    "GTES",
    "HII",
    "HLMN",
    "HOG",
    "HRL",
    "HSAI",
    "HSY",
    "HTOO",
    "HUN",
    "HWM",
    "HXL",
    "HY",
    "IFF",
    "ILMN",
    "IMAX",
    "IP",
    "ISPR",
    "ITP",
    "JBS",
    "JCI",
    "KDP",
    "KHC",
    "KLAC",
    "KMB",
    "KMT",
    "KO",
    "KODK",
    "KTOS",
    "KVUE",
    "LASE",
    "LEG",
    "LEVI",
    "LHX",
    "LMT",
    "LNZA",
    "LODE",
    "LOMA",
    "LPX",
    "LRCX",
    "LULU",
    "LUNR",
    "LW",
    "LWLG",
    "LYB",
    "LYTS",
    "MASS",
    "MAT",
    "MATV",
    "MBC",
    "MDLZ",
    "MEC",
    "MHK",
    "MIDD",
    "MIR",
    "MO",
    "MT",
    "MVST",
    "NKE",
    "NN",
    "NOMD",
    "NPWR",
    "NRGV",
    "NTR",
    "NWL",
    "NX",
    "OC",
    "ODD",
    "OI",
    "OLN",
    "ONON",
    "ORGN",
    "OUST",
    "OXM",
    "PACB",
    "PACK",
    "PCT",
    "PEP",
    "PG",
    "PII",
    "PLUG",
    "PM",
    "POST",
    "PPC",
    "PPG",
    "PPSI",
    "PRM",
    "PRMB",
    "PTON",
    "QS",
    "QSI",
    "QTRX",
    "RAIL",
    "RAL",
    "RDW",
    "RKLB",
    "RR",
    "RUN",
    "RVTY",
    "RYAM",
    "SEER",
    "SEI",
    "SENS",
    "SERV",
    "SES",
    "SHOO",
    "SLDP",
    "SLGN",
    "SLI",
    "SMR",
    "SNBR",
    "SOLS",
    "SONO",
    "SONY",
    "ST",
    "STZ",
    "SUZ",
    "SXC",
    "SYM",
    "TAP",
    "TER",
    "TEX",
    "TKR",
    "TMO",
    "TPR",
    "TREX",
    "TROX",
    "TS",
    "TSE",
    "TT",
    "TTC",
    "TWI",
    "TXG",
    "UA",
    "UAMY",
    "VFC",
    "VITL",
    "VOYG",
    "WBX",
    "WFRD",
    "WHD",
    "WLK",
    "WRAP",
    "WWD",
    "XXII",
    "YETI",
    "YSG"
  ],
  "Manufacturing (Aerospace)": [
    "ACHR",
    "AIR",
    "ATRO",
    "AVAV",
    "BA",
    "DPRO",
    "EH",
    "EVTL",
    "HON",
    "JOBY",
    "RTX",
    "SARO",
    "TXT"
  ],
  "Manufacturing (Automotive)": [
    "ADNT",
    "AEVA",
    "APTV",
    "BLBD",
    "CAAS",
    "CPS",
    "CVGI",
    "EMPD",
    "F",
    "FFAI",
    "GM",
    "GTX",
    "HYLN",
    "INVZ",
    "LCID",
    "LEA",
    "LI",
    "MGA",
    "MOD",
    "NIO",
    "OSK",
    "PATK",
    "PSNY",
    "RIVN",
    "SEV",
    "STLA",
    "TSLA",
    "VFS",
    "WKHS",
    "XPEV"
  ],
  "Media/Entertainment": [
    "AMC",
    "ANGX",
    "CNVS",
    "CURI",
    "FUBO",
    "IQ",
    "NFLX",
    "TOON"
  ],
  "Media/Publishing": [
    "TRI"
  ],
  "Mining": [
    "ABAT",
    "AEM",
    "AG",
    "AGI",
    "B",
    "BHP",
    "BTG",
    "BTU",
    "BVN",
    "CCJ",
    "CDE",
    "CLF",
    "CNR",
    "CRML",
    "DNN",
    "EQX",
    "ERO",
    "FCX",
    "GFI",
    "GROY",
    "GSM",
    "HBM",
    "HCC",
    "HL",
    "HMY",
    "HYMC",
    "IAG",
    "IDR",
    "IE",
    "KGC",
    "LAC",
    "LGO",
    "METC",
    "MP",
    "MUX",
    "NAK",
    "NB",
    "NEM",
    "NEWP",
    "NG",
    "NVA",
    "NXE",
    "ODV",
    "ORLA",
    "PAAS",
    "SA",
    "SCCO",
    "SGML",
    "SKE",
    "SQM",
    "SVM",
    "TECK",
    "TGB",
    "TMC",
    "TMQ",
    "UEC",
    "USAR",
    "USAS",
    "USAU",
    "UUUU",
    "VALE",
    "VMC",
    "WPM",
    "WWR"
  ],
  "Other/Services": [
    "ABM",
    "ABNB",
    "ABSI",
    "ACEL",
    "ACN",
    "ACVA",
    "ADV",
    "AKAM",
    "AMTM",
    "ANGI",
    "APG",
    "BABA",
    "BAH",
    "BATRA",
    "BGSF",
    "BRSL",
    "CAR",
    "CART",
    "CHGG",
    "CHH",
    "CNXC",
    "CRL",
    "CSGP",
    "CZR",
    "DASH",
    "DHX",
    "DIS",
    "DKNG",
    "DLO",
    "EBAY",
    "ETSY",
    "EVGO",
    "FIS",
    "FLL",
    "FTAI",
    "FUN",
    "GETY",
    "GPN",
    "GRAB",
    "GRPN",
    "HGV",
    "HLT",
    "HQY",
    "HTZ",
    "INCY",
    "IT",
    "KLC",
    "LTH",
    "LUCK",
    "LVS",
    "LYFT",
    "MA",
    "MAN",
    "MANU",
    "MAR",
    "MAX",
    "MELI",
    "MGM",
    "MLCO",
    "MMS",
    "MNY",
    "MSCI",
    "MXCT",
    "NCMI",
    "NEO",
    "NOTE",
    "NOTV",
    "NRDY",
    "NSP",
    "PAY",
    "PAYO",
    "PDD",
    "PENN",
    "PK",
    "PLNT",
    "PRKS",
    "PSFE",
    "PSQH",
    "PYPL",
    "RELY",
    "RHI",
    "RSI",
    "RSKD",
    "SE",
    "SGHC",
    "SHO",
    "SPGI",
    "STUB",
    "TAL",
    "TIC",
    "TNL",
    "TONX",
    "TSSI",
    "TTEK",
    "UBER",
    "UDMY",
    "UPBD",
    "URI",
    "V",
    "WH",
    "WMG",
    "WSC",
    "WW",
    "WYNN",
    "XPOF",
    "YELP",
    "YQ",
    "ZG"
  ],
  "Technology (Computers/Hardware)": [
    "AAPL",
    "ANET",
    "CSCO",
    "DELL",
    "DGII",
    "EVLV",
    "EXTR",
    "FFIV",
    "FTNT",
    "HPE",
    "HPQ",
    "IBM",
    "NTAP",
    "OMCL",
    "OSS",
    "PANW",
    "SMCI",
    "SNDK",
    "STX",
    "WDC",
    "ZEPP"
  ],
  "Technology (Semiconductors/Electronics)": [
    "AAOI",
    "ADI",
    "ALAB",
    "ALGM",
    "ALMU",
    "AMAT",
    "AMBA",
    "AMD",
    "AMPG",
    "AOSL",
    "APH",
    "ARM",
    "ASX",
    "ATOM",
    "AUDC",
    "AVGO",
    "AXTI",
    "BKSY",
    "CIEN",
    "CLS",
    "CMBM",
    "CMTL",
    "CRDO",
    "CRNT",
    "CSIQ",
    "ENPH",
    "FLEX",
    "FN",
    "FSLR",
    "FTCI",
    "GSIT",
    "HIMX",
    "INDI",
    "INSG",
    "INTC",
    "KLIC",
    "KOPN",
    "KULR",
    "LAES",
    "LASR",
    "LITE",
    "LPTH",
    "LSCC",
    "MAXN",
    "MCHP",
    "MEI",
    "MRVL",
    "MU",
    "MVIS",
    "MX",
    "MXL",
    "NEON",
    "NOK",
    "NVDA",
    "NVTS",
    "NXPI",
    "OLED",
    "ON",
    "ONDS",
    "PENG",
    "PI",
    "PL",
    "PLAB",
    "POET",
    "POWI",
    "QCOM",
    "QRVO",
    "SANM",
    "SATL",
    "SEDG",
    "SHLS",
    "SKYT",
    "SMTC",
    "SQNS",
    "STM",
    "SWKS",
    "SYNA",
    "TE",
    "TSM",
    "TTMI",
    "TXN",
    "UMAC",
    "UMC",
    "VIAV",
    "VREX",
    "VRT",
    "VSH",
    "VUZI",
    "WATT",
    "WOLF"
  ],
  "Technology (Software)": [
    "ADBE",
    "ADP",
    "ADSK",
    "AEYE",
    "AGYS",
    "AI",
    "AISP",
    "ALKT",
    "API",
    "APLD",
    "APP",
    "APPF",
    "APPN",
    "ARBE",
    "ARQQ",
    "ASAN",
    "ASUR",
    "AUR",
    "AVPT",
    "BAND",
    "BB",
    "BBAI",
    "BIDU",
    "BILI",
    "BILL",
    "BL",
    "BLZE",
    "BMBL",
    "BRAG",
    "BRZE",
    "BSY",
    "CARG",
    "CARS",
    "CCLD",
    "CCSI",
    "CDLX",
    "CDNS",
    "CFLT",
    "CGNT",
    "CINT",
    "CLVT",
    "CMRC",
    "CRM",
    "CRNC",
    "CRWD",
    "CRWV",
    "CVLT",
    "CWAN",
    "CXAI",
    "CXM",
    "DBX",
    "DCBO",
    "DDD",
    "DDOG",
    "DH",
    "DJT",
    "DMRC",
    "DOCN",
    "DOCS",
    "DOCU",
    "DSGX",
    "DSP",
    "DUOL",
    "DV",
    "EA",
    "EGHT",
    "ESTC",
    "EVTC",
    "FDS",
    "FIG",
    "FIVN",
    "FLUT",
    "FNGR",
    "FROG",
    "FRSH",
    "FSLY",
    "GDDY",
    "GDRX",
    "GDS",
    "GLBE",
    "GMGI",
    "GOOG",
    "GOOGL",
    "GRND",
    "GRRR",
    "GTLB",
    "GTM",
    "GWRE",
    "HCAT",
    "HNGE",
    "HUBS",
    "IAC",
    "INFY",
    "INOD",
    "INTU",
    "IONQ",
    "IOT",
    "KC",
    "KD",
    "KDK",
    "LDOS",
    "LIF",
    "LPSN",
    "LZ",
    "MBLY",
    "MDB",
    "META",
    "MSFT",
    "MTLS",
    "NBIS",
    "NCNO",
    "NET",
    "NOW",
    "NTNX",
    "NTSK",
    "OKTA",
    "ORCL",
    "PATH",
    "PAYC",
    "PCTY",
    "PD",
    "PDYN",
    "PEGA",
    "PHUN",
    "PINS",
    "PLTR",
    "PONY",
    "PRCH",
    "PUBM",
    "QBTS",
    "QTWO",
    "QUBT",
    "RBLX",
    "RBRK",
    "RCAT",
    "RDDT",
    "RDNW",
    "RGTI",
    "RNG",
    "RPD",
    "RUM",
    "RXT",
    "RZLV",
    "S",
    "SABR",
    "SAIC",
    "SAIL",
    "SAP",
    "SHOP",
    "SLP",
    "SMSI",
    "SNAP",
    "SNOW",
    "SNPS",
    "SOGP",
    "SOUN",
    "SPT",
    "SRAD",
    "STEM",
    "STNE",
    "SY",
    "TDC",
    "TEAD",
    "TEAM",
    "TEM",
    "TENB",
    "TLS",
    "TOST",
    "TRIP",
    "TTAN",
    "TTD",
    "TTWO",
    "TUYA",
    "TWLO",
    "U",
    "UPWK",
    "VERI",
    "VERX",
    "VNET",
    "VRAR",
    "VRNS",
    "WAY",
    "WDAY",
    "WEAV",
    "WIT",
    "WRD",
    "XNET",
    "XYZ",
    "YEXT",
    "YYAI",
    "ZENA",
    "ZETA",
    "ZIP",
    "ZM",
    "ZS"
  ],
  "Transportation": [
    "AAL",
    "ALK",
    "BKNG",
    "CCEC",
    "CCL",
    "CMBT",
    "CNI",
    "CP",
    "CSX",
    "CUK",
    "DAL",
    "DINO",
    "EXPE",
    "FDX",
    "FIP",
    "FLNG",
    "FRO",
    "FWRD",
    "GBTG",
    "GLNG",
    "HUBG",
    "JBLU",
    "KEX",
    "LUV",
    "MMYT",
    "NAT",
    "NCLH",
    "NSC",
    "NVGS",
    "OMEX",
    "PAA",
    "RCL",
    "RXO",
    "RYAAY",
    "SMHI",
    "SNCY",
    "SOBO",
    "SPCE",
    "STNG",
    "TEN",
    "TORO",
    "UAL",
    "ULCC",
    "UNP",
    "UPS",
    "VIK",
    "WERN",
    "ZIM"
  ],
  "Unknown": [
    "AAPU",
    "AGIX",
    "AIRR",
    "AIYY",
    "AMDL",
    "AMZW",
    "AMZZ",
    "APLT",
    "ARKG",
    "ARKK",
    "ARKW",
    "ASHR",
    "ASTX",
    "ATHA",
    "AVGG",
    "AVGX",
    "AVL",
    "AVMV",
    "AVUV",
    "AXL",
    "AZYY",
    "BABX",
    "BAGY",
    "BAIG",
    "BBH",
    "BBJP",
    "BCD",
    "BCSF",
    "BEDZ",
    "BETZ",
    "BITY",
    "BLCN",
    "BMNG",
    "BOND",
    "BOTZ",
    "BSV",
    "BTAL",
    "BTCL",
    "BUG",
    "BULU",
    "BUZZ",
    "BXSL",
    "CADE",
    "CASI",
    "CCCX",
    "CCOR",
    "CIVI",
    "CLSX",
    "CMPO",
    "CNBS",
    "COMM",
    "CONI",
    "CONL",
    "CORO",
    "CRCA",
    "CRCD",
    "CRWG",
    "CRWU",
    "CSD",
    "CVAC",
    "CWVX",
    "CYBN",
    "DBEF",
    "DFAS",
    "DFIP",
    "DFUV",
    "DGRS",
    "DISV",
    "DIVI",
    "DJTU",
    "DLN",
    "DMAT",
    "DOL",
    "DPST",
    "DRN",
    "DTCR",
    "DUHP",
    "DUSA",
    "DVAX",
    "EBIZ",
    "ECH",
    "EFAV",
    "ENPX",
    "ESGV",
    "ETHU",
    "EUFN",
    "EVMT",
    "EWM",
    "EWZS",
    "FDEM",
    "FDIS",
    "FDVV",
    "FEM",
    "FENI",
    "FEZ",
    "FHEQ",
    "FIGG",
    "FLAX",
    "FMET",
    "FNX",
    "FPE",
    "FPWR",
    "FSK",
    "FTXR",
    "FV",
    "FYBR",
    "GES",
    "GLGG",
    "GLXU",
    "HIBL",
    "HIBS",
    "HIMZ",
    "HOOX",
    "HOUS",
    "INTW",
    "IONX",
    "IONZ",
    "IRE",
    "IREX",
    "JAMF",
    "KYN",
    "LABX",
    "MAGS",
    "METU",
    "MNMD",
    "MNRS",
    "MODG",
    "MPW",
    "MRAL",
    "MRSN",
    "MSOS",
    "MULL",
    "NAIL",
    "NAN",
    "NBIG",
    "NINE",
    "NVTX",
    "OMI",
    "PCH",
    "PLTU",
    "PSEC",
    "PXIU",
    "QPUX",
    "QUBX",
    "REVG",
    "RGTU",
    "RIOX",
    "RKLX",
    "ROBN",
    "SBIT",
    "SMCL",
    "SMCX",
    "SMH",
    "SMLR",
    "SMST",
    "SMU",
    "SOFX",
    "SOLT",
    "SOXX",
    "TARK",
    "THS",
    "TRUE",
    "TSDD",
    "TSLG",
    "TSLR",
    "ULTY",
    "URTY",
    "USD",
    "WEBL",
    "WGMI",
    "XRPT",
    "YINN"
  ],
  "Utilities": [
    "AEE",
    "AES",
    "AM",
    "AQN",
    "BEPC",
    "CDZI",
    "CEG",
    "CEPU",
    "CLNE",
    "CMS",
    "CTRI",
    "CWEN",
    "CWST",
    "D",
    "EIX",
    "EPD",
    "ES",
    "ET",
    "FTS",
    "KGS",
    "KMI",
    "KNTK",
    "LNG",
    "MNTK",
    "NEE",
    "NEXT",
    "NFE",
    "NFG",
    "NNE",
    "NRG",
    "OKLO",
    "OPTT",
    "ORA",
    "PCG",
    "QRHC",
    "SBS",
    "SMC",
    "SO",
    "SPRU",
    "TLN",
    "TRP",
    "VG",
    "VST",
    "VVPR",
    "WMB",
    "WTRG"
  ],
  "Wholesale": [
    "AIT",
    "ASH",
    "ASPN",
    "CAH",
    "CENT",
    "COSM",
    "DPZ",
    "DXPE",
    "FERG",
    "GPC",
    "HFFG",
    "HLF",
    "LKQ",
    "MCK",
    "QXO",
    "RELL",
    "TEL",
    "UGRO",
    "VSTS",
    "WKC"
  ]
};

export default function LiveWatchlist() {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"bubbles" | "list">("bubbles");
  const [activeSector, setActiveSector] = useState<string | null>(null);
  const [hoverSector, setHoverSector] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Zoom + pan for the bubble map
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 1100, h: 640 });

  // Resize to container
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      const w = Math.max(820, Math.floor(rect.width));
      const h = Math.max(560, Math.floor(rect.height));
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
      setToast("Copied");
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setToast("Copied");
    }
  }

  // sanitize groups once
  const groups = useMemo(() => {
    const cleaned: SectorGroups = {};
    for (const [sector, syms] of Object.entries(GROUPS || {})) {
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

    const out: SectorGroups = {};
    for (const [sector, syms] of Object.entries(groups)) {
      const sectorMatch = sector.toUpperCase().includes(q);
      const keep = syms.filter((s) => sectorMatch || s.includes(q));
      if (keep.length) out[sector] = keep;
    }
    return out;
  }, [groups, query]);

  const totals = useMemo(() => {
    const all = new Set(Object.values(groups).flat());
    const shown = new Set(Object.values(filteredGroups).flat());
    return {
      total: all.size,
      shown: shown.size,
      sectors: Object.keys(groups).length,
      sectorsShown: Object.keys(filteredGroups).length,
    };
  }, [groups, filteredGroups]);

  const bubbleData = useMemo(() => {
    const list = Object.entries(filteredGroups)
      .map(([key, syms]) => ({ key, n: syms.length }))
      .sort((a, b) => b.n - a.n);
    return packBubblesRelaxed(list, size.w, size.h);
  }, [filteredGroups, size.w, size.h]);

  // keep activeSector valid after search
  useEffect(() => {
    if (!activeSector) return;
    if (filteredGroups[activeSector]?.length) return;
    setActiveSector(null);
  }, [query, filteredGroups, activeSector]);

  const activeSymbols = useMemo(() => {
    if (!activeSector) return [];
    return filteredGroups[activeSector] || groups[activeSector] || [];
  }, [activeSector, filteredGroups, groups]);

  const mapBg =
    "radial-gradient(circle at 25% 20%, rgba(99,102,241,0.14), transparent 48%)," +
    "radial-gradient(circle at 70% 25%, rgba(16,185,129,0.12), transparent 52%)," +
    "radial-gradient(circle at 55% 80%, rgba(244,63,94,0.10), transparent 55%)," +
    "linear-gradient(to right, rgba(15,23,42,0.04) 1px, transparent 1px)," +
    "linear-gradient(to bottom, rgba(15,23,42,0.04) 1px, transparent 1px)," +
    "linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(255,255,255,1) 40%, rgba(248,250,252,1) 100%)";

  const backgroundSize = "auto, auto, auto, 56px 56px, 56px 56px, auto";

  return (
    <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
              Live Watchlist — Sector Bubble Map
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              <span className="font-semibold text-slate-800">{totals.shown}</span> / {totals.total} tickers
              <span className="mx-2 text-slate-300">•</span>
              <span className="font-semibold text-slate-800">{totals.sectorsShown}</span> / {totals.sectors} sectors
              <span className="mx-2 text-slate-300">•</span>
              Drag to pan, scroll to zoom, click a bubble to open tickers.
            </p>
          </div>

          <div className="flex flex-col gap-2 w-full lg:w-[720px]">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ticker or sector…"
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-slate-200/70"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setView((v) => (v === "bubbles" ? "list" : "bubbles"))}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  {view === "bubbles" ? "List view" : "Bubble view"}
                </button>

                <button
                  onClick={() => {
                    setQuery("");
                    setActiveSector(null);
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* mini controls row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 w-12">Zoom</span>
                <input
                  type="range"
                  min={0.8}
                  max={1.8}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-[220px]"
                />
                <button
                  onClick={() => {
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  className="text-[11px] px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                >
                  Center
                </button>
              </div>

              <div className="flex-1" />

              {activeSector ? (
                <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm w-full sm:w-auto">
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
              ) : (
                <div className="text-xs text-slate-500">
                  Tip: hover a bubble to preview, click to open, then click tickers to copy.
                </div>
              )}
            </div>
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

      <div className="p-6">
        {view === "bubbles" ? (
          <div
            ref={wrapRef}
            className="relative w-full rounded-[28px] overflow-hidden border border-slate-200"
            style={{
              height: "min(72vh, 760px)",
              background: mapBg,
              backgroundSize,
            }}
            onWheel={(e) => {
              // zoom around cursor
              e.preventDefault();
              const delta = -e.deltaY;
              const next = clamp(zoom + (delta > 0 ? 0.06 : -0.06), 0.8, 1.8);
              setZoom(next);
            }}
          >
            <svg
              width={size.w}
              height={size.h}
              viewBox={`0 0 ${size.w} ${size.h}`}
              className="absolute inset-0"
              onMouseDown={(e) => {
                dragging.current = true;
                dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
              }}
              onMouseMove={(e) => {
                if (!dragging.current) return;
                const dx = e.clientX - dragStart.current.x;
                const dy = e.clientY - dragStart.current.y;
                setPan({
                  x: dragStart.current.panX + dx,
                  y: dragStart.current.panY + dy,
                });
              }}
              onMouseUp={() => {
                dragging.current = false;
              }}
              onMouseLeave={() => {
                dragging.current = false;
              }}
            >
              <defs>
                {bubbleData.map((b) => {
                  const t = themeForKey(b.key);
                  const id = `grad-${hashToHue(b.key)}`;
                  return (
                    <radialGradient key={id} id={id} cx="35%" cy="30%" r="75%">
                      <stop offset="0%" stopColor={t.fillA} />
                      <stop offset="62%" stopColor={t.fillB} />
                      <stop offset="100%" stopColor="rgba(255,255,255,0.10)" />
                    </radialGradient>
                  );
                })}

                <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="10" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
                {bubbleData.map((b) => {
                  const t = themeForKey(b.key);
                  const gradId = `grad-${hashToHue(b.key)}`;
                  const isActive = activeSector === b.key;
                  const isHover = hoverSector === b.key;

                  const lines = splitLabel(b.key);
                  const titleSize = Math.max(12, Math.min(22, b.r * 0.20));
                  const subSize = Math.max(11, Math.min(17, b.r * 0.16));

                  return (
                    <g
                      key={b.key}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={() => setHoverSector(b.key)}
                      onMouseLeave={() => setHoverSector(null)}
                      onClick={() => setActiveSector((cur) => (cur === b.key ? null : b.key))}
                    >
                      {/* soft outer ring */}
                      <circle
                        cx={b.x}
                        cy={b.y}
                        r={b.r + 10}
                        fill="transparent"
                        stroke={t.ring}
                        strokeWidth={2}
                        opacity={isActive || isHover ? 1 : 0.55}
                      />

                      {/* glow ring on hover/active */}
                      {(isActive || isHover) && (
                        <circle
                          cx={b.x}
                          cy={b.y}
                          r={b.r + 14}
                          fill="transparent"
                          stroke={t.glow}
                          strokeWidth={2.25}
                          opacity={0.8}
                          filter="url(#softGlow)"
                        />
                      )}

                      <circle
                        cx={b.x}
                        cy={b.y}
                        r={b.r}
                        fill={`url(#${gradId})`}
                        stroke={t.stroke}
                        strokeWidth={1.5}
                        opacity={0.95}
                        filter="url(#softGlow)"
                      />

                      {/* specular highlight */}
                      <ellipse
                        cx={b.x - b.r * 0.22}
                        cy={b.y - b.r * 0.30}
                        rx={b.r * 0.34}
                        ry={b.r * 0.22}
                        fill="rgba(255,255,255,0.22)"
                        opacity={0.55}
                      />

                      {/* label */}
                      <text
                        x={b.x}
                        y={b.y - (lines.length === 2 ? 6 : 2)}
                        textAnchor="middle"
                        fill={t.text}
                        fontSize={titleSize}
                        fontWeight={800}
                        style={{ pointerEvents: "none" }}
                      >
                        {lines.map((ln, idx) => (
                          <tspan key={idx} x={b.x} dy={idx === 0 ? 0 : titleSize * 1.05}>
                            {ln}
                          </tspan>
                        ))}
                      </text>

                      <text
                        x={b.x}
                        y={b.y + (lines.length === 2 ? titleSize * 1.35 : titleSize * 1.05)}
                        textAnchor="middle"
                        fill={t.textDim}
                        fontSize={subSize}
                        fontWeight={700}
                        style={{ pointerEvents: "none" }}
                      >
                        {b.n} tickers
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* hover chip */}
            {hoverSector && (
              <div className="absolute top-4 left-4 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur px-4 py-3 shadow-sm">
                <div className="text-sm font-semibold text-slate-900">{hoverSector}</div>
                <div className="text-xs text-slate-600 mt-0.5">
                  {(filteredGroups[hoverSector] || groups[hoverSector] || []).length} tickers
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(filteredGroups)
              .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
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
              {activeSymbols.map((sym) => {
                const t = themeForKey(activeSector);
                return (
                  <button
                    key={`${activeSector}:${sym}`}
                    type="button"
                    onClick={() => copyToClipboard(sym)}
                    className="rounded-2xl border px-3 py-2 text-sm font-semibold text-center transition hover:-translate-y-[1px] hover:shadow-sm"
                    style={{
                      backgroundColor: t.chipBg,
                      borderColor: t.chipBorder,
                      color: t.chipText,
                    }}
                    title="Click to copy"
                  >
                    {sym}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
