import { useState } from "react";
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

function Library() {
  const {
    criteriaLibrary,
    addLibraryCriterion,
    updateLibraryCriterion,
    deleteLibraryCriterion,
    addSubCriterion,
    role,
    setRole,
    dirty,
    saveAll,
  } = useStore();
  const isAdmin = role === "Admin";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Criteria library
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin
              ? "The shared definitions. Each sub-criterion holds its scoring logic and default importance. Originators reuse and tune these per scenario."
              : "Read-only view. Switch to Admin to make changes."}
          </p>
        </div>
        <div className="flex items-center gap-3">
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

      {criteriaLibrary.map((crit) => (
        <Card key={crit.id} className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
            <Input
              value={crit.label}
              readOnly={!isAdmin}
              className={`max-w-xs font-medium ${!isAdmin ? "bg-muted/40" : ""}`}
              onChange={(e) =>
                updateLibraryCriterion(crit.id, { label: e.target.value })
              }
            />
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Switch
                checked={crit.blocking}
                disabled={!isAdmin}
                onCheckedChange={(v) =>
                  updateLibraryCriterion(crit.id, { blocking: v })
                }
              />
              Blocking criterion
            </label>
            <span className="ml-auto text-xs text-muted-foreground">
              {crit.subCriteria.length} sub-criteria
            </span>
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => deleteLibraryCriterion(crit.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="px-4 py-3">
            <Input
              value={crit.description ?? ""}
              readOnly={!isAdmin}
              placeholder="What this criterion measures"
              className={`text-sm ${!isAdmin ? "bg-muted/40" : ""}`}
              onChange={(e) =>
                updateLibraryCriterion(crit.id, { description: e.target.value })
              }
            />
          </div>

          <div className="space-y-3 border-t border-border bg-muted/20 px-4 py-4">
            {crit.subCriteria.map((sub) => (
              <SubEditor
                key={sub.id}
                crit={crit}
                sub={sub}
                isAdmin={isAdmin}
              />
            ))}
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => addSubCriterion(crit.id)}
              >
                <Plus className="mr-1.5 h-4 w-4" /> Add sub-criterion
              </Button>
            )}
          </div>
        </Card>
      ))}

      {isAdmin && (
        <Button variant="outline" onClick={() => addLibraryCriterion()}>
          <Plus className="mr-2 h-4 w-4" /> Add criterion
        </Button>
      )}
    </div>
  );
}

function SubEditor({
  crit,
  sub,
  isAdmin,
}: {
  crit: LibraryCriterion;
  sub: SubCriterion;
  isAdmin: boolean;
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
  const lo = Math.min(sub.thresholds.floor ?? 0, sub.thresholds.ceiling ?? 0);
  const hi = Math.max(sub.thresholds.floor ?? 0, sub.thresholds.ceiling ?? 0);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Input
          value={sub.label}
          readOnly={!isAdmin}
          className={`max-w-xs font-medium ${!isAdmin ? "bg-muted/40" : ""}`}
          onChange={(e) => patch({ label: e.target.value })}
        />
        <span className="ml-auto rounded-full bg-brand-blue/10 px-2.5 py-1 text-xs font-medium text-brand-blue">
          sub-score {ps}
        </span>
        {isAdmin && (
          <button
            type="button"
            onClick={() => deleteSubCriterion(crit.id, sub.id)}
            className="text-muted-foreground hover:text-destructive"
            aria-label="Delete sub-criterion"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mb-3 flex items-center gap-3">
        <Label className="w-28 text-xs text-muted-foreground">Data field</Label>
        <Select
          value={sub.dataField}
          onValueChange={(v) => patch({ dataField: v })}
          disabled={!isAdmin}
        >
          <SelectTrigger className="flex-1">
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
        <span className="whitespace-nowrap text-[11px] text-muted-foreground">
          {fld?.unit} · {fld?.source}
        </span>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <Label className="w-28 text-xs text-muted-foreground">Scoring rule</Label>
        <Select
          value={sub.ruleType}
          onValueChange={(v) => patch({ ruleType: v as RuleType })}
          disabled={!isAdmin}
        >
          <SelectTrigger className="flex-1">
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
      </div>

      {/* Scoring band */}
      <div className="relative mb-3 h-11 overflow-hidden rounded-md border border-border bg-muted/40">
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
        <span className="absolute bottom-1 left-1.5 text-[11px] text-muted-foreground">
          0
        </span>
        <span className="absolute bottom-1 right-1.5 text-[11px] text-muted-foreground">
          100 score
        </span>
      </div>

      {/* Threshold controls per rule type */}
      {graded && (
        <div className="mb-3 grid grid-cols-2 gap-3">
          <ThSlider
            label="Score 0 at or below"
            value={sub.thresholds.floor ?? 0}
            max={fmax}
            disabled={!isAdmin}
            onChange={(v) => setTh({ floor: v })}
          />
          <ThSlider
            label="Score 100 at or above"
            value={sub.thresholds.ceiling ?? fmax}
            max={fmax}
            disabled={!isAdmin}
            onChange={(v) => setTh({ ceiling: v })}
          />
        </div>
      )}
      {gate && (
        <div className="mb-3 max-w-xs">
          <ThSlider
            label="Threshold"
            value={sub.thresholds.t ?? 0}
            max={fmax}
            disabled={!isAdmin}
            onChange={(v) => setTh({ t: v })}
          />
        </div>
      )}
      {sub.ruleType === "between" && (
        <div className="mb-3 grid grid-cols-2 gap-3">
          <ThSlider
            label="Low"
            value={sub.thresholds.x ?? 0}
            max={fmax}
            disabled={!isAdmin}
            onChange={(v) => setTh({ x: v })}
          />
          <ThSlider
            label="High"
            value={sub.thresholds.y ?? fmax}
            max={fmax}
            disabled={!isAdmin}
            onChange={(v) => setTh({ y: v })}
          />
        </div>
      )}

      <div className="mb-3 flex items-center gap-3 border-t border-border pt-3">
        <Label className="w-28 text-xs text-muted-foreground">Importance</Label>
        <Slider
          className="flex-1"
          min={1}
          max={5}
          step={1}
          disabled={!isAdmin}
          value={[sub.weight]}
          onValueChange={(v) => patch({ weight: v[0] })}
        />
        <span className="w-4 text-sm font-medium">{sub.weight}</span>
      </div>

      <div className="mb-3">
        <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Safeguards
        </div>
        <div className="grid grid-cols-3 gap-3">
          <SafeSelect
            label="Direction"
            value={sub.direction}
            disabled={!isAdmin}
            onChange={(v) => patch({ direction: v as SubCriterion["direction"] })}
            options={[
              { v: "higher", l: "higher is better" },
              { v: "lower", l: "a gap scores higher" },
            ]}
          />
          <SafeSelect
            label="If missing"
            value={sub.missing}
            disabled={!isAdmin}
            onChange={(v) => patch({ missing: v as SubCriterion["missing"] })}
            options={[
              { v: "zero", l: "score 0" },
              { v: "skip", l: "skip" },
              { v: "block", l: "block" },
            ]}
          />
          <SafeSelect
            label="Blocking"
            value={sub.blocking ? "yes" : "no"}
            disabled={!isAdmin}
            onChange={(v) => patch({ blocking: v === "yes" })}
            options={[
              { v: "no", l: "never" },
              { v: "yes", l: "block if 0" },
            ]}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2">
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
  );
}

function ThSlider({
  label,
  value,
  max,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  disabled?: boolean;
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
          disabled={disabled}
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

function SafeSelect({
  label,
  value,
  disabled,
  onChange,
  options,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <label className="text-[11px] text-muted-foreground">
      {label}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="mt-1 h-9">
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
    </label>
  );
}
