# Tech Stack

**Last updated:** 2026-07-20
**Scope:** the active `deal-scout` (Scout) app. The Hub and Power Trader repos use the same TanStack Start stack.

## Tools and services (and why)

| Tool | Why |
|---|---|
| **Lovable** | AI app builder that owns the project. Commits pushed to the connected branch sync back into the Lovable editor. Provides the Vite/TanStack config preset. |
| **TanStack Start** (`@tanstack/react-start`) | Full-stack React framework; SSR + server entry. |
| **TanStack Router** (`@tanstack/react-router`) | File-based routing under `src/routes`. Type-safe search params (`validateSearch`). |
| **React 19** | UI library. |
| **Vite 8** | Build tool. Config comes from `@lovable.dev/vite-tanstack-config` (do not add tanstackStart/react/tailwind/tsconfigPaths/nitro plugins manually - they're already included). |
| **Nitro** | Server build. Default deploy target is **Cloudflare** (per the Lovable preset). |
| **Tailwind CSS v4** (`@tailwindcss/vite`) | Styling. Design tokens in `src/styles.css` (oklch). |
| **shadcn/ui + Radix** | Component library in `src/components/ui/*`. |
| **lucide-react** | Icons. |
| **recharts** | Charts (available; used where visualisations are needed). |
| **zod + react-hook-form** | Validation and forms. |
| **sonner** | Toasts. |
| **bun** | Package manager and runtime (`bun.lock`, `bunfig.toml`). |
| **n8n** | Workflow automation for prospecting / qualification / scans (workflows exported as JSON in the hub folder). |
| **Local LLM** | Model behind AI insights in the prototype (kept local for the demo). |

## Architecture and data flow

```
                          ┌──────────────────────────────────────┐
                          │            Scout (deal-scout)          │
                          │        TanStack Start + React 19       │
                          │                                        │
  User ──▶  Browser ────▶ │  Routes:                               │
                          │   /                → redirect          │
                          │   /scenario        Configure scenarios │
                          │   /prospecting     Counterparties      │
                          │   /qualification/:id  Deep dive + go/no-go
                          │                                        │
                          │  State: React Context store            │
                          │   (src/lib/store.tsx)                  │
                          │        │                               │
                          │        ▼                               │
                          │  localStorage  "deal-scout.state.v2"   │
                          │  (single-user persistence)             │
                          │                                        │
                          │  Data: src/lib/data.ts (mocked)        │
                          └───────────────┬────────────────────────┘
                                          │  (prototype: mocked;
                                          │   MVP: real integrations)
                                          ▼
             ┌──────────── n8n workflows (hub folder JSON) ───────────┐
             │  prospect-scan · qualify · scheduled Auto Search        │
             │  → candidate feeds: ZoomInfo, OFGEM, LEI/GLEIF, RSS     │
             └────────────────────────────────────────────────────────┘

Build/deploy:  bun → vite build → Nitro → Cloudflare (default).
Sync:          git push to connected branch → Lovable editor.
```

Today the app is a **client-only prototype**: all data is mocked in `data.ts`, all state is in the Context store and persisted to `localStorage`. n8n workflows and real feeds are designed but not wired into Scout yet.

## Hosting

- **Prototype:** served via Lovable; Nitro build targets Cloudflare by default.
- **n8n:** runs the automation workflows (separate host).
- **MVP destination:** undecided. Salesforce / Agentforce is the candidate for the Population → Ranking → Pitch → CRM spine, to be decided layer by layer.

## Environment variables

The Scout app code references **no** environment variables directly (no `import.meta.env` / `process.env` usage in `src`). Lovable's Vite preset injects `VITE_*` values at build time if present.

| Variable | Purpose | Where it lives |
|---|---|---|
| `VITE_*` (any) | Build-time values injected by the Lovable preset. None currently required by app code. | Lovable project settings / `.env.local` (gitignored). |
| Cloudflare / Wrangler vars | Only if deploying to Cloudflare directly. | `.dev.vars` (gitignored) / Cloudflare dashboard. |
| n8n credentials (API keys for data feeds, LLM) | Auth for scans and enrichment. | n8n credential store, never in the repo. |

Never commit real values. `.env.local`, `.dev.vars`, and `.wrangler/` are gitignored.

## Design system

- Tokens defined in `src/styles.css` using **oklch** colors under `@theme inline` + `:root` / `.dark`.
- Key semantic colors: `primary` (navy), `accent` (light blue), `brand-blue` (mid blue for active/accent states), `muted`, `success` (green), `warning` (amber), `destructive`.
- Radius base `0.625rem` with `sm/md/lg/xl` steps.
- Components: shadcn/ui in `src/components/ui/*`; app shell in `src/components/AppShell.tsx`.
- Convention: always use semantic token classes (`bg-primary`, `text-muted-foreground`, `border-border`), never hard-coded colors, so light/dark and rebranding stay consistent.
