import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../lib/utils";
import { useAppStore } from "../lib/store";
type Assignment = {
  id: string;
  mentorId?: string;
  judgeId?: string;
  hackathonId: string;
  teamId?: string;
  projectId?: string;
  status?: string;
};
export function RoleAssignments({ kind }: { kind: "mentor" | "judge" }) {
  const { users, hackathons, teams } = useAppStore();
  const [rows, setRows] = useState<Assignment[]>([]),
    [staff, setStaff] = useState(""),
    [event, setEvent] = useState(""),
    [target, setTarget] = useState("");
  const [submissions, setSubmissions] = useState<
    { projectId: string; hackathonId: string; projectTitle?: string }[]
  >([]);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const endpoint = API_BASE + "/admin/" + kind + "-assignments";
  const headers = () => ({
    Authorization: "Bearer " + localStorage.getItem("codesrijan_auth_token"),
  });
  async function load() {
    setLoading(true);
    try {
      const r = await axios.get(endpoint, { headers: headers() });
      setRows(r.data);
      setError("");
    } catch {
      setError("Unable to load assignments. Retry.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
    if (kind === "judge")
      void axios
        .get(API_BASE + "/admin/submissions", { headers: headers() })
        .then((r) => setSubmissions(Array.isArray(r.data) ? r.data : r.data.submissions || []))
        .catch(() => setError("Unable to load submissions."));
  }, [kind]);
  async function assign(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await axios.post(
        endpoint,
        {
          [kind + "Id"]: staff,
          hackathonId: event,
          [kind === "mentor" ? "teamId" : "projectId"]: target,
        },
        { headers: headers() },
      );
      await load();
      setTarget("");
    } catch (e) {
      setError(
        axios.isAxiosError(e)
          ? e.response?.data?.message || "Assignment failed."
          : "Assignment failed.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    setBusy(true);
    try {
      await axios.delete(endpoint + "/" + encodeURIComponent(id), { headers: headers() });
      await load();
    } catch {
      setError("Unable to remove assignment.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="border-2 border-stark-black bg-white p-5 space-y-4"
      aria-label={kind + " assignments"}
    >
      <h2 className="font-bold text-xl">Event assignments</h2>
      {error && <p role="alert">{error}</p>}
      {loading ? (
        <p role="status">Loading assignments…</p>
      ) : (
        <>
          <form onSubmit={assign} className="flex flex-wrap gap-3">
            <label>
              Staff
              <select
                required
                value={staff}
                onChange={(e) => setStaff(e.target.value)}
                className="border-2 p-2 block"
              >
                <option value="">Choose {kind}</option>
                {users
                  .filter((u) => u.role === kind)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Hackathon
              <select
                required
                value={event}
                onChange={(e) => {
                  setEvent(e.target.value);
                  setTarget("");
                }}
                className="border-2 p-2 block"
              >
                <option value="">Choose event</option>
                {hackathons.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {kind === "mentor" ? "Squad" : "Submitted project"}
              <select
                required
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="border-2 p-2 block"
              >
                <option value="">Choose target</option>
                {kind === "mentor"
                  ? teams
                      .filter((t) => t.hackathonId === event)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))
                  : submissions
                      .filter((s) => s.hackathonId === event && s.projectId)
                      .map((s) => (
                        <option key={s.projectId} value={s.projectId}>
                          {s.projectTitle || s.projectId}
                        </option>
                      ))}
              </select>
            </label>
            <button disabled={busy} className="border-2 bg-electric-blue text-white px-4 py-2">
              Assign
            </button>
          </form>
          {rows.filter((r) => r.status !== "reassigned").length === 0 ? (
            <p>No active assignments.</p>
          ) : (
            <ul className="space-y-2">
              {rows
                .filter((r) => r.status !== "reassigned")
                .map((r) => (
                  <li key={r.id} className="flex flex-wrap gap-3 border-t pt-2">
                    <span>
                      {users.find((u) => u.id === (r.mentorId || r.judgeId))?.name || "Staff"} —{" "}
                      {r.teamId || r.projectId} —{" "}
                      {hackathons.find((h) => h.id === r.hackathonId)?.name || r.hackathonId}
                    </span>
                    <button disabled={busy} onClick={() => void remove(r.id)} className="underline">
                      Remove assignment
                    </button>
                  </li>
                ))}
            </ul>
          )}
          <button onClick={() => void load()} disabled={busy} className="underline">
            Refresh assignments
          </button>
        </>
      )}
    </section>
  );
}
