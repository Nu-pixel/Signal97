"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type SectorGroups = Record<string, string[]>;

function normalizeSymbol(s: string) {
  return String(s ?? "").trim().toUpperCase();
}

function hashToHue(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 360;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(!!mql.matches);
    onChange();
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else (mql as any).addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else (mql as any).removeListener(onChange);
    };
  }, [query]);

  return matches;
}

function themeForKey(key: string) {
  const hue = hashToHue(key.toLowerCase());
  // Pastel palette: low saturation, high lightness
  return {
    hue,
    fillA: `hsla(${hue}, 55%, 84%, 0.88)`,
    fillB: `hsla(${hue}, 55%, 76%, 0.72)`,
    stroke: `hsla(${hue}, 35%, 42%, 0.35)`,
    glow: `hsla(${hue}, 55%, 72%, 0.28)`,
    text: `hsla(${hue}, 18%, 14%, 0.92)`,
    textDim: `hsla(${hue}, 16%, 18%, 0.72)`,
    chipBg: `hsla(${hue}, 55%, 98%, 1)`,
    chipBorder: `hsla(${hue}, 30%, 76%, 1)`,
    chipText: `hsla(${hue}, 26%, 18%, 1)`,
  };
}

// Display labels (keep GROUPS keys unchanged; only change what user sees)
const DISPLAY_NAME: Record<string, string> = {
  Unknown: "Misc / Funds",
  // User requested: keep only the short names in the UI
  "Agriculture/Forestry/Fishing": "Agriculture",
  "Media/Publishing": "Media",
};

function displaySectorName(key: string) {
  return DISPLAY_NAME[key] ?? key;
}

type Bubble = {
  key: string;
  n: number;
  r: number;
  x: number;
  y: number;
};

// Split long labels into 2 lines (helps inside smaller balloons)
function splitLabel(label: string): string[] {
  const s = String(label ?? "").trim();
  if (s.length <= 16) return [s];

  // Try "nice" splits first
  const preferred = [" (", " / ", " - ", " — "];
  for (const p of preferred) {
    const idx = s.indexOf(p);
    if (idx > 7 && idx < 26) return [s.slice(0, idx).trim(), s.slice(idx).trim()];
  }

  // Handle slash-delimited labels without spaces (e.g., Agriculture/Forestry/Fishing)
  if (s.includes("/") && !s.includes(" / ")) {
    const parts = s
      .split("/")
      .map((x) => x.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      // Prefer 2 lines; if 3 parts, combine 2+1
      if (parts.length === 2) return [parts[0], parts[1]];
      return [`${parts[0]} / ${parts[1]}`, parts.slice(2).join(" / ")];
    }
  }

  // Fall back: split on last space near the middle
  const mid = Math.floor(s.length / 2);
  for (let i = mid; i >= 10; i--) {
    if (s[i] === " ") return [s.slice(0, i).trim(), s.slice(i + 1).trim()];
  }
  return [s];
}

// Deterministic PRNG (so layout doesn't jump every re-render)
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Balloon drop pack:
 * - starts above the frame and "falls" down with gravity
 * - resolves overlaps each step
 * - finishes with a deterministic "final relax" pass to guarantee no overlaps
 *
 * NOTE: mobile gets slightly smaller radii and more padding to improve tap targets.
 */
function balloonDropPack(
  items: Array<{ key: string; n: number }>,
  W: number,
  H: number,
  opts?: { mobile?: boolean }
): Bubble[] {
  const mobile = !!opts?.mobile;

  const margin = mobile ? 16 : 18;
  const pad = mobile ? 16 : 12; // more spacing on mobile to prevent re-overlap at small sizes

  const nMax = Math.max(1, ...items.map((k) => k.n));

  // Radius sizing:
  // 1) proportional to sqrt(count)
  // 2) then scaled so total area fits ~50–55% of available area (leaves "gaps" like fallen balloons)
  const raw = items.map((k) => {
    const t = Math.sqrt(k.n / nMax);
    const base = mobile ? 36 : 44;
    const span = mobile ? 120 : 150;
    return { key: k.key, n: k.n, r: base + t * span };
  });

  const areaAvail = Math.max(1, (W - margin * 2) * (H - margin * 2));
  const areaSum = raw.reduce((acc, b) => acc + Math.PI * b.r * b.r, 0);

  const targetFill = mobile ? 0.5 : 0.54;
  const s = Math.sqrt((areaAvail * targetFill) / Math.max(1, areaSum));

  const rMax = Math.min(W, H) * (mobile ? 0.2 : 0.22);
  const bubbles: Bubble[] = raw
    .map((b) => ({ ...b, r: clamp(b.r * s, mobile ? 28 : 34, rMax), x: 0, y: 0 }))
    .sort((a, b) => b.r - a.r);

  // Init above the top edge, spread across width
  const rng = mulberry32(Math.floor((W + 31) * 1000 + H));
  const vx = new Array(bubbles.length).fill(0);
  const vy = new Array(bubbles.length).fill(0);

  for (let i = 0; i < bubbles.length; i++) {
    const b = bubbles[i];
    b.x = margin + b.r + rng() * Math.max(1, W - 2 * margin - 2 * b.r);
    b.y = -margin - b.r - rng() * (H * 0.75);
    vx[i] = (rng() - 0.5) * (mobile ? 0.45 : 0.55);
    vy[i] = 0;
  }

  // Physics-ish params
  const g = mobile ? 0.6 : 0.55;
  const damp = 0.92;
  const wallBounce = 0.32;
  const floorBounce = 0.08;

  // Iterations: enough to settle, still fast
  const steps = mobile ? 1200 : 1000;

  for (let step = 0; step < steps; step++) {
    // gravity + integrate
    for (let i = 0; i < bubbles.length; i++) {
      vy[i] += g;
      bubbles[i].x += vx[i];
      bubbles[i].y += vy[i];
      vx[i] *= damp;
      vy[i] *= damp;
    }

    // collisions (pairwise)
    for (let i = 0; i < bubbles.length; i++) {
      for (let j = i + 1; j < bubbles.length; j++) {
        const a = bubbles[i];
        const b = bubbles[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        const minDist = a.r + b.r + pad;
        if (dist < minDist) {
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;

          // Move them apart (bigger bubble moves less)
          const wa = 1 / (a.r * a.r);
          const wb = 1 / (b.r * b.r);
          const sum = wa + wb;
          const ma = wb / sum;
          const mb = wa / sum;

          a.x -= nx * overlap * ma;
          a.y -= ny * overlap * ma;
          b.x += nx * overlap * mb;
          b.y += ny * overlap * mb;

          // Small velocity nudge to prevent re-penetration
          vx[i] -= nx * overlap * 0.02;
          vy[i] -= ny * overlap * 0.02;
          vx[j] += nx * overlap * 0.02;
          vy[j] += ny * overlap * 0.02;
        }
      }
    }

    // bounds (walls + floor)
    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i];

      const left = margin + b.r;
      const right = W - margin - b.r;
      const top = margin + b.r;
      const bottom = H - margin - b.r;

      if (b.x < left) {
        b.x = left;
        vx[i] = Math.abs(vx[i]) * wallBounce;
      } else if (b.x > right) {
        b.x = right;
        vx[i] = -Math.abs(vx[i]) * wallBounce;
      }

      if (b.y < top) {
        b.y = top;
        vy[i] = Math.abs(vy[i]) * wallBounce;
      } else if (b.y > bottom) {
        b.y = bottom;
        vy[i] = -Math.abs(vy[i]) * floorBounce;
        vx[i] *= 0.86; // floor friction
      }
    }

    // stop early if settled
    if (step > 260) {
      let maxV = 0;
      for (let i = 0; i < bubbles.length; i++) {
        const v = Math.abs(vx[i]) + Math.abs(vy[i]);
        if (v > maxV) maxV = v;
      }
      if (maxV < (mobile ? 0.06 : 0.05)) break;
    }
  }

  // Final relax pass (guarantees non-overlap even after any tiny numeric drift)
  for (let step = 0; step < 120; step++) {
    let moved = false;

    for (let i = 0; i < bubbles.length; i++) {
      for (let j = i + 1; j < bubbles.length; j++) {
        const a = bubbles[i];
        const b = bubbles[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        const minDist = a.r + b.r + pad;
        if (dist < minDist) {
          moved = true;
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;

          const wa = 1 / (a.r * a.r);
          const wb = 1 / (b.r * b.r);
          const sum = wa + wb;
          const ma = wb / sum;
          const mb = wa / sum;

          a.x -= nx * overlap * ma;
          a.y -= ny * overlap * ma;
          b.x += nx * overlap * mb;
          b.y += ny * overlap * mb;
        }
      }
    }

    for (const b of bubbles) {
      b.x = clamp(b.x, margin + b.r, W - margin - b.r);
      b.y = clamp(b.y, margin + b.r, H - margin - b.r);
    }

    if (!moved) break;
  }

  return bubbles;
}

/**
 * GROUPS (kept as-is)
 */
const GROUPS: SectorGroups = {
  "Agriculture/Forestry/Fishing": ["AGRO", "CALM", "VFF"],
  "Communication Services (Telecom)": [
    "ADEA","AMCX","AMX","ASTS","CCOI","CHTR","CMCSA","FOXA","GLIBK","GSAT","GTN","IHRT","IHS","IRDM","LBRDK","LUMN","NMAX","PSKY","ROKU","SATS","SBGI","SIRI","SPIR","SPOT","SSP","SURG","T","TDS","TME","TMUS","TSAT","TSQ","TTGT","UNIT","UONEK","VOD","VSAT","VZ","WBD"
  ],
  "Construction": ["AMRC","BBCP","BZH","DHI","DY","FIX","GEO","GRBK","GVA","LEN","MTZ","PHM","STRL","TOL","TPC","TPH"],
  "Consumer (Retail)": [
    "AAP","ABG","ACI","AEO","AMZN","ANF","ARHS","ARMK","ASO","BARK","BBBY","BBWI","BBY","BJ","BKE","BLMN","BNED","BROS","BURL","CAKE","CAVA","CBRL","CHWY","CMG","COST","CPNG","CTRN","CVNA","CVS","DBI","DDL","DG","DKS","DLTR","DNUT","DRI","EAT","ELA","FIVE","FLWS","FND","GAP","GCO","GCT","GME","GO","HD","JACK","JD","JMIA","KMX","KR","KSS","LESL","LOW","LUXE","LVO","M","MCD","OLLI","PETS","PLAY","PLBY","PLCE","PTLO","PZZA","QVCGA","REAL","RH","ROST","RVLV","SBUX","SFIX","SFM","SG","SHAK","SIG","STKS","SVV","TGT","TJX","TSCO","TXRH","ULTA","URBN","VIPS","VRM","VSCO","W","WEN","WMT","WOOF"
  ],
  "ETF (Commodity)": ["FCG","GDX","GDXJ","GLD","IAU","SILJ","SLV","UNG","USO","XHB"],
  "ETF (Index)": ["DIA","DVY","EDV","EEM","EFA","EMB","EWG","EWJ","EWZ","FXI","HYG","IEF","IVV","IWM","IYR","LQD","QQQ","RSP","SCHD","SPY","TLT","VOO"],
  "ETF (Leveraged/Inverse)": [
    "BDN","BOIL","BULL","CCUP","DRIP","DUST","ELDN","FAS","JDST","KOLD","LABD","LABU","MSTU","MSTX","MSTY","MSTZ","NUGT","NVDL","NVDS","NVDU","NVDX","SMUP","SOXL","SOXS","SPXL","SPXS","SPXU","SQQQ","SSO","SVIX","TECL","TMF","TNA","TQQQ","TSLL","TSLQ","TSLT","TSLZ","TZA","UP","UPRO","UVIX","UVXY","VRDN","VXX"
  ],
  "ETF (Sector)": ["ICLN","JETS","KRE","KWEB","URA","XBI","XLB","XLC","XLE","XLF","XLI","XLK","XLP","XLU","XLV","XLY","XOP","XRT"],
  "ETP (Crypto)": ["BITO","BITX","EETH","ETH","ETHA","ETHD","ETHE","ETHT","ETHZ","FBTC","GBTC","IBIT"],
  "Energy (Oil & Gas)": [
    "ACDC","AESI","AMPY","APA","AR","BKV","BTE","CHRD","CLB","CNQ","CRC","CRGY","CRK","CTRA","CVE","DVN","EC","EOG","EPSN","EQT","EXE","FANG","HAL","HESM","HP","HPK","KLXE","KOS","MGY","NOG","NUAI","OBE","OII","OXY","PBR","RIG","RRC","SDRL","SHEL","SLB","SM","SOC","TALO","TTI","VAL","VIST","VNOM","VOC","WDS","WTTR","XPRO"
  ],
  "Energy (Refining)": ["BP","CLMT","COP","CVI","CVX","DK","EQNR","MPC","PBF","PSX","SU","VLO","VVV","XOM","YPF"],
  "Financials/Real Estate": [
    "AAMI","ABCB","ABR","ABTC","ACGL","AEXA","AFL","AFRM","AGNC","AGQ","AIFU","AIG","ALHC","ALRS","ALTS","AMBR","AMH","AMP","AMT","ANY","APO","APPS","ARBK","ARE","ARES","ASB","ASST","AUB","AXP","BAC","BAM","BBAR","BBT","BCS","BEKE","BFST","BHF","BITF","BK","BKKT","BLK","BLSH","BMNR","BN","BNL","BRO","BRR","BSOL","BTBT","BTDR","BUSE","BWET","BWIN","BX","C","CAN","CATY","CBOE","CBRE","CBSH","CCBG","CDP","CG","CHMI","CHYM","CI","CIA","CIFR","CLDT","CLOV","CLSK","CME","CMTG","CNC","CNO","COF","COIN","COMP","CORZ","CPT","CRCL","CSR","CTBI","CTRE","CUBE","CWK","CZNC","DB","DBRG","DEI","DFDV","DGXX","DLR","DOUG","EBC","ECPG","EGBN","EHTH","EIG","ELME","ELS","EQBK","EQIX","ESNT","ESS","EZBC","FFBC","FFIN","FG","FGNX","FHN","FIGR","FISI","FLG","FNF","FRGE","FSP","FUTU","FWDI","GDOT","GEMI","GGAL","GLXY","GPMT","GS","HASI","HIVE","HLNE","HOOD","HOPE","HR","HRTG","HSBC","HST","HTBK","HUM","HUT","IBKR","ICE","INVH","IREN","IRM","JEF","JPM","JRVR","KKR","LB","LC","LDI","LINE","LMND","LNC","LPRO","LX","LXP","MAC","MARA","MC","MCHB","MIAX","MOH","MRP","MRX","MS","MSTR","MTG","MUFG","NAKA","NDAQ","NLY","NRT","NSA","NTST","NU","OPAD","OPEN","OPRT","ORBS","ORC","OSCR","OWL","PEB","PGR","PGY","PKST","PLD","PNC","PNFP","QFIN","RC","RILY","RIOT","RKT","RYAN","RYN","SAN","SBCF","SBET","SCHW","SIEB","SKYH","SLAI","SLDE","SLG","SLM","SLQT","SMA","SOFI","SSRM","SUIG","SUPV","SVC","TBBK","TFC","TIGR","TPG","TWO","UBSI","UCB","UNH","UPST","UPXI","USB","UWMC","VNO","WFC","WNEB","WRB","WULF","WY","WYFI","XP","YRD"
  ],
  "Healthcare (Medical Devices)": [
    "ALC","ALGN","ANGO","APT","ATEC","BAX","BBNX","BFLY","BLFS","BSX","CLPT","CNMD","CODX","CTSO","CVRX","DCTH","DRIO","DXCM","EMBC","ENOV","ESTA","EYE","GEHC","GKOS","GMED","HSDT","HTFL","INSP","ISRG","KRMD","LFWD","MBOT","MDT","MMM","MYO","NNOX","NSPR","NVST","OBIO","OM","SGHT","SKIN","STAA","STIM","STSS","STVN","STXS","TELA","TMCI","TMDX","TNDM","WRBY","XAIR"
  ],
  "Healthcare (Pharma)": [
    "ABBV","ABCL","ABT","ABVC","ABVX","ACAD","ACB","ACHV","ACLX","ACRS","ACXP","ADCT","ADMA","ADPT","AGIO","AKBA","ALDX","ALEC","ALKS","ALLO","ALMS","ALNY","ALT","ALXO","AMGN","AMLX","AMRN","ANAB","ANNX","ANRO","ANVS","APGE","APLS","AQST","ARCT","ARDX","ARQT","ASMB","ATAI","ATOS","ATYR","AUTL","AVTX","AXSM","BBIO","BCAB","BCAX","BCRX","BEAM","BHC","BHVN","BIIB","BLRX","BMEA","BMRN","BMY","BNTC","BTAI","CABA","CAPR","CATX","CCCC","CELU","CGC","CGEM","CGEN","CMPS","CNTA","COGT","CPIX","CRBU","CRDF","CRMD","CRON","CRSP","CRVS","CTMX","CTXR","CVM","CYRX","CYTK","DAWN","DNA","DNLI","DNTH","DYAI","DYN","EBS","EDIT","ELAN","ELVN","ENTA","ENTX","EOLS","EQ","ESPR","EWTX","EXEL","FATE","FBIO","FDMT","FHTX","FULC","GALT","GERN","GHRS","GILD","GLUE","GMAB","GOSS","GPCR","GSK","HOWL","HRMY","HUMA","HYFT","IBRX","IFRX","IMMX","IMNM","IMRX","INBX","INDV","INO","INSM","IOVA","IRD","IVVD","JANX","JAZZ","JNJ","JSPR","KOD","KPTI","KROS","KRRO","KYTX","LENZ","LFCR","LLY","LNAI","LNTH","LQDA","LRMR","LTRN","LXEO","LXRX","LYEL","MBX","MCRB","MIRM","MIST","MLTX","MLYS","MNKD","MRK","MRNA","MYGN","NAGE","NAMS","NBP","NEOG","NGNE","NKTX","NMRA","NNVC","NRIX","NRXP","NTLA","NUVB","NVAX","NVO","OCUL","OGN","OLMA","OMER","ORGO","ORKA","OTLK","PBYI","PCRX","PCVX","PDSB","PFE","PGEN","PLX","PMVP","PPBT","PRAX","PRGO","PRLD","PRME","PROK","PRPH","PRQR","PRTA","PTCT","PVLA","QURE","RANI","RAPP","RCKT","REGN","REPL","RGC","RIGL","RLAY","RLMD","RMTI","ROIV","RVPH","RXRX","RZLT","SANA","SAVA","SEPN","SGMO","SGMT","SIGA","SKYE","SLN","SLNO","SLS","SMMT","SNDX","SPRO","SPRY","SRPT","SRRK","STOK","STRO","SUPN","SVRA","SYRE","TARA","TARS","TECH","TECX","TERN","TEVA","TGTX","TLRY","TNGX","TNXP","TNYA","TRIB","TRVI","TSHA","TVRD","TWST","UNCY","UPB","URGN","VCEL","VERA","VERU","VIR","VKTX","VNDA","VOR","VRTX","VSTM","VTYX","VYGR","WVE","XENE","XERS","XFOR","XNCR","ZBIO","ZLAB","ZTS","ZURA","ZVRA"
  ],
  "Healthcare (Providers/Services)": ["AIRS","AVAH","BDSX","BKD","BTSG","CAI","CELC","CYH","DCGO","FTRE","GH","GRAL","HCSG","HIMS","LFMD","LFST","NTRA","OPCH","PACS","PGNY","PSNL","RDNT","SERA","SGRY","SRTA","TDOC","TOI","UHS","VCYT","WGS","XGN"],
  Manufacturing: [
    "A","AA","ABEV","ABVE","ACMR","AEHR","AGCO","AIRJ","ALB","ALH","ALTO","AME","AMPX","AMRZ","AMSC","AMTX","AOUT","AP","APD","AQMS","ARRY","AS","ASML","ASPI","ATER","ATI","AVD","AVNT","BC","BE","BG","BIOX","BIRK","BLDP","BLNK","BNKK","BOOM","BRCC","BRKR","BRLT","BUD","BW","BWEN","BWXT","BYND","BYRN","CAG","CAL","CAPT","CAT","CBAT","CBUS","CC","CCU","CE","CELH","CENX","CF","CGNX","CHD","CHPT","CL","CMC","CMI","CNH","COCO","CODI","COHR","COKE","COLM","CPB","CR","CRH","CRI","CROX","CSL","CSTM","CSW","CTAS","CTKB","CW","CXT","DAIO","DAKT","DE","DECK","DFLI","DHR","DOW","DRS","EAF","ECL","EL","ELF","EMR","ENTG","ENVX","EOSE","EPAC","ERII","ESI","ETN","EYPT","FCEL","FIGS","FLNC","FLO","FLY","FOSL","FOXF","FRPT","FTI","FTK","GD","GE","GEOS","GEV","GGB","GLW","GNRC","GNSS","GOOS","GPK","GPRO","GTES","HII","HLMN","HOG","HRL","HSAI","HSY","HTOO","HUN","HWM","HXL","HY","IFF","ILMN","IMAX","IP","ISPR","ITP","JBS","JCI","KDP","KHC","KLAC","KMB","KMT","KO","KODK","KTOS","KVUE","LASE","LEG","LEVI","LHX","LMT","LNZA","LODE","LOMA","LPX","LRCX","LULU","LUNR","LW","LWLG","LYB","LYTS","MASS","MAT","MATV","MBC","MDLZ","MEC","MHK","MIDD","MIR","MO","MT","MVST","NKE","NN","NOMD","NPWR","NRGV","NTR","NWL","NX","OC","ODD","OI","OLN","ONON","ORGN","OUST","OXM","PACB","PACK","PCT","PEP","PG","PII","PLUG","PM","POST","PPC","PPG","PPSI","PRM","PRMB","PTON","QS","QSI","QTRX","RAIL","RAL","RDW","RKLB","RR","RUN","RVTY","RYAM","SEER","SEI","SENS","SERV","SES","SHOO","SLDP","SLGN","SLI","SMR","SNBR","SOLS","SONO","SONY","ST","STZ","SUZ","SXC","SYM","TAP","TER","TEX","TKR","TMO","TPR","TREX","TROX","TS","TSE","TT","TTC","TWI","TXG","UA","UAMY","VFC","VITL","VOYG","WBX","WFRD","WHD","WLK","WRAP","WWD","XXII","YETI","YSG"
  ],
  "Manufacturing (Aerospace)": ["ACHR","AIR","ATRO","AVAV","BA","DPRO","EH","EVTL","HON","JOBY","RTX","SARO","TXT"],
  "Manufacturing (Automotive)": ["ADNT","AEVA","APTV","BLBD","CAAS","CPS","CVGI","EMPD","F","FFAI","GM","GTX","HYLN","INVZ","LCID","LEA","LI","MGA","MOD","NIO","OSK","PATK","PSNY","RIVN","SEV","STLA","TSLA","VFS","WKHS","XPEV"],
  "Media/Entertainment": ["AMC","ANGX","CNVS","CURI","FUBO","IQ","NFLX","TOON"],
  "Media/Publishing": ["TRI"],
  Mining: ["ABAT","AEM","AG","AGI","B","BHP","BTG","BTU","BVN","CCJ","CDE","CLF","CNR","CRML","DNN","EQX","ERO","FCX","GFI","GROY","GSM","HBM","HCC","HL","HMY","HYMC","IAG","IDR","IE","KGC","LAC","LGO","METC","MP","MUX","NAK","NB","NEM","NEWP","NG","NVA","NXE","ODV","ORLA","PAAS","SA","SCCO","SGML","SKE","SQM","SVM","TECK","TGB","TMC","TMQ","UEC","USAR","USAS","USAU","UUUU","VALE","VMC","WPM","WWR"],
  "Other/Services": ["ABM","ABNB","ABSI","ACEL","ACN","ACVA","ADV","AKAM","AMTM","ANGI","APG","BABA","BAH","BATRA","BGSF","BRSL","CAR","CART","CHGG","CHH","CNXC","CRL","CSGP","CZR","DASH","DHX","DIS","DKNG","DLO","EBAY","ETSY","EVGO","FIS","FLL","FTAI","FUN","GETY","GPN","GRAB","GRPN","HGV","HLT","HQY","HTZ","INCY","IT","KLC","LTH","LUCK","LVS","LYFT","MA","MAN","MANU","MAR","MAX","MELI","MGM","MLCO","MMS","MNY","MSCI","MXCT","NCMI","NEO","NOTE","NOTV","NRDY","NSP","PAY","PAYO","PDD","PENN","PK","PLNT","PRKS","PSFE","PSQH","PYPL","RELY","RHI","RSI","RSKD","SE","SGHC","SHO","SPGI","STUB","TAL","TIC","TNL","TONX","TSSI","TTEK","UBER","UDMY","UPBD","URI","V","WH","WMG","WSC","WW","WYNN","XPOF","YELP","YQ","ZG"],
  "Technology (Computers/Hardware)": ["AAPL","ANET","CSCO","DELL","DGII","EVLV","EXTR","FFIV","FTNT","HPE","HPQ","IBM","NTAP","OMCL","OSS","PANW","SMCI","SNDK","STX","WDC","ZEPP"],
  "Technology (Semiconductors/Electronics)": ["AAOI","ADI","ALAB","ALGM","ALMU","AMAT","AMBA","AMD","AMPG","AOSL","APH","ARM","ASX","ATOM","AUDC","AVGO","AXTI","BKSY","CIEN","CLS","CMBM","CMTL","CRDO","CRNT","CSIQ","ENPH","FLEX","FN","FSLR","FTCI","GSIT","HIMX","INDI","INSG","INTC","KLIC","KOPN","KULR","LAES","LASR","LITE","LPTH","LSCC","MAXN","MCHP","MEI","MRVL","MU","MVIS","MX","MXL","NEON","NOK","NVDA","NVTS","NXPI","OLED","ON","ONDS","PENG","PI","PL","PLAB","POET","POWI","QCOM","QRVO","SANM","SATL","SEDG","SHLS","SKYT","SMTC","SQNS","STM","SWKS","SYNA","TE","TSM","TTMI","TXN","UMAC","UMC","VIAV","VREX","VRT","VSH","VUZI","WATT","WOLF"],
  "Technology (Software)": ["ADBE","ADP","ADSK","AEYE","AGYS","AI","AISP","ALKT","API","APLD","APP","APPF","APPN","ARBE","ARQQ","ASAN","ASUR","AUR","AVPT","BAND","BB","BBAI","BIDU","BILI","BILL","BL","BLZE","BMBL","BRAG","BRZE","BSY","CARG","CARS","CCLD","CCSI","CDLX","CDNS","CFLT","CGNT","CINT","CLVT","CMRC","CRM","CRNC","CRWD","CRWV","CVLT","CWAN","CXAI","CXM","DBX","DCBO","DDD","DDOG","DH","DJT","DMRC","DOCN","DOCS","DOCU","DSGX","DSP","DUOL","DV","EA","EGHT","ESTC","EVTC","FDS","FIG","FIVN","FLUT","FNGR","FROG","FRSH","FSLY","GDDY","GDRX","GDS","GLBE","GMGI","GOOG","GOOGL","GRND","GRRR","GTLB","GTM","GWRE","HCAT","HNGE","HUBS","IAC","INFY","INOD","INTU","IONQ","IOT","KC","KD","KDK","LDOS","LIF","LPSN","LZ","MBLY","MDB","META","MSFT","MTLS","NBIS","NCNO","NET","NOW","NTNX","NTSK","OKTA","ORCL","PATH","PAYC","PCTY","PD","PDYN","PEGA","PHUN","PINS","PLTR","PONY","PRCH","PUBM","QBTS","QTWO","QUBT","RBLX","RBRK","RCAT","RDDT","RDNW","RGTI","RNG","RPD","RUM","RXT","RZLV","S","SABR","SAIC","SAIL","SAP","SHOP","SLP","SMSI","SNAP","SNOW","SNPS","SOGP","SOUN","SPT","SRAD","STEM","STNE","SY","TDC","TEAD","TEAM","TEM","TENB","TLS","TOST","TRIP","TTAN","TTD","TTWO","TUYA","TWLO","U","UPWK","VERI","VERX","VNET","VRAR","VRNS","WAY","WDAY","WEAV","WIT","WRD","XNET","XYZ","YEXT","YYAI","ZENA","ZETA","ZIP","ZM","ZS"],
  Transportation: ["AAL","ALK","BKNG","CCEC","CCL","CMBT","CNI","CP","CSX","CUK","DAL","DINO","EXPE","FDX","FIP","FLNG","FRO","FWRD","GBTG","GLNG","HUBG","JBLU","KEX","LUV","MMYT","NAT","NCLH","NSC","NVGS","OMEX","PAA","RCL","RXO","RYAAY","SMHI","SNCY","SOBO","SPCE","STNG","TEN","TORO","UAL","ULCC","UNP","UPS","VIK","WERN","ZIM"],
  Unknown: ["AAPU","AGIX","AIRR","AIYY","AMDL","AMZW","AMZZ","APLT","ARKG","ARKK","ARKW","ASHR","ASTX","ATHA","AVGG","AVGX","AVL","AVMV","AVUV","AXL","AZYY","BABX","BAGY","BAIG","BBH","BBJP","BCD","BCSF","BEDZ","BETZ","BITY","BLCN","BMNG","BOND","BOTZ","BSV","BTAL","BTCL","BUG","BULU","BUZZ","BXSL","CADE","CASI","CCCX","CCOR","CIVI","CLSX","CMPO","CNBS","COMM","CONI","CONL","CORO","CRCA","CRCD","CRWG","CRWU","CSD","CVAC","CWVX","CYBN","DBEF","DFAS","DFIP","DFUV","DGRS","DISV","DIVI","DJTU","DLN","DMAT","DOL","DPST","DRN","DTCR","DUHP","DUSA","DVAX","EBIZ","ECH","EFAV","ENPX","ESGV","ETHU","EUFN","EVMT","EWM","EWZS","FDEM","FDIS","FDVV","FEM","FENI","FEZ","FHEQ","FIGG","FLAX","FMET","FNX","FPE","FPWR","FSK","FTXR","FV","FYBR","GES","GLGG","GLXU","HIBL","HIBS","HIMZ","HOOX","HOUS","INTW","IONX","IONZ","IRE","IREX","JAMF","KYN","LABX","MAGS","METU","MNMD","MNRS","MODG","MPW","MRAL","MRSN","MSOS","MULL","NAIL","NAN","NBIG","NINE","NVTX","OMI","PCH","PLTU","PSEC","PXIU","QPUX","QUBX","REVG","RGTU","RIOX","RKLX","ROBN","SBIT","SMCL","SMCX","SMH","SMLR","SMST","SMU","SOFX","SOLT","SOXX","TARK","THS","TRUE","TSDD","TSLG","TSLR","ULTY","URTY","USD","WEBL","WGMI","XRPT","YINN"],
  Utilities: ["AEE","AES","AM","AQN","BEPC","CDZI","CEG","CEPU","CLNE","CMS","CTRI","CWEN","CWST","D","EIX","EPD","ES","ET","FTS","KGS","KMI","KNTK","LNG","MNTK","NEE","NEXT","NFE","NFG","NNE","NRG","OKLO","OPTT","ORA","PCG","QRHC","SBS","SMC","SO","SPRU","TLN","TRP","VG","VST","VVPR","WMB","WTRG"],
  Wholesale: ["AIT","ASH","ASPN","CAH","CENT","COSM","DPZ","DXPE","FERG","GPC","HFFG","HLF","LKQ","MCK","QXO","RELL","TEL","UGRO","VSTS","WKC"],
};

export default function LiveWatchlist() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const [dashboardTheme, setDashboardTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const apply = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setDashboardTheme(isDark ? "dark" : "light");
    };

    apply();

    window.addEventListener("signal97-settings-changed", apply);
    window.addEventListener("storage", apply);

    return () => {
      window.removeEventListener("signal97-settings-changed", apply);
      window.removeEventListener("storage", apply);
    };
  }, []);

  const isDark = dashboardTheme === "dark" || isDarkMode;

  const [query, setQuery] = useState("");
  const [view, setView] = useState<"bubbles" | "list">("bubbles");
  const [activeSector, setActiveSector] = useState<string | null>(null);
  const [hoverSector, setHoverSector] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Pan/Zoom (mobile + desktop)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Pointer gesture state
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    mode: "none" | "pan" | "pinch";
    startZoom: number;
    startPan: { x: number; y: number };
    startDist: number;
    startMid: { x: number; y: number };
  }>({
    mode: "none",
    startZoom: 1,
    startPan: { x: 0, y: 0 },
    startDist: 1,
    startMid: { x: 0, y: 0 },
  });

  const didInitView = useRef(false);
  useEffect(() => {
    if (!isMobile) return;
    if (didInitView.current) return;
    didInitView.current = true;
    setView("list");
  }, [isMobile]);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 900, h: 560 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      const w = Math.max(360, Math.floor(rect.width));
      const h = Math.max(420, Math.floor(rect.height));
      setSize({ w, h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 1100);
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
    return balloonDropPack(list, size.w, size.h, { mobile: isMobile });
  }, [filteredGroups, size.w, size.h, isMobile]);

  useEffect(() => {
    if (!activeSector) return;
    if (filteredGroups[activeSector]?.length) return;
    setActiveSector(null);
  }, [query, filteredGroups, activeSector]);

  const activeSymbols = useMemo(() => {
    if (!activeSector) return [];
    return filteredGroups[activeSector] || groups[activeSector] || [];
  }, [activeSector, filteredGroups, groups]);

  const ZOOM_MIN = 0.75;
  const ZOOM_MAX = 2.25;

  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  
  function isBubbleTarget(e: React.PointerEvent<SVGSVGElement>) {
    const t = e.target as any;
    return !!t?.closest?.('g[data-bubble="true"]');
  }

function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    // If user starts gesture on a bubble, let the bubble receive click/tap.
    if (isBubbleTarget(e)) return;
(e.currentTarget as any).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const pts = Array.from(pointers.current.values());
    if (pts.length === 1) {
      gesture.current = {
        mode: "pan",
        startZoom: zoom,
        startPan: { ...pan },
        startDist: 1,
        startMid: { x: pts[0].x, y: pts[0].y },
      };
    } else if (pts.length >= 2) {
      const a = pts[0];
      const b = pts[1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      gesture.current = {
        mode: "pinch",
        startZoom: zoom,
        startPan: { ...pan },
        startDist: dist,
        startMid: mid,
      };
    }
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!pointers.current.has(e.pointerId)) return;

    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = Array.from(pointers.current.values());

    if (gesture.current.mode === "pan" && pts.length === 1) {
      const cur = pts[0];
      const dx = cur.x - gesture.current.startMid.x;
      const dy = cur.y - gesture.current.startMid.y;
      setPan({ x: gesture.current.startPan.x + dx, y: gesture.current.startPan.y + dy });
    }

    if (pts.length >= 2) {
      const a = pts[0];
      const b = pts[1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };

      const scale = dist / Math.max(1, gesture.current.startDist);
      const nextZoom = clamp(gesture.current.startZoom * scale, ZOOM_MIN, ZOOM_MAX);

      const mdx = mid.x - gesture.current.startMid.x;
      const mdy = mid.y - gesture.current.startMid.y;

      setZoom(nextZoom);
      setPan({
        x: gesture.current.startPan.x + mdx,
        y: gesture.current.startPan.y + mdy,
      });
    }
  }

  function onPointerUp(e: React.PointerEvent<SVGSVGElement>) {
    pointers.current.delete(e.pointerId);
    const pts = Array.from(pointers.current.values());
    if (pts.length === 1) {
      gesture.current = {
        mode: "pan",
        startZoom: zoom,
        startPan: { ...pan },
        startDist: 1,
        startMid: { x: pts[0].x, y: pts[0].y },
      };
    } else {
      gesture.current.mode = "none";
    }
  }

  function onWheel(e: React.WheelEvent<SVGSVGElement>) {
    if (isMobile) return;
    e.preventDefault();
    const delta = -e.deltaY;
    const next = clamp(zoom + (delta > 0 ? 0.08 : -0.08), ZOOM_MIN, ZOOM_MAX);
    setZoom(next);
  }

  const mapBg = isDark
    ? "radial-gradient(circle at 18% 18%, rgba(59,130,246,0.22), transparent 48%)," +
      "radial-gradient(circle at 80% 18%, rgba(20,184,166,0.16), transparent 48%)," +
      "radial-gradient(circle at 50% 88%, rgba(99,102,241,0.14), transparent 50%)," +
      "linear-gradient(180deg, rgba(5,8,22,1) 0%, rgba(8,17,31,1) 48%, rgba(5,7,12,1) 100%)"
    : "radial-gradient(circle at 18% 18%, rgba(99,102,241,0.08), transparent 52%)," +
      "radial-gradient(circle at 78% 22%, rgba(16,185,129,0.07), transparent 54%)," +
      "radial-gradient(circle at 55% 85%, rgba(244,63,94,0.06), transparent 56%)," +
      "linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(255,255,255,1) 45%, rgba(248,250,252,1) 100%)";

  const actionBtn =
    "text-xs px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-900 text-white hover:bg-slate-800 transition dark:border-white/15 dark:bg-[#050816] dark:text-slate-100 dark:hover:bg-[#111827]";
  
  return (
    <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden dark:border-white/15 dark:bg-[#08111f] dark:shadow-[0_22px_70px_rgba(0,0,0,0.42)]">
      <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(20,184,166,0.12),transparent_32%),linear-gradient(135deg,#050816_0%,#08111f_52%,#0b1828_100%)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight dark:text-slate-100">
              Live Watchlist — Sector Balloons
            </h1>
            <p className="text-xs text-slate-600 mt-1 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200">{totals.shown}</span> / {totals.total} tickers
              <span className="mx-2 text-slate-300 dark:text-slate-600">•</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{totals.sectorsShown}</span> / {totals.sectors} sectors
              <span className="mx-2 text-slate-300 dark:text-slate-600">•</span>
              pastel • no overlap • pan/zoom friendly
            </p>
          </div>

          <div className="flex flex-col gap-2 w-full lg:w-[820px]">
            <div className="flex flex-col md:flex-row gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ticker or sector…"
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-slate-200/70 dark:border-white/15 dark:bg-[#0b1220] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-500/20"
              />

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setView((v) => (v === "bubbles" ? "list" : "bubbles"))}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition dark:border-white/15 dark:bg-[#0b1220] dark:text-slate-200 dark:hover:bg-[#111827]"
                >
                  {view === "bubbles" ? "List view" : "Balloon view"}
                </button>

                <button
                  onClick={() => {
                    setQuery("");
                    setActiveSector(null);
                    resetView();
                  }}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition dark:border-white/15 dark:bg-[#0b1220] dark:text-slate-200 dark:hover:bg-[#111827]"
                >
                  Reset
                </button>

                {view === "bubbles" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => clamp(z - 0.15, ZOOM_MIN, ZOOM_MAX))}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 hover:bg-slate-50 transition dark:border-white/15 dark:bg-[#0b1220] dark:text-slate-200 dark:hover:bg-[#111827]"
                      aria-label="Zoom out"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => clamp(z + 0.15, ZOOM_MIN, ZOOM_MAX))}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 hover:bg-slate-50 transition dark:border-white/15 dark:bg-[#0b1220] dark:text-slate-200 dark:hover:bg-[#111827]"
                      aria-label="Zoom in"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={resetView}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
                    >
                      Center
                    </button>
                  </>
                )}
              </div>
            </div>

            {activeSector ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm dark:border-white/15 dark:bg-[#0b1220]">  
                <div className="truncate">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{displaySectorName(activeSector)}</span>
                  <span className="mx-2 text-slate-300">•</span>
                  <span className="text-slate-600 dark:text-slate-400">{activeSymbols.length} tickers</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => copyToClipboard(activeSymbols.join(", "))} className={actionBtn}>
                    Copy all
                  </button>
                  <button onClick={() => setActiveSector(null)} className={actionBtn}>
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 dark:text-slate-500">
                Tip: drag to pan • pinch/scroll to zoom • tap a balloon
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
          <div className="px-4 py-2 rounded-2xl bg-slate-900 text-white text-sm shadow-lg">{toast}</div>
        </div>
      )}

      <div className="p-6">
        {view === "bubbles" ? (
          <>
            <div
              ref={wrapRef}
              className="relative w-full rounded-[28px] overflow-hidden border border-slate-200 dark:border-white/15 dark:shadow-[inset_0_0_80px_rgba(59,130,246,0.08)]"
              style={{ height: "min(78vh, 860px)", background: mapBg }}
            >
              <svg
                width={size.w}
                height={size.h}
                viewBox={`0 0 ${size.w} ${size.h}`}
                className="absolute inset-0"
                style={{ touchAction: "none" }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onWheel={onWheel}
              >
                <defs>
                  {bubbleData.map((b) => {
                    const t = themeForKey(b.key);
                    const id = `grad-${hashToHue(b.key)}`;
                    return (
                      <radialGradient key={id} id={id} cx="35%" cy="30%" r="78%">
                        <stop offset="0%" stopColor={t.fillA} />
                        <stop offset="70%" stopColor={t.fillB} />
                        <stop offset="100%" stopColor="rgba(255,255,255,0.10)" />
                      </radialGradient>
                    );
                  })}

                  <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  <filter id="labelShadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="rgba(15,23,42,0.25)" />
                  </filter>
                </defs>

                <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
                  {bubbleData.map((b) => {
                    const t = themeForKey(b.key);
                    const gradId = `grad-${hashToHue(b.key)}`;
                    const isActive = activeSector === b.key;
                    const lines = splitLabel(displaySectorName(b.key));

                    const titleSize = Math.max(11, Math.min(20, b.r * 0.18));
                    const subSize = Math.max(10, Math.min(15, b.r * 0.14));

                    return (
                      <g
                      data-bubble="true"
                      key={b.key}
                      style={{ cursor: "pointer" }}
                      onPointerDown={(e) => e.stopPropagation()}
                      onMouseEnter={() => setHoverSector(b.key)}
                      onMouseLeave={() => setHoverSector(null)}
                      onClick={() => setActiveSector((cur) => (cur === b.key ? null : b.key))}
                    >
                        <circle
                          cx={b.x}
                          cy={b.y}
                          r={b.r + (isActive ? 12 : 10)}
                          fill="transparent"
                          stroke={t.glow}
                          strokeWidth={isActive ? 3 : 2}
                          opacity={isActive ? 0.9 : 0.55}
                        />

                        <circle
                          cx={b.x}
                          cy={b.y}
                          r={b.r}
                          fill={`url(#${gradId})`}
                          stroke={t.stroke}
                          strokeWidth={1.4}
                          filter="url(#softGlow)"
                        />

                        <ellipse
                          cx={b.x - b.r * 0.22}
                          cy={b.y - b.r * 0.3}
                          rx={b.r * 0.34}
                          ry={b.r * 0.22}
                          fill="rgba(255,255,255,0.42)"
                          opacity={0.55}
                        />

                        <ellipse
                          cx={b.x}
                          cy={b.y + b.r * 0.92}
                          rx={Math.max(6, b.r * 0.1)}
                          ry={Math.max(4, b.r * 0.07)}
                          fill="rgba(15,23,42,0.08)"
                        />

                        <text
                          x={b.x}
                          y={b.y - (lines.length === 2 ? 6 : 2)}
                          textAnchor="middle"
                          fill={t.text}
                          fontSize={titleSize}
                          fontWeight={600}
                          filter="url(#labelShadow)"
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
                          fontWeight={500}
                          filter="url(#labelShadow)"
                          style={{ pointerEvents: "none" }}
                        >
                          {b.n} tickers
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>

              {hoverSector && (
                <div className="absolute top-4 left-4 rounded-2xl border border-slate-200 bg-white/90 backdrop-blur px-4 py-3 shadow-sm dark:border-white/15 dark:bg-[#0b1220]/90 dark:shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{displaySectorName(hoverSector)}</div>
                  <div className="text-xs text-slate-600 mt-0.5 dark:text-slate-400">
                    {(filteredGroups[hoverSector] || groups[hoverSector] || []).length} tickers
                  </div>
                </div>
              )}
            </div>

            {/* ✅ THIS IS THE FIX: show the tickers list BELOW the bubble map (not as an overlay). */}
            {activeSector && (
              <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-[#08111f] dark:shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-slate-900 truncate dark:text-slate-100">{displaySectorName(activeSector)}</div>
                    <div className="text-xs text-slate-600 mt-1 dark:text-slate-400">{activeSymbols.length} tickers</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => copyToClipboard(activeSymbols.join(", "))} className={actionBtn}>
                      Copy all
                    </button>
                    <button onClick={() => setActiveSector(null)} className={actionBtn}>
                      Close
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
                  {activeSymbols.map((sym) => {
                    const t = themeForKey(activeSector);
                    return (
                      <button
                        key={`${activeSector}:${sym}:below`}
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
          </>
        ) : (
          <div className="space-y-4">
            {Object.entries(filteredGroups)
              .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
              .map(([sector, syms]) => {
                const t = themeForKey(sector);
                const open = activeSector === sector;

                return (
                  <div
                    key={displaySectorName(sector)}
                    className="rounded-[28px] border border-slate-200 p-5 shadow-sm hover:shadow-md transition dark:border-white/15 dark:shadow-[0_18px_50px_rgba(0,0,0,0.28)]"
                    
                    style={{
                      backgroundColor: isDark
                        ? `hsla(${t.hue}, 35%, 12%, 0.96)`
                        : `hsla(${t.hue}, 45%, 97%, 1)`,
                    }}                    
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate dark:text-slate-100">{displaySectorName(sector)}</div>
                        <div className="text-xs text-slate-600 mt-1 dark:text-slate-400">{syms.length} tickers</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => copyToClipboard(syms.join(", "))} className={actionBtn}>
                          Copy all
                        </button>
                        <button
                          onClick={() => setActiveSector((cur) => (cur === sector ? null : sector))}
                          className="text-xs px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 transition dark:border-white/15 dark:bg-[#0b1220] dark:text-slate-200 dark:hover:bg-[#111827]"
                        >
                          {open ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    {open && (
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-2">
                        {syms.map((sym) => (
                          <button
                            key={`${displaySectorName(sector)}:${sym}`}
                            type="button"
                            onClick={() => copyToClipboard(sym)}
                            className="rounded-2xl border border-slate-200 bg-white/80 hover:bg-white text-slate-800 text-sm font-semibold px-3 py-2 transition hover:-translate-y-[1px] dark:border-white/15 dark:bg-[#0b1220] dark:text-slate-100 dark:hover:bg-[#111827]"
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
      </div>
    </div>
  );
}
