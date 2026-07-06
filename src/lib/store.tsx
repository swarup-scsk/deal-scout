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
  type Config,
  type Counterparty,
  type Scenario,
  type ScenarioConfig,
} from "./data";

const STORAGE_KEY = "deal-scout.state";

interface Decision {
  choice: "Proceed" | "Hold" | "Decline";
  rationale: string;
  timestamp: string;
}

interface StoreValue {
  config: Config;
  setConfig: (c: Config) => void;
  selectedScenarioId: string;
  setSelectedScenarioId: (id: string) => void;
  configOpen: boolean;
  setConfigOpen: (v: boolean) => void;
  scenarios: Scenario[];
  addScenario: (title: string) => string;
  renameScenario: (id: string, title: string) => void;
  counterparties: Counterparty[];
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
  dirty: boolean;
  saveAll: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Config>(defaultConfig);
  const [selectedScenarioId, setSelectedScenarioId] =
    useState<string>("gas-supply-storage");
  const [configOpen, setConfigOpen] = useState(false);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [scenarioOverrides, setScenarioOverrides] = useState<
    Record<string, Partial<ScenarioConfig>>
  >({});
  const [scenarioList, setScenarioList] = useState<Scenario[]>(seedScenarios);
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
        if (s.scenarioList) setScenarioList(s.scenarioList);
        setSavedSnap(raw);
      } else {
        setSavedSnap(
          JSON.stringify({
            config: defaultConfig,
            scenarioOverrides: {},
            scenarioList: seedScenarios,
          }),
        );
      }
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  const rankedCounterparties = useMemo(() => {
    return seedCounterparties
      .map((cp) => {
        const fit = fitScore(cp, config.weights);
        const belowTarget = cp.annualVolume < config.rules.targetVolume;
        const belowHurdle = fit < config.rules.fitMid;
        const rejected =
          cp.margin < config.rules.returnGate || belowTarget || belowHurdle;
        return { ...cp, fit, rejected, belowTarget, belowHurdle };
      })
      .sort((a, b) => b.fit - a.fit);
  }, [config]);

  const setScenarioOverride = (id: string, partial: Partial<ScenarioConfig>) =>
    setScenarioOverrides((p) => {
      const prev = p[id] ?? {};
      return {
        ...p,
        [id]: {
          weights: { ...prev.weights, ...partial.weights },
          thresholds: { ...prev.thresholds, ...partial.thresholds },
          rules: { ...prev.rules, ...partial.rules },
        },
      };
    });
  const clearScenarioOverride = (id: string) =>
    setScenarioOverrides((p) => {
      const n = { ...p };
      delete n[id];
      return n;
    });
  const resolvedScenarioConfig = (id: string) =>
    inheritConfig(config, scenarioOverrides[id]);

  const addScenario = (title: string) => {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const id = base ? `${base}-${Date.now().toString(36)}` : `scenario-${Date.now().toString(36)}`;
    setScenarioList((l) => [
      ...l,
      {
        id,
        title: title || "New scenario",
        description: "",
        criteria: { ...config.weights },
      },
    ]);
    return id;
  };
  const renameScenario = (id: string, title: string) =>
    setScenarioList((l) => l.map((s) => (s.id === id ? { ...s, title } : s)));

  const currentSnap = JSON.stringify({ config, scenarioOverrides, scenarioList });
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
    counterparties: seedCounterparties,
    rankedCounterparties,
    decisions,
    recordDecision: (id, d) => setDecisions((p) => ({ ...p, [id]: d })),
    scenarioOverrides,
    setScenarioOverride,
    clearScenarioOverride,
    resolvedScenarioConfig,
    dirty,
    saveAll,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export type { Decision };
