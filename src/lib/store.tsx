import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  commTemplates as seedTemplates,
  counterparties as seedCounterparties,
  counterpartyFieldValue,
  criteriaLibrary as seedLibrary,
  DATA_FIELDS as seedDataFields,
  NEWS_SIGNALS,
  dataQuality,
  defaultConfig,
  defaultSourceRegistry,
  jurisdictionOf,
  fitScore,
  inheritConfig,
  scoreBreakdown,
  sourceForField,
  scenarios as seedScenarios,
  type Account,
  type AccountStatus,
  type BusinessLineType,
  type CommChannel,
  type CommLog,
  type CommTemplate,
  type Config,
  type Note,
  type Contact,
  type ContactSource,
  type Counterparty,
  type DataField,
  type EffectiveCriterion,
  type LibraryCriterion,
  type NewsSignal,
  type Pillar,
  type RuleThresholds,
  type Scenario,
  type ScenarioConfig,
  type ScoreBreakdown,
  type Shortlist,
  type Source,
  type SourceRegistry,
  type FieldSourceMap,
  type SubCriterion,
} from "./data";

// Scenario-level overrides on top of the library (Layer 2 composition).
type SubOverride = { enabled?: boolean; weight?: number; thresholds?: RuleThresholds };
type CritOverride = {
  enabled?: boolean;
  weight?: number;
  subOverrides?: Record<string, SubOverride>;
};
type ScenarioRule = { criteria: Record<string, CritOverride> };

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

  // Communication templates (content-admin authored; config data).
  commTemplates: CommTemplate[];
  addTemplate: (t: Omit<CommTemplate, "id">) => string;
  updateTemplate: (id: string, patch: Partial<Omit<CommTemplate, "id">>) => void;
  deleteTemplate: (id: string) => void;

  // Criteria library (Admin-authored; config data). Layer 1 of the rules engine.
  criteriaLibrary: LibraryCriterion[];
  addLibraryCriterion: () => string;
  updateLibraryCriterion: (
    id: string,
    patch: Partial<Omit<LibraryCriterion, "id" | "subCriteria">>,
  ) => void;
  deleteLibraryCriterion: (id: string) => void;
  duplicateLibraryCriterion: (id: string) => string | undefined;
  dataFields: DataField[];
  addDataField: () => string;
  updateDataField: (key: string, patch: Partial<Omit<DataField, "key">>) => void;
  deleteDataField: (key: string) => void;
  // News & market signals (intelligence feed + notification centre).
  newsSignals: NewsSignal[];
  readSignals: string[];
  unreadSignalCount: number;
  markSignalRead: (id: string) => void;
  markAllSignalsRead: () => void;
  addSubCriterion: (critId: string) => void;
  updateSubCriterion: (
    critId: string,
    subId: string,
    patch: Partial<Omit<SubCriterion, "id">>,
  ) => void;
  deleteSubCriterion: (critId: string, subId: string) => void;

  // Source registry (data provenance config). Admin-managed; config data.
  sourceRegistry: SourceRegistry;
  addSource: () => void;
  updateSource: (key: string, patch: Partial<Omit<Source, "key">>) => void;
  deleteSource: (key: string) => void;
  setFieldSource: (fieldKey: string, sourceKey: string, region?: string) => void;
  setTierWeight: (tier: number, weight: number) => void;
  sourceForField: (fieldKey: string, jurisdiction?: string) => Source | undefined;
  dataQuality: (cp: Counterparty) => { score: number; hasLei: boolean };

  // Scenario composition (rules engine, Layer 2). Overrides on top of the library.
  resolveScenario: (scenarioId: string) => EffectiveCriterion[];
  scoreFor: (counterpartyId: string, scenarioId: string) => ScoreBreakdown;
  setScenarioCritOverride: (
    scenarioId: string,
    libraryId: string,
    patch: { enabled?: boolean; weight?: number },
  ) => void;
  setScenarioSubOverride: (
    scenarioId: string,
    libraryId: string,
    subId: string,
    patch: SubOverride,
  ) => void;
  resetScenarioCriterion: (scenarioId: string, libraryId: string) => void;
  isScenarioCriterionCustomised: (scenarioId: string, libraryId: string) => boolean;

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
  notes: Note[];
  notesFor: (accountId: string) => Note[];
  addNote: (accountId: string, body: string) => void;
  updateNote: (id: string, body: string) => void;
  deleteNote: (id: string) => void;
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
  const [commTemplateList, setCommTemplateList] =
    useState<CommTemplate[]>(seedTemplates);
  const [criteriaLibraryList, setCriteriaLibraryList] =
    useState<LibraryCriterion[]>(seedLibrary);
  const [scenarioRules, setScenarioRules] = useState<
    Record<string, ScenarioRule>
  >({});
  const [sourceRegistry, setSourceRegistry] =
    useState<SourceRegistry>(defaultSourceRegistry);
  const [dataFieldsList, setDataFieldsList] = useState<DataField[]>(seedDataFields);
  const [counterpartyList, setCounterpartyList] =
    useState<Counterparty[]>(seedCounterparties);
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [commLogs, setCommLogs] = useState<CommLog[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [readSignals, setReadSignals] = useState<string[]>([]);
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
        if (s.commTemplates) setCommTemplateList(s.commTemplates);
        if (s.criteriaLibrary) setCriteriaLibraryList(s.criteriaLibrary);
        if (s.scenarioRules) setScenarioRules(s.scenarioRules);
        if (s.sourceRegistry) setSourceRegistry(s.sourceRegistry);
        if (s.dataFields) setDataFieldsList(s.dataFields);
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
            commTemplates: seedTemplates,
            criteriaLibrary: seedLibrary,
            scenarioRules: {},
            sourceRegistry: defaultSourceRegistry,
            dataFields: seedDataFields,
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
        if (Array.isArray(o.counterparties)) {
          // Non-destructive: make sure every real-data counterparty is present,
          // even if the saved universe predates them.
          let list = o.counterparties as Counterparty[];
          const missingReal = seedCounterparties.filter(
            (c) => c.realData && !list.some((x) => x.id === c.id),
          );
          if (missingReal.length) list = [...missingReal, ...list];
          setCounterpartyList(list);
        }
        if (Array.isArray(o.shortlists)) setShortlists(o.shortlists);
        if (Array.isArray(o.accounts)) setAccounts(o.accounts);
        if (Array.isArray(o.contacts)) setContacts(o.contacts);
        if (Array.isArray(o.commLogs)) setCommLogs(o.commLogs);
        if (Array.isArray(o.notes)) setNotes(o.notes);
        if (Array.isArray(o.readSignals)) setReadSignals(o.readSignals);
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
          notes,
          readSignals,
        }),
      );
    } catch {
      // ignore quota errors
    }
  }, [hydrated, counterpartyList, shortlists, accounts, contacts, commLogs, notes, readSignals]);

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
        } as Partial<ScenarioConfig>,

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

  // --- Communication templates -------------------------------------------
  const addTemplate = (t: Omit<CommTemplate, "id">) => {
    const id = uid("tpl");
    setCommTemplateList((l) => [{ id, ...t }, ...l]);
    return id;
  };
  const updateTemplate = (
    id: string,
    patch: Partial<Omit<CommTemplate, "id">>,
  ) =>
    setCommTemplateList((l) =>
      l.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );
  const deleteTemplate = (id: string) =>
    setCommTemplateList((l) => l.filter((t) => t.id !== id));

  // --- Criteria library (rules engine, Layer 1) ---------------------------
  const addLibraryCriterion = () => {
    const id = uid("crit");
    setCriteriaLibraryList((l) => [
      ...l,
      { id, label: "New criterion", description: "", blocking: false, weight: 3, subCriteria: [] },
    ]);
    return id;
  };
  const updateLibraryCriterion = (
    id: string,
    patch: Partial<Omit<LibraryCriterion, "id" | "subCriteria">>,
  ) =>
    setCriteriaLibraryList((l) =>
      l.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    );
  const deleteLibraryCriterion = (id: string) =>
    setCriteriaLibraryList((l) => l.filter((c) => c.id !== id));
  const duplicateLibraryCriterion = (id: string) => {
    let newId: string | undefined;
    setCriteriaLibraryList((l) => {
      const idx = l.findIndex((c) => c.id === id);
      if (idx < 0) return l;
      const src = l[idx];
      newId = uid("crit");
      const copy: LibraryCriterion = {
        ...src,
        id: newId,
        label: `${src.label} (copy)`,
        subCriteria: src.subCriteria.map((s) => ({ ...s, id: uid("sub") })),
      };
      return [...l.slice(0, idx + 1), copy, ...l.slice(idx + 1)];
    });
    return newId;
  };

  // --- Data field catalogue (admin-managed; consumed read-only by the Library) ---
  const addDataField = () => {
    const key = uid("field");
    setDataFieldsList((l) => [
      ...l,
      { key, label: "New field", unit: "", source: "(to be wired)", type: "number", description: "" },
    ]);
    return key;
  };
  const updateDataField = (key: string, patch: Partial<Omit<DataField, "key">>) =>
    setDataFieldsList((l) => l.map((f) => (f.key === key ? { ...f, ...patch } : f)));
  const deleteDataField = (key: string) =>
    setDataFieldsList((l) => l.filter((f) => f.key !== key));

  // --- News & market signals -------------------------------------------------
  const markSignalRead = (id: string) =>
    setReadSignals((r) => (r.includes(id) ? r : [...r, id]));
  const markAllSignalsRead = () =>
    setReadSignals(NEWS_SIGNALS.filter((s) => s.notify).map((s) => s.id));
  const unreadSignalCount = NEWS_SIGNALS.filter(
    (s) => s.notify && !readSignals.includes(s.id),
  ).length;
  const addSubCriterion = (critId: string) =>
    setCriteriaLibraryList((l) =>
      l.map((c) =>
        c.id === critId
          ? {
              ...c,
              subCriteria: [
                ...c.subCriteria,
                {
                  id: uid("sub"),
                  label: "New sub-criterion",
                  dataField: "netDebt",
                  ruleType: "graded-min",
                  thresholds: { floor: 0, ceiling: 100 },
                  weight: 3,
                  direction: "higher",
                  missing: "zero",
                  enabled: true,
                  blocking: false,
                },
              ],
            }
          : c,
      ),
    );
  const updateSubCriterion = (
    critId: string,
    subId: string,
    patch: Partial<Omit<SubCriterion, "id">>,
  ) =>
    setCriteriaLibraryList((l) =>
      l.map((c) =>
        c.id === critId
          ? {
              ...c,
              subCriteria: c.subCriteria.map((s) =>
                s.id === subId ? { ...s, ...patch } : s,
              ),
            }
          : c,
      ),
    );
  const deleteSubCriterion = (critId: string, subId: string) =>
    setCriteriaLibraryList((l) =>
      l.map((c) =>
        c.id === critId
          ? { ...c, subCriteria: c.subCriteria.filter((s) => s.id !== subId) }
          : c,
      ),
    );

  // --- Source registry (data provenance config) ---------------------------
  const addSource = () =>
    setSourceRegistry((r) => ({
      ...r,
      sources: [
        ...r.sources,
        { key: uid("src"), name: "New source", tier: 3, retrieved: "unverified", coverage: ["GLOBAL"] },
      ],
    }));
  const updateSource = (key: string, patch: Partial<Omit<Source, "key">>) =>
    setSourceRegistry((r) => ({
      ...r,
      sources: r.sources.map((s) => (s.key === key ? { ...s, ...patch } : s)),
    }));
  const deleteSource = (key: string) =>
    setSourceRegistry((r) => {
      // Scrub the removed source key from every field mapping (string or region map).
      const fieldSource: FieldSourceMap = {};
      for (const [f, v] of Object.entries(r.fieldSource)) {
        if (typeof v === "string") {
          if (v !== key) fieldSource[f] = v;
        } else {
          const cleaned: Record<string, string> = {};
          for (const [rg, sk] of Object.entries(v)) if (sk !== key) cleaned[rg] = sk;
          if (Object.keys(cleaned).length) fieldSource[f] = cleaned;
        }
      }
      return { ...r, sources: r.sources.filter((s) => s.key !== key), fieldSource };
    });
  // Set the source for a field. With no region (or "*") it sets the default; with a
  // region it writes a per-region override, migrating a plain string to a region map.
  const setFieldSource = (fieldKey: string, sourceKey: string, region?: string) =>
    setSourceRegistry((r) => {
      const cur = r.fieldSource[fieldKey];
      let next: string | Record<string, string>;
      if (!region || region === "*") {
        next = cur && typeof cur === "object" ? { ...cur, "*": sourceKey } : sourceKey;
      } else {
        const base: Record<string, string> =
          cur && typeof cur === "object"
            ? { ...cur }
            : typeof cur === "string" && cur
              ? { "*": cur }
              : {};
        base[region] = sourceKey;
        next = base;
      }
      return { ...r, fieldSource: { ...r.fieldSource, [fieldKey]: next } };
    });
  const setTierWeight = (tier: number, weight: number) =>
    setSourceRegistry((r) => ({
      ...r,
      tierWeights: { ...r.tierWeights, [tier]: weight },
    }));
  const sourceForFieldBound = (fieldKey: string, jurisdiction?: string) =>
    sourceForField(fieldKey, jurisdiction, sourceRegistry);
  const dataQualityBound = (cp: Counterparty) => dataQuality(cp, sourceRegistry);

  // --- Scenario composition (rules engine, Layer 2) -----------------------
  const resolveScenario = (scenarioId: string): EffectiveCriterion[] => {
    const rule = scenarioRules[scenarioId];
    // Only the criteria tagged for this scenario (untagged = applies to all).
    const applicable = criteriaLibraryList.filter(
      (c) => !c.scenarios || c.scenarios.length === 0 || c.scenarios.includes(scenarioId),
    );
    const list = applicable.length ? applicable : criteriaLibraryList;
    return list.map((c) => {
      const ov = rule?.criteria[c.id];
      return {
        id: c.id,
        label: c.label,
        description: c.description,
        blocking: c.blocking,
        weight: ov?.weight ?? c.weight ?? 3,
        enabled: ov?.enabled ?? true,
        subCriteria: c.subCriteria.map((s) => {
          const so = ov?.subOverrides?.[s.id];
          return {
            id: s.id,
            label: s.label,
            dataField: s.dataField,
            ruleType: s.ruleType,
            thresholds: so?.thresholds ?? s.thresholds,
            weight: so?.weight ?? s.weight,
            direction: s.direction,
            missing: s.missing,
            enabled: so?.enabled ?? s.enabled,
            blocking: s.blocking,
          };
        }),
      };
    });
  };
  const scoreFor = (counterpartyId: string, scenarioId: string) => {
    const cp = counterpartyList.find((c) => c.id === counterpartyId);
    return scoreBreakdown(
      resolveScenario(scenarioId),
      (f) => counterpartyFieldValue(counterpartyId, f),
      sourceRegistry,
      cp ? jurisdictionOf(cp) : undefined,
    );
  };
  const setScenarioCritOverride = (
    scenarioId: string,
    libraryId: string,
    patch: { enabled?: boolean; weight?: number },
  ) =>
    setScenarioRules((p) => {
      const rule = p[scenarioId] ?? { criteria: {} };
      const cur = rule.criteria[libraryId] ?? {};
      return {
        ...p,
        [scenarioId]: {
          criteria: { ...rule.criteria, [libraryId]: { ...cur, ...patch } },
        },
      };
    });
  const setScenarioSubOverride = (
    scenarioId: string,
    libraryId: string,
    subId: string,
    patch: SubOverride,
  ) =>
    setScenarioRules((p) => {
      const rule = p[scenarioId] ?? { criteria: {} };
      const cur = rule.criteria[libraryId] ?? {};
      const subs = cur.subOverrides ?? {};
      const s = subs[subId] ?? {};
      return {
        ...p,
        [scenarioId]: {
          criteria: {
            ...rule.criteria,
            [libraryId]: {
              ...cur,
              subOverrides: { ...subs, [subId]: { ...s, ...patch } },
            },
          },
        },
      };
    });
  const resetScenarioCriterion = (scenarioId: string, libraryId: string) =>
    setScenarioRules((p) => {
      const rule = p[scenarioId];
      if (!rule) return p;
      const next = { ...rule.criteria };
      delete next[libraryId];
      return { ...p, [scenarioId]: { criteria: next } };
    });
  const isScenarioCriterionCustomised = (scenarioId: string, libraryId: string) =>
    !!scenarioRules[scenarioId]?.criteria[libraryId];

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

  const notesFor = (accountId: string) =>
    notes
      .filter((n) => n.accountId === accountId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const addNote = (accountId: string, body: string) => {
    const now = new Date().toISOString();
    setNotes((l) => [
      { id: uid("note"), accountId, body: body.trim(), author: "You", createdAt: now, updatedAt: now },
      ...l,
    ]);
  };
  const updateNote = (id: string, body: string) =>
    setNotes((l) =>
      l.map((n) =>
        n.id === id
          ? { ...n, body: body.trim(), updatedAt: new Date().toISOString() }
          : n,
      ),
    );
  const deleteNote = (id: string) =>
    setNotes((l) => l.filter((n) => n.id !== id));

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
    commTemplates: commTemplateList,
    criteriaLibrary: criteriaLibraryList,
    scenarioRules,
    sourceRegistry,
    dataFields: dataFieldsList,
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
    commTemplates: commTemplateList,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    criteriaLibrary: criteriaLibraryList,
    addLibraryCriterion,
    updateLibraryCriterion,
    deleteLibraryCriterion,
    duplicateLibraryCriterion,
    dataFields: dataFieldsList,
    addDataField,
    updateDataField,
    deleteDataField,
    newsSignals: NEWS_SIGNALS,
    readSignals,
    unreadSignalCount,
    markSignalRead,
    markAllSignalsRead,
    addSubCriterion,
    updateSubCriterion,
    deleteSubCriterion,
    sourceRegistry,
    addSource,
    updateSource,
    deleteSource,
    setFieldSource,
    setTierWeight,
    sourceForField: sourceForFieldBound,
    dataQuality: dataQualityBound,
    resolveScenario,
    scoreFor,
    setScenarioCritOverride,
    setScenarioSubOverride,
    resetScenarioCriterion,
    isScenarioCriterionCustomised,
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
    notes,
    notesFor,
    addNote,
    updateNote,
    deleteNote,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export type { Decision };
