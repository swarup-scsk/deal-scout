import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Newspaper,
  Pause,
  Play,
  RefreshCw,
  RotateCw,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  PIPELINE_JOBS,
  type PipelineJob,
  type PipelineKind,
  type RunStatus,
} from "@/lib/data";

export const Route = createFileRoute("/pipeline")({
  head: () => ({
    meta: [
      { title: "Data pipeline - SEE Origination Scout" },
      {
        name: "description",
        content:
          "Sys Admin control panel: scheduled runs, run health, retries and manual rerun.",
      },
    ],
  }),
  component: Pipeline,
});

function nowLabel(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const kindMeta: Record<PipelineKind, { label: string; icon: typeof Database }> = {
  "source-refresh": { label: "Source refresh", icon: Database },
  rescore: { label: "Rescore", icon: RotateCw },
  "signal-ingest": { label: "Signal ingest", icon: Newspaper },
};

const statusMeta: Record<
  RunStatus,
  { label: string; cls: string; icon: typeof CheckCircle2 }
> = {
  success: {
    label: "Success",
    cls: "border-success/30 bg-success/10 text-success",
    icon: CheckCircle2,
  },
  running: {
    label: "Running",
    cls: "border-brand-blue/30 bg-brand-blue/10 text-brand-blue",
    icon: RefreshCw,
  },
  failed: {
    label: "Failed",
    cls: "border-destructive/30 bg-destructive/10 text-destructive",
    icon: XCircle,
  },
  stale: {
    label: "Stale",
    cls: "border-warning/30 bg-warning/10 text-warning",
    icon: AlertTriangle,
  },
  paused: {
    label: "Paused",
    cls: "border-border bg-muted text-muted-foreground",
    icon: Pause,
  },
};

function StatusPill({ status }: { status: RunStatus }) {
  const m = statusMeta[status];
  const Icon = m.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${m.cls}`}
    >
      <Icon className={`h-3 w-3 ${status === "running" ? "animate-spin" : ""}`} />
      {m.label}
    </span>
  );
}

function Pipeline() {
  const [jobs, setJobs] = useState<PipelineJob[]>(() =>
    PIPELINE_JOBS.map((j) => ({ ...j, history: [...j.history] })),
  );
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const health = useMemo(() => {
    const eff = (j: PipelineJob): RunStatus =>
      !j.enabled ? "paused" : (busy[j.id] ? "running" : j.lastRun?.status ?? "stale");
    const c = { success: 0, running: 0, failed: 0, stale: 0, paused: 0 };
    jobs.forEach((j) => {
      c[eff(j)] += 1;
    });
    return c;
  }, [jobs, busy]);

  function runNow(id: string) {
    if (busy[id]) return;
    setBusy((b) => ({ ...b, [id]: true }));
    setJobs((js) =>
      js.map((j) =>
        j.id === id
          ? { ...j, lastRun: { ...(j.lastRun ?? { durationSec: 0, records: 0 }), at: nowLabel(), status: "running", note: undefined } }
          : j,
      ),
    );
    // Simulate the run completing. Deterministic success in the prototype.
    setTimeout(() => {
      setJobs((js) =>
        js.map((j) => {
          if (j.id !== id) return j;
          const run = {
            at: nowLabel(),
            status: "success" as RunStatus,
            durationSec: Math.max(4, Math.round((j.lastRun?.durationSec ?? 20))),
            records: j.lastRun?.records || 100,
          };
          return { ...j, enabled: true, lastRun: run, history: [run, ...j.history].slice(0, 8) };
        }),
      );
      setBusy((b) => ({ ...b, [id]: false }));
    }, 1300);
  }

  function toggleEnabled(id: string) {
    setJobs((js) =>
      js.map((j) =>
        j.id === id
          ? {
              ...j,
              enabled: !j.enabled,
              nextRun: !j.enabled ? j.nextRun ?? "Scheduled" : undefined,
              lastRun: j.lastRun
                ? { ...j.lastRun, status: !j.enabled ? j.lastRun.status : "paused" }
                : j.lastRun,
            }
          : j,
      ),
    );
  }

  const rescore = jobs.find((j) => j.kind === "rescore");

  return (
    <div className="max-w-5xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
          <Activity className="h-6 w-6 text-brand-blue" /> Data pipeline
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Platform-ops control for scheduled runs. This is where a Sys Admin owns
          cadence, run health, retries and manual rerun. It is separate from Sources,
          where a business Admin sets what feeds each field and how much it is trusted.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <HealthCard label="Healthy" value={health.success} tone="text-success" icon={CheckCircle2} />
        <HealthCard label="Running" value={health.running} tone="text-brand-blue" icon={RefreshCw} />
        <HealthCard
          label="Failed"
          value={health.failed}
          tone="text-destructive"
          icon={XCircle}
        />
        <HealthCard
          label="Stale or paused"
          value={health.stale + health.paused}
          tone="text-warning"
          icon={AlertTriangle}
        />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border px-4 py-3">
          <div className="text-sm font-semibold text-foreground">Scheduled jobs</div>
          <div className="text-xs text-muted-foreground">
            Source refreshes, rescoring and signal ingestion. Run now triggers an
            immediate, out-of-schedule run.
          </div>
        </div>
        <div className="divide-y divide-border">
          {jobs.map((j) => {
            const KindIcon = kindMeta[j.kind].icon;
            const eff: RunStatus = !j.enabled
              ? "paused"
              : busy[j.id]
                ? "running"
                : j.lastRun?.status ?? "stale";
            return (
              <div key={j.id} className="px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <KindIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{j.name}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {kindMeta[j.kind].label}
                      </span>
                      <StatusPill status={eff} />
                    </div>
                    <div className="mt-1 text-[13px] text-muted-foreground">{j.target}</div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {j.cadence}
                      </span>
                      {j.lastRun && (
                        <span>
                          Last: {j.lastRun.at}
                          {j.lastRun.status === "success" &&
                            ` (${j.lastRun.durationSec}s, ${j.lastRun.records} records)`}
                        </span>
                      )}
                      <span>Next: {j.enabled ? j.nextRun ?? "Scheduled" : "Paused"}</span>
                    </div>
                    {j.lastRun?.note && (
                      <div
                        className={`mt-1.5 inline-flex items-start gap-1.5 rounded-md px-2 py-1 text-[11px] ${
                          eff === "failed"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-warning/10 text-warning"
                        }`}
                      >
                        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                        {j.lastRun.note}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => runNow(j.id)}
                      disabled={busy[j.id]}
                      className="inline-flex items-center gap-1.5 rounded-md bg-brand-blue px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-blue/90 disabled:opacity-60"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${busy[j.id] ? "animate-spin" : ""}`} />
                      {eff === "failed" ? "Retry" : "Run now"}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleEnabled(j.id)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60"
                    >
                      {j.enabled ? (
                        <>
                          <Pause className="h-3.5 w-3.5" /> Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" /> Resume
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {rescore && (
        <Card className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <RotateCw className="h-4 w-4 text-brand-blue" />
                <span className="text-sm font-semibold text-foreground">Rescoring</span>
              </div>
              <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">
                Scores recompute automatically after each source run and whenever a rule
                or scenario weight is published. Trigger a full rescore manually if needed.
                Scoring stays deterministic and explainable: a rerun changes inputs, never
                the logic, and every value still traces back to its source.
              </p>
              <div className="mt-1.5 text-[11px] text-muted-foreground">
                Last full rescore: {rescore.lastRun?.at ?? "-"}
                {rescore.lastRun?.status === "success" &&
                  ` (${rescore.lastRun.records} counterparties)`}
              </div>
            </div>
            <button
              type="button"
              onClick={() => runNow(rescore.id)}
              disabled={busy[rescore.id]}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-brand-blue/40 bg-brand-blue/10 px-3 py-2 text-xs font-medium text-brand-blue transition-colors hover:bg-brand-blue/20 disabled:opacity-60"
            >
              <RotateCw className={`h-4 w-4 ${busy[rescore.id] ? "animate-spin" : ""}`} />
              Rescore all
            </button>
          </div>
        </Card>
      )}

      <Card className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Recent run history</span>
        </div>
        <div className="space-y-1.5">
          {jobs
            .flatMap((j) => j.history.map((h) => ({ job: j.name, ...h })))
            .sort((a, b) => b.at.localeCompare(a.at))
            .slice(0, 10)
            .map((h, i) => (
              <div
                key={i}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border/60 pb-1.5 text-[12px] last:border-0"
              >
                <span className="w-32 shrink-0 text-muted-foreground">{h.at}</span>
                <StatusPill status={h.status} />
                <span className="font-medium text-foreground">{h.job}</span>
                <span className="text-muted-foreground">
                  {h.status === "success"
                    ? `${h.durationSec}s, ${h.records} records`
                    : h.note ?? ""}
                </span>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}

function HealthCard({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  tone: string;
  icon: typeof CheckCircle2;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${tone}`} />
      </div>
      <div className={`mt-1 text-2xl font-semibold ${tone}`}>{value}</div>
    </Card>
  );
}
