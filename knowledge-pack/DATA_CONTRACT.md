# Data Contract

**Last updated:** 2026-07-20
**Why this doc:** Scout has no backend yet, but three interfaces are shared across the app and must not drift: the **core domain types**, the **localStorage persistence blob**, and the **n8n workflow contracts**. Change either side of these deliberately.

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

## 2. localStorage persistence blob (`src/lib/store.tsx`)

Single-user persistence. **Key: `deal-scout.state.v2`.** SSR-safe: hydrated after mount, saved via explicit `saveAll()`; `dirty` is a JSON-snapshot comparison.

Persisted shape (exactly these keys - keep hydrate, else-branch, and `currentSnap` in sync when adding a field, and **bump the key version** if the shape changes incompatibly):

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

**Not persisted (in-memory only):** `role` ("Admin" | "User"), `counterpartyList` (added counterparties reset on reload), `decisions`, UI open/edit state.

Rule of thumb when adding persisted state: add it in four places together - the `useState`, the hydrate `if (s.x)` block, the empty-storage else-branch snapshot, and `currentSnap`. Missing one breaks the dirty check or loses data.

## 3. n8n workflow contracts (hub folder JSON)

Designed, exported as JSON in the OneDrive hub; not yet wired into Scout. The seam Scout expects:

| Workflow | Input | Output |
|---|---|---|
| `prospect-scan` | scope (commodity/region/hub) + scenario criteria | list of Counterparty-shaped records to populate the universe |
| `qualify` | a counterparty id + config | enriched fields, sub-scores, AI suggestion basis |
| scheduled **Auto Search** | schedule + saved scope | pre-runs the scan and stores the universe for the Counterparties page |

When wiring these for MVP, map their output to the `Counterparty` type above so the table and qualification pages need no structural change.
