# Requirements - Configurable Scoring (Rules Engine) and CRM Notes

**Last updated:** 2026-07-30
**Source:** Michael + Ardhendu meeting, 30 Jul 2026 (see MoM). Converts meeting decisions 1-4 into requirements.
**Status:** Approved for build (prototype scope). Ardhendu to bring UX options for the configurator; data model below is agreed.

Prototype scope: configuration lives in the **config blob** (`deal-scout.state.v2`, Save-all); raw field values are **mocked per counterparty**; rule-type maths lives in **code**; editing is **Admin only**.

## 1. Scoring model

- A scenario's **fit score (0-100)** is the **weighted average of its criteria scores**.
- Each **criterion score (0-100)** is the **weighted average of its enabled sub-criteria scores** (by sub-criterion weight).
- **Fit (0-100)** is the **weighted average of the enabled criterion scores** (by criterion weight).
- **Two weights, in two places:** the **sub-criterion weight** ("Importance", 1-5) is defined in the **Library** and can be tweaked per scenario; the **criterion weight** (1-5) is **not in the Library** but is a **scenario-level control the originator sets** (how much each criterion group counts), defaulting to equal.
- Normalisation is over **enabled items only** (a disabled criterion or sub-criterion is excluded from both the score and the weight denominator).

## 2. Sub-criterion scoring (deterministic)

Each sub-criterion maps one **data field** to a **0-100 sub-score** using a **rule type + thresholds**. Rule types are a coded library; thresholds are configured by Admin (Q5 decision).

Initial rule types:

| Rule type | Behaviour |
|---|---|
| `gate-min` | value >= T then 100, else 0 (pure go/no-go, higher is better) |
| `gate-max` | value <= T then 100, else 0 (lower is better) |
| `graded-min` | below floor F = 0; F..ceiling C scales 0..100; above C = 100 |
| `graded-max` | mirror of graded-min (lower is better) |
| `between` | inside [X,Y] = 100; outside = 0 (or graded to nearest bound) |
| `boolean` | present = 100, absent = 0 |

Example (Michael): asset `graded-min`, floor 100K, ceiling e.g. 1M. Asset < 100K scores 0; 200K scores a low-but-nonzero value; larger scores higher.

**Direction** (replaces the old `inverse` flag): captured by choosing the `min` vs `max` rule variant, so a *gap* can score higher where that is the opportunity.

## 3. Go / no-go blocking

- A criterion or sub-criterion may be flagged **blocking**.
- If a **blocking sub-criterion** scores 0, its criterion score becomes 0 and is marked blocked.
- If a **blocking criterion** scores 0 (or is blocked), the counterparty is **Blocked** for that scenario: the fit is still computed and shown, but the row is flagged "Blocked" and can be gated out of the shortlist.
- Non-blocking zeros simply lower the weighted average.

## 4. Toggling and composition

- Admin can **enable/disable individual sub-criteria** within a criterion.
- Admin can **add or remove criteria** for a specific scenario.
- Disabled items are excluded from scoring and normalisation (D-onwards toggle behaviour).

## 5. Data field catalogue

- Sub-criteria pick a field from a **fixed catalogue** (Q9). Start with a catalogue; expand as stakeholders react.
- `DataField { key, label, type: "number"|"boolean"|"text", unit?, source }`.
- Prototype ships **mocked raw values per counterparty per field**, each with provenance `{ source, retrievedAt }` so scores are real, reproducible, and traceable to source.

## 6. Criteria library + per-scenario override (Q15)

- A global **criteria library** holds reusable criterion definitions (label, description, sub-criteria, default weights, blocking).
- A scenario **references** library criteria and may **override locally**: enabled state, criterion weight, blocking, and per-sub-criterion enabled/weight/thresholds/blocking.
- Editing a **library** definition propagates to all scenarios **except where a scenario has overridden** that field.
- **Placeholders:** the library/scenario provides empty criteria and sub-criteria (weight 0, disabled, descriptor labels A1..A5) that Admin can fill without code.
- **Counts (Q13/14):** default **3 active criteria** per scenario, soft cap **~6**, with **5 empty placeholders** available.

## 7. Roles (two tiers)

Two configuration layers with different owners:

- **Layer 1 - Library (Admin only).** The admin authors the master catalogue: which criteria and sub-criteria exist, the full deterministic logic per sub-criterion (data field, rule type, thresholds, direction, missing-data, blocking) and default weights. Shared with, and reusable by, every originator. Also owns the data-field catalogue and placeholders.
- **Layer 2 - Origination configuration (originator / User).** An originator pulls library criteria and sub-criteria into their scenario and can then tweak locally: switch sub-criteria on/off, and adjust thresholds and weights for their requirement. These are per-scenario **overrides** on top of the library; the library stays the source of truth and "reset to library" restores defaults. The UI shows a "customised vs library default" indicator.

Net: the library definition is Admin-only; scenario composition and local tweaks are the originator's. (Revises the earlier "Admin only for everything" position.)

## 8. Transparency (explainability)

The deep dive must explain a score **all the way to source** (Q3):

```
fit (0-100, Blocked?)
  └ per criterion: label, weight, score, contribution, blocked?
       └ per sub-criterion: field, raw value, source link, rule type + thresholds, sub-score, weight, blocking?
```

Re-running only re-gathers data; the scoring function is **pure**, so identical inputs give identical scores.

## 9. Target data model (additions)

Config blob (Save-all):

```
DataField      { key, label, type, unit?, source }
RuleType       = "gate-min"|"gate-max"|"graded-min"|"graded-max"|"between"|"boolean"
SubCriterion   { id, label, dataField, ruleType, thresholds:{floor?,ceiling?,t?,x?,y?}, weight:1-5, direction, missing, enabled, blocking }   // weight = the only weight in the model
LibraryCriterion { id, label, description, subCriteria: SubCriterion[], blocking }   // no criterion weight in the library
ScenarioCriterion {
  libraryId,                 // ref to a LibraryCriterion (or ad-hoc)
  enabled,
  weight: 1-5,               // criterion weight - scenario-level, originator-set, default equal
  blockingOverride?,
  subOverrides?: { [subId]: { enabled?, weight?, thresholds?, blocking? } }   // originator may override sub weight + thresholds
}
Scenario gains: criteria: ScenarioCriterion[]   // supersedes the current spec/criteria
```

Operational blob (auto-save):

```
Counterparty gains: fieldValues: Record<dataFieldKey, number|boolean|string>,
                    provenance:  Record<dataFieldKey, { source, retrievedAt }>
```

Scoring lives in code as pure functions: `subScore(ruleType, value, thresholds) -> 0..100`, then criterion and fit aggregation with blocking, producing a `ScoreBreakdown` object for the deep dive.

## 10. CRM notes (Decision 4)

- An account has a **Notes** capability **independent of communications** (Q16).
- `Note { id, accountId, body, author, createdAt, updatedAt }` in the operational blob.
- Notes are **timestamped and attributed**, and **editable and deletable** (Q17).
- A note may **also** be logged to the communication log if the user chooses; funnel/pipeline stages are **out of scope** (declined in the meeting).

## 11. Acceptance criteria (prototype)

- Admin can, for a scenario: add/remove criteria (from library or new), toggle sub-criteria, set two-level weights, set thresholds per rule type, mark criteria/sub-criteria blocking, and reset a scenario to its library defaults.
- Changing a threshold or weight changes the counterparty scores deterministically and the deep-dive breakdown reflects it to source.
- A blocking zero flags the counterparty "Blocked".
- Library edits propagate to non-overridden scenarios; overridden values stay put.
- User role sees all of the above read-only.
- CRM account has add/edit/delete notes, timestamped and attributed, separate from the comms log.

## 12. Out of scope for the prototype

Real data feeds and RAG source restriction, bespoke non-library rule types, pipeline/funnel stages, and multi-user auth. These are productionization items (see ROADMAP).
