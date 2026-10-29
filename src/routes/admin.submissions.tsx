import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../lib/utils";
import { useAppStore } from "../lib/store";

export const Route = createFileRoute("/admin/submissions")({
  component: AdminSubmissions,
});

function AdminSubmissions() {
  const { hackathons } = useAppStore();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Test Case Runner state
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testProjectTitle, setTestProjectTitle] = useState("Project Vanguard: Resilient Mesh Operating Network");
  const [testTeamName, setTestTeamName] = useState("Quantum Codex [Test Squad]");
  const [testHackathonId, setTestHackathonId] = useState("");
  const [isSeeding, setIsSeeding] = useState(false);

  // Inspector modal state
  const [inspectedSub, setInspectedSub] = useState<any | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchSubmissions = () => {
    const token = localStorage.getItem("codesrijan_auth_token");
    axios.get(`${API_BASE}/admin/submissions`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => {
        setSubmissions(r.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch submissions error:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSubmissions();
    if (hackathons && hackathons.length > 0) {
      setTestHackathonId(hackathons[0].id);
    }
  }, [hackathons]);

  const handleToggleLock = async (id: string, isLocked: boolean) => {
    setLoadingId(id);
    try {
        const token = localStorage.getItem("codesrijan_auth_token");
        const action = isLocked ? 'unlock' : 'lock';
        await axios.patch(`${API_BASE}/admin/submissions/${id}/${action}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setStatusMsg({ type: 'success', text: `Submission successfully ${action}ed.` });
        if (inspectedSub && inspectedSub.id === id) {
          setInspectedSub({ ...inspectedSub, status: action === 'lock' ? 'locked' : 'submitted' });
        }
        fetchSubmissions();
    } catch (err: any) {
        setStatusMsg({ type: 'error', text: 'Lock toggle failed.' });
    } finally {
        setLoadingId(null);
    }
  };

  const handleRunTestCase = async () => {
    setIsSeeding(true);
    setStatusMsg(null);
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const res = await axios.post(`${API_BASE}/admin/submissions/test-submission`, {
        projectTitle: testProjectTitle,
        teamName: testTeamName,
        hackathonId: testHackathonId || (hackathons[0]?.id || 'hack-default'),
        githubUrl: "https://github.com/codesrijan/quantum-codex-test",
        liveDemoUrl: "https://quantum-codex.vercel.app"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatusMsg({ type: 'success', text: res.data.message || 'Test submission created successfully!' });
      setIsTestModalOpen(false);
      fetchSubmissions();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Failed to generate test submission.' });
    } finally {
      setIsSeeding(false);
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = 
      (sub.projectTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.teamId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.id || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-20">
      {/* Header Bar */}
      <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-pure-white tracking-tight leading-none bg-stark-black px-2 py-1 inline-block transform -skew-x-6">
            PAYLOAD PIPELINE
          </h2>
          <p className="font-code-snippet text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">
            Team Submissions Matrix & Live Test Bench
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsTestModalOpen(true)}
            className="bg-[#00E5FF] hover:bg-[#00c4db] text-stark-black px-4 py-2 font-label-caps text-xs font-black tracking-widest brutal-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] uppercase cursor-pointer flex items-center gap-2 hover:-translate-y-0.5 transition-all"
          >
            <span className="material-symbols-outlined text-sm font-black">science</span>
            RUN TEST SUBMISSION CASE
          </button>
          <div className="bg-stark-black text-pure-white px-4 py-2 font-code-snippet font-bold tracking-widest brutal-border uppercase text-xs">
            Total: {submissions.length}
          </div>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 brutal-border font-label-bold uppercase flex items-center justify-between gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${statusMsg.type === 'error' ? 'bg-error text-white' : 'bg-success text-stark-black'}`}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined">{statusMsg.type === 'error' ? 'error' : 'check_circle'}</span>
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="font-bold underline text-xs cursor-pointer">DISMISS</button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-pure-white p-4 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
          <input
            type="text"
            placeholder="Search by project, team ID, or submission ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest brutal-border font-mono text-xs uppercase tracking-wider focus:outline-none focus:bg-pure-white"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="font-label-bold text-xs uppercase text-stark-black">Filter:</span>
          <div className="flex gap-1">
            {['all', 'submitted', 'locked'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 font-label-caps text-xs font-bold uppercase brutal-border transition-all cursor-pointer ${
                  statusFilter === status 
                    ? 'bg-stark-black text-pure-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                    : 'bg-pure-white text-stark-black hover:bg-surface-container'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-surface-container p-16 brutal-border text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="font-code-snippet uppercase tracking-widest animate-pulse font-bold">Scanning Transmission Logs...</p>
        </div>
      ) : (filteredSubmissions.length === 0) ? (
        <div className="bg-pure-white p-16 brutal-border text-center flex flex-col items-center justify-center gap-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant">inbox</span>
          <h3 className="font-display-lg uppercase text-2xl text-stark-black">NO MATCHING PAYLOADS</h3>
          <p className="font-mono text-on-surface-variant uppercase tracking-widest text-xs mb-4">
            {submissions.length === 0 
              ? "No squad has submitted their project yet. You can click 'RUN TEST SUBMISSION CASE' above to simulate a live team submission." 
              : "No submissions match your search query or status filter."}
          </p>
          {submissions.length === 0 && (
            <button
              onClick={() => setIsTestModalOpen(true)}
              className="bg-[#00E5FF] text-stark-black px-6 py-2 font-label-caps font-black tracking-widest brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase cursor-pointer hover:-translate-y-0.5 transition-all"
            >
              GENERATE SAMPLE SUBMISSION NOW
            </button>
          )}
        </div>
      ) : (
        <div className="bg-pure-white brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                    <tr className="bg-stark-black text-pure-white">
                        <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-[#00E5FF] border-b-4 text-xs">ID / Timestamp</th>
                        <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-[#00E5FF] border-b-4 text-xs">Squad Matrix</th>
                        <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-[#00E5FF] border-b-4 text-xs">Payload Artifacts</th>
                        <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-[#00E5FF] border-b-4 text-xs">Pipeline State</th>
                        <th className="p-4 font-label-bold uppercase tracking-widest border-b-4 border-[#00E5FF] text-center text-xs">Actions & Overrides</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredSubmissions.map((sub, i) => {
                        const isLocked = sub.status === 'locked';
                        return (
                            <tr key={sub.id || i} className={`border-b-2 border-stark-black hover:bg-surface-container transition-colors ${isLocked ? 'bg-surface-container-lowest' : ''}`}>
                                <td className="p-4 border-r-2 border-stark-black">
                                    <div className="font-code-snippet text-xs text-stark-black font-bold mb-1 flex items-center gap-1">
                                      {sub.id}
                                      {sub.isTest && <span className="bg-[#FFD700] text-stark-black text-[9px] px-1 font-black brutal-border">TEST CASE</span>}
                                    </div>
                                    <div className="font-code-snippet text-[10px] text-on-surface-variant uppercase">v{sub.version || 1} • {new Date(sub.createdAt || Date.now()).toLocaleString()}</div>
                                </td>
                                <td className="p-4 border-r-2 border-stark-black">
                                    <div className="font-label-bold uppercase text-stark-black text-sm">{sub.projectTitle || 'Unnamed Project'}</div>
                                    <div className="font-code-snippet text-xs text-[#00E5FF] font-bold">Squad: {sub.teamId}</div>
                                </td>
                                <td className="p-4 border-r-2 border-stark-black">
                                    <div className="flex flex-col gap-1">
                                        {sub.githubUrl && <a href={sub.githubUrl} target="_blank" rel="noreferrer" className="text-[10px] font-label-bold uppercase text-stark-black hover:text-[#00E5FF] flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">code</span> Repository</a>}
                                        {sub.liveDemoUrl && <a href={sub.liveDemoUrl} target="_blank" rel="noreferrer" className="text-[10px] font-label-bold uppercase text-stark-black hover:text-[#00E5FF] flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">public</span> Live Demo</a>}
                                        {sub.figmaUrl && <a href={sub.figmaUrl} target="_blank" rel="noreferrer" className="text-[10px] font-label-bold uppercase text-stark-black hover:text-[#00E5FF] flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">design_services</span> Prototype</a>}
                                        {sub.demoVideoUrl && <a href={sub.demoVideoUrl} target="_blank" rel="noreferrer" className="text-[10px] font-label-bold uppercase text-stark-black hover:text-[#00E5FF] flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">play_circle</span> Demo Video</a>}
                                        {!sub.githubUrl && !sub.liveDemoUrl && !sub.figmaUrl && !sub.demoVideoUrl && <span className="text-[10px] text-error font-bold uppercase">MISSING ARTIFACTS</span>}
                                    </div>
                                </td>
                                <td className="p-4 border-r-2 border-stark-black">
                                    <span className={`px-2 py-1 text-xs font-bold uppercase border-2 flex items-center gap-1 w-fit ${isLocked ? 'border-error text-error bg-error/10' : 'border-success text-success bg-success/10'}`}>
                                        <span className="material-symbols-outlined text-sm">{isLocked ? 'lock' : 'lock_open'}</span>
                                        {sub.status || 'submitted'}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                          onClick={() => setInspectedSub(sub)}
                                          className="px-3 py-1.5 font-label-caps text-xs bg-surface-container hover:bg-surface-container-high text-stark-black border-2 border-stark-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all font-bold tracking-wider uppercase cursor-pointer flex items-center gap-1"
                                      >
                                          <span className="material-symbols-outlined text-sm">visibility</span>
                                          INSPECT
                                      </button>
                                      <button
                                          onClick={() => handleToggleLock(sub.id, isLocked)}
                                          disabled={loadingId === sub.id}
                                          className={`px-3 py-1.5 font-label-caps text-xs border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all font-bold tracking-wider uppercase cursor-pointer disabled:opacity-50 ${isLocked ? 'bg-error text-pure-white border-stark-black' : 'bg-success text-stark-black border-stark-black'}`}
                                      >
                                          {loadingId === sub.id ? '...' : isLocked ? 'UNLOCK' : 'LOCK'}
                                      </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      )}

      {/* MODAL 1: TEST SUBMISSION SEEDER (CLICK OUTSIDE TO CLOSE) */}
      {isTestModalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsTestModalOpen(false); }}
          className="fixed inset-0 z-50 bg-stark-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
        >
          <div className="bg-pure-white brutal-border p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg flex flex-col gap-5">
            <div className="flex justify-between items-center border-b-2 border-stark-black pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00E5FF] font-black">science</span>
                <h3 className="font-display-lg uppercase text-xl text-stark-black tracking-tight">RUN TEST SUBMISSION CASE</h3>
              </div>
              <button 
                onClick={() => setIsTestModalOpen(false)} 
                className="w-8 h-8 flex items-center justify-center brutal-border hover:bg-error hover:text-white transition-colors font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="font-code-snippet text-xs text-on-surface-variant uppercase tracking-wider leading-relaxed">
              Inject an automated end-to-end test submission into the pipeline to verify submission rendering, payload inspection, locking, and judge evaluation views.
            </p>

            <div className="flex flex-col gap-3 font-mono text-xs">
              <div>
                <label className="font-label-bold uppercase text-xs text-stark-black mb-1 block">Target Hackathon:</label>
                <select
                  value={testHackathonId}
                  onChange={(e) => setTestHackathonId(e.target.value)}
                  className="w-full p-2 bg-surface-container-lowest brutal-border font-mono text-xs uppercase"
                >
                  {hackathons.map(h => (
                    <option key={h.id} value={h.id}>{h.name} ({h.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-label-bold uppercase text-xs text-stark-black mb-1 block">Simulated Squad Name:</label>
                <input
                  type="text"
                  value={testTeamName}
                  onChange={(e) => setTestTeamName(e.target.value)}
                  className="w-full p-2 bg-surface-container-lowest brutal-border font-mono text-xs uppercase"
                />
              </div>

              <div>
                <label className="font-label-bold uppercase text-xs text-stark-black mb-1 block">Project Title:</label>
                <input
                  type="text"
                  value={testProjectTitle}
                  onChange={(e) => setTestProjectTitle(e.target.value)}
                  className="w-full p-2 bg-surface-container-lowest brutal-border font-mono text-xs uppercase"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t-2 border-stark-black">
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="px-4 py-2 font-label-caps text-xs font-bold uppercase brutal-border hover:bg-surface-container cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={handleRunTestCase}
                disabled={isSeeding}
                className="px-6 py-2 font-label-caps text-xs font-black uppercase bg-[#00E5FF] hover:bg-[#00c4db] text-stark-black brutal-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isSeeding ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                    SEEDING PIPELINE...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">rocket_launch</span>
                    EXECUTE TEST CASE
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: INSPECT PAYLOAD MODAL (CLICK OUTSIDE TO CLOSE) */}
      {inspectedSub && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setInspectedSub(null); }}
          className="fixed inset-0 z-50 bg-stark-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
        >
          <div className="bg-pure-white brutal-border p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col gap-5">
            <div className="flex justify-between items-center border-b-2 border-stark-black pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-code-snippet text-xs bg-stark-black text-pure-white px-2 py-0.5 uppercase font-bold">
                    {inspectedSub.id}
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-bold uppercase border ${inspectedSub.status === 'locked' ? 'border-error text-error bg-error/10' : 'border-success text-success bg-success/10'}`}>
                    {inspectedSub.status}
                  </span>
                </div>
                <h3 className="font-display-lg uppercase text-2xl text-stark-black tracking-tight mt-1">
                  {inspectedSub.projectTitle || 'Project Details'}
                </h3>
              </div>
              <button 
                onClick={() => setInspectedSub(null)} 
                className="w-8 h-8 flex items-center justify-center brutal-border hover:bg-error hover:text-white transition-colors font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-container p-3 brutal-border">
                <div>
                  <span className="font-bold text-on-surface-variant uppercase text-[10px] block">Squad Identifier:</span>
                  <span className="text-stark-black font-bold">{inspectedSub.teamId}</span>
                </div>
                <div>
                  <span className="font-bold text-on-surface-variant uppercase text-[10px] block">Submitted At:</span>
                  <span className="text-stark-black">{new Date(inspectedSub.createdAt || Date.now()).toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-bold text-on-surface-variant uppercase text-[10px] block">Hackathon Scope:</span>
                  <span className="text-stark-black font-bold">{inspectedSub.hackathonId || 'Default Hackathon'}</span>
                </div>
                <div>
                  <span className="font-bold text-on-surface-variant uppercase text-[10px] block">Revision Version:</span>
                  <span className="text-stark-black font-bold">v{inspectedSub.version || 1}</span>
                </div>
              </div>

              {inspectedSub.description && (
                <div>
                  <h4 className="font-label-bold uppercase text-xs text-stark-black mb-1">Project Abstract & Description:</h4>
                  <div className="p-3 bg-surface-container-lowest brutal-border text-stark-black whitespace-pre-wrap leading-relaxed">
                    {inspectedSub.description}
                  </div>
                </div>
              )}

              {inspectedSub.solution && (
                <div>
                  <h4 className="font-label-bold uppercase text-xs text-stark-black mb-1">Technical Architecture / Solution:</h4>
                  <div className="p-3 bg-surface-container-lowest brutal-border text-stark-black whitespace-pre-wrap leading-relaxed">
                    {inspectedSub.solution}
                  </div>
                </div>
              )}

              {Array.isArray(inspectedSub.technologies) && inspectedSub.technologies.length > 0 && (
                <div>
                  <h4 className="font-label-bold uppercase text-xs text-stark-black mb-1">Tech Stack & Modules:</h4>
                  <div className="flex flex-wrap gap-1">
                    {inspectedSub.technologies.map((t: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-stark-black text-pure-white text-[11px] font-bold tracking-wider brutal-border">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-label-bold uppercase text-xs text-stark-black mb-2">Live Artifact Links:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {inspectedSub.githubUrl && (
                    <a href={inspectedSub.githubUrl} target="_blank" rel="noreferrer" className="p-2 brutal-border bg-surface-container-lowest hover:bg-[#00E5FF]/20 flex items-center justify-between transition-colors">
                      <span className="flex items-center gap-1 font-bold"><span className="material-symbols-outlined text-sm">code</span> GitHub Repo</span>
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </a>
                  )}
                  {inspectedSub.liveDemoUrl && (
                    <a href={inspectedSub.liveDemoUrl} target="_blank" rel="noreferrer" className="p-2 brutal-border bg-surface-container-lowest hover:bg-[#00E5FF]/20 flex items-center justify-between transition-colors">
                      <span className="flex items-center gap-1 font-bold"><span className="material-symbols-outlined text-sm">public</span> Live Demo URL</span>
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </a>
                  )}
                  {inspectedSub.figmaUrl && (
                    <a href={inspectedSub.figmaUrl} target="_blank" rel="noreferrer" className="p-2 brutal-border bg-surface-container-lowest hover:bg-[#00E5FF]/20 flex items-center justify-between transition-colors">
                      <span className="flex items-center gap-1 font-bold"><span className="material-symbols-outlined text-sm">design_services</span> Prototype Spec</span>
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </a>
                  )}
                  {inspectedSub.demoVideoUrl && (
                    <a href={inspectedSub.demoVideoUrl} target="_blank" rel="noreferrer" className="p-2 brutal-border bg-surface-container-lowest hover:bg-[#00E5FF]/20 flex items-center justify-between transition-colors">
                      <span className="flex items-center gap-1 font-bold"><span className="material-symbols-outlined text-sm">play_circle</span> Demo Video</span>
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t-2 border-stark-black">
              <button
                onClick={() => handleToggleLock(inspectedSub.id, inspectedSub.status === 'locked')}
                className={`px-4 py-2 font-label-caps text-xs font-bold uppercase brutal-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer ${
                  inspectedSub.status === 'locked' ? 'bg-error text-white' : 'bg-success text-stark-black'
                }`}
              >
                {inspectedSub.status === 'locked' ? 'FORCE UNLOCK PAYLOAD' : 'LOCKDOWN SUBMISSION'}
              </button>
              <button
                onClick={() => setInspectedSub(null)}
                className="px-6 py-2 font-label-caps text-xs font-bold uppercase bg-stark-black text-pure-white brutal-border cursor-pointer hover:bg-neutral-800"
              >
                CLOSE INSPECTOR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

