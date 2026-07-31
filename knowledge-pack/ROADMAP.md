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

## Now (current prototype hardening)

- **Design-system re-skin** to the SEE Design Spec (Apple-neutral surfaces, SEEL blue/green accent, system font, sentence case, hairline borders, segmented controls). Deferred to the next iteration by owner instruction; functional changes landed first.
- **Prospecting Priority-1 backlog** (from the value-discussion transcript): multi-select market scope + sub-region; volume ranges (0-500 GWh, 500 GWh-1 TWh, 1-5 TWh, 5 TWh+); licence-status filter (supplier / end-user / shipper); participant-role / business-line multi-select; restore info tooltips.

## Next (finish the prototype story)

- **Design-system re-skin to the SEE design direction** (`design/SEE-design-direction.md`, `design/SEE_DESIGN_SPEC.md` from SEE UX leadership): Apple-neutral surfaces, SEEL spectrum (grey/blue/green) as the only accent, system font, sentence case everywhere, 0.5px hairlines, soft shadows, segmented controls, one signature gradient per screen. Apply app-wide via the token layer. This is the agreed next iteration.
- Rules engine polish: scenario-level impact preview panel (Strong/Borderline/Blocked, movers vs saved); apply multiple scenarios; per-scenario fit-band thresholds.
- **CRM notes**: separate, timestamped, attributed, editable/deletable notes on the account, independent of the comms log (no funnel).
- **Value model as ranges** (conversion 8-12%, deal ~500K, 4 users) for the exec business-case slide.
- **Deterministic scoring engine**: superseded by the rules engine above; keep the "why this score" breakdown panel requirement.
- **Real Export**: table view and detailed view (currently mocked).
- Micro-CRM realism: replace mock enrichment with real website / ZoomInfo lookups; wire real email; ingest closed-deal status from the external deal system.
- Qualification audit polish; indicative value model.

## Later (MVP)

- **Real data feeds**: ZoomInfo, OFGEM, LEI / GLEIF, RSS triggers - wired via the n8n `prospect-scan` / `qualify` / Auto Search workflows (see DATA_CONTRACT.md).
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
