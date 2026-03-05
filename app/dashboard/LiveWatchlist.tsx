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
const GROUPS: IndustryGroups = {"Agriculture/Forestry/Fishing":["AGRO","CALM","VFF"],"Construction":["AMRC","BBCP","BZH","DHI","DY","FIX","GEO","GRBK","GVA","LEN","MTZ","PHM","STRL","TOL","TPC","TPH"],"Finance/Insurance/Real Estate":["AAMI","ABCB","ABR","ABTC","ACGL","AEXA","AFL","AFRM","AGNC","AGQ","AIFU","AIG","ALHC","ALRS","ALTS","AMBR","AMH","AMP","AMT","ANY","APO","APPS","ARBK","ARE","ARES","ASB","ASST","AUB","AXP","BAC","BAM","BBAR","BBT","BCS","BDN","BEKE","BFST","BHF","BITF","BK","BKKT","BLK","BLSH","BMNR","BN","BNL","BOIL","BRO","BRR","BSOL","BTBT","BTDR","BULL","BUSE","BWET","BWIN","BX","C","CAN","CATY","CBOE","CBRE","CBSH","CCBG","CDP","CG","CHMI","CHYM","CI","CIA","CIFR","CLDT","CLOV","CLSK","CME","CMTG","CNC","CNO","COF","COIN","COMP","CORZ","CPT","CRCL","CSR","CTBI","CTRE","CUBE","CWK","CZNC","DB","DBRG","DEI","DFDV","DGXX","DLR","DOUG","EBC","ECPG","EGBN","EHTH","EIG","ELME","ELS","EQBK","EQIX","ESNT","ESS","ETH","ETHA","ETHE","ETHZ","EZBC","FBTC","FFBC","FFIN","FG","FGNX","FHN","FIGR","FISI","FLG","FNF","FRGE","FSP","FUTU","FWDI","GBTC","GDOT","GEMI","GGAL","GLD","GLXY","GPMT","GS","HASI","HIVE","HLNE","HOOD","HOPE","HR","HRTG","HSBC","HST","HTBK","HUM","HUT","IAU","IBIT","IBKR","ICE","INVH","IREN","IRM","JEF","JPM","JRVR","KKR","KOLD","LB","LC","LDI","LINE","LMND","LNC","LPRO","LX","LXP","MAC","MARA","MC","MCHB","MIAX","MOH","MRP","MRX","MS","MSTR","MTG","MUFG","NAKA","NDAQ","NLY","NRT","NSA","NTST","NU","OPAD","OPEN","OPRT","ORBS","ORC","OSCR","OWL","PEB","PGR","PGY","PKST","PLD","PNC","PNFP","QFIN","RC","RILY","RIOT","RKT","RYAN","RYN","SAN","SBCF","SBET","SCHW","SIEB","SKYH","SLAI","SLDE","SLG","SLM","SLQT","SLV","SMA","SOFI","SSRM","SUIG","SUPV","SVC","SVIX","TBBK","TFC","TIGR","TPG","TWO","UBSI","UCB","UNG","UNH","UPST","UPXI","USB","USO","UVIX","UVXY","UWMC","VNO","VXX","WFC","WNEB","WRB","WULF","WY","WYFI","XP","YRD"],"Manufacturing":["A","AA","AAOI","AAPL","ABBV","ABCL","ABEV","ABT","ABVC","ABVE","ABVX","ACAD","ACB","ACHR","ACHV","ACLX","ACMR","ACRS","ACXP","ADCT","ADI","ADMA","ADNT","ADPT","AEHR","AEVA","AGCO","AGIO","AIR","AIRJ","AKBA","ALAB","ALB","ALC","ALDX","ALEC","ALGM","ALGN","ALH","ALKS","ALLO","ALMS","ALMU","ALNY","ALT","ALTO","ALXO","AMAT","AMBA","AMD","AME","AMGN","AMLX","AMPG","AMPX","AMRN","AMRZ","AMSC","AMTX","ANAB","ANET","ANGO","ANNX","ANRO","ANVS","AOSL","AOUT","AP","APD","APGE","APH","APLS","APT","APTV","AQMS","AQST","ARCT","ARDX","ARM","ARQT","ARRY","AS","ASMB","ASML","ASPI","ASX","ATAI","ATEC","ATER","ATI","ATOM","ATOS","ATRO","ATYR","AUDC","AUTL","AVAV","AVD","AVGO","AVNT","AVTX","AXSM","AXTI","BA","BAX","BBIO","BBNX","BC","BCAB","BCAX","BCRX","BE","BEAM","BFLY","BG","BHC","BHVN","BIIB","BIOX","BIRK","BKSY","BLBD","BLDP","BLFS","BLNK","BLRX","BMEA","BMRN","BMY","BNKK","BNTC","BOOM","BP","BRCC","BRKR","BRLT","BSX","BTAI","BUD","BW","BWEN","BWXT","BYND","BYRN","CAAS","CABA","CAG","CAL","CAPR","CAPT","CAT","CATX","CBAT","CBUS","CC","CCCC","CCU","CE","CELH","CELU","CENX","CF","CGC","CGEM","CGEN","CGNX","CHD","CHPT","CIEN","CL","CLMT","CLPT","CLS","CMBM","CMC","CMI","CMPS","CMTL","CNH","CNMD","CNTA","COCO","CODI","CODX","COGT","COHR","COKE","COLM","COP","CPB","CPIX","CPS","CR","CRBU","CRDF","CRDO","CRH","CRI","CRMD","CRNT","CRON","CROX","CRSP","CRVS","CSCO","CSIQ","CSL","CSTM","CSW","CTAS","CTKB","CTMX","CTSO","CTXR","CVGI","CVI","CVM","CVRX","CVX","CW","CXT","CYRX","CYTK","DAIO","DAKT","DAWN","DCTH","DE","DECK","DELL","DFLI","DGII","DHR","DK","DNA","DNLI","DNTH","DOW","DPRO","DRIO","DRS","DXCM","DYAI","DYN","EAF","EBS","ECL","EDIT","EH","EL","ELAN","ELDN","ELF","ELVN","EMBC","EMPD","EMR","ENOV","ENPH","ENTA","ENTG","ENTX","ENVX","EOLS","EOSE","EPAC","EQ","EQNR","ERII","ESI","ESPR","ESTA","ETN","EVLV","EVTL","EWTX","EXEL","EXTR","EYE","EYPT","F","FATE","FBIO","FCEL","FDMT","FFAI","FFIV","FHTX","FIGS","FLEX","FLNC","FLO","FLY","FN","FOSL","FOXF","FRPT","FSLR","FTCI","FTI","FTK","FTNT","FULC","GALT","GD","GE","GEHC","GEOS","GERN","GEV","GGB","GHRS","GILD","GKOS","GLUE","GLW","GM","GMAB","GMED","GNRC","GNSS","GOOS","GOSS","GPCR","GPK","GPRO","GSIT","GSK","GTES","GTX","HII","HIMX","HLMN","HOG","HON","HOWL","HPE","HPQ","HRL","HRMY","HSAI","HSDT","HSY","HTFL","HTOO","HUMA","HUN","HWM","HXL","HY","HYFT","HYLN","IBM","IBRX","IFF","IFRX","ILMN","IMAX","IMMX","IMNM","IMRX","INBX","INDI","INDV","INO","INSG","INSM","INSP","INTC","INVZ","IOVA","IP","IRD","ISPR","ISRG","ITP","IVVD","JANX","JAZZ","JBS","JCI","JNJ","JOBY","JSPR","KDP","KHC","KLAC","KLIC","KMB","KMT","KO","KOD","KODK","KOPN","KPTI","KRMD","KROS","KRRO","KTOS","KULR","KVUE","KYTX","LAES","LASE","LASR","LCID","LEA","LEG","LENZ","LEVI","LFCR","LFWD","LHX","LI","LITE","LLY","LMT","LNAI","LNTH","LNZA","LODE","LOMA","LPTH","LPX","LQDA","LRCX","LRMR","LSCC","LTRN","LULU","LUNR","LW","LWLG","LXEO","LXRX","LYB","LYEL","LYTS","MASS","MAT","MATV","MAXN","MBC","MBOT","MBX","MCHP","MCRB","MDLZ","MDT","MEC","MEI","MGA","MHK","MIDD","MIR","MIRM","MIST","MLTX","MLYS","MMM","MNKD","MO","MOD","MPC","MRK","MRNA","MRVL","MT","MU","MVIS","MVST","MX","MXL","MYGN","MYO","NAGE","NAMS","NBP","NEOG","NEON","NGNE","NIO","NKE","NKTX","NMRA","NN","NNOX","NNVC","NOK","NOMD","NPWR","NRGV","NRIX","NRXP","NSPR","NTAP","NTLA","NTR","NUVB","NVAX","NVDA","NVO","NVST","NVTS","NWL","NX","NXPI","OBIO","OC","OCUL","ODD","OGN","OI","OLED","OLMA","OLN","OM","OMCL","OMER","ON","ONDS","ONON","ORGN","ORGO","ORKA","OSK","OSS","OTLK","OUST","OXM","PACB","PACK","PANW","PATK","PBF","PBYI","PCRX","PCT","PCVX","PDSB","PENG","PEP","PFE","PG","PGEN","PI","PII","PL","PLAB","PLUG","PLX","PM","PMVP","POET","POST","POWI","PPBT","PPC","PPG","PPSI","PRAX","PRGO","PRLD","PRM","PRMB","PRME","PROK","PRPH","PRQR","PRTA","PSNY","PSX","PTCT","PTON","PVLA","QCOM","QRVO","QS","QSI","QTRX","QURE","RAIL","RAL","RANI","RAPP","RCKT","RDW","REGN","REPL","RGC","RIGL","RIVN","RKLB","RLAY","RLMD","RMTI","ROIV","RR","RTX","RUN","RVPH","RVTY","RXRX","RYAM","RZLT","SANA","SANM","SARO","SATL","SAVA","SEDG","SEER","SEI","SENS","SEPN","SERV","SES","SEV","SGHT","SGMO","SGMT","SHLS","SHOO","SIGA","SKIN","SKYE","SKYT","SLDP","SLGN","SLI","SLN","SLNO","SLS","SMCI","SMMT","SMR","SMTC","SNBR","SNDK","SNDX","SOLS","SONO","SONY","SPRO","SPRY","SQNS","SRPT","SRRK","ST","STAA","STIM","STLA","STM","STOK","STRO","STSS","STVN","STX","STXS","STZ","SU","SUPN","SUZ","SVRA","SWKS","SXC","SYM","SYNA","SYRE","TAP","TARA","TARS","TE","TECH","TECX","TELA","TER","TERN","TEVA","TEX","TGTX","TKR","TLRY","TMCI","TMDX","TMO","TNDM","TNGX","TNXP","TNYA","TPR","TREX","TRI","TRIB","TROX","TRVI","TS","TSE","TSHA","TSLA","TSM","TT","TTC","TTMI","TVRD","TWI","TWST","TXG","TXN","TXT","UA","UAMY","UMAC","UMC","UNCY","UPB","URGN","VCEL","VERA","VERU","VFC","VFS","VIAV","VIR","VITL","VKTX","VLO","VNDA","VOR","VOYG","VRDN","VREX","VRT","VRTX","VSH","VSTM","VTYX","VUZI","VVV","VYGR","WATT","WBX","WDC","WFRD","WHD","WKHS","WLK","WOLF","WRAP","WRBY","WVE","WWD","XAIR","XENE","XERS","XFOR","XNCR","XOM","XPEV","XXII","YETI","YPF","YSG","ZBIO","ZEPP","ZLAB","ZTS","ZURA","ZVRA"],"Mining":["ABAT","ACDC","AEM","AESI","AG","AGI","AMPY","APA","AR","B","BHP","BKV","BTE","BTG","BTU","BVN","CCJ","CDE","CHRD","CLB","CLF","CNQ","CNR","CRC","CRGY","CRK","CRML","CTRA","CVE","DNN","DVN","EC","EOG","EPSN","EQT","EQX","ERO","EXE","FANG","FCX","GFI","GROY","GSM","HAL","HBM","HCC","HESM","HL","HMY","HP","HPK","HYMC","IAG","IDR","IE","KGC","KLXE","KOS","LAC","LGO","METC","MGY","MP","MUX","NAK","NB","NEM","NEWP","NG","NOG","NUAI","NVA","NXE","OBE","ODV","OII","ORLA","OXY","PAAS","PBR","RIG","RRC","SA","SCCO","SDRL","SGML","SHEL","SKE","SLB","SM","SOC","SQM","SVM","TALO","TECK","TGB","TMC","TMQ","TTI","UEC","USAR","USAS","USAU","UUUU","VAL","VALE","VIST","VMC","VNOM","VOC","WDS","WPM","WTTR","WWR","XPRO"],"Retail Trade":["AAP","ABG","ACI","AEO","AMZN","ANF","ARHS","ARMK","ASO","BARK","BBBY","BBWI","BBY","BJ","BKE","BLMN","BNED","BROS","BURL","CAKE","CAVA","CBRL","CHWY","CMG","COST","CPNG","CTRN","CVNA","CVS","DBI","DDL","DG","DKS","DLTR","DNUT","DRI","EAT","ELA","FIVE","FLWS","FND","GAP","GCO","GCT","GME","GO","HD","JACK","JD","JMIA","KMX","KR","KSS","LESL","LOW","LUXE","LVO","M","MCD","OLLI","PETS","PLAY","PLBY","PLCE","PTLO","PZZA","QVCGA","REAL","RH","ROST","RVLV","SBUX","SFIX","SFM","SG","SHAK","SIG","STKS","SVV","TGT","TJX","TSCO","TXRH","ULTA","URBN","VIPS","VRM","VSCO","W","WEN","WMT","WOOF"],"Services":["ABM","ABNB","ABSI","ACEL","ACN","ACVA","ADBE","ADP","ADSK","ADV","AEYE","AGYS","AI","AIRS","AISP","AKAM","ALKT","AMC","AMTM","ANGI","ANGX","APG","API","APLD","APP","APPF","APPN","ARBE","ARQQ","ASAN","ASUR","AUR","AVAH","AVPT","BABA","BAH","BAND","BATRA","BB","BBAI","BDSX","BGSF","BIDU","BILI","BILL","BKD","BL","BLZE","BMBL","BRAG","BRSL","BRZE","BSY","BTSG","CAI","CAR","CARG","CARS","CART","CCLD","CCSI","CDLX","CDNS","CELC","CFLT","CGNT","CHGG","CHH","CINT","CLVT","CMRC","CNVS","CNXC","CRL","CRM","CRNC","CRWD","CRWV","CSGP","CURI","CVLT","CWAN","CXAI","CXM","CYH","CZR","DASH","DBX","DCBO","DCGO","DDD","DDOG","DH","DHX","DIS","DJT","DKNG","DLO","DMRC","DOCN","DOCS","DOCU","DSGX","DSP","DUOL","DV","EA","EBAY","EGHT","ESTC","ETSY","EVGO","EVTC","FDS","FIG","FIS","FIVN","FLL","FLUT","FNGR","FROG","FRSH","FSLY","FTAI","FTRE","FUBO","FUN","GDDY","GDRX","GDS","GETY","GH","GLBE","GMGI","GOOG","GOOGL","GPN","GRAB","GRAL","GRND","GRPN","GRRR","GTLB","GTM","GWRE","HCAT","HCSG","HGV","HIMS","HLT","HNGE","HQY","HTZ","HUBS","IAC","INCY","INFY","INOD","INTU","IONQ","IOT","IQ","IT","KC","KD","KDK","KLC","LDOS","LFMD","LFST","LIF","LPSN","LTH","LUCK","LVS","LYFT","LZ","MA","MAN","MANU","MAR","MAX","MBLY","MDB","MELI","META","MGM","MLCO","MMS","MNY","MSCI","MSFT","MTLS","MXCT","NBIS","NCMI","NCNO","NEO","NET","NFLX","NOTE","NOTV","NOW","NRDY","NSP","NTNX","NTRA","NTSK","OKTA","OPCH","ORCL","PACS","PATH","PAY","PAYC","PAYO","PCTY","PD","PDD","PDYN","PEGA","PENN","PGNY","PHUN","PINS","PK","PLNT","PLTR","PONY","PRCH","PRKS","PSFE","PSNL","PSQH","PUBM","PYPL","QBTS","QTWO","QUBT","RBLX","RBRK","RCAT","RDDT","RDNT","RDNW","RELY","RGTI","RHI","RNG","RPD","RSI","RSKD","RUM","RXT","RZLV","S","SABR","SAIC","SAIL","SAP","SE","SERA","SGHC","SGRY","SHO","SHOP","SLP","SMSI","SNAP","SNOW","SNPS","SOGP","SOUN","SPGI","SPT","SRAD","SRTA","STEM","STNE","STUB","SY","TAL","TDC","TDOC","TEAD","TEAM","TEM","TENB","TIC","TLS","TNL","TOI","TONX","TOON","TOST","TRIP","TSSI","TTAN","TTD","TTEK","TTWO","TUYA","TWLO","U","UBER","UDMY","UHS","UPBD","UPWK","URI","V","VCYT","VERI","VERX","VNET","VRAR","VRNS","WAY","WDAY","WEAV","WGS","WH","WIT","WMG","WRD","WSC","WW","WYNN","XGN","XNET","XPOF","XYZ","YELP","YEXT","YQ","YYAI","ZENA","ZETA","ZG","ZIP","ZM","ZS"],"Transportation/Utilities":["AAL","ADEA","AEE","AES","ALK","AM","AMCX","AMX","AQN","ASTS","BEPC","BKNG","CCEC","CCL","CCOI","CDZI","CEG","CEPU","CHTR","CLNE","CMBT","CMCSA","CMS","CNI","CP","CSX","CTRI","CUK","CWEN","CWST","D","DAL","DINO","EIX","EPD","ES","ET","EXPE","FDX","FIP","FLNG","FOXA","FRO","FTS","FWRD","GBTG","GLIBK","GLNG","GSAT","GTN","HUBG","IHRT","IHS","IRDM","JBLU","KEX","KGS","KMI","KNTK","LBRDK","LNG","LUMN","LUV","MMYT","MNTK","NAT","NCLH","NEE","NEXT","NFE","NFG","NMAX","NNE","NRG","NSC","NVGS","OKLO","OMEX","OPTT","ORA","PAA","PCG","PSKY","QRHC","RCL","ROKU","RXO","RYAAY","SATS","SBGI","SBS","SIRI","SMC","SMHI","SNCY","SO","SOBO","SPCE","SPIR","SPOT","SPRU","SSP","STNG","SURG","T","TDS","TEN","TLN","TME","TMUS","TORO","TRP","TSAT","TSQ","TTGT","UAL","ULCC","UNIT","UNP","UONEK","UP","UPS","VG","VIK","VOD","VSAT","VST","VVPR","VZ","WBD","WERN","WMB","WTRG","ZIM"],"Unknown":["AAPU","AGIX","AIRR","AIYY","AMDL","AMZW","AMZZ","APLT","ARKG","ARKK","ARKW","ASHR","ASTX","ATHA","AVGG","AVGX","AVL","AVMV","AVUV","AXL","AZYY","BABX","BAGY","BAIG","BBH","BBJP","BCD","BCSF","BEDZ","BETZ","BITO","BITX","BITY","BLCN","BMNG","BOND","BOTZ","BSV","BTAL","BTCL","BUG","BULU","BUZZ","BXSL","CADE","CASI","CCCX","CCOR","CCUP","CIVI","CLSX","CMPO","CNBS","COMM","CONI","CONL","CORO","CRCA","CRCD","CRWG","CRWU","CSD","CVAC","CWVX","CYBN","DBEF","DFAS","DFIP","DFUV","DGRS","DIA","DISV","DIVI","DJTU","DLN","DMAT","DOL","DPST","DRIP","DRN","DTCR","DUHP","DUSA","DUST","DVAX","DVY","EBIZ","ECH","EDV","EEM","EETH","EFA","EFAV","EMB","ENPX","ESGV","ETHD","ETHT","ETHU","EUFN","EVMT","EWG","EWJ","EWM","EWZ","EWZS","FAS","FCG","FDEM","FDIS","FDVV","FEM","FENI","FEZ","FHEQ","FIGG","FLAX","FMET","FNX","FPE","FPWR","FSK","FTXR","FV","FXI","FYBR","GDX","GDXJ","GES","GLGG","GLXU","HIBL","HIBS","HIMZ","HOOX","HOUS","HYG","ICLN","IEF","INTW","IONX","IONZ","IRE","IREX","IVV","IWM","IYR","JAMF","JDST","JETS","KRE","KWEB","KYN","LABD","LABU","LABX","LQD","MAGS","METU","MNMD","MNRS","MODG","MPW","MRAL","MRSN","MSOS","MSTU","MSTX","MSTY","MSTZ","MULL","NAIL","NAN","NBIG","NINE","NUGT","NVDL","NVDS","NVDU","NVDX","NVTX","OMI","PCH","PLTU","PSEC","PXIU","QPUX","QQQ","QUBX","REVG","RGTU","RIOX","RKLX","ROBN","RSP","SBIT","SCHD","SILJ","SMCL","SMCX","SMH","SMLR","SMST","SMU","SMUP","SOFX","SOLT","SOXL","SOXS","SOXX","SPXL","SPXS","SPXU","SPY","SQQQ","SSO","TARK","TECL","THS","TLT","TMF","TNA","TQQQ","TRUE","TSDD","TSLG","TSLL","TSLQ","TSLR","TSLT","TSLZ","TZA","ULTY","UPRO","URA","URTY","USD","VOO","WEBL","WGMI","XBI","XHB","XLB","XLC","XLE","XLF","XLI","XLK","XLP","XLU","XLV","XLY","XOP","XRPT","XRT","YINN"],"Wholesale Trade":["AIT","ASH","ASPN","CAH","CENT","COSM","DPZ","DXPE","FERG","GPC","HFFG","HLF","LKQ","MCK","QXO","RELL","TEL","UGRO","VSTS","WKC"]};

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
