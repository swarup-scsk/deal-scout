import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  counterparties as seedCounterparties,
  defaultConfig,
  fitScore,
  scenarios,
  type Config,
  type Counterparty,
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
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Config>(defaultConfig);
  const [selectedScenarioId, setSelectedScenarioId] =
    useState<string>("gas-supply-storage");
  const [configOpen, setConfigOpen] = useState(false);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});

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

  const value: StoreValue = {
    config,
    setConfig,
    selectedScenarioId,
    setSelectedScenarioId,
    configOpen,
    setConfigOpen,
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
