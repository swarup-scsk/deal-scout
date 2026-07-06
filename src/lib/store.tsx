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
  scenarios,
  type Config,
  type Counterparty,
  type ScenarioConfig,
} from "./data";

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
  scenarios: typeof scenarios;
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
  resolvedScenarioConfig: (id: string) => ScenarioConfig;
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
  const [hydrated, setHydrated] = useState(false);

  // Hydrate saved config from the browser after mount (SSR-safe).
  useEffect(() => {
    try {
      const c = localStorage.getItem("deal-scout.config");
      if (c) setConfig(JSON.parse(c));
      const o = localStorage.getItem("deal-scout.scenarioOverrides");
      if (o) setScenarioOverrides(JSON.parse(o));
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  // Persist config once hydrated.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("deal-scout.config", JSON.stringify(config));
      localStorage.setItem(
        "deal-scout.scenarioOverrides",
        JSON.stringify(scenarioOverrides),
      );
    } catch {
      // ignore quota errors
    }
  }, [config, scenarioOverrides, hydrated]);

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
  const resolvedScenarioConfig = (id: string) =>
    inheritConfig(config, scenarioOverrides[id]);

  const value: StoreValue = {
    config,
    setConfig,
    selectedScenarioId,
    setSelectedScenarioId,
    configOpen,
    setConfigOpen,
    scenarioOverrides,
    setScenarioOverride,
    resolvedScenarioConfig,
    scenarios,
    counterparties: seedCounterparties,
    rankedCounterparties,
    decisions,
    recordDecision: (id, d) => setDecisions((p) => ({ ...p, [id]: d })),
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export type { Decision };
