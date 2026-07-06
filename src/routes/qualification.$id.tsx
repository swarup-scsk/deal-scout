import { useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { fitBarClass, fitColorClass } from "@/lib/data";
import { useStore, type Decision } from "@/lib/store";

export const Route = createFileRoute("/qualification/$id")({
  head: () => ({
    meta: [
      { title: "Qualify counterparty — SEE Origination Scout" },
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
  const { rankedCounterparties, config, decisions, recordDecision } = useStore();
  const navigate = useNavigate();
  const cp = rankedCounterparties.find((c) => c.id === id);

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
  };

  const suggestionTone =
    cp.suggestion === "Proceed"
      ? "default"
      : cp.suggestion === "Hold"
        ? "secondary"
        : "destructive";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Qualify the counterparty
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review the evidence and record your origination decision.
        </p>
      </div>

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
          </Card>
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-4">
        <Button
          variant="outline"
          onClick={() => navigate({ to: "/prospecting" })}
        >
          Back to prospecting
        </Button>
        <Button
          onClick={() => {
            record();
            navigate({ to: "/prospecting" });
          }}
        >
          Record &amp; return to shortlist
        </Button>
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
