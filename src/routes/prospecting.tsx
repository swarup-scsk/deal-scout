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
import { fitBarClass, fitColorClass } from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/prospecting")({
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
  const [sortDesc, setSortDesc] = useState(true);

  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId);

  let rows = rankedCounterparties.filter((cp) => {
    const matchText =
      cp.company.toLowerCase().includes(filter.toLowerCase()) ||
      cp.businessLine.toLowerCase().includes(filter.toLowerCase());
    const matchCountry = country === "all" || cp.country === country;
    return matchText && matchCountry;
  });
  rows = [...rows].sort((a, b) => (sortDesc ? b.fit - a.fit : a.fit - b.fit));

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
          <Button variant="outline" size="sm">
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortDesc((v) => !v)}
        >
          <ArrowUpDown className="mr-2 h-4 w-4" /> Sort by fit{" "}
          {sortDesc ? "↓" : "↑"}
        </Button>
        <Badge variant="secondary" className="ml-auto">
          {rows.length} counterparties
        </Badge>
      </div>

      {/* Results table */}
      <Card className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
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
              <TableHead className="w-40">Fit score</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((cp, i) => (
              <TableRow key={cp.id}>
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
    </div>
  );
}
