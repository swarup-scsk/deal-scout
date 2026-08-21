# Data Contract

**Last updated:** 2026-08-21
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
  "scenarioList":          [ …Scenario ],
  "commTemplates":         [ …CommTemplate ],
  "criteriaLibrary":       [ …LibraryCriterion ],
  "scenarioRules":         { [scenarioId]: { criteria: { [libraryId]: CritOverride } } },
  "sourceRegistry":        { sources: [ …Source ], tierWeights: { 1..4: number }, fieldSource: { [fieldKey]: sourceKey | { [region]: sourceKey } } },
  "dataFields":            [ …DataField ]   // admin-managed field catalogue (FP-04); seeded from DATA_FIELDS; Library dropdown consumes it read-only
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
  "commLogs":       [ …CommLog ],
  "notes":          [ …Note ],
  "readSignals":    [ signalId ]          // read notifications (intelligence bell)
}
```

News & market signals (`src/lib/data.ts`): `NewsSignal { id, headline, summary, source, url?, date, category: news|market|regulatory|financial, market?, counterpartyId?, impact: up|down|neutral, notify?, why?, scenarios?: string[] }`; `NEWS_SIGNALS` seed (real dated headline snapshots) is a constant, not persisted. Store exposes `newsSignals`, `readSignals`, `unreadSignalCount`, `markSignalRead`, `markAllSignalsRead`. Surfaced on `/intelligence`, the top-bar bell, and a deep-dive "Signals" strip. `scenarios` tags render an "Impacts" row of chips deep-linking to `/prospecting?scenario=<id>` (pre-filtered counterparty list). Display/context only; a signal never changes a score.

Data pipeline / scheduled runs (`src/lib/data.ts`, Sys Admin control panel): `PipelineJob { id, name, kind: source-refresh|rescore|signal-ingest, target, cadence, enabled, lastRun?, nextRun?, history: PipelineRun[] }` and `PipelineRun { at, status: success|running|failed|stale|paused, durationSec, records, note? }`; `PIPELINE_JOBS` seed is a constant, not persisted. Consumed only by `/pipeline` (gated to the Sys Admin role); reruns are simulated in component state. Production replaces the seed and simulated runs with a real scheduler/orchestrator (server-side credentials) behind the same shape.

When adding a slice here, add it in three places: the `useState`, the ops hydrate block, and the auto-save effect's dependency array + written object.

**C. Auth blob - `deal-scout.auth.v1`.** Written by the prototype sign-in gate (`src/lib/auth.tsx`), separate from the store. Holds the signed-in user `{ username, name, role }`. Client-side gate only, not real security (see DECISIONS D25).

**Still in-memory only:** `role` ("Admin" | "User") (set on sign-in, then in-memory), `decisions`, UI open/edit state, and the RBAC **"Viewing as"** role (Originator / Admin / Sys Admin) illustrated by the shell dropdown (`AppShell.tsx`); it filters nav only and is not persisted.

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
Note    { id, accountId, body, author, createdAt, updatedAt }   // ops blob; account notes, independent of the comms log

// Data sources / provenance (see DATA_SOURCES.md). SOURCES / FIELD_SOURCE / DEFAULT_TIER_WEIGHTS
// are seed constants in data.ts; the live values are the configurable SourceRegistry (config blob).
Source          { key, name, tier: 1|2|3|4, retrieved, info?, coverage? }   // coverage = region codes (["GLOBAL"], ["GB"], ["EU"], ["DE"]...)
FieldSourceMap  = Record<fieldKey, string | Record<region, sourceKey>>       // plain string = region-agnostic; object keyed by region, "*" is the default
SourceRegistry  { sources: Source[], tierWeights: Record<tier, number>, fieldSource: FieldSourceMap }  // persisted as sourceRegistry
sourceKeyForField(fieldKey, jurisdiction?, reg?) -> sourceKey?  // resolves: exact region, then EU fallback (EU_REGIONS), then "*"/GLOBAL default
sourceForField(fieldKey, jurisdiction?, reg?) -> Source | undefined
tierWeight(tier, weights?) -> number                            // 0-1 trust weight per tier
dataQuality(cp, reg?) -> { score, hasLei }                      // uses jurisdictionOf(cp) to pick region-correct sources
jurisdictionOf(cp) -> region code | undefined                   // cp.jurisdiction, else derived from cp.country (see REGIONS, EU_REGIONS)
// Region-aware (Phase A): scoreFor passes the counterparty's jurisdiction into scoreBreakdown; sub items carry sourceTier + retrieved.
// Sources are mapped per region on /sources (region selector); coverage is editable per source. Old string-valued fieldSource still resolves.

CommTemplate { id, channel, name, subject?, body, scenarioId? }   // config blob; scenarioId undefined = universal

// Real, sourced data on the featured counterparty only (FEATURED_COUNTERPARTY_ID = "yu-energy-gb").
// Optional Counterparty fields: realData?, regulatory?, gleif?, financials?
OfgemLicence            { companyNumber, regulator?, summary?, electricity?, gas?, retrieved, electricityUrl?, gasUrl?, links? }   // verified licence snapshot; regulator/summary/links generalise beyond Ofgem (BNetzA/CEREMP, E-Control, ElCom)
GleifSnapshot           { lei, legalName, companyNumber, status, registrationStatus, corroboration, hq, lastUpdate, note? }  // live fetch fallback
CompaniesHouseFinancials{ fiscalYear, revenue, revenueGrowth?, adjEbitda?, profitBeforeTax?, netCash?, deliveredVolume?, companyNumber, basis, source, retrieved, url }  // verified snapshot
// Shown together in the deep-dive "Verified identity, licence and financials" card; GLEIF verified live via api.gleif.org.

// Rules engine (config blob). See REQUIREMENTS_rules-engine.md.
DataField      { key, label, unit?, source, type?, description? }   // DATA_FIELDS = seed; live catalogue persisted as dataFields (config blob). Store: addDataField/updateDataField/deleteDataField. type = "number" | "boolean"
RuleType       = "graded-min"|"graded-max"|"gate-min"|"gate-max"|"between"|"boolean"
SubCriterion   { id, label, dataField, ruleType, thresholds{floor?,ceiling?,t?,x?,y?}, weight, direction, missing, enabled, blocking }
LibraryCriterion { id, label, description?, blocking, weight?, scenarios?, subCriteria: SubCriterion[] }   // persisted as criteriaLibrary; weight = criterion-level default importance (1-5), used by resolveScenario as ov?.weight ?? c.weight ?? 3; scenarios = ids this criterion applies to (undefined/empty = all)
// Store: duplicateLibraryCriterion(id) clones a criterion (new ids for it and its subs) and inserts it after the original.
// The library now covers Michael's full scenario/criteria set: the wired Demand Market Access
// criteria (real data fields) plus every other scenario's criteria generated from scenarios[].spec
// (deduped by key, tagged per scenario, inverse -> graded-max, optional -> lower weight, missing: "skip").
// resolveScenario filters the library by scenario membership. CritBreakdown gains noData (all subs
// skipped / no data): excluded from the fit and shown as "no data" in the deep-dive breakdown.
```

Rules engine (both layers built): the **criteria library** (Admin) lives in the config blob under `criteriaLibrary`; the data-field catalogue `DATA_FIELDS` and mocked per-counterparty values `COUNTERPARTY_FIELDS` are constants in `data.ts`. **Layer 2** scenario overrides live in the config blob under `scenarioRules` (`CritOverride = { enabled?, weight?, subOverrides?: { [subId]: { enabled?, weight?, thresholds? } } }`). `resolveScenario(scenarioId)` merges library + overrides into `EffectiveCriterion[]`; `scoreFor(cpId, scenarioId)` runs `subScore` and `scoreBreakdown` to produce a `ScoreBreakdown { fit, blocked, criteria[...] }`. The Counterparties table fit + "Blocked" flag and the deep-dive breakdown-to-source both use `scoreFor`. The old `/scenario` (Configure) screen is legacy; composition now lives at `/scenarios`.

Templates are content-admin authored (Admin role) and live in the **config blob** (Save-all). A template with no `scenarioId` is universal; one with a `scenarioId` overrides the universal for that channel + scenario. `renderTemplate(text, vars)` substitutes `{{token}}` values from `commTemplateVars(...)` (contact + account + scope); unknown tokens render as `[token]`. The CRM comms panel defaults to the universal template for the channel and lets the user pick a variant and edit before logging.

Flow: **Proceed** on a deep dive calls `startCrm(counterpartyId)`, which creates one `Account` (idempotent per counterparty) plus an auto `Contact` parsed from the counterparty's known contact. `enrichAccount` is a **mock** (simulated website + ZoomInfo) that adds a website and enriched contacts; replace its body with a real connector later. `logComm` records drafted messages (nothing is actually sent; LinkedIn stays draft-for-a-human). `setAccountStatus(id, "deal-closed", ref)` records a close from the external deal system and drives the "Deal closed" flag shown in the Counterparties table.

## 3b. Audit records (`src/lib/audit.ts`)

Phase 1 compliance traceability. Pure builder + exports; no persistence of its own yet.

```
AuditRecord {
  schema: "see-origination.audit.v1", recordId, generatedAt, generatedBy,
  counterparty { id, company, country, jurisdiction, legalEntityName, lei },
  scenario { id, title },
  liveVerification { gleif?, regulatory?, financials? },   // the live-source integrations
  ruleset { scope, thresholds, rules, rulesetHash, provenanceConfigHash },
  scoring { fit, band, blocked, recommendation, recommendationBasis, criteria[ { …, subs[ source, sourceTier, retrieved, rawValue, ruleType, thresholds, direction, missing, weight, subScore, flags ] } ] },
  decision | null,
  integrity { algo: "SHA-256", contentHash, note }
}
buildAuditRecord(input) -> AuditRecord            // deterministic, from the live breakdown + registry + library
finalizeRecord(record, input) -> AuditRecord      // async; attaches rulesetHash, provenanceConfigHash, contentHash (Web Crypto)
downloadAuditJson(input) / downloadAuditDossier(input)   // canonical JSON + printable HTML dossier
bandAndRecommendation(breakdown, config)          // band (green/amber/red/blocked) + system recommendation + basis
```

Surfaced on the deep dive as an "Audit trail" card, gated to the live-source counterparties (`cp.regulatory && cp.gleif`). `contentHash` is over the canonical record (stable key order) minus the hash field itself, so the record is verifiable and reproducible. Prototype log is browser-side; append-only signed storage is Phase 2 (see DECISIONS D28).

## 4. n8n workflow contracts (hub folder JSON)

Designed, exported as JSON in the OneDrive hub; not yet wired into Scout. The seam Scout expects:

| Workflow | Input | Output |
|---|---|---|
| `prospect-scan` | scope (commodity/region/hub) + scenario criteria | list of Counterparty-shaped records to populate the universe |
| `qualify` | a counterparty id + config | enriched fields, sub-scores, AI suggestion basis |
| scheduled **Auto Search** | schedule + saved scope | pre-runs the scan and stores the universe for the Counterparties page |

When wiring these for MVP, map their output to the `Counterparty` type above so the table and qualification pages need no structural change.
