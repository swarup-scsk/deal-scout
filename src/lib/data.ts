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
// Carries genuine data retrieved from the licence register + GLEIF. Generic across
// jurisdictions: GB uses Ofgem (electricity/gas + list URLs); DE/AT/CH use the local
// regulator via `regulator` + `summary` + `links`.
export interface OfgemLicence {
  companyNumber: string;
  regulator?: string; // e.g. "BNetzA / CEREMP (DE)"; defaults to Ofgem when absent
  summary?: string; // one-line licence summary (used for non-GB regulators)
  electricity?: string;
  gas?: string;
  retrieved: string;
  electricityUrl?: string;
  gasUrl?: string;
  links?: { label: string; url: string }[];
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
  jurisdiction?: string; // region code (GB, DE, AT, CH...); else derived from country
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
    jurisdiction: "GB",
    legalEntityName: "Yu Energy Retail Ltd",
    lei: "213800ACO9GDDBM7DS35",
    revenueEbitda: "£645.5m / £48.8m",
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
    id: "trianel-de",
    company: "Trianel GmbH",
    country: "Germany",
    jurisdiction: "DE",
    legalEntityName: "Trianel GmbH",
    lei: "529900A42A65AFJG6O09",
    revenueEbitda: "€8.5bn / €92.5m EBT (FY2024)",
    headcount: "~500",
    businessLine: "Municipal-utility trading house",
    businessLineType: "Trader",
    markets: "DE, NW Europe (EEX / EPEX, THE)",
    portfolioSize: "~50 TWh traded",
    gasMarket: "Active",
    powerMarket: "Active",
    annualVolume: 50000,
    aiInsight:
      "Trading house for around 58 municipal utilities; already an EEX/EPEX member, so a smaller market-access gap.",
    margin: 1500000,
    sub: { strategicFit: 78, profitability: 74, portfolioSynergy: 82, complexity: 62, dataAvailability: 86 },
    sector: "Energy trading and services",
    priceHub: "THE / EEX",
    seasonalSwing: 60,
    creditworthiness: 72,
    contact: "No prior contact",
    standing: "New prospect",
    lastContact: "No prior contact",
    evidence: [
      "GLEIF: Trianel GmbH, LEI 529900A42A65AFJG6O09, Aachen HRB 7729, status active.",
      "Bundesanzeiger (FY2024): revenue €8.5bn, profit before tax €92.5m.",
      "EEX/EPEX participant via Trianel European Energy Trading GmbH: already has direct market access.",
    ],
    suggestion: "Hold",
    suggestionBasis:
      "Strong trading house, but it already holds direct exchange access, so the market-access opportunity is limited.",
    indicativeSizing: "Structured flow / co-operation, not DMA",
    demandProfileFit: "Aggregated municipal demand; flexible.",
    keyRisk: "Cooperative ownership; existing in-house trading reduces the gap.",
    realData: true,
    regulatory: {
      companyNumber: "HRB 7729 (Amtsgericht Aachen)",
      regulator: "BNetzA / CEREMP (DE)",
      summary: "Registered German wholesale market participant (REMIT via CEREMP); active power and gas trading.",
      retrieved: "10 Aug 2026",
      links: [{ label: "ACER CEREMP", url: "https://www.acer-remit.eu/" }],
    },
    gleif: {
      lei: "529900A42A65AFJG6O09",
      legalName: "Trianel GmbH",
      companyNumber: "HRB 7729",
      status: "ACTIVE",
      registrationStatus: "ISSUED",
      corroboration: "FULLY_CORROBORATED",
      hq: "Aachen, DE",
      lastUpdate: "2025-10-08",
      note: "Trades on EEX/EPEX via subsidiary Trianel European Energy Trading GmbH.",
    },
    financials: {
      fiscalYear: "FY2024",
      revenue: "€8.5bn",
      revenueGrowth: "-10% YoY",
      profitBeforeTax: "€92.5m",
      companyNumber: "HRB 7729",
      basis: "Trianel GmbH, filed accounts",
      source: "Bundesanzeiger (DE filings)",
      retrieved: "10 Aug 2026",
      url: "https://www.northdata.com/Trianel+GmbH,+Aachen/HRB+7729",
    },
  },
  {
    id: "verbund-e4b-at",
    company: "VERBUND Energy4Business GmbH",
    country: "Austria",
    jurisdiction: "AT",
    legalEntityName: "VERBUND Energy4Business GmbH",
    lei: "529900RTYBY8TPW9U991",
    revenueEbitda: "€8,224.6m / €1,875.3m group result (VERBUND, FY2024)",
    headcount: "~4,100 (group)",
    businessLine: "Energy trading and B2B supply",
    businessLineType: "Trader",
    markets: "AT, DE, Central Europe (EXAA, EEX / EPEX)",
    portfolioSize: "~60 TWh",
    gasMarket: "Active",
    powerMarket: "Active",
    annualVolume: 60000,
    aiInsight:
      "Central market-access and trading arm of VERBUND; strong balance sheet and existing exchange access.",
    margin: 2000000,
    sub: { strategicFit: 82, profitability: 84, portfolioSynergy: 80, complexity: 58, dataAvailability: 88 },
    sector: "Energy trading and supply",
    priceHub: "EXAA / EEX",
    seasonalSwing: 55,
    creditworthiness: 85,
    contact: "No prior contact",
    standing: "New prospect",
    lastContact: "No prior contact",
    evidence: [
      "GLEIF: VERBUND Energy4Business GmbH, LEI 529900RTYBY8TPW9U991, Vienna FN 524455 h, status active.",
      "Financials (VERBUND AG group, FY2024): revenue €8,224.6m, group result €1,875.3m.",
      "EPEX SPOT / EEX participant: central market access for the VERBUND group.",
    ],
    suggestion: "Hold",
    suggestionBasis:
      "Large, well-capitalised group trading arm with its own market access; limited direct-market-access gap.",
    indicativeSizing: "Structured products / cooperation",
    demandProfileFit: "Hydro-heavy portfolio; strong optionality.",
    keyRisk: "Group-level financials; the opco is a subsidiary of the listed parent.",
    realData: true,
    regulatory: {
      companyNumber: "FN 524455 h (Handelsgericht Wien)",
      regulator: "E-Control (AT)",
      summary: "Austrian licensed energy trader; VERBUND group market-access arm.",
      retrieved: "10 Aug 2026",
      links: [{ label: "E-Control", url: "https://www.e-control.at/" }],
    },
    gleif: {
      lei: "529900RTYBY8TPW9U991",
      legalName: "VERBUND Energy4Business GmbH",
      companyNumber: "FN 524455 h",
      status: "ACTIVE",
      registrationStatus: "ISSUED",
      corroboration: "FULLY_CORROBORATED",
      hq: "Vienna, AT",
      lastUpdate: "2026",
      note: "Trading and market-access arm of VERBUND AG (Vienna-listed).",
    },
    financials: {
      fiscalYear: "FY2024 (VERBUND AG group)",
      revenue: "€8,224.6m",
      revenueGrowth: "-21% YoY",
      profitBeforeTax: "€1,875.3m (group result)",
      companyNumber: "FN 524455 h",
      basis: "VERBUND AG, consolidated (parent group)",
      source: "VERBUND annual report / Firmenbuch",
      retrieved: "10 Aug 2026",
      url: "https://www.verbund.com/media/qcwgsj5i/verbund-annual-financial-report-2024-englisch-final.pdf",
    },
  },
  {
    id: "bkw-ch",
    company: "BKW Energie AG",
    country: "Switzerland",
    jurisdiction: "CH",
    legalEntityName: "BKW Energie AG",
    lei: "HP4455X23HMJWUDSIO96",
    revenueEbitda: "CHF 4.8bn / CHF 0.8bn EBIT (FY2024)",
    headcount: "~12,000 (group)",
    businessLine: "Integrated utility (generation, grid, services)",
    businessLineType: "Asset Owner",
    markets: "CH, DE, IT (EEX, day-ahead)",
    portfolioSize: "~40 TWh",
    gasMarket: "Limited",
    powerMarket: "Active",
    annualVolume: 40000,
    aiInsight:
      "SIX-listed Swiss utility; generation plus trading, strong balance sheet, and outside the EU (no CEREMP).",
    margin: 1800000,
    sub: { strategicFit: 74, profitability: 78, portfolioSynergy: 70, complexity: 60, dataAvailability: 84 },
    sector: "Integrated utility",
    priceHub: "Swissix / EEX",
    seasonalSwing: 65,
    creditworthiness: 80,
    contact: "No prior contact",
    standing: "New prospect",
    lastContact: "No prior contact",
    evidence: [
      "GLEIF: BKW Energie AG, LEI HP4455X23HMJWUDSIO96, Bern CHE-103.258.498, status active.",
      "Financials (FY2024, SIX-listed): revenue CHF 4.8bn, EBIT CHF 0.8bn, equity ratio 51.5%.",
      "EEX participant; Swiss (non-EU), so REMIT/CEREMP does not apply.",
    ],
    suggestion: "Hold",
    suggestionBasis:
      "Large listed utility with its own trading and generation; limited market-access gap and outside the EU register set.",
    indicativeSizing: "Asset-backed / structured",
    demandProfileFit: "Hydro and flexible generation; good optionality.",
    keyRisk: "Swiss jurisdiction (no CEREMP); already trades directly.",
    realData: true,
    regulatory: {
      companyNumber: "CHE-103.258.498",
      regulator: "ElCom (CH)",
      summary: "Swiss electricity supply and grid participant; SIX-listed group.",
      retrieved: "10 Aug 2026",
      links: [{ label: "ElCom", url: "https://www.elcom.admin.ch/" }],
    },
    gleif: {
      lei: "HP4455X23HMJWUDSIO96",
      legalName: "BKW Energie AG",
      companyNumber: "CHE-103.258.498",
      status: "ACTIVE",
      registrationStatus: "ISSUED",
      corroboration: "FULLY_CORROBORATED",
      hq: "Bern, CH",
      lastUpdate: "2026-03-26",
      note: "SIX-listed Swiss utility group; EEX participant (BKW FMB Energie AG).",
    },
    financials: {
      fiscalYear: "FY2024",
      revenue: "CHF 4.8bn",
      adjEbitda: "CHF 0.8bn EBIT",
      companyNumber: "CHE-103.258.498",
      basis: "BKW Energie AG, consolidated (SIX-listed)",
      source: "BKW annual report 2024",
      retrieved: "10 Aug 2026",
      url: "https://www.bkw.ch/en/about-us/investor-relations/geschaeftsbericht-2024",
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
  weight?: number; // criterion-level default importance (1-5); scenario overrides can replace it
  scenarios?: string[]; // scenario ids this criterion applies to; undefined/empty = all
  subCriteria: SubCriterion[];
}

export type DataFieldType = "number" | "boolean";

export interface DataField {
  key: string;
  label: string;
  unit?: string;
  source: string;
  type?: DataFieldType; // defaults to number; boolean for present-or-not rules
  description?: string;
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
  "trianel-de": { netDebt: 200, netAssets: 875, revenue: 8500, creditRating: 72, headcount: 500, memberships: 2, annualVolume: 50000 },
  "verbund-e4b-at": { netDebt: 2500, netAssets: 11000, revenue: 8225, creditRating: 85, headcount: 4100, memberships: 2, annualVolume: 60000 },
  "bkw-ch": { netDebt: 1250, netAssets: 5800, revenue: 4800, creditRating: 80, headcount: 12000, memberships: 2, annualVolume: 40000 },
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
// News & market signals (intelligence feed). Prototype seed = real, dated
// headline snapshots. Display / context only: a signal never changes a score
// (the LLM augments, it does not score). `notify` surfaces it in the bell.
// ---------------------------------------------------------------------------
export type SignalImpact = "up" | "down" | "neutral";
export type SignalCategory = "news" | "market" | "regulatory" | "financial";

export interface NewsSignal {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url?: string;
  date: string; // display date (dated snapshot in the prototype)
  category: SignalCategory;
  market?: string; // e.g. "TTF gas", "DACH power"
  counterpartyId?: string; // linked counterparty, if any
  impact: SignalImpact;
  notify?: boolean; // surfaces in the notification centre
  why?: string; // why it matters to origination
  scenarios?: string[]; // scenario ids this signal is relevant to
}

export const NEWS_SIGNALS: NewsSignal[] = [
  {
    id: "sig-ttf-winter",
    scenarios: ["demand-market-access", "gas-storage", "transport-capacity"],
    headline: "TTF gas surges over 10% on winter supply risk",
    summary:
      "European TTF jumped more than 10% as the Ormen Lange outage was extended to February 2027 and EU storage sat about 22% below the five-year average; forecasts hold EUR 55-62/MWh through year-end.",
    source: "European Gas Hub",
    url: "https://europeangashub.com/ttf-gas-prices-surge-as-supply-risks-build-ahead-of-winter.html",
    date: "2026-08-10",
    category: "market",
    market: "TTF gas",
    impact: "up",
    notify: true,
    why: "Higher, more volatile gas lifts demand-side hedging and structured-supply appetite across gas-exposed counterparties.",
  },
  {
    id: "sig-de-power",
    scenarios: ["trading-market-access", "demand-market-access"],
    headline: "German baseload eases as renewables hit 55% of generation",
    summary:
      "Germany's one-year forward baseload traded around EUR 92.75/MWh in mid-2026, with renewables at a record 55% of generation and more reliance on flexible gas and storage.",
    source: "EnergyPrices.net",
    url: "https://energyprices.net/post/germany-electricity-market-2026-prices-fall-6-7-industrial-subsidies-launch-and-renewables-hit-55",
    date: "2026-05-18",
    category: "market",
    market: "DACH power",
    impact: "down",
    notify: false,
    why: "Lower, more volatile power reshapes flexibility and route-to-market needs for DACH utilities and traders.",
  },
  {
    id: "sig-verbund-pumped",
    scenarios: ["demand-market-access", "trading-market-access"],
    headline: "VERBUND to build 300-MW Danube pumped-storage plant",
    summary:
      "VERBUND will proceed with a 300-MW / 3.5-GWh pumped-hydro plant on the Danube, with construction starting in winter 2026/27 after clearing legal challenges.",
    source: "Renewables Now",
    url: "https://renewablesnow.com/news/verbund-to-proceed-with-300-mw-pumped-storage-project-in-austria-1297584/",
    date: "2026-08-05",
    category: "news",
    counterpartyId: "verbund-e4b-at",
    impact: "up",
    notify: true,
    why: "Storage build strengthens flexibility and balance-sheet commitment; supportive for demand and trading engagement.",
  },
  {
    id: "sig-bkw-wind",
    scenarios: ["structured-ppa", "trading-market-access"],
    headline: "BKW passes 1,000 MW wind and solar target ahead of plan",
    summary:
      "BKW exceeded its 2026 target of 1,000 MW of wind and solar early, via acquisitions in Sweden, Italy and France, taking installed renewables above 1,100 MW.",
    source: "BKW",
    url: "https://www.bkw.ch/en/about-us/news/media/press-releases/bkw-close-to-1000-megawatt-target",
    date: "2026-02-15",
    category: "news",
    counterpartyId: "bkw-ch",
    impact: "up",
    notify: true,
    why: "Rapid renewables growth increases trading and route-to-market volume; a positive demand and trading signal.",
  },
  {
    id: "sig-yu-h1",
    scenarios: ["demand-market-access", "working-capital"],
    headline: "Yu Group H1 2026: revenue up 19%, contract book GBP 1.7bn",
    summary:
      "Yu Group reported H1 2026 revenue up 19% to about GBP 405m, meter points up 43% to 153,000, and an extended Shell trading agreement; FY26 revenue guided GBP 850-875m.",
    source: "Investegate",
    url: "https://www.investegate.co.uk/announcement/rns/yu-group--yu./trading-update-and-notice-of-results-/9678453",
    date: "2026-07-15",
    category: "financial",
    counterpartyId: "yu-energy-gb",
    impact: "up",
    notify: true,
    why: "Strong growth and a broadening contract book raise supply and structured-flow opportunity.",
  },
  {
    id: "sig-trianel-solar",
    scenarios: ["structured-ppa", "trading-market-access"],
    headline: "Trianel named strategic partner for utility-scale solar in Rhineland-Palatinate",
    summary:
      "Trianel was selected to develop multiple utility-scale solar projects in Rhineland-Palatinate, extending its municipal-utility renewables pipeline.",
    source: "Renewables Now",
    url: "https://renewablesnow.com/news/trianel-to-co-develop-large-pv-projects-with-german-municipality-1296718/",
    date: "2026-06-20",
    category: "news",
    counterpartyId: "trianel-de",
    impact: "up",
    notify: true,
    why: "A growing generation pipeline increases trading and offtake needs across Trianel's municipal-utility network.",
  },
  {
    id: "sig-trianel-nuveen",
    scenarios: ["trading-market-access"],
    headline: "Trianel sells 70.4-MWp Brandenburg solar park to a Nuveen fund",
    summary:
      "Trianel Energieprojekte sold a 70.4-MWp solar park in Brandenburg to a Nuveen-managed fund, recycling capital into new development.",
    source: "Renewables Now",
    url: "https://renewablesnow.com/news/nuveen-fund-buys-70-4-mwp-german-solar-park-from-trianel-1291047/",
    date: "2026-03-10",
    category: "news",
    counterpartyId: "trianel-de",
    impact: "neutral",
    notify: false,
    why: "Capital recycling; neutral near-term but signals an active development strategy.",
  },
];

export function signalsForCounterparty(cpId: string): NewsSignal[] {
  return NEWS_SIGNALS.filter((s) => s.counterpartyId === cpId);
}

// ---------------------------------------------------------------------------
// Data pipeline / scheduled runs (Sys Admin control panel). Prototype seed.
// These jobs are the platform-ops layer: WHEN sources refresh, WHEN scores
// recompute, WHEN signals are polled. Distinct from the Sources screen, which
// is the business-config layer (WHAT feeds a field and how much it is trusted).
// ---------------------------------------------------------------------------
export type PipelineKind = "source-refresh" | "rescore" | "signal-ingest";
export type RunStatus = "success" | "running" | "failed" | "stale" | "paused";

export interface PipelineRun {
  at: string; // ISO-ish timestamp label
  status: RunStatus;
  durationSec: number;
  records: number;
  note?: string;
}

export interface PipelineJob {
  id: string;
  name: string;
  kind: PipelineKind;
  target: string; // what it feeds, in plain words
  cadence: string; // human label, e.g. "Daily 06:00 UTC"
  enabled: boolean;
  lastRun?: PipelineRun;
  nextRun?: string; // omitted when paused
  history: PipelineRun[];
}

export const PIPELINE_JOBS: PipelineJob[] = [
  {
    id: "job-gleif",
    name: "GLEIF LEI register",
    kind: "source-refresh",
    target: "Legal identity, registration status",
    cadence: "Daily 06:00 UTC",
    enabled: true,
    lastRun: { at: "2026-08-21 06:00", status: "success", durationSec: 42, records: 1284 },
    nextRun: "2026-08-22 06:00",
    history: [
      { at: "2026-08-21 06:00", status: "success", durationSec: 42, records: 1284 },
      { at: "2026-08-20 06:00", status: "success", durationSec: 39, records: 1284 },
      { at: "2026-08-19 06:00", status: "success", durationSec: 51, records: 1281 },
    ],
  },
  {
    id: "job-financials",
    name: "Financials feed",
    kind: "source-refresh",
    target: "Net assets, net debt, revenue, EBITDA",
    cadence: "Weekly Mon 05:00 UTC",
    enabled: true,
    lastRun: { at: "2026-08-17 05:00", status: "success", durationSec: 118, records: 642 },
    nextRun: "2026-08-24 05:00",
    history: [
      { at: "2026-08-17 05:00", status: "success", durationSec: 118, records: 642 },
      { at: "2026-08-10 05:00", status: "success", durationSec: 121, records: 640 },
    ],
  },
  {
    id: "job-market-access",
    name: "Market-access registries",
    kind: "source-refresh",
    target: "Trading membership, transport and storage capacity",
    cadence: "Daily 05:30 UTC",
    enabled: true,
    lastRun: {
      at: "2026-08-21 05:30",
      status: "failed",
      durationSec: 12,
      records: 0,
      note: "AT registry endpoint timed out (504). 2 of 3 sources refreshed.",
    },
    nextRun: "2026-08-22 05:30",
    history: [
      { at: "2026-08-21 05:30", status: "failed", durationSec: 12, records: 0, note: "AT registry 504" },
      { at: "2026-08-20 05:30", status: "success", durationSec: 63, records: 318 },
      { at: "2026-08-19 05:30", status: "success", durationSec: 60, records: 318 },
    ],
  },
  {
    id: "job-curve",
    name: "TTF and power curve",
    kind: "source-refresh",
    target: "Gas and power price references",
    cadence: "Hourly",
    enabled: true,
    lastRun: { at: "2026-08-21 14:00", status: "success", durationSec: 8, records: 96 },
    nextRun: "2026-08-21 15:00",
    history: [
      { at: "2026-08-21 14:00", status: "success", durationSec: 8, records: 96 },
      { at: "2026-08-21 13:00", status: "success", durationSec: 7, records: 96 },
    ],
  },
  {
    id: "job-rescore",
    name: "Full rescore",
    kind: "rescore",
    target: "All counterparty fit scores across scenarios",
    cadence: "After each source run, and on rule publish",
    enabled: true,
    lastRun: { at: "2026-08-21 06:03", status: "success", durationSec: 5, records: 1284 },
    nextRun: "On next source completion",
    history: [
      { at: "2026-08-21 06:03", status: "success", durationSec: 5, records: 1284 },
      { at: "2026-08-20 06:02", status: "success", durationSec: 5, records: 1284 },
    ],
  },
  {
    id: "job-signals",
    name: "Signal ingestion",
    kind: "signal-ingest",
    target: "News and market signals feed",
    cadence: "Every 4 hours",
    enabled: false,
    lastRun: {
      at: "2026-08-19 20:00",
      status: "stale",
      durationSec: 34,
      records: 27,
      note: "Paused by admin on 2026-08-20. Feed not refreshing.",
    },
    history: [
      { at: "2026-08-19 20:00", status: "success", durationSec: 34, records: 27 },
      { at: "2026-08-19 16:00", status: "success", durationSec: 31, records: 22 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Data sources, provenance and data-quality (mocked). See DATA_SOURCES.md.
// Tier 1 = official registers, 2 = market infrastructure, 3 = commercial, 4 = web/LLM.
// ---------------------------------------------------------------------------

// Regions / jurisdictions. The authoritative source for a field varies by the
// counterparty's jurisdiction, so sources declare coverage and the field-to-source
// map can vary per region. GLOBAL covers everywhere; EU is the CEREMP fallback.
export const REGIONS: { code: string; label: string }[] = [
  { code: "GB", label: "United Kingdom" },
  { code: "DE", label: "Germany" },
  { code: "AT", label: "Austria" },
  { code: "CH", label: "Switzerland" },
  { code: "NL", label: "Netherlands" },
  { code: "BE", label: "Belgium" },
];
// EU / EEA regions we handle (drives the EU CEREMP fallback in resolution).
export const EU_REGIONS = ["DE", "AT", "NL", "BE"];

const COUNTRY_TO_REGION: Record<string, string> = {
  "united kingdom": "GB",
  uk: "GB",
  "great britain": "GB",
  germany: "DE",
  austria: "AT",
  switzerland: "CH",
  netherlands: "NL",
  belgium: "BE",
};

// The counterparty's jurisdiction code (explicit field, else derived from country).
export function jurisdictionOf(cp: {
  jurisdiction?: string;
  country?: string;
}): string | undefined {
  if (cp.jurisdiction) return cp.jurisdiction;
  return COUNTRY_TO_REGION[(cp.country ?? "").trim().toLowerCase()];
}

export interface Source {
  key: string;
  name: string;
  tier: 1 | 2 | 3 | 4;
  retrieved: string; // mock freshness label
  info?: string; // what the source is and how it is accessed (guidance)
  coverage?: string[]; // region codes covered; ["GLOBAL"] or omitted = any region
}

export const SOURCES: Source[] = [
  { key: "gleif", name: "GLEIF (LEI)", tier: 1, retrieved: "live", coverage: ["GLOBAL"], info: "Global legal-entity identifier register. Free JSON API plus bulk golden copy; used as the primary join key everywhere." },
  { key: "acer-ceremp", name: "ACER CEREMP register", tier: 1, retrieved: "today", coverage: ["EU"], info: "EU-wide register of REMIT wholesale market participants, with ACER codes. Public web and bulk download." },
  { key: "ofgem", name: "Ofgem licensee list", tier: 1, retrieved: "16 Jul 2026", coverage: ["GB"], info: "GB gas and electricity licensees. Published as PDF lists, refreshed roughly monthly." },
  { key: "companies-house", name: "Companies House (GB)", tier: 1, retrieved: "2 days ago", coverage: ["GB"], info: "UK company register and filed accounts. Free API plus filing documents (iXBRL) for financials." },
  { key: "bnetza", name: "BNetzA / CEREMP (DE)", tier: 1, retrieved: "this month", coverage: ["DE"], info: "German regulator market-participant and REMIT registration (via CEREMP)." },
  { key: "bundesanzeiger", name: "Bundesanzeiger (DE)", tier: 1, retrieved: "last filing", coverage: ["DE"], info: "German federal gazette: filed company accounts and financials." },
  { key: "e-control", name: "E-Control (AT)", tier: 1, retrieved: "this month", coverage: ["AT"], info: "Austrian energy regulator: licensed suppliers and market participants." },
  { key: "firmenbuch", name: "Firmenbuch (AT)", tier: 1, retrieved: "last filing", coverage: ["AT"], info: "Austrian company register and filed accounts." },
  { key: "elcom", name: "ElCom (CH)", tier: 1, retrieved: "this month", coverage: ["CH"], info: "Swiss electricity regulator: grid and supply participants." },
  { key: "zefix", name: "Zefix (CH register)", tier: 1, retrieved: "last filing", coverage: ["CH"], info: "Swiss central business-name index and cantonal commercial registers." },
  { key: "eex", name: "EEX / EPEX participants", tier: 2, retrieved: "this week", coverage: ["EU", "DE", "AT", "CH", "GB"], info: "EEX and EPEX SPOT membership lists. Confirms a firm actually trades. Public web." },
  { key: "ice", name: "ICE Endex membership", tier: 2, retrieved: "this week", coverage: ["GB"], info: "ICE Endex trading membership. GB and NW-Europe activity signal." },
  { key: "entsog", name: "ENTSOG / GIE", tier: 2, retrieved: "today", coverage: ["EU", "DE", "AT", "CH", "GB"], info: "Gas transparency (ENTSOG) and storage / LNG (GIE) flows and capacity. Free APIs." },
  { key: "elexon", name: "Elexon BMRS (GB)", tier: 2, retrieved: "today", coverage: ["GB"], info: "GB balancing and settlement data by BM Unit. Public API." },
  { key: "dnb", name: "Dun & Bradstreet", tier: 3, retrieved: "2 weeks ago", coverage: ["GLOBAL"], info: "Commercial firmographics and credit (size, hierarchy, contacts). Paid; used only after identity is resolved." },
  { key: "web", name: "Company website (LLM)", tier: 4, retrieved: "unverified", coverage: ["GLOBAL"], info: "Open web and company sites via allow-listed retrieval. Augments only, never a decision-critical source on its own." },
];

// Which source backs each data field, per region. A plain string is region-agnostic;
// an object maps region codes to source keys with "*" as the default fallback.
export const FIELD_SOURCE: FieldSourceMap = {
  netDebt: { "*": "dnb", GB: "companies-house", DE: "bundesanzeiger", AT: "firmenbuch", CH: "zefix" },
  netAssets: { "*": "dnb", GB: "companies-house", DE: "bundesanzeiger", AT: "firmenbuch", CH: "zefix" },
  revenue: { "*": "dnb", GB: "companies-house", DE: "bundesanzeiger", AT: "firmenbuch", CH: "zefix" },
  creditRating: "dnb",
  headcount: "web",
  memberships: { "*": "eex", GB: "ice", EU: "eex" },
  annualVolume: { "*": "entsog", GB: "elexon", EU: "entsog" },
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
// data-field key -> source key (region-agnostic string) or a per-region map
// ({ "*": default, GB: ..., DE: ... }).
export type FieldSourceMap = Record<string, string | Record<string, string>>;

export interface SourceRegistry {
  sources: Source[];
  tierWeights: Record<number, number>;
  fieldSource: FieldSourceMap;
}

export const defaultSourceRegistry: SourceRegistry = {
  sources: SOURCES,
  tierWeights: DEFAULT_TIER_WEIGHTS,
  fieldSource: FIELD_SOURCE,
};

// Resolve the source key for a field in a jurisdiction: exact region, then the EU
// fallback (for EU regions), then the "*" / GLOBAL default.
export function sourceKeyForField(
  fieldKey: string,
  jurisdiction: string | undefined,
  reg: SourceRegistry = defaultSourceRegistry,
): string | undefined {
  const entry = reg.fieldSource[fieldKey];
  if (entry === undefined) return undefined;
  if (typeof entry === "string") return entry;
  const j = jurisdiction;
  return (
    (j ? entry[j] : undefined) ??
    (j && EU_REGIONS.includes(j) ? entry["EU"] : undefined) ??
    entry["*"] ??
    entry["GLOBAL"]
  );
}

export function sourceForField(
  fieldKey: string,
  jurisdiction?: string,
  reg: SourceRegistry = defaultSourceRegistry,
): Source | undefined {
  const key = sourceKeyForField(fieldKey, jurisdiction, reg);
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
  const jur = jurisdictionOf(cp);
  const fields = COUNTERPARTY_FIELDS[cp.id];
  const present = fields ? Object.keys(fields) : [];
  if (present.length === 0) return { score: hasLei ? 40 : 20, hasLei };
  const tw =
    present.reduce(
      (s, f) => s + tierWeight(sourceForField(f, jur, reg)?.tier ?? 4, reg.tierWeights),
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

// Hand-authored scoring criteria for Demand Market Access, wired to real data fields
// (net debt / net assets / memberships / annual volume) with mocked per-counterparty values.
const CORE_LIBRARY: LibraryCriterion[] = [
  {
    id: "balance-sheet-fit",
    label: "Balance sheet fit",
    description: "Whether the balance sheet supports the deal.",
    blocking: true,
    weight: 3,
    scenarios: ["demand-market-access"],
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
    weight: 4,
    scenarios: ["demand-market-access"],
    subCriteria: [
      { id: "exchange-gap", label: "Exchange access gap", dataField: "memberships", ruleType: "graded-max", thresholds: { floor: 0, ceiling: 4 }, weight: 4, direction: "lower", missing: "zero", enabled: true, blocking: false },
    ],
  },
  {
    id: "consumption-volume",
    label: "Consumption volume",
    description: "Annual gas or power consumption.",
    blocking: false,
    weight: 3,
    scenarios: ["demand-market-access"],
    subCriteria: [
      { id: "annual-consumption", label: "Annual volume", dataField: "annualVolume", ruleType: "graded-min", thresholds: { floor: 500, ceiling: 5000 }, weight: 3, direction: "higher", missing: "zero", enabled: true, blocking: false },
    ],
  },
  // Trading Market Access: three criteria wired to real signals (exchange membership,
  // traded-volume proxy, net-asset proxy). The remaining spec criteria (product overlap,
  // existing DMA relationships, regulatory permissions gap) stay as generated placeholders
  // that skip until data is wired, so they show as "no data" rather than fabricated numbers.
  {
    id: "efet-without-access",
    label: "EFET signatory without access",
    description: "On the EFET / trader list but lacking direct exchange or clearing membership is SEE's opportunity.",
    blocking: false,
    weight: 4,
    scenarios: ["trading-market-access"],
    subCriteria: [
      { id: "efet-access-gap", label: "Exchange / clearing access gap", dataField: "memberships", ruleType: "graded-max", thresholds: { floor: 0, ceiling: 4 }, weight: 4, direction: "lower", missing: "skip", enabled: true, blocking: false },
    ],
  },
  {
    id: "trading-activity",
    label: "Trading activity level",
    description: "Estimated annual traded volume (proxy: annual volume).",
    blocking: false,
    weight: 3,
    scenarios: ["trading-market-access"],
    subCriteria: [
      { id: "traded-volume", label: "Traded volume", dataField: "annualVolume", ruleType: "graded-min", thresholds: { floor: 500, ceiling: 5000 }, weight: 3, direction: "higher", missing: "skip", enabled: true, blocking: false },
    ],
  },
  {
    id: "margin-capacity",
    label: "Margining / collateral capacity",
    description: "Available cash or net assets as a proxy for margin capacity.",
    blocking: false,
    weight: 2,
    scenarios: ["trading-market-access", "transport-capacity"],
    subCriteria: [
      { id: "margin-net-assets", label: "Net assets proxy", dataField: "netAssets", ruleType: "graded-min", thresholds: { floor: 100, ceiling: 800 }, weight: 2, direction: "higher", missing: "skip", enabled: true, blocking: false },
    ],
  },
];

// Generate a library criterion for every other criterion in Michael's scenario set
// (from scenarios[].spec, so the library stays 1:1 with his sheet). Deduped by key, and a
// shared criterion is tagged to all the scenarios it appears in. Each gets a starter
// sub-criterion that maps to a placeholder data field and skips until data is wired, so
// scoring stays graceful. Rule type follows the inverse flag; thresholds/weights are
// starter defaults for Michael to tune on the Library screen.
function buildLibraryFromScenarios(exclude: Set<string>): LibraryCriterion[] {
  const byKey = new Map<string, LibraryCriterion>();
  for (const sc of scenarios) {
    for (const c of sc.spec) {
      if (exclude.has(c.key)) continue;
      const found = byKey.get(c.key);
      if (found) {
        if (!found.scenarios!.includes(sc.id)) found.scenarios!.push(sc.id);
        continue;
      }
      byKey.set(c.key, {
        id: c.key,
        label: c.label,
        description: c.metric,
        blocking: false,
        weight: c.optional ? 2 : 3,
        scenarios: [sc.id],
        subCriteria: [
          {
            id: `${c.key}-signal`,
            label: c.label,
            dataField: c.key,
            ruleType: c.inverse ? "graded-max" : "graded-min",
            thresholds: { floor: 0, ceiling: 100 },
            weight: c.optional ? 2 : 3,
            direction: c.inverse ? "lower" : "higher",
            missing: "skip",
            enabled: true,
            blocking: false,
          },
        ],
      });
    }
  }
  return [...byKey.values()];
}

// Full library: the wired Demand Market Access criteria plus every other scenario's
// criteria from Michael's set. Existing sub-criteria are preserved.
export const criteriaLibrary: LibraryCriterion[] = [
  ...CORE_LIBRARY,
  ...buildLibraryFromScenarios(new Set(CORE_LIBRARY.map((c) => c.id))),
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
  noData?: boolean; // no scored sub-criteria (all skipped / no data); excluded from fit
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
  jurisdiction?: string,
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
      const src = sourceForField(s.dataField, jurisdiction, reg);
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
    const noData = cDen === 0 && !cBlocked;
    const critBlocked = cBlocked || (c.blocking && cScore === 0 && cDen > 0);
    if (critBlocked) dealBlocked = true;
    critOut.push({ id: c.id, label: c.label, weight: c.weight, score: cScore, blocked: critBlocked, noData, subs });
    // No-data criteria (all subs skipped) do not drag the fit down.
    if (!noData) {
      fitNum += cScore * c.weight;
      fitDen += c.weight;
    }
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
