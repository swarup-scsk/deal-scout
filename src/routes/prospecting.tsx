import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowUpDown,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
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

const signals = [
  { label: "EU Gas Storage", value: "61% full", tone: "text-brand-blue" },
  { label: "TTF Summer–Winter Spread", value: "+€4.20/MWh", tone: "text-success" },
  { label: "Regulatory", value: "REMIT stable", tone: "text-muted-foreground" },
];

function ProspectingScreen() {
  const { rankedCounterparties, config, scenarios, selectedScenarioId, setConfigOpen } =
    useStore();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");
  const [country, setCountry] = useState("all");
  const [sortKey, setSortKey] = useState<
    "fit" | "annualVolume" | "margin" | "company" | "country"
  >("fit");
  const [sortDesc, setSortDesc] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [advOpen, setAdvOpen] = useState(false);
  const [adv, setAdv] = useState({
    businessLineType: "all",
    market: "",
    minVolume: 0,
    minFit: 0,
  });
  const [acrossScenarios, setAcrossScenarios] = useState(false);

  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId);

  // Best-fit scenario per counterparty, treating each scenario's criteria as weights.
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
  rows = [...rows].sort((a, b) => {
    if (sortKey === "company" || sortKey === "country") {
      const cmp = a[sortKey].localeCompare(b[sortKey]);
      return sortDesc ? -cmp : cmp;
    }
    return sortDesc ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey];
  });

  const pageIds = rows.map((r) => r.id);
  const allSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const toggleOne = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const toggleAll = () =>
    setSelected(() => (allSelected ? new Set<string>() : new Set(pageIds)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          AI-Assisted Prospecting
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Scanning {config.scope.region} for counterparties that fit{" "}
          <span className="font-medium text-foreground">
            {selectedScenario?.title}
          </span>{" "}
          — ranked by weighted fit against your active rules.
        </p>
      </div>

      {/* Search modes */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <RefreshCw className="h-4 w-4 text-brand-blue" /> Auto Search
            </div>
            <span className="text-xs text-muted-foreground">
              Last run: today 06:00 CET
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Scheduled market scan across public registers and market data.
          </p>
          <Button variant="outline" size="sm">
            Re-run market scan
          </Button>
        </Card>

        <Card className="space-y-3 p-4">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Search className="h-4 w-4 text-brand-blue" /> Manual Query
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Country</Label>
              <Select defaultValue="all">
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
          <Button variant="outline" size="sm" onClick={() => setAdvOpen(true)}>
            Advanced Search
          </Button>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
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

      {/* Active rules */}
      <Card className="flex flex-wrap items-center gap-x-3 gap-y-1 border-primary/30 bg-primary/5 p-3 text-sm text-foreground">
        <span className="font-medium">Active rules:</span>
        <span className="text-muted-foreground">
          Target volume ≥ {config.rules.targetVolume} GWh/yr
        </span>
        <span className="text-border">·</span>
        <span className="text-muted-foreground">
          Fit thresholds ≥ {config.rules.fitHigh} / ≥ {config.rules.fitMid}
        </span>
        <span className="text-border">·</span>
        <span className="text-muted-foreground">
          Return gate: hard-reject &lt; €{config.rules.returnGate.toLocaleString()}{" "}
          margin
        </span>
      </Card>

      {/* Market signals */}
      <div className="grid gap-4 sm:grid-cols-3">
        {signals.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {s.label}
            </div>
            <div className={`mt-1 text-lg font-semibold ${s.tone}`}>
              {s.value}
            </div>
          </Card>
        ))}
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
        <Button variant="outline" size="sm" onClick={() => setAdvOpen(true)}>
          <SlidersHorizontal className="mr-2 h-4 w-4" /> Advanced Search
        </Button>
        <Select
          value={sortKey}
          onValueChange={(v) => setSortKey(v as typeof sortKey)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Rank by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fit">Rank by fit</SelectItem>
            <SelectItem value="annualVolume">Rank by volume</SelectItem>
            <SelectItem value="margin">Rank by margin</SelectItem>
            <SelectItem value="company">Sort by company</SelectItem>
            <SelectItem value="country">Sort by country</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => setSortDesc((v) => !v)}>
          <ArrowUpDown className="mr-2 h-4 w-4" /> {sortDesc ? "Desc" : "Asc"}
        </Button>
        {selected.size > 0 && (
          <Badge className="bg-brand-blue text-white">
            {selected.size} selected
          </Badge>
        )}
        <Badge variant="secondary" className="ml-auto">
          {rows.length} counterparties
        </Badge>
      </div>

      {/* Results table */}
      <Card className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Legal Entity Name</TableHead>
              <TableHead>LEI</TableHead>
              <TableHead>Revenue/EBITDA</TableHead>
              <TableHead>Headcount</TableHead>
              <TableHead>Business line</TableHead>
              <TableHead>Portfolio</TableHead>
              <TableHead>Gas &amp; Power Markets</TableHead>
              <TableHead className="text-right">Volume</TableHead>
              <TableHead className="min-w-48">AI Insight</TableHead>
              {acrossScenarios && <TableHead>Best-fit scenario</TableHead>}
              <TableHead className="w-40">Fit score</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((cp, i) => (
              <TableRow
                key={cp.id}
                data-state={selected.has(cp.id) ? "selected" : undefined}
              >
                <TableCell>
                  <Checkbox
                    checked={selected.has(cp.id)}
                    onCheckedChange={() => toggleOne(cp.id)}
                    aria-label={`Select ${cp.company}`}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell>
                  <div className="font-medium text-foreground">{cp.company}</div>
                  <div className="mt-0.5 flex gap-1">
                    {cp.margin < config.rules.returnGate && (
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
                </TableCell>
                <TableCell>{cp.country}</TableCell>
                <TableCell className="text-muted-foreground">
                  {cp.legalEntityName}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {cp.lei}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {cp.revenueEbitda}
                </TableCell>
                <TableCell>{cp.headcount}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <div className="text-foreground">{cp.businessLineType}</div>
                  <div className="text-xs text-muted-foreground">
                    {cp.businessLine}
                  </div>
                </TableCell>
                <TableCell>{cp.portfolioSize}</TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  {cp.markets}
                </TableCell>
                <TableCell className="whitespace-nowrap text-right">
                  {cp.annualVolume.toLocaleString()} GWh
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {cp.aiInsight}
                </TableCell>
                {acrossScenarios && (
                  <TableCell className="text-sm">
                    {acrossInfo[cp.id].title}
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full ${fitBarClass(cp.fit, config.thresholds)}`}
                        style={{ width: `${cp.fit}%` }}
                      />
                    </div>
                    <span
                      className={`w-6 text-right text-sm font-semibold ${fitColorClass(cp.fit, config.thresholds)}`}
                    >
                      {cp.fit}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={advOpen} onOpenChange={setAdvOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Advanced Search</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
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
                placeholder="e.g. high-pressure grid, ZTP, France"
                value={adv.market}
                onChange={(e) =>
                  setAdv((a) => ({ ...a, market: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Min volume (GWh/yr)</Label>
                <Input
                  type="number"
                  value={adv.minVolume || ""}
                  onChange={(e) =>
                    setAdv((a) => ({
                      ...a,
                      minVolume: Number(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Min fit score</Label>
                <Input
                  type="number"
                  value={adv.minFit || ""}
                  onChange={(e) =>
                    setAdv((a) => ({
                      ...a,
                      minFit: Number(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
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
            <Button onClick={() => setAdvOpen(false)}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
