import { useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight,
  BadgeCheck,
  ExternalLink,
  FileText,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import {
  dqTone,
  fitBarClass,
  fitColorClass,
  type Counterparty,
  type ScoreBreakdown,
} from "@/lib/data";
import { useStore, type Decision } from "@/lib/store";
import { AddToShortlist } from "@/components/AddToShortlist";

export const Route = createFileRoute("/qualification/$id")({
  head: () => ({
    meta: [
      { title: "Qualify counterparty - SEE Origination Scout" },
      { name: "description", content: "Qualify the shortlisted counterparty." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: QualificationScreen,
});

function ScoreBar({
  label,
  value,
  thresholds,
}: {
  label: string;
  value: number;
  thresholds: { green: number; amber: number; reject: number };
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className={`font-semibold ${fitColorClass(value, thresholds)}`}>
          {value}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full ${fitBarClass(value, thresholds)}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function QualificationScreen() {
  const { id } = useParams({ from: "/qualification/$id" });
  const {
    rankedCounterparties,
    config,
    decisions,
    recordDecision,
    startCrm,
    accountForCounterparty,
    shortlists,
    scoreFor,
    selectedScenarioId,
    scenarios,
  } = useStore();
  const navigate = useNavigate();
  const cp = rankedCounterparties.find((c) => c.id === id);
  const account = cp ? accountForCounterparty(cp.id) : undefined;
  const memberOfLists = cp
    ? shortlists.filter((s) => s.counterpartyIds.includes(cp.id))
    : [];

  const [choice, setChoice] = useState<Decision["choice"] | null>(null);
  const [rationale, setRationale] = useState("");
  const existing = cp ? decisions[cp.id] : undefined;

  if (!cp) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Counterparty not found.</p>
        <Button onClick={() => navigate({ to: "/prospecting" })}>
          Back to prospecting
        </Button>
      </div>
    );
  }

  const record = () => {
    if (!choice) return;
    recordDecision(cp.id, {
      choice,
      rationale,
      timestamp: new Date().toLocaleString(),
    });
    // Proceed promotes the counterparty into the micro-CRM.
    if (choice === "Proceed") startCrm(cp.id);
  };

  const suggestionTone =
    cp.suggestion === "Proceed"
      ? "default"
      : cp.suggestion === "Hold"
        ? "secondary"
        : "destructive";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Qualify the counterparty
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review the evidence and record your origination decision.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DataQualityChip cp={cp} />
          <AddToShortlist counterpartyId={cp.id} label="Add to shortlist" />
        </div>
      </div>

      {(account || memberOfLists.length > 0 || existing) && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
          {existing && (
            <Badge variant="secondary">Decision: {existing.choice}</Badge>
          )}
          {account &&
            (account.status === "deal-closed" ? (
              <Badge variant="destructive">Deal closed</Badge>
            ) : (
              <Badge>In CRM</Badge>
            ))}
          {account && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                navigate({
                  to: "/crm/$accountId",
                  params: { accountId: account.id },
                })
              }
            >
              Open CRM record <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          )}
          {memberOfLists.length > 0 && (
            <span className="text-muted-foreground">
              In shortlist: {memberOfLists.map((s) => s.name).join(", ")}
            </span>
          )}
        </div>
      )}

      <RegulatoryCard cp={cp} />
      <FinancialsCard cp={cp} />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* LEFT */}
        <div className="space-y-6">
          <Card className="space-y-4 p-5">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {cp.company}
              </h2>
              <p className="text-sm text-muted-foreground">
                {cp.sector} · {cp.country}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Annual volume
                </div>
                <div className="font-medium text-foreground">
                  {cp.annualVolume.toLocaleString()} GWh/yr
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Price hub
                </div>
                <div className="font-medium text-foreground">{cp.priceHub}</div>
              </div>
            </div>
            <div className="space-y-3 pt-2">
              <ScoreBar
                label="Seasonal swing need"
                value={cp.seasonalSwing}
                thresholds={config.thresholds}
              />
              <ScoreBar
                label="Creditworthiness"
                value={cp.creditworthiness}
                thresholds={config.thresholds}
              />
              <ScoreBar
                label="Strategic fit"
                value={cp.fit}
                thresholds={config.thresholds}
              />
            </div>
          </Card>

          <Card className="space-y-3 p-5">
            <h3 className="font-semibold text-foreground">Company profile</h3>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <Row label="Legal entity" value={cp.legalEntityName} />
              <Row label="LEI" value={cp.lei} />
              <Row label="Revenue / EBITDA" value={cp.revenueEbitda} />
              <Row label="Headcount" value={cp.headcount} />
              <Row label="Business line" value={cp.businessLineType} />
              <Row label="Sector" value={cp.businessLine} />
              <Row label="Portfolio size" value={cp.portfolioSize} />
              <Row label="Gas & power markets" value={cp.markets} />
              <Row label="Gas market" value={cp.gasMarket} />
              <Row label="Power market" value={cp.powerMarket} />
            </div>
          </Card>

          <Card className="space-y-3 p-5">
            <h3 className="font-semibold text-foreground">Relationship</h3>
            <div className="grid gap-2 text-sm">
              <Row label="Contact" value={cp.contact} />
              <Row label="Standing" value={cp.standing} />
              <Row label="Last contact" value={cp.lastContact} />
            </div>
          </Card>

          <Card className="space-y-3 p-5">
            <h3 className="font-semibold text-foreground">
              Evidence behind the estimates
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {cp.evidence.map((e, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" />
                  {e}
                </li>
              ))}
            </ul>
          </Card>

          <ScoreBreakdownCard
            breakdown={scoreFor(cp.id, selectedScenarioId)}
            scenarioTitle={
              scenarios.find((s) => s.id === selectedScenarioId)?.title ?? "Scenario"
            }
          />
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          <Card className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">
                Qualification assessment
              </h3>
              <Badge variant={suggestionTone as never}>
                AI: {cp.suggestion}
              </Badge>
            </div>
            <p className="text-xs italic text-muted-foreground">
              decision-support only — yours to decide
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Basis: </span>
              {cp.suggestionBasis}
            </p>

            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Fit score
                </div>
                <div
                  className={`font-semibold ${fitColorClass(cp.fit, config.thresholds)}`}
                >
                  {cp.fit}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Volume vs target
                </div>
                <div className="font-medium text-foreground">
                  {cp.annualVolume.toLocaleString()} /{" "}
                  {config.rules.targetVolume} GWh
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Indicative swing / sizing
                </div>
                <div className="font-medium text-foreground">
                  {cp.indicativeSizing}
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t border-border pt-4 text-sm">
              <Note label="Demand-profile fit" value={cp.demandProfileFit} />
              <Note label="Indicative sizing" value={cp.indicativeSizing} />
              <Note label="Key risk" value={cp.keyRisk} />
            </div>
          </Card>

          <Card className="space-y-4 p-5">
            <h3 className="font-semibold text-foreground">Your decision</h3>
            <div className="flex gap-2">
              {(["Proceed", "Hold", "Decline"] as const).map((c) => (
                <Button
                  key={c}
                  variant={choice === c ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setChoice(c)}
                >
                  {c}
                </Button>
              ))}
            </div>
            <Textarea
              placeholder="Rationale for your decision…"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={3}
            />
            <Button disabled={!choice} onClick={record}>
              Record decision
            </Button>

            {existing && (
              <div className="rounded-md border border-success/40 bg-success/10 p-3 text-sm">
                <div className="font-medium text-foreground">
                  Decision recorded: {existing.choice}
                </div>
                <div className="text-xs text-muted-foreground">
                  {existing.timestamp}
                </div>
                {existing.rationale && (
                  <p className="mt-1 text-muted-foreground">
                    {existing.rationale}
                  </p>
                )}
              </div>
            )}

            {existing?.choice === "Proceed" &&
              (() => {
                const acct = accountForCounterparty(cp.id);
                return acct ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      navigate({
                        to: "/crm/$accountId",
                        params: { accountId: acct.id },
                      })
                    }
                  >
                    Open CRM record <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : null;
              })()}
          </Card>
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-4">
        <Button
          variant="outline"
          onClick={() => navigate({ to: "/prospecting" })}
        >
          Back to counterparties
        </Button>
        <div className="flex gap-2">
          {memberOfLists.length > 0 && (
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/shortlists" })}
            >
              Back to shortlists
            </Button>
          )}
          <Button
            disabled={!choice && !existing}
            onClick={() => {
              if (choice) record();
              navigate(
                memberOfLists.length > 0
                  ? { to: "/shortlists" }
                  : { to: "/prospecting" },
              );
            }}
          >
            {choice ? "Record and return" : "Return"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function Note({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-medium text-foreground">{label}: </span>
      <span className="text-muted-foreground">{value}</span>
    </div>
  );
}

function DataQualityChip({ cp }: { cp: Counterparty }) {
  const { dataQuality } = useStore();
  const dq = dataQuality(cp);
  const tone = dqTone(dq.score);
  const cls =
    tone === "success"
      ? "bg-success/10 text-success"
      : tone === "warning"
        ? "bg-warning/15 text-warning"
        : "bg-muted text-muted-foreground";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}
      title="How well-evidenced this counterparty is (source quality, freshness, identity match)"
    >
      Data quality {dq.score}
    </span>
  );
}

type GleifLive = {
  lei: string;
  legalName: string;
  status: string;
  registrationStatus: string;
  corroboration: string;
  hq: string;
  lastUpdate: string;
};

// Real, sourced regulatory identity for the featured counterparty. Ofgem data is
// a verified snapshot; GLEIF is fetched live from the global LEI register on click.
function RegulatoryCard({ cp }: { cp: Counterparty }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [live, setLive] = useState<GleifLive | null>(null);
  if (!cp.regulatory || !cp.gleif) return null;
  const reg = cp.regulatory;
  const snap = cp.gleif;

  const verify = async () => {
    setState("loading");
    try {
      const res = await fetch(
        `https://api.gleif.org/api/v1/lei-records/${cp.lei}`,
      );
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      const a = json?.data?.attributes;
      const e = a?.entity;
      const r = a?.registration;
      const addr = e?.legalAddress;
      setLive({
        lei: a?.lei ?? cp.lei,
        legalName: e?.legalName?.name ?? snap.legalName,
        status: e?.status ?? snap.status,
        registrationStatus: r?.status ?? snap.registrationStatus,
        corroboration: r?.corroborationLevel ?? snap.corroboration,
        hq: addr ? `${addr.city}, ${addr.country}` : snap.hq,
        lastUpdate: (r?.lastUpdateDate ?? "").slice(0, 10) || snap.lastUpdate,
      });
      setState("done");
    } catch {
      setState("error");
    }
  };

  const shown: GleifLive = live ?? {
    lei: snap.lei,
    legalName: snap.legalName,
    status: snap.status,
    registrationStatus: snap.registrationStatus,
    corroboration: snap.corroboration,
    hq: snap.hq,
    lastUpdate: snap.lastUpdate,
  };

  return (
    <Card className="space-y-4 border-success/30 p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-success" />
        <h3 className="font-semibold text-foreground">Regulatory identity</h3>
        <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
          Real data, verified sources
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
              Tier 1
            </span>
            <span className="text-sm font-semibold text-foreground">
              Ofgem licensee register
            </span>
          </div>
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">
                Company number:
              </span>{" "}
              {reg.companyNumber}
            </div>
            {reg.electricity && <div>{reg.electricity}</div>}
            {reg.gas && <div>{reg.gas}</div>}
            <div className="text-[11px]">Retrieved {reg.retrieved}</div>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-[11px]">
            <a
              className="inline-flex items-center gap-1 text-brand-blue hover:underline"
              href={reg.electricityUrl}
              target="_blank"
              rel="noreferrer"
            >
              Electricity list <ExternalLink className="h-3 w-3" />
            </a>
            <a
              className="inline-flex items-center gap-1 text-brand-blue hover:underline"
              href={reg.gasUrl}
              target="_blank"
              rel="noreferrer"
            >
              Gas list <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                Tier 1
              </span>
              <span className="text-sm font-semibold text-foreground">
                GLEIF (LEI)
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={verify}
              disabled={state === "loading"}
            >
              {state === "loading" ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Verifying
                </>
              ) : state === "done" ? (
                <>
                  <BadgeCheck className="mr-1.5 h-3.5 w-3.5 text-success" /> Verified
                  live
                </>
              ) : (
                "Verify live"
              )}
            </Button>
          </div>
          {state === "idle" ? (
            <p className="text-sm text-muted-foreground">
              Look up the legal entity in the global LEI register in real time.
            </p>
          ) : (
            <div className="space-y-1.5 text-sm text-muted-foreground">
              <div className="font-medium text-foreground">
                {shown.legalName}
              </div>
              <div>LEI {shown.lei}</div>
              <div>
                Status: {shown.status} · {shown.registrationStatus}
              </div>
              <div>{shown.corroboration.replace(/_/g, " ").toLowerCase()}</div>
              <div>
                {shown.hq} · updated {shown.lastUpdate}
              </div>
              {state === "error" && (
                <div className="text-[11px] text-warning">
                  Live lookup unavailable; showing last verified record.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {snap.note && (
        <p className="text-[11px] text-muted-foreground">{snap.note}</p>
      )}
    </Card>
  );
}

// Real filed financials (Companies House / audited accounts), verified snapshot.
function FinancialsCard({ cp }: { cp: Counterparty }) {
  const f = cp.financials;
  if (!f) return null;
  const rows = [
    { label: "Revenue", value: f.revenue, sub: f.revenueGrowth },
    { label: "Adjusted EBITDA", value: f.adjEbitda },
    { label: "Profit before tax", value: f.profitBeforeTax },
    { label: "Net cash", value: f.netCash },
    { label: "Delivered volume", value: f.deliveredVolume },
  ].filter((r) => r.value);

  return (
    <Card className="space-y-4 border-success/30 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <FileText className="h-5 w-5 text-success" />
        <h3 className="font-semibold text-foreground">Financials</h3>
        <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
          Companies House · Tier 1 · verified snapshot
        </span>
        <span className="text-xs text-muted-foreground">{f.fiscalYear}</span>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="text-xs text-muted-foreground">{r.label}</div>
            <div className="text-lg font-semibold text-foreground">
              {r.value}
            </div>
            {r.sub && <div className="text-[11px] text-success">{r.sub}</div>}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-[11px] text-muted-foreground">
        <span>
          {f.basis}. {f.source}. Retrieved {f.retrieved}.
        </span>
        <a
          className="inline-flex items-center gap-1 text-brand-blue hover:underline"
          href={f.url}
          target="_blank"
          rel="noreferrer"
        >
          Annual report <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </Card>
  );
}

function ScoreBreakdownCard({
  breakdown,
  scenarioTitle,
}: {
  breakdown: ScoreBreakdown;
  scenarioTitle: string;
}) {
  return (
    <Card className="space-y-3 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Score breakdown</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{scenarioTitle}</span>
          {breakdown.blocked ? (
            <Badge variant="destructive">Blocked</Badge>
          ) : (
            <Badge>Fit {breakdown.fit}</Badge>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        How the fit is built, down to the source value.
      </p>
      <div className="space-y-3">
        {breakdown.criteria.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No criteria configured for this scenario.
          </p>
        )}
        {breakdown.criteria.map((c) => (
          <div key={c.id} className="overflow-hidden rounded-md border border-border">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-1.5 text-sm">
              <span className="font-medium text-foreground">{c.label}</span>
              <span className="text-xs text-muted-foreground">
                weight {c.weight} · score{" "}
                <span className="font-semibold text-foreground">
                  {c.blocked ? "blocked" : c.score}
                </span>
              </span>
            </div>
            <ul className="divide-y divide-border">
              {c.subs.length === 0 && (
                <li className="px-3 py-2 text-xs text-muted-foreground">
                  No sub-criteria.
                </li>
              )}
              {c.subs.map((s) => (
                <li key={s.id} className="px-3 py-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">{s.label}</span>
                    <span className="font-semibold text-foreground">
                      {s.skipped ? "skipped" : s.subScore}
                    </span>
                  </div>
                  <div className="mt-0.5 text-muted-foreground">
                    {s.rawValue ?? "no data"}
                    {s.unit ? ` ${s.unit}` : ""} · {s.ruleType} · weight {s.weight}
                    {s.blocked && (
                      <span className="ml-1 text-destructive">· blocks</span>
                    )}
                  </div>
                  {s.source && (
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground/70">
                      <span>source: {s.source}</span>
                      {s.sourceTier && (
                        <span className="rounded bg-muted px-1 font-medium text-muted-foreground">
                          T{s.sourceTier}
                        </span>
                      )}
                      {s.retrieved && <span>· {s.retrieved}</span>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}
