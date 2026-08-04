import { createFileRoute } from "@tanstack/react-router";
import { Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TEMPLATE_VARIABLES, type CommChannel } from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "Templates - SEE Origination Scout" },
      {
        name: "description",
        content: "Manage communication templates for each channel.",
      },
    ],
  }),
  component: Templates,
});

const CHANNELS: { id: CommChannel; label: string }[] = [
  { id: "email", label: "Email" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "note", label: "Note" },
];

function Templates() {
  const {
    commTemplates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    scenarios,
    dirty,
    saveAll,
  } = useStore();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Communication templates
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Author templates per channel. Leave scenario as Universal, or override
            for a transaction type.
          </p>
        </div>
        {dirty ? (
          <Button onClick={saveAll}>Save all</Button>
        ) : (
          <span className="flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-2 text-xs font-medium text-success">
            <Check className="h-3.5 w-3.5" /> All changes saved
          </span>
        )}
      </div>

      {(
        <Card className="flex flex-wrap items-center gap-2 p-3">
          <span className="text-xs text-muted-foreground">Add a template:</span>
          {CHANNELS.map((c) => (
            <Button
              key={c.id}
              variant="outline"
              size="sm"
              onClick={() =>
                addTemplate({
                  channel: c.id,
                  name: "New template",
                  subject: c.id === "email" ? "" : undefined,
                  body: "",
                })
              }
            >
              <Plus className="mr-1.5 h-4 w-4" /> {c.label}
            </Button>
          ))}
          <span className="ml-auto text-[11px] text-muted-foreground">
            Variables: {TEMPLATE_VARIABLES.map((v) => v.token).join("  ")}
          </span>
        </Card>
      )}

      {CHANNELS.map((c) => {
        const list = commTemplates.filter((t) => t.channel === c.id);
        return (
          <div key={c.id} className="space-y-3">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {c.label}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {list.length}
              </span>
            </div>

            {list.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No {c.label.toLowerCase()} templates yet.
              </p>
            )}

            {list.map((t) => (
              <Card key={t.id} className="space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={t.name}
                      onChange={(e) =>
                        updateTemplate(t.id, { name: e.target.value })
                      }
                    />
                  </div>
                  <div className="w-56 space-y-1.5">
                    <Label className="text-xs">Scenario</Label>
                    <Select
                        value={t.scenarioId ?? "universal"}
                        onValueChange={(v) =>
                          updateTemplate(t.id, {
                            scenarioId: v === "universal" ? undefined : v,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="universal">Universal</SelectItem>
                          {scenarios.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-5 text-destructive hover:text-destructive"
                    onClick={() => deleteTemplate(t.id)}
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" /> Delete
                  </Button>
                </div>

                {t.channel === "email" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Subject</Label>
                    <Input
                      value={t.subject ?? ""}
                      onChange={(e) =>
                        updateTemplate(t.id, { subject: e.target.value })
                      }
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs">Body</Label>
                  <Textarea
                    rows={6}
                    value={t.body}
                    onChange={(e) =>
                      updateTemplate(t.id, { body: e.target.value })
                    }
                  />
                </div>
              </Card>
            ))}
          </div>
        );
      })}
    </div>
  );
}
