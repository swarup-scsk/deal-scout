# Roadmap

**Last updated:** 2026-07-20
**Format:** Now / Next / Later, mapped to phases. Concrete items only.

## Done (POC → Prototype foundation)

- Origination Hub: nine-stage end-to-end prototype (reference / donor).
- Scout scaffolded on Lovable + GitHub; Scenario, Prospecting, Qualification routes live.
- Scenario configuration reworked to the pillar → transaction-type → criteria model (9 transaction types, 2 pillars; Battery Tolls as test case).
- Per-scenario config: global config + overrides, criterion weights, removable rules, descriptions; localStorage persistence (`deal-scout.state.v2`).
- Universe-first prospecting: Counterparties page defaults to the unscored universe; applying a scenario scores + ranks. Add-counterparty, two-module search/results layout, re-run scan.
- Removed the 3-step stepper and header gear; scope moved to the shell header.
- Configure screen: Admin / User role, per-scenario read-only + Edit mode, split Criteria / Weightage columns, scenario and criterion descriptions, modern visual redesign.
- Landing page at `/` (replaces the redirect) with CTA into Counterparties.
- Counterparties table: fit score moved to column 2 (shown only when a scenario is applied, else "Not scored"); AI insight column removed.
- Shortlists: multiple named lists (playlist-style) at `/shortlists`; add from the table and the deep dive via a reusable dialog; open a member to deep dive.
- Micro-CRM (mocked, structured for later): **Proceed** on a deep dive starts an account; `/crm` list and `/crm/:accountId` detail with auto + manual contacts, mock AI/plugin enrichment, Outlook/LinkedIn templated comms with a communication log, and a manual "deal closed" status that flags the counterparty back in the Counterparties table.
- Operational data now auto-persists under `deal-scout.ops.v1` (counterparties, shortlists, accounts, contacts, commLogs).
- CRM routing fix: `/crm` is a layout with `<Outlet/>`; list in `crm.index.tsx`, detail in `crm.$accountId.tsx`.
- Communication templates module: `/templates` admin screen (Admin authors per channel, universal or per-scenario override); CRM comms panel pulls templates, merges `{{variables}}`, defaults to universal, editable before logging. Templates persist in the config blob.
- UX pass: persistent Home nav item across pages; wider layout (`max-w-screen-2xl`) so tables use large screens; LEI removed from the Counterparties table and shown on the deep dive; deep dive now carries the full company profile (all table fields incl LEI); deep dive shows a status strip reflecting existing CRM account and shortlist membership; return flow reworked (Back to counterparties, plus Back to shortlists only when the counterparty is in a list; primary button reads Record and return / Return by context).

- Rules engine Layer 1 (Library): `/library` Admin screen with the approved sub-criterion form (data field, rule type, scoring band with floor/ceiling sliders, Importance weight, safeguards, live preview). Library persists in the config blob; `subScore` scoring function and mocked field values in place. Nav item added.
- Rules engine Layer 2 (Scenario composition): `/scenarios` screen to select library criteria/sub-criteria, set criterion weight, and override sub Importance + thresholds, with a customised-vs-library tag and reset (persisted under `scenarioRules`). The new engine (`resolveScenario` + `scoreFor` + `scoreBreakdown`) drives the Counterparties fit and a "Blocked" flag, and a "why this score" breakdown-to-source panel on the deep dive. Old `/scenario` Configure screen is now legacy.
- Navigation moved to a **grouped left sidebar** (NIV-trader style): SEE gradient logo badge + wordmark + scope at top, then grouped sections (Overview / Prospecting / Counterparties + Shortlists / Engagement: CRM / Configuration: Scenarios + Library + Templates) with lucide icons, active state as accent-tint, and shortlist/CRM count badges. Content sits to the right.
- Library screen polish: constrained field widths (data field + rule side by side, safeguards in a compact row), inline low-chrome titles instead of full-width boxed inputs, tidier band block. Removed the Admin/User "Viewing as" toggle from Library and Templates; both are now always editable (role concept retired from those screens).
- SEE design re-skin applied at the token layer: `src/styles.css` tokens remapped to the SEEL spectrum (Apple-neutral surfaces, blue #0091d4 primary + accent, green #00c29d success), system font stack on body, sentence case enforced globally (the `uppercase` utility is neutralised), and a signature gradient strip in the app shell (one per screen). Every screen re-skins at once because they use semantic token classes.

- CRM notes (D19) built: a separate Notes card on the account (`/crm/:accountId`), timestamped and attributed, editable and deletable, independent of the comms log. Persists under the ops blob (`notes`).
- Data sources, traceability and guardrails documented in `DATA_SOURCES.md` (authoritative registers by quality tier, provenance model, LLM augmentation guardrails). Informs production data wiring.
- Data-sources epic, slice 1 built (mocked): a **source registry** with quality tiers (T1-T4) in `data.ts`, **per-field provenance** (source name + tier + retrieved) shown in the deep-dive breakdown, and a per-counterparty **data-quality score** (`dataQuality`) surfaced as a chip on the deep dive and a "Data quality" column on the Counterparties table. Separate from fit.
- Business-user FAQ page (`/faq`, "How it works" under Help in the nav): plain-language flow strip, source-tier legend, and an accordion covering data sources, tiers, fit vs data quality, scoring, traceability, AI guardrails, who configures what, and mocked-data status.

## Now (current prototype hardening)

- **Prospecting Priority-1 backlog** (from the value-discussion transcript): multi-select market scope + sub-region; volume ranges (0-500 GWh, 500 GWh-1 TWh, 1-5 TWh, 5 TWh+); licence-status filter (supplier / end-user / shipper); participant-role / business-line multi-select; restore info tooltips.

## Next (finish the prototype story)

- Design re-skin polish (optional): true 0.5px hairlines, soft two-layer card shadows, and flip segmented-control active state to white-pill + accent-text per the spec. Token re-skin is done; these are finishing touches.
- Rules engine polish: scenario-level impact preview panel (Strong/Borderline/Blocked, movers vs saved); apply multiple scenarios; per-scenario fit-band thresholds.
- **Data-sources epic, remaining slices** (feature list in `DATA_SOURCES.md`): slice 1 (provenance + data-quality) done; next are the source allow-list + tier weighting applied in scoring/merge, a conflict indicator, a human-in-the-loop review gate, and freshness/re-verify. Production integrations (Tier-1 register connectors keyed on LEI, Tier-2 corroboration, Tier-3 enrichment, allow-listed RAG, scheduled refresh) are Later.
- **CRM notes**: separate, timestamped, attributed, editable/deletable notes on the account, independent of the comms log (no funnel).
- **Value model as ranges** (conversion 8-12%, deal ~500K, 4 users) for the exec business-case slide.
- **Deterministic scoring engine**: superseded by the rules engine above; keep the "why this score" breakdown panel requirement.
- **Real Export**: table view and detailed view (currently mocked).
- Micro-CRM realism: replace mock enrichment with real website / ZoomInfo lookups; wire real email; ingest closed-deal status from the external deal system.
- Qualification audit polish; indicative value model.

## Later (MVP)

- **Real data feeds** (see `DATA_SOURCES.md` for the tiered source list): anchor the universe on ACER CEREMP + national regulator registers (Ofgem, ACM, BNetzA, CRE, CREG), key on GLEIF LEI, corroborate with EEX/ICE membership and ENTSOG/ENTSO-E/GIE/Elexon, enrich with commercial data; per-field provenance, a data-quality score, and human-in-the-loop review. Wired via the n8n `prospect-scan` / `qualify` / Auto Search workflows.
- Market / regulatory intelligence view.
- Multi-user **backend** (replaces localStorage) + auth.
- Production destination decision: Salesforce / Agentforce for the Population → Ranking → Pitch → CRM spine.

## Parked / cut (lift back from the Hub only if a phase needs them)

Structuring, Pricing, Risk & Credit, Contracting, Approval, Lifecycle / Deals, and the "Express" mock path - all downstream of Qualification, cut cleanly from Scout.

## Inputs still required

- Confirmed **scenario set** and how each is scored against objectives (current set is illustrative placeholder).
- Michael's **per-criterion band definitions** for the deterministic scoring engine.
- Requirements for the **comms + mini-CRM** module.
- The Jabbar / Michael **transcript** to reconcile the prospecting pipeline.
- Exact **qualification fields** captured at go / no-go.
- Decision on **minimum margin** meaning (company vs deal; keep or drop).
