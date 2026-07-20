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

## Now (current prototype hardening)

- **Design-system re-skin** to the SEE Design Spec (Apple-neutral surfaces, SEEL blue/green accent, system font, sentence case, hairline borders, segmented controls). Deferred to the next iteration by owner instruction; functional changes landed first.
- **Prospecting Priority-1 backlog** (from the value-discussion transcript): multi-select market scope + sub-region; volume ranges (0-500 GWh, 500 GWh-1 TWh, 1-5 TWh, 5 TWh+); licence-status filter (supplier / end-user / shipper); participant-role / business-line multi-select; restore info tooltips.

## Next (finish the prototype story)

- **Deterministic scoring engine**: band editor / scoring-logic layer per scenario, plus a "why this score" breakdown panel (needs Michael's band definitions). Apply multiple scenarios at once.
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
