import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAppStore } from "../lib/store";

export const Route = createFileRoute("/evaluations")({ component: EvaluationRedirect });

function EvaluationRedirect() {
  const { currentUser, isLoaded } = useAppStore();
  const [waitedTooLong, setWaitedTooLong] = useState(false);

  useEffect(() => {
    if (!isLoaded) {
      const timer = setTimeout(() => setWaitedTooLong(true), 3500);
      return () => clearTimeout(timer);
    }
    setWaitedTooLong(false);
  }, [isLoaded]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#f2f2f2] flex items-center justify-center p-4">
        <div className="border-4 border-black bg-white p-6 sm:p-8 max-w-md w-full shadow-[8px_8px_0_#000] text-center">
          <div className="w-12 h-12 border-4 border-black border-t-[#0035D5] rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-2">Verifying your session…</h2>
          <p className="text-sm font-mono text-gray-700 mb-4">
            {waitedTooLong
              ? "Connecting to backend service (Render cold start may take a few moments)..."
              : "Verifying your role credentials and permissions."}
          </p>
          {waitedTooLong && (
            <div className="flex flex-col gap-3 mt-4">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="border-2 border-black bg-[#FFD700] hover:bg-black hover:text-white px-4 py-2 font-bold text-sm shadow-[3px_3px_0_#000] transition-all cursor-pointer"
              >
                ↻ Retry Connection
              </button>
              <Link
                to="/login"
                className="border-2 border-black bg-white hover:bg-black hover:text-white px-4 py-2 font-bold text-sm shadow-[3px_3px_0_#000] transition-all"
              >
                Sign In Again
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Navigate
      to={currentUser?.role === "admin" ? "/admin/evaluations" : "/judge-command-center"}
      replace
    />
  );
}
