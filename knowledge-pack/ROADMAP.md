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

## Now (current prototype hardening)

- **Comms + mini-CRM module** (from Michael, 15 Jul MoM) - requirements pending from Mr Kar. Includes: comms module, mini-CRM scalable to a real CRM, Outlook + LinkedIn message templates, free-text notes/logs column, links to extracted data. Share app link with Michael.
- **Prospecting Priority-1 backlog** (from the value-discussion transcript): multi-select market scope + sub-region; volume ranges (0-500 GWh, 500 GWh-1 TWh, 1-5 TWh, 5 TWh+); licence-status filter (supplier / end-user / shipper); participant-role / business-line multi-select; restore info tooltips.

## Next (finish the prototype story)

- **Deterministic scoring engine**: band editor / scoring-logic layer per scenario, plus a "why this score" breakdown panel (needs Michael's band definitions). Apply multiple scenarios at once.
- **Real Export**: table view and detailed view (currently mocked).
- Qualification shortlist + audit polish; indicative value model.

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
