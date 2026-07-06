import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CRITERIA } from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/scenario")({
  head: () => ({
    meta: [
      { title: "Choose a scenario — SEE Origination Scout" },
      {
        name: "description",
        content: "Select an origination scenario to begin scouting counterparties.",
      },
    ],
  }),
  component: ScenarioScreen,
});

function DotRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full ${
              i <= value ? "bg-brand-blue" : "bg-border"
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-muted-foreground">{value}</span>
    </div>
  );
}

function ScenarioScreen() {
  const { scenarios, selectedScenarioId, setSelectedScenarioId, config, setConfigOpen } =
    useStore();
  const navigate = useNavigate();
  const selected = scenarios.find((s) => s.id === selectedScenarioId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Choose an origination scenario
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick the deal archetype that best fits current strategy and portfolio.
        </p>
      </div>

      <Card className="flex flex-wrap items-center gap-x-8 gap-y-2 p-4">
        <ScopeItem label="Commodity" value={config.scope.commodity} />
        <ScopeItem label="Region" value={config.scope.region} />
        <ScopeItem label="Hub" value={config.scope.hub} />
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={() => setConfigOpen(true)}
        >
          Change
        </Button>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {scenarios.map((s) => {
          const isSelected = s.id === selectedScenarioId;
          return (
            <Card
              key={s.id}
              className={`flex flex-col gap-4 p-5 transition-shadow ${
                isSelected ? "border-primary ring-1 ring-primary/20" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-foreground">{s.title}</h3>
                <Badge variant={isSelected ? "default" : "secondary"}>
                  {isSelected ? "Selected" : "Alternative"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{s.description}</p>
              <div className="space-y-2">
                {CRITERIA.map((c) => (
                  <div key={c.key} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{c.label}</span>
                    <DotRating value={s.criteria[c.key]} />
                  </div>
                ))}
              </div>
              {isSelected ? (
                <Button
                  className="mt-auto"
                  onClick={() => navigate({ to: "/prospecting" })}
                >
                  Begin this deal
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  className="mt-auto text-muted-foreground"
                  onClick={() => setSelectedScenarioId(s.id)}
                >
                  Not selected
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      {selected && (
        <Card className="border-primary/30 bg-primary/5 p-4 text-sm">
          <span className="font-semibold text-foreground">
            Selected: {selected.title}
          </span>{" "}
          <span className="text-muted-foreground">
            — highest combined strategic fit, profitability potential and
            portfolio synergy.
          </span>
        </Card>
      )}
    </div>
  );
}

function ScopeItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}
