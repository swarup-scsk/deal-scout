import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Globe,
  Mail,
  Linkedin,
  RotateCcw,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import type { CommChannel, Contact } from "@/lib/data";

export const Route = createFileRoute("/crm/$accountId")({
  head: () => ({
    meta: [
      { title: "Account — SEE Origination Scout" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CrmDetail,
});

function emailTemplate(
  company: string,
  contactName: string,
  scope: { commodity: string; region: string; hub: string },
) {
  const first = contactName.split(" ")[0] || "there";
  return {
    subject: `SEE Origination — ${scope.commodity} opportunity for ${company}`,
    body: `Hi ${first},

I lead origination at SEE. We work with ${scope.region} counterparties on ${scope.commodity} structures around ${scope.hub}, and ${company} looks like a strong fit for what we are building.

Would you be open to a short call to explore whether there is a basis to work together?

Best regards,
SEE Origination`,
  };
}

function linkedinTemplate(company: string, contactName: string) {
  const first = contactName.split(" ")[0] || "there";
  return `Hi ${first}, I lead origination at SEE. We are active with counterparties like ${company} on structured energy deals and I would value a quick conversation. Open to connecting?`;
}

function CrmDetail() {
  const { accountId } = useParams({ from: "/crm/$accountId" });
  const {
    accounts,
    contacts,
    commLogs,
    config,
    addContact,
    enrichAccount,
    logComm,
    setAccountStatus,
  } = useStore();
  const navigate = useNavigate();

  const account = accounts.find((a) => a.id === accountId);
  const accountContacts = contacts.filter((c) => c.accountId === accountId);
  const logs = commLogs.filter((c) => c.accountId === accountId);

  const [channel, setChannel] = useState<CommChannel>("email");
  const [contactId, setContactId] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [toast, setToast] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [dealRef, setDealRef] = useState("");
  const [form, setForm] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    linkedin: "",
  });

  const selectedContact: Contact | undefined =
    accountContacts.find((c) => c.id === contactId) ?? accountContacts[0];

  // Autofill the template whenever channel or selected contact changes.
  useEffect(() => {
    if (!account) return;
    const name = selectedContact?.name ?? "there";
    if (channel === "email") {
      const t = emailTemplate(account.company, name, config.scope);
      setSubject(t.subject);
      setBody(t.body);
    } else if (channel === "linkedin") {
      setSubject("");
      setBody(linkedinTemplate(account.company, name));
    } else {
      setSubject("");
      setBody("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, contactId, account?.id]);

  if (!account) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Account not found.</p>
        <Button onClick={() => navigate({ to: "/crm" })}>Back to CRM</Button>
      </div>
    );
  }

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2500);
  };

  const submitContact = () => {
    if (!form.name.trim()) return;
    addContact(account.id, { ...form });
    setForm({ name: "", role: "", email: "", phone: "", linkedin: "" });
    setAddOpen(false);
  };

  const send = () => {
    if (!body.trim()) return;
    logComm(account.id, { channel, subject: subject || undefined, body });
    flash(
      channel === "email"
        ? "Email drafted and logged (no message sent in prototype)."
        : channel === "linkedin"
          ? "LinkedIn message drafted and logged (send manually)."
          : "Note logged.",
    );
  };

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => navigate({ to: "/crm" })}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" /> All accounts
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">
              {account.company}
            </h1>
            {account.status === "deal-closed" ? (
              <Badge variant="destructive">Deal closed</Badge>
            ) : (
              <Badge>Active</Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <button
              type="button"
              className="hover:text-foreground"
              onClick={() =>
                navigate({
                  to: "/qualification/$id",
                  params: { id: account.counterpartyId },
                })
              }
            >
              View deep dive
            </button>
            {account.website && (
              <a
                href={account.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-brand-blue hover:opacity-80"
              >
                <Globe className="h-3.5 w-3.5" /> {account.website}
              </a>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => enrichAccount(account.id)}>
            <Sparkles className="mr-2 h-4 w-4" />
            {account.enrichedAt ? "Re-enrich" : "Enrich (AI + plugins)"}
          </Button>
          {account.status === "deal-closed" ? (
            <Button
              variant="outline"
              onClick={() => setAccountStatus(account.id, "active")}
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Reopen
            </Button>
          ) : (
            <Button onClick={() => setCloseOpen(true)}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Mark deal closed
            </Button>
          )}
        </div>
      </div>

      {toast && (
        <div className="rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-foreground">
          {toast}
        </div>
      )}

      {account.status === "deal-closed" && (
        <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-foreground">
          Deal closed{account.dealRef ? ` (ref ${account.dealRef})` : ""}. This
          counterparty is flagged in the Counterparties table so it is not
          re-worked.
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        {/* Contacts */}
        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="font-semibold text-foreground">Contacts</div>
            <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
              <UserPlus className="mr-1.5 h-4 w-4" /> Add contact
            </Button>
          </div>
          {accountContacts.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted-foreground">
              No contacts yet. Enrich to surface contacts, or add one manually.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {accountContacts.map((c) => (
                <li key={c.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{c.name}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {c.source}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{c.role}</div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs">
                    {c.email && (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Mail className="h-3 w-3" /> {c.email}
                      </span>
                    )}
                    {c.linkedin && (
                      <a
                        href={c.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-brand-blue hover:opacity-80"
                      >
                        <Linkedin className="h-3 w-3" /> LinkedIn
                      </a>
                    )}
                    {c.phone && (
                      <span className="text-muted-foreground">{c.phone}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Communicate */}
        <Card className="space-y-3 p-4">
          <div className="font-semibold text-foreground">Communicate</div>
          <div className="flex flex-wrap gap-2">
            <Select value={channel} onValueChange={(v) => setChannel(v as CommChannel)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="linkedin">LinkedIn message</SelectItem>
                <SelectItem value="note">Note / log only</SelectItem>
              </SelectContent>
            </Select>
            {accountContacts.length > 0 && channel !== "note" && (
              <Select
                value={selectedContact?.id ?? ""}
                onValueChange={setContactId}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Recipient" />
                </SelectTrigger>
                <SelectContent>
                  {accountContacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {channel === "email" && (
            <div className="space-y-1.5">
              <Label className="text-xs">Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs">
              {channel === "note" ? "Note" : "Message (autofilled from profile)"}
            </Label>
            <Textarea
              rows={7}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={channel === "note" ? "Log a note…" : undefined}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={send} disabled={!body.trim()}>
              {channel === "note" ? "Log note" : "Log communication"}
            </Button>
            {channel !== "note" && (
              <Button
                variant="outline"
                onClick={() => flash("Copied to clipboard (mock).")}
              >
                <Copy className="mr-2 h-4 w-4" /> Copy
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Communication log */}
      <Card className="p-0">
        <div className="border-b border-border px-4 py-3 font-semibold text-foreground">
          Communication log
        </div>
        {logs.length === 0 ? (
          <p className="px-4 py-4 text-sm text-muted-foreground">
            No communications logged yet.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {logs.map((l) => (
              <li key={l.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                    {l.channel === "email" ? (
                      <Mail className="h-3.5 w-3.5" />
                    ) : l.channel === "linkedin" ? (
                      <Linkedin className="h-3.5 w-3.5" />
                    ) : null}
                    {l.subject || (l.channel === "linkedin" ? "LinkedIn message" : l.channel === "note" ? "Note" : "Email")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(l.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                  {l.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Add contact dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add contact</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Role</Label>
                <Input
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">LinkedIn URL</Label>
                <Input
                  value={form.linkedin}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, linkedin: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitContact} disabled={!form.name.trim()}>
              Add contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark deal closed dialog */}
      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark deal closed</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Deals are executed in a separate workflow system. Record the closed
            deal here so this counterparty is flagged in the Counterparties table
            and not re-worked.
          </p>
          <div className="space-y-1.5 py-2">
            <Label className="text-xs">Deal reference (optional)</Label>
            <Input
              value={dealRef}
              placeholder="e.g. SEE-2026-0142"
              onChange={(e) => setDealRef(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setAccountStatus(account.id, "deal-closed", dealRef.trim() || undefined);
                setDealRef("");
                setCloseOpen(false);
              }}
            >
              Confirm closed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
