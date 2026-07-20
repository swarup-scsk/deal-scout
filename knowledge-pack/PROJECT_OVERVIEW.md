# Project Overview

**Last updated:** 2026-07-20

## The problem

A new power-trading company, **SCEE** (Summit / Sumitomo group energy trading entity), is standing up. It needs to revamp its **energy origination** business and decide how digital tooling can make origination faster and more systematic. Origination today is relationship-led and manual: finding, scoring and qualifying counterparties for structured energy deals is slow and inconsistent.

## The goal (one line)

Show a working prototype of the origination work-cycle - from choosing a scenario, to AI-assisted prospecting of counterparties, to a recorded qualification decision - that proves how digital can transform the front of the origination funnel.

## Who's who

| Person / group | Role |
|---|---|
| Mr Kar (product owner) | Owns the product; works with an AI copilot as PM + system architect + energy-trading domain expert. |
| Michael | SEE trader / business stakeholder. Drives requirements for scenario configuration, prospecting criteria, and the comms / CRM module. |
| Jabbar | CEO of SE. Orchestrated the prospecting-pipeline whiteboard with Michael. |
| SCSK / DX Centre | Delivery and research context. |

## What exists today

- **Scout app (`deal-scout`)** - the active prototype. Three-stage front-of-funnel: Scenario configuration → Prospecting (Counterparties universe) → Qualification. Built on Lovable + TanStack Start, mocked data, single-user (localStorage). This is where current work happens.
- **Origination Hub (`see-origination-hub`)** - the earlier nine-stage end-to-end prototype (Scenario, Prospecting, Qualification, Structuring, Pricing, Risk & Credit, Contracting, Approval, Lifecycle). Proved the full narrative; now reference / donor for Scout.
- **Power Trader (`connected-see-ai-trader`)** - separate trading-side app. Related, not part of the origination scope.
- **Strategy artifacts** (OneDrive hub): PRD, briefing, glossary, system-architecture doc, datasource map, n8n workflows, build playbooks, training deck, value/impact materials, action tracker.

## The phases

| Phase | Meaning here |
|---|---|
| **POC** | The Hub - prove the end-to-end origination story can be told digitally. Done. |
| **Prototype** | Scout - a focused, credible front-of-funnel demo with realistic mocked data. **Current phase.** |
| **MVP** | Real data feeds, real scoring engine, comms + mini-CRM, multi-user backend, and a production destination decision (e.g. Salesforce / Agentforce). Not started. |

## Success criteria

- A stakeholder can walk the full Scenario → Prospecting → Qualification flow unaided and find it credible.
- Scenario configuration (pillars, transaction types, criteria, weights, gates) is understandable and adjustable by a business user, with an Admin / User split.
- Prospecting produces one ranked, filterable counterparty table with a transparent, explainable fit score.
- Qualification records a defensible go / no-go with an audit trail.
- The build is transferable: a new person or agent can onboard from this pack and continue.

## Sensitivity / security notes

- **Prototype data is mocked / synthetic**, shaped to look real. No real counterparty PII or market-sensitive data is in the repo.
- **No secrets belong in code or these docs.** See TECH_STACK.md for where credentials live.
- **Known issue:** the `connected-see-ai-trader` repo has a GitHub PAT embedded in its git remote URL. Treat as exposed and rotate it (see DECISIONS_AND_GOTCHAS.md).
- **LinkedIn / outreach** stays agent-assisted (drafted for a human), never fully automated, per platform terms.
