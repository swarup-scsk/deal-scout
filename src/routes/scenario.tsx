import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  CRITERIA,
  type Config,
  type CriteriaKey,
  type ScenarioConfig,
} from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/scenario")({
  head: () => ({
    meta: [
      { title: "Configure scenarios — SEE Origination Scout" },
      {
        name: "description",
        content: "Configure origination scenarios and their scoring rules.",
      },
    ],
  }),
  component: ConfigureScenarios,
});

function WeightSliders({
  weights,
  onChange,
}: {
  weights: Record<CriteriaKey, number>;
  onChange: (k: CriteriaKey, v: number) => void;
}) {
  return (
    <div className="space-y-1">
      {CRITERIA.map((c) => (
        <div key={c.key} className="flex items-center gap-3 py-1">
          <span className="w-40 text-sm text-muted-foreground">{c.label}</span>
          <Slider
            className="flex-1"
            min={1}
            max={5}
            step={1}
            value={[weights[c.key]]}
            onValueChange={(v) => onChange(c.key, v[0])}
          />
          <span className="w-4 text-right text-sm font-medium">
            {weights[c.key]}
          </span>
        </div>
      ))}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label className="mb-1 block text-xs text-muted-foreground">{label}</Label>
      <Input
        value={String(value)}
        onChange={(e) =>
          onChange(Number(e.target.value.replace(/[^0-9.]/g, "")) || 0)
        }
      />
    </div>
  );
}

function RulesEditor({
  rules,
  thresholds,
  onRule,
  onThreshold,
}: {
  rules: Config["rules"];
  thresholds: Config["thresholds"];
  onRule: (field: keyof Config["rules"], v: number) => void;
  onThreshold: (field: keyof Config["thresholds"], v: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <NumField
        label="Minimum volume (GWh/yr)"
        value={rules.targetVolume}
        onChange={(v) => onRule("targetVolume", v)}
      />
      <NumField
        label="Minimum margin (EUR)"
        value={rules.returnGate}
        onChange={(v) => onRule("returnGate", v)}
      />
      <NumField
        label="Strong score at or above"
        value={thresholds.green}
        onChange={(v) => onThreshold("green", v)}
      />
      <NumField
        label="Borderline score at or above"
        value={thresholds.amber}
        onChange={(v) => onThreshold("amber", v)}
      />
    </div>
  );
}

function ConfigureScenarios() {
  const {
    config,
    setConfig,
    scenarios,
    addScenario,
    renameScenario,
    setScenarioOverride,
    clearScenarioOverride,
    resolvedScenarioConfig,
    setSelectedScenarioId,
    dirty,
    saveAll,
  } = useStore();
  const navigate = useNavigate();
  const [globalOpen, setGlobalOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(scenarios[0]?.id ?? null);

  const globalCfg: ScenarioConfig = {
    weights: config.weights,
    thresholds: config.thresholds,
    rules: config.rules,
  };
  const isCustom = (id: string) =>
    JSON.stringify(resolvedScenarioConfig(id)) !== JSON.stringify(globalCfg);

  const open = (id: string) => {
    setSelectedScenarioId(id);
    saveAll();
    navigate({ to: "/prospecting", search: { scenario: id } });
  };

  const setGWeight = (k: CriteriaKey, v: number) =>
    setConfig({ ...config, weights: { ...config.weights, [k]: v } });
  const setGRule = (field: keyof Config["rules"], v: number) =>
    setConfig({ ...config, rules: { ...config.rules, [field]: v } });
  const setGThreshold = (field: keyof Config["thresholds"], v: number) =>
    setConfig({ ...config, thresholds: { ...config.thresholds, [field]: v } });

  const setSWeight = (id: string, k: CriteriaKey, v: number) => {
    const cur = resolvedScenarioConfig(id);
    setScenarioOverride(id, { weights: { ...cur.weights, [k]: v } });
  };
  const setSRule = (id: string, field: keyof Config["rules"], v: number) => {
    const cur = resolvedScenarioConfig(id);
    setScenarioOverride(id, { rules: { ...cur.rules, [field]: v } });
  };
  const setSThreshold = (
    id: string,
    field: keyof Config["thresholds"],
    v: number,
  ) => {
    const cur = resolvedScenarioConfig(id);
    setScenarioOverride(id, { thresholds: { ...cur.thresholds, [field]: v } });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Configure scenarios
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set the baseline, tune each deal type, then open one to prospect.
          </p>
        </div>
        <Button onClick={saveAll} disabled={!dirty}>
          {dirty ? "Save all" : "All changes saved"}
        </Button>
      </div>

      <Card className="p-0">
        <button
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
          onClick={() => setGlobalOpen((v) => !v)}
        >
          <span className="flex items-center gap-2">
            {globalOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <span>
              <span className="block text-sm font-semibold text-foreground">
                Global configuration
              </span>
              <span className="block text-xs text-muted-foreground">
                Baseline applied to every scenario
              </span>
            </span>
          </span>
          <span className="text-xs text-muted-foreground">
            {config.scope.commodity} · {config.scope.region} ·{" "}
            {config.scope.hub}
          </span>
        </button>
        {globalOpen && (
          <div className="space-y-4 border-t border-border px-4 py-4">
            <div>
              <div className="mb-1 text-xs font-semibold text-muted-foreground">
                What matters most
              </div>
              <WeightSliders weights={config.weights} onChange={setGWeight} />
            </div>
            <div>
              <div className="mb-2 text-xs font-semibold text-muted-foreground">
                Rules
              </div>
              <RulesEditor
                rules={config.rules}
                thresholds={config.thresholds}
                onRule={setGRule}
                onThreshold={setGThreshold}
              />
            </div>
            <div>
              <div className="mb-2 text-xs font-semibold text-muted-foreground">
                Market scope
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="mb-1 block text-xs text-muted-foreground">
                    Commodity
                  </Label>
                  <Input
                    value={config.scope.commodity}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        scope: { ...config.scope, commodity: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-muted-foreground">
                    Region
                  </Label>
                  <Input
                    value={config.scope.region}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        scope: { ...config.scope, region: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-muted-foreground">
                    Hub
                  </Label>
                  <Input
                    value={config.scope.hub}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        scope: { ...config.scope, hub: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground">
          Scenarios
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpenId(addScenario("New scenario"))}
        >
          <Plus className="mr-2 h-4 w-4" /> Add scenario
        </Button>
      </div>

      <div className="space-y-3">
        {scenarios.map((s) => {
          const isOpen = openId === s.id;
          const cfg = resolvedScenarioConfig(s.id);
          const custom = isCustom(s.id);
          return (
            <Card
              key={s.id}
              className={`p-0 ${isOpen ? "border-primary/40" : ""}`}
            >
              <div
                className={`flex items-center justify-between gap-2 px-4 py-3 ${
                  isOpen ? "bg-primary/5" : ""
                }`}
              >
                <button
                  className="flex flex-1 items-center gap-2 text-left"
                  onClick={() => setOpenId(isOpen ? null : s.id)}
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium text-foreground">
                    {s.title}
                  </span>
                  <Badge variant={custom ? "default" : "secondary"}>
                    {custom ? "Customised" : "Default"}
                  </Badge>
                </button>
                {!isOpen && (
                  <Button size="sm" variant="outline" onClick={() => open(s.id)}>
                    Open <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>

              {isOpen && (
                <div className="space-y-4 border-t border-border px-4 py-4">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">
                      Scenario name
                    </Label>
                    <Input
                      value={s.title}
                      onChange={(e) => renameScenario(s.id, e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-semibold text-muted-foreground">
                      What matters most
                    </div>
                    <WeightSliders
                      weights={cfg.weights}
                      onChange={(k, v) => setSWeight(s.id, k, v)}
                    />
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-semibold text-muted-foreground">
                      Rules
                    </div>
                    <RulesEditor
                      rules={cfg.rules}
                      thresholds={cfg.thresholds}
                      onRule={(f, v) => setSRule(s.id, f, v)}
                      onThreshold={(f, v) => setSThreshold(s.id, f, v)}
                    />
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearScenarioOverride(s.id)}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" /> Reset to defaults
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={saveAll}>
                        Save
                      </Button>
                      <Button size="sm" onClick={() => open(s.id)}>
                        Open <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
