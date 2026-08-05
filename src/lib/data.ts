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

export type Pillar = "structured-flow" | "asset-backed";

export const PILLARS: { id: Pillar; label: string }[] = [
  { id: "structured-flow", label: "Structured flow" },
  { id: "asset-backed", label: "Asset-backed trading" },
];

export interface Criterion {
  key: string;
  label: string;
  metric: string;
  inverse?: boolean;
  optional?: boolean;
}

export interface Scenario {
  id: string;
  pillar: Pillar;
  title: string;
  description?: string;
  testCase?: boolean;
  criteria: Record<CriteriaKey, number>; // legacy generic profile
  spec: Criterion[]; // ranking/filter criteria (Michael's model)
}

// Real, sourced regulatory identity for a featured counterparty (demo).
// These carry genuine data retrieved from Ofgem + GLEIF, unlike the mocked fields.
export interface OfgemLicence {
  companyNumber: string;
  electricity?: string;
  gas?: string;
  retrieved: string;
  electricityUrl: string;
  gasUrl: string;
}

export interface GleifSnapshot {
  lei: string;
  legalName: string;
  companyNumber: string;
  status: string; // entity status, e.g. ACTIVE
  registrationStatus: string; // e.g. ISSUED
  corroboration: string; // e.g. FULLY_CORROBORATED
  hq: string; // e.g. "Nottingham, GB"
  lastUpdate: string; // e.g. 2026-05-18
  note?: string;
}

// Real filed financials from Companies House / audited accounts (verified snapshot).
export interface CompaniesHouseFinancials {
  fiscalYear: string;
  revenue: string;
  revenueGrowth?: string;
  adjEbitda?: string;
  profitBeforeTax?: string;
  netCash?: string;
  deliveredVolume?: string;
  companyNumber: string;
  basis: string;
  source: string;
  retrieved: string;
  url: string;
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
  // Optional real, sourced data (present only for the featured demo counterparty).
  realData?: boolean;
  regulatory?: OfgemLicence;
  gleif?: GleifSnapshot;
  financials?: CompaniesHouseFinancials;
}

// The one counterparty backed by real, retrieved data (Ofgem + GLEIF) for the demo.
export const FEATURED_COUNTERPARTY_ID = "yu-energy-gb";

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

// The configurable part of a scenario. Scope stays global; each scenario can
// override weights, thresholds and rules.
export interface ScenarioConfig {
  thresholds: { green: number; amber: number; reject: number };
  rules: { targetVolume: number; fitHigh: number; fitMid: number; returnGate: number };
}

// A scenario inherits the global config and applies its own overrides on top.
export function inheritConfig(
  global: Config,
  override?: Partial<ScenarioConfig>,
): ScenarioConfig {
  return {
    thresholds: { ...global.thresholds, ...(override?.thresholds ?? {}) },
    rules: { ...global.rules, ...(override?.rules ?? {}) },
  };
}

const GEN: Record<CriteriaKey, number> = {
  strategicFit: 4,
  profitability: 4,
  portfolioSynergy: 3,
  complexity: 3,
  dataAvailability: 3,
};

export const scenarios: Scenario[] = [
  {
    id: "demand-market-access",
    pillar: "structured-flow",
    title: "Demand Market Access",
    criteria: GEN,
    spec: [
      { key: "market-access-gap", label: "Market Access Gap", metric: "Number of direct exchange or clearing memberships (ICE, EEX)" },
      { key: "balance-sheet-fit", label: "Balance Sheet Fit", metric: "Annual revenue or net assets" },
      { key: "consumption-volume", label: "Consumption Volume", metric: "Annual gas or power consumption (GWh)" },
      { key: "contract-flexibility", label: "Contract Flexibility Signal", metric: "Current contract type (fixed or captive vs flexible)" },
      { key: "licensing-threshold", label: "Licensing Threshold Status", metric: "Below or above supply licence exemption threshold" },
      { key: "expansion-signals", label: "Expansion Signals", metric: "Capex or expansion announcements (last 12 months)" },
    ],
  },
  {
    id: "asset-market-access",
    pillar: "structured-flow",
    title: "Asset Market Access",
    criteria: GEN,
    spec: [
      { key: "asset-size-fit", label: "Asset Size Fit", metric: "Installed capacity (MW) or production (mcm/day)" },
      { key: "route-to-market-lockin", label: "Route-to-Market Lock-in", metric: "PPA or offtake coverage status", inverse: true },
      { key: "inhouse-trading", label: "In-house Trading Capability", metric: "Trading desk or licensed traders", inverse: true },
      { key: "creditworthiness-band", label: "Creditworthiness Band", metric: "Net assets or credit rating proxy" },
      { key: "flexibility-value", label: "Flexibility / Optionality Value", metric: "Asset type: storage, peaker, co-located battery vs baseload" },
      { key: "hub-proximity", label: "Hub Proximity", metric: "Can trade on a virtual trading point" },
    ],
  },
  {
    id: "trading-market-access",
    pillar: "structured-flow",
    title: "Trading Market Access",
    criteria: GEN,
    spec: [
      { key: "efet-without-access", label: "EFET Signatory Without Access", metric: "On EFET member list but absent from exchange or clearing member list" },
      { key: "trading-activity", label: "Trading Activity Level", metric: "Estimated annual traded volume (TWh or lots)" },
      { key: "margin-capacity", label: "Margining / Collateral Capacity", metric: "Available cash or net assets as proxy" },
      { key: "product-overlap", label: "Product Scope Overlap", metric: "Overlapping products (gas, power, carbon) vs SEE DMA offering" },
      { key: "existing-dma", label: "Existing DMA / Broker Relationships", metric: "Number of known existing DMA providers", inverse: true },
      { key: "reg-permissions-gap", label: "Regulatory Permissions Gap", metric: "Holds MiFID or EMIR permissions but lacks execution access" },
    ],
  },
  {
    id: "working-capital",
    pillar: "structured-flow",
    title: "Working Capital",
    criteria: GEN,
    spec: [
      { key: "wc-intensity", label: "Working Capital Intensity", metric: "Inventory or unbilled revenue as percent of revenue" },
      { key: "liquidity-tightness", label: "Liquidity Tightness", metric: "Current ratio or quick ratio" },
      { key: "facility-utilisation", label: "Existing Facility Utilisation", metric: "Registered charges or debentures nearing apparent limits" },
      { key: "collateral-quality", label: "Collateral Quality", metric: "Eligible physical inventory (storage gas, EUA/UKA, RECs)" },
      { key: "credit-risk-grade", label: "Credit Risk Grade", metric: "Credit rating or D&B risk score" },
      { key: "deal-size", label: "Estimated Deal Size", metric: "Implied financing need (volume x price exposure)" },
    ],
  },
  {
    id: "gas-storage",
    pillar: "asset-backed",
    title: "Gas Storage",
    criteria: GEN,
    spec: [
      { key: "capacity-util-gap", label: "Capacity Utilisation Gap", metric: "Booked vs utilised capacity percent (primary holders)" },
      { key: "existing-storage", label: "Existing Storage Holdings", metric: "Booked storage capacity (mcm)", inverse: true },
      { key: "balance-sheet-capacity", label: "Balance Sheet for Capacity Payments", metric: "Net assets or credit proxy" },
      { key: "auction-history", label: "Auction Participation History", metric: "Past storage or capacity auction bids" },
      { key: "portfolio-flex", label: "Portfolio Flexibility Requirement", metric: "Swing or imbalance exposure in portfolio" },
    ],
  },
  {
    id: "transport-capacity",
    pillar: "asset-backed",
    title: "Transport Capacity (Pipeline, PTR/FTR)",
    criteria: GEN,
    spec: [
      { key: "capacity-util-gap", label: "Capacity Utilisation Gap", metric: "Booked vs utilised capacity percent" },
      { key: "unhedged-ftr", label: "Unhedged FTR / PTR Position", metric: "Open FTR or PTR exposure without offsetting hedge" },
      { key: "margin-capacity", label: "Margin / Collateral Capacity", metric: "Available cash or net assets" },
      { key: "reg-allocation", label: "Regulatory Capacity Allocation Eligibility", metric: "Eligibility for primary or secondary allocation" },
      { key: "secondary-activity", label: "Historical Secondary Market Activity", metric: "Secondary trades or transfers in past 12 months" },
    ],
  },
  {
    id: "non-re-tolls",
    pillar: "asset-backed",
    title: "Non-RE Generation Tolls",
    criteria: GEN,
    spec: [
      { key: "plant-size-fit", label: "Plant Size Fit", metric: "Installed capacity (MW)" },
      { key: "merchant-exposure", label: "Merchant Exposure", metric: "Percent of output uncontracted" },
      { key: "inhouse-trading", label: "In-house Trading Capability", metric: "Trading or optimisation desk presence", inverse: true },
      { key: "dispatch-flex", label: "Dispatch Flexibility Value", metric: "Start-up time, ramp rate, load factor", optional: true },
      { key: "fuel-complexity", label: "Fuel Supply Complexity", metric: "Feedstock-linked structuring need (biogas)", optional: true },
      { key: "distress-signal", label: "Financial Distress / Prepay Need Signal", metric: "Credit score or covenant headroom signals" },
    ],
  },
  {
    id: "structured-ppa",
    pillar: "asset-backed",
    title: "Structured PPA / Gas Offtake",
    criteria: GEN,
    spec: [
      { key: "financing-gap", label: "Financing Gap", metric: "Project finance or capex funding shortfall" },
      { key: "credit-gap-dma", label: "Credit Rating Gap for Direct Market Access", metric: "Rating vs minimum exchange or counterparty threshold" },
      { key: "dev-stage-risk", label: "Development Stage Risk", metric: "Pre-COD or construction vs operational track record" },
      { key: "existing-offtake", label: "Existing Offtake Coverage", metric: "Percent of output already contracted", inverse: true },
      { key: "volume-size-fit", label: "Volume Size Fit", metric: "Annual volume vs SEE risk appetite band" },
    ],
  },
  {
    id: "battery-tolls",
    pillar: "asset-backed",
    title: "Battery Tolls (BESS)",
    testCase: true,
    criteria: GEN,
    spec: [
      { key: "battery-spec-fit", label: "Battery Spec Fit", metric: "MW / MWh (power and duration)" },
      { key: "merchant-exposure", label: "Merchant Exposure", metric: "Percent of uncontracted revenue stack" },
      { key: "grid-connection", label: "Recent or Imminent Grid Connection", metric: "Months since or until energisation" },
      { key: "colocation", label: "Co-location Synergy", metric: "Co-located with RE or other flexible assets" },
      { key: "credit-capacity-toll", label: "Credit / Financial Capacity for Toll", metric: "Net assets or credit proxy" },
    ],
  },
];

export const counterparties: Counterparty[] = [
  {
    id: FEATURED_COUNTERPARTY_ID,
    company: "Yü Energy (Yu Energy Retail Ltd)",
    country: "United Kingdom",
    legalEntityName: "Yu Energy Retail Ltd",
    lei: "213800ACO9GDDBM7DS35",
    revenueEbitda: "£645.5m / £48.8m adj. EBITDA (Yü Group, FY2024)",
    headcount: "~800",
    businessLine: "Non-domestic gas & power supply",
    businessLineType: "Energy Supplier",
    markets: "GB (N2EX / APX power, NBP gas)",
    portfolioSize: "~2,210 GWh delivered",
    gasMarket: "Active",
    powerMarket: "Active",
    annualVolume: 2210,
    aiInsight:
      "Fast-growing GB B2B supplier with no direct exchange membership, a clear route-to-market gap.",
    margin: 1400000,
    sub: {
      strategicFit: 82,
      profitability: 78,
      portfolioSynergy: 80,
      complexity: 60,
      dataAvailability: 88,
    },
    sector: "Business energy supply",
    priceHub: "NBP / GB power",
    seasonalSwing: 70,
    creditworthiness: 74,
    contact: "No prior contact",
    standing: "New prospect",
    lastContact: "No prior contact",
    evidence: [
      "Ofgem: licensed GB electricity and gas supplier (domestic and non-domestic), company 08246810 (retrieved 5 Aug 2026).",
      "GLEIF: resolves to listed parent Yü Group plc, LEI 213800ACO9GDDBM7DS35, status active.",
      "Companies House (audited FY2024): revenue £645.5m (+40%), adjusted EBITDA £48.8m, net cash £80.2m, 2.21 TWh delivered.",
      "No EEX or ICE membership found: supplies via wholesale intermediaries (route-to-market gap).",
    ],
    suggestion: "Proceed",
    suggestionBasis:
      "Licensed GB supplier with scale and a clear market-access gap; strong origination fit.",
    indicativeSizing: "~3,000 GWh firm plus flex",
    demandProfileFit: "Good: B2B load with structured supply potential.",
    keyRisk:
      "Group-level LEI; the retail entity is a subsidiary, so confirm the contracting entity.",
    realData: true,
    regulatory: {
      companyNumber: "08246810",
      electricity: "Electricity supply (domestic and non-domestic)",
      gas: "Gas supply (domestic and non-domestic)",
      retrieved: "5 Aug 2026",
      electricityUrl:
        "https://www.ofgem.gov.uk/data/list-all-electricity-licensees-including-suppliers",
      gasUrl:
        "https://www.ofgem.gov.uk/data/list-all-gas-licensees-including-suppliers",
    },
    gleif: {
      lei: "213800ACO9GDDBM7DS35",
      legalName: "YÜ GROUP PLC",
      companyNumber: "10004236",
      status: "ACTIVE",
      registrationStatus: "ISSUED",
      corroboration: "FULLY_CORROBORATED",
      hq: "Nottingham, GB",
      lastUpdate: "2026-05-18",
      note: "Yu Energy Retail Ltd resolves to its listed group Yü Group plc, which holds the LEI.",
    },
    financials: {
      fiscalYear: "FY2024 (year ended 31 Dec 2024)",
      revenue: "£645.5m",
      revenueGrowth: "+40% YoY",
      adjEbitda: "£48.8m",
      profitBeforeTax: "£44.5m",
      netCash: "£80.2m",
      deliveredVolume: "2.21 TWh",
      companyNumber: "10004236",
      basis: "Yü Group plc, consolidated, audited",
      source: "Companies House filed accounts (audited annual report FY2024)",
      retrieved: "5 Aug 2026",
      url: "https://www.yugroupplc.com/wp-content/uploads/2025/03/Yu-Group-plc-Annual-report-and-accounts-2024.pdf",
    },
  },
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

// ---------------------------------------------------------------------------
// Shortlists and micro-CRM (operational data, auto-persisted under ops key).
// ---------------------------------------------------------------------------

export interface Shortlist {
  id: string;
  name: string;
  counterpartyIds: string[];
  createdAt: string;
}

export type AccountStatus = "active" | "deal-closed";

export interface Account {
  id: string;
  counterpartyId: string;
  company: string;
  status: AccountStatus;
  createdAt: string;
  website?: string;
  enrichedAt?: string;
  notes?: string;
  dealClosedAt?: string;
  dealRef?: string;
}

export type ContactSource = "auto" | "manual" | "enriched";

export interface Contact {
  id: string;
  accountId: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  source: ContactSource;
}

export type CommChannel = "email" | "linkedin" | "note";

export interface CommLog {
  id: string;
  accountId: string;
  channel: CommChannel;
  subject?: string;
  body: string;
  timestamp: string;
}

// Free-text account notes, independent of the communication log.
export interface Note {
  id: string;
  accountId: string;
  body: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Communication templates (content-admin authored; config data).
// A template with no scenarioId is universal; one with a scenarioId overrides
// the universal for that scenario + channel.
// ---------------------------------------------------------------------------

export interface CommTemplate {
  id: string;
  channel: CommChannel;
  name: string;
  subject?: string; // email only
  body: string; // supports {{variables}}
  scenarioId?: string; // undefined = universal
}

// Tokens an admin can use; shown as help on the templates screen.
export const TEMPLATE_VARIABLES: { token: string; label: string }[] = [
  { token: "{{contact.firstName}}", label: "Contact first name" },
  { token: "{{contact.name}}", label: "Contact full name" },
  { token: "{{contact.role}}", label: "Contact role" },
  { token: "{{account.company}}", label: "Company name" },
  { token: "{{scope.commodity}}", label: "Commodity" },
  { token: "{{scope.region}}", label: "Region" },
  { token: "{{scope.hub}}", label: "Hub" },
];

// Replace {{token}} occurrences; unknown tokens render as [token] so gaps show.
export function renderTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k: string) =>
    vars[k] !== undefined && vars[k] !== "" ? vars[k] : `[${k}]`,
  );
}

export function commTemplateVars(opts: {
  company: string;
  contactName?: string;
  contactRole?: string;
  scope: { commodity: string; region: string; hub: string };
}): Record<string, string> {
  const name = opts.contactName ?? "there";
  return {
    "contact.name": name,
    "contact.firstName": name.split(" ")[0] || "there",
    "contact.role": opts.contactRole ?? "",
    "account.company": opts.company,
    "scope.commodity": opts.scope.commodity,
    "scope.region": opts.scope.region,
    "scope.hub": opts.scope.hub,
  };
}

export const commTemplates: CommTemplate[] = [
  {
    id: "tpl-email-intro",
    channel: "email",
    name: "Cold intro",
    subject:
      "SEE Origination — {{scope.commodity}} opportunity for {{account.company}}",
    body: `Hi {{contact.firstName}},

I lead origination at SEE. We work with {{scope.region}} counterparties on {{scope.commodity}} structures around {{scope.hub}}, and {{account.company}} looks like a strong fit for what we are building.

Would you be open to a short call to explore whether there is a basis to work together?

Best regards,
SEE Origination`,
  },
  {
    id: "tpl-li-intro",
    channel: "linkedin",
    name: "Cold intro",
    body: `Hi {{contact.firstName}}, I lead origination at SEE. We are active with counterparties like {{account.company}} on structured energy deals and I would value a quick conversation. Open to connecting?`,
  },
];

// ---------------------------------------------------------------------------
// Rules engine (configurable scoring). See knowledge-pack/REQUIREMENTS_rules-engine.md.
// Library (Admin) defines criteria + sub-criteria + deterministic logic + sub weight.
// Scenario (originator) selects/overrides + sets criterion weight. Values mocked.
// ---------------------------------------------------------------------------

export type RuleType =
  | "graded-min"
  | "graded-max"
  | "gate-min"
  | "gate-max"
  | "between"
  | "boolean";

export const RULE_TYPES: { value: RuleType; label: string }[] = [
  { value: "graded-min", label: "graded · more is better" },
  { value: "graded-max", label: "graded · less is better" },
  { value: "gate-min", label: "pass / fail · at least" },
  { value: "gate-max", label: "pass / fail · at most" },
  { value: "between", label: "in a range" },
  { value: "boolean", label: "present or not" },
];

export type Direction = "higher" | "lower";
export type MissingBehaviour = "zero" | "skip" | "block";

export interface RuleThresholds {
  floor?: number;
  ceiling?: number;
  t?: number;
  x?: number;
  y?: number;
}

export interface SubCriterion {
  id: string;
  label: string;
  dataField: string; // DataField.key
  ruleType: RuleType;
  thresholds: RuleThresholds;
  weight: number; // 1-5 Importance (library default)
  direction: Direction;
  missing: MissingBehaviour;
  enabled: boolean;
  blocking: boolean;
}

export interface LibraryCriterion {
  id: string;
  label: string;
  description?: string;
  blocking: boolean;
  subCriteria: SubCriterion[];
}

export interface DataField {
  key: string;
  label: string;
  unit?: string;
  source: string;
}

// The catalogue of fields a sub-criterion can reference (mocked sources).
export const DATA_FIELDS: DataField[] = [
  { key: "netDebt", label: "Net debt", unit: "EUR (M)", source: "Filings register (mocked)" },
  { key: "netAssets", label: "Net assets", unit: "EUR (M)", source: "Filings register (mocked)" },
  { key: "revenue", label: "Revenue", unit: "EUR (M)", source: "Filings register (mocked)" },
  { key: "creditRating", label: "Credit rating proxy", unit: "0-100", source: "D&B proxy (mocked)" },
  { key: "headcount", label: "Headcount", unit: "people", source: "Company profile (mocked)" },
  { key: "memberships", label: "Exchange / clearing memberships", unit: "count", source: "ICE / EEX lists (mocked)" },
  { key: "annualVolume", label: "Annual volume", unit: "GWh/yr", source: "Market scan (mocked)" },
];

export function dataField(key: string): DataField | undefined {
  return DATA_FIELDS.find((f) => f.key === key);
}

// Mocked raw field values per counterparty (id -> field key -> value).
export const COUNTERPARTY_FIELDS: Record<string, Record<string, number>> = {
  "yu-energy-gb": { netDebt: 650, netAssets: 520, revenue: 645, creditRating: 74, headcount: 800, memberships: 0, annualVolume: 2210 },
  "vitalgas-nl": { netDebt: 220, netAssets: 900, revenue: 2400, creditRating: 90, headcount: 1200, memberships: 3, annualVolume: 3400 },
  "delta-energie-be": { netDebt: 140, netAssets: 520, revenue: 1100, creditRating: 82, headcount: 640, memberships: 2, annualVolume: 2100 },
  "haven-utilities-nl": { netDebt: 90, netAssets: 300, revenue: 780, creditRating: 76, headcount: 410, memberships: 1, annualVolume: 1250 },
  "meridian-power-be": { netDebt: 260, netAssets: 640, revenue: 1600, creditRating: 80, headcount: 890, memberships: 2, annualVolume: 900 },
  "noordzee-supply-nl": { netDebt: 40, netAssets: 120, revenue: 430, creditRating: 64, headcount: 220, memberships: 0, annualVolume: 620 },
  "kanaal-trading-be": { netDebt: 120, netAssets: 380, revenue: 900, creditRating: 78, headcount: 500, memberships: 2, annualVolume: 1600 },
};

export function counterpartyFieldValue(cpId: string, key: string): number | undefined {
  const row = COUNTERPARTY_FIELDS[cpId];
  if (row && key in row) return row[key];
  return undefined;
}

// ---------------------------------------------------------------------------
// Data sources, provenance and data-quality (mocked). See DATA_SOURCES.md.
// Tier 1 = official registers, 2 = market infrastructure, 3 = commercial, 4 = web/LLM.
// ---------------------------------------------------------------------------

export interface Source {
  key: string;
  name: string;
  tier: 1 | 2 | 3 | 4;
  retrieved: string; // mock freshness label
}

export const SOURCES: Source[] = [
  { key: "acer-ceremp", name: "ACER CEREMP register", tier: 1, retrieved: "today" },
  { key: "ofgem", name: "Ofgem licensee list", tier: 1, retrieved: "16 Jul 2026" },
  { key: "gleif", name: "GLEIF (LEI)", tier: 1, retrieved: "live" },
  { key: "companies-house", name: "Companies House", tier: 1, retrieved: "2 days ago" },
  { key: "eex", name: "EEX participants", tier: 2, retrieved: "this week" },
  { key: "entsog", name: "ENTSOG / GIE", tier: 2, retrieved: "today" },
  { key: "dnb", name: "Dun & Bradstreet", tier: 3, retrieved: "2 weeks ago" },
  { key: "web", name: "Company website (LLM)", tier: 4, retrieved: "unverified" },
];

// Which source backs each data field (prototype mapping).
export const FIELD_SOURCE: Record<string, string> = {
  netDebt: "companies-house",
  netAssets: "companies-house",
  revenue: "dnb",
  creditRating: "dnb",
  headcount: "web",
  memberships: "eex",
  annualVolume: "entsog",
};

// Per-tier trust weight applied to a source when scoring data quality (0-1).
export const DEFAULT_TIER_WEIGHTS: Record<number, number> = {
  1: 1,
  2: 0.82,
  3: 0.58,
  4: 0.32,
};

// The configurable source registry: which sources exist, how much each tier is
// trusted, and which source backs each data field. Seeded from the constants
// above; persisted in the config blob and edited on the Sources admin screen.
export interface SourceRegistry {
  sources: Source[];
  tierWeights: Record<number, number>;
  fieldSource: Record<string, string>; // data-field key -> source key
}

export const defaultSourceRegistry: SourceRegistry = {
  sources: SOURCES,
  tierWeights: DEFAULT_TIER_WEIGHTS,
  fieldSource: FIELD_SOURCE,
};

export function sourceForField(
  fieldKey: string,
  reg: SourceRegistry = defaultSourceRegistry,
): Source | undefined {
  const key = reg.fieldSource[fieldKey];
  return reg.sources.find((s) => s.key === key);
}

export function tierWeight(
  tier: number,
  weights: Record<number, number> = DEFAULT_TIER_WEIGHTS,
): number {
  return weights[tier] ?? DEFAULT_TIER_WEIGHTS[tier] ?? 0.32;
}

// Data-quality (confidence) score 0-100: how well-evidenced a counterparty is.
// Separate from fit (how attractive). Driven by source tier of its fields + LEI match.
export function dataQuality(
  cp: Counterparty,
  reg: SourceRegistry = defaultSourceRegistry,
): { score: number; hasLei: boolean } {
  const hasLei = !!cp.lei && cp.lei !== "n/a";
  const fields = COUNTERPARTY_FIELDS[cp.id];
  const present = fields ? Object.keys(fields) : [];
  if (present.length === 0) return { score: hasLei ? 40 : 20, hasLei };
  const tw =
    present.reduce(
      (s, f) => s + tierWeight(sourceForField(f, reg)?.tier ?? 4, reg.tierWeights),
      0,
    ) / present.length;
  const idBonus = hasLei ? 1 : 0.7;
  return { score: Math.min(100, Math.round(tw * 100 * idBonus)), hasLei };
}

export function dqTone(score: number): "success" | "warning" | "muted" {
  return score >= 75 ? "success" : score >= 50 ? "warning" : "muted";
}

// Deterministic sub-score: maps a raw value to 0-100 per the rule type + thresholds.
export function subScore(rule: RuleType, value: number, th: RuleThresholds): number {
  const n = value;
  switch (rule) {
    case "gate-min":
      return n >= (th.t ?? 0) ? 100 : 0;
    case "gate-max":
      return n <= (th.t ?? 0) ? 100 : 0;
    case "graded-min": {
      const f = th.floor ?? 0;
      const c = th.ceiling ?? 100;
      if (c <= f) return n >= c ? 100 : 0;
      return n <= f ? 0 : n >= c ? 100 : Math.round(((n - f) / (c - f)) * 100);
    }
    case "graded-max": {
      const f = th.floor ?? 0;
      const c = th.ceiling ?? 100;
      if (c <= f) return n <= f ? 100 : 0;
      return n >= c ? 0 : n <= f ? 100 : Math.round(((c - n) / (c - f)) * 100);
    }
    case "between": {
      const lo = Math.min(th.x ?? 0, th.y ?? 0);
      const hi = Math.max(th.x ?? 0, th.y ?? 0);
      return n >= lo && n <= hi ? 100 : 0;
    }
    case "boolean":
      return n > 0 ? 100 : 0;
  }
}

// Seed library: 3 criteria (matches the placeholder scenario set).
export const criteriaLibrary: LibraryCriterion[] = [
  {
    id: "balance-sheet-fit",
    label: "Balance sheet fit",
    description: "Whether the balance sheet supports the deal.",
    blocking: true,
    subCriteria: [
      { id: "net-debt", label: "Net debt", dataField: "netDebt", ruleType: "graded-min", thresholds: { floor: 100, ceiling: 1000 }, weight: 3, direction: "higher", missing: "zero", enabled: true, blocking: true },
      { id: "net-assets", label: "Net assets", dataField: "netAssets", ruleType: "graded-min", thresholds: { floor: 100, ceiling: 800 }, weight: 2, direction: "higher", missing: "zero", enabled: true, blocking: false },
    ],
  },
  {
    id: "market-access-gap",
    label: "Market access gap",
    description: "A lack of direct market access is SEE's opportunity.",
    blocking: false,
    subCriteria: [
      { id: "exchange-gap", label: "Exchange access gap", dataField: "memberships", ruleType: "graded-max", thresholds: { floor: 0, ceiling: 4 }, weight: 4, direction: "lower", missing: "zero", enabled: true, blocking: false },
    ],
  },
  {
    id: "consumption-volume",
    label: "Consumption volume",
    description: "Annual gas or power consumption.",
    blocking: false,
    subCriteria: [
      { id: "annual-consumption", label: "Annual volume", dataField: "annualVolume", ruleType: "graded-min", thresholds: { floor: 500, ceiling: 5000 }, weight: 3, direction: "higher", missing: "zero", enabled: true, blocking: false },
    ],
  },
];

// Effective (library + scenario overrides) shapes used for scoring + the breakdown.
export interface EffectiveSub {
  id: string;
  label: string;
  dataField: string;
  ruleType: RuleType;
  thresholds: RuleThresholds;
  weight: number;
  direction: Direction;
  missing: MissingBehaviour;
  enabled: boolean;
  blocking: boolean;
}
export interface EffectiveCriterion {
  id: string;
  label: string;
  description?: string;
  blocking: boolean;
  weight: number;
  enabled: boolean;
  subCriteria: EffectiveSub[];
}
export interface SubBreakdown {
  id: string;
  label: string;
  field: string;
  unit?: string;
  source?: string;
  rawValue?: number;
  ruleType: RuleType;
  thresholds: RuleThresholds;
  subScore: number;
  weight: number;
  blocking: boolean;
  blocked: boolean;
  skipped: boolean;
  sourceTier?: number;
  retrieved?: string;
}
export interface CritBreakdown {
  id: string;
  label: string;
  weight: number;
  score: number;
  blocked: boolean;
  subs: SubBreakdown[];
}
export interface ScoreBreakdown {
  fit: number;
  blocked: boolean;
  criteria: CritBreakdown[];
}

// Deterministic, pure. fit = weighted avg of criterion scores (by criterion weight);
// criterion score = weighted avg of sub-scores (by sub weight); enabled only; blocking zeros flag Blocked.
export function scoreBreakdown(
  criteria: EffectiveCriterion[],
  getValue: (field: string) => number | undefined,
  reg: SourceRegistry = defaultSourceRegistry,
): ScoreBreakdown {
  let dealBlocked = false;
  let fitNum = 0;
  let fitDen = 0;
  const critOut: CritBreakdown[] = [];
  for (const c of criteria) {
    if (!c.enabled) continue;
    let cNum = 0;
    let cDen = 0;
    let cBlocked = false;
    const subs: SubBreakdown[] = [];
    for (const s of c.subCriteria) {
      if (!s.enabled) continue;
      const raw = getValue(s.dataField);
      const fld = dataField(s.dataField);
      const src = sourceForField(s.dataField, reg);
      let skipped = false;
      let ss = 0;
      let subBlocked = false;
      if (raw === undefined) {
        if (s.missing === "skip") skipped = true;
        else if (s.missing === "block") subBlocked = true;
      } else {
        ss = subScore(s.ruleType, raw, s.thresholds);
      }
      if (s.blocking && ss === 0 && !skipped) subBlocked = true;
      if (subBlocked) cBlocked = true;
      subs.push({
        id: s.id,
        label: s.label,
        field: s.dataField,
        unit: fld?.unit,
        source: fld?.source,
        rawValue: raw,
        ruleType: s.ruleType,
        thresholds: s.thresholds,
        subScore: ss,
        weight: s.weight,
        blocking: s.blocking,
        blocked: subBlocked,
        skipped,
        source: src?.name ?? fld?.source,
        sourceTier: src?.tier,
        retrieved: src?.retrieved,
      });
      if (!skipped) {
        cNum += ss * s.weight;
        cDen += s.weight;
      }
    }
    let cScore = cDen ? Math.round(cNum / cDen) : 0;
    if (cBlocked) cScore = 0;
    const critBlocked = cBlocked || (c.blocking && cScore === 0);
    if (critBlocked) dealBlocked = true;
    critOut.push({ id: c.id, label: c.label, weight: c.weight, score: cScore, blocked: critBlocked, subs });
    fitNum += cScore * c.weight;
    fitDen += c.weight;
  }
  return {
    fit: fitDen ? Math.round(fitNum / fitDen) : 0,
    blocked: dealBlocked,
    criteria: critOut,
  };
}

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
