# deal-scout - SEE Origination Scout

The active prototype for the SEE / SCEE origination project: a front-of-funnel origination tool that goes from **Scenario configuration → Prospecting (Counterparties universe) → Qualification (go / no-go)**. Built on Lovable + TanStack Start with mocked data and single-user (localStorage) persistence.

> **Canonical documentation:** the [knowledge pack](knowledge-pack/INDEX.md) is the single source of truth (mirrored here and in the OneDrive project hub). Read `knowledge-pack/INDEX.md` first.

## Setup and run

Package manager is **bun**.

```bash
bun install
bun run dev        # local dev server
```

## Build and test

```bash
bun run build      # production build (Vite → Nitro → Cloudflare default target)
bun run build:dev  # development-mode build
bun run preview    # preview the production build
bun run lint       # eslint
bun run format     # prettier --write
```

There is no unit-test suite yet; "test" means `bun run lint` + `bun run build` pass and the affected flow works in `bun run dev`.

## Environment variables

The app code references no env vars directly. Lovable's Vite preset injects `VITE_*` at build time if present. Cloudflare/Wrangler vars (if deploying directly) go in `.dev.vars`. Secrets never go in the repo - see `knowledge-pack/TECH_STACK.md`. `.env.local`, `.dev.vars`, `.wrangler/` are gitignored.

## Deploy

Commits pushed to the connected branch **sync to Lovable** and build there. Nitro's default target is Cloudflare. **Never force-push or rewrite published history** (see `AGENTS.md`).

Typical handoff (the owner pushes; the sandbox cannot):

```bash
git pull --no-edit
git add -A
git commit -m "…"
git push
```

## Key files

| Path | What |
|---|---|
| `src/routes/scenario.tsx` | Configure scenarios (pillars, transaction types, criteria, weights, rules; Admin/User role). |
| `src/routes/prospecting.tsx` | Counterparties universe: search, apply-scenario overlay, ranked table. |
| `src/routes/qualification.$id.tsx` | Deep dive + recorded go / no-go. |
| `src/routes/__root.tsx`, `index.tsx` | Root layout; `/` redirects to `/scenario`. |
| `src/lib/data.ts` | Domain types + mocked seed data (see `knowledge-pack/DATA_CONTRACT.md`). |
| `src/lib/store.tsx` | Context store + localStorage persistence (`deal-scout.state.v2`). |
| `src/components/AppShell.tsx` | Header / scope shell. |
| `src/components/ui/*` | shadcn/ui components. |
| `src/styles.css` | Design tokens (oklch). |

## Maintenance rule

After any meaningful change or decision, **update the relevant `knowledge-pack/` doc(s) and this README in the same change** - docs are part of "done". Full rule and routing guide in `knowledge-pack/INDEX.md` and `CLAUDE.md`. Because the pack is mirrored, apply doc edits to both the repo copy and the OneDrive hub copy.
