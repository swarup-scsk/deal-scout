import { useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  DATA_FIELDS,
  RULE_TYPES,
  dataField,
  subScore,
  type LibraryCriterion,
  type RuleType,
  type SubCriterion,
} from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Criteria library - SEE Origination Scout" },
      {
        name: "description",
        content: "Admin library of scoring criteria and sub-criteria.",
      },
    ],
  }),
  component: Library,
});

const FIELD_MAX: Record<string, number> = {
  netDebt: 1500,
  netAssets: 1200,
  revenue: 3000,
  creditRating: 100,
  headcount: 2000,
  memberships: 10,
  annualVolume: 6000,
};
const fieldMax = (key: string) => FIELD_MAX[key] ?? 100;

// Inline, low-chrome text field for names (no boxed 1990s look).
const inlineInput =
  "h-9 border-transparent bg-transparent px-2 shadow-none hover:bg-muted/50 focus-visible:bg-card";

function Library() {
  const {
    criteriaLibrary,
    addLibraryCriterion,
    updateLibraryCriterion,
    deleteLibraryCriterion,
    addSubCriterion,
    dirty,
    saveAll,
  } = useStore();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Criteria library
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            The shared definitions. Each sub-criterion holds its scoring logic and
            default importance. Originators reuse and tune these per scenario.
          </p>
        </div>
        {dirty ? (
          <Button onClick={saveAll}>Save all</Button>
        ) : (
          <span className="flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-2 text-xs font-medium text-success">
            <Check className="h-3.5 w-3.5" /> All changes saved
          </span>
        )}
      </div>

      {criteriaLibrary.map((crit) => (
        <Card key={crit.id} className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3">
            <Input
              value={crit.label}
              className={`${inlineInput} max-w-xs text-base font-semibold`}
              onChange={(e) =>
                updateLibraryCriterion(crit.id, { label: e.target.value })
              }
            />
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Switch
                checked={crit.blocking}
                onCheckedChange={(v) =>
                  updateLibraryCriterion(crit.id, { blocking: v })
                }
              />
              Blocking
            </label>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {crit.subCriteria.length} sub-criteria
              </span>
              <button
                type="button"
                onClick={() => deleteLibraryCriterion(crit.id)}
                className="text-muted-foreground transition-colors hover:text-destructive"
                aria-label="Delete criterion"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="px-4 pb-3">
            <Input
              value={crit.description ?? ""}
              placeholder="What this criterion measures"
              className={`${inlineInput} w-full text-sm text-muted-foreground`}
              onChange={(e) =>
                updateLibraryCriterion(crit.id, { description: e.target.value })
              }
            />
          </div>

          <div className="space-y-3 border-t border-border bg-muted/20 p-4">
            {crit.subCriteria.map((sub) => (
              <SubEditor key={sub.id} crit={crit} sub={sub} />
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addSubCriterion(crit.id)}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add sub-criterion
            </Button>
          </div>
        </Card>
      ))}

      <Button variant="outline" onClick={() => addLibraryCriterion()}>
        <Plus className="mr-2 h-4 w-4" /> Add criterion
      </Button>
    </div>
  );
}

function SubEditor({
  crit,
  sub,
}: {
  crit: LibraryCriterion;
  sub: SubCriterion;
}) {
  const { updateSubCriterion, deleteSubCriterion } = useStore();
  const fmax = fieldMax(sub.dataField);
  const [preview, setPreview] = useState<number>(
    sub.thresholds.ceiling ?? sub.thresholds.t ?? Math.round(fmax / 3),
  );
  const fld = dataField(sub.dataField);

  const patch = (p: Partial<Omit<SubCriterion, "id">>) =>
    updateSubCriterion(crit.id, sub.id, p);
  const setTh = (p: Partial<SubCriterion["thresholds"]>) =>
    patch({ thresholds: { ...sub.thresholds, ...p } });

  const pct = (v: number) => Math.max(0, Math.min(100, (v / fmax) * 100));
  const ps = subScore(sub.ruleType, preview, sub.thresholds);
  const graded = sub.ruleType === "graded-min" || sub.ruleType === "graded-max";
  const gate = sub.ruleType === "gate-min" || sub.ruleType === "gate-max";
  const between = sub.ruleType === "between";
  const lo = Math.min(sub.thresholds.floor ?? 0, sub.thresholds.ceiling ?? 0);
  const hi = Math.max(sub.thresholds.floor ?? 0, sub.thresholds.ceiling ?? 0);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <Input
          value={sub.label}
          className={`${inlineInput} max-w-xs text-sm font-semibold`}
          onChange={(e) => patch({ label: e.target.value })}
        />
        <span className="ml-auto rounded-full bg-brand-blue/10 px-2.5 py-1 text-xs font-medium text-brand-blue">
          sub-score {ps}
        </span>
        <button
          type="button"
          onClick={() => deleteSubCriterion(crit.id, sub.id)}
          className="text-muted-foreground transition-colors hover:text-destructive"
          aria-label="Delete sub-criterion"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Data + rule side by side, constrained width */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Data field" hint={`${fld?.unit ?? ""} · ${fld?.source ?? ""}`}>
          <Select value={sub.dataField} onValueChange={(v) => patch({ dataField: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATA_FIELDS.map((f) => (
                <SelectItem key={f.key} value={f.key}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Scoring rule">
          <Select
            value={sub.ruleType}
            onValueChange={(v) => patch({ ruleType: v as RuleType })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RULE_TYPES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      {/* Scoring band */}
      <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
        <div className="relative h-10 overflow-hidden rounded-md border border-border bg-card">
          {graded && (
            <div
              className="absolute inset-y-0 bg-brand-blue/15"
              style={{ left: `${pct(lo)}%`, width: `${pct(hi) - pct(lo)}%` }}
            />
          )}
          {gate && (
            <div
              className="absolute inset-y-0 w-0.5 bg-warning"
              style={{ left: `${pct(sub.thresholds.t ?? 0)}%` }}
            />
          )}
          <div
            className="absolute inset-y-0 w-0.5 bg-foreground"
            style={{ left: `${pct(preview)}%` }}
          />
          <span
            className="absolute top-1 -translate-x-1/2 text-[11px] font-medium text-foreground"
            style={{ left: `${pct(preview)}%` }}
          >
            {preview}
          </span>
          <span className="absolute bottom-1 left-2 text-[11px] text-muted-foreground">
            0
          </span>
          <span className="absolute bottom-1 right-2 text-[11px] text-muted-foreground">
            100 score
          </span>
        </div>

        {graded && (
          <div className="mt-3 grid grid-cols-2 gap-4">
            <ThSlider
              label="Score 0 at or below"
              value={sub.thresholds.floor ?? 0}
              max={fmax}
              onChange={(v) => setTh({ floor: v })}
            />
            <ThSlider
              label="Score 100 at or above"
              value={sub.thresholds.ceiling ?? fmax}
              max={fmax}
              onChange={(v) => setTh({ ceiling: v })}
            />
          </div>
        )}
        {gate && (
          <div className="mt-3 max-w-xs">
            <ThSlider
              label="Threshold"
              value={sub.thresholds.t ?? 0}
              max={fmax}
              onChange={(v) => setTh({ t: v })}
            />
          </div>
        )}
        {between && (
          <div className="mt-3 grid grid-cols-2 gap-4">
            <ThSlider
              label="Low"
              value={sub.thresholds.x ?? 0}
              max={fmax}
              onChange={(v) => setTh({ x: v })}
            />
            <ThSlider
              label="High"
              value={sub.thresholds.y ?? fmax}
              max={fmax}
              onChange={(v) => setTh({ y: v })}
            />
          </div>
        )}

        <div className="mt-3 flex items-center gap-3 border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">Preview a value</span>
          <Slider
            className="flex-1"
            min={0}
            max={fmax}
            step={Math.max(1, Math.round(fmax / 100))}
            value={[preview]}
            onValueChange={(v) => setPreview(v[0])}
          />
          <span className="w-24 text-right text-sm font-medium">
            {preview} → {ps}
          </span>
        </div>
      </div>

      {/* Importance + safeguards in one compact row */}
      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        <Field label="Importance">
          <div className="flex items-center gap-3">
            <Slider
              className="flex-1"
              min={1}
              max={5}
              step={1}
              value={[sub.weight]}
              onValueChange={(v) => patch({ weight: v[0] })}
            />
            <span className="w-4 text-sm font-medium">{sub.weight}</span>
          </div>
        </Field>
        <Field label="Direction">
          <MiniSelect
            value={sub.direction}
            onChange={(v) => patch({ direction: v as SubCriterion["direction"] })}
            options={[
              { v: "higher", l: "higher is better" },
              { v: "lower", l: "a gap scores higher" },
            ]}
          />
        </Field>
        <Field label="If missing">
          <MiniSelect
            value={sub.missing}
            onChange={(v) => patch({ missing: v as SubCriterion["missing"] })}
            options={[
              { v: "zero", l: "score 0" },
              { v: "skip", l: "skip" },
              { v: "block", l: "block" },
            ]}
          />
        </Field>
        <Field label="Blocking">
          <MiniSelect
            value={sub.blocking ? "yes" : "no"}
            onChange={(v) => patch({ blocking: v === "yes" })}
            options={[
              { v: "no", l: "never" },
              { v: "yes", l: "block if 0" },
            ]}
          />
        </Field>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        {hint && hint.trim() !== "·" && (
          <span className="truncate text-[11px] text-muted-foreground/70">
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function ThSlider({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="text-xs text-muted-foreground">
      {label}
      <span className="mt-1.5 flex items-center gap-2">
        <Slider
          className="flex-1"
          min={0}
          max={max}
          step={Math.max(1, Math.round(max / 100))}
          value={[value]}
          onValueChange={(v) => onChange(v[0])}
        />
        <span className="w-14 text-right text-sm font-medium text-foreground">
          {value}
        </span>
      </span>
    </label>
  );
}

function MiniSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.v} value={o.v}>
            {o.l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
