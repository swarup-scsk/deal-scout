import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "How it works - SEE Origination Scout" },
      {
        name: "description",
        content:
          "Plain-language guide to how Scout gathers data, scores counterparties, and how you work through it.",
      },
    ],
  }),
  component: Faq,
});

// High-level pipeline: how a fact becomes a scored, sourced counterparty record.
const PIPELINE = [
  {
    t: "Allow-listed sources",
    s: "Pull only from approved registers and feeds, by tier.",
  },
  {
    t: "Resolve identity",
    s: "Match every record to one legal entity, keyed on its LEI.",
  },
  {
    t: "Tag provenance",
    s: "Stamp each field with its source, tier and retrieved date.",
  },
  {
    t: "Resolve conflicts",
    s: "When sources disagree, the higher tier wins.",
  },
  {
    t: "Score data quality",
    s: "A confidence score per field and per counterparty.",
  },
  {
    t: "AI augmentation (guardrailed)",
    s: "Fill gaps only from retrieved, allow-listed sources.",
  },
  {
    t: "Human review",
    s: "Low-confidence or conflicting records go to a person.",
  },
  {
    t: "Into Scout",
    s: "Scored, ranked and fully sourced counterparty records.",
  },
];

// High-level originator workflow through the app.
const WORKFLOW = [
  { t: "Counterparties", s: "browse the universe" },
  { t: "Apply a scenario", s: "get fit + data quality" },
  { t: "Deep dive", s: "verified data + score breakdown" },
  { t: "Decide", s: "proceed, hold or decline" },
  { t: "CRM", s: "outreach and record the deal" },
];

const TIERS = [
  {
    tier: "Tier 1",
    tone: "success",
    what: "Official and regulatory registers. The most authoritative.",
    eg: "ACER CEREMP, Ofgem, GLEIF (LEI), Companies House",
  },
  {
    tier: "Tier 2",
    tone: "accent",
    what: "Market infrastructure and standards bodies. Strong corroboration.",
    eg: "EEX / ICE membership, ENTSOG / ENTSO-E, GIE storage",
  },
  {
    tier: "Tier 3",
    tone: "warning",
    what: "Commercial data providers. Enrichment once identity is confirmed.",
    eg: "Dun & Bradstreet, ZoomInfo, credit data",
  },
  {
    tier: "Tier 4",
    tone: "muted",
    what: "Open web and AI-generated. Used only to augment, never on its own.",
    eg: "Company websites, news, model suggestions",
  },
];

const toneCls: Record<string, string> = {
  success: "bg-success/10 text-success",
  accent: "bg-accent text-accent-foreground",
  warning: "bg-warning/15 text-warning",
  muted: "bg-muted text-muted-foreground",
};

const FAQS = [
  {
    q: "Where does the counterparty data come from?",
    a: "Scout draws on public and licensed sources: energy regulators' registers of licensed market participants, legal-entity identity (LEI), exchange and clearing membership, market transparency platforms, and commercial firmographics. Today one counterparty (Yü Energy) already carries real data from Ofgem, GLEIF and Companies House; the rest is realistic synthetic data, and the design is ready to connect every source.",
  },
  {
    q: "How does data get into Scout?",
    a: "Through a pipeline. Scout pulls only from an approved (allow-listed) set of sources, resolves each record to a single legal entity using its LEI, tags every field with its source, tier and date, resolves any conflicts by letting the higher tier win, scores how well-evidenced the record is, uses AI to fill gaps only from retrieved sources, and routes anything low-confidence to a person before it is used. See the pipeline diagram above for the high-level flow.",
  },
  {
    q: "What do the source tiers (Tier 1 to Tier 4) mean?",
    a: "Every fact carries the source it came from, ranked by how authoritative that source is. Tier 1 is official registers, Tier 2 is market infrastructure, Tier 3 is commercial data, and Tier 4 is open web or AI. Higher tiers count for more, and a Tier 4 claim can never override a Tier 1 register.",
  },
  {
    q: "Can we change which sources are trusted?",
    a: "Yes. The Sources screen (under Configuration) is an editable registry: an administrator can add or remove sources, set each source's tier, tune how much each tier counts toward data quality, and map which source backs each data field. Each source also carries a short note explaining what it is and how it is accessed.",
  },
  {
    q: "What is the data-quality score, and how is it different from the fit score?",
    a: "The fit score says how attractive a counterparty is for your scenario. The data-quality score says how well-evidenced that picture is, based on the tier of the sources behind it, how fresh they are, and whether the entity is cleanly identified (for example, has an LEI). A high fit with a low data quality is a prompt to verify before acting.",
  },
  {
    q: "How is a counterparty scored?",
    a: "Each scenario uses a small set of criteria, and each criterion has one or more checks (sub-criteria). A check reads one data field, compares it against a rule you set (for example, more is better between two thresholds), and produces a 0 to 100 score. Checks roll up by importance into a criterion score, and criteria roll up by weight into the overall fit. Some checks can act as a go / no-go that blocks a counterparty.",
  },
  {
    q: "Can I see why a counterparty got its score?",
    a: "Yes. On a counterparty's deep dive, the score breakdown shows every criterion and check, the raw value used, the score it produced, and the source, tier and date that value came from. The verified-data card at the top shows the real, sourced identity, licence and financials. Nothing is a black box.",
  },
  {
    q: "How do you stop the AI from making things up?",
    a: "The AI only helps find candidates and draft text; it cannot invent a scored fact. Retrieval is restricted to an approved list of sources, every field records where it came from and when, higher-quality sources win when sources disagree, and low-confidence or unverified counterparties are flagged for a person to review before they are acted on.",
  },
  {
    q: "Who decides the criteria and thresholds?",
    a: "There are two layers. An administrator maintains the shared library of criteria and their scoring logic. Originators then compose a scenario from that library and fine-tune it for their deal, switching checks on or off and adjusting weights and thresholds, with a one-click reset back to the library defaults.",
  },
  {
    q: "Is the data live right now?",
    a: "Mostly synthetic, with real exceptions. For the featured counterparty, the GLEIF identity check runs live against the global LEI register, and the Ofgem licence and Companies House financials are real, dated snapshots. The rest of the universe is realistic synthetic data. Connecting all the registers and feeds through the pipeline is a production step, and the app is built so that plugging them in does not change the screens.",
  },
];

function StepStrip({ steps }: { steps: { t: string; s: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((f, i) => (
        <div key={f.t} className="flex items-center gap-2">
          <div className="rounded-lg bg-muted/60 px-3 py-2">
            <div className="text-sm font-medium text-foreground">{f.t}</div>
            <div className="text-[11px] text-muted-foreground">{f.s}</div>
          </div>
          {i < steps.length - 1 && (
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </div>
      ))}
    </div>
  );
}

function Faq() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          How it works
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A plain-language guide to where the data comes from, how it reaches
          Scout, how counterparties are scored, and how you work through it.
        </p>
      </div>

      <Card className="p-4">
        <div className="mb-1 text-sm font-medium text-foreground">
          Your workflow
        </div>
        <p className="mb-3 text-[11px] text-muted-foreground">
          The path from the counterparty universe to a recorded decision.
        </p>
        <StepStrip steps={WORKFLOW} />
      </Card>

      <Card className="p-4">
        <div className="mb-1 text-sm font-medium text-foreground">
          How data reaches Scout (the pipeline)
        </div>
        <p className="mb-3 text-[11px] text-muted-foreground">
          Every counterparty fact is sourced, resolved and quality-scored before
          it is used.
        </p>
        <ol className="space-y-2">
          {PIPELINE.map((p, i) => (
            <li key={p.t} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-xs font-semibold text-brand-blue">
                {i + 1}
              </span>
              <div>
                <div className="text-sm font-medium text-foreground">{p.t}</div>
                <div className="text-[11px] text-muted-foreground">{p.s}</div>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="p-4">
        <div className="mb-3 text-sm font-medium text-foreground">
          Source quality tiers
        </div>
        <div className="space-y-2">
          {TIERS.map((t) => (
            <div
              key={t.tier}
              className="flex flex-wrap items-start gap-3 border-b border-border pb-2 last:border-b-0 last:pb-0"
            >
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${toneCls[t.tone]}`}
              >
                {t.tier}
              </span>
              <div className="flex-1">
                <div className="text-sm text-foreground">{t.what}</div>
                <div className="text-[11px] text-muted-foreground">
                  For example: {t.eg}
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Higher tiers carry more weight. A Tier 4 web or AI claim can never
          override a Tier 1 register. You can tune these on the Sources screen.
        </p>
      </Card>

      <div>
        <div className="mb-2 text-sm font-medium text-foreground">
          Frequently asked questions
        </div>
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((f, i) => (
            <AccordionItem key={i} value={`q${i}`}>
              <AccordionTrigger className="text-left text-sm font-medium">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
