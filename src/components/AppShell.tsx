import { Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";

const NAV = [
  { to: "/prospecting", label: "Counterparties" },
  { to: "/shortlists", label: "Shortlists" },
  { to: "/crm", label: "CRM" },
  { to: "/scenario", label: "Configure" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { config, shortlists, accounts } = useStore();
  const shortlistCount = shortlists.length;
  const activeAccounts = accounts.filter((a) => a.status !== "deal-closed").length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3">
          <Link to="/" className="flex items-center gap-3">
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
          </Link>

          <nav className="ml-auto flex items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&.active]:bg-primary/10 [&.active]:text-primary"
              >
                {item.label}
                {item.to === "/shortlists" && shortlistCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-brand-blue/15 px-1.5 text-[10px] font-semibold text-brand-blue">
                    {shortlistCount}
                  </span>
                )}
                {item.to === "/crm" && activeAccounts > 0 && (
                  <span className="ml-1.5 rounded-full bg-brand-blue/15 px-1.5 text-[10px] font-semibold text-brand-blue">
                    {activeAccounts}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
