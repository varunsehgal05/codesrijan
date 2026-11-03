import { Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import axios from "axios";
import { useAppStore } from "../../lib/store";
import { API_BASE, getAuthHeaders } from "../../lib/utils";
import { roleHome } from "../../lib/role-home";

export const panel = "border-2 border-black bg-white p-4 sm:p-6 shadow-[4px_4px_0_#000]";
export const action =
  "border-2 border-black bg-black text-white px-4 py-2 font-bold text-sm focus-visible:outline-4 focus-visible:outline-electric-blue focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-electric-blue";
export const field =
  "w-full min-w-0 border-2 border-black bg-white text-black p-3 focus-visible:outline-4 focus-visible:outline-electric-blue focus-visible:outline-offset-2";
export const dateText = (value?: string) =>
  value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleString() : "Not recorded";
export const apiError = (error: unknown) =>
  axios.isAxiosError(error)
    ? error.response?.data?.message || "Connection failed. Try again."
    : "Something went wrong. Try again.";
export function SafeLink({ url, children }: { url?: string | undefined; children: ReactNode }) {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  return (
    <a
      className="underline font-bold break-all focus-visible:outline-4 focus-visible:outline-electric-blue"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children} ↗
    </a>
  );
}
export function PortalGuard({ role, children }: { role: "mentor" | "judge"; children: ReactNode }) {
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
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== role) return <Navigate to={roleHome(currentUser.role)} replace />;
  return children;
}
export function Portal({
  role,
  tabs,
  active,
  setActive,
  children,
}: {
  role: "mentor" | "judge";
  tabs: string[];
  active: string;
  setActive: (tab: string) => void;
  children: ReactNode;
}) {
  const { currentUser, logout } = useAppStore();
  return (
    <div className="min-h-screen bg-[#f2f2f2] text-black flex flex-col lg:flex-row">
      <aside
        className={`lg:w-64 shrink-0 bg-black text-white border-b-4 lg:border-b-0 lg:border-r-4 ${role === "mentor" ? "border-[#00E676]" : "border-[#FFB703]"}`}
      >
        <div className="p-5 border-b border-white/40">
          <p className="font-mono text-xs uppercase tracking-widest">CodeSrijan / {role}</p>
          <h1 className="font-black text-2xl uppercase mt-2">
            {role === "mentor" ? "Mentor Command Center" : "Judge Command Center"}
          </h1>
          <p className="mt-2 text-sm break-words">{currentUser?.name}</p>
        </div>
        <nav
          aria-label={`${role} navigation`}
          className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2"
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              aria-current={active === tab ? "page" : undefined}
              onClick={() => setActive(tab)}
              className={`text-left p-3 text-sm font-bold border-2 focus-visible:outline-4 focus-visible:outline-white focus-visible:outline-offset-2 ${active === tab ? (role === "mentor" ? "bg-[#00E676] text-black border-[#00E676]" : "bg-[#FFB703] text-black border-[#FFB703]") : "border-white/40 hover:border-white"}`}
            >
              {tab}
            </button>
          ))}
          <Link to="/profile" className="p-3 border-2 border-white/40 hover:border-white hover:bg-white/10 text-sm font-bold transition-colors">
            Profile
          </Link>
          <Link to="/settings" className="p-3 border-2 border-white/40 hover:border-white hover:bg-white/10 text-sm font-bold transition-colors">
            Settings
          </Link>
          <button
            className="p-3 text-left border-2 border-white text-sm font-bold hover:bg-white hover:text-black transition-colors cursor-pointer flex items-center justify-between"
            onClick={logout}
          >
            Logout
          </button>
        </nav>
      </aside>
      <main id="role-workspace" className="min-w-0 flex-1 p-4 sm:p-8 max-w-[1500px] w-full">
        <header className="border-b-4 border-black pb-5 mb-6">
          <p className="font-mono uppercase text-xs tracking-widest">
            Assigned work / verified session
          </p>
          <h2 className="text-3xl sm:text-4xl font-black mt-2">{active}</h2>
        </header>
        {children}
      </main>
    </div>
  );
}
export function Metrics({ values }: { values: [string, number | string][] }) {
  return (
    <dl className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {values.map(([label, value]) => (
        <div key={label} className={panel}>
          <dt className="text-xs font-mono uppercase">{label}</dt>
          <dd className="text-3xl font-black mt-2">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return <p className={`${panel} font-mono text-sm`}>{children}</p>;
}
export function Failure({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div role="alert" className={`${panel} border-[#FF0055] mb-4`}>
      <p className="mb-3">{message}</p>
      <button className={action} onClick={retry}>
        Try again
      </button>
    </div>
  );
}
interface Notice {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt?: string;
}
export function Notifications() {
  const [items, setItems] = useState<Notice[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${API_BASE}/notifications`, getAuthHeaders());
      setItems(Array.isArray(response.data) ? response.data : response.data.notifications || []);
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  return loading ? (
    <p role="status">Loading notifications…</p>
  ) : error ? (
    <Failure message={error} retry={load} />
  ) : (
    <div className="space-y-4">
      {items.length === 0 && <Empty>No notifications yet.</Empty>}
      {items.map((item) => (
        <article key={item.id} className={panel}>
          <p className="text-xs font-mono">
            {item.isRead ? "Read" : "Unread"} · {dateText(item.createdAt)}
          </p>
          <h3 className="font-bold text-lg mt-2">{item.title}</h3>
          <p className="whitespace-pre-wrap mt-2">{item.message}</p>
          {!item.isRead && (
            <button
              className={`${action} mt-3`}
              onClick={async () => {
                try {
                  await axios.patch(`${API_BASE}/notifications/${item.id}/read`, {}, getAuthHeaders());
                  await load();
                } catch (e) {
                  setError(apiError(e));
                }
              }}
            >
              Mark read
            </button>
          )}
        </article>
      ))}
    </div>
  );
}
