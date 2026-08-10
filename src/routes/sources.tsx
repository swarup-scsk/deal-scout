import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Database, Info, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DATA_FIELDS,
  DEFAULT_TIER_WEIGHTS,
  EU_REGIONS,
  REGIONS,
  sourceKeyForField,
  type Source,
} from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/sources")({
  head: () => ({
    meta: [
      { title: "Data sources - SEE Origination Scout" },
      {
        name: "description",
        content:
          "Admin registry of data sources, their trust tiers and weights, and which source backs each data field.",
      },
    ],
  }),
  component: Sources,
});

const TIERS: { tier: 1 | 2 | 3 | 4; label: string; tone: string }[] = [
  { tier: 1, label: "Tier 1 · official registers", tone: "bg-success/10 text-success" },
  { tier: 2, label: "Tier 2 · market infrastructure", tone: "bg-accent text-accent-foreground" },
  { tier: 3, label: "Tier 3 · commercial data", tone: "bg-warning/15 text-warning" },
  { tier: 4, label: "Tier 4 · web / AI", tone: "bg-muted text-muted-foreground" },
];
const tierMeta = (t: number) => TIERS.find((x) => x.tier === t) ?? TIERS[3];

// Inline, low-chrome text field (matches the Library screen).
const inlineInput =
  "h-9 border-transparent bg-transparent px-2 shadow-none hover:bg-muted/50 focus-visible:bg-card";

function Sources() {
  const {
    sourceRegistry,
    addSource,
    updateSource,
    deleteSource,
    setFieldSource,
    setTierWeight,
    dirty,
    saveAll,
  } = useStore();
  const { sources, tierWeights, fieldSource } = sourceRegistry;
  const [infoOpen, setInfoOpen] = useState<string | null>(null);
  const [region, setRegion] = useState<string>("*"); // "*" = default / any region

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Data sources
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            The sources Scout is allowed to draw on, how much each tier is
            trusted, and which source backs each data field. Higher tiers carry
            more weight in the data-quality score; a lower tier can never
            override a higher one.
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

      {/* Source registry ---------------------------------------------------*/}
      <Card className="overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Database className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">
            Source registry
          </span>
          <span className="ml-auto text-xs text-muted-foreground">
            {sources.length} sources
          </span>
        </div>
        <div className="divide-y divide-border">
          {sources.map((s) => (
            <div key={s.key}>
              <div className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                <Input
                  value={s.name}
                  className={`${inlineInput} min-w-0 flex-1 text-sm font-medium`}
                  onChange={(e) => updateSource(s.key, { name: e.target.value })}
                />
                <div className="w-64">
                  <Select
                    value={String(s.tier)}
                    onValueChange={(v) =>
                      updateSource(s.key, { tier: Number(v) as Source["tier"] })
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIERS.map((t) => (
                        <SelectItem key={t.tier} value={String(t.tier)}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  value={s.retrieved}
                  placeholder="freshness"
                  className={`${inlineInput} w-28 text-xs text-muted-foreground`}
                  onChange={(e) =>
                    updateSource(s.key, { retrieved: e.target.value })
                  }
                />
                <Input
                  value={(s.coverage ?? ["GLOBAL"]).join(", ")}
                  placeholder="regions"
                  title="Regions this source covers, e.g. GB, DE, or GLOBAL"
                  className={`${inlineInput} w-32 text-xs text-muted-foreground`}
                  onChange={(e) =>
                    updateSource(s.key, {
                      coverage: e.target.value
                        .split(",")
                        .map((x) => x.trim().toUpperCase())
                        .filter(Boolean),
                    })
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    setInfoOpen((k) => (k === s.key ? null : s.key))
                  }
                  className={`transition-colors hover:text-primary ${
                    infoOpen === s.key || s.info
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                  aria-label="Source information"
                  title="About this source"
                >
                  <Info className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteSource(s.key)}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                  aria-label="Delete source"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {infoOpen === s.key && (
                <div className="border-t border-border bg-muted/20 px-4 py-3">
                  <Label className="text-xs text-muted-foreground">
                    About this source (what it is and how it is accessed)
                  </Label>
                  <Textarea
                    className="mt-1.5 text-sm"
                    rows={2}
                    placeholder="What this source provides and how it is accessed…"
                    value={s.info ?? ""}
                    onChange={(e) =>
                      updateSource(s.key, { info: e.target.value })
                    }
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="border-t border-border p-3">
          <Button variant="outline" size="sm" onClick={() => addSource()}>
            <Plus className="mr-1.5 h-4 w-4" /> Add source
          </Button>
        </div>
      </Card>

      {/* Tier weights ------------------------------------------------------*/}
      <Card className="p-4">
        <div className="mb-1 text-sm font-semibold text-foreground">
          How much each tier counts
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          The trust weight a source of each tier contributes to a
          counterparty's data-quality score, from 0 to 100 percent.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {TIERS.map((t) => {
            const w = tierWeights[t.tier] ?? DEFAULT_TIER_WEIGHTS[t.tier] ?? 0;
            return (
              <div
                key={t.tier}
                className="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${t.tone}`}
                >
                  Tier {t.tier}
                </span>
                <Slider
                  className="flex-1"
                  min={0}
                  max={1}
                  step={0.02}
                  value={[w]}
                  onValueChange={(v) => setTierWeight(t.tier, v[0])}
                />
                <span className="w-12 text-right text-sm font-medium text-foreground">
                  {Math.round(w * 100)}%
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Field-to-source mapping (region-aware) ----------------------------*/}
      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
          <span className="text-sm font-semibold text-foreground">
            Which source backs each field
          </span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Region</span>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="h-8 w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="*">Default (any region)</SelectItem>
                {REGIONS.map((r) => (
                  <SelectItem key={r.code} value={r.code}>
                    {r.code} · {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="divide-y divide-border">
          {DATA_FIELDS.map((f) => {
            const jur = region === "*" ? undefined : region;
            const resolvedKey = sourceKeyForField(f.key, jur, sourceRegistry);
            const entry = fieldSource[f.key];
            const explicit =
              typeof entry === "object" && entry
                ? entry[region]
                : region === "*"
                  ? typeof entry === "string"
                    ? entry
                    : undefined
                  : undefined;
            const shownKey = explicit ?? resolvedKey ?? "";
            const src = sources.find((s) => s.key === resolvedKey);
            const inherited = region !== "*" && !explicit;
            const opts = sources.filter((s) => {
              if (region === "*") return true;
              const cov = s.coverage;
              if (!cov || cov.includes("GLOBAL") || cov.includes(region)) return true;
              return EU_REGIONS.includes(region) && cov.includes("EU");
            });
            return (
              <div
                key={f.key}
                className="flex flex-wrap items-center gap-3 px-4 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-foreground">{f.label}</div>
                  {f.unit && (
                    <div className="text-[11px] text-muted-foreground">
                      {f.unit}
                    </div>
                  )}
                </div>
                {inherited && (
                  <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                    inherited
                  </span>
                )}
                {src && (
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${tierMeta(src.tier).tone}`}
                  >
                    T{src.tier}
                  </span>
                )}
                <div className="w-72">
                  <Select
                    value={shownKey}
                    onValueChange={(v) => setFieldSource(f.key, v, jur)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Choose a source" />
                    </SelectTrigger>
                    <SelectContent>
                      {opts.map((s) => (
                        <SelectItem key={s.key} value={s.key}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          {region === "*"
            ? "Editing the default source used when no region-specific source is set."
            : `Editing sources for ${region}. Fields with no ${region} source inherit the default (shown as "inherited").`}
        </div>
      </Card>

      <p className="text-[11px] text-muted-foreground">
        The authoritative source varies by the counterparty's jurisdiction, so the
        mapping above is per region. Live connections (credentials and API keys)
        are managed server-side in production, not here. Data is synthetic in the
        prototype.
      </p>
    </div>
  );
}

