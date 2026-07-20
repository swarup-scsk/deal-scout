import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ListChecks, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/shortlists")({
  head: () => ({
    meta: [
      { title: "Shortlists — SEE Origination Scout" },
      {
        name: "description",
        content: "Named shortlists of counterparties to pursue.",
      },
    ],
  }),
  component: Shortlists,
});

function Shortlists() {
  const {
    shortlists,
    counterparties,
    createShortlist,
    renameShortlist,
    deleteShortlist,
    removeFromShortlist,
  } = useStore();
  const navigate = useNavigate();
  const [newOpen, setNewOpen] = useState(false);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const cpById = (id: string) => counterparties.find((c) => c.id === id);

  const create = () => {
    if (!name.trim()) return;
    createShortlist(name.trim());
    setName("");
    setNewOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Shortlists</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Group the counterparties you want to pursue. Open one to deep dive.
          </p>
        </div>
        <Button onClick={() => setNewOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New shortlist
        </Button>
      </div>

      {shortlists.length === 0 && (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ListChecks className="h-6 w-6" />
          </span>
          <div>
            <div className="font-medium text-foreground">No shortlists yet</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Add counterparties to a shortlist from the Counterparties table or
              a deep dive, or create an empty one here.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate({ to: "/prospecting" })}>
            Go to counterparties
          </Button>
        </Card>
      )}

      {shortlists.map((s) => (
        <Card key={s.id} className="p-0">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            {editingId === s.id ? (
              <Input
                autoFocus
                defaultValue={s.name}
                className="max-w-xs"
                onBlur={(e) => {
                  renameShortlist(s.id, e.target.value);
                  setEditingId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    renameShortlist(s.id, (e.target as HTMLInputElement).value);
                    setEditingId(null);
                  }
                }}
              />
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{s.name}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {s.counterpartyIds.length}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingId(s.id)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Rename shortlist"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => deleteShortlist(s.id)}
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Delete
            </Button>
          </div>

          {s.counterpartyIds.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted-foreground">
              Empty. Add counterparties from the Counterparties table.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {s.counterpartyIds.map((id) => {
                const cp = cpById(id);
                if (!cp) return null;
                return (
                  <li
                    key={id}
                    className="flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-muted/30"
                  >
                    <button
                      type="button"
                      className="flex-1 text-left"
                      onClick={() =>
                        navigate({
                          to: "/qualification/$id",
                          params: { id },
                        })
                      }
                    >
                      <span className="font-medium text-foreground">
                        {cp.company}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {cp.country} · {cp.businessLineType}
                      </span>
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        navigate({
                          to: "/qualification/$id",
                          params: { id },
                        })
                      }
                    >
                      Deep dive <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Button>
                    <button
                      type="button"
                      onClick={() => removeFromShortlist(s.id, id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remove from shortlist"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      ))}

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New shortlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label className="text-xs">Name (required)</Label>
            <Input
              autoFocus
              value={name}
              placeholder="e.g. Q3 storage targets"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={create} disabled={!name.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
