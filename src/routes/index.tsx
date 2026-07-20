import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ListChecks, Target, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SEE Origination Scout" },
      {
        name: "description",
        content:
          "Find, qualify and pursue energy counterparties. Start from the counterparty universe.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="space-y-10">
      <div className="rounded-xl border border-border bg-card p-10">
        <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-medium text-brand-blue">
          SEE Origination Scout
        </span>
        <h1 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-foreground">
          Find, qualify and pursue energy counterparties in one place.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Scout takes the counterparty universe, scores it against your
          origination scenarios, and carries the ones worth pursuing through
          qualification into a lightweight CRM. Start from the universe.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="default">
            <Link to="/prospecting">
              Go to counterparties <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/scenario">Configure scenarios</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Feature
          icon={<Users className="h-5 w-5" />}
          title="Counterparty universe"
          body="Browse every counterparty. Apply a scenario to score and rank them."
          to="/prospecting"
          cta="Open universe"
        />
        <Feature
          icon={<ListChecks className="h-5 w-5" />}
          title="Shortlists"
          body="Group the counterparties you want to pursue into named lists."
          to="/shortlists"
          cta="View shortlists"
        />
        <Feature
          icon={<Target className="h-5 w-5" />}
          title="Micro-CRM"
          body="Once you decide to proceed, manage accounts, contacts and outreach."
          to="/crm"
          cta="Open CRM"
        />
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
  to,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  to: string;
  cta: string;
}) {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {icon}
      </span>
      <div>
        <div className="font-semibold text-foreground">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
      <Link
        to={to}
        className="mt-auto inline-flex items-center text-sm font-medium text-brand-blue hover:opacity-80"
      >
        {cta} <ArrowRight className="ml-1.5 h-4 w-4" />
      </Link>
    </Card>
  );
}
