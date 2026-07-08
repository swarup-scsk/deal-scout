import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  Download,
  Filter,
  Plus,
  Settings2,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  fitBarClass,
  fitColorClass,
  fitScore,
  type BusinessLineType,
} from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/prospecting")({
  validateSearch: (search: Record<string, unknown>) => ({
    scenario: typeof search.scenario === "string" ? search.scenario : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Universe — SEE Origination Scout" },
      {
        name: "description",
        content: "Browse the counterparty universe and apply scenarios to score.",
      },
    ],
  }),
  component: UniverseScreen,
});

const BUSINESS_LINES: BusinessLineType[] = [
  "Asset Owner",
  "Trader",
  "Energy Supplier",
  "Large Consumer",
  "Optimizer/Aggregator",
  "Service Provider",
];

function UniverseScreen() {
  const { counterparties, addCounterparty, config, scenarios } = useStore();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [filter, setFilter] = useState("");
  const [country, setCountry] = useState("all");
  const [sortKey, setSortKey] = useState(search.scenario ? "fit" : "company");
  const [sortDesc, setSortDesc] = useState(Boolean(search.scenario));
  const [moreOpen, setMoreOpen] = useState(false);
  const [scenarioId, setScenarioId] = useState(search.scenario ?? "none");
  const [dl, setDl] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    company: "",
    country: "",
    businessLineType: "Energy Supplier" as BusinessLineType,
    markets: "",
    annualVolume: 0,
    revenueEbitda: "",
  });
  const [adv, setAdv] = useState({
    businessLineType: "all",
    market: "",
    minVolume: 0,
    minFit: 0,
  });

  const applied = scenarioId !== "none";
  const scenario = scenarios.find((s) => s.id === scenarioId);

  let rows = counterparties.map((cp) => {
    const fit = applied ? fitScore(cp, config.weights) : 0;
    const belowVolume = cp.annualVolume < config.rules.targetVolume;
    const belowMargin = cp.margin < config.rules.returnGate;
    const belowHurdle = applied && fit < config.rules.fitMid;
    return { ...cp, fit, belowVolume, belowMargin, belowHurdle };
  });

  type Row = (typeof rows)[number];
  rows = rows.filter((cp) => {
    const t = filter.toLowerCase();
    const matchText =
      cp.company.toLowerCase().includes(t) ||
      cp.businessLine.toLowerCase().includes(t) ||
      cp.legalEntityName.toLowerCase().includes(t);
    const matchCountry = country === "all" || cp.country === country;
    const matchType =
      adv.businessLineType === "all" ||
      cp.businessLineType === adv.businessLineType;
    const matchMarket =
      !adv.market || cp.markets.toLowerCase().includes(adv.market.toLowerCase());
    const matchVolume = cp.annualVolume >= adv.minVolume;
    const matchFit = !applied || cp.fit >= adv.minFit;
    return (
      matchText && matchCountry && matchType && matchMarket && matchVolume && matchFit
    );
  });

  const columns: {
    key: string;
    label: string;
    get: (c: Row) => string | number;
    align?: "right";
  }[] = [
    { key: "company", label: "Company", get: (c) => c.company },
    { key: "country", label: "Country", get: (c) => c.country },
    { key: "businessLineType", label: "Business line", get: (c) => c.businessLineType },
    { key: "revenueEbitda", label: "Revenue / EBITDA", get: (c) => c.revenueEbitda },
    { key: "headcount", label: "Headcount", get: (c) => c.headcount },
    { key: "markets", label: "Gas & power markets", get: (c) => c.markets },
    { key: "annualVolume", label: "Volume", get: (c) => c.annualVolume, align: "right" },
    ...(applied
      ? [
          {
            key: "fit",
            label: "Fit",
            get: (c: Row) => c.fit,
            align: "right" as const,
          },
        ]
      : []),
  ];
  const restCols = columns.filter((c) => c.key !== "company");

  const getter = columns.find((c) => c.key === sortKey)?.get ?? ((c: Row) => c.company);
  rows = [...rows].sort((a, b) => {
    const av = getter(a);
    const bv = getter(b);
    if (typeof av === "number" && typeof bv === "number") {
      return sortDesc ? bv - av : av - bv;
    }
    const cmp = String(av).localeCompare(String(bv));
    return sortDesc ? -cmp : cmp;
  });

  const sortBy = (key: string) => {
    if (key === sortKey) setSortDesc((v) => !v);
    else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  const chooseScenario = (v: string) => {
    setScenarioId(v);
    if (v === "none") {
      setSortKey("company");
      setSortDesc(false);
    } else {
      setSortKey("fit");
      setSortDesc(true);
    }
  };

  const mockDownload = (kind: string) => {
    setDl(`Preparing ${kind} (mock)…`);
    setTimeout(() => setDl(""), 2500);
  };

  const submitAdd = () => {
    if (!form.company.trim()) return;
    addCounterparty({
      company: form.company.trim(),
      country: form.country.trim() || "Unknown",
      businessLineType: form.businessLineType,
      markets: form.markets.trim(),
      annualVolume: form.annualVolume,
      revenueEbitda: form.revenueEbitda.trim(),
    });
    setForm({
      company: "",
      country: "",
      businessLineType: "Energy Supplier",
      markets: "",
      annualVolume: 0,
      revenueEbitda: "",
    });
    setAddOpen(false);
  };

  const headCell = (col: (typeof columns)[number]) => {
    const active = sortKey === col.key;
    return (
      <TableHead
        key={col.key}
        className={`cursor-pointer select-none whitespace-nowrap ${col.align === "right" ? "text-right" : ""}`}
        onClick={() => sortBy(col.key)}
      >
        <span className="inline-flex items-center gap-1">
          {col.label}
          {active &&
            (sortDesc ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUp className="h-3 w-3" />
            ))}
        </span>
      </TableHead>
    );
  };

  const renderCell = (key: string, cp: Row) => {
    switch (key) {
      case "company":
        return (
          <div>
            <div className="font-medium text-foreground">{cp.company}</div>
            <div className="mt-0.5 flex flex-wrap gap-1">
              {cp.belowVolume && (
                <Badge variant="outline" className="text-[10px]">
                  Below volume
                </Badge>
              )}
              {cp.belowMargin && (
                <Badge variant="outline" className="text-[10px]">
                  Below margin
                </Badge>
              )}
              {cp.belowHurdle && (
                <Badge variant="destructive" className="text-[10px]">
                  Below hurdle
                </Badge>
              )}
            </div>
          </div>
        );
      case "businessLineType":
        return (
          <div>
            <div className="text-foreground">{cp.businessLineType}</div>
            <div className="text-[11px] text-muted-foreground">
              {cp.businessLine}
            </div>
          </div>
        );
      case "markets":
        return <span className="text-muted-foreground">{cp.markets}</span>;
      case "annualVolume":
        return (
          <span className="whitespace-nowrap">
            {cp.annualVolume.toLocaleString()} GWh
          </span>
        );
      case "fit":
        return (
          <div className="flex items-center justify-end gap-2">
            <div className="h-1.5 w-10 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full ${fitBarClass(cp.fit, config.thresholds)}`}
                style={{ width: `${cp.fit}%` }}
              />
            </div>
            <span
              className={`w-6 text-right font-semibold ${fitColorClass(cp.fit, config.thresholds)}`}
            >
              {cp.fit}
            </span>
          </div>
        );
      default:
        return (
          <span className="whitespace-nowrap">{String(cp[key as keyof Row])}</span>
        );
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Universe</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {applied ? (
              <>
                Scored for{" "}
                <span className="font-medium text-foreground">
                  {scenario?.title}
                </span>
                , ranked by fit.
              </>
            ) : (
              <>Latest scan, all counterparties. No scenario applied.</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={scenarioId} onValueChange={chooseScenario}>
            <SelectTrigger className="w-56">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No scenario (browse)</SelectItem>
              {scenarios.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  Apply: {s.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add counterparty
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => mockDownload("table-only export")}>
                Table only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => mockDownload("detailed view export")}>
                Detailed view
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/scenario" })}
          >
            <Settings2 className="mr-2 h-4 w-4" /> Configure
          </Button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="w-64 pl-8"
            placeholder="Search counterparties, or add a name…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>
            <SelectItem value="Netherlands">Netherlands</SelectItem>
            <SelectItem value="Belgium">Belgium</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={moreOpen ? "secondary" : "outline"}
          size="sm"
          onClick={() => setMoreOpen((v) => !v)}
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" /> More filters
        </Button>
        {dl && <span className="text-xs text-muted-foreground">{dl}</span>}
        <Badge variant="secondary" className="ml-auto">
          {rows.length} counterparties
        </Badge>
      </div>

      {moreOpen && (
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">More filters</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setAdv({ businessLineType: "all", market: "", minVolume: 0, minFit: 0 })
              }
            >
              Reset
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Business line</Label>
              <Select
                value={adv.businessLineType}
                onValueChange={(v) => setAdv((a) => ({ ...a, businessLineType: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {BUSINESS_LINES.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Market contains</Label>
              <Input
                placeholder="high-pressure grid, ZTP…"
                value={adv.market}
                onChange={(e) => setAdv((a) => ({ ...a, market: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Min volume (GWh/yr)</Label>
              <Input
                type="number"
                value={adv.minVolume || ""}
                onChange={(e) =>
                  setAdv((a) => ({ ...a, minVolume: Number(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Min fit (needs a scenario)</Label>
              <Input
                type="number"
                value={adv.minFit || ""}
                disabled={!applied}
                onChange={(e) =>
                  setAdv((a) => ({ ...a, minFit: Number(e.target.value) || 0 }))
                }
              />
            </div>
          </div>
        </Card>
      )}

      {/* Universe table */}
      <Card className="overflow-x-auto p-0">
        <Table className="w-full text-xs [&_th]:px-2 [&_th]:py-2 [&_td]:px-2 [&_td]:py-2 [&_td]:align-top">
          <TableHeader>
            <TableRow>
              {headCell(columns[0])}
              <TableHead>Action</TableHead>
              {restCols.map((col) => headCell(col))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((cp) => (
              <TableRow key={cp.id}>
                <TableCell>{renderCell("company", cp)}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    onClick={() =>
                      navigate({
                        to: "/qualification/$id",
                        params: { id: cp.id },
                      })
                    }
                  >
                    Deep dive
                  </Button>
                </TableCell>
                {restCols.map((col) => (
                  <TableCell
                    key={col.key}
                    className={col.align === "right" ? "text-right" : ""}
                  >
                    {renderCell(col.key, cp)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <p className="text-xs text-muted-foreground">
        No fit score until a scenario is applied. Revenue, headcount and portfolio
        are also available as columns.
      </p>

      {/* Add counterparty */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add counterparty</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Company</Label>
              <Input
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                placeholder="e.g. Rhine Energy B.V."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Country</Label>
                <Input
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  placeholder="e.g. France"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Business line</Label>
                <Select
                  value={form.businessLineType}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, businessLineType: v as BusinessLineType }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_LINES.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Gas and power markets</Label>
                <Input
                  value={form.markets}
                  onChange={(e) => setForm((f) => ({ ...f, markets: e.target.value }))}
                  placeholder="e.g. FR (PEG, high-pressure)"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Annual volume (GWh/yr)</Label>
                <Input
                  type="number"
                  value={form.annualVolume || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      annualVolume: Number(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Revenue / EBITDA (optional)</Label>
              <Input
                value={form.revenueEbitda}
                onChange={(e) =>
                  setForm((f) => ({ ...f, revenueEbitda: e.target.value }))
                }
                placeholder="e.g. €900m / €95m"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitAdd}>Add to universe</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
