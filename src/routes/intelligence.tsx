import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ExternalLink,
  Minus,
  Newspaper,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import type { NewsSignal, SignalImpact } from "@/lib/data";

export const Route = createFileRoute("/intelligence")({
  head: () => ({
    meta: [
      { title: "Intelligence - SEE Origination Scout" },
      {
        name: "description",
        content:
          "News and market signals relevant to the counterparty universe. Context only; signals never change a score.",
      },
    ],
  }),
  component: Intelligence,
});

export function ImpactIcon({ impact }: { impact: SignalImpact }) {
  if (impact === "up") return <TrendingUp className="h-4 w-4 text-success" />;
  if (impact === "down") return <TrendingDown className="h-4 w-4 text-warning" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

const CATS: { v: string; l: string }[] = [
  { v: "all", l: "All" },
  { v: "market", l: "Market" },
  { v: "news", l: "Company news" },
  { v: "financial", l: "Financial" },
  { v: "regulatory", l: "Regulatory" },
];

function Intelligence() {
  const { newsSignals, rankedCounterparties, readSignals, markAllSignalsRead } =
    useStore();
  const [cat, setCat] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const nameOf = useMemo(() => {
    const m = new Map(rankedCounterparties.map((c) => [c.id, c.company]));
    return (id?: string) => (id ? m.get(id) : undefined);
  }, [rankedCounterparties]);

  const items = newsSignals
    .filter((s) => (cat === "all" ? true : s.category === cat))
    .filter((s) => (unreadOnly ? s.notify && !readSignals.includes(s.id) : true))
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
            <Newspaper className="h-6 w-6 text-brand-blue" /> Intelligence
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            News and market signals relevant to your counterparties and markets.
            Each is sourced and dated. Signals are context for your judgement; they
            never change a score.
          </p>
        </div>
        <button
          onClick={markAllSignalsRead}
          className="rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/60"
        >
          Mark all read
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {CATS.map((c) => (
          <button
            key={c.v}
            onClick={() => setCat(c.v)}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              cat === c.v
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:bg-muted/60"
            }`}
          >
            {c.l}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-border" />
        <button
          onClick={() => setUnreadOnly((v) => !v)}
          className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
            unreadOnly
              ? "border-brand-blue bg-brand-blue/10 text-brand-blue"
              : "border-border bg-card text-muted-foreground hover:bg-muted/60"
          }`}
        >
          Unread alerts only
        </button>
      </div>

      <div className="space-y-3">
        {items.map((s) => (
          <SignalCard key={s.id} s={s} cpName={nameOf(s.counterpartyId)} />
        ))}
        {items.length === 0 && (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            No signals match.
          </Card>
        )}
      </div>
    </div>
  );
}

function SignalCard({ s, cpName }: { s: NewsSignal; cpName?: string }) {
  const tag = cpName ?? s.market;
  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <div className="mt-0.5">
          <ImpactIcon impact={s.impact} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{s.headline}</h3>
            {tag && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {tag}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{s.summary}</p>
          {s.why && (
            <p className="mt-1.5 text-[13px] text-foreground">
              <span className="font-medium">Why it matters: </span>
              {s.why}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <span>
              {s.source} · {s.date}
            </span>
            {s.url && (
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-brand-blue hover:underline"
              >
                Source <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {s.counterpartyId && (
              <Link
                to="/qualification/$id"
                params={{ id: s.counterpartyId }}
                className="inline-flex items-center gap-1 text-brand-blue hover:underline"
              >
                Open counterparty
              </Link>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
