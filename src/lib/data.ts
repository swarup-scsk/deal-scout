export type CriteriaKey =
  | "strategicFit"
  | "profitability"
  | "portfolioSynergy"
  | "complexity"
  | "dataAvailability";

export type BusinessLineType =
  | "Asset Owner"
  | "Trader"
  | "Energy Supplier"
  | "Large Consumer"
  | "Optimizer/Aggregator"
  | "Service Provider";

export const CRITERIA: { key: CriteriaKey; label: string }[] = [
  { key: "strategicFit", label: "Strategic fit" },
  { key: "profitability", label: "Profitability potential" },
  { key: "portfolioSynergy", label: "Portfolio synergy" },
  { key: "complexity", label: "Deal complexity" },
  { key: "dataAvailability", label: "Data availability" },
];

export interface Scenario {
  id: string;
  title: string;
  description: string;
  criteria: Record<CriteriaKey, number>; // 1-5
}

export interface Counterparty {
  id: string;
  company: string;
  country: string;
  legalEntityName: string;
  lei: string;
  revenueEbitda: string;
  headcount: string;
  businessLine: string;
  businessLineType: BusinessLineType;
  markets: string;
  portfolioSize: string;
  gasMarket: string;
  powerMarket: string;
  annualVolume: number; // GWh/yr
  aiInsight: string;
  margin: number; // EUR margin estimate
  // sub-scores 0-100 for weighted fit computation
  sub: Record<CriteriaKey, number>;
  // qualification detail
  sector: string;
  priceHub: string;
  seasonalSwing: number; // 0-100
  creditworthiness: number; // 0-100
  contact: string;
  standing: string;
  lastContact: string;
  evidence: string[];
  suggestion: "Proceed" | "Hold" | "Decline";
  suggestionBasis: string;
  indicativeSizing: string;
  demandProfileFit: string;
  keyRisk: string;
}

export interface Config {
  rules: {
    targetVolume: number; // GWh/yr
    fitHigh: number;
    fitMid: number;
    returnGate: number; // EUR margin
  };
  weights: Record<CriteriaKey, number>; // 1-5
  thresholds: { green: number; amber: number; reject: number };
  scope: { commodity: string; region: string; hub: string };
}

export const defaultConfig: Config = {
  rules: { targetVolume: 800, fitHigh: 80, fitMid: 65, returnGate: 750000 },
  weights: {
    strategicFit: 5,
    profitability: 5,
    portfolioSynergy: 4,
    complexity: 2,
    dataAvailability: 3,
  },
  thresholds: { green: 80, amber: 65, reject: 60 },
  scope: { commodity: "Gas", region: "Northwest Europe", hub: "TTF" },
};

export const scenarios: Scenario[] = [
  {
    id: "gas-supply-storage",
    title: "Gas Supply + Storage",
    description: "Bundle firm gas supply with seasonal storage flexibility.",
    criteria: {
      strategicFit: 5,
      profitability: 5,
      portfolioSynergy: 5,
      complexity: 3,
      dataAvailability: 4,
    },
  },
  {
    id: "standalone-storage",
    title: "Standalone Storage Capacity",
    description: "Contract dedicated storage capacity for optimisation.",
    criteria: {
      strategicFit: 4,
      profitability: 3,
      portfolioSynergy: 4,
      complexity: 2,
      dataAvailability: 5,
    },
  },
  {
    id: "flexible-power",
    title: "Flexible Power Asset",
    description: "Tolling or offtake on a flexible generation asset.",
    criteria: {
      strategicFit: 3,
      profitability: 4,
      portfolioSynergy: 3,
      complexity: 4,
      dataAvailability: 3,
    },
  },
  {
    id: "corporate-ppa",
    title: "Corporate PPA",
    description: "Long-term power purchase with a corporate offtaker.",
    criteria: {
      strategicFit: 4,
      profitability: 3,
      portfolioSynergy: 3,
      complexity: 4,
      dataAvailability: 3,
    },
  },
  {
    id: "gas-producer-lng",
    title: "Gas Producer / LNG",
    description: "Upstream gas or LNG supply origination.",
    criteria: {
      strategicFit: 3,
      profitability: 4,
      portfolioSynergy: 2,
      complexity: 5,
      dataAvailability: 2,
    },
  },
];

export const counterparties: Counterparty[] = [
  {
    id: "vitalgas-nl",
    company: "VitalGas Nederland B.V.",
    country: "Netherlands",
    legalEntityName: "VitalGas Nederland B.V.",
    lei: "724500A1B2C3D4E5F601",
    revenueEbitda: "€2.4bn / €310m",
    headcount: "1,200",
    businessLine: "Gas supply & trading",
    businessLineType: "Energy Supplier",
    markets: "NL, DE (TTF, high-pressure grid)",
    portfolioSize: "3,200 GWh",
    gasMarket: "Active",
    powerMarket: "Limited",
    annualVolume: 3400,
    aiInsight: "Strong seasonal swing appetite; storage-linked demand rising.",
    margin: 1850000,
    sub: {
      strategicFit: 92,
      profitability: 90,
      portfolioSynergy: 94,
      complexity: 70,
      dataAvailability: 88,
    },
    sector: "Gas supply & trading",
    priceHub: "TTF",
    seasonalSwing: 88,
    creditworthiness: 90,
    contact: "M. de Vries (Head of Procurement)",
    standing: "Existing relationship — strong",
    lastContact: "12 days ago",
    evidence: [
      "Public storage bookings up 18% YoY (GIE AGSI).",
      "Reported €310m EBITDA, investment-grade profile.",
      "Winter demand curve implies ~600 GWh swing need.",
    ],
    suggestion: "Proceed",
    suggestionBasis: "High fit, volume well above target, margin above gate.",
    indicativeSizing: "~2,800 GWh firm + 600 GWh flex",
    demandProfileFit: "Excellent — pronounced winter peak aligns with storage.",
    keyRisk: "Competitive tender; incumbent supplier relationship.",
  },
  {
    id: "delta-energie-be",
    company: "Delta Energie N.V.",
    country: "Belgium",
    legalEntityName: "Delta Energie N.V.",
    lei: "549300F7G8H9I0J1K202",
    revenueEbitda: "€1.1bn / €140m",
    headcount: "640",
    businessLine: "Industrial energy supply",
    businessLineType: "Optimizer/Aggregator",
    markets: "BE, NL (TTF, ZTP)",
    portfolioSize: "1,800 GWh",
    gasMarket: "Active",
    powerMarket: "Active",
    annualVolume: 2100,
    aiInsight: "Dual-fuel optimiser; values bundled supply + flexibility.",
    margin: 1120000,
    sub: {
      strategicFit: 84,
      profitability: 82,
      portfolioSynergy: 86,
      complexity: 66,
      dataAvailability: 80,
    },
    sector: "Industrial energy supply",
    priceHub: "TTF / ZTP",
    seasonalSwing: 74,
    creditworthiness: 82,
    contact: "L. Peeters (Energy Manager)",
    standing: "Prior contact — neutral",
    lastContact: "2 months ago",
    evidence: [
      "Cross-border TTF/ZTP activity confirmed in REMIT filings.",
      "€140m EBITDA supports mid-size firm deal.",
      "Industrial load profile suggests moderate swing.",
    ],
    suggestion: "Proceed",
    suggestionBasis: "Fit above high threshold, volume above target.",
    indicativeSizing: "~1,700 GWh firm + 400 GWh flex",
    demandProfileFit: "Good — industrial baseload with moderate seasonality.",
    keyRisk: "Power-side hedging may complicate gas-only structure.",
  },
  {
    id: "haven-utilities-nl",
    company: "Haven Utilities Groep",
    country: "Netherlands",
    legalEntityName: "Haven Utilities Groep B.V.",
    lei: "724500L3M4N5O6P7Q803",
    revenueEbitda: "€780m / €72m",
    headcount: "410",
    businessLine: "Regional utility",
    businessLineType: "Energy Supplier",
    markets: "NL (TTF, regional distribution)",
    portfolioSize: "1,100 GWh",
    gasMarket: "Active",
    powerMarket: "Limited",
    annualVolume: 1250,
    aiInsight: "Storage-heavy profile; predictable municipal demand base.",
    margin: 820000,
    sub: {
      strategicFit: 78,
      profitability: 70,
      portfolioSynergy: 80,
      complexity: 60,
      dataAvailability: 84,
    },
    sector: "Regional utility",
    priceHub: "TTF",
    seasonalSwing: 82,
    creditworthiness: 76,
    contact: "S. Jansen (Trading Desk)",
    standing: "New prospect",
    lastContact: "No prior contact",
    evidence: [
      "Municipal supply obligations imply stable offtake.",
      "€72m EBITDA — margin above gate but limited headroom.",
      "High storage utilisation reported publicly.",
    ],
    suggestion: "Hold",
    suggestionBasis: "Fit below high threshold; margin near return gate.",
    indicativeSizing: "~1,000 GWh firm + 250 GWh flex",
    demandProfileFit: "Strong seasonality, but smaller absolute volume.",
    keyRisk: "Thin margin headroom above return gate.",
  },
  {
    id: "meridian-power-be",
    company: "Meridian Power S.A.",
    country: "Belgium",
    legalEntityName: "Meridian Power S.A.",
    lei: "549300R8S9T0U1V2W304",
    revenueEbitda: "€1.6bn / €205m",
    headcount: "890",
    businessLine: "Power generation",
    businessLineType: "Asset Owner",
    markets: "BE (power, CCGT dispatch)",
    portfolioSize: "2,400 GWh",
    gasMarket: "Limited",
    powerMarket: "Active",
    annualVolume: 900,
    aiInsight: "Gas needs tied to CCGT dispatch; spread-driven demand.",
    margin: 690000,
    sub: {
      strategicFit: 64,
      profitability: 68,
      portfolioSynergy: 58,
      complexity: 50,
      dataAvailability: 62,
    },
    sector: "Power generation",
    priceHub: "TTF",
    seasonalSwing: 55,
    creditworthiness: 80,
    contact: "A. Dubois (Fuel Procurement)",
    standing: "New prospect",
    lastContact: "No prior contact",
    evidence: [
      "CCGT fleet implies spark-spread-driven gas offtake.",
      "€205m EBITDA — strong credit but low margin on this deal.",
      "Limited storage need reduces synergy.",
    ],
    suggestion: "Hold",
    suggestionBasis: "Below high fit threshold and margin below return gate.",
    indicativeSizing: "~900 GWh interruptible",
    demandProfileFit: "Weak — dispatch-driven, low seasonal swing.",
    keyRisk: "Return gate breach — margin below €750k.",
  },
  {
    id: "noordzee-supply-nl",
    company: "Noordzee Supply Co.",
    country: "Netherlands",
    legalEntityName: "Noordzee Supply Coöperatie U.A.",
    lei: "724500X5Y6Z7A8B9C005",
    revenueEbitda: "€430m / €38m",
    headcount: "220",
    businessLine: "SME gas retailer",
    businessLineType: "Energy Supplier",
    markets: "NL (TTF retail)",
    portfolioSize: "600 GWh",
    gasMarket: "Active",
    powerMarket: "None",
    annualVolume: 620,
    aiInsight: "Growing retail book; volume currently below target.",
    margin: 540000,
    sub: {
      strategicFit: 66,
      profitability: 62,
      portfolioSynergy: 64,
      complexity: 72,
      dataAvailability: 70,
    },
    sector: "SME gas retailer",
    priceHub: "TTF",
    seasonalSwing: 68,
    creditworthiness: 64,
    contact: "R. Bakker (Founder)",
    standing: "New prospect",
    lastContact: "No prior contact",
    evidence: [
      "Retail book growth ~12% YoY but small base.",
      "€38m EBITDA — margin below return gate.",
      "Volume below 800 GWh target threshold.",
    ],
    suggestion: "Decline",
    suggestionBasis: "Below target volume and below return gate.",
    indicativeSizing: "~600 GWh firm",
    demandProfileFit: "Moderate seasonality but sub-scale.",
    keyRisk: "Volume and margin both below gates.",
  },
  {
    id: "kanaal-trading-be",
    company: "Kanaal Trading B.V.",
    country: "Belgium",
    legalEntityName: "Kanaal Trading B.V.",
    lei: "549300D1E2F3G4H5I606",
    revenueEbitda: "€900m / €95m",
    headcount: "500",
    businessLine: "Merchant trading",
    businessLineType: "Trader",
    markets: "BE, NL (TTF, ZTP)",
    portfolioSize: "1,500 GWh",
    gasMarket: "Active",
    powerMarket: "Active",
    annualVolume: 1600,
    aiInsight: "Opportunistic optimiser; flexible on structure and hub.",
    margin: 980000,
    sub: {
      strategicFit: 80,
      profitability: 84,
      portfolioSynergy: 72,
      complexity: 58,
      dataAvailability: 76,
    },
    sector: "Merchant trading",
    priceHub: "TTF / ZTP",
    seasonalSwing: 60,
    creditworthiness: 78,
    contact: "T. Claes (Head of Origination)",
    standing: "Prior contact — positive",
    lastContact: "5 weeks ago",
    evidence: [
      "Active two-way flows across TTF and ZTP.",
      "€95m EBITDA supports mid-size margin.",
      "Flexible counterparty open to storage-linked terms.",
    ],
    suggestion: "Proceed",
    suggestionBasis: "Fit at threshold, volume above target, margin above gate.",
    indicativeSizing: "~1,400 GWh firm + 200 GWh flex",
    demandProfileFit: "Trading-driven; flexible but lower intrinsic swing.",
    keyRisk: "Lower portfolio synergy; price-sensitive.",
  },
];

export function fitScore(cp: Counterparty, weights: Record<CriteriaKey, number>): number {
  const totalW = CRITERIA.reduce((s, c) => s + weights[c.key], 0) || 1;
  const weighted =
    CRITERIA.reduce((s, c) => s + cp.sub[c.key] * weights[c.key], 0) / totalW;
  return Math.round(weighted);
}

export function fitColorClass(score: number, t: Config["thresholds"]): string {
  if (score >= t.green) return "text-success";
  if (score >= t.amber) return "text-warning";
  return "text-muted-foreground";
}

export function fitBarClass(score: number, t: Config["thresholds"]): string {
  if (score >= t.green) return "bg-success";
  if (score >= t.amber) return "bg-warning";
  return "bg-muted-foreground";
}
