import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  CircleHelp,
  Database,
  Home,
  Layers,
  ListChecks,
  LogOut,
  Mail,
  Minus,
  Newspaper,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import type { SignalImpact } from "@/lib/data";

type NavItem = {
  to: string;
  label: string;
  icon: typeof Home;
  exact?: boolean;
  badge?: "shortlists" | "crm" | "signals";
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
    label: "Intelligence",
    items: [
      { to: "/intelligence", label: "Signals", icon: Newspaper, badge: "signals" },
    ],
  },
  {
    label: "Configuration",
    items: [
      { to: "/library", label: "Library", icon: Layers },
      { to: "/scenarios", label: "Scenarios", icon: SlidersHorizontal },
      { to: "/sources", label: "Sources", icon: Database },
      { to: "/templates", label: "Templates", icon: Mail },
    ],
  },
  {
    label: "Help",
    items: [{ to: "/faq", label: "How it works", icon: CircleHelp }],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { shortlists, accounts, unreadSignalCount } = useStore();
  const { user, signOut } = useAuth();
  const counts = {
    shortlists: shortlists.length,
    crm: accounts.filter((a) => a.status !== "deal-closed").length,
    signals: unreadSignalCount,
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
          <span className="block text-sm font-semibold leading-tight text-foreground">
            Origination Scout
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

        {user && (
          <div className="mt-auto border-t border-border px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-xs text-muted-foreground">
                {user.name}
              </span>
              <button
                type="button"
                onClick={signOut}
                className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          </div>
        )}
      </aside>

      <main className="min-w-0 flex-1">
        <div className="sticky top-0 z-20 flex items-center justify-end border-b border-border bg-background/80 px-8 py-2.5 backdrop-blur">
          <NotificationBell />
        </div>
        <div className="mx-auto max-w-screen-2xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}

function SignalDot({ impact }: { impact: SignalImpact }) {
  if (impact === "up") return <TrendingUp className="h-4 w-4 text-success" />;
  if (impact === "down")
    return <TrendingDown className="h-4 w-4 text-warning" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function NotificationBell() {
  const {
    newsSignals,
    readSignals,
    unreadSignalCount,
    markSignalRead,
    markAllSignalsRead,
  } = useStore();
  const [open, setOpen] = useState(false);
  const alerts = newsSignals
    .filter((s) => s.notify)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadSignalCount > 0 && (
          <span className="absolute -right-0 -top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-blue px-1 text-[10px] font-semibold text-white">
            {unreadSignalCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-96 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-sm font-semibold text-foreground">Signals</span>
            <button
              type="button"
              onMouseDown={markAllSignalsRead}
              className="text-xs text-brand-blue hover:underline"
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-96 divide-y divide-border overflow-auto">
            {alerts.map((s) => {
              const unread = !readSignals.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onMouseDown={() => markSignalRead(s.id)}
                  className="flex w-full gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/50"
                >
                  <span className="mt-0.5 shrink-0">
                    <SignalDot impact={s.impact} />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                      {unread && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" />
                      )}
                      {s.headline}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                      {s.source} · {s.date}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <Link
            to="/intelligence"
            className="block border-t border-border px-3 py-2 text-center text-xs font-medium text-brand-blue hover:bg-muted/40"
          >
            Open intelligence feed
          </Link>
        </div>
      )}
    </div>
  );
}
