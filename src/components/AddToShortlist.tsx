import { useState } from "react";
import { Check, ListPlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";

export function AddToShortlist({
  counterpartyId,
  variant = "outline",
  size = "sm",
  label = "Shortlist",
}: {
  counterpartyId: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm";
  label?: string;
}) {
  const {
    shortlists,
    addToShortlist,
    removeFromShortlist,
    createShortlist,
    shortlistsForCounterparty,
  } = useStore();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const memberOf = shortlistsForCounterparty(counterpartyId);
  const count = memberOf.length;

  const toggle = (listId: string) => {
    if (memberOf.includes(listId)) removeFromShortlist(listId, counterpartyId);
    else addToShortlist(listId, counterpartyId);
  };

  const createAndAdd = () => {
    if (!newName.trim()) return;
    createShortlist(newName.trim(), counterpartyId);
    setNewName("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <ListPlus className="mr-1.5 h-4 w-4" />
          {label}
          {count > 0 && (
            <span className="ml-1.5 rounded-full bg-brand-blue/15 px-1.5 text-[10px] font-semibold text-brand-blue">
              {count}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to shortlist</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-1">
          {shortlists.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No shortlists yet. Create one below.
            </p>
          )}
          {shortlists.map((s) => {
            const inList = s.counterpartyIds.includes(counterpartyId);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
                className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                  inList
                    ? "border-brand-blue/40 bg-brand-blue/5"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <span>
                  <span className="font-medium text-foreground">{s.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {s.counterpartyIds.length} counterparties
                  </span>
                </span>
                {inList && <Check className="h-4 w-4 text-brand-blue" />}
              </button>
            );
          })}
        </div>

        <div className="space-y-1.5 border-t border-border pt-3">
          <Label className="text-xs">New shortlist (name required)</Label>
          <div className="flex gap-2">
            <Input
              value={newName}
              placeholder="e.g. Q3 storage targets"
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createAndAdd()}
            />
            <Button onClick={createAndAdd} disabled={!newName.trim()}>
              <Plus className="mr-1.5 h-4 w-4" /> Create
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
