# CLAUDE.md - deal-scout (SEE Origination Scout)

Instructions for any agent working in this repo.

## Documentation is part of "done"

After any meaningful change or decision - a feature, a schema/interface change, an infra/env change, a decision, or a newly found gotcha - **update the relevant knowledge-pack doc(s) and `README.md` in the same change.** Not a follow-up.

Routing guide:

- data or interface change → `knowledge-pack/DATA_CONTRACT.md`
- new feature or priority shift → `knowledge-pack/ROADMAP.md`
- a decision or a pitfall → `knowledge-pack/DECISIONS_AND_GOTCHAS.md`
- stack / infra / env change → `knowledge-pack/TECH_STACK.md`

The pack is **mirrored**: the canonical copy is in the OneDrive project hub (`…/Projects/SEE Origination/knowledge-pack/`) and a copy lives here in `knowledge-pack/`. Apply the same edit to **both** copies in the same change so they never drift. No secrets in any doc - names and locations only, never values.

## Before-commit checklist

1. `bun run lint` passes.
2. `bun run build` passes.
3. The affected flow works in `bun run dev`.
4. Relevant `knowledge-pack/` doc(s) and `README.md` updated (both pack copies).
5. Commit message describes the change; **no force-push, no history rewrite** (Lovable sync - see `AGENTS.md`).

Note: this sandbox usually cannot compile or push. When that is the case, hand the owner the exact `git pull / add / commit / push` block instead of pushing.

## Top gotchas (full list in DECISIONS_AND_GOTCHAS.md)

- **Do not add Vite plugins manually** - `@lovable.dev/vite-tanstack-config` already includes tanstackStart, react, tailwind, tsconfigPaths, nitro, etc. Duplicates break the app.
- **bun**, not npm/yarn.
- **Never force-push / rebase / amend / squash** pushed commits (Lovable history).
- localStorage key is **`deal-scout.state.v2`** - bump the version on an incompatible shape change or stale state shadows new seed data.
- When adding persisted state, update all four: `useState`, hydrate `if`, empty-storage else snapshot, and `currentSnap`.
- `role` and `counterpartyList` are in-memory only (not persisted).
- Use semantic token classes only; `text-accent` is nearly invisible - use `text-accent-foreground` / `text-foreground`.

## Writing style

No em dashes. Plain, senior-consultant, non-journalistic language in all docs and outputs.
