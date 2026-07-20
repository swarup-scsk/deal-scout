# SEE Origination - Knowledge Pack (start here)

Repo mirror of the SEE / SCEE origination knowledge pack. **The canonical copy lives in the OneDrive project hub** (`…/Projects/SEE Origination/knowledge-pack/`); this copy travels with the repo. Keep the two identical.

**Canonical location:** the OneDrive project hub `…/Projects/SEE Origination/knowledge-pack/`.
A full mirror lives in the `deal-scout` repo at `deal-scout/knowledge-pack/`. The two are kept identical; update both in the same change (see maintenance rule below).

**Last updated:** 2026-07-20

## The documents

| Doc | What it is |
|---|---|
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) | The problem, the goal, who's who, what exists today, phases, success criteria, sensitivity notes. |
| [TECH_STACK.md](TECH_STACK.md) | Every tool and why, architecture + data-flow diagram, hosting, environment variables, design system. |
| [DATA_CONTRACT.md](DATA_CONTRACT.md) | The interfaces components share: core types, the localStorage blob, and the n8n workflow contracts. |
| [ROADMAP.md](ROADMAP.md) | Phases with concrete items, done / next / parked, and the inputs still required. |
| [DECISIONS_AND_GOTCHAS.md](DECISIONS_AND_GOTCHAS.md) | Key decisions and why (lightweight ADR) plus every trap found, so no one relearns them. |

## Code repositories

| Repo | Role | GitHub |
|---|---|---|
| `deal-scout` (`C:\see-dev\deal-scout`) | **Active build** - the Scout origination prototype. This pack's README + CLAUDE.md live here. | `swarup-scsk/deal-scout` (connected to Lovable) |
| `see-origination-hub` (`C:\see-dev\see-origination-hub`) | Prior 9-stage origination prototype. Reference / donor for Scout. Not actively developed. | `swarup-scsk/see-origination-hub` |
| `connected-see-ai-trader` (`C:\see-dev\see-power-trader\connected-see-ai-trader`) | Power Trader app. Related but separate project. | `swarup-scsk/connected-see-ai-trader` |

## Domain primer / glossary (in this hub folder)

- `2026-06-03-origination-glossary.docx` - origination terms and definitions.
- `2026-06-02-see-origination-briefing.docx` - business briefing.
- `2026-07-06-scout-scope-note.md` - what Scout builds, cuts, and reuses (original scope).
- `2026-07-06-scout-information-architecture.md` - original screen-level IA.
- `2026-06-03-origination-system-architecture.docx` - full-system architecture.
- `2026-06-03-origination-datasource-map.docx` - candidate real data feeds.

## Maintenance rule (non-negotiable)

After any meaningful change or decision - a feature, a schema/interface change, an infra/env change, a decision, or a newly found gotcha - **update the relevant knowledge-pack doc(s) and the repo README in the same change.** Updating the docs is part of "done", not a follow-up.

Routing guide:

- data or interface change → `DATA_CONTRACT.md`
- new feature or priority shift → `ROADMAP.md`
- a decision or a pitfall → `DECISIONS_AND_GOTCHAS.md`
- stack / infra / env change → `TECH_STACK.md`

Because the pack is mirrored (hub + repo), apply the edit to both copies in the same change. No secrets in any doc: record variable names and where they live, never values.
