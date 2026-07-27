import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout for the /crm branch. Renders the active child (list at /crm, or the
// account detail at /crm/$accountId) via the Outlet.
export const Route = createFileRoute("/crm")({
  component: () => <Outlet />,
});
