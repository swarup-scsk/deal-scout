import { createFileRoute } from "@tanstack/react-router";
import { Check, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dataField, type EffectiveSub, type RuleThresholds } from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/scenarios")({
  head: () => ({
    meta: [
      { title: "Scenario configuration - SEE Origination Scout" },
      {
        name: "description",
        content: "Compose a scenario from the criteria library.",
      },
    ],
  }),
  component: ScenarioConfig,
});

function ScenarioConfig() {
  const {
    scenarios,
    selectedScenarioId,
    setSelectedScenarioId,
    resolveScenario,
    setScenarioCritOverride,
    setScenarioSubOverride,
    resetScenarioCriterion,
    isScenarioCriterionCustomised,
    dirty,
    saveAll,
  } = useStore();

  const scenarioId = selectedScenarioId;
  const criteria = resolveScenario(scenarioId);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Scenario configuration
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose which criteria and sub-criteria apply, set criterion weights, and
            tweak values for this scenario. Changes override the library.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Configuring
          </span>
          <Select value={scenarioId} onValueChange={setSelectedScenarioId}>
            <SelectTrigger className="h-10 w-64 border-primary bg-primary/5 font-semibold text-foreground ring-1 ring-primary/20">
              <SlidersHorizontal className="mr-2 h-4 w-4 text-primary" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {scenarios.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {dirty ? (
            <Button onClick={saveAll}>Save all</Button>
          ) : (
            <span className="flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-2 text-xs font-medium text-success">
              <Check className="h-3.5 w-3.5" /> All changes saved
            </span>
          )}
        </div>
      </div>

      {criteria.map((c) => {
        const custom = isScenarioCriterionCustomised(scenarioId, c.id);
        return (
          <Card key={c.id} className="overflow-hidden p-0">
            <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
              <Switch
                checked={c.enabled}
                onCheckedChange={(v) =>
                  setScenarioCritOverride(scenarioId, c.id, { enabled: v })
                }
              />
              <span className="font-medium text-foreground">{c.label}</span>
              {c.blocking && (
                <Badge variant="destructive" className="text-[10px]">
                  blocking
                </Badge>
              )}
              {custom && (
                <span className="rounded-full bg-brand-blue/10 px-2 py-0.5 text-[10px] font-medium text-brand-blue">
                  customised
                </span>
              )}
              <div className="ml-auto flex items-center gap-3">
                <span className="text-xs text-muted-foreground">weight</span>
                <Slider
                  className="w-28"
                  min={1}
                  max={5}
                  step={1}
                  disabled={!c.enabled}
                  value={[c.weight]}
                  onValueChange={(v) =>
                    setScenarioCritOverride(scenarioId, c.id, { weight: v[0] })
                  }
                />
                <span className="w-4 text-sm font-medium">{c.weight}</span>
                {custom && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => resetScenarioCriterion(scenarioId, c.id)}
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
                  </Button>
                )}
              </div>
            </div>

            {c.enabled && (
              <ul className="divide-y divide-border">
                {c.subCriteria.map((s) => (
                  <SubRow
                    key={s.id}
                    scenarioId={scenarioId}
                    critId={c.id}
                    sub={s}
                    setSubOverride={setScenarioSubOverride}
                  />
                ))}
              </ul>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function SubRow({
  scenarioId,
  critId,
  sub,
  setSubOverride,
}: {
  scenarioId: string;
  critId: string;
  sub: EffectiveSub;
  setSubOverride: (
    scenarioId: string,
    critId: string,
    subId: string,
    patch: { enabled?: boolean; weight?: number; thresholds?: RuleThresholds },
  ) => void;
}) {
  const fld = dataField(sub.dataField);
  const graded = sub.ruleType === "graded-min" || sub.ruleType === "graded-max";
  const gate = sub.ruleType === "gate-min" || sub.ruleType === "gate-max";
  const between = sub.ruleType === "between";
  const setTh = (p: Partial<RuleThresholds>) =>
    setSubOverride(scenarioId, critId, sub.id, {
      thresholds: { ...sub.thresholds, ...p },
    });

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <Switch
          checked={sub.enabled}
          onCheckedChange={(v) =>
            setSubOverride(scenarioId, critId, sub.id, { enabled: v })
          }
        />
        <span className="text-sm text-foreground">{sub.label}</span>
        <span className="text-xs text-muted-foreground">
          {fld?.label} · {sub.ruleType}
        </span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-muted-foreground">importance</span>
          <Slider
            className="w-24"
            min={1}
            max={5}
            step={1}
            disabled={!sub.enabled}
            value={[sub.weight]}
            onValueChange={(v) =>
              setSubOverride(scenarioId, critId, sub.id, { weight: v[0] })
            }
          />
          <span className="w-4 text-sm font-medium">{sub.weight}</span>
        </div>
      </div>

      {sub.enabled && (graded || gate || between) && (
        <div className="mt-2 flex flex-wrap items-end gap-4 pl-11">
          {graded && (
            <>
              <NumField
                label="Score 0 at"
                value={sub.thresholds.floor ?? 0}
                onChange={(v) => setTh({ floor: v })}
              />
              <NumField
                label="Score 100 at"
                value={sub.thresholds.ceiling ?? 0}
                onChange={(v) => setTh({ ceiling: v })}
              />
            </>
          )}
          {gate && (
            <NumField
              label="Threshold"
              value={sub.thresholds.t ?? 0}
              onChange={(v) => setTh({ t: v })}
            />
          )}
          {between && (
            <>
              <NumField
                label="Low"
                value={sub.thresholds.x ?? 0}
                onChange={(v) => setTh({ x: v })}
              />
              <NumField
                label="High"
                value={sub.thresholds.y ?? 0}
                onChange={(v) => setTh({ y: v })}
              />
            </>
          )}
          {fld?.unit && (
            <span className="pb-2 text-[11px] text-muted-foreground">
              {fld.unit}
            </span>
          )}
        </div>
      )}
    </li>
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
      <Label className="mb-1 block text-[11px] text-muted-foreground">
        {label}
      </Label>
      <Input
        className="h-8 w-28 text-sm"
        value={String(value)}
        onChange={(e) =>
          onChange(Number(e.target.value.replace(/[^0-9.]/g, "")) || 0)
        }
      />
    </div>
  );
}
