import { useStore } from "@/lib/store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { config } = useStore();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-bold tracking-tight text-primary-foreground">
            SEE
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">
              SEE Origination Scout
            </div>
            <div className="text-xs text-muted-foreground">
              {config.scope.commodity} · {config.scope.region} · {config.scope.hub}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
