import { useEffect, useRef } from "react";
import { useAppStore } from "../lib/store";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { toast } from "react-hot-toast";

const INACTIVITY_LIMIT_MS = 10 * 60 * 1000; // 10 minutes
const WARNING_BEFORE_MS = 60 * 1000; // 1 minute warning before logout

export function AutoLogoutManager() {
    const { currentUser, logout } = useAppStore();
    const routerState = useRouterState();
    const navigate = useNavigate();

    const lastActivityRef = useRef<number>(Date.now());
    const warningToastIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!currentUser) {
            if (warningToastIdRef.current) {
                toast.dismiss(warningToastIdRef.current);
                warningToastIdRef.current = null;
            }
            return;
        }

        // Initialize activity timestamp
        lastActivityRef.current = Date.now();

        const resetTimer = () => {
            lastActivityRef.current = Date.now();
            if (warningToastIdRef.current) {
                toast.dismiss(warningToastIdRef.current);
                warningToastIdRef.current = null;
            }
        };

        const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
        // Debounce event attachment
        let lastCall = 0;
        const throttledReset = () => {
            const now = Date.now();
            if (now - lastCall > 500) {
                lastCall = now;
                resetTimer();
            }
        };

        events.forEach((evt) => {
            window.addEventListener(evt, throttledReset, { passive: true });
        });

        const interval = setInterval(() => {
            if (!currentUser) return;
            const elapsed = Date.now() - lastActivityRef.current;

            // Warning at 9 minutes (60 seconds left)
            if (elapsed >= (INACTIVITY_LIMIT_MS - WARNING_BEFORE_MS) && elapsed < INACTIVITY_LIMIT_MS) {
                if (!warningToastIdRef.current) {
                    warningToastIdRef.current = toast(
                        (t) => (
                            <div className="flex flex-col gap-2">
                                <span className="font-bold text-amber-400 flex items-center gap-1 text-sm">
                                    <span className="material-symbols-outlined text-base">timer</span>
                                    Inactivity Warning
                                </span>
                                <span className="text-xs text-white">
                                    No activity detected. You will be logged out in 60 seconds.
                                </span>
                                <button
                                    onClick={() => {
                                        resetTimer();
                                        toast.dismiss(t.id);
                                        warningToastIdRef.current = null;
                                    }}
                                    className="bg-electric-blue text-white px-3 py-1 text-xs font-bold uppercase brutal-border hover:bg-white hover:text-black transition-all mt-1"
                                >
                                    Stay Logged In
                                </button>
                            </div>
                        ),
                        {
                            duration: WARNING_BEFORE_MS,
                            style: { background: "#111", color: "#fff", border: "2px solid #FFD700" }
                        }
                    );
                }
            }

            // Exceeded 10 minutes: Perform logout
            if (elapsed >= INACTIVITY_LIMIT_MS) {
                if (warningToastIdRef.current) {
                    toast.dismiss(warningToastIdRef.current);
                    warningToastIdRef.current = null;
                }
                logout();
                toast.error("Session expired: Logged out due to 10 minutes of inactivity.", {
                    duration: 6000
                });
                const isAdmin = routerState.location.pathname.startsWith("/admin");
                if (isAdmin) {
                    navigate({ to: "/admin-login" });
                } else {
                    navigate({ to: "/login" });
                }
            }
        }, 2000);

        return () => {
            clearInterval(interval);
            events.forEach((evt) => {
                window.removeEventListener(evt, throttledReset);
            });
            if (warningToastIdRef.current) {
                toast.dismiss(warningToastIdRef.current);
            }
        };
    }, [currentUser, logout, navigate, routerState.location.pathname]);

    return null;
}
