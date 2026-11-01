import { createFileRoute } from "@tanstack/react-router";
import { MentorPortal } from "../components/role-portals/MentorPortal";
import { PortalGuard } from "../components/role-portals/Portal";
export const Route = createFileRoute("/mentor-command-center")({
  component: () => (
    <PortalGuard role="mentor">
      <MentorPortal />
    </PortalGuard>
  ),
  head: () => ({ meta: [{ title: "Mentor Command Center | CodeSrijan" }] }),
});
