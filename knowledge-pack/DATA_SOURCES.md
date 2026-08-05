# Data Sources, Traceability and Guardrails

**Last updated:** 2026-08-05
**Why this doc:** the prototype uses mocked data. For production the counterparty universe must be anchored on authoritative registers, keyed on stable identifiers, and augmented (not replaced) by the LLM. This lists the sources to use, a quality-tier weighting, and the guardrails that keep scores traceable. Source of the research: web review, Aug 2026.

## Source quality tiers

Weight evidence by tier so higher-quality sources dominate. Tier 1 sets facts, Tier 2 corroborates, Tier 3 enriches, Tier 4 only augments and can never override a higher tier.

| Tier | Meaning | Use |
|---|---|---|
| **T1** | Official / regulatory registers | Establish that a counterparty is a licensed / registered market participant; identity |
| **T2** | Market-infrastructure and standards bodies | Confirm real activity (trading, capacity, storage, generation) |
| **T3** | Commercial aggregators | Enrich scoring inputs (size, credit, contacts) after identity is resolved |
| **T4** | Open web / LLM-derived | Discovery and narrative only; never the sole basis for a decision field |

## Sources by category

### T1 - Regulator registers of licensed market participants
- **Ofgem (GB):** full lists of electricity and gas licensees (suppliers, shippers, transporters, generators) plus the Electronic Public Register. Free, PDF/web, refreshed ~monthly. `ofgem.gov.uk/data/list-all-electricity-licensees-including-suppliers`, `.../list-all-gas-licensees-including-suppliers`, `epr.ofgem.gov.uk`.
- **ACM (NL):** supply-licence holders; also the NL REMIT/CEREMP national register.
- **CREG (BE federal) + VREG / CWaPE / BRUGEL (regional):** REMIT registration federally; regional supply authorisations.
- **BNetzA (DE):** REMIT registration via CEREMP; supplier/network data.
- **CRE (FR):** REMIT registration and wholesale-market surveillance.

### T1 - EU-wide wholesale register (the backbone)
- **ACER CEREMP / European Register of market participants:** every REMIT wholesale participant registers with its national regulator; ACER publishes the consolidated register with unique ACER codes. The most complete EU-wide list of active gas/power counterparties. Free, web. `acer-remit.eu`.

### T1 - Legal entity identity (join keys)
- **GLEIF (LEI):** legal name, address, status, parent/ownership. Free Golden Copy bulk (3x/day) + lookup API. Use **LEI as the primary join key**.
- **National company registries:** UK Companies House (free API + bulk, plus filed accounts), NL KVK, BE KBO/BCE, DE Handelsregister, FR RNE/INPI. Fall back to registry number where no LEI.

### T2 - Exchange / clearing membership (activity signal)
- **EEX** list of trading participants (power/gas/emissions) + ECC clearing; **ICE Endex** membership; **Nasdaq** European Commodities memberlist; **EFET** members directory. Confirm a firm actually trades.

### T2 - Market transparency and infrastructure (assets, capacity)
- **ENTSOG** (gas TSO flows/capacity, API) and **ENTSO-E** (electricity generation/load/flows, API) transparency platforms.
- **GIE AGSI+** (gas storage inventories/bookings) and **ALSI** (LNG terminal use), free API.
- **Elexon BMRS / Insights** (GB balancing by BM Unit) identifies GB generators/suppliers and their assets.
- **Grid/network operators:** NESO and National Gas (GB), Gasunie/GTS and Fluxys (NL/BE), Amprion/TenneT/50Hertz/TransnetBW and RTE/GRTgaz (DE/FR). Reveal asset owners, capacity holders and large consumers, not just traders.

### T3 - Commercial firmographics / financials (enrichment)
- **Dun and Bradstreet**, **ZoomInfo**, **Bureau van Dijk Orbis / Creditsafe**, filed accounts. Size, credit, hierarchy, contacts. Paid. Use only after Tier 1/2 identity resolution.

## Traceability model (per-field provenance)

Every stored data field carries: value, **source name**, **source tier**, **source URL/document**, and **retrieved date**. No field is trusted without provenance. This lets the deep-dive breakdown trace each sub-score to its source and supports re-verification when registers update (Ofgem ~monthly, GLEIF 3x/day, CEREMP continuously). In the prototype this maps to the existing `provenance` idea in DATA_CONTRACT; production stores it per field.

## Data-quality (confidence) score

Alongside the origination fit score, compute a 0-100 data-quality score per entity from: the tier of the highest corroborating source, the number of independent sources that agree, freshness vs the source's update cadence, and entity-resolution certainty (did the LEI / registry match cleanly). Surface it so users see how well-evidenced a counterparty is, separate from how attractive it is.

## LLM augmentation guardrails

1. **Allow-listed RAG only.** Retrieval restricted to an explicit allow-list of the domains above. The LLM proposes candidates and narrative; any asserted fact must be grounded in a retrieved allow-listed document. Open-web/LLM-only content is Tier 4 and cannot populate a decision-critical field alone.
2. **Per-field provenance** (as above), captured at gather time.
3. **Source-quality weighting.** In entity resolution and scoring, Tier 1 dominates, Tier 2 corroborates, Tier 3 enriches, Tier 4 nudges. A Tier 4 claim never overrides a Tier 1 register value.
4. **Conflict handling.** When sources disagree, deterministic precedence: higher tier wins; within a tier the fresher and more specific/official source wins. Record the conflict and lower the field's confidence rather than discarding silently. Unresolved Tier-1-vs-Tier-1 conflicts route to human review.
5. **Human-in-the-loop.** Analyst sign-off before promoting a counterparty into the actionable universe when confidence is low, a Tier 1 conflict is unresolved, there is no LEI/registry match, or the record rests only on Tier 3/4 evidence. Decisions are logged and feed back to tune weights and thresholds.
6. **Prompt discipline.** Instruct the model to answer only from provided sources, cite them, and say "unknown" rather than guess.

Net effect: the LLM accelerates discovery and drafting, but the universe is anchored on statutory registers (CEREMP + national regulators), keyed on LEI/registry IDs, corroborated by market-infrastructure data, enriched by commercial data, and gated by provenance, confidence and human review.

## Feature backlog (this epic)

Prototype = mockable now; Production = real integration later.

**Foundation**
1. Per-field provenance: value + source + tier + URL + retrieved date. (Prototype: **built** as a source registry + FIELD_SOURCE.)
2. Source registry with tier and weight, admin-managed. (Prototype: **built** as `SOURCES`; admin editing pending.)
3. Data-quality (confidence) score per field and per counterparty. (Prototype: **built** as `dataQuality`.)

**Surfacing**
4. Provenance on the deep dive: source chip + tier + retrieved per sub-score. (**Built**.)
5. Data-quality score next to fit, on table and deep dive. (**Built**: DQ column + chip.)
6. Evidence filter/flag: filter or badge by evidence quality; "unverified / LLM-only" badge. (Pending.)
7. Conflict indicator: competing source values + which won. (Pending.)

**Guardrails / workflow**
8. Source allow-list, admin-editable. (Prototype config; production-enforced.)
9. Source-quality weighting in entity resolution + scoring (Tier 1 dominates; Tier 4 cannot override Tier 1). (Pending.)
10. Human-in-the-loop review gate: needs-review flag when DQ low / no LEI / Tier-1 conflict / Tier 3-4 only, with logged sign-off. (Pending.)
11. Freshness and re-verify: stale-field flags vs source cadence, last-refreshed, re-verify action. (Pending.)

**Production integrations (Later)**
12. Tier-1 register connectors (ACER CEREMP, Ofgem, GLEIF, Companies House), keyed on LEI.
13. Tier-2 corroboration feeds (EEX/ICE, ENTSOG/ENTSO-E, GIE, Elexon).
14. Tier-3 enrichment (D&B, ZoomInfo, Orbis/Creditsafe).
15. Allow-listed RAG pipeline with prompt discipline and provenance capture at gather time.
16. Scheduled refresh per source cadence.

Recommended order: slice 1 (1, 3, 4, 5) done; next slice 8, 9, 10; then 6, 7, 11; then production feeds.
