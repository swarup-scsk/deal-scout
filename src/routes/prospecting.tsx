import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Download,
  Filter,
  ListChecks,
  RefreshCw,
  Search,
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fitBarClass, fitColorClass, fitScore } from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/prospecting")({
  validateSearch: (search: Record<string, unknown>) => ({
    scenario: typeof search.scenario === "string" ? search.scenario : undefined,
  }),
  head: () => ({
    meta: [
      { title: "AI-Assisted Prospecting — SEE Origination Scout" },
      {
        name: "description",
        content:
          "Scan the market for counterparties that fit the selected origination scenario.",
      },
    ],
  }),
  component: ProspectingScreen,
});

function ProspectingScreen() {
  const { rankedCounterparties, config, scenarios, selectedScenarioId, setConfigOpen } =
    useStore();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");
  const [country, setCountry] = useState("all");
  const [sortKey, setSortKey] = useState("fit");
  const [sortDesc, setSortDesc] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [acrossScenarios, setAcrossScenarios] = useState(false);
  const [dl, setDl] = useState("");
  const [adv, setAdv] = useState({
    businessLineType: "all",
    market: "",
    minVolume: 0,
    minFit: 0,
  });

  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId);

  const acrossInfo: Record<string, { title: string; score: number }> = {};
  for (const cp of rankedCounterparties) {
    let bestTitle = "-";
    let best = -1;
    for (const s of scenarios) {
      const sc = fitScore(cp, s.criteria);
      if (sc > best) {
        best = sc;
        bestTitle = s.title;
      }
    }
    acrossInfo[cp.id] = { title: bestTitle, score: best };
  }

  let rows = rankedCounterparties.filter((cp) => {
    const matchText =
      cp.company.toLowerCase().includes(filter.toLowerCase()) ||
      cp.businessLine.toLowerCase().includes(filter.toLowerCase());
    const matchCountry = country === "all" || cp.country === country;
    const matchType =
      adv.businessLineType === "all" ||
      cp.businessLineType === adv.businessLineType;
    const matchMarket =
      !adv.market || cp.markets.toLowerCase().includes(adv.market.toLowerCase());
    const matchVolume = cp.annualVolume >= adv.minVolume;
    const matchFit = cp.fit >= adv.minFit;
    return (
      matchText && matchCountry && matchType && matchMarket && matchVolume && matchFit
    );
  });

  type Row = (typeof rows)[number];
  const columns: {
    key: string;
    label: string;
    get: (c: Row) => string | number;
    align?: "right";
  }[] = [
    { key: "company", label: "Company", get: (c) => c.company },
    { key: "country", label: "Country", get: (c) => c.country },
    { key: "legalEntityName", label: "Legal entity", get: (c) => c.legalEntityName },
    { key: "lei", label: "LEI", get: (c) => c.lei },
    { key: "revenueEbitda", label: "Revenue / EBITDA", get: (c) => c.revenueEbitda },
    { key: "headcount", label: "Headcount", get: (c) => c.headcount },
    { key: "businessLineType", label: "Business line", get: (c) => c.businessLineType },
    { key: "portfolioSize", label: "Portfolio", get: (c) => c.portfolioSize },
    { key: "markets", label: "Gas & Power markets", get: (c) => c.markets },
    { key: "annualVolume", label: "Volume", get: (c) => c.annualVolume, align: "right" },
    { key: "aiInsight", label: "AI insight", get: (c) => c.aiInsight },
    ...(acrossScenarios
      ? [
          {
            key: "bestScenario",
            label: "Best-fit scenario",
            get: (c: Row) => acrossInfo[c.id].title,
          },
        ]
      : []),
    { key: "fit", label: "Fit", get: (c) => c.fit, align: "right" as const },
  ];
  const restCols = columns.filter((c) => c.key !== "company");

  const getter = columns.find((c) => c.key === sortKey)?.get ?? ((c: Row) => c.fit);
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

  const mockDownload = (kind: string) => {
    setDl(`Preparing ${kind} (mock)…`);
    setTimeout(() => setDl(""), 2500);
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
              {cp.belowHurdle && (
                <Badge variant="destructive" className="text-[10px]">
                  Below hurdle
                </Badge>
              )}
              {cp.belowTarget && (
                <Badge variant="outline" className="text-[10px]">
                  Below target
                </Badge>
              )}
            </div>
          </div>
        );
      case "legalEntityName":
        return (
          <span
            className="block max-w-[130px] truncate text-muted-foreground"
            title={cp.legalEntityName}
          >
            {cp.legalEntityName}
          </span>
        );
      case "lei":
        return (
          <span
            className="block max-w-[120px] truncate font-mono text-[11px] text-muted-foreground"
            title={cp.lei}
          >
            {cp.lei}
          </span>
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
        return <span className="whitespace-normal">{cp.markets}</span>;
      case "annualVolume":
        return (
          <span className="whitespace-nowrap">
            {cp.annualVolume.toLocaleString()} GWh
          </span>
        );
      case "aiInsight":
        return (
          <span className="block max-w-[170px] text-muted-foreground">
            {cp.aiInsight}
          </span>
        );
      case "bestScenario":
        return <span>{acrossInfo[cp.id].title}</span>;
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
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          AI-Assisted Prospecting
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Scanning {config.scope.region} for counterparties that fit{" "}
          <span className="font-medium text-foreground">
            {selectedScenario?.title}
          </span>
          , ranked by weighted fit against your active rules.
        </p>
      </div>

      {/* Auto search: subtle horizontal bar, prominent CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4" />
          <span>
            <span className="font-medium text-foreground">Auto search</span> runs
            on a schedule. Last run today 06:00 CET.
          </span>
        </div>
        <Button size="sm">Re-run market scan</Button>
      </div>

      {/* Custom search: collapsed by default */}
      <div className="rounded-lg border border-border">
        <button
          className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm"
          onClick={() => setCustomOpen((v) => !v)}
        >
          <span className="flex items-center gap-2 text-muted-foreground">
            <Search className="h-4 w-4" />
            <span className="font-medium text-foreground">Custom search</span>
          </span>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${customOpen ? "rotate-180" : ""}`}
          />
        </button>
        {customOpen && (
          <div className="grid gap-3 border-t border-border px-4 py-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Netherlands">Netherlands</SelectItem>
                  <SelectItem value="Belgium">Belgium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Location</Label>
              <Input placeholder="e.g. Rotterdam" />
            </div>
          </div>
        )}
      </div>

      {/* Scenario controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate({ to: "/scenario" })}>
          <ListChecks className="mr-2 h-4 w-4" /> Select Scenarios
        </Button>
        <Button variant="outline" size="sm" onClick={() => setConfigOpen(true)}>
          <SlidersHorizontal className="mr-2 h-4 w-4" /> Adjust Weights
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Switch
            id="across"
            checked={acrossScenarios}
            onCheckedChange={setAcrossScenarios}
          />
          <Label htmlFor="across" className="text-sm">
            Across all scenarios
          </Label>
        </div>
      </div>

      {/* Table controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="w-56 pl-8"
            placeholder="Filter companies…"
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => mockDownload("table-only export")}>
              Table only
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => mockDownload("detailed view export")}>
              Detailed view
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {dl && <span className="text-xs text-muted-foreground">{dl}</span>}
        <Badge variant="secondary" className="ml-auto">
          {rows.length} counterparties
        </Badge>
      </div>

      {/* Inline advanced filters (no popup) */}
      {moreOpen && (
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">More filters</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setAdv({
                  businessLineType: "all",
                  market: "",
                  minVolume: 0,
                  minFit: 0,
                })
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
                onValueChange={(v) =>
                  setAdv((a) => ({ ...a, businessLineType: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Asset Owner">Asset Owner</SelectItem>
                  <SelectItem value="Trader">Trader</SelectItem>
                  <SelectItem value="Energy Supplier">Energy Supplier</SelectItem>
                  <SelectItem value="Large Consumer">Large Consumer</SelectItem>
                  <SelectItem value="Optimizer/Aggregator">
                    Optimizer/Aggregator
                  </SelectItem>
                  <SelectItem value="Service Provider">
                    Service Provider
                  </SelectItem>
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
              <Label className="text-xs">Min fit score</Label>
              <Input
                type="number"
                value={adv.minFit || ""}
                onChange={(e) =>
                  setAdv((a) => ({ ...a, minFit: Number(e.target.value) || 0 }))
                }
              />
            </div>
          </div>
        </Card>
      )}

      {/* Results table: CTA in the second column, compact, sortable headers */}
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
                  {cp.rejected ? (
                    <Badge variant="destructive">Rejected</Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() =>
                        navigate({
                          to: "/qualification/$id",
                          params: { id: cp.id },
                        })
                      }
                    >
                      Deep Dive
                    </Button>
                  )}
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
    </div>
  );
}
