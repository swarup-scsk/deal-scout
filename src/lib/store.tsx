import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  counterparties as seedCounterparties,
  defaultConfig,
  fitScore,
  inheritConfig,
  scenarios as seedScenarios,
  type Account,
  type AccountStatus,
  type BusinessLineType,
  type CommChannel,
  type CommLog,
  type Config,
  type Contact,
  type ContactSource,
  type Counterparty,
  type Pillar,
  type Scenario,
  type ScenarioConfig,
  type Shortlist,
} from "./data";

// Config lives under the manual "Save all" model.
const STORAGE_KEY = "deal-scout.state.v2";
// Operational data (counterparties, shortlists, CRM) auto-saves separately.
const OPS_KEY = "deal-scout.ops.v1";

interface Decision {
  choice: "Proceed" | "Hold" | "Decline";
  rationale: string;
  timestamp: string;
}

const uid = (p: string) =>
  `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

function parseContact(s?: string): { name: string; role: string } | null {
  if (!s || s === "n/a" || s === "No prior contact") return null;
  const m = s.match(/^(.*?)\s*\((.*)\)\s*$/);
  if (m) return { name: m[1].trim(), role: m[2].trim() };
  return { name: s.trim(), role: "Contact" };
}

function slug(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "cp"
  );
}

interface StoreValue {
  config: Config;
  setConfig: (c: Config) => void;
  selectedScenarioId: string;
  setSelectedScenarioId: (id: string) => void;
  configOpen: boolean;
  setConfigOpen: (v: boolean) => void;
  scenarios: Scenario[];
  addScenario: (pillar: Pillar, title: string) => string;
  renameScenario: (id: string, title: string) => void;
  deleteScenario: (id: string) => void;
  counterparties: Counterparty[];
  addCounterparty: (input: {
    company: string;
    country: string;
    businessLineType: BusinessLineType;
    markets: string;
    annualVolume: number;
    revenueEbitda?: string;
  }) => void;
  rankedCounterparties: (Counterparty & {
    fit: number;
    rejected: boolean;
    belowTarget: boolean;
    belowHurdle: boolean;
  })[];
  decisions: Record<string, Decision>;
  recordDecision: (id: string, d: Decision) => void;
  scenarioOverrides: Record<string, Partial<ScenarioConfig>>;
  setScenarioOverride: (id: string, partial: Partial<ScenarioConfig>) => void;
  clearScenarioOverride: (id: string) => void;
  resolvedScenarioConfig: (id: string) => ScenarioConfig;
  criterionWeights: Record<string, Record<string, number>>;
  setCriterionWeight: (id: string, key: string, v: number) => void;
  disabledRules: Record<string, string[]>;
  toggleRuleDisabled: (id: string, field: string) => void;
  criterionDescriptions: Record<string, Record<string, string>>;
  setCriterionDescription: (id: string, key: string, description: string) => void;
  setScenarioDescription: (id: string, description: string) => void;
  role: "Admin" | "User";
  setRole: (r: "Admin" | "User") => void;
  dirty: boolean;
  saveAll: () => void;

  // Shortlists (playlist-style named lists).
  shortlists: Shortlist[];
  createShortlist: (name: string, firstCounterpartyId?: string) => string;
  renameShortlist: (id: string, name: string) => void;
  deleteShortlist: (id: string) => void;
  addToShortlist: (listId: string, counterpartyId: string) => void;
  removeFromShortlist: (listId: string, counterpartyId: string) => void;
  shortlistsForCounterparty: (counterpartyId: string) => string[];

  // Micro-CRM.
  accounts: Account[];
  contacts: Contact[];
  commLogs: CommLog[];
  accountForCounterparty: (counterpartyId: string) => Account | undefined;
  startCrm: (counterpartyId: string) => string;
  addContact: (
    accountId: string,
    input: {
      name: string;
      role: string;
      email?: string;
      phone?: string;
      linkedin?: string;
      source?: ContactSource;
    },
  ) => void;
  enrichAccount: (accountId: string) => void;
  logComm: (
    accountId: string,
    entry: { channel: CommChannel; subject?: string; body: string },
  ) => void;
  setAccountStatus: (
    accountId: string,
    status: AccountStatus,
    dealRef?: string,
  ) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Config>(defaultConfig);
  const [selectedScenarioId, setSelectedScenarioId] =
    useState<string>("demand-market-access");
  const [configOpen, setConfigOpen] = useState(false);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [scenarioOverrides, setScenarioOverrides] = useState<
    Record<string, Partial<ScenarioConfig>>
  >({});
  const [scenarioList, setScenarioList] = useState<Scenario[]>(seedScenarios);
  const [criterionWeights, setCriterionWeights] = useState<
    Record<string, Record<string, number>>
  >({});
  const [disabledRules, setDisabledRules] = useState<Record<string, string[]>>(
    {},
  );
  const [criterionDescriptions, setCriterionDescriptions] = useState<
    Record<string, Record<string, string>>
  >({});
  const [role, setRole] = useState<"Admin" | "User">("Admin");
  const [counterpartyList, setCounterpartyList] =
    useState<Counterparty[]>(seedCounterparties);
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [commLogs, setCommLogs] = useState<CommLog[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [savedSnap, setSavedSnap] = useState("");

  // Hydrate saved state from the browser after mount (SSR-safe).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.config) setConfig(s.config);
        if (s.scenarioOverrides) setScenarioOverrides(s.scenarioOverrides);
        if (s.criterionWeights) setCriterionWeights(s.criterionWeights);
        if (s.disabledRules) setDisabledRules(s.disabledRules);
        if (s.criterionDescriptions)
          setCriterionDescriptions(s.criterionDescriptions);
        if (s.scenarioList) setScenarioList(s.scenarioList);
        setSavedSnap(raw);
      } else {
        setSavedSnap(
          JSON.stringify({
            config: defaultConfig,
            scenarioOverrides: {},
            criterionWeights: {},
            disabledRules: {},
            criterionDescriptions: {},
            scenarioList: seedScenarios,
          }),
        );
      }
    } catch {
      // ignore malformed storage
    }
    // Operational data (auto-persisted).
    try {
      const rawOps = localStorage.getItem(OPS_KEY);
      if (rawOps) {
        const o = JSON.parse(rawOps);
        if (Array.isArray(o.counterparties)) setCounterpartyList(o.counterparties);
        if (Array.isArray(o.shortlists)) setShortlists(o.shortlists);
        if (Array.isArray(o.accounts)) setAccounts(o.accounts);
        if (Array.isArray(o.contacts)) setContacts(o.contacts);
        if (Array.isArray(o.commLogs)) setCommLogs(o.commLogs);
      }
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  // Auto-persist operational data whenever it changes (after hydration).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        OPS_KEY,
        JSON.stringify({
          counterparties: counterpartyList,
          shortlists,
          accounts,
          contacts,
          commLogs,
        }),
      );
    } catch {
      // ignore quota errors
    }
  }, [hydrated, counterpartyList, shortlists, accounts, contacts, commLogs]);

  const rankedCounterparties = useMemo(() => {
    return counterpartyList
      .map((cp) => {
        const fit = fitScore(cp, config.weights);
        const belowTarget = cp.annualVolume < config.rules.targetVolume;
        const belowHurdle = fit < config.rules.fitMid;
        const rejected =
          cp.margin < config.rules.returnGate || belowTarget || belowHurdle;
        return { ...cp, fit, rejected, belowTarget, belowHurdle };
      })
      .sort((a, b) => b.fit - a.fit);
  }, [config, counterpartyList]);

  const addCounterparty = (input: {
    company: string;
    country: string;
    businessLineType: BusinessLineType;
    markets: string;
    annualVolume: number;
    revenueEbitda?: string;
  }) => {
    const base = slug(input.company);
    const cp: Counterparty = {
      id: `${base}-${Date.now().toString(36)}`,
      company: input.company,
      country: input.country,
      legalEntityName: input.company,
      lei: "n/a",
      revenueEbitda: input.revenueEbitda || "n/a",
      headcount: "n/a",
      businessLine: input.businessLineType,
      businessLineType: input.businessLineType,
      markets: input.markets || "n/a",
      portfolioSize: "n/a",
      gasMarket: "n/a",
      powerMarket: "n/a",
      annualVolume: input.annualVolume || 0,
      aiInsight: "Added manually.",
      margin: 0,
      sub: {
        strategicFit: 60,
        profitability: 60,
        portfolioSynergy: 60,
        complexity: 60,
        dataAvailability: 60,
      },
      sector: input.businessLineType,
      priceHub: config.scope.hub,
      seasonalSwing: 50,
      creditworthiness: 50,
      contact: "n/a",
      standing: "New (manually added)",
      lastContact: "No prior contact",
      evidence: [],
      suggestion: "Hold",
      suggestionBasis: "Manually added, not yet scored.",
      indicativeSizing: "n/a",
      demandProfileFit: "n/a",
      keyRisk: "n/a",
    };
    setCounterpartyList((l) => [cp, ...l]);
  };

  const setScenarioOverride = (id: string, partial: Partial<ScenarioConfig>) =>
    setScenarioOverrides((p) => {
      const prev = p[id] ?? {};
      return {
        ...p,
        [id]: {
          thresholds: { ...prev.thresholds, ...partial.thresholds },
          rules: { ...prev.rules, ...partial.rules },
        },
      };
    });
  const clearScenarioOverride = (id: string) => {
    setScenarioOverrides((p) => {
      const n = { ...p };
      delete n[id];
      return n;
    });
    setCriterionWeights((p) => {
      const n = { ...p };
      delete n[id];
      return n;
    });
    setDisabledRules((p) => {
      const n = { ...p };
      delete n[id];
      return n;
    });
    setCriterionDescriptions((p) => {
      const n = { ...p };
      delete n[id];
      return n;
    });
  };
  const setCriterionWeight = (id: string, key: string, v: number) =>
    setCriterionWeights((p) => ({ ...p, [id]: { ...(p[id] ?? {}), [key]: v } }));
  const setCriterionDescription = (id: string, key: string, description: string) =>
    setCriterionDescriptions((p) => ({
      ...p,
      [id]: { ...(p[id] ?? {}), [key]: description },
    }));
  const toggleRuleDisabled = (id: string, field: string) =>
    setDisabledRules((p) => {
      const cur = p[id] ?? [];
      const next = cur.includes(field)
        ? cur.filter((f) => f !== field)
        : [...cur, field];
      return { ...p, [id]: next };
    });
  const resolvedScenarioConfig = (id: string) =>
    inheritConfig(config, scenarioOverrides[id]);

  const addScenario = (pillar: Pillar, title: string) => {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const id = base ? `${base}-${Date.now().toString(36)}` : `scenario-${Date.now().toString(36)}`;
    setScenarioList((l) => [
      ...l,
      {
        id,
        pillar,
        title: title || "New transaction type",
        criteria: { ...config.weights },
        spec: [],
      },
    ]);
    return id;
  };
  const renameScenario = (id: string, title: string) =>
    setScenarioList((l) => l.map((s) => (s.id === id ? { ...s, title } : s)));
  const setScenarioDescription = (id: string, description: string) =>
    setScenarioList((l) =>
      l.map((s) => (s.id === id ? { ...s, description } : s)),
    );
  const deleteScenario = (id: string) => {
    setScenarioList((l) => l.filter((s) => s.id !== id));
    clearScenarioOverride(id);
  };

  // --- Shortlists ---------------------------------------------------------
  const createShortlist = (name: string, firstCounterpartyId?: string) => {
    const id = uid("sl");
    setShortlists((l) => [
      {
        id,
        name: name.trim() || "Untitled shortlist",
        counterpartyIds: firstCounterpartyId ? [firstCounterpartyId] : [],
        createdAt: new Date().toISOString(),
      },
      ...l,
    ]);
    return id;
  };
  const renameShortlist = (id: string, name: string) =>
    setShortlists((l) =>
      l.map((s) => (s.id === id ? { ...s, name: name.trim() || s.name } : s)),
    );
  const deleteShortlist = (id: string) =>
    setShortlists((l) => l.filter((s) => s.id !== id));
  const addToShortlist = (listId: string, counterpartyId: string) =>
    setShortlists((l) =>
      l.map((s) =>
        s.id === listId && !s.counterpartyIds.includes(counterpartyId)
          ? { ...s, counterpartyIds: [...s.counterpartyIds, counterpartyId] }
          : s,
      ),
    );
  const removeFromShortlist = (listId: string, counterpartyId: string) =>
    setShortlists((l) =>
      l.map((s) =>
        s.id === listId
          ? {
              ...s,
              counterpartyIds: s.counterpartyIds.filter(
                (c) => c !== counterpartyId,
              ),
            }
          : s,
      ),
    );
  const shortlistsForCounterparty = (counterpartyId: string) =>
    shortlists.filter((s) => s.counterpartyIds.includes(counterpartyId)).map((s) => s.id);

  // --- Micro-CRM ----------------------------------------------------------
  const accountForCounterparty = (counterpartyId: string) =>
    accounts.find((a) => a.counterpartyId === counterpartyId);

  const startCrm = (counterpartyId: string) => {
    const existing = accounts.find((a) => a.counterpartyId === counterpartyId);
    if (existing) return existing.id;
    const cp = counterpartyList.find((c) => c.id === counterpartyId);
    const accountId = `acct-${slug(cp?.company ?? counterpartyId)}-${Date.now().toString(36)}`;
    const account: Account = {
      id: accountId,
      counterpartyId,
      company: cp?.company ?? "Unknown",
      status: "active",
      createdAt: new Date().toISOString(),
    };
    setAccounts((l) => [account, ...l]);
    // Auto-create a contact from the counterparty's known contact, if any.
    const pc = parseContact(cp?.contact);
    if (pc) {
      setContacts((l) => [
        {
          id: uid("ct"),
          accountId,
          name: pc.name,
          role: pc.role,
          source: "auto",
        },
        ...l,
      ]);
    }
    return accountId;
  };

  const addContact = (
    accountId: string,
    input: {
      name: string;
      role: string;
      email?: string;
      phone?: string;
      linkedin?: string;
      source?: ContactSource;
    },
  ) =>
    setContacts((l) => [
      {
        id: uid("ct"),
        accountId,
        name: input.name.trim(),
        role: input.role.trim() || "Contact",
        email: input.email?.trim() || undefined,
        phone: input.phone?.trim() || undefined,
        linkedin: input.linkedin?.trim() || undefined,
        source: input.source ?? "manual",
      },
      ...l,
    ]);

  // Mock enrichment: simulates website + ZoomInfo lookup. Structured so a real
  // connector can replace the body later (see DATA_CONTRACT.md).
  const enrichAccount = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return;
    const cp = counterpartyList.find((c) => c.id === account.counterpartyId);
    const domain = `${slug(account.company)}.com`;
    setAccounts((l) =>
      l.map((a) =>
        a.id === accountId
          ? {
              ...a,
              website: `https://www.${domain}`,
              enrichedAt: new Date().toISOString(),
            }
          : a,
      ),
    );
    const first = cp?.country === "Belgium" ? "Sophie" : "Daan";
    const enriched: Contact[] = [
      {
        id: uid("ct"),
        accountId,
        name: `${first} Maes`,
        role: "Head of Trading",
        email: `${first.toLowerCase()}.maes@${domain}`,
        linkedin: `https://linkedin.com/in/${first.toLowerCase()}-maes`,
        source: "enriched",
      },
      {
        id: uid("ct"),
        accountId,
        name: "Procurement Desk",
        role: "Procurement",
        email: `procurement@${domain}`,
        source: "enriched",
      },
    ];
    setContacts((l) => [...enriched, ...l]);
  };

  const logComm = (
    accountId: string,
    entry: { channel: CommChannel; subject?: string; body: string },
  ) =>
    setCommLogs((l) => [
      {
        id: uid("cm"),
        accountId,
        channel: entry.channel,
        subject: entry.subject,
        body: entry.body,
        timestamp: new Date().toISOString(),
      },
      ...l,
    ]);

  const setAccountStatus = (
    accountId: string,
    status: AccountStatus,
    dealRef?: string,
  ) =>
    setAccounts((l) =>
      l.map((a) =>
        a.id === accountId
          ? {
              ...a,
              status,
              dealRef: status === "deal-closed" ? dealRef : undefined,
              dealClosedAt:
                status === "deal-closed" ? new Date().toISOString() : undefined,
            }
          : a,
      ),
    );

  const currentSnap = JSON.stringify({
    config,
    scenarioOverrides,
    criterionWeights,
    disabledRules,
    criterionDescriptions,
    scenarioList,
  });
  const dirty = hydrated && currentSnap !== savedSnap;
  const saveAll = () => {
    try {
      localStorage.setItem(STORAGE_KEY, currentSnap);
    } catch {
      // ignore quota errors
    }
    setSavedSnap(currentSnap);
  };

  const value: StoreValue = {
    config,
    setConfig,
    selectedScenarioId,
    setSelectedScenarioId,
    configOpen,
    setConfigOpen,
    scenarios: scenarioList,
    addScenario,
    renameScenario,
    deleteScenario,
    counterparties: counterpartyList,
    addCounterparty,
    rankedCounterparties,
    decisions,
    recordDecision: (id, d) => setDecisions((p) => ({ ...p, [id]: d })),
    scenarioOverrides,
    setScenarioOverride,
    clearScenarioOverride,
    resolvedScenarioConfig,
    criterionWeights,
    setCriterionWeight,
    disabledRules,
    toggleRuleDisabled,
    criterionDescriptions,
    setCriterionDescription,
    setScenarioDescription,
    role,
    setRole,
    dirty,
    saveAll,
    shortlists,
    createShortlist,
    renameShortlist,
    deleteShortlist,
    addToShortlist,
    removeFromShortlist,
    shortlistsForCounterparty,
    accounts,
    contacts,
    commLogs,
    accountForCounterparty,
    startCrm,
    addContact,
    enrichAccount,
    logComm,
    setAccountStatus,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export type { Decision };
