import { createFileRoute } from "@tanstack/react-router";
import { JudgePortal } from "../components/role-portals/JudgePortal";
import { PortalGuard } from "../components/role-portals/Portal";
export const Route = createFileRoute("/judge-command-center")({
  component: () => (
    <PortalGuard role="judge">
      <JudgePortal />
    </PortalGuard>
  ),
  head: () => ({ meta: [{ title: "Judge Command Center | CodeSrijan" }] }),
});
