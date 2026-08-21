import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CircleHelp } from "lucide-react";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/setup-guide")({
  head: () => ({
    meta: [
      { title: "Admin setup guide - SEE Origination Scout" },
      {
        name: "description",
        content:
          "A plain-language, step-by-step guide for admins: from a data source to a scored deep dive.",
      },
    ],
  }),
  component: SetupGuide,
});

type Stage = {
  n: string;
  title: string;
  tone: string;
  sub: string;
  steps: { act: string; desc: string }[];
};

const STAGES: Stage[] = [
  {
    n: "1",
    title: "Sources",
    tone: "brand-blue",
    sub: "Tell the app what data it can use, and where each piece comes from.",
    steps: [
      {
        act: "Open Sources",
        desc: "In the left menu under Configuration, click Sources. This screen is where data lives.",
      },
      {
        act: "Add a data field",
        desc: "Click Add data field. Give it a name (for example, Net debt), a unit (for example, EUR M), and a type (a number, or a yes / no). A data field is one fact about a counterparty.",
      },
      {
        act: "Point the field at a source",
        desc: "Below, choose which source provides that field for each region, and set how much you trust each tier. A field needs a source before it can be used to score anything.",
      },
    ],
  },
  {
    n: "2",
    title: "Library",
    tone: "success",
    sub: "Decide how each fact turns into a 0 to 100 score.",
    steps: [
      {
        act: "Open Library",
        desc: "Under Configuration, click Library. Pick a criterion on the left, or click Add criterion. A criterion is one thing you are judging, like Balance sheet fit.",
      },
      {
        act: "Add a rule",
        desc: "Click Add sub-criterion, then choose the Data field. If the field does not exist yet, click + New field to create and connect it here, without leaving this screen.",
      },
      {
        act: "Choose how it scores",
        desc: "Pick a rule in plain words, like Higher is better. The thresholds fill in for you. Adjust the two numbers and watch the score curve show what each value would score.",
      },
      {
        act: "Set importance and where it applies",
        desc: "Slide Importance to say how much this rule counts. Under Applies to scenarios, leave All scenarios or pick specific ones. Rarely used settings sit under Advanced.",
      },
    ],
  },
  {
    n: "3",
    title: "Scenarios",
    tone: "warning",
    sub: "Weight the criteria differently for each type of deal.",
    steps: [
      {
        act: "Open Scenarios",
        desc: "Under Configuration, click Scenarios and choose the deal type you are setting up, for example Demand market access.",
      },
      {
        act: "Weight the criteria",
        desc: "Bring in the criteria that matter for that deal, set how much each one counts, then click Save all to publish. Criteria you tagged in the Library already appear here.",
      },
    ],
  },
  {
    n: "4",
    title: "Counterparties and deep dive",
    tone: "brand-blue",
    sub: "See it score, then make the call.",
    steps: [
      {
        act: "Open Counterparties",
        desc: "Under Prospecting, click Counterparties and pick your scenario in the dropdown. The list ranks counterparties by fit, and shows a separate data-quality score.",
      },
      {
        act: "Open a deep dive",
        desc: "Click a counterparty. Check the verified data (Verify live confirms the identity against the global LEI register), then read the score breakdown, where every number links back to its source.",
      },
      {
        act: "Make the call",
        desc: "Choose Proceed, Hold or Decline and add a short reason. Proceed moves the counterparty into the CRM. Your new field and rule now show up in the breakdown.",
      },
    ],
  },
];

const toneText: Record<string, string> = {
  "brand-blue": "text-brand-blue",
  success: "text-success",
  warning: "text-warning",
};
const toneBg: Record<string, string> = {
  "brand-blue": "bg-brand-blue",
  success: "bg-success",
  warning: "bg-warning",
};

function SetupGuide() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Admin setup guide
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A step-by-step walk from a data source to a scored deep dive. Do the four
          stages in order the first time; after that you can jump straight to the part
          you need.
        </p>
        <Link
          to="/faq"
          className="mt-2 inline-flex items-center gap-1.5 text-sm text-brand-blue hover:underline"
        >
          <CircleHelp className="h-4 w-4" /> New here? Read How it works first
        </Link>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            ["Sources", "brand-blue"],
            ["Library", "success"],
            ["Scenarios", "warning"],
            ["Deep dive", "brand-blue"],
          ].map(([label, tone], i, arr) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-white ${toneBg[tone]}`}
              >
                {i + 1}
              </span>
              <span className="text-sm font-medium text-foreground">{label}</span>
              {i < arr.length - 1 && (
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      </Card>

      {STAGES.map((st) => (
        <Card key={st.n} className="p-5">
          <div className="mb-3 flex items-center gap-3">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-base font-semibold text-white ${toneBg[st.tone]}`}
            >
              {st.n}
            </span>
            <div>
              <div className="text-base font-semibold text-foreground">{st.title}</div>
              <div className="text-xs text-muted-foreground">{st.sub}</div>
            </div>
          </div>
          <ol className="space-y-3">
            {st.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold ${toneText[st.tone]}`}
                >
                  {i + 1}
                </span>
                <div>
                  <div className="text-sm font-medium text-foreground">{s.act}</div>
                  <div className="text-[13px] leading-relaxed text-muted-foreground">
                    {s.desc}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      ))}

      <Card className="p-5">
        <div className="mb-2 text-sm font-semibold text-foreground">Good to know</div>
        <ul className="space-y-2 text-[13px] leading-relaxed text-muted-foreground">
          <li>
            Sign in as an admin. The Library and Sources are yours to set up; originators
            use them but cannot change them.
          </li>
          <li>
            Do it in order. A field must be created and pointed at a source before a rule
            can score it, which is why the flow starts at Sources.
          </li>
          <li>
            Click Save all to publish your changes. Scenario weights and thresholds can
            also be tuned per scenario.
          </li>
          <li>
            Scores are explainable: every value traces back to its source. AI helps you
            find, summarise and draft, but it never sets a score.
          </li>
          <li>
            A brand-new field has no counterparty data yet, so it shows as no data until
            the real feed is connected. That is expected in the prototype.
          </li>
        </ul>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Link
          to="/sources"
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50"
        >
          Start at Sources <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/faq"
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50"
        >
          How it works
        </Link>
      </div>
    </div>
  );
}
