# Data Contract

**Last updated:** 2026-07-20
**Why this doc:** Scout has no backend yet, but these interfaces are shared across the app and must not drift: the **core domain types**, the **two localStorage blobs**, the **shortlist and CRM types**, and the **n8n workflow contracts**. Change either side of these deliberately.

All types live in `src/lib/data.ts`. State and persistence live in `src/lib/store.tsx`.

## 1. Core domain types (`src/lib/data.ts`)

### Pillar
Origination is grouped into two pillars:

```
Pillar = "structured-flow" | "asset-backed"
PILLARS = [{ id, label }, …]
```

### Scenario (a transaction type)
```
Scenario {
  id: string
  pillar: Pillar
  title: string
  description?: string
  testCase?: boolean            // e.g. Battery Tolls, first internal trading test case
  criteria: Record<CriteriaKey, number>   // legacy numeric weights (kept for compile compat)
  spec: Criterion[]             // the real per-scenario criteria
}
```
Nine transaction types ship as seed data (demand-market-access, asset-market-access, trading-market-access, working-capital, gas-storage, transport-capacity, non-re-tolls, structured-ppa, battery-tolls).

### Criterion
```
Criterion {
  key: string
  label: string
  metric: string      // default description shown under the label
  inverse?: boolean   // a gap scores HIGHER (SEE's opportunity), not lower
  optional?: boolean  // not always applicable
}
```

### Config (global + per-scenario overrides)
```
Config {
  scope:      { commodity, region, hub }     // e.g. Gas · Northwest Europe · TTF
  weights:    Record<CriteriaKey, number>    // default criterion weights
  thresholds: { green, amber }               // fit banding (strong / borderline)
  rules:      { targetVolume, returnGate, fitMid, … }  // deterministic gates
}
ScenarioConfig = { thresholds, rules }       // per-scenario override shape
inheritConfig(global, override?) -> resolved ScenarioConfig
```

### Counterparty
The prospecting row. Key fields (from the Jabbar / Michael whiteboard) include:
`id, company, country, legalEntityName, lei, revenueEbitda, headcount, businessLine, businessLineType, markets, portfolioSize, gasMarket, powerMarket, annualVolume, aiInsight, margin, sub (per-criterion sub-scores), sector, standing, evidence[], suggestion, keyRisk`.
Helpers: `fitScore(cp, weights)`, `fitBarClass(...)`, `fitColorClass(...)`.

## 2. Two localStorage blobs (`src/lib/store.tsx`)

Persistence is split into two keys with different save models.

**A. Config blob - `deal-scout.state.v2` - manual "Save all" model.** SSR-safe: hydrated after mount, saved via explicit `saveAll()`; `dirty` is a JSON-snapshot comparison against `currentSnap`.

```json
{
  "config":                {…Config},
  "scenarioOverrides":     { [scenarioId]: Partial<ScenarioConfig> },
  "criterionWeights":      { [scenarioId]: { [criterionKey]: number } },
  "disabledRules":         { [scenarioId]: string[] },
  "criterionDescriptions": { [scenarioId]: { [criterionKey]: string } },
  "scenarioList":          [ …Scenario ]
}
```

When adding a field here, add it in four places together - the `useState`, the hydrate `if (s.x)` block, the empty-storage else snapshot, and `currentSnap` - or the dirty check breaks or data is lost. Bump the key version on an incompatible change.

**B. Operational blob - `deal-scout.ops.v1` - auto-save model.** Written by an effect whenever any of its slices change (after hydration). No dirty/Save-all; changes persist immediately. Used for data users edit through actions rather than a config form.

```json
{
  "counterparties": [ …Counterparty ],   // seed + manually added; now persisted
  "shortlists":     [ …Shortlist ],
  "accounts":       [ …Account ],
  "contacts":       [ …Contact ],
  "commLogs":       [ …CommLog ]
}
```

When adding a slice here, add it in three places: the `useState`, the ops hydrate block, and the auto-save effect's dependency array + written object.

**Still in-memory only:** `role` ("Admin" | "User"), `decisions`, UI open/edit state.

## 3. Shortlist and CRM types (`src/lib/data.ts`)

```
Shortlist { id, name, counterpartyIds: string[], createdAt }

Account {
  id, counterpartyId, company,
  status: "active" | "deal-closed",
  createdAt, website?, enrichedAt?, notes?, dealClosedAt?, dealRef?
}
Contact { id, accountId, name, role, email?, phone?, linkedin?, source: "auto"|"manual"|"enriched" }
CommLog { id, accountId, channel: "email"|"linkedin"|"note", subject?, body, timestamp }
```

Flow: **Proceed** on a deep dive calls `startCrm(counterpartyId)`, which creates one `Account` (idempotent per counterparty) plus an auto `Contact` parsed from the counterparty's known contact. `enrichAccount` is a **mock** (simulated website + ZoomInfo) that adds a website and enriched contacts; replace its body with a real connector later. `logComm` records drafted messages (nothing is actually sent; LinkedIn stays draft-for-a-human). `setAccountStatus(id, "deal-closed", ref)` records a close from the external deal system and drives the "Deal closed" flag shown in the Counterparties table.

## 4. n8n workflow contracts (hub folder JSON)

Designed, exported as JSON in the OneDrive hub; not yet wired into Scout. The seam Scout expects:

| Workflow | Input | Output |
|---|---|---|
| `prospect-scan` | scope (commodity/region/hub) + scenario criteria | list of Counterparty-shaped records to populate the universe |
| `qualify` | a counterparty id + config | enriched fields, sub-scores, AI suggestion basis |
| scheduled **Auto Search** | schedule + saved scope | pre-runs the scan and stores the universe for the Counterparties page |

When wiring these for MVP, map their output to the `Counterparty` type above so the table and qualification pages need no structural change.
