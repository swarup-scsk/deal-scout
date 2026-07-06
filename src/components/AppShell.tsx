import { Link, useRouterState } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

const steps = [
  { n: 1, label: "Scenario", path: "/scenario" },
  { n: 2, label: "Prospecting", path: "/prospecting" },
  { n: 3, label: "Qualification", path: "/qualification" },
];

function useActiveStep() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname.startsWith("/qualification")) return 3;
  if (pathname.startsWith("/prospecting")) return 2;
  return 1;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { config, setConfigOpen } = useStore();
  const active = useActiveStep();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-bold tracking-tight text-primary-foreground">
              SEE
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">
                SEE Origination Scout
              </div>
              <div className="text-xs text-muted-foreground">
                {config.scope.commodity} · {config.scope.region} ·{" "}
                {config.scope.hub}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfigOpen(true)}
            >
              Change
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Configuration"
              onClick={() => setConfigOpen(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="border-t border-border">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-6 py-3">
            {steps.map((s, i) => {
              const isActive = s.n === active;
              const isDone = s.n < active;
              return (
                <div key={s.n} className="flex flex-1 items-center gap-2">
                  <Link
                    to={s.path === "/qualification" ? "/prospecting" : s.path}
                    className={`flex flex-1 items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "border-primary bg-primary/5 font-medium text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${
                        isDone
                          ? "bg-success text-primary-foreground"
                          : isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isDone ? "✓" : s.n}
                    </span>
                    {s.label}
                  </Link>
                  {i < steps.length - 1 && (
                    <div className="h-px w-4 bg-border" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
