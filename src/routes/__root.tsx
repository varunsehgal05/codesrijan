import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import axios from "axios";

import appCss from "../styles.css?url";
import { ChatBotWidget } from "../components/ChatBotWidget";
import { AppStoreProvider, useAppStore } from "../lib/store";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { Toaster } from "react-hot-toast";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CodeSrijan — Student-Run Hackathon Platform" },
      {
        name: "description",
        content:
          "CodeSrijan is the student-run hackathon platform: problem statements, team workspaces, mentors, recruitment and live leaderboards.",
      },
      { property: "og:site_name", content: "CodeSrijan" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Anybody:ital,wght@0,100..900;1,100..900&family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@400;500;600;700&family=Hanken+Grotesk:wght@300..900&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap",
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const routerState = useRouterState();

  return (
    <QueryClientProvider client={queryClient}>
      <AppStoreProvider>
        <MaintenanceGuard>
          <div key={routerState.location.pathname} className="neo-page-transition flex flex-col min-h-screen w-full relative">
            <Navbar />
            <Outlet />
            <Footer />
          </div>
          <ChatBotWidget />
          <Toaster position="bottom-right" toastOptions={{
            className: 'brutal-border font-label-bold rounded-none',
            style: {
              background: '#0a0a0a',
              color: '#fff',
              border: '2px solid #0a0a0a',
              borderRadius: '0px',
              boxShadow: '4px 4px 0px 0px rgba(10, 10, 10, 1)',
            },
          }} />
        </MaintenanceGuard>
      </AppStoreProvider>
    </QueryClientProvider>
  );
}

function MaintenanceGuard({ children }: { children: ReactNode }) {
  const { currentUser } = useAppStore();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api-6tfr.onrender.com/api');
    axios.get(`${API_URL}/system/status`)
      .then(res => {
        if (res.data?.maintenanceMode === true) {
          setMaintenanceMode(true);
        } else {
          setMaintenanceMode(false);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const isAdmin = currentUser?.role === 'admin';
  const isAdminRoute = pathname.startsWith('/admin') || pathname === '/admin-login';

  // If maintenance mode is active AND user is not admin AND not on an admin route
  if (maintenanceMode && !isAdmin && !isAdminRoute) {
    return (
      <div className="min-h-screen bg-stark-black text-white flex flex-col justify-center items-center p-6 font-mono selection:bg-error selection:text-white">
        <div className="max-w-xl w-full bg-zinc-950 border-4 border-error p-8 shadow-[8px_8px_0px_0px_rgba(255,0,85,1)] space-y-6 text-center">
          <div className="inline-flex items-center gap-2 bg-error text-white font-black text-xs px-3 py-1 uppercase tracking-widest animate-pulse">
            <span className="material-symbols-outlined text-sm">lock</span>
            SECURITY LOCKDOWN ACTIVE
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">
            SYSTEM UNDER MAINTENANCE
          </h1>
          <p className="text-sm text-zinc-400 font-semibold leading-relaxed">
            The CodeSrijan neural matrix is currently undergoing scheduled platform upgrades and database synchronization. Regular student access is temporarily suspended.
          </p>
          <div className="bg-zinc-900 border border-zinc-800 p-4 text-xs text-zinc-500 font-mono text-left space-y-1">
            <p>&gt; STATUS: LEVEL_5_MAINTENANCE_LOCKDOWN</p>
            <p>&gt; OPERATIVE_GATE: SUSPENDED</p>
            <p>&gt; PROTOCOL: UPGRADE_TRANSMISSION_IN_PROGRESS</p>
          </div>
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <Link
              to="/admin-login"
              className="flex-1 bg-white hover:bg-electric-blue text-black font-black uppercase text-xs py-3 px-4 border-2 border-black transition-colors text-center"
            >
              ADMINISTRATIVE ACCESS LOGIN
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase text-xs py-3 px-4 border border-zinc-700 transition-colors text-center"
            >
              RETRY CONNECTION
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {maintenanceMode && (isAdmin || isAdminRoute) && (
        <div className="w-full bg-[#FFD700] text-stark-black px-4 py-2 text-xs font-black uppercase tracking-wider text-center border-b-2 border-stark-black flex items-center justify-center gap-2 sticky top-0 z-50">
          <span className="material-symbols-outlined text-sm">warning</span>
          <span>MAINTENANCE MODE PROTOCOL ACTIVE — REGULAR ACCESS SUSPENDED (ADMIN BYPASS ACTIVE)</span>
        </div>
      )}
      {children}
    </>
  );
}
