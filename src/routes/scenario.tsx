import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  RefreshCw,
  Settings2,
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
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
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
      <Label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <Input
        value={String(value)}
        readOnly={disabled}
        className={disabled ? "bg-muted/40" : ""}
        onChange={(e) =>
          onChange(Number(e.target.value.replace(/[^0-9.]/g, "")) || 0)
        }
      />
    </div>
  );
}

// Read-only importance indicator (1-5 dots).
function WeightDots({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`Importance ${value} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`h-1.5 w-1.5 rounded-full ${
            n <= value ? "bg-brand-blue" : "bg-border"
          }`}
        />
      ))}
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
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Configure scenarios
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin
              ? "Set the criteria for each transaction type. Criteria drive ranking and act as search filters."
              : "Read-only view. Switch to Admin to make changes."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Role segmented control */}
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Viewing as
            </span>
            <div className="flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5">
              {(["Admin", "User"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    role === r
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          {isAdmin &&
            (dirty ? (
              <Button onClick={saveAll}>Save all</Button>
            ) : (
              <span className="flex items-center gap-1.5 self-end rounded-lg bg-success/10 px-3 py-2 text-xs font-medium text-success">
                <Check className="h-3.5 w-3.5" /> All changes saved
              </span>
            ))}
        </div>
      </div>

      {/* Global configuration (collapsed) */}
      <Card className="overflow-hidden p-0">
        <button
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/40"
          onClick={() => setGlobalOpen((v) => !v)}
        >
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Settings2 className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-foreground">
                Global configuration
              </span>
              <span className="block text-xs text-muted-foreground">
                Baseline applied to every scenario
              </span>
            </span>
          </span>
          <span className="flex items-center gap-3">
            <span className="hidden rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground sm:inline">
              {config.scope.commodity} · {config.scope.region} ·{" "}
              {config.scope.hub}
            </span>
            {globalOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </span>
        </button>
        {globalOpen && (
          <div className="space-y-5 border-t border-border bg-muted/20 px-4 py-4">
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
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
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Market scope
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    { key: "commodity", label: "Commodity" },
                    { key: "region", label: "Region" },
                    { key: "hub", label: "Hub" },
                  ] as const
                ).map((f) => (
                  <div key={f.key}>
                    <Label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {f.label}
                    </Label>
                    <Input
                      value={config.scope[f.key]}
                      readOnly={!isAdmin}
                      className={!isAdmin ? "bg-muted/40" : ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          scope: { ...config.scope, [f.key]: e.target.value },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Pillars and their scenarios */}
      {PILLARS.map((pillar) => {
        const list = scenarios.filter((s) => s.pillar === pillar.id);
        return (
          <div key={pillar.id} className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  {pillar.label}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {list.length}
                </span>
              </div>
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

            {list.map((s) => {
              const isOpen = openId === s.id;
              const editing = isAdmin && editingId === s.id;
              const cfg = resolvedScenarioConfig(s.id);
              const custom = isCustom(s.id);
              return (
                <Card
                  key={s.id}
                  className={`overflow-hidden p-0 transition-all ${
                    isOpen
                      ? "border-brand-blue/40 shadow-sm ring-1 ring-brand-blue/20"
                      : "hover:border-brand-blue/30 hover:shadow-sm"
                  }`}
                >
                  <div
                    className={`flex items-center justify-between gap-2 px-4 py-3 transition-colors ${
                      isOpen ? "bg-brand-blue/5" : ""
                    }`}
                  >
                    <button
                      className="flex flex-1 items-center gap-2.5 text-left"
                      onClick={() => setOpenId(isOpen ? null : s.id)}
                    >
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-brand-blue" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="text-sm font-semibold text-foreground">
                        {s.title}
                      </span>
                      {s.testCase && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
                          Test case
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          custom
                            ? "bg-brand-blue/10 text-brand-blue"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {custom ? "Customised" : `${s.spec.length} criteria`}
                      </span>
                    </button>
                    <div className="flex items-center gap-2">
                      {isAdmin &&
                        (editing ? (
                          <Button
                            size="sm"
                            onClick={() => setEditingId(null)}
                          >
                            <Check className="mr-1.5 h-4 w-4" /> Done
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
                            <Pencil className="mr-1.5 h-4 w-4" /> Edit
                          </Button>
                        ))}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => open(s.id)}
                      >
                        Open <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="space-y-5 border-t border-border px-4 py-4">
                      {editing && (
                        <div>
                          <Label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Transaction type name
                          </Label>
                          <Input
                            value={s.title}
                            onChange={(e) =>
                              renameScenario(s.id, e.target.value)
                            }
                          />
                        </div>
                      )}

                      <div>
                        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
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
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {s.description || "No description yet."}
                          </p>
                        )}
                      </div>

                      {/* Criteria + weightage */}
                      <div className="overflow-hidden rounded-lg border border-border">
                        <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-3 py-2">
                          <span className="flex-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Criteria
                          </span>
                          <span className="w-[160px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Weightage
                          </span>
                        </div>
                        {s.spec.length === 0 && (
                          <p className="px-3 py-3 text-sm text-muted-foreground">
                            No criteria defined yet.
                          </p>
                        )}
                        {s.spec.map((crit) => {
                          const desc =
                            criterionDescriptions[s.id]?.[crit.key] ??
                            crit.metric;
                          const w = getWeight(s.id, crit.key);
                          return (
                            <div
                              key={crit.key}
                              className="flex items-start gap-3 border-b border-border px-3 py-2.5 last:border-b-0 hover:bg-muted/20"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                  {crit.label}
                                  {crit.inverse && (
                                    <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-medium text-warning">
                                      inverse
                                    </span>
                                  )}
                                  {crit.optional && (
                                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                      optional
                                    </span>
                                  )}
                                </div>
                                {editing ? (
                                  <Input
                                    className="mt-1.5 h-8 text-xs"
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
                                  <div className="mt-0.5 text-xs text-muted-foreground">
                                    {desc}
                                  </div>
                                )}
                              </div>
                              <div className="flex w-[160px] items-center gap-3 pt-0.5">
                                {editing ? (
                                  <Slider
                                    min={1}
                                    max={5}
                                    step={1}
                                    className="flex-1"
                                    value={[w]}
                                    onValueChange={(v) =>
                                      setCriterionWeight(s.id, crit.key, v[0])
                                    }
                                  />
                                ) : (
                                  <div className="flex-1">
                                    <WeightDots value={w} />
                                  </div>
                                )}
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-foreground">
                                  {w}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Rules */}
                      <div>
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Rules{" "}
                          <span className="font-normal normal-case tracking-normal text-muted-foreground/70">
                            (inherited from global, override here)
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {(
                            [
                              {
                                key: "targetVolume",
                                label: "Min volume (GWh/yr)",
                                value: cfg.rules.targetVolume,
                                set: (v: number) =>
                                  setSRule(s.id, "targetVolume", v),
                              },
                              {
                                key: "returnGate",
                                label: "Min margin (EUR)",
                                value: cfg.rules.returnGate,
                                set: (v: number) =>
                                  setSRule(s.id, "returnGate", v),
                              },
                              {
                                key: "green",
                                label: "Strong at or above",
                                value: cfg.thresholds.green,
                                set: (v: number) =>
                                  setSThreshold(s.id, "green", v),
                              },
                              {
                                key: "amber",
                                label: "Borderline at or above",
                                value: cfg.thresholds.amber,
                                set: (v: number) =>
                                  setSThreshold(s.id, "amber", v),
                              },
                            ] as const
                          ).map((rd) => {
                            const off = (disabledRules[s.id] ?? []).includes(
                              rd.key,
                            );
                            return (
                              <div key={rd.key}>
                                <div className="mb-1.5 flex items-center justify-between gap-1">
                                  <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                    {rd.label}
                                  </Label>
                                  {editing && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        toggleRuleDisabled(s.id, rd.key)
                                      }
                                      className="text-muted-foreground transition-colors hover:text-foreground"
                                      aria-label={
                                        off
                                          ? `Restore ${rd.label}`
                                          : `Remove ${rd.label}`
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
                                    className={!editing ? "bg-muted/40" : ""}
                                    onChange={(e) =>
                                      rd.set(
                                        Number(
                                          e.target.value.replace(
                                            /[^0-9.]/g,
                                            "",
                                          ),
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
        );
      })}

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transaction type?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the transaction type and its saved configuration.
              Save all to persist the change. This cannot be undone.
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
