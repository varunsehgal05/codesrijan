import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE, getAuthHeaders } from "../../lib/utils";
import {
  Portal,
  Metrics,
  Notifications,
  Empty,
  Failure,
  SafeLink,
  action,
  field,
  panel,
  apiError,
  dateText,
} from "./Portal";

interface Squad {
  hackathon?: { name?: string; title?: string; submissionDeadline?: string };
  problem?: { title?: string; description?: string };
  tasks?: { id: string; title: string; status: string; dueDate?: string }[];
  id: string;
  name: string;
  hackathonId: string;
  hackathonName?: string;
  description?: string;
  leaderId: string;
  members?: { id: string; name: string }[];
  memberIds?: string[];
  status: string;
  updatedAt?: string;
  problemStatementId?: string;
  problemStatement?: { title?: string; description?: string };
  project?: { name?: string; description?: string; progress?: number; status?: string };
  milestones?: { id?: string; title: string; status?: string; dueDate?: string }[];
  submission?: { status: string; projectTitle?: string };
  currentMilestone?: string;
}
interface Guidance {
  id: string;
  teamId: string;
  mentorId?: string;
  topic: string;
  description?: string;
  priority?: string;
  status: "pending" | "accepted" | "resolved" | "cancelled";
  createdAt?: string;
  updatedAt?: string;
  meetLink?: string;
  responses?: { id?: string; authorId?: string; message: string; createdAt?: string }[];
}
interface Session {
  id: string;
  teamId: string;
  title: string;
  date?: string;
  startTime?: string;
  meetingUrl?: string;
  status: string;
}
interface Dashboard {
  teams: Squad[];
  requests: Guidance[];
  sessions: Session[];
  metrics?: Record<string, number>;
}
interface Note {
  id: string;
  notes: string;
  createdAt?: string;
}
const tabs = [
  "Overview",
  "My Assigned Squads",
  "Guidance Requests",
  "Milestones",
  "Communications",
  "Notifications",
];

export function MentorPortal() {
  const [tab, setTab] = useState("Overview"),
    [data, setData] = useState<Dashboard | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [selected, setSelected] = useState("");
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get<Dashboard>(`${API_BASE}/mentor/dashboard`, getAuthHeaders());
      setData(response.data);
    } catch (e) {
      setError(apiError(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const team = data?.teams.find((t) => t.id === selected);
  return (
    <Portal
      role="mentor"
      tabs={tabs}
      active={tab}
      setActive={(value) => {
        setTab(value);
        setSelected("");
      }}
    >
      {tab === "Notifications" ? (
        <Notifications />
      ) : loading ? (
        <p role="status" className={panel}>
          Loading assigned squads and guidance…
        </p>
      ) : error ? (
        <Failure message={error} retry={load} />
      ) : (
        data && (
          <>
            {tab === "Overview" && (
              <>
                <Metrics
                  values={[
                    ["Assigned squads", data.teams.length],
                    [
                      "Open requests",
                      data.requests.filter((r) => ["pending", "accepted"].includes(r.status))
                        .length,
                    ],
                    [
                      "Pending requests",
                      data.requests.filter((r) => r.status === "pending").length,
                    ],
                    [
                      "Resolved requests",
                      data.requests.filter((r) => r.status === "resolved").length,
                    ],
                    [
                      "Upcoming milestones",
                      data.teams
                        .flatMap((t) => t.milestones || t.tasks || [])
                        .filter(
                          (m) =>
                            m.dueDate &&
                            Date.parse(m.dueDate) >= Date.now() &&
                            m.status !== "completed",
                        ).length,
                    ],
                    ["Unread messages", data.metrics?.unreadMessages ?? "Not available"],
                  ]}
                />
                <section className={panel}>
                  <h3 className="font-black text-xl mb-4">Recent guidance activity</h3>
                  {data.requests.length === 0 ? (
                    <p>No guidance requests from your assigned squads yet.</p>
                  ) : (
                    <ul className="space-y-3">
                      {[...data.requests]
                        .sort(
                          (a, b) =>
                            Date.parse(b.updatedAt || b.createdAt || "") -
                            Date.parse(a.updatedAt || a.createdAt || ""),
                        )
                        .slice(0, 5)
                        .map((r) => (
                          <li key={r.id} className="border-t-2 border-black pt-3">
                            <p className="font-bold">{r.topic}</p>
                            <p className="text-sm">
                              {data.teams.find((t) => t.id === r.teamId)?.name || r.teamId} ·{" "}
                              {r.status} · {dateText(r.updatedAt || r.createdAt)}
                            </p>
                          </li>
                        ))}
                    </ul>
                  )}
                  <button className={`${action} mt-4`} onClick={() => setTab("Guidance Requests")}>
                    View guidance requests
                  </button>
                </section>
              </>
            )}
            {tab === "My Assigned Squads" &&
              (team ? (
                <SquadDetails
                  team={team}
                  back={() => setSelected("")}
                  openGuidance={() => setTab("Guidance Requests")}
                />
              ) : data.teams.length === 0 ? (
                <Empty>
                  No squads assigned. Your event administrator can assign a squad to your mentor
                  identity.
                </Empty>
              ) : (
                <div className="grid xl:grid-cols-2 gap-5">
                  {data.teams.map((t) => (
                    <article className={panel} key={t.id}>
                      <p className="font-mono text-xs break-all">{t.id}</p>
                      <h3 className="font-black text-2xl mt-2">{t.name}</h3>
                      <dl className="text-sm space-y-2 mt-4">
                        <div>
                          <dt className="font-bold">Hackathon</dt>
                          <dd>
                            {t.hackathon?.name ||
                              t.hackathon?.title ||
                              t.hackathonName ||
                              t.hackathonId}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-bold">Project status</dt>
                          <dd>{t.project?.status || t.status}</dd>
                        </div>
                        <div>
                          <dt className="font-bold">Current milestone</dt>
                          <dd>
                            {t.currentMilestone ||
                              t.tasks?.find((task) => task.status !== "completed")?.title ||
                              t.milestones?.find((m) => m.status !== "completed")?.title ||
                              "No milestone recorded"}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-bold">Roster</dt>
                          <dd>
                            {t.members
                              ?.map((m) => `${m.name}${m.id === t.leaderId ? " (leader)" : ""}`)
                              .join(", ") ||
                              `${t.memberIds?.length || 0} members · leader ${t.leaderId}`}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-bold">Latest activity</dt>
                          <dd>{dateText(t.updatedAt)}</dd>
                        </div>
                      </dl>
                      <button className={`${action} mt-4`} onClick={() => setSelected(t.id)}>
                        Open squad
                      </button>
                    </article>
                  ))}
                </div>
              ))}
            {(tab === "Guidance Requests" || tab === "Communications") && (
              <div className="space-y-5">
                {tab === "Communications" && (
                  <p className={panel}>
                    Respond through assigned squad guidance threads below. Responses are visible to
                    the requesting squad. Private notes stay in squad details.
                  </p>
                )}
                {data.requests.length === 0 ? (
                  <Empty>No guidance requests from your assigned squads.</Empty>
                ) : (
                  data.requests.map((request) => (
                    <GuidanceCard
                      key={request.id}
                      request={request}
                      teamName={
                        data.teams.find((t) => t.id === request.teamId)?.name || request.teamId
                      }
                      reload={load}
                    />
                  ))
                )}
              </div>
            )}
            {tab === "Milestones" && (
              <div className="space-y-5">
                {data.teams.flatMap((t) => t.milestones || t.tasks || []).length === 0 &&
                data.sessions.length === 0 ? (
                  <Empty>
                    No milestones or mentor sessions scheduled for your assigned squads.
                  </Empty>
                ) : (
                  <>
                    {data.teams.map((t) =>
                      (t.milestones || t.tasks)?.map((m, i) => (
                        <article className={panel} key={`${t.id}-${m.id || i}`}>
                          <h3 className="font-bold">{m.title}</h3>
                          <p>
                            {t.name} · {m.status || "Scheduled"} · {dateText(m.dueDate)}
                          </p>
                        </article>
                      )),
                    )}
                    {data.sessions.map((s) => (
                      <article className={panel} key={s.id}>
                        <h3 className="font-bold">{s.title}</h3>
                        <p>
                          {data.teams.find((t) => t.id === s.teamId)?.name || s.teamId} · {s.status}
                        </p>
                        <p>
                          {dateText(s.date)} {s.startTime}
                        </p>
                        <SafeLink url={s.meetingUrl}>Join scheduled session</SafeLink>
                      </article>
                    ))}
                  </>
                )}
              </div>
            )}
            <button className="underline text-sm font-bold mt-6" onClick={load}>
              Refresh assigned data
            </button>
          </>
        )
      )}
    </Portal>
  );
}

function SquadDetails({
  team,
  back,
  openGuidance,
}: {
  team: Squad;
  back: () => void;
  openGuidance: () => void;
}) {
  const [notes, setNotes] = useState<Note[]>([]),
    [note, setNote] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `${API_BASE}/mentor/teams/${encodeURIComponent(team.id)}/notes`,
        getAuthHeaders(),
      );
      setNotes(response.data);
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [team.id]);
  return (
    <div className="space-y-5">
      <button className={action} onClick={back}>
        ← Assigned squads
      </button>
      <article className={panel}>
        <h3 className="font-black text-2xl">{team.name}</h3>
        <p className="mt-2">
          {team.project?.description || team.description || "No project overview recorded."}
        </p>
        <dl className="grid sm:grid-cols-2 gap-4 mt-5">
          <div>
            <dt className="font-bold">Selected problem</dt>
            <dd>
              {team.problem?.title ||
                team.problemStatement?.title ||
                team.problemStatementId ||
                "Not selected"}
            </dd>
          </div>
          <div>
            <dt className="font-bold">Submission</dt>
            <dd>{team.submission?.status || "No submission recorded"}</dd>
          </div>
          <div>
            <dt className="font-bold">Progress</dt>
            <dd>
              {typeof team.project?.progress === "number"
                ? `${team.project.progress}%`
                : "Not recorded"}
            </dd>
          </div>
          <div>
            <dt className="font-bold">Roster</dt>
            <dd>
              {team.members
                ?.map((m) => `${m.name}${m.id === team.leaderId ? " (leader)" : ""}`)
                .join(", ") ||
                team.memberIds?.join(", ") ||
                "No members recorded"}
            </dd>
          </div>
        </dl>
        <button className={`${action} mt-5`} onClick={openGuidance}>
          Open squad guidance threads
        </button>
      </article>
      <section className={panel}>
        <h3 className="font-black text-xl">Private mentor notes</h3>
        <p className="text-sm mt-1">Only your mentor identity can read these notes.</p>
        {error && <Failure message={error} retry={load} />}
        {loading ? (
          <p role="status">Loading private notes…</p>
        ) : notes.length === 0 ? (
          <p className="my-4">No private notes yet.</p>
        ) : (
          <ul className="space-y-3 my-4">
            {notes.map((n) => (
              <li key={n.id} className="border-t-2 border-black pt-3">
                <p className="whitespace-pre-wrap break-words">{n.notes}</p>
                <p className="text-xs mt-2">{dateText(n.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
        <form
          className="mt-4 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!note.trim()) return;
            setBusy(true);
            setError("");
            try {
              await axios.post(
                `${API_BASE}/mentor/teams/${encodeURIComponent(team.id)}/notes`,
                { notes: note.trim() },
                getAuthHeaders(),
              );
              setNote("");
              await load();
            } catch (err) {
              setError(apiError(err));
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="block font-bold" htmlFor="private-note">
            New private note
          </label>
          <textarea
            id="private-note"
            className={field}
            required
            maxLength={5000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button className={action} disabled={busy || !note.trim()}>
            {busy ? "Saving…" : "Save private note"}
          </button>
        </form>
      </section>
    </div>
  );
}

function GuidanceCard({
  request: r,
  teamName,
  reload,
}: {
  request: Guidance;
  teamName: string;
  reload: () => Promise<void>;
}) {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const mutate = async (verb: string) => {
    setBusy(true);
    setError("");
    try {
      await axios.post(
        `${API_BASE}/mentor/requests/${encodeURIComponent(r.id)}/${verb}`,
        verb === "respond" ? { message: message.trim() } : {},
        getAuthHeaders(),
      );
      setMessage("");
      await reload();
    } catch (e) {
      setError(apiError(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <article className={panel}>
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <p className="text-xs font-mono break-all">
            {r.id} · {teamName}
          </p>
          <h3 className="font-black text-xl mt-2">{r.topic}</h3>
        </div>
        <p className="h-fit border-2 border-black bg-[#00E676] px-3 py-1 text-sm font-bold uppercase">
          {r.status}
        </p>
      </div>
      <p className="mt-3 whitespace-pre-wrap break-words">{r.description}</p>
      <p className="text-xs mt-3">
        Priority: {r.priority || "Normal"} · Assigned mentor: {r.mentorId || "Awaiting claim"}
      </p>
      <p className="text-xs mt-2">
        Created: {dateText(r.createdAt)} · Updated: {dateText(r.updatedAt)}
      </p>
      <SafeLink url={r.meetLink}>Open consultation link</SafeLink>
      {r.responses?.length ? (
        <ol aria-label="Response history" className="mt-4 space-y-3">
          {r.responses.map((response, i) => (
            <li key={response.id || i} className="border-l-4 border-black pl-3">
              <p className="whitespace-pre-wrap break-words">{response.message}</p>
              <p className="text-xs mt-1">{dateText(response.createdAt)}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 text-sm">No responses yet.</p>
      )}
      {error && (
        <p role="alert" className="text-red-700 font-bold mt-3">
          {error}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        {r.status === "pending" && (
          <button className={action} disabled={busy} onClick={() => mutate("accept")}>
            Claim request
          </button>
        )}
        {r.status === "accepted" && (
          <button className={action} disabled={busy} onClick={() => mutate("resolve")}>
            Mark resolved
          </button>
        )}
        {r.status === "resolved" && (
          <button className={action} disabled={busy} onClick={() => mutate("reopen")}>
            Reopen request
          </button>
        )}
      </div>
      {r.status === "accepted" && (
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void mutate("respond");
          }}
        >
          <label className="block font-bold" htmlFor={`response-${r.id}`}>
            Response to squad
          </label>
          <textarea
            id={`response-${r.id}`}
            className={field}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            maxLength={5000}
          />
          <button className={action} disabled={busy || !message.trim()}>
            {busy ? "Sending…" : "Send response"}
          </button>
        </form>
      )}
    </article>
  );
}
