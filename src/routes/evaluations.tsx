import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAppStore } from "../lib/store";
export const Route = createFileRoute("/evaluations")({ component: EvaluationRedirect });
function EvaluationRedirect() {
  const { currentUser, isLoaded } = useAppStore();
  if (!isLoaded)
    return (
      <p role="status" className="p-8">
        Verifying your session…
      </p>
    );
  return (
    <Navigate
      to={currentUser?.role === "admin" ? "/admin/evaluations" : "/judge-command-center"}
      replace
    />
  );
}
