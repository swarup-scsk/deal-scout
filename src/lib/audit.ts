// Audit layer (Phase 1). Assembles a self-contained, re-computable evidence
// record for a single counterparty + scenario score: the full chain from source
// and value, through the scoring logic and sub-scores, to the fit, band,
// recommendation and (if taken) the human decision. Two exports: canonical JSON
// (record of account) and a printable HTML dossier. A SHA-256 content hash lets
// anyone detect tampering; true immutability is a Phase 2 server concern.
//
// Scoped in the UI to the live-source counterparties (real GLEIF / register /
// financials), so the record can be used to verify those integrations.

import type {
  Config,
  Counterparty,
  EffectiveCriterion,
  ScoreBreakdown,
  SourceRegistry,
} from "./data";

export const AUDIT_SCHEMA = "see-origination.audit.v1";

export interface AuditInput {
  cp: Counterparty;
  scenarioId: string;
  scenarioTitle: string;
  breakdown: ScoreBreakdown;
  effective: EffectiveCriterion[];
  config: Config;
  sourceRegistry: SourceRegistry;
  user?: { name?: string; username?: string; role?: string };
  decision?: { choice: string; rationale?: string; timestamp?: string } | null;
}

export type Band = "green" | "amber" | "red" | "blocked";

export interface AuditRecord {
  schema: string;
  recordId: string;
  generatedAt: string;
  generatedBy: { name?: string; username?: string; role?: string } | null;
  counterparty: {
    id: string;
    company: string;
    country?: string;
    jurisdiction?: string;
    legalEntityName?: string;
    lei?: string;
  };
  scenario: { id: string; title: string };
  liveVerification: {
    gleif?: unknown;
    regulatory?: unknown;
    financials?: unknown;
  };
  ruleset: {
    scope: Config["scope"];
    thresholds: Config["thresholds"];
    rules: Config["rules"];
    rulesetHash?: string;
    provenanceConfigHash?: string;
  };
  scoring: {
    fit: number;
    band: Band;
    blocked: boolean;
    recommendation: string;
    recommendationBasis: string;
    criteria: Array<{
      id: string;
      label: string;
      weight: number;
      score: number;
      blocked: boolean;
      noData: boolean;
      subs: Array<{
        id: string;
        label: string;
        field: string;
        unit?: string;
        source?: string;
        sourceTier?: number;
        retrieved?: string;
        rawValue?: number;
        ruleType: string;
        thresholds: Record<string, number | undefined>;
        direction?: string;
        missing?: string;
        weight: number;
        subScore: number;
        blocking: boolean;
        blocked: boolean;
        skipped: boolean;
      }>;
    }>;
  };
  decision: { choice: string; rationale?: string; timestamp?: string } | null;
  integrity: { algo: "SHA-256"; contentHash?: string; note: string };
}

export function bandAndRecommendation(
  breakdown: ScoreBreakdown,
  config: Config,
): { band: Band; recommendation: string; basis: string } {
  const { green, amber } = config.thresholds;
  const fit = breakdown.fit;
  if (breakdown.blocked) {
    const gate = breakdown.criteria.find((c) => c.blocked);
    return {
      band: "blocked",
      recommendation: "Do not proceed (blocked)",
      basis: `A gating criterion failed${gate ? ` (${gate.label})` : ""}; fit ${fit} is not considered while a gate is breached.`,
    };
  }
  if (fit >= green)
    return {
      band: "green",
      recommendation: "Proceed",
      basis: `Fit ${fit} is at or above the strong threshold (${green}); no gate breached.`,
    };
  if (fit >= amber)
    return {
      band: "amber",
      recommendation: "Review (borderline)",
      basis: `Fit ${fit} is between the borderline (${amber}) and strong (${green}) thresholds; no gate breached.`,
    };
  return {
    band: "red",
    recommendation: "Park",
    basis: `Fit ${fit} is below the borderline threshold (${amber}); no gate breached.`,
  };
}

export function buildAuditRecord(input: AuditInput): AuditRecord {
  const { cp, breakdown, effective, config } = input;
  const effByCrit = new Map(effective.map((c) => [c.id, c]));
  const { band, recommendation, basis } = bandAndRecommendation(
    breakdown,
    config,
  );

  return {
    schema: AUDIT_SCHEMA,
    recordId:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `rec-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    generatedBy: input.user ?? null,
    counterparty: {
      id: cp.id,
      company: cp.company,
      country: cp.country,
      jurisdiction: cp.jurisdiction,
      legalEntityName: cp.legalEntityName,
      lei: cp.lei,
    },
    scenario: { id: input.scenarioId, title: input.scenarioTitle },
    liveVerification: {
      gleif: cp.gleif,
      regulatory: cp.regulatory,
      financials: cp.financials,
    },
    ruleset: {
      scope: config.scope,
      thresholds: config.thresholds,
      rules: config.rules,
    },
    scoring: {
      fit: breakdown.fit,
      band,
      blocked: breakdown.blocked,
      recommendation,
      recommendationBasis: basis,
      criteria: breakdown.criteria.map((c) => {
        const eff = effByCrit.get(c.id);
        const effSub = new Map((eff?.subCriteria ?? []).map((s) => [s.id, s]));
        return {
          id: c.id,
          label: c.label,
          weight: c.weight,
          score: c.score,
          blocked: c.blocked,
          noData: !!c.noData,
          subs: c.subs.map((s) => ({
            id: s.id,
            label: s.label,
            field: s.field,
            unit: s.unit,
            source: s.source,
            sourceTier: s.sourceTier,
            retrieved: s.retrieved,
            rawValue: s.rawValue,
            ruleType: s.ruleType,
            thresholds: s.thresholds as Record<string, number | undefined>,
            direction: effSub.get(s.id)?.direction,
            missing: effSub.get(s.id)?.missing,
            weight: s.weight,
            subScore: s.subScore,
            blocking: s.blocking,
            blocked: s.blocked,
            skipped: s.skipped,
          })),
        };
      }),
    },
    decision: input.decision ?? null,
    integrity: {
      algo: "SHA-256",
      note: "Content hash over the canonical record (all fields except integrity.contentHash). Prototype log is browser-side; the hash proves integrity, tamper-proof storage is Phase 2.",
    },
  };
}

// --- Canonicalisation + integrity ------------------------------------------

function sortValue(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortValue);
  if (v && typeof v === "object") {
    return Object.keys(v as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortValue((v as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return v;
}

export function canonicalJson(o: unknown): string {
  return JSON.stringify(sortValue(o));
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Attach ruleset / registry / content hashes. Hashes are computed over the
// canonical form so the record is verifiable and reproducible.
export async function finalizeRecord(
  record: AuditRecord,
  input: AuditInput,
): Promise<AuditRecord> {
  const rulesetHash = await sha256Hex(
    canonicalJson({
      effective: input.effective,
      thresholds: input.config.thresholds,
      rules: input.config.rules,
    }),
  );
  const provenanceConfigHash = await sha256Hex(
    canonicalJson(input.sourceRegistry),
  );
  const withHashes: AuditRecord = {
    ...record,
    ruleset: { ...record.ruleset, rulesetHash, provenanceConfigHash },
  };
  const contentHash = await sha256Hex(
    canonicalJson({ ...withHashes, integrity: { ...withHashes.integrity, contentHash: undefined } }),
  );
  return { ...withHashes, integrity: { ...withHashes.integrity, contentHash } };
}

// --- Downloads --------------------------------------------------------------

function triggerDownload(filename: string, content: string, mime: string) {
  if (typeof document === "undefined") return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function stamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function downloadAuditJson(input: AuditInput): Promise<void> {
  const record = await finalizeRecord(buildAuditRecord(input), input);
  triggerDownload(
    `audit_${input.cp.id}_${input.scenarioId}_${stamp()}.json`,
    JSON.stringify(record, null, 2),
    "application/json",
  );
}

export async function downloadAuditDossier(input: AuditInput): Promise<void> {
  const record = await finalizeRecord(buildAuditRecord(input), input);
  triggerDownload(
    `audit_${input.cp.id}_${input.scenarioId}_${stamp()}.html`,
    renderDossierHtml(record),
    "text/html",
  );
}

// --- Printable dossier ------------------------------------------------------

function esc(v: unknown): string {
  if (v === undefined || v === null) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function thr(t: Record<string, number | undefined>): string {
  return Object.entries(t)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k} ${v}`)
    .join(", ");
}

function liveVerificationHtml(lv: AuditRecord["liveVerification"]): string {
  const rows: string[] = [];
  const g = lv.gleif as Record<string, unknown> | undefined;
  const reg = lv.regulatory as Record<string, unknown> | undefined;
  const fin = lv.financials as Record<string, unknown> | undefined;
  if (g) {
    rows.push(
      `<div>GLEIF (LEI)</div><div>${esc(g.lei)} &middot; ${esc(g.legalName)} &middot; status ${esc(g.status ?? g.registrationStatus)}${g.lastUpdate ? ` &middot; updated ${esc(g.lastUpdate)}` : ""}</div>`,
    );
  }
  if (reg) {
    rows.push(
      `<div>Regulator / licence</div><div>${esc(reg.regulator ?? "Ofgem")}${reg.companyNumber ? ` &middot; no. ${esc(reg.companyNumber)}` : ""}${reg.retrieved ? ` &middot; retrieved ${esc(reg.retrieved)}` : ""}</div>`,
    );
  }
  if (fin) {
    rows.push(
      `<div>Financials</div><div>${esc(fin.source)}${fin.fiscalYear ? ` &middot; FY${esc(fin.fiscalYear)}` : ""}${fin.retrieved ? ` &middot; retrieved ${esc(fin.retrieved)}` : ""}</div>`,
    );
  }
  if (!rows.length)
    return '<p class="muted">No live-source verification attached to this counterparty.</p>';
  return `<div class="kv">${rows.join("")}</div>`;
}

export function renderDossierHtml(r: AuditRecord): string {
  const g = liveVerificationHtml(r.liveVerification);
  const scoreRows = r.scoring.criteria
    .map((c) => {
      const head = `<tr class="crit"><td colspan="7"><strong>${esc(c.label)}</strong> &nbsp; weight ${c.weight} &nbsp; ${c.blocked ? '<span class="bad">blocked</span>' : c.noData ? '<span class="muted">no data</span>' : `score ${c.score}`}</td></tr>`;
      const subs = c.subs
        .map(
          (s) => `<tr>
            <td>${esc(s.label)}</td>
            <td>${esc(s.rawValue)}${s.unit ? " " + esc(s.unit) : ""}</td>
            <td>${esc(s.source)}${s.sourceTier ? ` (T${s.sourceTier})` : ""}${s.retrieved ? `<br><span class="muted">${esc(s.retrieved)}</span>` : ""}</td>
            <td>${esc(s.ruleType)}${s.direction ? `, ${esc(s.direction)}` : ""}</td>
            <td>${esc(thr(s.thresholds))}</td>
            <td>${s.weight}</td>
            <td>${s.skipped ? '<span class="muted">skipped</span>' : s.blocked ? '<span class="bad">blocked</span>' : s.subScore}</td>
          </tr>`,
        )
        .join("");
      return head + subs;
    })
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8">
<title>Audit record ${esc(r.counterparty.company)}</title>
<style>
  :root{--blue:#0091D4;--green:#00A98A;--ink:#1c2530;--muted:#6b7683;--line:#e4e8ec;}
  *{box-sizing:border-box}
  body{font:13px/1.5 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:var(--ink);margin:32px;max-width:900px}
  h1{font-size:20px;margin:0 0 2px} h2{font-size:14px;margin:22px 0 8px;color:var(--blue);border-bottom:2px solid var(--line);padding-bottom:4px}
  .sub{color:var(--muted);margin:0 0 16px}
  table{width:100%;border-collapse:collapse;margin:6px 0 4px}
  th,td{text-align:left;padding:5px 8px;border-bottom:1px solid var(--line);vertical-align:top}
  th{font-size:11px;text-transform:uppercase;letter-spacing:.03em;color:var(--muted)}
  tr.crit td{background:#f4f7f9;border-top:1px solid var(--line)}
  .kv{display:grid;grid-template-columns:200px 1fr;gap:2px 12px;margin:4px 0}
  .kv div:nth-child(odd){color:var(--muted)}
  .pill{display:inline-block;padding:2px 10px;border-radius:999px;font-weight:600;color:#fff}
  .green{background:var(--green)} .amber{background:#c98a00} .red{background:#c0392b} .blocked{background:#c0392b}
  .muted{color:var(--muted)} .bad{color:#c0392b;font-weight:600}
  .hash{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px;word-break:break-all;color:var(--muted)}
  footer{margin-top:26px;border-top:2px solid var(--line);padding-top:10px;color:var(--muted);font-size:11px}
  @media print{body{margin:0}}
</style></head><body>
<h1>Origination audit record</h1>
<p class="sub">${esc(r.counterparty.company)} &nbsp;&middot;&nbsp; ${esc(r.scenario.title)} &nbsp;&middot;&nbsp; generated ${esc(r.generatedAt)}${r.generatedBy?.name ? ` by ${esc(r.generatedBy.name)}` : ""}</p>

<h2>Counterparty</h2>
<div class="kv">
  <div>Legal entity</div><div>${esc(r.counterparty.legalEntityName)}</div>
  <div>LEI</div><div>${esc(r.counterparty.lei)}</div>
  <div>Country / jurisdiction</div><div>${esc(r.counterparty.country)} / ${esc(r.counterparty.jurisdiction)}</div>
</div>

<h2>Live-source verification</h2>
${g}

<h2>Scoring logic and evidence</h2>
<table>
  <thead><tr><th>Sub-criterion</th><th>Value</th><th>Source</th><th>Rule</th><th>Thresholds</th><th>Wt</th><th>Score</th></tr></thead>
  <tbody>${scoreRows || '<tr><td colspan="7" class="muted">No scored criteria.</td></tr>'}</tbody>
</table>

<h2>Result and recommendation</h2>
<div class="kv">
  <div>Fit</div><div><strong>${r.scoring.fit}</strong> <span class="pill ${r.scoring.band}">${esc(r.scoring.band)}</span></div>
  <div>Banding</div><div>strong &ge; ${esc(r.ruleset.thresholds.green)}, borderline &ge; ${esc(r.ruleset.thresholds.amber)}</div>
  <div>System recommendation</div><div><strong>${esc(r.scoring.recommendation)}</strong></div>
  <div>Basis</div><div>${esc(r.scoring.recommendationBasis)}</div>
  <div>Human decision</div><div>${r.decision ? `${esc(r.decision.choice)}${r.decision.timestamp ? ` (${esc(r.decision.timestamp)})` : ""}${r.decision.rationale ? ` - ${esc(r.decision.rationale)}` : ""}` : '<span class="muted">not yet recorded</span>'}</div>
</div>

<footer>
  <div>Ruleset hash <span class="hash">${esc(r.ruleset.rulesetHash)}</span></div>
  <div>Source-registry hash <span class="hash">${esc(r.ruleset.provenanceConfigHash)}</span></div>
  <div>Record hash (${r.integrity.algo}) <span class="hash">${esc(r.integrity.contentHash)}</span></div>
  <div style="margin-top:6px">${esc(r.integrity.note)}</div>
</footer>
</body></html>`;
}
