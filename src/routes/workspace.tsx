import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAppStore, resolveUserTeam } from "../lib/store";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

export const Route = createFileRoute("/workspace")({
  component: WorkspaceHUD,
});

function WorkspaceHUD() {
  const { currentUser, isLoaded, teams, tasks, hackathons, problems, users, registrations, refetchData } = useAppStore();
  const navigate = useNavigate();
  // Resilient squad resolution: match teamId, leaderId, or member membership
  const userTeam = resolveUserTeam(teams, currentUser);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [figmaLink, setFigmaLink] = useState("");
  const [demoLink, setDemoLink] = useState("");
  const [isSavingLinks, setIsSavingLinks] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState<any>(null);
  const [showTrackDossier, setShowTrackDossier] = useState(false);
  const [showWorkspaceWithdrawModal, setShowWorkspaceWithdrawModal] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [withdrawUpi, setWithdrawUpi] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const [submissionForm, setSubmissionForm] = useState({
    description: "",
    technologies: "",
    githubLink: "",
    figmaLink: "",
    demoLink: "",
    demoVideoUrl: ""
  });

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTaskData, setEditingTaskData] = useState<any | null>(null);
  const [taskModalForm, setTaskModalForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    assignedTo: '',
    dueDate: ''
  });
  const [isSavingTask, setIsSavingTask] = useState(false);

  const handleOpenCreateTask = (col: string = 'todo') => {
    setEditingTaskData(null);
    setTaskModalForm({
      title: '',
      description: '',
      priority: 'medium',
      status: col || 'todo',
      assignedTo: currentUser?.name || '',
      dueDate: ''
    });
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: any) => {
    setEditingTaskData(task);
    setTaskModalForm({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'medium',
      status: task.status || 'todo',
      assignedTo: task.assignedTo || '',
      dueDate: task.dueDate || ''
    });
    setIsTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTaskData(null);
    setTaskModalForm({
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      assignedTo: '',
      dueDate: ''
    });
  };

  const [isRequestingMentor, setIsRequestingMentor] = useState(false);
  const [mentorRequestForm, setMentorRequestForm] = useState({ topic: '', description: '' });
  const [activeMentorRequests, setActiveMentorRequests] = useState<any[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isTaskModalOpen) handleCloseTaskModal();
        if (isSubmitting) setIsSubmitting(false);
        if (isRequestingMentor) setIsRequestingMentor(false);
        if (showTrackDossier) setShowTrackDossier(false);
        if (showWorkspaceWithdrawModal) setShowWorkspaceWithdrawModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCreating, editingTask, isSubmitting, isRequestingMentor, showTrackDossier, showWorkspaceWithdrawModal]);

  const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api-6tfr.onrender.com/api');

  // Unified submission state
  const isSubmitted = Boolean(userTeam?.isSubmitted || existingSubmission);

  // Resolve active hackathon & payment clearance status
  const isSquadLeader = Boolean(
    currentUser && userTeam && (
      userTeam.leaderId === currentUser.id ||
      userTeam.leaderId === (currentUser as any)._id ||
      userTeam.leaderId === (currentUser as any).email ||
      (Array.isArray(userTeam.memberIds) && (userTeam.memberIds[0] === currentUser.id || userTeam.memberIds[0] === (currentUser as any)._id)) ||
      (Array.isArray(userTeam.memberIds) && userTeam.memberIds.length === 1) ||
      (!userTeam.leaderId)
    )
  );

  const activeEvent = useMemo(() => {
    return (hackathons || []).find((h: any) => h.id === userTeam?.hackathonId) || 
           (hackathons || []).find((h: any) => h.status === 'active' || h.status === 'registration_open') || 
           hackathons[0];
  }, [hackathons, userTeam]);

  const isHackathonStarted = useMemo(() => {
    if (!activeEvent) return true;
    const status = (activeEvent.status || '').toLowerCase();
    if (['active', 'ongoing', 'live'].includes(status)) return true;
    if (activeEvent.startDate) {
      return new Date(activeEvent.startDate).getTime() <= Date.now();
    }
    if (status === 'upcoming') return false;
    return true;
  }, [activeEvent]);

  const formattedStartDate = useMemo(() => {
    if (!activeEvent?.startDate) return "";
    try {
      return new Date(activeEvent.startDate).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata'
      }) + " IST";
    } catch {
      return activeEvent.startDate;
    }
  }, [activeEvent]);

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

  const isWithdrawnOrPendingRefund = Boolean(
    regStatus === 'withdrawn' || 
    userRegistration?.refundRequested ||
    (userRegistration?.status && ['withdrawn', 'cancelled', 'refund_requested', 'refund_pending'].includes(userRegistration.status))
  );

  const isPaymentUnderReview = !isWithdrawnOrPendingRefund && (paymentStatus === 'payment_under_review' || regStatus === 'payment_under_review');
  const isPaymentRejected = !isWithdrawnOrPendingRefund && (paymentStatus === 'rejected' || regStatus === 'rejected');
  const isPaymentVerified = isWithdrawnOrPendingRefund || !isPaidEvent || paymentStatus === 'verified' || paymentStatus === 'not_required' || regStatus === 'registered';
  const isPaymentPending = isPaidEvent && !isPaymentVerified && !isPaymentUnderReview && !isPaymentRejected && !isWithdrawnOrPendingRefund;

  // Resolve problem statement track
  const activeProblemId = userTeam?.problemStatementId || userTeam?.problemId;
  const currentProblem = useMemo(() => {
    return (problems || []).find((p: any) => p.id === activeProblemId || p._id === activeProblemId);
  }, [problems, activeProblemId]);

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

  const fetchSubmission = async () => {
    if (!userTeam) return;
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
      const res = await axios.get(`${BASE}/teams/${userTeam.id}/submission`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) {
        setExistingSubmission(res.data);
        if (res.data.githubLink) setGithubLink(res.data.githubLink);
        if (res.data.figmaLink) setFigmaLink(res.data.figmaLink);
        if (res.data.demoLink) setDemoLink(res.data.demoLink);
        setSubmissionForm(prev => ({
          ...prev,
          description: res.data.description || userTeam.description || prev.description,
          technologies: Array.isArray(res.data.technologies) ? res.data.technologies.join(', ') : (res.data.technologies || prev.technologies),
          githubLink: res.data.githubLink || prev.githubLink,
          figmaLink: res.data.figmaLink || prev.figmaLink,
          demoLink: res.data.demoLink || prev.demoLink,
          demoVideoUrl: res.data.demoVideoUrl || prev.demoVideoUrl
        }));
      }
    } catch (e) {
      // No existing submission yet
    }
  };

  useEffect(() => {
    if (userTeam) {
      void fetchMentorRequests();
      void fetchSubmission();
    }
  }, [userTeam?.id]);

  const handleWorkspaceWithdraw = async () => {
    if (!activeEvent) return;
    try {
      setIsWithdrawing(true);
      const token = localStorage.getItem("codesrijan_auth_token");
      const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
      const res = await axios.post(`${BASE}/hackathons/${activeEvent.id}/leave`, {
        reason: withdrawReason || "Squad voluntary withdrawal from workspace HUD",
        refundUpi: withdrawUpi || ""
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.message || "Squad successfully withdrawn from hackathon.");
      setShowWorkspaceWithdrawModal(false);
      setWithdrawReason("");
      setWithdrawUpi("");
      await refetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to withdraw squad from hackathon.");
    } finally {
      setIsWithdrawing(false);
    }
  };

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
    if (!editForm.title.trim()) {
      toast.error("Objective title cannot be empty.");
      return;
    }
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      if (!userTeam) return;
      const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
      await axios.put(`${BASE}/teams/${userTeam.id}/tasks/${editingTask.id}`, {
        title: editForm.title.trim(),
        description: editForm.description,
        status: (editForm as any).status || editingTask.status || 'todo',
        priority: editForm.priority || 'medium',
        assignedTo: editForm.assignedTo || '',
        dueDate: editForm.dueDate || ''
      }, { headers: { Authorization: `Bearer ${token}` } });
      handleCloseTaskModal();
      toast.success("Objective updated successfully.");
      refetchData();
    } catch (err: any) {
      toast.error(`Error updating task: ${err.response?.data?.message || err.message}`);
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
    if (isLoaded && !currentUser) navigate({ to: "/login" });
  }, [isLoaded, currentUser, navigate]);

  if (!isLoaded) return <p role="status" className="p-8">Loading your workspace…</p>;
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

  const handleSaveTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = taskModalForm.title.trim();
    if (!title) {
      toast.error("Please enter an objective title.");
      return;
    }
    if (!userTeam) {
      toast.error("Squad matrix not loaded.");
      return;
    }

    try {
      setIsSavingTask(true);
      const token = localStorage.getItem("codesrijan_auth_token");
      const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

      if (editingTaskData) {
        // Edit Task
        await axios.put(
          `${BASE}/teams/${userTeam.id}/tasks/${editingTaskData.id}`,
          {
            title,
            description: taskModalForm.description || '',
            priority: taskModalForm.priority || 'medium',
            status: taskModalForm.status || 'todo',
            assignedTo: taskModalForm.assignedTo || '',
            dueDate: taskModalForm.dueDate || ''
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Objective updated successfully.");
      } else {
        // Create Task
        await axios.post(
          `${BASE}/teams/${userTeam.id}/tasks`,
          {
            title,
            description: taskModalForm.description || 'Sprint Objective',
            priority: taskModalForm.priority || 'medium',
            status: taskModalForm.status || 'todo',
            assignedTo: taskModalForm.assignedTo || '',
            dueDate: taskModalForm.dueDate || ''
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Objective added to sprint board.");
      }

      handleCloseTaskModal();
      await refetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save objective.");
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleQuickTaskCreate = async (e: React.FormEvent, status: string = 'todo') => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
      await axios.post(`${BASE}/teams/${userTeam.id}/tasks`,
        { title: newTaskTitle.trim(), description: "New Task Objective", status, priority: 'medium' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewTaskTitle("");
      toast.success("Objective added to Backlog.");
      await refetchData();
    } catch (e: any) { toast.error(e.response?.data?.message || "Task generation failed."); }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
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
    if (isSubmitted) { toast.error("WORKSPACE LOCKED."); return; }
    const currentIndex = kanbanColumns.indexOf(currentStatus);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex >= 0 && targetIndex < kanbanColumns.length) {
      await updateTaskStatus(taskId, kanbanColumns[targetIndex]!);
    }
  };

  const deleteTask = async (taskId: string) => {
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
    if (isSubmitted) { toast.error("WORKSPACE LOCKED."); return; }
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

  const handleTransferLeadership = async (newLeaderId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to transfer Squad Leadership to ${memberName}? They will become the primary leader.`)) return;
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
      await axios.post(`${BASE}/teams/${userTeam.id}/transfer`, { newLeaderId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Squad leadership transferred to ${memberName}!`);
      await refetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to transfer leadership.");
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

    if (isSubmitLoading) return;
    setIsSubmitLoading(true);

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
      await fetchSubmission();
      toast.success(existingSubmission ? "Project deliverables successfully updated!" : "Final Payload transmitted! Squad workspace locked for evaluation.");
    } catch (e: any) { 
      toast.error(e.response?.data?.message || "Transmission completely denied by server."); 
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const kanbanColumns = ['todo', 'in-progress', 'review', 'completed'];
  const columnLabels = ['IDLE / BACKLOG', 'ACTIVE OPERATIONS', 'QA / REVIEW DECK', 'EXECUTED'];

  // Project Readiness Gauge calculation
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const hasTrack = Boolean(activeProblemId);
  const hasLinks = Boolean(githubLink || figmaLink || demoLink || isSubmitted);
  
  let readinessScore = 0;
  if (userTeam) readinessScore += 25;
  if (hasTrack) readinessScore += 25;
  if (isPaymentVerified) readinessScore += 25;
  if (hasLinks || isSubmitted) readinessScore += 25;
  if (isSubmitted) readinessScore = 100;

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
            <p className="font-mono text-xs sm:text-sm text-zinc-700 flex gap-3 sm:gap-4 mt-2 font-bold flex-wrap items-center">
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
            <span className="font-label-bold uppercase text-zinc-600 text-xs">Framework Status</span>
            <div className="flex gap-3 items-center flex-wrap">
              {isSubmitted ? (
                <span className="bg-emerald-500 text-white px-3 sm:px-4 py-2 font-label-bold text-xs uppercase tracking-widest flex items-center gap-2 border-2 border-black brutal-shadow-sm">
                  <span className="material-symbols-outlined text-sm">lock</span> PAYLOAD DELIVERED
                </span>
              ) : (
                <span className="bg-amber-400 text-black px-3 sm:px-4 py-2 font-label-bold text-xs uppercase tracking-widest flex items-center gap-2 border-2 border-black brutal-shadow-sm">
                  <span className="material-symbols-outlined text-sm">shield</span> SYSTEMS UNLOCKED
                </span>
              )}
              {isSquadLeader && activeEvent && !isSubmitted && (
                <button 
                  type="button" 
                  onClick={() => setShowWorkspaceWithdrawModal(true)} 
                  className="bg-rose-100 hover:bg-rose-600 hover:text-white text-rose-800 px-3 sm:px-4 py-2 font-label-bold text-xs uppercase tracking-wider flex items-center gap-1.5 border-2 border-rose-600 brutal-shadow-sm transition-colors cursor-pointer"
                  title="Withdraw squad from active hackathon"
                >
                  <span className="material-symbols-outlined text-sm">logout</span> WITHDRAW FROM EVENT
                </button>
              )}
              <button 
                onClick={() => setIsRequestingMentor(true)} 
                className="bg-error text-pure-white px-3 sm:px-4 py-2 font-label-bold text-xs uppercase tracking-widest flex items-center gap-2 border-2 border-error brutal-shadow-sm brutal-hover hover:-translate-y-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">sos</span> REQUEST MENTOR
              </button>
            </div>
            
            {activeMentorRequests.length > 0 && (
              <div className="mt-4 text-left border-2 border-black p-3 bg-surface-container max-w-xl">
                <div className="flex justify-between items-center mb-2 pb-1 border-b border-black">
                  <span className="font-label-bold uppercase text-[11px] text-black font-black flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-electric-blue">support_agent</span>
                    ACTIVE GUIDANCE SESSIONS ({activeMentorRequests.length})
                  </span>
                  <button type="button" onClick={fetchMentorRequests} className="underline text-[10px] font-mono font-bold hover:text-electric-blue cursor-pointer">
                    ↻ Refresh status
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {activeMentorRequests.map(req => (
                    <div key={req.id} className="bg-white p-2.5 border border-black shadow-[2px_2px_0px_#000] text-xs">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-bold uppercase text-[11px]">{req.topic}</span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 border uppercase ${
                          req.status === 'accepted' ? 'bg-emerald-100 text-emerald-800 border-emerald-500' :
                          req.status === 'resolved' ? 'bg-zinc-200 text-zinc-700 border-zinc-400' :
                          'bg-amber-100 text-amber-900 border-amber-500'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      {req.meetLink && /^https:\/\//i.test(req.meetLink) && (
                        <a href={req.meetLink} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-electric-blue font-bold text-xs underline">
                          JOIN MEET <span className="material-symbols-outlined text-xs">open_in_new</span>
                        </a>
                      )}
                      {req.responses?.map((response: {id: string; message: string; createdAt?: string}) => (
                        <div key={response.id} className="mt-2 border-l-2 border-electric-blue pl-2 bg-blue-50/50 p-1.5">
                          <p className="text-[10px] font-bold text-electric-blue uppercase">Mentor Guidance</p>
                          <p className="text-xs whitespace-pre-wrap text-zinc-800">{response.message}</p>
                          {response.createdAt && <p className="text-[9px] font-mono text-zinc-500 mt-0.5">{new Date(response.createdAt).toLocaleString()}</p>}
                        </div>
                      ))}
                      {req.status === 'resolved' && (
                        <div className="mt-2 pt-1 border-t border-zinc-200 flex justify-end">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const token = localStorage.getItem("codesrijan_auth_token");
                                const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
                                await axios.post(
                                  `${BASE}/mentor/requests/${encodeURIComponent(req.id)}/reopen`,
                                  {},
                                  { headers: { Authorization: `Bearer ${token}` } }
                                );
                                toast.success("Guidance request reopened! Active mentors alerted.");
                                await fetchMentorRequests();
                              } catch (err: any) {
                                toast.error(err.response?.data?.message || 'Could not reopen guidance request.');
                              }
                            }}
                            className="bg-black hover:bg-electric-blue text-white font-mono text-[10px] font-bold uppercase px-2 py-1 transition-colors cursor-pointer"
                          >
                            Reopen guidance request
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Squad Authorization Code Box */}
        <div className="bg-pure-white border-4 border-ink-black brutal-shadow p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-electric-blue text-white text-[10px] font-mono font-bold px-2 py-0.5 uppercase">
                SQUAD INVITE CODE
              </span>
              <span className="text-zinc-500 font-mono text-xs">Share with teammates to join</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xl sm:text-2xl font-black text-ink-black tracking-wider bg-zinc-100 border-2 border-black px-3 py-1 select-all">
                {userTeam.id}
              </span>
            </div>
          </div>
          {activeEvent && (
            <div className="bg-amber-100 border border-amber-400 p-2 text-[10px] font-mono text-amber-900 font-bold max-w-sm">
              🔒 ROSTER LOCKED IN HACKATHON: Roster modifications and invites are locked while deployed in {activeEvent.name || 'Hackathon'}.
            </div>
          )}
          <button
            type="button"
            disabled={Boolean(activeEvent)}
            onClick={() => {
              navigator.clipboard.writeText(userTeam.id);
              toast.success("Squad Code copied to clipboard! Teammates can enter this in Recruitment > Join.");
            }}
            className={`font-mono text-xs font-bold uppercase px-5 py-3 border-2 border-black shadow-[3px_3px_0_#000] flex items-center gap-2 shrink-0 ${
              activeEvent ? 'bg-zinc-200 text-zinc-500 cursor-not-allowed' : 'bg-electric-blue hover:bg-stark-black text-white hover:-translate-y-0.5 transition-all cursor-pointer'
            }`}
          >
            <span className="material-symbols-outlined text-sm">content_copy</span> {activeEvent ? "ROSTER LOCKED" : "COPY SQUAD CODE"}
          </button>
        </div>

        {/* Withdrawal & Refund Pending or Payment Clearance Banner */}
        {isWithdrawnOrPendingRefund ? (
          <div className="border-4 p-4 sm:p-5 brutal-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-amber-400/20 border-amber-500 modal-content-animate">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-3xl shrink-0 mt-0.5 text-amber-600 animate-pulse">
                pending_actions
              </span>
              <div>
                <h4 className="font-display-md text-base md:text-lg uppercase text-black font-bold">
                  WITHDRAWAL & REFUND CLAIM QUEUED — PENDING CLEARANCE
                </h4>
                <p className="font-mono text-xs text-zinc-700 mt-1 leading-relaxed">
                  Your squad's voluntary withdrawal and refund claim{feeAmount ? ` (₹${feeAmount})` : ''} have been recorded in the administrative ledger. Participation in this tournament is relinquished and awaiting final clearance.
                  {userRegistration?.refundUpi && (
                    <span className="block mt-1 font-bold text-black">Refund Destination UPI: {userRegistration.refundUpi}</span>
                  )}
                </p>
              </div>
            </div>
            <div className="shrink-0 bg-amber-400 border-2 border-black font-mono font-bold text-xs uppercase px-4 py-2 shadow-[2px_2px_0px_#000]">
              ⏳ Queued for Admin Review
            </div>
          </div>
        ) : isPaidEvent && !isPaymentVerified ? (
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
        ) : null}

        {/* Squad Operations Briefing Card (Roster, Track, Readiness) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-pure-white border-4 border-ink-black brutal-shadow p-6">
          
          {/* 1. Problem Statement Track */}
          <div className="border-2 border-ink-black p-4 bg-surface-container-lowest flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-mono font-bold uppercase text-zinc-600">LOCKED TRACK DOSSIER</span>
                {hasTrack ? (
                  <span className="bg-success text-white text-[9px] font-mono font-bold px-2 py-0.5 uppercase">LOCKED</span>
                ) : (
                  <span className="bg-warning text-black text-[9px] font-mono font-bold px-2 py-0.5 uppercase">UNASSIGNED</span>
                )}
              </div>
              <h3 className="font-display-sm text-base uppercase text-ink-black font-bold line-clamp-2">
                {currentProblem?.title || activeProblemId || "No Problem Statement Selected"}
              </h3>
              {currentProblem ? (
                <div className="space-y-2 mt-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-mono bg-zinc-200 px-2 py-0.5 uppercase font-bold text-zinc-700">
                      {currentProblem.category || currentProblem.domain || "DIRECTIVE"}
                    </span>
                    <span className="text-[10px] font-mono bg-electric-blue/20 text-electric-blue px-2 py-0.5 uppercase font-bold">
                      {currentProblem.difficulty || "STANDARD"}
                    </span>
                    {currentProblem.id && (
                      <span className="text-[10px] font-mono text-zinc-500 font-bold">
                        ID: {currentProblem.id}
                      </span>
                    )}
                  </div>
                  {currentProblem.description && (
                    <p className="text-[11px] font-mono text-zinc-600 line-clamp-3 leading-relaxed">
                      {currentProblem.description}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowTrackDossier(true)}
                    className="w-full bg-surface hover:bg-black hover:text-white text-ink-black font-mono font-bold text-[10px] uppercase py-1.5 px-2 border border-black shadow-[1px_1px_0px_#000] transition-colors flex items-center justify-center gap-1 cursor-pointer mt-1"
                  >
                    <span className="material-symbols-outlined text-xs">visibility</span> VIEW FULL TRACK DOSSIER ↗
                  </button>
                </div>
              ) : (
                <p className="text-[11px] font-mono text-zinc-500 mt-2">
                  Select a challenge track to align your deliverables with specific rubric criteria.
                </p>
              )}
            </div>
            {!isSubmitted && (
              <Link to="/problems" className="mt-4 text-xs font-mono font-bold uppercase text-electric-blue hover:underline flex items-center gap-1">
                {hasTrack ? "Browse / Switch Tracks →" : "Select Track In Catalog →"}
              </Link>
            )}
          </div>

          {/* 2. Squad Operatives Roster */}
          <div className="border-2 border-ink-black p-4 bg-surface-container-lowest flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-mono font-bold uppercase text-zinc-600">OPERATIVE ROSTER</span>
                <span className="text-[10px] font-mono font-bold bg-black text-white px-2 py-0.5">
                  {teamMembers.length} / 4 CONNECTED
                </span>
              </div>
              <div className="space-y-1.5 mt-2">
                {teamMembers.map((member: any) => {
                  const isLeader = member.id === userTeam.leaderId;
                  const isCurrentUserLeader = userTeam.leaderId === currentUser?.id;
                  const canTransfer = isCurrentUserLeader && !isLeader && !isSubmitted;
                  return (
                    <div key={member.id} className="flex items-center justify-between text-xs font-mono bg-white p-2 border border-zinc-300 gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-5 h-5 rounded-full bg-electric-blue text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                          {(member.name || 'O').charAt(0).toUpperCase()}
                        </span>
                        <span className="font-bold text-black truncate">{member.name || member.id}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isLeader ? (
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-100 border border-amber-300 px-1.5 py-0.5 uppercase">
                            LEADER
                          </span>
                        ) : canTransfer ? (
                          <button
                            type="button"
                            onClick={() => handleTransferLeadership(member.id, member.name || member.id)}
                            className="text-[9px] font-bold text-electric-blue bg-blue-50 border border-electric-blue hover:bg-electric-blue hover:text-white px-1.5 py-0.5 uppercase transition-colors cursor-pointer"
                            title="Transfer Squad Leadership"
                          >
                            TRANSFER LEADERSHIP
                          </button>
                        ) : null}
                      </div>
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
                <span className="text-[10px] font-mono font-bold uppercase text-zinc-600">MISSION READINESS</span>
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
                  <span className={
                    isWithdrawnOrPendingRefund ? "text-amber-600 font-bold" :
                    isPaymentVerified ? "text-success font-bold" :
                    isPaymentUnderReview ? "text-amber-500 font-bold" :
                    "text-amber-500 font-bold"
                  }>
                    {isWithdrawnOrPendingRefund ? "⏳ WITHDRAWN" :
                     isPaymentVerified ? "✓ CLEARED" :
                     isPaymentUnderReview ? "⏳ IN AUDIT" :
                     "○ DUE"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>4. Deliverables Staged</span>
                  <span className={isSubmitted ? "text-success font-bold" : hasLinks ? "text-success font-bold" : "text-amber-500 font-bold"}>
                    {isSubmitted ? "✓ DELIVERED" : hasLinks ? "✓ ATTACHED" : "○ EMPTY"}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-[10px] font-mono text-zinc-500 mt-2">
              {isSubmitted ? "Project successfully transmitted and locked for judging." : readinessScore === 100 ? "Ready for final lockdown transmission." : "Complete all checkpoints to unlock clean submission."}
            </div>
            {isSquadLeader && (
              !hasLinks ? (
                <a
                  href="#deliverable-matrix"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById("deliverable-matrix");
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth" });
                      const input = el.querySelector("input");
                      if (input) input.focus();
                    }
                  }}
                  className="mt-3 w-full bg-electric-blue text-white hover:bg-black font-mono font-bold text-[11px] uppercase py-2.5 px-3 border-2 border-black shadow-[2px_2px_0px_#000] hover:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">arrow_downward</span>
                  STAGE DELIVERABLES BELOW ↓
                </a>
              ) : !isSubmitted ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!isHackathonStarted) {
                      toast.info(`Tournament not commenced. Final submissions unlock on ${formattedStartDate || 'hackathon launch'}.`);
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
                  className="mt-3 w-full bg-rose-600 hover:bg-black text-white font-mono font-bold text-[11px] uppercase py-2.5 px-3 border-2 border-black shadow-[2px_2px_0px_#000] hover:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">rocket_launch</span>
                  TRANSMIT FINAL PAYLOAD ↗
                </button>
              ) : (
                <div className="mt-3 w-full bg-emerald-100 text-emerald-900 border-2 border-emerald-600 font-mono font-bold text-[11px] uppercase py-2 px-3 flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-xs text-emerald-600">check_circle</span>
                  PAYLOAD SECURED IN EVALUATION LEDGER
                </div>
              )
            )}
          </div>

        </div>

        {/* Mentor Request Modal */}
        {isRequestingMentor && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop-animate"
            onClick={e => { if (e.target === e.currentTarget) setIsRequestingMentor(false); }}
          >
            <div className="bg-white border-4 border-black brutal-shadow max-w-lg w-full p-6 sm:p-8 modal-content-animate relative">
              <div className="flex items-center justify-between border-b-4 border-black pb-3 mb-4">
                <h3 className="font-display-lg text-2xl uppercase text-error flex items-center gap-2">
                  <span className="material-symbols-outlined text-3xl animate-pulse">sos</span> SOS MENTOR DISPATCH
                </h3>
                <button
                  type="button"
                  onClick={() => setIsRequestingMentor(false)}
                  className="p-1 hover:bg-black hover:text-white border-2 border-black transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
              <p className="font-body-md text-zinc-700 mb-4 font-bold text-xs">Stuck on a technical blocker? Broadcast a distress signal to all active mentors.</p>
              <form onSubmit={handleMentorRequest} className="flex flex-col gap-4">
                <input required placeholder="Topic (e.g., MongoDB Connection Error)" value={mentorRequestForm.topic} onChange={e => setMentorRequestForm({...mentorRequestForm, topic: e.target.value})} className="border-2 border-black p-3 bg-surface-container font-code-snippet text-xs" />
                <textarea required placeholder="Describe what you tried..." value={mentorRequestForm.description} onChange={e => setMentorRequestForm({...mentorRequestForm, description: e.target.value})} className="border-2 border-black p-3 bg-surface-container font-code-snippet min-h-[100px] text-xs"></textarea>
                <div className="flex gap-4 mt-2">
                  <button type="submit" className="flex-1 bg-error hover:bg-black text-white font-bold py-3 border-2 border-black hover:-translate-y-1 brutal-shadow transition-all text-xs cursor-pointer">TRANSMIT SIGNAL</button>
                  <button type="button" onClick={() => setIsRequestingMentor(false)} className="flex-1 bg-zinc-200 hover:bg-zinc-300 text-black font-bold py-3 border-2 border-black hover:-translate-y-1 brutal-shadow transition-all text-xs cursor-pointer">CANCEL</button>
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
              <p className="font-mono text-xs text-zinc-600 mt-1 font-bold">
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
              {!isSubmitted && (
                <button onClick={() => handleOpenCreateTask('todo')} className="bg-electric-blue text-white font-bold py-2 px-4 border-2 border-black hover:-translate-y-0.5 brutal-shadow transition-transform text-xs uppercase shrink-0 cursor-pointer">
                  + CREATE TASK
                </button>
              )}
            </div>
          </div>
          
          {/* Completely Rewritten Task Creation & Edit Modal */}
        {isTaskModalOpen && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 modal-backdrop-animate font-mono"
            onClick={handleCloseTaskModal}
          >
            <div 
              className="bg-white border-4 border-black brutal-shadow max-w-lg w-full p-6 sm:p-8 modal-content-animate relative"
              onClick={e => e.stopPropagation()}
            >
              {/* Header with Title and Close Button */}
              <div className="flex items-center justify-between border-b-4 border-black pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-2xl text-electric-blue">
                    {editingTaskData ? 'edit_note' : 'add_task'}
                  </span>
                  <h3 className="font-display-lg text-2xl uppercase text-ink-black font-black">
                    {editingTaskData ? 'EDIT TASK OBJECTIVE' : 'CREATE NEW OBJECTIVE'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCloseTaskModal}
                  className="p-1.5 hover:bg-black hover:text-white border-2 border-black transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <form onSubmit={handleSaveTaskSubmit} className="flex flex-col gap-4 text-xs">
                <div>
                  <label className="block text-[11px] uppercase font-bold text-zinc-800 mb-1">
                    Objective Title *
                  </label>
                  <input
                    required
                    autoFocus
                    placeholder="e.g. Integrate Firebase Auth & Verify JWT"
                    value={taskModalForm.title}
                    onChange={e => setTaskModalForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full border-2 border-black p-3 bg-surface-container font-mono text-xs focus:outline-none focus:ring-2 focus:ring-electric-blue"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-bold text-zinc-800 mb-1">
                    Scope & Technical Context
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Milestone details, involved files, DoD..."
                    value={taskModalForm.description}
                    onChange={e => setTaskModalForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border-2 border-black p-3 bg-surface-container font-mono text-xs focus:outline-none focus:ring-2 focus:ring-electric-blue"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase font-bold text-zinc-800 mb-1">
                      Priority Level
                    </label>
                    <select
                      value={taskModalForm.priority}
                      onChange={e => setTaskModalForm(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full border-2 border-black p-2.5 bg-surface-container font-mono text-xs uppercase"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                      <option value="critical">Critical Priority</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-bold text-zinc-800 mb-1">
                      Pipeline Column
                    </label>
                    <select
                      value={taskModalForm.status}
                      onChange={e => setTaskModalForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full border-2 border-black p-2.5 bg-surface-container font-mono text-xs uppercase"
                    >
                      <option value="todo">Pipeline: IDLE / BACKLOG</option>
                      <option value="in-progress">Pipeline: ACTIVE OPERATIONS</option>
                      <option value="review">Pipeline: QA / REVIEW DECK</option>
                      <option value="completed">Pipeline: EXECUTED</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase font-bold text-zinc-800 mb-1">
                      Assignee Operative
                    </label>
                    <select
                      value={taskModalForm.assignedTo}
                      onChange={e => setTaskModalForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                      className="w-full border-2 border-black p-2.5 bg-surface-container font-mono text-xs"
                    >
                      <option value="">Unassigned</option>
                      {teamMembers.map((m: any) => (
                        <option key={m.id || m._id} value={m.name || m.username || m.id}>
                          {m.name || m.username || m.email || m.id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-bold text-zinc-800 mb-1">
                      Target Due Date
                    </label>
                    <input
                      type="date"
                      value={taskModalForm.dueDate}
                      onChange={e => setTaskModalForm(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full border-2 border-black p-2.5 bg-surface-container font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-3 pt-4 border-t-2 border-zinc-200">
                  <button
                    type="submit"
                    disabled={isSavingTask}
                    className="flex-1 bg-electric-blue hover:bg-black text-white font-label-bold uppercase py-3 border-2 border-black transition-all brutal-shadow hover:-translate-y-0.5 cursor-pointer text-xs flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {isSavingTask ? (
                      <>
                        <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                        SAVING OBJECTIVE...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        {editingTaskData ? 'UPDATE OBJECTIVE' : 'SAVE OBJECTIVE'}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={isSavingTask}
                    onClick={handleCloseTaskModal}
                    className="flex-1 bg-zinc-200 hover:bg-zinc-300 text-black font-label-bold uppercase py-3 border-2 border-black transition-all brutal-shadow hover:-translate-y-0.5 cursor-pointer text-xs disabled:opacity-60"
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {kanbanColumns.map((col, idx) => {
              const tasksInCol = filteredTasks.filter(t => t.status === col);
              return (
                <div key={col} className={`bg-surface-container border-4 ${col === 'completed' && isSubmitted ? 'border-success' : 'border-ink-black'} min-h-[440px] flex flex-col brutal-shadow-sm`}>
                  <div className={`p-3 font-label-bold uppercase text-center border-b-4 tracking-wider flex items-center justify-between px-4 ${(col === 'completed' || isSubmitted) ? 'bg-ink-black text-pure-white border-ink-black' : 'bg-electric-blue text-pure-white border-ink-black'}`}>
                    <span className="text-xs">{columnLabels[idx]}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono bg-black/30 text-white px-2 py-0.5 rounded-full font-bold">
                        {tasksInCol.length}
                      </span>
                      {!isSubmitted && (
                        <button
                          type="button"
                          onClick={() => handleOpenCreateTask(col)}
                          className="px-2 py-0.5 bg-white text-black hover:bg-yellow-300 font-black text-xs border border-black cursor-pointer shadow-[1px_1px_0px_#000] uppercase font-mono"
                          title={`Add objective directly to ${columnLabels[idx]}`}
                        >
                          + ADD
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-grow p-3 space-y-3 overflow-y-auto max-h-[500px]">
                    {tasksInCol.length === 0 ? (
                      <div className="h-32 border-2 border-dashed border-zinc-300 flex flex-col items-center justify-center p-4 text-center gap-2">
                        <span className="text-[11px] font-mono text-zinc-400 uppercase font-bold">NO ACTIVE OBJECTIVES</span>
                        {!isSubmitted && (
                          <button
                            type="button"
                            onClick={() => handleOpenCreateTask(col)}
                            className="bg-black hover:bg-electric-blue text-white font-mono text-[10px] font-bold uppercase px-2.5 py-1 border border-black cursor-pointer shadow-[1px_1px_0px_#000]"
                          >
                            + ADD OBJECTIVE
                          </button>
                        )}
                      </div>
                    ) : (
                      tasksInCol.map(task => (
                        <div key={task.id} className="bg-white border-2 border-ink-black p-3.5 brutal-shadow-sm group transition-all hover:-translate-y-0.5 hover:brutal-shadow relative">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase">{task.id}</span>
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
                              <button
                                type="button"
                                onClick={() => handleOpenEditTask(task)}
                                className="text-zinc-600 hover:text-black hover:bg-zinc-200 p-0.5 ml-1 border border-transparent hover:border-black transition-colors"
                                title="Edit Objective"
                              >
                                <span className="material-symbols-outlined text-xs">edit</span>
                              </button>
                              <button onClick={() => deleteTask(task.id)} className="text-error hover:bg-error/10 p-0.5 ml-0.5" title="Delete Task">
                                <span className="material-symbols-outlined text-xs">delete</span>
                              </button>
                            </div>
                          </div>

                          <p className="font-label-bold uppercase text-xs leading-snug mb-3 pr-2 text-black">{task.title}</p>
                          {task.description && task.description !== 'New Task Objective' && (
                            <p className="text-[10px] font-mono text-zinc-600 mb-2 line-clamp-2">{task.description}</p>
                          )}

                          {/* Quick Nudge Arrows & Select Status Controls */}
                          {true && (
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

                  {col === 'todo' && !isSubmitted && (
                    <form onSubmit={(e) => handleQuickTaskCreate(e, 'todo')} className="p-3 border-t-4 border-ink-black bg-white flex gap-2">
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
        <div id="deliverable-matrix" className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                  disabled={isSubmitted}
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
                  disabled={isSubmitted}
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
                  disabled={isSubmitted}
                  type="text"
                  value={demoLink}
                  onChange={e => setDemoLink(e.target.value)}
                  placeholder="https://app.vercel.app or https://youtube.com/..."
                  className="w-full bg-surface-container border-2 border-ink-black p-3.5 font-mono text-sm focus:border-electric-blue outline-none transition-colors"
                />
              </div>

            </div>

            {!isSubmitted && (
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
          <div className={`col-span-1 border-4 brutal-shadow p-6 sm:p-8 flex flex-col items-center justify-center text-center ${isSubmitted ? 'bg-emerald-600 border-black text-white' : 'bg-pure-white border-black text-ink-black'}`}>
            {!isSubmitted ? (
              <>
                <span className="material-symbols-outlined text-rose-600 text-6xl mb-4 animate-pulse">crisis_alert</span>
                <h3 className="font-display-lg uppercase text-rose-600 text-3xl md:text-2xl mb-3 leading-none mx-auto max-w-[280px]">SUBMIT YOUR PROJECT</h3>
                <p className="font-mono text-xs mb-6 px-2 opacity-80 leading-relaxed">
                  Execute this action ONLY when your squad has finalized structural construction. Submitting locks your project links permanently for evaluation.
                </p>

                {!isHackathonStarted ? (
                  <div className="bg-amber-100 border-4 border-amber-600 p-4 text-xs font-mono text-amber-950 mb-4 w-full text-center shadow-[3px_3px_0px_#d97706] modal-content-animate">
                    <div className="flex items-center justify-center gap-1.5 font-black text-sm mb-1 text-amber-900 uppercase">
                      <span className="material-symbols-outlined text-lg">lock_clock</span> TOURNAMENT NOT COMMENCED
                    </div>
                    <p className="leading-relaxed">
                      Deliverable submissions unlock automatically once the hackathon officially commences${formattedStartDate ? ` on ${formattedStartDate}` : ''}.
                    </p>
                    <div className="mt-2 text-[10px] uppercase font-bold text-amber-800 bg-amber-200/80 py-1 px-2 border border-amber-400">
                      Phase: Pre-Commencement Stage
                    </div>
                  </div>
                ) : isPaidEvent && !isPaymentVerified ? (
                  <div className="bg-amber-100 border-2 border-amber-500 p-2 text-[11px] font-mono text-amber-900 mb-4 w-full">
                    ⚠️ Payment clearance (₹{feeAmount}) required before submission.
                  </div>
                ) : null}

                {!isHackathonStarted ? (
                  <button
                    type="button"
                    disabled
                    className="bg-zinc-200 text-zinc-500 cursor-not-allowed font-headline-md uppercase px-6 py-3.5 w-full border-4 border-zinc-400 block mx-auto max-w-xs shadow-none opacity-80"
                    title={`Submissions unlock on ${formattedStartDate || 'tournament commencement'}`}
                  >
                    🔒 SUBMISSION LOCKED
                  </button>
                ) : !isSquadLeader ? (
                  <div className="bg-zinc-100 border-2 border-zinc-500 p-3 text-[11px] font-mono text-zinc-800 mb-2 w-full text-center">
                    🔒 <strong>ONLY SQUAD LEADER CAN SUBMIT:</strong><br/>
                    Contact your team leader ({teamMembers.find((m: any) => m.id === userTeam.leaderId)?.name || "Leader"}) to transmit the final project.
                  </div>
                ) : (
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
                    className="bg-rose-600 hover:bg-black text-white font-headline-md uppercase px-6 py-3.5 w-full border-4 border-black brutal-hover hover:-translate-y-1 block mx-auto max-w-xs cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    SUBMIT YOUR PROJECT
                  </button>
                )}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-white text-6xl mb-4">gpp_good</span>
                <h3 className="font-display-lg uppercase text-white text-3xl md:text-2xl mb-3 leading-none mx-auto max-w-[250px]">PROJECT SUBMITTED</h3>
                <p className="font-mono text-xs text-white/90 mb-4 leading-relaxed">
                  Your squad project deliverables are registered in the evaluation ledger. Awaiting Evaluation Engine review.
                </p>
                {isSquadLeader && (
                  <button
                    type="button"
                    onClick={() => {
                      setSubmissionForm({
                        description: existingSubmission?.description || userTeam.description || "",
                        technologies: Array.isArray(existingSubmission?.technologies) ? existingSubmission.technologies.join(', ') : (existingSubmission?.technologies || ""),
                        githubLink: existingSubmission?.githubLink || githubLink,
                        figmaLink: existingSubmission?.figmaLink || figmaLink,
                        demoLink: existingSubmission?.demoLink || demoLink,
                        demoVideoUrl: existingSubmission?.demoVideoUrl || ""
                      });
                      setIsSubmitting(true);
                    }}
                    className="bg-black hover:bg-white hover:text-black text-white font-label-bold uppercase text-xs py-3 px-5 border-2 border-white transition-all shadow-[2px_2px_0px_#000] cursor-pointer"
                  >
                    UPDATE DELIVERABLES ↗
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Rich Submission Modal */}
        {isSubmitting && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto modal-backdrop-animate"
            onClick={e => { if (e.target === e.currentTarget && !isSubmitLoading) setIsSubmitting(false); }}
          >
            <div className="bg-white border-4 border-black brutal-shadow max-w-3xl w-full p-6 sm:p-8 my-8 modal-content-animate relative">
              <div className="flex items-start justify-between border-b-4 border-black pb-4 mb-4">
                <div>
                  <h3 className="font-display-lg text-2xl sm:text-3xl uppercase text-stark-black border-l-8 border-success pl-3">
                    {isSubmitted ? "UPDATE DELIVERABLES TRANSMISSION" : "FINAL TRANSMISSION"}
                  </h3>
                </div>
                <button
                  type="button"
                  disabled={isSubmitLoading}
                  onClick={() => setIsSubmitting(false)}
                  className="p-1 hover:bg-black hover:text-white border-2 border-black transition-colors cursor-pointer disabled:opacity-50"
                  title="Close (Esc)"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
              <p className="font-code-snippet text-on-surface-variant mb-6 uppercase tracking-widest text-xs">
                {isSubmitted 
                  ? "Modify and synchronize your payload before evaluation locks." 
                  : "Prepare your payload for evaluation. This action is irreversible. Provide detailed context for the judges."}
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
                    CRITICAL CONFIRMATION: Are you sure? Once submitted, your squad workspace, links, and codebase are locked for judging.
                  </p>
                </div>

                <div className="flex gap-4 mt-2">
                  <button 
                    type="submit" 
                    disabled={isSubmitLoading}
                    className={`flex-1 bg-error text-white font-bold py-3.5 text-base sm:text-lg border-2 border-black hover:-translate-y-1 brutal-shadow uppercase flex items-center justify-center gap-3 transition-all ${isSubmitLoading ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
                  >
                    {isSubmitLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        TRANSMITTING & SYNCHRONIZING PAYLOAD...
                      </>
                    ) : (
                      isSubmitted ? 'SAVE & UPDATE DELIVERABLES' : 'CONFIRM & SUBMIT PROJECT'
                    )}
                  </button>
                  <button 
                    type="button" 
                    disabled={isSubmitLoading}
                    onClick={() => setIsSubmitting(false)} 
                    className="bg-zinc-300 text-black font-bold py-3.5 px-6 border-2 border-black hover:-translate-y-1 brutal-shadow cursor-pointer disabled:opacity-50"
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Track Dossier Modal */}
        {showTrackDossier && currentProblem && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto modal-backdrop-animate" onClick={e => { if (e.target === e.currentTarget) setShowTrackDossier(false); }}>
            <div className="bg-white border-4 border-black brutal-shadow max-w-2xl w-full p-6 sm:p-8 my-8 space-y-4 modal-content-animate">
              <div className="flex justify-between items-start gap-4 border-b-2 border-black pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-electric-blue text-white text-[10px] font-mono font-bold px-2 py-0.5 uppercase">
                      {currentProblem.category || currentProblem.domain || "TRACK"}
                    </span>
                    <span className="bg-zinc-200 text-black text-[10px] font-mono font-bold px-2 py-0.5 uppercase">
                      {currentProblem.difficulty || "STANDARD"}
                    </span>
                  </div>
                  <h2 className="font-display-lg text-2xl uppercase font-black text-ink-black">
                    {currentProblem.title}
                  </h2>
                </div>
                <button
                  onClick={() => setShowTrackDossier(false)}
                  className="p-1 border border-black hover:bg-black hover:text-white transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto space-y-4 text-xs font-mono pr-2">
                <div>
                  <h4 className="font-bold uppercase text-zinc-800 mb-1">Description & Operational Context</h4>
                  <p className="text-zinc-700 whitespace-pre-wrap leading-relaxed bg-surface-container p-3 border border-zinc-300">
                    {currentProblem.fullDescription || currentProblem.description || "No full description provided."}
                  </p>
                </div>

                {Array.isArray(currentProblem.requirements) && currentProblem.requirements.length > 0 && (
                  <div>
                    <h4 className="font-bold uppercase text-zinc-800 mb-1">Core Deliverable Requirements</h4>
                    <ul className="list-disc pl-5 space-y-1 text-zinc-700">
                      {currentProblem.requirements.map((req: string, i: number) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {Array.isArray(currentProblem.constraints) && currentProblem.constraints.length > 0 && (
                  <div>
                    <h4 className="font-bold uppercase text-zinc-800 mb-1">System Constraints & Boundaries</h4>
                    <ul className="list-disc pl-5 space-y-1 text-zinc-700">
                      {currentProblem.constraints.map((c: string, i: number) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t-2 border-black">
                {!isSubmitted && (
                  <Link
                    to="/problems"
                    className="px-4 py-2 bg-white text-black font-bold uppercase border-2 border-black hover:bg-zinc-100"
                  >
                    Switch Track
                  </Link>
                )}
                <button
                  onClick={() => setShowTrackDossier(false)}
                  className="px-4 py-2 bg-electric-blue text-white font-bold uppercase border-2 border-black hover:bg-black shadow-[2px_2px_0px_#000]"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Workspace Withdrawal Modal */}
        {showWorkspaceWithdrawModal && activeEvent && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop-animate" onClick={e => { if (e.target === e.currentTarget && !isWithdrawing) setShowWorkspaceWithdrawModal(false); }}>
            <div className="bg-white border-4 border-black brutal-shadow max-w-md w-full p-6 space-y-4 modal-content-animate">
              <h3 className="font-display-lg uppercase text-xl text-rose-600 flex items-center gap-2">
                <span className="material-symbols-outlined">warning</span> WITHDRAW SQUAD FROM EVENT
              </h3>
              <p className="text-xs text-zinc-800 font-body-md font-bold leading-relaxed">
                Are you sure you want to withdraw squad <strong>{userTeam.name}</strong> from <strong>{activeEvent.name || activeEvent.id}</strong>? Your squad roster will be unlocked and participation relinquished.
              </p>
              {isPaidEvent && (
                <div className="space-y-2 pt-2 border-t-2 border-zinc-200">
                  <div className="bg-amber-100 p-2 text-[10px] font-mono text-amber-900 border border-amber-300 font-bold">
                    💰 Paid Event (Fee: ₹{feeAmount}): Submitting withdrawal queues a refund claim directly to Admin Payments.
                  </div>
                  <input
                    type="text"
                    placeholder="Your UPI ID for refund (e.g. name@okhdfcbank)"
                    value={withdrawUpi}
                    onChange={e => setWithdrawUpi(e.target.value)}
                    className="w-full border-2 border-black p-2 text-xs font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Reason for withdrawal..."
                    value={withdrawReason}
                    onChange={e => setWithdrawReason(e.target.value)}
                    className="w-full border-2 border-black p-2 text-xs font-mono"
                  />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWorkspaceWithdrawModal(false)}
                  className="flex-1 py-2.5 border-2 border-black font-label-bold text-xs uppercase hover:bg-zinc-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleWorkspaceWithdraw}
                  disabled={isWithdrawing}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white border-2 border-black font-label-bold text-xs uppercase cursor-pointer disabled:opacity-50"
                >
                  {isWithdrawing ? 'Withdrawing...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
