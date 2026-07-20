# Decisions and Gotchas

**Last updated:** 2026-07-20

## Decisions (lightweight ADR - what, why)

| # | Decision | Why |
|---|---|---|
| D1 | Build **Scout** as a fresh app rather than prune the Hub. | A large redesign at reduced scope is cleaner as a new build; the Hub stays intact as reference / donor. |
| D2 | Scope Scout to the **front of the funnel** (Scenario → Prospecting → Qualification); cut the six downstream stages. | Focus the prototype on where digital adds the most value: finding and qualifying counterparties. |
| D3 | **Universe-first** flow: the Counterparties page shows the full universe **unscored** by default; a scenario is an overlay that scores + ranks (chose "Option 1"). | Matches the trader's mental model - browse everyone, then apply a lens. Decouples the scenario engine from the data. |
| D4 | **Pillar → transaction type → criteria** model, with per-criterion `inverse` and `optional` flags. | Michael's structure. `inverse` captures that a *gap* (e.g. no route to market) is SEE's opportunity, so it scores higher. |
| D5 | Scoring = two layers joined by normalisation: deterministic sub-scores (configurable bands) × per-scenario weights, with global gates that are removable per scenario. | Configurability + traceability + diagnosability. Weights alone are not enough; the deterministic logic must be inspectable. |
| D6 | **Admin / User role** with per-scenario read-only + explicit Edit mode. | Business users can read config safely; only Admin changes it. Prevents accidental edits in demos. |
| D7 | **Single-user, localStorage** persistence for the prototype; no backend yet. | Enough for a demo / pilot; a backend is an MVP decision. |
| D8 | **Data is mocked / synthetic**, shaped to look real. | De-risk the flow before committing to real feeds (ZoomInfo, OFGEM, LEI/GLEIF, RSS). |
| D9 | **LinkedIn / outreach stays agent-assisted** (drafted for a human), never fully automated. | Platform terms; also keeps a human in the loop for relationship-led origination. |
| D10 | Canonical knowledge pack in the OneDrive hub, **mirrored** into the `deal-scout` repo; README + CLAUDE.md in `deal-scout` only. | Hub is the project home; the repo copy lets a cold git clone onboard. (Per owner decision, 2026-07-20.) |
| D11 | Writing style: **no em dashes**; plain senior-consultant, non-journalistic language. | Owner preference; applies to all docs and outputs. |
| D12 | Fit score shown in **column 2 only when a scenario is applied**; "Not scored" in the plain universe. | Resolves the conflict between universe-first (unscored default) and the request to move score to column 2. |
| D13 | Keep the **Proceed / Hold / Decline** decision; **Proceed** promotes the counterparty into the micro-CRM. | Owner choice; preserves the existing audit states while giving one trigger into CRM. |
| D14 | **Shortlists are multiple named lists** (playlist-style), not a single cart. | Owner choice; supports "add to existing or new list, new needs a name." |
| D15 | Micro-CRM is **mocked but structured for later** real connectors; comms are draft-and-log only (nothing sent); closed-deal status set manually. | Prototype has no live plugins/email; the external deal system owns real closes. Keeps the data model ready for MVP wiring. |
| D16 | Persistence **split into two keys**: config under manual Save-all (`deal-scout.state.v2`), operational data auto-saved (`deal-scout.ops.v1`). | Shortlist/CRM actions must persist immediately without disturbing the config dirty/Save-all UX. |

## Gotchas (traps - do not relearn these)

### Build / environment
- **Do not add Vite plugins manually.** `@lovable.dev/vite-tanstack-config` already includes tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro, componentTagger, VITE_* injection, the `@` alias, and dedupe. Adding any again breaks the app with duplicate plugins.
- **Package manager is bun**, not npm/yarn. Use `bun install` / `bun run <script>`.
- The sandbox used for edits **cannot compile or push** this app (no bun; no push creds). Workflow: the agent edits files, then the **owner runs `git pull / add / commit / push`**, and Lovable builds. Always hand off with the exact push commands.

### Lovable / git
- **Never force-push or rewrite published history** (no rebase/amend/squash of pushed commits). It corrupts history on Lovable's side and can lose project history. See `AGENTS.md` in the repo.
- Commits on the connected branch **sync into the Lovable editor**, so keep the branch in a working state.

### State / persistence
- There are now **two localStorage keys** (see DATA_CONTRACT.md). Config: **`deal-scout.state.v2`** (manual Save-all). Operational data: **`deal-scout.ops.v1`** (auto-saved via effect): counterparties, shortlists, accounts, contacts, commLogs.
- Config key: when the shape changes incompatibly, **bump the version** or stale saved state shadows new seed data (this happened: v1 → v2). When adding a config field, update **four places together**: the `useState`, the hydrate `if` block, the empty-storage else snapshot, and `currentSnap`.
- Ops key: when adding a slice, update **three places**: the `useState`, the ops hydrate block, and the auto-save effect (dependency array + written object).
- `counterpartyList` is now **persisted** (under the ops key), so shortlists and CRM survive reloads. `role` and `decisions` remain in-memory only.

### Styling
- Use **semantic token classes** only (`bg-primary`, `text-muted-foreground`, `border-border`, `brand-blue`, `success`, `warning`). `text-accent` is a very light blue and is nearly invisible as text - use `text-accent-foreground` on `bg-accent`, or `text-foreground`.

### Security
- **`connected-see-ai-trader` has a GitHub PAT embedded in its git remote URL** (`x-access-token:github_pat_…@github.com/...`). Treat as exposed: **rotate the token** and set the remote to a clean URL. Never copy that remote into docs or other configs.
- Keep secrets out of the repo: `.env.local`, `.dev.vars`, `.wrangler/` are gitignored; n8n credentials live in n8n.

### Tooling notes (for agents)
- Editing scanned `.docx` via pandoc can fail on the OneDrive copy ("couldn't parse docx"); work from the outputs copy.
- `.msg` attachments with embedded images can throw "embedded null byte" in extract_msg; rely on the text body.
