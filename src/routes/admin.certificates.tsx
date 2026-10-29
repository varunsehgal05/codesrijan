import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAppStore } from "../lib/store";
import { API_BASE } from "../lib/utils";

export const Route = createFileRoute("/admin/certificates")({
  component: AdminCertificates,
});

export function AdminCertificates() {
  const { hackathons, teams, users } = useAppStore();
  const safeHackathons = Array.isArray(hackathons) ? hackathons : [];
  const safeTeams = Array.isArray(teams) ? teams : [];

  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [selectedHackathonId, setSelectedHackathonId] = useState("");
  const [templateUrl, setTemplateUrl] = useState("");
  const [targetType, setTargetType] = useState<"all" | "team">("all");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [certType, setCertType] = useState<"participation" | "winner" | "runner_up" | "special_mention">("participation");

  // Search & Preview
  const [searchQuery, setSearchQuery] = useState("");
  const [previewCert, setPreviewCert] = useState<any | null>(null);

  const fetchCerts = async () => {
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const res = await axios.get(`${API_BASE}/admin/certificates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCerts(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCerts();
  }, []);

  // Sync template URL when hackathon selection changes
  useEffect(() => {
    if (selectedHackathonId) {
      const h = safeHackathons.find(item => item.id === selectedHackathonId);
      if (h && h.certificateTemplateUrl) {
        setTemplateUrl(h.certificateTemplateUrl);
      } else {
        setTemplateUrl("");
      }
    }
  }, [selectedHackathonId, safeHackathons]);

  // Squads belonging to the selected hackathon
  const hackathonTeams = useMemo(() => {
    if (!selectedHackathonId) return safeTeams;
    return safeTeams.filter(t => t.hackathonId === selectedHackathonId);
  }, [safeTeams, selectedHackathonId]);

  // Handle local image/PDF file conversion to data URL or upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit. Please choose a smaller template.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      setTemplateUrl(result);
      toast.success(`Template "${file.name}" loaded for preview.`);
    };
    reader.readAsDataURL(file);
  };

  // Issue Certificates flow
  const handleIssueCertificates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHackathonId) {
      toast.error("Please select a target hackathon first.");
      return;
    }

    if (targetType === "team" && !selectedTeamId) {
      toast.error("Please select a recipient squad.");
      return;
    }

    setGenerating(true);
    setStatusMsg(null);
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const payload = {
        hackathonId: selectedHackathonId,
        templateUrl: templateUrl.trim(),
        target: targetType,
        teamId: targetType === "team" ? selectedTeamId : undefined,
        type: certType
      };

      const res = await axios.post(`${API_BASE}/admin/certificates/issue`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(res.data.message || "Certificates successfully generated and dispatched!");
      setStatusMsg({ type: 'success', text: res.data.message || "Certificates issued." });
      await fetchCerts();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to issue certificates.";
      toast.error(msg);
      setStatusMsg({ type: 'error', text: msg });
    } finally {
      setGenerating(false);
    }
  };

  // Filtered certificates for search
  const filteredCerts = useMemo(() => {
    return certs.filter(c => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const userName = c.userName || (users.find(u => u.id === c.userId)?.name) || '';
      const vCode = c.metadata?.verificationCode || c.verificationCode || c.id || '';
      const tName = c.metadata?.teamName || c.teamId || '';
      const eName = c.metadata?.eventName || c.hackathonId || '';

      return userName.toLowerCase().includes(q) ||
             vCode.toLowerCase().includes(q) ||
             tName.toLowerCase().includes(q) ||
             eName.toLowerCase().includes(q);
    });
  }, [certs, searchQuery, users]);

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-20 p-4 md:p-6">
      {/* Header */}
      <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-stark-black tracking-tight leading-none bg-[#FFD700] px-2 py-1 inline-block transform -skew-x-6">
            CERTIFICATES &amp; CREDENTIALS HQ
          </h2>
          <p className="font-code-snippet text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">
            Template Management • Cryptographic Issuance &amp; Email Dispatch
          </p>
        </div>
        <div className="font-code-snippet bg-stark-black text-pure-white px-5 py-3 border-2 border-stark-black font-bold uppercase tracking-widest flex items-center gap-2 text-xs">
          <span className="material-symbols-outlined text-[16px] text-[#FFD700]">workspace_premium</span>
          ISSUED CREDENTIALS: {certs.length}
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 brutal-border font-label-bold uppercase flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${statusMsg.type === 'error' ? 'bg-error text-pure-white' : 'bg-success text-stark-black'}`}>
          <span className="material-symbols-outlined">{statusMsg.type === 'error' ? 'error' : 'check_circle'}</span>
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Certificate Workflow Panel */}
      <div className="bg-pure-white p-6 md:p-8 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-6">
        <div className="border-b-4 border-stark-black pb-3">
          <span className="font-code-snippet text-xs text-electric-blue font-bold uppercase tracking-wider block">STAGE 1 &amp; 2 DIRECTIVE</span>
          <h3 className="font-headline-md text-2xl uppercase text-stark-black">
            Issue Hackathon Credentials
          </h3>
          <p className="font-code-snippet text-xs text-zinc-600 mt-1">
            Select the Hackathon to load its pre-uploaded certificate template. Choose whether to award an individual squad or batch-issue to ALL squads in the competition.
          </p>
        </div>

        <form onSubmit={handleIssueCertificates} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1: Select Hackathon */}
            <div className="flex flex-col gap-2">
              <label className="font-label-bold uppercase text-xs flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">military_tech</span>
                1. Select Target Hackathon *
              </label>
              <select
                required
                value={selectedHackathonId}
                onChange={(e) => setSelectedHackathonId(e.target.value)}
                className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet text-xs focus:outline-none focus:border-electric-blue"
              >
                <option value="">-- Choose Hackathon --</option>
                {safeHackathons.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name} [{h.id}]
                  </option>
                ))}
              </select>
              {selectedHackathonId && (
                <span className="text-[11px] font-mono text-zinc-500">
                  {hackathonTeams.length} squad(s) registered for this hackathon.
                </span>
              )}
            </div>

            {/* Certificate Type */}
            <div className="flex flex-col gap-2">
              <label className="font-label-bold uppercase text-xs flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">emoji_events</span>
                Award Category *
              </label>
              <select
                value={certType}
                onChange={(e) => setCertType(e.target.value as any)}
                className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet text-xs focus:outline-none focus:border-electric-blue"
              >
                <option value="participation">Participation Certificate</option>
                <option value="winner">Winner (1st Place)</option>
                <option value="runner_up">Runner-Up (2nd Place)</option>
                <option value="special_mention">Special Mention / Track Champion</option>
              </select>
            </div>
          </div>

          {/* Step 2: Certificate Template Upload / URL */}
          <div className="bg-zinc-50 border-2 border-zinc-300 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <label className="font-label-bold uppercase text-xs block text-stark-black">
                  2. Hackathon Certificate Template (Image or PDF)
                </label>
                <span className="text-[11px] font-mono text-zinc-500">
                  Pre-uploaded for this hackathon, or upload fresh image / PDF below:
                </span>
              </div>
              {templateUrl && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 border border-emerald-400 font-mono">
                  TEMPLATE LOADED ✓
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {/* File Upload Input */}
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-xs text-zinc-600">Upload Image / PDF Template:</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="bg-white border-2 border-stark-black p-2 text-xs font-mono cursor-pointer"
                />
              </div>

              {/* Direct URL Input */}
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-xs text-zinc-600">Or Paste Image/PDF URL:</span>
                <input
                  type="url"
                  value={templateUrl}
                  onChange={(e) => setTemplateUrl(e.target.value)}
                  placeholder="https://.../certificate-template.png"
                  className="bg-white border-2 border-stark-black p-2.5 text-xs font-mono focus:outline-none focus:border-electric-blue"
                />
              </div>
            </div>

            {/* Template Preview */}
            {templateUrl && (
              <div className="mt-2 border-2 border-dashed border-zinc-400 p-3 bg-white flex flex-col items-center justify-center">
                <span className="text-[10px] font-mono font-bold uppercase text-zinc-500 mb-2">Template Preview:</span>
                {templateUrl.startsWith("data:application/pdf") || templateUrl.endsWith(".pdf") ? (
                  <div className="flex items-center gap-2 p-4 bg-zinc-100 text-xs font-mono">
                    <span className="material-symbols-outlined text-red-500 text-2xl">picture_as_pdf</span>
                    <span>PDF Certificate Template Attached</span>
                  </div>
                ) : (
                  <img
                    src={templateUrl}
                    alt="Certificate Template Preview"
                    className="max-h-48 max-w-full object-contain border border-zinc-300"
                  />
                )}
              </div>
            )}
          </div>

          {/* Step 3: Recipient Selection */}
          <div className="bg-blue-50 border-2 border-electric-blue p-5 flex flex-col gap-4">
            <label className="font-label-bold uppercase text-xs text-electric-blue block">
              3. Recipient Squad Selection *
            </label>

            <div className="flex gap-6 items-center flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer font-label-bold uppercase text-xs">
                <input
                  type="radio"
                  name="targetType"
                  value="all"
                  checked={targetType === "all"}
                  onChange={() => setTargetType("all")}
                  className="w-4 h-4 accent-electric-blue"
                />
                Issue to ALL Teams in this Hackathon ({hackathonTeams.length} Squads)
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-label-bold uppercase text-xs">
                <input
                  type="radio"
                  name="targetType"
                  value="team"
                  checked={targetType === "team"}
                  onChange={() => setTargetType("team")}
                  className="w-4 h-4 accent-electric-blue"
                />
                Issue to a Specific Squad
              </label>
            </div>

            {targetType === "team" && (
              <div className="flex flex-col gap-1.5 mt-2 max-w-md">
                <label className="font-label-bold uppercase text-xs text-zinc-700">Choose Squad *</label>
                <select
                  required
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="bg-white border-2 border-stark-black p-3 font-code-snippet text-xs focus:outline-none focus:border-electric-blue"
                >
                  <option value="">-- Choose Squad --</option>
                  {hackathonTeams.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} [{t.id}] ({t.memberIds?.length || 0} members)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Action Trigger */}
          <button
            type="submit"
            disabled={generating || !selectedHackathonId}
            className="bg-stark-black hover:bg-electric-blue text-white py-4 px-8 font-label-bold uppercase brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
          >
            <span className="material-symbols-outlined">{generating ? 'sync' : 'verified_user'}</span>
            {generating
              ? "GENERATING & TRANSMITTING CERTIFICATES..."
              : targetType === "all"
              ? `GENERATE & DISPATCH TO ALL ${hackathonTeams.length} SQUADS →`
              : "GENERATE & DISPATCH TO SELECTED SQUAD →"}
          </button>
        </form>
      </div>

      {/* Search Bar for Issued Certificates */}
      <div className="bg-pure-white p-4 brutal-border shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-1/2 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search issued credentials by recipient name, squad, hash code, or event..."
            className="w-full bg-surface-container-lowest p-3 pr-10 font-code-snippet text-xs brutal-border focus:outline-none focus:ring-2 focus:ring-electric-blue"
          />
          {searchQuery ? (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 text-zinc-500 font-bold">✕</button>
          ) : (
            <span className="material-symbols-outlined absolute right-3 top-3 text-surface-variant text-sm">search</span>
          )}
        </div>
        <div className="text-xs font-mono text-zinc-600">
          Showing {filteredCerts.length} of {certs.length} certificates
        </div>
      </div>

      {/* Issued Certificates Table */}
      {loading ? (
        <div className="bg-surface-container p-16 brutal-border text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="font-code-snippet uppercase tracking-widest animate-pulse">Loading credential registry...</p>
        </div>
      ) : filteredCerts.length === 0 ? (
        <div className="bg-pure-white p-16 brutal-border text-center flex flex-col items-center justify-center gap-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant">workspace_premium</span>
          <h3 className="font-display-lg uppercase text-2xl text-stark-black">NO CERTIFICATES ISSUED YET</h3>
          <p className="font-mono text-on-surface-variant uppercase tracking-widest text-xs mb-4">
            Select a hackathon above and commence generation to award credentials.
          </p>
        </div>
      ) : (
        <div className="bg-pure-white brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
          <table className="w-full text-left font-body-md border-collapse min-w-[900px]">
            <thead className="bg-stark-black text-pure-white uppercase font-label-bold text-xs tracking-wider">
              <tr>
                <th className="p-4 border-r-2 border-electric-blue">Verification Hash</th>
                <th className="p-4 border-r-2 border-electric-blue">Recipient Operative</th>
                <th className="p-4 border-r-2 border-electric-blue">Squad &amp; Hackathon</th>
                <th className="p-4 border-r-2 border-electric-blue">Designation</th>
                <th className="p-4 border-r-2 border-electric-blue">Issued Date</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCerts.map(c => {
                const verificationHash = c.metadata?.verificationCode || c.verificationCode || c.id;
                const recipientName = c.userName || (users.find(u => u.id === c.userId)?.name) || c.userId;
                const teamName = c.metadata?.teamName || c.teamId || '-';
                const eventName = c.metadata?.eventName || c.hackathonId || '-';

                return (
                  <tr key={c.id} className="border-b-2 border-stark-black hover:bg-surface-bright text-xs">
                    <td className="p-4 border-r-2 border-stark-black font-code-snippet font-bold text-electric-blue">
                      {verificationHash}
                    </td>
                    <td className="p-4 border-r-2 border-stark-black">
                      <div className="font-label-bold uppercase text-sm text-stark-black">{recipientName}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">User ID: {c.userId}</div>
                    </td>
                    <td className="p-4 border-r-2 border-stark-black">
                      <div className="font-bold text-zinc-800">{teamName}</div>
                      <div className="text-[10px] text-zinc-500">{eventName}</div>
                    </td>
                    <td className="p-4 border-r-2 border-stark-black">
                      <span className={`px-2 py-0.5 font-bold uppercase text-[10px] border ${
                        c.type === 'winner' ? 'bg-[#FFD700] text-black border-black' :
                        c.type === 'runner_up' ? 'bg-zinc-200 text-black border-black' :
                        'bg-blue-50 text-blue-800 border-blue-400'
                      }`}>
                        {c.type?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 border-r-2 border-stark-black font-code-snippet text-zinc-500">
                      {new Date(c.issueDate || c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setPreviewCert(c)}
                        className="bg-stark-black text-white hover:bg-electric-blue px-3 py-1 font-label-bold text-[10px] uppercase brutal-border transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Inspect Certificate Modal */}
      {previewCert && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setPreviewCert(null); }}
          className="fixed inset-0 bg-stark-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm cursor-pointer"
        >
          <div className="bg-pure-white w-full max-w-xl brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8 flex flex-col gap-5 cursor-default">
            <div className="flex justify-between items-center border-b-4 border-stark-black pb-3">
              <h3 className="font-display-lg text-xl uppercase bg-[#FFD700] px-2 py-0.5 text-black">
                Credential Dossier
              </h3>
              <button onClick={() => setPreviewCert(null)} className="text-2xl font-bold">&times;</button>
            </div>

            <div className="bg-zinc-100 p-4 brutal-border space-y-2 text-xs font-mono">
              <div><strong>Verification Code:</strong> {previewCert.metadata?.verificationCode || previewCert.id}</div>
              <div><strong>Recipient:</strong> {previewCert.userName || previewCert.userId}</div>
              <div><strong>Squad:</strong> {previewCert.metadata?.teamName || previewCert.teamId}</div>
              <div><strong>Hackathon:</strong> {previewCert.metadata?.eventName || previewCert.hackathonId}</div>
              <div><strong>Category:</strong> {previewCert.type?.toUpperCase()}</div>
              <div><strong>Issued By:</strong> {previewCert.issuedBy || 'Administrator'}</div>
              <div><strong>Date:</strong> {new Date(previewCert.issueDate || previewCert.createdAt).toLocaleString()}</div>
            </div>

            {previewCert.metadata?.certificateTemplateUrl && (
              <div className="border-2 border-black p-2 bg-white flex flex-col items-center">
                <span className="text-[10px] font-mono text-zinc-500 uppercase mb-2">Attached Template:</span>
                <img
                  src={previewCert.metadata.certificateTemplateUrl}
                  alt="Template"
                  className="max-h-56 object-contain"
                />
              </div>
            )}

            <button
              onClick={() => setPreviewCert(null)}
              className="bg-stark-black text-white py-2.5 font-label-bold uppercase brutal-border hover:bg-electric-blue transition-colors"
            >
              Close Dossier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
