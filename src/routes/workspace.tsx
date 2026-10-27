import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAppStore } from "../lib/store";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

export const Route = createFileRoute("/workspace")({
  component: WorkspaceHUD,
});

function WorkspaceHUD() {
  const { currentUser, teams, tasks, hackathons, problems, users, registrations, refetchData } = useAppStore();
  const navigate = useNavigate();
  const userTeam = teams.find(t => t.id === currentUser?.teamId);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [figmaLink, setFigmaLink] = useState("");
  const [demoLink, setDemoLink] = useState("");
  const [isSavingLinks, setIsSavingLinks] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionForm, setSubmissionForm] = useState({
    description: "",
    technologies: "",
    githubLink: "",
    figmaLink: "",
    demoLink: "",
    demoVideoUrl: ""
  });

  const [isCreating, setIsCreating] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [createForm, setCreateForm] = useState({ title: '', description: '', priority: 'medium', assignedTo: '', dueDate: '' });
  const [editForm, setEditForm] = useState({ title: '', description: '', priority: 'medium', assignedTo: '', dueDate: '' });

  const [isRequestingMentor, setIsRequestingMentor] = useState(false);
  const [mentorRequestForm, setMentorRequestForm] = useState({ topic: '', description: '' });
  const [activeMentorRequests, setActiveMentorRequests] = useState<any[]>([]);

  const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api-6tfr.onrender.com/api');

  // Resolve active hackathon & payment clearance status
  const activeEvent = useMemo(() => {
    return (hackathons || []).find((h: any) => h.id === userTeam?.hackathonId) || 
           (hackathons || []).find((h: any) => h.status === 'active' || h.status === 'registration_open') || 
           hackathons[0];
  }, [hackathons, userTeam]);

  const userRegistration = useMemo(() => {
    return (registrations || []).find((r: any) => 
      (r.userId === currentUser?.id || r.userId === (currentUser as any)?._id) &&
      (r.hackathonId === activeEvent?.id || !activeEvent?.id)
    ) || (registrations || []).find((r: any) => (r.userId === currentUser?.id || r.userId === (currentUser as any)?._id));
  }, [registrations, currentUser, activeEvent]);

  const isPaidEvent = activeEvent?.entryType === 'paid' || 
                      (activeEvent?.fee && activeEvent.fee > 0) || 
                      (userRegistration && userRegistration.entryType === 'paid' && userRegistration.feeAmount > 0);

  const feeAmount = userRegistration?.feeAmount ?? activeEvent?.fee ?? 1500;
  const paymentStatus = userRegistration?.paymentStatus;
  const regStatus = userRegistration?.status;

  const isPaymentUnderReview = paymentStatus === 'payment_under_review' || regStatus === 'payment_under_review';
  const isPaymentRejected = paymentStatus === 'rejected' || regStatus === 'rejected';
  const isPaymentVerified = !isPaidEvent || paymentStatus === 'verified' || paymentStatus === 'not_required' || regStatus === 'registered';
  const isPaymentPending = isPaidEvent && !isPaymentVerified && !isPaymentUnderReview && !isPaymentRejected;

  // Resolve problem statement track
  const currentProblem = useMemo(() => {
    return (problems || []).find((p: any) => p.id === userTeam?.problemId);
  }, [problems, userTeam?.problemId]);

  // Squad operatives resolution
  const teamMemberIds = userTeam?.memberIds || userTeam?.members || [];
  const teamMembers = teamMemberIds.map((mId: string) => {
    return users.find(u => u.id === mId || (u as any)?._id === mId) || { id: mId, name: mId, role: 'student' };
  });

  const fetchMentorRequests = async () => {
    try {
      if (!userTeam) return;
      const token = localStorage.getItem("codesrijan_auth_token");
      const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
      const res = await axios.get(`${BASE}/teams/${userTeam.id}/mentor-requests`, { headers: { Authorization: `Bearer ${token}` } });
      setActiveMentorRequests(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (userTeam) fetchMentorRequests();
  }, [userTeam]);

  const handleMentorRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentorRequestForm.topic) return;
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
      await axios.post(`${BASE}/mentor/requests`, mentorRequestForm, { headers: { Authorization: `Bearer ${token}` } });
      setIsRequestingMentor(false);
      setMentorRequestForm({ topic: '', description: '' });
      toast.success("Distress signal dispatched! Active mentors notified.");
      fetchMentorRequests();
    } catch (e: any) { toast.error(e.response?.data?.message || "Failed to request mentor."); }
  };

  const handleTaskUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      if (!userTeam) return;
      const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
      await axios.put(`${BASE}/teams/${userTeam.id}/tasks/${editingTask.id}`, editForm, { headers: { Authorization: `Bearer ${token}` } });
      setIsCreating(false);
      setEditingTask(null);
      toast.success("Task updated.");
      refetchData();
    } catch (err: any) {
      toast.error(`Error updating task: ${err.message}`);
    }
  };

  useEffect(() => {
    if (userTeam) {
      setGithubLink(userTeam.githubLink || userTeam.repositoryUrl || "");
      setFigmaLink(userTeam.figmaLink || "");
      setDemoLink(userTeam.demoLink || userTeam.demoUrl || "");
    }
  }, [userTeam]);

  useEffect(() => {
    if (!currentUser) navigate({ to: "/login" });
  }, [currentUser]);

  if (!currentUser) return <div className="min-h-screen bg-background" />;

  if (!userTeam) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-mono">
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf822_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-80" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-electric-blue/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="bg-[#0c1220]/95 backdrop-blur-md p-8 border-4 border-electric-blue shadow-[8px_8px_0px_0px_rgba(0,102,255,1)] max-w-lg text-center flex flex-col items-center relative z-10">
          <div className="w-16 h-16 bg-electric-blue/10 border-2 border-electric-blue text-electric-blue rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl">terminal</span>
          </div>
          <h2 className="text-2xl font-black uppercase mb-2 tracking-tight text-white">OPERATIVE WORKSPACE</h2>
          <p className="text-zinc-300 text-xs mb-6 font-mono leading-relaxed">
            The workspace HUD is tied to active squad sectors (supporting solo operatives with 1 member or squads up to 6). Create your squad in the dashboard or enlist with a team to unlock project tracking, live mentor comms, and project submission.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <Link to="/dashboard" className="bg-electric-blue text-black px-5 py-2.5 font-bold uppercase text-xs border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-white hover:text-black transition-all">
              Go To Dashboard (Squad Setup)
            </Link>
            <Link to="/recruitment" className="bg-white text-black px-5 py-2.5 font-bold uppercase text-xs border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-electric-blue hover:text-white transition-all">
              Recruitment Hub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleTaskCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    if (userTeam.isSubmitted) { toast.error("WORKSPACE LOCKED."); return; }

    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

      await axios.post(`${BASE}/teams/${userTeam.id}/tasks`,
        { title: newTaskTitle, description: "New Task Objective", status: 'todo', priority: 'medium' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewTaskTitle("");
      toast.success("Objective added to Backlog.");
      await refetchData();
    } catch (e: any) { toast.error(e.response?.data?.message || "Task generation failed."); }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    if (userTeam.isSubmitted) { toast.error("WORKSPACE LOCKED."); return; }
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

      await axios.put(`${BASE}/teams/${userTeam.id}/tasks/${taskId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await refetchData();
    } catch (e) { toast.error("State transmission fault."); }
  };

  const moveTaskRelative = async (taskId: string, currentStatus: string, direction: 'prev' | 'next') => {
    if (userTeam.isSubmitted) { toast.error("WORKSPACE LOCKED."); return; }
    const currentIndex = kanbanColumns.indexOf(currentStatus);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex >= 0 && targetIndex < kanbanColumns.length) {
      await updateTaskStatus(taskId, kanbanColumns[targetIndex]);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (userTeam.isSubmitted) { toast.error("WORKSPACE LOCKED."); return; }
    if (!confirm("Are you sure you want to delete this objective?")) return;
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

      await axios.delete(`${BASE}/teams/${userTeam.id}/tasks/${taskId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Objective deleted.");
      await refetchData();
    } catch (e: any) { toast.error(e.response?.data?.message || "Destruction protocol fault."); }
  };

  const handleSaveLinks = async () => {
    if (userTeam.isSubmitted) { toast.error("WORKSPACE LOCKED."); return; }
    setIsSavingLinks(true);
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

      await axios.put(`${BASE}/teams/${userTeam.id}/links`,
        { githubLink, figmaLink, demoLink },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await refetchData();
      toast.success("Payload links safely registered.");
    } catch (e) { 
      toast.error("Failed to store structural payloads."); 
    } finally {
      setIsSavingLinks(false);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionForm.githubLink && !submissionForm.figmaLink && !submissionForm.demoLink) {
      toast.error("CRITICAL: You must append at least one physical Payload Link (GitHub, Figma, Demo) before transmitting.");
      return;
    }

    if (isPaidEvent && !isPaymentVerified) {
      toast.error(`Clearance blocked: Payment of ₹${feeAmount} is incomplete or in audit. Please complete payment at /payment before final submission.`);
      navigate({ to: '/payment' });
      return;
    }

    if (!confirm("ABSOLUTE WARNING: Transmitting final payload permanently LOCKS this workspace. No operatives may leave, and tasks cannot be altered. Initiate sequence?")) return;

    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

      const techArray = submissionForm.technologies.split(',').map(t => t.trim()).filter(Boolean);

      await axios.post(`${BASE}/teams/${userTeam.id}/submit`,
        {
          ...submissionForm,
          technologies: techArray
        }, { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsSubmitting(false);
      await refetchData();
      toast.success("Final Payload transmitted! Squad workspace locked for evaluation.");
    } catch (e: any) { toast.error(e.response?.data?.message || "Transmission completely denied by server."); }
  };

  const kanbanColumns = ['todo', 'in-progress', 'review', 'completed'];
  const columnLabels = ['IDLE / BACKLOG', 'ACTIVE OPERATIONS', 'QA / REVIEW DECK', 'EXECUTED'];

  // Project Readiness Gauge calculation
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const hasTrack = Boolean(userTeam.problemId);
  const hasLinks = Boolean(githubLink || figmaLink || demoLink);
  
  let readinessScore = 0;
  if (userTeam) readinessScore += 25;
  if (hasTrack) readinessScore += 25;
  if (isPaymentVerified) readinessScore += 25;
  if (hasLinks) readinessScore += 25;

  // Filter tasks if search is active
  const filteredTasks = taskSearch.trim() 
    ? tasks.filter(t => (t.title || '').toLowerCase().includes(taskSearch.toLowerCase()) || (t.description || '').toLowerCase().includes(taskSearch.toLowerCase()))
    : tasks;

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-background pb-16 px-gutter md:px-0 bg-[radial-gradient(#00000018_1px,transparent_1px)] bg-[size:16px_16px]">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6 md:pt-12 pt-6">
        
        {/* Navigation & Header block */}
        <div className="w-full flex md:flex-row flex-col items-start md:items-center justify-between border-4 border-ink-black pb-8 bg-pure-white p-6 sm:p-8 brutal-shadow">
          <div>
            <Link to="/dashboard" className="font-label-bold uppercase text-ink-black flex items-center gap-2 mb-4 transition-transform hover:-translate-x-1 w-fit">
              <span className="material-symbols-outlined">arrow_back</span>
              RETURN TO DASHBOARD
            </Link>
            <h1 className="font-display-lg text-3xl sm:text-4xl md:text-5xl uppercase tracking-tight text-ink-black">
              SQUAD WORKSPACE
            </h1>
            <p className="font-mono text-xs sm:text-sm text-surface-variant flex gap-3 sm:gap-4 mt-2 font-bold flex-wrap items-center">
              <span className="uppercase text-electric-blue">DESIGNATION: {userTeam.name}</span>
              <span className="text-zinc-400">|</span>
              <span>EVENT: {activeEvent?.name || activeEvent?.id?.toUpperCase()}</span>
              {isPaidEvent && (
                <>
                  <span className="text-zinc-400">|</span>
                  <span className={isPaymentVerified ? 'text-emerald-600 font-bold' : isPaymentUnderReview ? 'text-yellow-600 font-bold' : 'text-amber-600 font-bold'}>
                    {isPaymentVerified ? 'PAYMENT VERIFIED' : isPaymentUnderReview ? 'PAYMENT IN AUDIT' : isPaymentRejected ? 'PAYMENT REJECTED' : `PAYMENT DUE (₹${feeAmount})`}
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 mt-6 md:mt-0">
            <span className="font-label-bold uppercase text-surface-variant text-xs">Framework Status</span>
            <div className="flex gap-3 items-center flex-wrap">
              {userTeam.isSubmitted ? (
                <span className="bg-success text-pure-white px-3 sm:px-4 py-2 font-label-bold text-xs uppercase tracking-widest flex items-center gap-2 border-2 border-success brutal-shadow-sm">
                  <span className="material-symbols-outlined text-sm">lock</span> PAYLOAD DELIVERED
                </span>
              ) : (
                <span className="bg-warning text-ink-black px-3 sm:px-4 py-2 font-label-bold text-xs uppercase tracking-widest flex items-center gap-2 border-2 border-ink-black brutal-shadow-sm">
                  <span className="material-symbols-outlined text-sm">shield</span> SYSTEMS UNLOCKED
                </span>
              )}
              <button 
                onClick={() => setIsRequestingMentor(true)} 
                className="bg-error text-pure-white px-3 sm:px-4 py-2 font-label-bold text-xs uppercase tracking-widest flex items-center gap-2 border-2 border-error brutal-shadow-sm brutal-hover hover:-translate-y-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">sos</span> REQUEST MENTOR
              </button>
            </div>
            
            {activeMentorRequests.length > 0 && (
              <div className="mt-2 text-right">
                <span className="font-label-bold uppercase text-[10px] text-surface-variant block mb-1">Active SOS Tickets ({activeMentorRequests.length})</span>
                {activeMentorRequests.map(req => (
                  <div key={req.id} className="bg-surface p-2 border-2 border-ink-black flex flex-col items-end gap-1 mb-1">
                    <span className="font-label-bold text-xs uppercase">{req.topic} - <span className={req.status === 'accepted' ? 'text-success' : 'text-warning'}>{req.status}</span></span>
                    {req.meetLink && <a href={req.meetLink} target="_blank" rel="noopener noreferrer" className="text-electric-blue text-xs font-bold underline flex items-center gap-1">JOIN MEET <span className="material-symbols-outlined text-xs">open_in_new</span></a>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Payment Clearance Warning Banner (If Payment Incomplete/In Audit) */}
        {isPaidEvent && !isPaymentVerified && (
          <div className={`border-4 p-4 sm:p-5 brutal-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
            isPaymentUnderReview ? 'bg-yellow-400/15 border-yellow-500' :
            isPaymentRejected ? 'bg-rose-500/15 border-rose-500' :
            'bg-amber-400/15 border-amber-500'
          }`}>
            <div className="flex items-start gap-3">
              <span className={`material-symbols-outlined text-3xl shrink-0 mt-0.5 ${
                isPaymentUnderReview ? 'text-yellow-600 animate-spin' :
                isPaymentRejected ? 'text-rose-600' :
                'text-amber-600'
              }`}>
                {isPaymentUnderReview ? 'sync' : isPaymentRejected ? 'error' : 'warning'}
              </span>
              <div>
                <h4 className="font-display-md text-base md:text-lg uppercase text-black font-bold">
                  {isPaymentUnderReview ? 'PAYMENT RECEIPT UNDER AUDIT — ADMIN VERIFICATION IN PROGRESS' :
                   isPaymentRejected ? 'PAYMENT PROOF DECLINED BY ADMINISTRATION' :
                   `SQUAD ENTRY CLEARANCE PENDING — PAYMENT REQUIRED (₹${feeAmount})`}
                </h4>
                <p className="font-mono text-xs text-zinc-700 mt-1">
                  {isPaymentUnderReview
                    ? `Your payment transaction reference (${userRegistration?.transactionReference || 'Registered'}) is queued for admin review. Workspace features remain active.`
                    : isPaymentRejected
                    ? `Reason: ${userRegistration?.reviewReason || "Receipt details could not be matched."} Please resubmit valid payment proof.`
                    : 'Your squad is registered for a paid hackathon. All workspace task management and link staging is active, but payload submission requires payment clearance.'}
                </p>
              </div>
            </div>
            <Link
              to="/payment"
              className={`shrink-0 font-label-bold text-xs uppercase px-5 py-3 border-2 border-black brutal-shadow-sm transition-all hover:-translate-y-0.5 ${
                isPaymentUnderReview ? 'bg-yellow-400 hover:bg-black hover:text-white text-black' :
                isPaymentRejected ? 'bg-rose-500 hover:bg-black hover:text-white text-white' :
                'bg-amber-400 hover:bg-black hover:text-white text-black'
              }`}
            >
              {isPaymentUnderReview ? 'Track Audit Status →' : isPaymentRejected ? 'Resubmit Proof →' : 'Complete Payment Now →'}
            </Link>
          </div>
        )}

        {/* Squad Operations Briefing Card (Roster, Track, Readiness) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-pure-white border-4 border-ink-black brutal-shadow p-6">
          
          {/* 1. Problem Statement Track */}
          <div className="border-2 border-ink-black p-4 bg-surface-container-lowest flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-mono font-bold uppercase text-surface-variant">LOCKED TRACK</span>
                {hasTrack ? (
                  <span className="bg-success text-white text-[9px] font-mono font-bold px-2 py-0.5 uppercase">LOCKED</span>
                ) : (
                  <span className="bg-warning text-black text-[9px] font-mono font-bold px-2 py-0.5 uppercase">UNASSIGNED</span>
                )}
              </div>
              <h3 className="font-display-sm text-base uppercase text-ink-black font-bold line-clamp-2">
                {currentProblem?.title || userTeam.problemId || "No Problem Statement Selected"}
              </h3>
              {currentProblem && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-mono bg-zinc-200 px-2 py-0.5 uppercase font-bold text-zinc-700">
                    {currentProblem.category}
                  </span>
                  <span className="text-[10px] font-mono bg-electric-blue/20 text-electric-blue px-2 py-0.5 uppercase font-bold">
                    {currentProblem.difficulty}
                  </span>
                </div>
              )}
            </div>
            {!userTeam.isSubmitted && (
              <Link to="/problems" className="mt-4 text-xs font-mono font-bold uppercase text-electric-blue hover:underline flex items-center gap-1">
                {hasTrack ? "Browse / Switch Tracks →" : "Select Track In Catalog →"}
              </Link>
            )}
          </div>

          {/* 2. Squad Operatives Roster */}
          <div className="border-2 border-ink-black p-4 bg-surface-container-lowest flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-mono font-bold uppercase text-surface-variant">OPERATIVE ROSTER</span>
                <span className="text-[10px] font-mono font-bold bg-black text-white px-2 py-0.5">
                  {teamMembers.length} / 4 CONNECTED
                </span>
              </div>
              <div className="space-y-1.5 mt-2">
                {teamMembers.map((member: any) => {
                  const isLeader = member.id === userTeam.leaderId;
                  return (
                    <div key={member.id} className="flex items-center justify-between text-xs font-mono bg-white p-2 border border-zinc-300">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-5 h-5 rounded-full bg-electric-blue text-white flex items-center justify-center font-bold text-[10px]">
                          {(member.name || 'O').charAt(0).toUpperCase()}
                        </span>
                        <span className="font-bold text-black truncate">{member.name || member.id}</span>
                      </div>
                      {isLeader && (
                        <span className="text-[9px] font-bold text-amber-600 bg-amber-100 border border-amber-300 px-1.5 py-0.5 uppercase">
                          LEADER
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="text-[10px] font-mono text-zinc-500 mt-2">
              Squad sector allocated • Solo or multi-operative support active
            </div>
          </div>

          {/* 3. Project Readiness Meter */}
          <div className="border-2 border-ink-black p-4 bg-surface-container-lowest flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-mono font-bold uppercase text-surface-variant">MISSION READINESS</span>
                <span className="font-display-sm text-sm font-bold text-electric-blue">{readinessScore}%</span>
              </div>
              <div className="w-full bg-surface-container h-3 brutal-border overflow-hidden mb-3">
                <div
                  className="bg-electric-blue h-full transition-all duration-500"
                  style={{ width: `${readinessScore}%` }}
                />
              </div>
              <div className="space-y-1 text-[11px] font-mono">
                <div className="flex items-center justify-between">
                  <span>1. Squad Allocation</span>
                  <span className="text-success font-bold">✓ READY</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>2. Track Selected</span>
                  <span className={hasTrack ? "text-success font-bold" : "text-amber-500 font-bold"}>
                    {hasTrack ? "✓ LOCKED" : "○ PENDING"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>3. Payment Clearance</span>
                  <span className={isPaymentVerified ? "text-success font-bold" : "text-amber-500 font-bold"}>
                    {isPaymentVerified ? "✓ CLEARED" : isPaymentUnderReview ? "⏳ IN AUDIT" : "○ DUE"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>4. Deliverables Staged</span>
                  <span className={hasLinks ? "text-success font-bold" : "text-amber-500 font-bold"}>
                    {hasLinks ? "✓ ATTACHED" : "○ EMPTY"}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-[10px] font-mono text-zinc-500 mt-2">
              {readinessScore === 100 ? "Ready for final lockdown transmission." : "Complete all checkpoints to unlock clean submission."}
            </div>
          </div>

        </div>

        {/* Mentor Request Modal */}
        {isRequestingMentor && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-white border-4 border-black brutal-shadow max-w-lg w-full p-6">
              <h3 className="font-display-lg text-2xl uppercase mb-4 text-error flex items-center gap-2">
                <span className="material-symbols-outlined text-3xl">sos</span> SOS MENTOR DISPATCH
              </h3>
              <p className="font-body-md text-surface-variant mb-4 font-bold">Stuck on a technical blocker? Broadcast a distress signal to all active mentors.</p>
              <form onSubmit={handleMentorRequest} className="flex flex-col gap-4">
                <input required placeholder="Topic (e.g., MongoDB Connection Error)" value={mentorRequestForm.topic} onChange={e => setMentorRequestForm({...mentorRequestForm, topic: e.target.value})} className="border-2 border-black p-3 bg-surface-container font-code-snippet" />
                <textarea required placeholder="Describe what you tried..." value={mentorRequestForm.description} onChange={e => setMentorRequestForm({...mentorRequestForm, description: e.target.value})} className="border-2 border-black p-3 bg-surface-container font-code-snippet min-h-[100px]"></textarea>
                <div className="flex gap-4 mt-4">
                  <button type="submit" className="flex-1 bg-error text-white font-bold py-3 border-2 border-black hover:-translate-y-1 brutal-shadow">TRANSMIT SIGNAL</button>
                  <button type="button" onClick={() => setIsRequestingMentor(false)} className="flex-1 bg-zinc-300 text-black font-bold py-3 border-2 border-black hover:-translate-y-1 brutal-shadow">CANCEL</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Kanban Grid */}
        <div className="bg-pure-white border-4 border-ink-black brutal-shadow p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-4 border-ink-black pb-4 mb-6">
            <div>
              <h2 className="font-headline-lg uppercase text-electric-blue">Active Operations Vectors</h2>
              <p className="font-mono text-xs text-surface-variant mt-1">
                Manage squad objectives across the pipeline ({completedTasks}/{totalTasks} executed).
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-grow sm:flex-grow-0">
                <input
                  type="text"
                  placeholder="Filter objectives..."
                  value={taskSearch}
                  onChange={e => setTaskSearch(e.target.value)}
                  className="border-2 border-ink-black px-3 py-1.5 text-xs font-mono outline-none focus:border-electric-blue w-full sm:w-48"
                />
                {taskSearch && (
                  <button onClick={() => setTaskSearch("")} className="absolute right-2 top-1.5 text-xs text-zinc-500 hover:text-black">✕</button>
                )}
              </div>
              {!userTeam.isSubmitted && (
                <button onClick={() => setIsCreating(true)} className="bg-electric-blue text-white font-bold py-2 px-4 border-2 border-black hover:-translate-y-0.5 brutal-shadow transition-transform text-xs uppercase shrink-0">
                  + CREATE TASK
                </button>
              )}
            </div>
          </div>
          
          {(isCreating || editingTask) && (
              <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                  <div className="bg-white border-4 border-black brutal-shadow max-w-lg w-full p-6">
                      <h3 className="font-display-lg text-2xl uppercase mb-4">{isCreating ? 'CREATE TASK' : 'EDIT TASK'}</h3>
                      <form onSubmit={isCreating ? handleTaskCreate : handleTaskUpdate} className="flex flex-col gap-4">
                          <input
                            required
                            placeholder="Task Title"
                            value={isCreating ? createForm.title : editForm.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (isCreating) setCreateForm(prev => ({ ...prev, title: val }));
                              else setEditForm(prev => ({ ...prev, title: val }));
                            }}
                            className="border-2 border-black p-3 bg-surface-container"
                          />
                          <textarea
                            placeholder="Description"
                            value={isCreating ? createForm.description : editForm.description}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (isCreating) setCreateForm(prev => ({ ...prev, description: val }));
                              else setEditForm(prev => ({ ...prev, description: val }));
                            }}
                            className="border-2 border-black p-3 bg-surface-container"
                          />
                          <select
                            value={isCreating ? createForm.priority : editForm.priority}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (isCreating) setCreateForm(prev => ({ ...prev, priority: val }));
                              else setEditForm(prev => ({ ...prev, priority: val }));
                            }}
                            className="border-2 border-black p-3 bg-surface-container"
                          >
                              <option value="low">Low Priority</option>
                              <option value="medium">Medium Priority</option>
                              <option value="high">High Priority</option>
                              <option value="critical">Critical Priority</option>
                          </select>
                          <input
                            placeholder="Assign To (Username or ID)"
                            value={isCreating ? createForm.assignedTo : editForm.assignedTo}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (isCreating) setCreateForm(prev => ({ ...prev, assignedTo: val }));
                              else setEditForm(prev => ({ ...prev, assignedTo: val }));
                            }}
                            className="border-2 border-black p-3 bg-surface-container"
                          />
                          <input
                            type="date"
                            value={isCreating ? createForm.dueDate : editForm.dueDate}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (isCreating) setCreateForm(prev => ({ ...prev, dueDate: val }));
                              else setEditForm(prev => ({ ...prev, dueDate: val }));
                            }}
                            className="border-2 border-black p-3 bg-surface-container"
                          />
                          <div className="flex gap-4 mt-4">
                              <button type="submit" className="flex-1 bg-electric-blue text-white font-bold py-3 border-2 border-black hover:-translate-y-1 brutal-shadow">SAVE TASK</button>
                              <button type="button" onClick={() => { setIsCreating(false); setEditingTask(null); }} className="flex-1 bg-zinc-300 text-black font-bold py-3 border-2 border-black hover:-translate-y-1 brutal-shadow">CANCEL</button>
                          </div>
                      </form>
                  </div>
              </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {kanbanColumns.map((col, idx) => {
              const tasksInCol = filteredTasks.filter(t => t.status === col);
              return (
                <div key={col} className={`bg-surface-container border-4 ${col === 'completed' && userTeam.isSubmitted ? 'border-success' : 'border-ink-black'} min-h-[440px] flex flex-col brutal-shadow-sm`}>
                  <div className={`p-3 font-label-bold uppercase text-center border-b-4 tracking-wider flex items-center justify-between px-4 ${(col === 'completed' || userTeam.isSubmitted) ? 'bg-ink-black text-pure-white border-ink-black' : 'bg-electric-blue text-pure-white border-ink-black'}`}>
                    <span className="text-xs">{columnLabels[idx]}</span>
                    <span className="text-[10px] font-mono bg-black/30 text-white px-2 py-0.5 rounded-full font-bold">
                      {tasksInCol.length}
                    </span>
                  </div>

                  <div className="flex-grow p-3 space-y-3 overflow-y-auto max-h-[500px]">
                    {tasksInCol.length === 0 ? (
                      <div className="h-32 border-2 border-dashed border-zinc-300 flex items-center justify-center p-4 text-center">
                        <span className="text-[11px] font-mono text-zinc-400 uppercase">NO ACTIVE OBJECTIVES</span>
                      </div>
                    ) : (
                      tasksInCol.map(task => (
                        <div key={task.id} className="bg-white border-2 border-ink-black p-3.5 brutal-shadow-sm group transition-all hover:-translate-y-0.5 hover:brutal-shadow relative">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[9px] font-mono font-bold text-surface-variant uppercase">{task.id}</span>
                            <div className="flex items-center gap-1">
                              {task.priority && (
                                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 border uppercase ${
                                  task.priority === 'critical' ? 'bg-rose-600 text-white border-rose-700 animate-pulse' :
                                  task.priority === 'high' ? 'bg-amber-400 text-black border-amber-500' :
                                  task.priority === 'medium' ? 'bg-electric-blue/20 text-electric-blue border-electric-blue' :
                                  'bg-zinc-200 text-zinc-700 border-zinc-400'
                                }`}>
                                  {task.priority}
                                </span>
                              )}
                              {!userTeam.isSubmitted && (
                                <button onClick={() => deleteTask(task.id)} className="text-error hover:bg-error/10 p-0.5 ml-1" title="Delete Task">
                                  <span className="material-symbols-outlined text-xs">delete</span>
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="font-label-bold uppercase text-xs leading-snug mb-3 pr-2 text-black">{task.title}</p>
                          {task.description && task.description !== 'New Task Objective' && (
                            <p className="text-[10px] font-mono text-zinc-600 mb-2 line-clamp-2">{task.description}</p>
                          )}

                          {/* Quick Nudge Arrows & Select Status Controls */}
                          {!userTeam.isSubmitted && (
                            <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-200 mt-2">
                              {idx > 0 && (
                                <button
                                  onClick={() => moveTaskRelative(task.id, col, 'prev')}
                                  className="bg-zinc-200 hover:bg-black hover:text-white p-1 text-xs border border-black font-bold cursor-pointer"
                                  title="Push Back"
                                >
                                  ←
                                </button>
                              )}

                              <select
                                value={task.status}
                                onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                                className="flex-grow bg-surface-container border border-ink-black text-[10px] font-mono font-bold uppercase p-1 cursor-pointer focus:outline-none focus:border-electric-blue"
                              >
                                {kanbanColumns.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                              </select>

                              {idx < kanbanColumns.length - 1 && (
                                <button
                                  onClick={() => moveTaskRelative(task.id, col, 'next')}
                                  className="bg-electric-blue hover:bg-black hover:text-white text-white p-1 text-xs border border-black font-bold cursor-pointer"
                                  title="Advance Next"
                                >
                                  →
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {col === 'todo' && !userTeam.isSubmitted && (
                    <form onSubmit={handleTaskCreate} className="p-3 border-t-4 border-ink-black bg-white flex gap-2">
                      <input
                        type="text"
                        placeholder="NEW OBJECTIVE"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="flex-grow border-2 border-ink-black p-1.5 text-xs font-mono font-bold uppercase placeholder-surface-variant outline-none focus:border-electric-blue transition-colors"
                      />
                      <button type="submit" className="bg-electric-blue text-pure-white px-3 border-2 border-electric-blue hover:-translate-y-0.5 transition-transform font-bold cursor-pointer" title="Add Objective">
                        <span className="material-symbols-outlined align-middle text-sm">add</span>
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Deliverable Payload Engine */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1 md:col-span-2 bg-pure-white border-4 border-ink-black brutal-shadow p-6 sm:p-8 flex flex-col gap-6">
            <div className="flex justify-between items-center border-b-4 border-ink-black pb-2">
              <h2 className="font-headline-lg uppercase text-electric-blue">Payload Attachments</h2>
              <span className="text-xs font-mono text-zinc-500 font-bold uppercase">Deliverable Matrix</span>
            </div>

            <div className="grid grid-cols-1 gap-6">
              
              {/* GitHub Repo Link */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-label-bold uppercase text-xs flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">code</span> GitHub Repository Core
                  </label>
                  {githubLink && (
                    <a
                      href={githubLink.startsWith('http') ? githubLink : `https://${githubLink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-electric-blue text-black hover:bg-black hover:text-white px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase border border-black flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[12px]">open_in_new</span> TEST LINK
                    </a>
                  )}
                </div>
                <input
                  disabled={userTeam.isSubmitted}
                  type="text"
                  value={githubLink}
                  onChange={e => setGithubLink(e.target.value)}
                  placeholder="https://github.com/organization/project"
                  className="w-full bg-surface-container border-2 border-ink-black p-3.5 font-mono text-sm focus:border-electric-blue outline-none transition-colors"
                />
              </div>

              {/* Figma Link */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-label-bold uppercase text-xs flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">palette</span> Figma Prototype Matrix
                  </label>
                  {figmaLink && (
                    <a
                      href={figmaLink.startsWith('http') ? figmaLink : `https://${figmaLink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#a259ff] text-white hover:bg-black px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase border border-black flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[12px]">open_in_new</span> TEST FIGMA
                    </a>
                  )}
                </div>
                <input
                  disabled={userTeam.isSubmitted}
                  type="text"
                  value={figmaLink}
                  onChange={e => setFigmaLink(e.target.value)}
                  placeholder="https://figma.com/file/..."
                  className="w-full bg-surface-container border-2 border-ink-black p-3.5 font-mono text-sm focus:border-electric-blue outline-none transition-colors"
                />
              </div>

              {/* Demo URL */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-label-bold uppercase text-xs flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">rocket_launch</span> Live Demo / Video Pitch
                  </label>
                  {demoLink && (
                    <a
                      href={demoLink.startsWith('http') ? demoLink : `https://${demoLink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-500 text-white hover:bg-black px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase border border-black flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[12px]">open_in_new</span> TEST DEMO
                    </a>
                  )}
                </div>
                <input
                  disabled={userTeam.isSubmitted}
                  type="text"
                  value={demoLink}
                  onChange={e => setDemoLink(e.target.value)}
                  placeholder="https://app.vercel.app or https://youtube.com/..."
                  className="w-full bg-surface-container border-2 border-ink-black p-3.5 font-mono text-sm focus:border-electric-blue outline-none transition-colors"
                />
              </div>

            </div>

            {!userTeam.isSubmitted && (
              <div className="flex items-center gap-4 pt-2">
                <button
                  onClick={handleSaveLinks}
                  disabled={isSavingLinks}
                  className="w-full sm:w-auto bg-ink-black text-pure-white px-8 py-3.5 font-label-bold uppercase border-2 border-transparent brutal-hover flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">save</span>
                  {isSavingLinks ? "SYNCHRONIZING..." : "STORE LINKS TO CLUSTER"}
                </button>
                <span className="text-xs font-mono text-zinc-500 hidden sm:inline">Persists links across squad operatives</span>
              </div>
            )}
          </div>

          {/* Lockdown / Submission Portal */}
          <div className={`col-span-1 border-4 brutal-shadow p-6 sm:p-8 flex flex-col items-center justify-center text-center ${userTeam.isSubmitted ? 'bg-success border-success text-pure-white' : 'bg-pure-white border-error text-ink-black'}`}>
            {!userTeam.isSubmitted ? (
              <>
                <span className="material-symbols-outlined text-error text-6xl mb-4 animate-pulse">crisis_alert</span>
                <h3 className="font-display-lg uppercase text-error text-3xl md:text-2xl mb-3 leading-none mx-auto max-w-[250px]">TRANSMIT PAYLOAD</h3>
                <p className="font-mono text-xs mb-6 px-2 opacity-80 leading-relaxed">
                  Execute this action ONLY when your squad has finalized structural construction. This will lock your Kanban arrays and team roster indefinitely.
                </p>

                {isPaidEvent && !isPaymentVerified && (
                  <div className="bg-amber-100 border-2 border-amber-500 p-2 text-[11px] font-mono text-amber-900 mb-4 w-full">
                    ⚠️ Payment clearance (₹{feeAmount}) required before transmission.
                  </div>
                )}

                <button
                  onClick={() => {
                    if (isPaidEvent && !isPaymentVerified) {
                      toast.error(`Clearance blocked: Payment of ₹${feeAmount} is required. Please verify payment at /payment.`);
                      navigate({ to: '/payment' });
                      return;
                    }
                    setSubmissionForm({
                      description: userTeam.description || "",
                      technologies: "",
                      githubLink: githubLink,
                      figmaLink: figmaLink,
                      demoLink: demoLink,
                      demoVideoUrl: ""
                    });
                    setIsSubmitting(true);
                  }}
                  className="bg-error text-pure-white font-headline-md uppercase px-6 py-3.5 w-full border-4 border-error brutal-hover hover:-translate-y-1 block mx-auto max-w-xs cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                >
                  INITIATE LOCKDOWN
                </button>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-pure-white text-6xl mb-4">gpp_good</span>
                <h3 className="font-display-lg uppercase text-pure-white text-3xl md:text-2xl mb-3 leading-none mx-auto max-w-[250px]">STRUCTURE LOCKED</h3>
                <p className="font-mono text-xs text-pure-white/90">Your squad payload is under strict immutability. Awaiting internal Evaluation Engine overrides.</p>
              </>
            )}
          </div>
        </div>
        
        {/* Rich Submission Modal */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white border-4 border-black brutal-shadow max-w-3xl w-full p-6 sm:p-8 my-8">
              <h3 className="font-display-lg text-3xl sm:text-4xl uppercase mb-4 text-stark-black border-l-8 border-success pl-4">FINAL TRANSMISSION</h3>
              <p className="font-code-snippet text-on-surface-variant mb-6 uppercase tracking-widest text-xs">
                Prepare your payload for evaluation. This action is irreversible. Provide detailed context for the judges.
              </p>
              <form onSubmit={handleFinalSubmit} className="flex flex-col gap-5">
                
                <div>
                  <label className="font-label-bold uppercase text-xs mb-1 block">Project Description (Markdown Supported) *</label>
                  <textarea required placeholder="# How we built it..." value={submissionForm.description} onChange={e => setSubmissionForm({...submissionForm, description: e.target.value})} className="w-full border-2 border-black p-4 bg-surface-container font-code-snippet min-h-[140px] text-xs"></textarea>
                </div>

                <div>
                  <label className="font-label-bold uppercase text-xs mb-1 block">Technologies Used (Comma separated) *</label>
                  <input required placeholder="React, Node.js, MongoDB, Rust" value={submissionForm.technologies} onChange={e => setSubmissionForm({...submissionForm, technologies: e.target.value})} className="w-full border-2 border-black p-3 bg-surface-container font-code-snippet text-xs" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-label-bold uppercase text-xs mb-1 block">GitHub Repository URL</label>
                    <input placeholder="https://github.com/..." value={submissionForm.githubLink} onChange={e => setSubmissionForm({...submissionForm, githubLink: e.target.value})} className="w-full border-2 border-black p-3 bg-surface-container font-code-snippet text-xs" />
                  </div>
                  <div>
                    <label className="font-label-bold uppercase text-xs mb-1 block">Figma Design URL</label>
                    <input placeholder="https://figma.com/..." value={submissionForm.figmaLink} onChange={e => setSubmissionForm({...submissionForm, figmaLink: e.target.value})} className="w-full border-2 border-black p-3 bg-surface-container font-code-snippet text-xs" />
                  </div>
                  <div>
                    <label className="font-label-bold uppercase text-xs mb-1 block">Live Demo / App URL</label>
                    <input placeholder="https://app.vercel.com/..." value={submissionForm.demoLink} onChange={e => setSubmissionForm({...submissionForm, demoLink: e.target.value})} className="w-full border-2 border-black p-3 bg-surface-container font-code-snippet text-xs" />
                  </div>
                  <div>
                    <label className="font-label-bold uppercase text-xs mb-1 block">Pitch Video (YouTube/Loom URL)</label>
                    <input placeholder="https://youtube.com/watch?v=..." value={submissionForm.demoVideoUrl} onChange={e => setSubmissionForm({...submissionForm, demoVideoUrl: e.target.value})} className="w-full border-2 border-black p-3 bg-surface-container font-code-snippet text-xs" />
                  </div>
                </div>

                <div className="bg-warning/20 border-2 border-warning p-3 mt-1">
                  <p className="font-code-snippet text-[11px] text-ink-black font-bold uppercase">
                    WARNING: Ensure all access permissions (GitHub, Figma, Videos) are set to PUBLIC or accessible via link.
                  </p>
                </div>

                <div className="flex gap-4 mt-2">
                  <button type="submit" className="flex-1 bg-success text-white font-bold py-3.5 text-lg border-2 border-black hover:-translate-y-1 brutal-shadow cursor-pointer">LOCK PAYLOAD & SUBMIT</button>
                  <button type="button" onClick={() => setIsSubmitting(false)} className="bg-zinc-300 text-black font-bold py-3.5 px-6 border-2 border-black hover:-translate-y-1 brutal-shadow cursor-pointer">CANCEL</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
