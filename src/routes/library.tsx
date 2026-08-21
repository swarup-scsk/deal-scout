// Criteria Library: master-detail editor for scoring criteria, sub-criteria rules and importance.
import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  subScore,
  counterpartyFieldValue,
  type DataField,
  type Direction,
  type LibraryCriterion,
  type RuleType,
  type SubCriterion,
} from "@/lib/data";

type GetField = (k: string) => DataField | undefined;
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

// Sensible display ceilings per field (for the scoring curve axis and defaults).
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
const fmt = (n?: number) => (n ?? 0).toLocaleString();

// One rule select that names the whole behaviour (rule type + direction together).
const RULE_OPTIONS: {
  key: string;
  label: string;
  ruleType: RuleType;
  direction: Direction;
}[] = [
  { key: "higher", label: "Higher is better", ruleType: "graded-min", direction: "higher" },
  { key: "lower", label: "Lower is better (a gap scores higher)", ruleType: "graded-max", direction: "lower" },
  { key: "gate-min", label: "Pass / fail - at least", ruleType: "gate-min", direction: "higher" },
  { key: "gate-max", label: "Pass / fail - at most", ruleType: "gate-max", direction: "lower" },
  { key: "between", label: "In a range", ruleType: "between", direction: "higher" },
];
const ruleKeyOf = (s: SubCriterion) =>
  s.ruleType === "graded-min"
    ? "higher"
    : s.ruleType === "graded-max"
      ? "lower"
      : s.ruleType === "between"
        ? "between"
        : s.ruleType;

const MISSING_OPTS = [
  { v: "skip", l: "Skip - dropped, weights re-normalise" },
  { v: "zero", l: "Score 0 - counts as a full miss" },
  { v: "block", l: "Block - removes the counterparty" },
];

const THEME_ORDER = [
  "Financial strength",
  "Market access",
  "Volume",
  "Infrastructure",
  "Other",
];
function themeOf(c: LibraryCriterion): string {
  const s = `${c.id} ${c.label}`.toLowerCase();
  if (/balance|debt|asset|credit|margin|collateral|liquid|capital|working|facility|ebitda|financ/.test(s))
    return "Financial strength";
  if (/market access|efet|dma|broker|trading|exchange|clearing|permission|allocation|product|reg/.test(s))
    return "Market access";
  if (/volume|consumption|throughput|portfolio|auction|swing|flex/.test(s))
    return "Volume";
  if (/co-?location|grid|storage|transport|pipeline|infrastructure|ftr|ptr|capacity|site|connection/.test(s))
    return "Infrastructure";
  return "Other";
}

function ruleSummary(s: SubCriterion, getField: GetField): string {
  const fld = getField(s.dataField);
  if (!fld) return "No data field - not scoring";
  const unit = fld.unit ? ` ${fld.unit}` : "";
  const k = ruleKeyOf(s);
  if (k === "higher" || k === "lower")
    return `${fld.label} · ${k === "higher" ? "higher is better" : "lower is better"} · ${fmt(
      s.thresholds.floor ?? 0,
    )} → ${fmt(s.thresholds.ceiling ?? 0)}${unit}`;
  if (k === "gate-min") return `${fld.label} · pass at ${fmt(s.thresholds.t ?? 0)}+${unit}`;
  if (k === "gate-max") return `${fld.label} · pass at ${fmt(s.thresholds.t ?? 0)}${unit} or less`;
  return `${fld.label} · in ${fmt(s.thresholds.x ?? 0)} - ${fmt(s.thresholds.y ?? 0)}${unit}`;
}

type Status = { needsSetup: boolean; inactive: boolean; blocking: boolean; dup: boolean };
function critStatus(
  c: LibraryCriterion,
  usage: Record<string, number>,
  getField: GetField,
): Status {
  const valid = c.subCriteria.filter((s) => getField(s.dataField));
  const needsSetup = c.subCriteria.length === 0 || valid.length === 0;
  const inactive = !needsSetup && !valid.some((s) => s.enabled);
  const dup = c.subCriteria.some((s) => (usage[s.dataField] ?? 0) > 1 && !!getField(s.dataField));
  return { needsSetup, inactive, blocking: c.blocking, dup };
}

function Library() {
  const {
    criteriaLibrary,
    scenarios,
    rankedCounterparties,
    dataFields,
    addLibraryCriterion,
    duplicateLibraryCriterion,
    deleteLibraryCriterion,
    dirty,
    saveAll,
  } = useStore();

  const getField = useMemo<GetField>(() => {
    const m = new Map(dataFields.map((f) => [f.key, f]));
    return (k: string) => m.get(k);
  }, [dataFields]);

  const [selectedId, setSelectedId] = useState<string | null>(
    criteriaLibrary[0]?.id ?? null,
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "blocking" | "needs-setup" | "duplicate">("all");

  // Field usage -> duplicate detection; coverage -> share of the universe with a value.
  const usage = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of criteriaLibrary)
      for (const s of c.subCriteria) m[s.dataField] = (m[s.dataField] ?? 0) + 1;
    return m;
  }, [criteriaLibrary]);

  const coverage = useMemo(() => {
    const total = rankedCounterparties.length || 1;
    const m: Record<string, number> = {};
    for (const f of dataFields) {
      let n = 0;
      for (const cp of rankedCounterparties)
        if (counterpartyFieldValue(cp.id, f.key) !== undefined) n++;
      m[f.key] = Math.round((n / total) * 100);
    }
    return m;
  }, [rankedCounterparties, dataFields]);

  const counts = useMemo(() => {
    let blocking = 0,
      needs = 0,
      dup = 0;
    for (const c of criteriaLibrary) {
      const st = critStatus(c, usage, getField);
      if (st.blocking) blocking++;
      if (st.needsSetup) needs++;
      if (st.dup) dup++;
    }
    return { blocking, needs, dup };
  }, [criteriaLibrary, usage, getField]);

  const matches = (c: LibraryCriterion) => {
    if (query.trim()) {
      const q = query.toLowerCase();
      const inName = c.label.toLowerCase().includes(q);
      const inField = c.subCriteria.some((s) =>
        (getField(s.dataField)?.label ?? s.dataField).toLowerCase().includes(q),
      );
      if (!inName && !inField) return false;
    }
    const st = critStatus(c, usage, getField);
    if (filter === "blocking") return st.blocking;
    if (filter === "needs-setup") return st.needsSetup;
    if (filter === "duplicate") return st.dup;
    return true;
  };

  const visible = criteriaLibrary.filter(matches);
  const grouped = THEME_ORDER.map((t) => ({
    theme: t,
    items: visible
      .filter((c) => themeOf(c) === t)
      .sort((a, b) => (b.weight ?? 3) - (a.weight ?? 3)),
  })).filter((g) => g.items.length);

  const selected = criteriaLibrary.find((c) => c.id === selectedId) ?? null;

  const onDelete = (id: string) => {
    const c = criteriaLibrary.find((x) => x.id === id);
    if (!c) return;
    if (!confirm(`Delete "${c.label}"? This changes scoring for every scenario that uses it.`))
      return;
    deleteLibraryCriterion(id);
    if (selectedId === id) setSelectedId(criteriaLibrary.find((x) => x.id !== id)?.id ?? null);
  };
  const onDuplicate = (id: string) => {
    const n = duplicateLibraryCriterion(id);
    if (n) setSelectedId(n);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Criteria library
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            The shared scoring definitions. Pick a criterion on the left to edit its
            rule and importance. Originators reuse and tune these per scenario.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty ? (
            <Button onClick={saveAll}>Save all</Button>
          ) : (
            <span className="flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-2 text-xs font-medium text-success">
              <Check className="h-3.5 w-3.5" /> All changes saved
            </span>
          )}
          <Button variant="outline" onClick={() => setSelectedId(addLibraryCriterion())}>
            <Plus className="mr-1.5 h-4 w-4" /> Add criterion
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        {/* LEFT: persistent index */}
        <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search criteria or data fields"
              className="pl-8"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Chip active={filter === "all"} onClick={() => setFilter("all")}>
              All {criteriaLibrary.length}
            </Chip>
            <Chip active={filter === "blocking"} onClick={() => setFilter("blocking")}>
              Blocking {counts.blocking}
            </Chip>
            <Chip active={filter === "needs-setup"} onClick={() => setFilter("needs-setup")}>
              Needs setup {counts.needs}
            </Chip>
            {counts.dup > 0 && (
              <Chip active={filter === "duplicate"} onClick={() => setFilter("duplicate")}>
                Duplicate field {counts.dup}
              </Chip>
            )}
          </div>

          <div className="max-h-[calc(100vh-16rem)] space-y-4 overflow-auto pr-1">
            {grouped.map((g) => (
              <div key={g.theme}>
                <div className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {g.theme}
                </div>
                <div className="space-y-1">
                  {g.items.map((c) => (
                    <CriterionRow
                      key={c.id}
                      crit={c}
                      status={critStatus(c, usage, getField)}
                      getField={getField}
                      active={c.id === selectedId}
                      onClick={() => setSelectedId(c.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
            {!grouped.length && (
              <p className="px-1 py-6 text-center text-sm text-muted-foreground">
                Nothing matches.
              </p>
            )}
          </div>
        </aside>

        {/* RIGHT: single editor */}
        <section>
          {selected ? (
            <CriterionEditor
              key={selected.id}
              crit={selected}
              usage={usage}
              coverage={coverage}
              scenarios={scenarios}
              getField={getField}
              dataFields={dataFields}
              onDelete={() => onDelete(selected.id)}
              onDuplicate={() => onDuplicate(selected.id)}
            />
          ) : (
            <Card className="p-10 text-center text-sm text-muted-foreground">
              Select a criterion to edit, or add one.
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-card text-muted-foreground hover:bg-muted/60"
      }`}
    >
      {children}
    </button>
  );
}

// Subtle status: a filled dot for an active (configured, scoring) criterion,
// a hollow ring for one that still needs setup. No loud text flags.
function StatusDot({ status }: { status: Status }) {
  const active = !status.needsSetup && !status.inactive;
  return (
    <span
      title={active ? "Active" : "Needs setup"}
      aria-label={active ? "Active" : "Needs setup"}
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${
        active ? "bg-success" : "border border-muted-foreground/50"
      }`}
    />
  );
}

function CriterionRow({
  crit,
  status,
  getField,
  active,
  onClick,
}: {
  crit: LibraryCriterion;
  status: Status;
  getField: GetField;
  active: boolean;
  onClick: () => void;
}) {
  const summary =
    crit.subCriteria.length === 0
      ? "No rule yet"
      : crit.subCriteria.length === 1
        ? ruleSummary(crit.subCriteria[0], getField)
        : `${crit.subCriteria.length} rules`;
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
        active
          ? "border-brand-blue bg-brand-blue/5"
          : "border-transparent hover:border-border hover:bg-muted/40"
      }`}
    >
      <div className="flex items-center gap-2">
        <StatusDot status={status} />
        <span className="truncate text-sm font-medium text-foreground">{crit.label}</span>
      </div>
      {!status.needsSetup && (
        <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{summary}</div>
      )}
    </button>
  );
}

function CriterionEditor({
  crit,
  usage,
  coverage,
  scenarios,
  getField,
  dataFields,
  onDelete,
  onDuplicate,
}: {
  crit: LibraryCriterion;
  usage: Record<string, number>;
  coverage: Record<string, number>;
  scenarios: { id: string; title: string }[];
  getField: GetField;
  dataFields: DataField[];
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const { updateLibraryCriterion, addSubCriterion } = useStore();
  const st = critStatus(crit, usage, getField);
  const usedIn =
    crit.scenarios && crit.scenarios.length
      ? scenarios.filter((s) => crit.scenarios!.includes(s.id))
      : scenarios;
  const single = crit.subCriteria.length === 1;

  return (
    <Card className="space-y-5 p-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Input
            value={crit.label}
            onChange={(e) => updateLibraryCriterion(crit.id, { label: e.target.value })}
            className="h-auto border-transparent bg-transparent px-0 text-lg font-semibold shadow-none hover:bg-muted/40 focus-visible:bg-card focus-visible:px-2"
          />
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <StatusDot status={st} />
            <Link
              to="/scenarios"
              className="inline-flex items-center gap-1 text-xs text-brand-blue hover:underline"
            >
              Used in {usedIn.length} scenario{usedIn.length === 1 ? "" : "s"}
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
        <OverflowMenu onDuplicate={onDuplicate} onDelete={onDelete} />
      </div>

      <Input
        value={crit.description ?? ""}
        placeholder="What this criterion measures"
        onChange={(e) => updateLibraryCriterion(crit.id, { description: e.target.value })}
        className="text-sm text-muted-foreground"
      />

      {/* Importance + blocking, side by side */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Importance</span>
            <span className="w-4 text-right text-sm font-medium tabular-nums text-foreground">
              {crit.weight ?? 3}
            </span>
          </div>
          <Slider
            min={1}
            max={5}
            step={1}
            value={[crit.weight ?? 3]}
            onValueChange={(v) => updateLibraryCriterion(crit.id, { weight: v[0] })}
          />
        </div>

        <div className="rounded-lg border border-border p-3">
          <label className="flex items-start gap-2">
            <Switch
              checked={crit.blocking}
              onCheckedChange={(v) => updateLibraryCriterion(crit.id, { blocking: v })}
            />
            <span>
              <span className="text-xs font-medium text-foreground">Blocking criterion</span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                A counterparty scoring 0 here is removed from the shortlist entirely.
              </span>
            </span>
          </label>
        </div>
      </div>

      {/* Sub-criteria */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {single ? "Rule" : `Sub-criteria · ${crit.subCriteria.length}`}
          </span>
          <Button variant="outline" size="sm" onClick={() => addSubCriterion(crit.id)}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add sub-criterion
          </Button>
        </div>

        {crit.subCriteria.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            No rule yet. Add a sub-criterion to define how this is scored.
          </p>
        )}

        <div className="space-y-2">
          {crit.subCriteria.map((sub) => (
            <SubRuleEditor
              key={sub.id}
              crit={crit}
              sub={sub}
              single={single}
              usage={usage}
              coverage={coverage}
              getField={getField}
              dataFields={dataFields}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

function SubRuleEditor({
  crit,
  sub,
  single,
  usage,
  coverage,
  getField,
  dataFields,
}: {
  crit: LibraryCriterion;
  sub: SubCriterion;
  single: boolean;
  usage: Record<string, number>;
  coverage: Record<string, number>;
  getField: GetField;
  dataFields: DataField[];
}) {
  const { updateSubCriterion, deleteSubCriterion } = useStore();
  const [open, setOpen] = useState(single);
  const fld = getField(sub.dataField);
  const fmax = fieldMax(sub.dataField);
  const dup = (usage[sub.dataField] ?? 0) > 1 && !!fld;
  const ruleKey = ruleKeyOf(sub);
  const graded = ruleKey === "higher" || ruleKey === "lower";
  const gate = ruleKey === "gate-min" || ruleKey === "gate-max";
  const between = ruleKey === "between";

  const patch = (p: Partial<Omit<SubCriterion, "id">>) =>
    updateSubCriterion(crit.id, sub.id, p);
  const setTh = (p: Partial<SubCriterion["thresholds"]>) =>
    patch({ thresholds: { ...sub.thresholds, ...p } });

  const onRule = (key: string) => {
    const o = RULE_OPTIONS.find((x) => x.key === key);
    if (!o) return;
    const t = { ...sub.thresholds };
    if ((o.ruleType === "graded-min" || o.ruleType === "graded-max") && t.floor === undefined && t.ceiling === undefined) {
      t.floor = 0;
      t.ceiling = fmax;
    }
    if ((o.ruleType === "gate-min" || o.ruleType === "gate-max") && t.t === undefined) t.t = Math.round(fmax / 2);
    if (o.ruleType === "between" && t.x === undefined && t.y === undefined) {
      t.x = Math.round(fmax / 4);
      t.y = Math.round((fmax * 3) / 4);
    }
    patch({ ruleType: o.ruleType, direction: o.direction, thresholds: t });
  };

  // Single-sub criteria render inline (no wrapper chrome, no duplicate title).
  const body = (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel>Data field</FieldLabel>
          <Select value={sub.dataField} onValueChange={(v) => patch({ dataField: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dataFields.map((f) => (
                <SelectItem key={f.key} value={f.key}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {fld ? (
              <>
                {fld.unit ? `${fld.unit} · ` : ""}
                {fld.source} · data for {coverage[sub.dataField] ?? 0}% of counterparties
              </>
            ) : (
              <span className="text-warning">No live data field - not scoring.</span>
            )}
            {dup && (
              <span className="text-warning"> · also used by another criterion</span>
            )}
          </p>
        </div>
        <div>
          <FieldLabel>Rule</FieldLabel>
          <Select value={ruleKey} onValueChange={onRule}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RULE_OPTIONS.map((o) => (
                <SelectItem key={o.key} value={o.key}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Typed thresholds */}
      <div className="grid gap-4 sm:grid-cols-2">
        {graded && (
          <>
            <NumberField
              label="Scores 0 at or below"
              unit={fld?.unit}
              value={sub.thresholds.floor ?? 0}
              onChange={(v) => setTh({ floor: v })}
            />
            <NumberField
              label="Scores 100 at or above"
              unit={fld?.unit}
              value={sub.thresholds.ceiling ?? fmax}
              onChange={(v) => setTh({ ceiling: v })}
            />
          </>
        )}
        {gate && (
          <NumberField
            label="Pass threshold"
            unit={fld?.unit}
            value={sub.thresholds.t ?? 0}
            onChange={(v) => setTh({ t: v })}
          />
        )}
        {between && (
          <>
            <NumberField
              label="Low"
              unit={fld?.unit}
              value={sub.thresholds.x ?? 0}
              onChange={(v) => setTh({ x: v })}
            />
            <NumberField
              label="High"
              unit={fld?.unit}
              value={sub.thresholds.y ?? fmax}
              onChange={(v) => setTh({ y: v })}
            />
          </>
        )}
      </div>

      {/* Scoring curve = the preview */}
      <div className="rounded-lg border border-border bg-muted/20 p-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted-foreground">
            Score curve
          </span>
        </div>
        <Curve sub={sub} />
      </div>

      {/* Importance (within criterion) + missing */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <FieldLabel>Importance in this criterion</FieldLabel>
            <span className="w-4 text-right text-sm font-medium tabular-nums text-foreground">
              {sub.weight}
            </span>
          </div>
          <Slider
            min={1}
            max={5}
            step={1}
            value={[sub.weight]}
            onValueChange={(v) => patch({ weight: v[0] })}
          />
        </div>
        <div>
          <FieldLabel>When data is missing</FieldLabel>
          <Select value={sub.missing} onValueChange={(v) => patch({ missing: v as SubCriterion["missing"] })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MISSING_OPTS.map((o) => (
                <SelectItem key={o.v} value={o.v}>
                  {o.l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  if (single) return <div>{body}</div>;

  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-muted-foreground hover:text-foreground"
          aria-label={open ? "Collapse" : "Expand"}
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <Input
          value={sub.label}
          onChange={(e) => patch({ label: e.target.value })}
          className="h-8 max-w-xs border-transparent bg-transparent px-1 text-sm font-medium shadow-none hover:bg-muted/40 focus-visible:bg-card"
        />
        <span className="ml-auto truncate text-[11px] text-muted-foreground">
          {ruleSummary(sub, getField)}
        </span>
        <button
          onClick={() => deleteSubCriterion(crit.id, sub.id)}
          className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
          aria-label="Delete sub-criterion"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {open && <div className="border-t border-border p-3">{body}</div>}
    </div>
  );
}

function Curve({ sub }: { sub: SubCriterion }) {
  const base = fieldMax(sub.dataField);
  const thr = [
    sub.thresholds.floor,
    sub.thresholds.ceiling,
    sub.thresholds.t,
    sub.thresholds.x,
    sub.thresholds.y,
  ].filter((v): v is number => typeof v === "number");
  const thrMax = thr.length ? Math.max(...thr) : base;
  // Axis spans the thresholds, with headroom, so a ceiling beyond the field's
  // default range still shows the full 0 to 100 curve and its plateau.
  const fmax = Math.max(base, thrMax * 1.1) || 1;
  const W = 320;
  const H = 72;
  const pad = 6;
  const [hx, setHx] = useState<number | null>(null);
  const N = 60;
  const pts: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const v = (i / N) * fmax;
    const sc = subScore(sub.ruleType, v, sub.thresholds);
    pts.push([pad + (i / N) * (W - 2 * pad), H - pad - (sc / 100) * (H - 2 * pad)]);
  }
  const path = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  // Mark where the rule's thresholds land (score 0 and score 100 for graded,
  // the pass point for a gate, the range ends for between).
  const rk = ruleKeyOf(sub);
  const markVals =
    rk === "higher" || rk === "lower"
      ? [sub.thresholds.floor ?? 0, sub.thresholds.ceiling ?? 0]
      : rk === "gate-min" || rk === "gate-max"
        ? [sub.thresholds.t ?? 0]
        : rk === "between"
          ? [sub.thresholds.x ?? 0, sub.thresholds.y ?? 0]
          : [];
  const marks = markVals.map((m) => {
    const cm = Math.max(0, Math.min(fmax, m));
    return {
      mx: pad + (cm / fmax) * (W - 2 * pad),
      my: H - pad - (subScore(sub.ruleType, m, sub.thresholds) / 100) * (H - 2 * pad),
    };
  });
  const hv = hx != null ? ((hx - pad) / (W - 2 * pad)) * fmax : null;
  const hs = hv != null ? subScore(sub.ruleType, hv, sub.thresholds) : null;
  const hxy = hv != null ? pad + (hv / fmax) * (W - 2 * pad) : null;
  const hyy = hs != null ? H - pad - (hs / 100) * (H - 2 * pad) : null;

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - r.left) / r.width) * W;
          setHx(Math.max(pad, Math.min(W - pad, x)));
        }}
        onMouseLeave={() => setHx(null)}
      >
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="currentColor" className="text-border" />
        <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="currentColor" className="text-border" />
        <path d={path} fill="none" stroke="currentColor" strokeWidth={2} className="text-brand-blue" />
        {marks.map((m, i) => (
          <g key={i}>
            <line x1={m.mx} y1={H - pad} x2={m.mx} y2={m.my} stroke="currentColor" className="text-muted-foreground/40" />
            <circle cx={m.mx} cy={m.my} r={2.5} className="fill-muted-foreground" />
          </g>
        ))}
        {hxy != null && hyy != null && (
          <>
            <line x1={hxy} y1={pad} x2={hxy} y2={H - pad} stroke="currentColor" className="text-muted-foreground/50" strokeDasharray="3 3" />
            <circle cx={hxy} cy={hyy} r={3} className="fill-brand-blue" />
          </>
        )}
      </svg>
      <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>0</span>
        <span className="font-medium text-foreground">
          {hv != null ? `${fmt(Math.round(hv))} → score ${hs}` : "Hover the curve to read value → score"}
        </span>
        <span>{fmt(fmax)}</span>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <div className="mb-1 text-xs font-medium text-foreground">{children}</div>;
}

function NumberField({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit?: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="tabular-nums"
        />
        {unit && <span className="shrink-0 text-xs text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

function OverflowMenu({
  onDuplicate,
  onDelete,
}: {
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="rounded-md border border-border p-2 text-muted-foreground hover:bg-muted/50"
        aria-label="More actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-md border border-border bg-card shadow-md">
          <button
            onMouseDown={onDuplicate}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60"
          >
            <Copy className="h-4 w-4" /> Duplicate as template
          </button>
          <button
            onMouseDown={onDelete}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
