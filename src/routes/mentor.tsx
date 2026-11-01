import { createFileRoute, Navigate } from "@tanstack/react-router";
export const Route = createFileRoute("/mentor")({
  component: () => <Navigate to="/mentor-command-center" replace />,
});
