import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/crm")({
  head: () => ({
    meta: [
      { title: "CRM — SEE Origination Scout" },
      {
        name: "description",
        content: "Accounts promoted from qualification into the micro-CRM.",
      },
    ],
  }),
  component: CrmList,
});

function CrmList() {
  const { accounts, contacts, commLogs } = useStore();
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">CRM</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Accounts you decided to proceed with. Manage contacts and outreach here.
        </p>
      </div>

      {accounts.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Building2 className="h-6 w-6" />
          </span>
          <div>
            <div className="font-medium text-foreground">No accounts yet</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose Proceed on a counterparty's deep dive to start an account
              here.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate({ to: "/prospecting" })}>
            Go to counterparties
          </Button>
        </Card>
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contacts</TableHead>
                <TableHead>Comms</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((a) => {
                const nContacts = contacts.filter(
                  (c) => c.accountId === a.id,
                ).length;
                const nComms = commLogs.filter(
                  (c) => c.accountId === a.id,
                ).length;
                return (
                  <TableRow
                    key={a.id}
                    className="cursor-pointer"
                    onClick={() =>
                      navigate({
                        to: "/crm/$accountId",
                        params: { accountId: a.id },
                      })
                    }
                  >
                    <TableCell className="font-medium text-foreground">
                      {a.company}
                    </TableCell>
                    <TableCell>
                      {a.status === "deal-closed" ? (
                        <Badge variant="destructive">Deal closed</Badge>
                      ) : (
                        <Badge>Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {nContacts}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {nComms}
                    </TableCell>
                    <TableCell className="text-right">
                      <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
