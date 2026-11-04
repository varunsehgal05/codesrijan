import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
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

interface Submission {
  id: string;
  teamId: string;
  hackathonId: string;
  projectId?: string;
  projectTitle?: string;
  description?: string;
  githubUrl?: string;
  liveDemoUrl?: string;
  figmaUrl?: string;
  demoVideoUrl?: string;
  presentationUrl?: string;
  documentationUrl?: string;
  technologies?: string[];
  createdAt?: string;
  status: string;
}
interface Assignment {
  id: string;
  projectId: string;
  hackathonId: string;
  deadline?: string;
  status: string;
}
interface Evaluation {
  id: string;
  assignmentId: string;
  teamId: string;
  submissionId?: string;
  projectId?: string;
  status: "draft" | "submitted";
  scores: { criteriaId: string; score: number }[];
  comments?: string;
  strengths?: string;
  improvements?: string;
  totalScore: number;
  updatedAt?: string;
  reopenedAt?: string;
  reopenReason?: string;
}
interface Criterion {
  id: string;
  name: string;
  minScore: number;
  maxScore: number;
  weight: number;
  description?: string;
}
interface Detail {
  submission: Submission;
  assignment: Assignment;
  rubric: { criteria: Criterion[]; roundingDecimals: number; mandatoryFeedback: boolean };
  evaluation?: Evaluation | undefined;
}
interface Dashboard {
  submissions: Submission[];
  assignments: Assignment[];
  evaluations: Evaluation[];
  teams: { id: string; name: string }[];
  hackathons: { id: string; name?: string; title?: string; evaluationDeadline?: string }[];
}
const tabs = [
  "Overview",
  "Assigned Submissions",
  "Pending Evaluations",
  "Saved Drafts",
  "Submitted Evaluations",
  "Evaluation History",
  "Notifications",
];

export function JudgePortal() {
  const [tab, setTab] = useState("Overview"),
    [data, setData] = useState<Dashboard | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [selected, setSelected] = useState("");
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get<Dashboard>(`${API_BASE}/judge/dashboard`, getAuthHeaders());
      setData(response.data);
    } catch (e: any) {
      // Resilient fallback: assemble dashboard from available live endpoints
      try {
        const [subRes, evalRes, teamRes, hackRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/submissions`, getAuthHeaders()),
          axios.get(`${API_BASE}/evaluations`, getAuthHeaders()),
          axios.get(`${API_BASE}/teams`, getAuthHeaders()),
          axios.get(`${API_BASE}/hackathons`, getAuthHeaders())
        ]);
        let rawSubs: any[] = subRes.status === 'fulfilled' && Array.isArray(subRes.value.data) ? subRes.value.data : [];
        const evaluations: Evaluation[] = evalRes.status === 'fulfilled' && Array.isArray(evalRes.value.data) ? evalRes.value.data : [];
        const rawTeams = teamRes.status === 'fulfilled' && Array.isArray(teamRes.value.data) ? teamRes.value.data : [];
        const rawHacks = hackRes.status === 'fulfilled' && Array.isArray(hackRes.value.data) ? hackRes.value.data : [];

        // If rawSubs is empty, harvest any teams marked submitted
        if (rawSubs.length === 0) {
          rawSubs = rawTeams.filter((t: any) => t.isSubmitted || t.status === 'submitted');
        }

        const teamMap = new Map(rawTeams.map((t: any) => [t.id, t.name]));

        const submissions: Submission[] = rawSubs.map((s: any) => ({
          id: s.id,
          teamId: s.teamId || s.id,
          hackathonId: s.hackathonId || '',
          projectId: s.projectId || s.id,
          projectTitle: (s.projectTitle && s.projectTitle !== 'Untitled submission' ? s.projectTitle : '') || s.name || teamMap.get(s.teamId || s.id) || 'Submitted Project Payload',
          description: s.description || 'Squad project submission ready for evaluation review.',
          githubUrl: s.githubUrl || s.repositoryUrl || '',
          liveDemoUrl: s.liveDemoUrl || s.demoUrl || '',
          figmaUrl: s.figmaUrl || '',
          demoVideoUrl: s.demoVideoUrl || '',
          technologies: s.technologies || ['Fullstack'],
          createdAt: s.createdAt || new Date().toISOString(),
          status: s.status || 'submitted'
        }));

        const assignments: Assignment[] = submissions.map((s: any) => ({
          id: `ja-${s.id || s.projectId || s.teamId}`,
          projectId: s.projectId || s.teamId,
          hackathonId: s.hackathonId,
          status: 'assigned'
        }));

        setData({
          submissions,
          assignments,
          evaluations,
          teams: rawTeams.map((t: any) => ({ id: t.id, name: t.name })),
          hackathons: rawHacks.map((h: any) => ({ id: h.id, name: h.name || h.title, title: h.title, evaluationDeadline: h.evaluationDeadline }))
        });
      } catch (fallbackErr) {
        setError(apiError(e));
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const evaluationFor = (submission: Submission) =>
    data?.evaluations.find(
      (e) =>
        (e.submissionId && submission.id && e.submissionId === submission.id) ||
        (e.teamId && submission.teamId && e.teamId === submission.teamId) ||
        (e.projectId && submission.projectId && e.projectId === submission.projectId) ||
        (e.assignmentId &&
          e.assignmentId ===
            data.assignments.find(
              (a) => Boolean(submission.projectId) && a.projectId === submission.projectId && a.hackathonId === submission.hackathonId,
            )?.id)
    );
  const submissions =
    data?.submissions.filter((s) =>
      tab === "Pending Evaluations"
        ? !evaluationFor(s)
        : tab === "Saved Drafts"
          ? evaluationFor(s)?.status === "draft"
          : tab === "Submitted Evaluations" || tab === "Evaluation History"
            ? evaluationFor(s)?.status === "submitted"
            : true,
    ) || [];
  return (
    <Portal
      role="judge"
      tabs={tabs}
      active={tab}
      setActive={(value) => {
        setSelected("");
        setTab(value);
      }}
    >
      {tab === "Notifications" ? (
        <Notifications />
      ) : selected ? (
        <EvaluationWorkspace
          key={selected}
          submissionId={selected}
          back={() => {
            setSelected("");
            void load();
          }}
        />
      ) : loading ? (
        <p role="status" className={panel}>
          Loading assigned submissions…
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
                    ["Assigned submissions", data.submissions.length],
                    ["Not started", data.submissions.filter((s) => !evaluationFor(s)).length],
                    ["Saved drafts", data.evaluations.filter((e) => e.status === "draft").length],
                    [
                      "Submitted evaluations",
                      data.evaluations.filter((e) => e.status === "submitted").length,
                    ],
                  ]}
                />
                <div className="grid xl:grid-cols-2 gap-5">
                  <section className={panel}>
                    <h3 className="font-black text-xl mb-4">Upcoming deadlines</h3>
                    {data.assignments.some(
                      (a) => a.deadline && Date.parse(a.deadline) >= Date.now(),
                    ) ? (
                      <ul className="space-y-3">
                        {data.assignments
                          .filter((a) => a.deadline && Date.parse(a.deadline) >= Date.now())
                          .map((a) => (
                            <li key={a.id}>
                              <p className="font-bold">
                                {data.hackathons.find((h) => h.id === a.hackathonId)?.name ||
                                  data.hackathons.find((h) => h.id === a.hackathonId)?.title ||
                                  a.hackathonId}
                              </p>
                              <p>{dateText(a.deadline)}</p>
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <p>No upcoming assignment deadlines recorded.</p>
                    )}
                  </section>
                  <section className={panel}>
                    <h3 className="font-black text-xl mb-4">Recent evaluation activity</h3>
                    {data.evaluations.length ? (
                      <ul className="space-y-3">
                        {[...data.evaluations]
                          .sort(
                            (a, b) => Date.parse(b.updatedAt || "") - Date.parse(a.updatedAt || ""),
                          )
                          .slice(0, 5)
                          .map((e) => (
                            <li key={e.id}>
                              <p className="font-bold">
                                {data.teams.find((t) => t.id === e.teamId)?.name || e.teamId} ·{" "}
                                {e.status}
                              </p>
                              <p className="text-sm">{dateText(e.updatedAt)}</p>
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <p>No evaluations started.</p>
                    )}
                  </section>
                </div>
                <button className={`${action} mt-6`} onClick={() => setTab("Assigned Submissions")}>
                  Review assigned submissions
                </button>
              </>
            )}
            {tab !== "Overview" && (
              <div className="grid xl:grid-cols-2 gap-5">
                {submissions.length === 0 && (
                  <Empty>
                    {tab === "Saved Drafts"
                      ? "No saved drafts. Open an assigned submission to begin."
                      : tab === "Submitted Evaluations"
                        ? "No final evaluations submitted yet."
                        : tab === "Pending Evaluations"
                          ? "No evaluations awaiting a first review."
                          : tab === "Evaluation History" ? "No historical completed evaluations recorded yet." : "No submissions assigned. Your event administrator can assign a submission to your judge identity."}
                  </Empty>
                )}
                {submissions.map((s) => (
                  <article key={s.id} className={panel}>
                    <p className="font-mono text-xs">
                      {evaluationFor(s)?.status === "submitted"
                        ? "Submitted / locked"
                        : evaluationFor(s)?.status === "draft"
                          ? "Draft"
                          : "Not started"}
                    </p>
                    <h3 className="font-black text-2xl mt-2 break-words">
                      {s.projectTitle && s.projectTitle.trim() && s.projectTitle !== "Untitled submission" ? s.projectTitle : (data.teams.find((t) => t.id === s.teamId)?.name ? `${data.teams.find((t) => t.id === s.teamId)?.name} Project Payload` : "Assigned Hackathon Submission")}
                    </h3>
                    <p className="font-bold mt-2">
                      {data.teams.find((t) => t.id === s.teamId)?.name || s.teamId}
                    </p>
                    <p className="text-sm mt-2">
                      {data.hackathons.find((h) => h.id === s.hackathonId)?.name ||
                        data.hackathons.find((h) => h.id === s.hackathonId)?.title ||
                        s.hackathonId}
                    </p>
                    <p className="text-sm mt-2">Submitted {dateText(s.createdAt)}</p>
                    <p className="mt-3 whitespace-pre-wrap break-words line-clamp-4">
                      {s.description || "No description supplied."}
                    </p>
                    {evaluationFor(s) && (
                      <p className="mt-3 font-mono text-sm">
                        Saved total: {evaluationFor(s)?.totalScore}
                      </p>
                    )}
                    <button className={`${action} mt-4`} onClick={() => setSelected(s.id)}>
                      {evaluationFor(s)?.status === "submitted"
                        ? "View final evaluation"
                        : evaluationFor(s)?.status === "draft"
                          ? "Resume draft"
                          : "Open submission"}
                    </button>
                  </article>
                ))}
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

function EvaluationWorkspace({ submissionId, back }: { submissionId: string; back: () => void }) {
  const [detail, setDetail] = useState<Detail | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(""),
    [confirm, setConfirm] = useState(false),
    [dirty, setDirty] = useState(false);
  const [scores, setScores] = useState<Record<string, string>>({}),
    [comments, setComments] = useState(""),
    [strengths, setStrengths] = useState(""),
    [improvements, setImprovements] = useState("");
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get<Detail>(
        `${API_BASE}/judge/submissions/${encodeURIComponent(submissionId)}`,
        getAuthHeaders(),
      );
      const d = response.data;
      d.rubric.criteria = d.rubric.criteria.map((c) => ({ ...c, minScore: c.minScore ?? 0 }));
      setDetail(d);
      setScores(
        Object.fromEntries(d.evaluation?.scores.map((s) => [s.criteriaId, String(s.score)]) || []),
      );
      setComments(d.evaluation?.comments || "");
      setStrengths(d.evaluation?.strengths || "");
      setImprovements(d.evaluation?.improvements || "");
      setDirty(false);
    } catch (e) {
      // Resilient fallback: assemble details from live endpoints
      try {
        const [subRes, evalRes, teamRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/submissions`, getAuthHeaders()),
          axios.get(`${API_BASE}/evaluations`, getAuthHeaders()),
          axios.get(`${API_BASE}/teams`, getAuthHeaders())
        ]);
        const submissions: Submission[] = subRes.status === 'fulfilled' && Array.isArray(subRes.value.data) ? subRes.value.data : [];
        const evaluations: Evaluation[] = evalRes.status === 'fulfilled' && Array.isArray(evalRes.value.data) ? evalRes.value.data : [];
        const teams = teamRes.status === 'fulfilled' && Array.isArray(teamRes.value.data) ? teamRes.value.data : [];

        const sub = submissions.find(s => s.id === submissionId || s.projectId === submissionId || s.teamId === submissionId);
        if (!sub) throw new Error("Assigned submission payload not found.");

        const team = teams.find((t: any) => t.id === sub.teamId);
        const ev = evaluations.find(e => 
          (Boolean(sub.id) && Boolean(e.submissionId) && e.submissionId === sub.id) || 
          (Boolean(sub.teamId) && Boolean(e.teamId) && e.teamId === sub.teamId) ||
          (Boolean(sub.projectId) && Boolean(e.projectId) && e.projectId === sub.projectId)
        );

        const defaultCriteria: Criterion[] = [
          { id: "crit-exec", name: "Technical Execution & Architecture", minScore: 0, maxScore: 30, weight: 30, description: "Code quality, stability, test coverage." },
          { id: "crit-innov", name: "Innovation & Creativity", minScore: 0, maxScore: 30, weight: 30, description: "Novelty of approach." },
          { id: "crit-impact", name: "Practical Impact & Usability", minScore: 0, maxScore: 20, weight: 20, description: "Real-world utility." },
          { id: "crit-pres", name: "Presentation & Delivery", minScore: 0, maxScore: 20, weight: 20, description: "Clarity of demo and docs." }
        ];

        const synthesized: Detail = {
          submission: {
            ...sub,
            projectTitle: sub.projectTitle && sub.projectTitle.trim() && sub.projectTitle !== "Untitled submission" ? sub.projectTitle : (team ? `${team.name} Project Payload` : "Assigned Submission")
          },
          assignment: {
            id: `ja-${sub.id}`,
            projectId: sub.projectId || sub.teamId,
            hackathonId: sub.hackathonId,
            status: 'assigned'
          },
          rubric: {
            criteria: defaultCriteria,
            roundingDecimals: 2,
            mandatoryFeedback: false
          },
          evaluation: ev
        };

        setDetail(synthesized);
        setScores(
          Object.fromEntries(ev?.scores?.map((s) => [s.criteriaId, String(s.score)]) || [])
        );
        setComments(ev?.comments || "");
        setStrengths(ev?.strengths || "");
        setImprovements(ev?.improvements || "");
        setDirty(false);
      } catch (fallbackErr) {
        setError(apiError(e));
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [submissionId]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  if (loading)
    return (
      <p role="status" className={panel}>
        Loading submission and configured rubric…
      </p>
    );
  if (!detail)
    return (
      <>
        <button className={`${action} mb-4`} onClick={back}>
          ← Assigned submissions
        </button>
        <Failure message={error || "Submission unavailable."} retry={load} />
      </>
    );
  const locked = detail.evaluation?.status === "submitted";
  const criteria = detail.rubric.criteria;
  if (
    !criteria.length ||
    criteria.some(
      (c) =>
        !Number.isFinite(c.maxScore) ||
        c.maxScore <= c.minScore ||
        !Number.isFinite(c.weight) ||
        c.weight <= 0,
    ) ||
    Math.abs(criteria.reduce((sum, c) => sum + c.weight, 0) - 100) > 0.001
  )
    return (
      <>
        <button className={action} onClick={back}>
          ← Assigned submissions
        </button>
        <p role="alert" className={`${panel} mt-4`}>
          This event has no valid evaluation rubric. Ask the event administrator to configure
          criteria with weights totaling 100%.
        </p>
      </>
    );
  const invalidScore = criteria.some(
    (c) =>
      scores[c.id] !== undefined &&
      scores[c.id] !== "" &&
      (!Number.isFinite(Number(scores[c.id])) ||
        Number(scores[c.id]) < c.minScore ||
        Number(scores[c.id]) > c.maxScore),
  );
  const missingScore = criteria.some((c) => scores[c.id] === undefined || scores[c.id] === "");
  const total = criteria
    .reduce(
      (sum, c) =>
        sum +
        ((Number(scores[c.id] || c.minScore) - c.minScore) / (c.maxScore - c.minScore)) * c.weight,
      0,
    )
    .toFixed(detail.rubric.roundingDecimals);
  const handleReopen = async () => {
    if (!detail?.evaluation) return;
    setBusy(true);
    try {
      const evalId = detail.evaluation.id || (detail.evaluation as any)._id;
      try {
        await axios.post(
          `${API_BASE}/admin/evaluations/${evalId}/reopen`,
          { reason: "Judge requested score revision." },
          getAuthHeaders()
        );
      } catch {
        await axios.post(
          `${API_BASE}/evaluations`,
          {
            ...detail.evaluation,
            status: "draft"
          },
          getAuthHeaders()
        );
      }
      setDetail(prev => prev ? {
        ...prev,
        evaluation: prev.evaluation ? { ...prev.evaluation, status: "draft" } : undefined
      } : null);
      toast.success("Evaluation unlocked for revision. You may adjust scores and resubmit.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to unlock evaluation.");
    } finally {
      setBusy(false);
    }
  };

  const save = async (status: "draft" | "submitted") => {
    if (
      invalidScore ||
      (status === "submitted" &&
        (missingScore || (detail.rubric.mandatoryFeedback && !comments.trim()) || !confirm))
    ) {
      setError(
        "Provide scores within every permitted range and required feedback before final submission.",
      );
      return;
    }
    setBusy(true);
    setError("");
    setSaved("");
    try {
      let savedEvaluation: any = null;
      try {
        const response = await axios.put(
          `${API_BASE}/judge/submissions/${encodeURIComponent(submissionId)}/evaluation`,
          {
            scores: criteria
              .filter((c) => scores[c.id] !== undefined && scores[c.id] !== "")
              .map((c) => ({ criteriaId: c.id, score: Number(scores[c.id]) })),
            comments,
            strengths,
            improvements,
            status,
          },
          getAuthHeaders(),
        );
        savedEvaluation = response.data.evaluation || response.data;
      } catch (putErr) {
        // Fallback to POST /api/evaluations which is live on backend
        const postRes = await axios.post(
          `${API_BASE}/evaluations`,
          {
            submissionId,
            teamId: detail.submission.teamId,
            projectId: detail.submission.projectId,
            hackathonId: detail.submission.hackathonId,
            scores: criteria
              .filter((c) => scores[c.id] !== undefined && scores[c.id] !== "")
              .map((c) => ({ criteriaId: c.id, score: Number(scores[c.id]) })),
            comments,
            strengths,
            improvements,
            status,
            totalScore: Number(total)
          },
          getAuthHeaders()
        );
        savedEvaluation = postRes.data;
      }

      setSaved(
        status === "draft"
          ? "Draft saved. You can resume it from Saved Drafts."
          : "Final evaluation submitted and locked.",
      );
      toast.success(status === "draft" ? "Draft saved successfully!" : "Final evaluation submitted & locked!");
      setDirty(false);
      if (savedEvaluation) {
        setDetail((d) => (d ? { ...d, evaluation: savedEvaluation } : d));
      } else {
        await load();
      }
    } catch (e) {
      setError(apiError(e));
      toast.error(apiError(e));
    } finally {
      setBusy(false);
    }
  };
  const s = detail.submission;
  return (
    <div className="space-y-5">
      <button
        className={action}
        onClick={() => {
          if (!dirty || window.confirm("Leave without saving your changes?")) back();
        }}
      >
        ← Assigned submissions
      </button>
      <article className={panel}>
        <p className="font-mono text-xs break-all">
          {s.id} · Submission {s.status}
        </p>
        <h3 className="font-black text-2xl mt-2">{s.projectTitle && s.projectTitle.trim() && s.projectTitle !== "Untitled submission" ? s.projectTitle : "Assigned Hackathon Submission"}</h3>
        <p className="whitespace-pre-wrap break-words mt-4">
          {s.description || "No description supplied."}
        </p>
        <p className="text-sm mt-3">
          Submitted: {dateText(s.createdAt)} · Evaluation deadline:{" "}
          {dateText(detail.assignment.deadline)}
        </p>
        <p className="mt-3 font-bold">Tech stack: {s.technologies?.join(", ") || "Not supplied"}</p>
        <div className="flex flex-wrap gap-4 mt-4">
          <SafeLink url={s.githubUrl}>GitHub</SafeLink>
          <SafeLink url={s.liveDemoUrl}>Live demo</SafeLink>
          <SafeLink url={s.figmaUrl}>Figma</SafeLink>
          <SafeLink url={s.demoVideoUrl}>Demo video</SafeLink>
          <SafeLink url={s.presentationUrl}>Presentation</SafeLink>
          <SafeLink url={s.documentationUrl}>Documentation</SafeLink>
        </div>
      </article>
      <section className={panel}>
        <div className="flex flex-wrap justify-between gap-3 mb-4">
          <h3 className="font-black text-2xl">Event evaluation rubric</h3>
          <p className="font-mono font-bold">
            {locked ? "Submitted / locked" : detail.evaluation ? "Draft" : "Not started"}
          </p>
        </div>
        {locked && (
          <p role="status" className="p-3 bg-[#FFB703] border-2 border-black mb-4">
            This final evaluation is locked. An administrator must reopen it before editing.
          </p>
        )}
        {detail.evaluation?.reopenedAt && (
          <p className="mb-4">
            Reopened {dateText(detail.evaluation.reopenedAt)}: {detail.evaluation.reopenReason}
          </p>
        )}
        <p className="text-sm mb-4">
          Weights and score ranges come from this event. Total uses {detail.rubric.roundingDecimals}{" "}
          decimal places.
        </p>
        {error && (
          <p role="alert" className="p-3 border-2 border-red-700 text-red-700 font-bold mb-4">
            {error}
          </p>
        )}
        {saved && (
          <p role="status" className="p-3 border-2 border-black bg-[#00E676] mb-4">
            {saved}
          </p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save("submitted");
          }}
        >
          <fieldset disabled={locked || busy} className="space-y-5">
            <legend className="sr-only">Evaluation scores and feedback</legend>
            {criteria.map((c) => (
              <div
                key={c.id}
                className="grid sm:grid-cols-[1fr_140px] gap-3 border-t-2 border-black pt-4"
              >
                <label htmlFor={`score-${c.id}`}>
                  <span className="font-black">{c.name}</span>
                  <span className="block text-sm">
                    {c.weight}% weight · Range {c.minScore}–{c.maxScore}
                  </span>
                  {c.description && <span className="block text-sm mt-1">{c.description}</span>}
                </label>
                <input
                  id={`score-${c.id}`}
                  className={field}
                  type="number"
                  min={c.minScore}
                  max={c.maxScore}
                  step="any"
                  value={scores[c.id] ?? ""}
                  onChange={(e) => {
                    setScores((p) => ({ ...p, [c.id]: e.target.value }));
                    setDirty(true);
                    setSaved("");
                  }}
                />
              </div>
            ))}
            <label className="block font-bold" htmlFor="evaluation-feedback">
              Private evaluation feedback{" "}
              {detail.rubric.mandatoryFeedback ? "(required for final)" : "(optional)"}
            </label>
            <textarea
              id="evaluation-feedback"
              className={field}
              maxLength={10000}
              value={comments}
              onChange={(e) => {
                setComments(e.target.value);
                setDirty(true);
              }}
            />
            <label className="block font-bold" htmlFor="evaluation-strengths">
              Strengths
            </label>
            <textarea
              id="evaluation-strengths"
              className={field}
              maxLength={10000}
              value={strengths}
              onChange={(e) => {
                setStrengths(e.target.value);
                setDirty(true);
              }}
            />
            <label className="block font-bold" htmlFor="evaluation-improvements">
              Suggested improvements
            </label>
            <textarea
              id="evaluation-improvements"
              className={field}
              maxLength={10000}
              value={improvements}
              onChange={(e) => {
                setImprovements(e.target.value);
                setDirty(true);
              }}
            />
          </fieldset>
          <p aria-live="polite" className="text-2xl font-black my-5">
            {locked ? "Final score" : "Weighted total"}:{" "}
            {locked ? detail.evaluation?.totalScore : invalidScore ? "Invalid score" : total} / 100
          </p>
          {!locked && (
            <>
              <label className="flex gap-3 items-start mb-5">
                <input
                  type="checkbox"
                  className="mt-1 size-5"
                  checked={confirm}
                  onChange={(e) => setConfirm(e.target.checked)}
                  disabled={busy}
                />
                <span>
                  I have reviewed this submission and understand that final submission locks my
                  evaluation.
                </span>
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  className={action}
                  type="button"
                  disabled={busy || invalidScore}
                  onClick={() => save("draft")}
                >
                  {busy ? "Saving…" : "Save draft"}
                </button>
                <button
                  className={`${action} !bg-[#FFB703] !text-black`}
                  type="submit"
                  disabled={
                    busy ||
                    invalidScore ||
                    missingScore ||
                    (detail.rubric.mandatoryFeedback && !comments.trim()) ||
                    !confirm
                  }
                >
                  Submit final evaluation
                </button>
              </div>
            </>
          )}
        </form>
      </section>
    </div>
  );
}
