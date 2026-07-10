import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PILLARS, type Config } from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/scenario")({
  head: () => ({
    meta: [
      { title: "Configure scenarios — SEE Origination Scout" },
      {
        name: "description",
        content: "Configure origination scenarios and their ranking criteria.",
      },
    ],
  }),
  component: ConfigureScenarios,
});

function NumField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <Label className="mb-1 block text-xs text-muted-foreground">{label}</Label>
      <Input
        value={String(value)}
        readOnly={disabled}
        onChange={(e) =>
          onChange(Number(e.target.value.replace(/[^0-9.]/g, "")) || 0)
        }
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
    setScenarioDescription,
    deleteScenario,
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
    setSelectedScenarioId,
    role,
    setRole,
    dirty,
    saveAll,
  } = useStore();
  const navigate = useNavigate();
  const isAdmin = role === "Admin";
  const [globalOpen, setGlobalOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(scenarios[0]?.id ?? null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const getWeight = (id: string, key: string) =>
    criterionWeights[id]?.[key] ?? 3;
  const isCustom = (id: string) =>
    (criterionWeights[id] && Object.keys(criterionWeights[id]).length > 0) ||
    !!scenarioOverrides[id];

  const open = (id: string) => {
    setSelectedScenarioId(id);
    saveAll();
    navigate({ to: "/prospecting", search: { scenario: id } });
  };

  const setGRule = (field: keyof Config["rules"], v: number) =>
    setConfig({ ...config, rules: { ...config.rules, [field]: v } });
  const setGThreshold = (field: keyof Config["thresholds"], v: number) =>
    setConfig({ ...config, thresholds: { ...config.thresholds, [field]: v } });
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Configure scenarios
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin
              ? "Set the criteria for each transaction type. Criteria drive ranking and act as search filters."
              : "Read-only. Switch to Admin to make changes."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Viewing as</span>
          <Select value={role} onValueChange={(v) => setRole(v as "Admin" | "User")}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="User">User</SelectItem>
            </SelectContent>
          </Select>
          {isAdmin && (
            <Button onClick={saveAll} disabled={!dirty}>
              {dirty ? "Save all" : "All changes saved"}
            </Button>
          )}
        </div>
      </div>

      {/* Global configuration (collapsed) */}
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
            {config.scope.commodity} · {config.scope.region} · {config.scope.hub}
          </span>
        </button>
        {globalOpen && (
          <div className="space-y-4 border-t border-border px-4 py-4">
            <div>
              <div className="mb-2 text-xs font-semibold text-muted-foreground">
                Rules
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <NumField
                  label="Min volume (GWh/yr)"
                  value={config.rules.targetVolume}
                  onChange={(v) => setGRule("targetVolume", v)}
                  disabled={!isAdmin}
                />
                <NumField
                  label="Min margin (EUR)"
                  value={config.rules.returnGate}
                  onChange={(v) => setGRule("returnGate", v)}
                  disabled={!isAdmin}
                />
                <NumField
                  label="Strong at or above"
                  value={config.thresholds.green}
                  onChange={(v) => setGThreshold("green", v)}
                  disabled={!isAdmin}
                />
                <NumField
                  label="Borderline at or above"
                  value={config.thresholds.amber}
                  onChange={(v) => setGThreshold("amber", v)}
                  disabled={!isAdmin}
                />
              </div>
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
                    readOnly={!isAdmin}
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
                    readOnly={!isAdmin}
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
                    readOnly={!isAdmin}
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

      {/* Pillars and their scenarios */}
      {PILLARS.map((pillar) => (
        <div key={pillar.id} className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-accent">
              {pillar.label}
            </span>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setOpenId(addScenario(pillar.id, "New transaction type"))
                }
              >
                <Plus className="mr-2 h-4 w-4" /> Add transaction type
              </Button>
            )}
          </div>

          {scenarios
            .filter((s) => s.pillar === pillar.id)
            .map((s) => {
              const isOpen = openId === s.id;
              const editing = isAdmin && editingId === s.id;
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
                      {s.testCase && <Badge>Test case</Badge>}
                      <Badge variant={custom ? "default" : "secondary"}>
                        {custom ? "Customised" : `${s.spec.length} criteria`}
                      </Badge>
                    </button>
                    <div className="flex items-center gap-2">
                      {isAdmin &&
                        (editing ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditingId(null)}
                          >
                            Done
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setOpenId(s.id);
                              setEditingId(s.id);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </Button>
                        ))}
                      <Button size="sm" variant="ghost" onClick={() => open(s.id)}>
                        Open <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="space-y-4 border-t border-border px-4 py-4">
                      {editing && (
                        <div>
                          <Label className="mb-1 block text-xs text-muted-foreground">
                            Transaction type name
                          </Label>
                          <Input
                            value={s.title}
                            onChange={(e) => renameScenario(s.id, e.target.value)}
                          />
                        </div>
                      )}

                      <div>
                        <div className="mb-1 text-xs font-semibold text-muted-foreground">
                          Description
                        </div>
                        {editing ? (
                          <Textarea
                            rows={2}
                            value={s.description ?? ""}
                            placeholder="What this transaction type is and when to use it"
                            onChange={(e) =>
                              setScenarioDescription(s.id, e.target.value)
                            }
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {s.description || "No description yet."}
                          </p>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-3 border-b border-border pb-1">
                          <span className="flex-1 text-xs font-semibold text-muted-foreground">
                            Criteria
                          </span>
                          <span className="w-[150px] text-xs font-semibold text-muted-foreground">
                            Weightage
                          </span>
                          <span className="w-4" />
                        </div>
                        {s.spec.length === 0 && (
                          <p className="py-2 text-sm text-muted-foreground">
                            No criteria defined yet.
                          </p>
                        )}
                        {s.spec.map((crit) => {
                          const desc =
                            criterionDescriptions[s.id]?.[crit.key] ?? crit.metric;
                          return (
                            <div
                              key={crit.key}
                              className="flex items-start gap-3 border-b border-border py-2 last:border-b-0"
                            >
                              <div className="flex-1">
                                <div className="text-sm text-foreground">
                                  {crit.label}
                                  {crit.inverse && (
                                    <span className="ml-2 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-medium text-warning">
                                      inverse
                                    </span>
                                  )}
                                  {crit.optional && (
                                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                      optional
                                    </span>
                                  )}
                                </div>
                                {editing ? (
                                  <Input
                                    className="mt-1 h-8 text-xs"
                                    value={desc}
                                    onChange={(e) =>
                                      setCriterionDescription(
                                        s.id,
                                        crit.key,
                                        e.target.value,
                                      )
                                    }
                                  />
                                ) : (
                                  <div className="text-[11px] text-muted-foreground">
                                    {desc}
                                  </div>
                                )}
                              </div>
                              <div className="w-[150px] pt-1">
                                <Slider
                                  min={1}
                                  max={5}
                                  step={1}
                                  disabled={!editing}
                                  value={[getWeight(s.id, crit.key)]}
                                  onValueChange={(v) =>
                                    setCriterionWeight(s.id, crit.key, v[0])
                                  }
                                />
                              </div>
                              <span className="w-4 pt-1 text-right text-sm font-medium">
                                {getWeight(s.id, crit.key)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div>
                        <div className="mb-2 text-xs font-semibold text-muted-foreground">
                          Rules (inherited from global, override here)
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {(
                            [
                              {
                                key: "targetVolume",
                                label: "Min volume (GWh/yr)",
                                value: cfg.rules.targetVolume,
                                set: (v: number) => setSRule(s.id, "targetVolume", v),
                              },
                              {
                                key: "returnGate",
                                label: "Min margin (EUR)",
                                value: cfg.rules.returnGate,
                                set: (v: number) => setSRule(s.id, "returnGate", v),
                              },
                              {
                                key: "green",
                                label: "Strong at or above",
                                value: cfg.thresholds.green,
                                set: (v: number) => setSThreshold(s.id, "green", v),
                              },
                              {
                                key: "amber",
                                label: "Borderline at or above",
                                value: cfg.thresholds.amber,
                                set: (v: number) => setSThreshold(s.id, "amber", v),
                              },
                            ] as const
                          ).map((rd) => {
                            const off = (disabledRules[s.id] ?? []).includes(rd.key);
                            return (
                              <div key={rd.key}>
                                <div className="mb-1 flex items-center justify-between gap-1">
                                  <Label className="text-xs text-muted-foreground">
                                    {rd.label}
                                  </Label>
                                  {editing && (
                                    <button
                                      type="button"
                                      onClick={() => toggleRuleDisabled(s.id, rd.key)}
                                      className="text-muted-foreground hover:text-foreground"
                                      aria-label={
                                        off ? `Restore ${rd.label}` : `Remove ${rd.label}`
                                      }
                                    >
                                      {off ? (
                                        <Plus className="h-3.5 w-3.5" />
                                      ) : (
                                        <X className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                  )}
                                </div>
                                {off ? (
                                  <div className="rounded-md border border-dashed border-border px-2 py-1.5 text-xs text-muted-foreground">
                                    Not applied
                                  </div>
                                ) : (
                                  <Input
                                    value={String(rd.value)}
                                    readOnly={!editing}
                                    onChange={(e) =>
                                      rd.set(
                                        Number(
                                          e.target.value.replace(/[^0-9.]/g, ""),
                                        ) || 0,
                                      )
                                    }
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {editing && (
                        <div className="flex items-center justify-between border-t border-border pt-3">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => clearScenarioOverride(s.id)}
                            >
                              <RefreshCw className="mr-2 h-4 w-4" /> Reset
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(s.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </Button>
                          </div>
                          <Button variant="outline" size="sm" onClick={saveAll}>
                            Save
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
        </div>
      ))}

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transaction type?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the transaction type and its saved configuration. Save
              all to persist the change. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  deleteScenario(deleteId);
                  if (openId === deleteId) setOpenId(null);
                  if (editingId === deleteId) setEditingId(null);
                }
                setDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
