import { Link } from "@tanstack/react-router";
import {
  Building2,
  Home,
  Layers,
  ListChecks,
  Mail,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { useStore } from "@/lib/store";

type NavItem = {
  to: string;
  label: string;
  icon: typeof Home;
  exact?: boolean;
  badge?: "shortlists" | "crm";
};

const GROUPS: { label?: string; items: NavItem[] }[] = [
  { items: [{ to: "/", label: "Home", icon: Home, exact: true }] },
  {
    label: "Prospecting",
    items: [
      { to: "/prospecting", label: "Counterparties", icon: Users },
      { to: "/shortlists", label: "Shortlists", icon: ListChecks, badge: "shortlists" },
    ],
  },
  {
    label: "Engagement",
    items: [{ to: "/crm", label: "CRM", icon: Building2, badge: "crm" }],
  },
  {
    label: "Configuration",
    items: [
      { to: "/scenarios", label: "Scenarios", icon: SlidersHorizontal },
      { to: "/library", label: "Library", icon: Layers },
      { to: "/templates", label: "Templates", icon: Mail },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { config, shortlists, accounts } = useStore();
  const counts = {
    shortlists: shortlists.length,
    crm: accounts.filter((a) => a.status !== "deal-closed").length,
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-border bg-card">
        <div className="seel-strip" />
        <Link
          to="/"
          className="flex items-center gap-2.5 border-b border-border px-4 py-4"
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[11px] font-bold tracking-tight text-white"
            style={{ background: "var(--seel-gradient)" }}
          >
            SEE
          </span>
          <span>
            <span className="block text-sm font-semibold leading-tight text-foreground">
              Origination Scout
            </span>
            <span className="block text-[11px] text-muted-foreground">
              {config.scope.commodity} · {config.scope.region} · {config.scope.hub}
            </span>
          </span>
        </Link>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {GROUPS.map((group, gi) => (
            <div key={gi} className="space-y-1">
              {group.label && (
                <div className="px-3 pb-1 text-[11px] font-medium text-muted-foreground">
                  {group.label}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const count = item.badge ? counts[item.badge] : 0;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    activeOptions={item.exact ? { exact: true } : undefined}
                    className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&.active]:bg-accent [&.active]:text-accent-foreground"
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {count > 0 && (
                      <span className="rounded-full bg-brand-blue/15 px-1.5 text-[10px] font-semibold text-brand-blue">
                        {count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-screen-2xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
