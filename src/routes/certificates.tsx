import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAppStore } from "../lib/store";
import axios from "axios";
import { toast } from "react-hot-toast";

export const Route = createFileRoute("/certificates")({
    component: CertificatesPage,
});

export function CertificatesPage() {
    const { currentUser, users, teams, hackathons } = useAppStore();
    const [verifyId, setVerifyId] = useState("");
    const [verificationResult, setVerificationResult] = useState<null | { valid: boolean; holder?: string; title?: string; issueDate?: string }>(null);
    const [isEligible, setIsEligible] = useState(false);
    const [myCertificates, setMyCertificates] = useState<any[]>([]);
    const [certsLoading, setCertsLoading] = useState(false);
    const [previewCert, setPreviewCert] = useState<any | null>(null);

    // Admin Upload State
    const [recipientType, setRecipientType] = useState<"user" | "team" | "hackathon">("user");
    const [targetUserId, setTargetUserId] = useState("");
    const [targetTeamId, setTargetTeamId] = useState("");
    const [targetHackathonId, setTargetHackathonId] = useState(hackathons?.[0]?.id || "");
    const [certTitle, setCertTitle] = useState("Certificate of Excellence");
    const [certType, setCertType] = useState("winner");
    const [certNotes, setCertNotes] = useState("");
    const [fileData, setFileData] = useState<string | null>(null);
    const [fileName, setFileName] = useState("");
    const [fileSize, setFileSize] = useState("");
    const [uploading, setUploading] = useState(false);
    const [adminIssuedCerts, setAdminIssuedCerts] = useState<any[]>([]);

    const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api-6tfr.onrender.com/api');

    // Fetch user's own certificates
    
    const handleDownloadCertificate = (cert: any) => {
        if (cert.metadata?.fileUrl) {
            const link = document.createElement('a');
            link.href = cert.metadata.fileUrl;
            link.download = `CodeSrijan-Certificate-${cert.id}`;
            link.target = '_blank';
            link.click();
            return;
        }

        const certCode = cert.metadata?.verificationCode || cert.id;
        const certTitle = cert.metadata?.title || (cert.type === 'winner' ? 'Certificate of Excellence' : cert.type === 'runner_up' ? 'Certificate of Merit' : 'Certificate of Participation');
        const recipient = cert.userName || currentUser?.name || 'Operative';
        const issueDate = cert.issueDate ? new Date(cert.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString();

        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" width="1000" height="700">
  <rect width="1000" height="700" fill="#FCFAF2"/>
  <rect x="25" y="25" width="950" height="650" fill="none" stroke="#000000" stroke-width="8"/>
  <rect x="40" y="40" width="920" height="620" fill="none" stroke="#0066FF" stroke-width="2" stroke-dasharray="8 4"/>
  <rect x="50" y="50" width="900" height="600" fill="none" stroke="#000000" stroke-width="2"/>
  
  <text x="500" y="110" font-family="monospace, sans-serif" font-size="28" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="4">CODESRIJAN 2026</text>
  <text x="500" y="135" font-family="monospace, sans-serif" font-size="12" font-weight="700" fill="#666666" text-anchor="middle" letter-spacing="3">NATIONAL HACKATHON &amp; INNOVATION COUNCIL</text>
  
  <circle cx="500" cy="180" r="26" fill="#FFD700" stroke="#000000" stroke-width="3"/>
  <text x="500" y="187" font-family="sans-serif" font-size="20" font-weight="bold" fill="#000000" text-anchor="middle">★</text>
  
  <text x="500" y="240" font-family="sans-serif" font-size="34" font-weight="900" fill="#0066FF" text-anchor="middle" letter-spacing="2">${certTitle.toUpperCase()}</text>
  <text x="500" y="290" font-family="monospace, sans-serif" font-size="13" font-weight="600" fill="#333333" text-anchor="middle" letter-spacing="2">THIS CREDENTIAL IS PROUDLY CONFERRED UPON</text>
  
  <text x="500" y="360" font-family="sans-serif" font-size="42" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="1">${recipient.toUpperCase()}</text>
  <line x1="250" y1="380" x2="750" y2="380" stroke="#000000" stroke-width="3"/>
  
  <text x="500" y="420" font-family="monospace, sans-serif" font-size="13" font-weight="500" fill="#444444" text-anchor="middle">For distinguished performance, system architecture, and technical innovation demonstrated</text>
  <text x="500" y="445" font-family="monospace, sans-serif" font-size="13" font-weight="500" fill="#444444" text-anchor="middle">during competitive hackathon operations within the CodeSrijan engineering ecosystem.</text>
  
  <g transform="translate(180, 500)">
    <circle cx="50" cy="50" r="45" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
    <circle cx="50" cy="50" r="38" fill="none" stroke="#FF0033" stroke-width="1.5" stroke-dasharray="4 2"/>
    <text x="50" y="46" font-family="monospace" font-size="9" font-weight="bold" fill="#FF0033" text-anchor="middle">OFFICIAL</text>
    <text x="50" y="58" font-family="monospace" font-size="9" font-weight="bold" fill="#FF0033" text-anchor="middle">VERIFIED</text>
  </g>
  
  <g transform="translate(620, 530)">
    <line x1="0" y1="0" x2="200" y2="0" stroke="#000000" stroke-width="2"/>
    <text x="100" y="20" font-family="monospace" font-size="11" font-weight="bold" fill="#000000" text-anchor="middle">EXECUTIVE DIRECTOR</text>
    <text x="100" y="35" font-family="monospace" font-size="9" fill="#666666" text-anchor="middle">CodeSrijan Directorate</text>
  </g>
  
  <rect x="70" y="605" width="860" height="35" fill="#EEEEEE" stroke="#000000" stroke-width="1"/>
  <text x="85" y="627" font-family="monospace" font-size="10" font-weight="bold" fill="#333333">AUTHENTICATION HASH: <tspan fill="#0066FF">${certCode}</tspan></text>
  <text x="915" y="627" font-family="monospace" font-size="10" font-weight="bold" fill="#333333" text-anchor="end">DATE ISSUED: ${issueDate}</text>
</svg>`;

        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const downloadAnchor = document.createElement('a');
        downloadAnchor.href = url;
        downloadAnchor.download = `CodeSrijan-Certificate-${certCode}.svg`;
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        document.body.removeChild(downloadAnchor);
        URL.revokeObjectURL(url);
        toast.success("Official certificate exported successfully!");
    };

    const fetchMyCertificates = async () => {
        if (!currentUser) return;
        try {
            setCertsLoading(true);
            const token = localStorage.getItem("codesrijan_auth_token");
            const res = await axios.get(`${API_URL}/certificates/my`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyCertificates(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            console.error("Failed to fetch my certificates", e);
        } finally {
            setCertsLoading(false);
        }
    };

    // Fetch admin issued certificates
    const fetchAdminCerts = async () => {
        if (currentUser?.role !== 'admin') return;
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            const res = await axios.get(`${API_URL}/admin/certificates`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAdminIssuedCerts(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            console.error("Failed to fetch admin certificates", e);
        }
    };

    useEffect(() => {
        if (currentUser) {
            fetchMyCertificates();
            if (currentUser.role === 'admin') {
                fetchAdminCerts();
            }
        }
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser?.teamId) return;
        const token = localStorage.getItem("codesrijan_auth_token");
        // Verify team submission status using teams
        axios.get(`${API_URL}/teams`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
            const myTeam = res.data.find((t: any) => t.id === currentUser.teamId);
            if (myTeam && myTeam.isSubmitted) setIsEligible(true);
        }).catch(err => console.error("Error confirming team eligibility:", err));
    }, [currentUser, API_URL]);

    const handleVerify = async () => {
        if (!verifyId.trim()) return;
        try {
            const res = await axios.get(`${API_URL}/certificates/verify/${verifyId.trim()}`);
            setVerificationResult({ 
                valid: true, 
                holder: res.data.userName,
                title: res.data.metadata?.title || res.data.type?.toUpperCase() || 'Participation Certificate',
                issueDate: res.data.issueDate ? new Date(res.data.issueDate).toLocaleDateString() : 'Verified'
            });
        } catch (err: any) {
            setVerificationResult({ valid: false });
        }
    };

    const handleGenerate = async () => {
        if (!isEligible) {
            toast.error("You need to submit a project before generating an official certificate!");
            return;
        }

        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            const res = await axios.post(`${API_URL}/certificates/generate`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Certificate Generated!\nRecipient: ${res.data.userName}\nID: ${res.data.id}`);
            await fetchMyCertificates();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Error generating cryptographic certificate block.");
        }
    };

    // Handle Admin File Upload (Convert to Base64)
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error("File exceeds maximum 10MB limit.");
            return;
        }

        setFileName(file.name);
        setFileSize((file.size / (1024 * 1024)).toFixed(2) + " MB");

        const reader = new FileReader();
        reader.onload = () => {
            setFileData(reader.result as string);
            toast.success(`Loaded ${file.name} successfully.`);
        };
        reader.readAsDataURL(file);
    };

    const handleAdminUploadCertificate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fileData) {
            toast.error("Please select a certificate file (PDF or Image) to upload.");
            return;
        }

        setUploading(true);
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            const payload = {
                recipientType,
                userId: targetUserId || undefined,
                teamId: targetTeamId || undefined,
                hackathonId: targetHackathonId || undefined,
                title: certTitle,
                type: certType,
                notes: certNotes,
                fileData
            };

            const res = await axios.post(`${API_URL}/admin/certificates/upload`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success(`Dispatched ${res.data.count || 1} official certificate(s) successfully!`);
            setFileData(null);
            setFileName("");
            setFileSize("");
            setCertNotes("");
            await fetchAdminCerts();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to upload certificate.");
        } finally {
            setUploading(false);
        }
    };

    const studentUsers = (users || []).filter(u => u.role === 'student');

    return (
        <div className="min-h-screen bg-background text-on-background flex flex-col font-mono">
            <main className="flex-grow max-w-[1240px] mx-auto px-4 md:px-8 py-10 space-y-12 w-full">
                {/* Go Back Header */}
                <div className="flex justify-between items-center border-b-4 border-stark-black pb-4">
                    <button 
                        onClick={() => window.history.back()} 
                        className="flex items-center gap-2 font-label-bold text-stark-black hover:text-electric-blue transition-all group w-fit cursor-pointer text-xs uppercase"
                    >
                        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1">arrow_back</span> Return to Hub
                    </button>
                    <span className="bg-electric-blue text-white px-3 py-1 text-[11px] font-bold uppercase brutal-border">
                        OFFICIAL CERTIFICATE MATRIX
                    </span>
                </div>

                {/* Hero Section */}
                <section className="bg-pure-white p-6 sm:p-8 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="w-10 h-10 bg-[#FFD700] text-black border-2 border-black flex items-center justify-center font-bold text-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            📜
                        </span>
                        <div>
                            <h1 className="font-display-lg text-2xl sm:text-3xl uppercase text-stark-black tracking-tight">
                                Certificate Verification & Issuance Center
                            </h1>
                            <p className="font-code-snippet text-xs text-zinc-600 uppercase tracking-wider mt-0.5">
                                Cryptographically Authenticated Records • Participation & Achievement Commendations
                            </p>
                        </div>
                    </div>
                </section>

                {/* ADMIN EXCLUSIVE: UPLOAD & ISSUE CERTIFICATE DIRECTORATE */}
                {currentUser?.role === 'admin' && (
                    <section className="bg-surface-container-highest brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-8 border-4 border-stark-black">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b-2 border-stark-black pb-4 mb-6">
                            <div>
                                <span className="bg-stark-black text-white px-2 py-0.5 text-[10px] font-bold uppercase">
                                    ADMIN DIRECTIVE
                                </span>
                                <h2 className="font-headline-md text-xl uppercase mt-1 text-stark-black font-bold">
                                    Upload & Issue Official Certificates
                                </h2>
                                <p className="text-xs text-zinc-600 mt-0.5">
                                    Upload high-resolution certificates (PDF/PNG/JPG) and bind them directly to students, teams, or entire event rosters.
                                </p>
                            </div>
                            <span className="bg-emerald-400 text-black px-3 py-1 font-mono text-xs font-bold border border-black uppercase">
                                ISSUANCE CLEARANCE: ACTIVE
                            </span>
                        </div>

                        <form onSubmit={handleAdminUploadCertificate} className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            {/* Left Config Column */}
                            <div className="md:col-span-7 flex flex-col gap-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="font-bold uppercase text-[11px] block mb-1">Target Recipient Mode</label>
                                        <select
                                            value={recipientType}
                                            onChange={(e: any) => setRecipientType(e.target.value)}
                                            className="w-full p-2.5 bg-pure-white brutal-border text-xs font-bold uppercase focus:outline-none focus:border-electric-blue"
                                        >
                                            <option value="user">Specific Student Operative</option>
                                            <option value="team">Entire Squad / Team</option>
                                            <option value="hackathon">All Hackathon Participants</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="font-bold uppercase text-[11px] block mb-1">Certificate Category</label>
                                        <select
                                            value={certType}
                                            onChange={e => setCertType(e.target.value)}
                                            className="w-full p-2.5 bg-pure-white brutal-border text-xs font-bold uppercase focus:outline-none focus:border-electric-blue"
                                        >
                                            <option value="winner">Winner / 1st Place</option>
                                            <option value="runner_up">Runner Up / 2nd Place</option>
                                            <option value="special_mention">Special Mention / Finalist</option>
                                            <option value="participation">Standard Participation</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Dynamic Recipient Dropdowns */}
                                {recipientType === 'user' && (
                                    <div>
                                        <label className="font-bold uppercase text-[11px] block mb-1">Select Student Operative *</label>
                                        <select
                                            value={targetUserId}
                                            onChange={e => setTargetUserId(e.target.value)}
                                            required
                                            className="w-full p-2.5 bg-pure-white brutal-border text-xs font-bold focus:outline-none focus:border-electric-blue"
                                        >
                                            <option value="">-- Choose Student Operative --</option>
                                            {studentUsers.map(u => (
                                                <option key={u.id} value={u.id}>
                                                    {u.name} ({u.email}) [ID: {u.id}]
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {recipientType === 'team' && (
                                    <div>
                                        <label className="font-bold uppercase text-[11px] block mb-1">Select Target Squad *</label>
                                        <select
                                            value={targetTeamId}
                                            onChange={e => setTargetTeamId(e.target.value)}
                                            required
                                            className="w-full p-2.5 bg-pure-white brutal-border text-xs font-bold focus:outline-none focus:border-electric-blue"
                                        >
                                            <option value="">-- Choose Squad / Team --</option>
                                            {(teams || []).map(t => (
                                                <option key={t.id} value={t.id}>
                                                    {t.name} ({(t.memberIds || []).length} members) [ID: {t.id}]
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="font-bold uppercase text-[11px] block mb-1">Associated Hackathon Event</label>
                                    <select
                                        value={targetHackathonId}
                                        onChange={e => setTargetHackathonId(e.target.value)}
                                        className="w-full p-2.5 bg-pure-white brutal-border text-xs font-bold uppercase focus:outline-none focus:border-electric-blue"
                                    >
                                        {(hackathons || []).map(h => (
                                            <option key={h.id} value={h.id}>{h.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="font-bold uppercase text-[11px] block mb-1">Certificate Title / Citation</label>
                                    <input
                                        type="text"
                                        value={certTitle}
                                        onChange={e => setCertTitle(e.target.value)}
                                        placeholder="e.g. Certificate of Excellence & 1st Place Commendation"
                                        className="w-full p-2.5 bg-pure-white brutal-border text-xs font-bold focus:outline-none focus:border-electric-blue"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold uppercase text-[11px] block mb-1">Executive Notes / Commendation (Optional)</label>
                                    <textarea
                                        rows={2}
                                        value={certNotes}
                                        onChange={e => setCertNotes(e.target.value)}
                                        placeholder="Commendation for outstanding performance in the innovation arena..."
                                        className="w-full p-2.5 bg-pure-white brutal-border text-xs focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Right File Upload & Preview Column */}
                            <div className="md:col-span-5 flex flex-col justify-between bg-pure-white p-5 brutal-border border-2 border-black">
                                <div>
                                    <label className="font-bold uppercase text-[11px] block mb-2 text-stark-black">
                                        Certificate File Upload (PDF or Image) *
                                    </label>
                                    
                                    <div className="border-2 border-dashed border-zinc-400 p-6 flex flex-col items-center justify-center text-center gap-2 hover:border-electric-blue transition-colors bg-surface-container-lowest relative cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp,application/pdf"
                                            onChange={handleFileSelect}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                        <span className="material-symbols-outlined text-4xl text-zinc-500">upload_file</span>
                                        <div className="text-xs font-bold text-zinc-700 uppercase">
                                            {fileName ? fileName : "Click or drag certificate file"}
                                        </div>
                                        <p className="text-[10px] text-zinc-500 uppercase">
                                            Supported: PDF, PNG, JPG, WebP (Max 10MB)
                                        </p>
                                        {fileSize && (
                                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 border border-emerald-300">
                                                Size: {fileSize}
                                            </span>
                                        )}
                                    </div>

                                    {/* Preview container */}
                                    {fileData && (
                                        <div className="mt-4 p-2 bg-surface-container border border-black">
                                            <span className="text-[10px] font-bold uppercase text-zinc-500 block mb-1">File Preview:</span>
                                            {fileData.startsWith('data:image/') ? (
                                                <img src={fileData} alt="Preview" className="w-full h-36 object-contain border border-zinc-300 bg-white" />
                                            ) : (
                                                <div className="p-3 bg-white border border-zinc-300 text-center text-xs font-bold text-electric-blue flex items-center justify-center gap-2">
                                                    <span className="material-symbols-outlined">description</span>
                                                    <span>{fileName} (PDF Ready for Dispatch)</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={uploading || !fileData}
                                    className="mt-6 w-full py-3.5 bg-electric-blue hover:bg-black text-white font-label-bold uppercase text-xs brutal-border shadow-[4px_4px_0px_0px_#000] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined text-sm">send</span>
                                    {uploading ? "TRANSMITTING CERTIFICATE..." : "UPLOAD & ISSUE OFFICIAL CERTIFICATE"}
                                </button>
                            </div>
                        </form>

                        {/* Recent Admin Dispatch Logs */}
                        {adminIssuedCerts.length > 0 && (
                            <div className="mt-8 border-t-2 border-stark-black pt-6">
                                <h3 className="font-bold text-xs uppercase mb-3 text-zinc-700 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-sm text-electric-blue">history</span>
                                    RECENTLY DISPATCHED CERTIFICATES ({adminIssuedCerts.length})
                                </h3>
                                <div className="max-h-56 overflow-y-auto space-y-2">
                                    {adminIssuedCerts.slice(0, 10).map((c: any) => (
                                        <div key={c.id} className="p-2.5 bg-white border border-black flex justify-between items-center text-xs">
                                            <div>
                                                <span className="font-bold text-stark-black">{c.userName || c.userId}</span>
                                                <span className="text-zinc-500 ml-2 text-[11px] font-mono">[{c.metadata?.title || c.type}]</span>
                                                <span className="text-[10px] text-zinc-400 block font-mono">ID: {c.id}</span>
                                            </div>
                                            {c.metadata?.fileUrl ? (
                                                <a 
                                                    href={c.metadata.fileUrl} 
                                                    download={`Certificate-${c.userName || c.id}`} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="bg-stark-black text-white px-3 py-1 text-[10px] font-bold uppercase hover:bg-electric-blue"
                                                >
                                                    View / Download ↗
                                                </a>
                                            ) : (
                                                <span className="text-[10px] text-zinc-400">System Issued</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* MY ISSUED CERTIFICATES GALLERY (FOR STUDENTS / RECEIVING USERS) */}
                {currentUser?.role !== 'admin' && (
                    <section className="bg-pure-white brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-8">
                        <div className="flex justify-between items-center border-b-2 border-stark-black pb-3 mb-6">
                            <div>
                                <h2 className="font-headline-md text-xl uppercase font-bold text-stark-black">
                                    My Received Certificates
                                </h2>
                                <p className="text-xs text-zinc-600 mt-0.5">
                                    Official certificates awarded to your operative account for hackathon participation and achievements.
                                </p>
                            </div>
                            <span className="bg-[#FFD700] text-black px-2.5 py-1 text-[11px] font-bold uppercase border border-black">
                                {myCertificates.length} AWARDED
                            </span>
                        </div>

                        {certsLoading ? (
                            <div className="py-8 text-center text-xs uppercase font-bold text-zinc-500">
                                Synchronizing received certificates...
                            </div>
                        ) : myCertificates.length === 0 ? (
                            <div className="p-8 bg-surface-container text-center border-2 border-dashed border-zinc-400 space-y-2">
                                <span className="material-symbols-outlined text-4xl text-zinc-400">workspace_premium</span>
                                <h3 className="font-bold text-sm uppercase text-stark-black">No Certificates Issued Yet</h3>
                                <p className="text-xs text-zinc-500 max-w-md mx-auto">
                                    Once your team submits a project or administrators upload certificates for your event, your official credentials will be available here for download.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {myCertificates.map(cert => (
                                    <div key={cert.id} className="bg-surface-container p-5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="bg-electric-blue text-white text-[10px] font-bold px-2 py-0.5 uppercase">
                                                    {cert.type?.toUpperCase() || 'OFFICIAL'}
                                                </span>
                                                <span className="text-[10px] text-zinc-500 font-mono">
                                                    {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : 'Issued'}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-base text-stark-black uppercase mb-1">
                                                {cert.metadata?.title || 'Certificate of Participation'}
                                            </h3>
                                            <p className="text-xs text-zinc-600 mb-3">
                                                Awarded to: <strong className="text-black">{cert.userName}</strong>
                                            </p>
                                            <div className="bg-white p-2 border border-zinc-300 text-[10px] font-mono text-zinc-500 mb-4">
                                                VERIFICATION CODE: <span className="text-electric-blue font-bold">{cert.metadata?.verificationCode || cert.id}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-3 border-t border-zinc-200">
                                            <button
                                                type="button"
                                                onClick={() => handleDownloadCertificate(cert)}
                                                className="flex-1 py-2.5 px-3 bg-electric-blue hover:bg-black text-white text-center font-bold text-xs uppercase border-2 border-black transition-all flex items-center justify-center gap-1.5 cursor-pointer brutal-shadow-sm hover:-translate-y-0.5"
                                            >
                                                <span className="material-symbols-outlined text-sm">download</span>
                                                Download Certificate
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPreviewCert(cert)}
                                                className="py-2.5 px-3 bg-pure-white hover:bg-zinc-100 text-black text-center font-bold text-xs uppercase border-2 border-black transition-all flex items-center justify-center gap-1.5 cursor-pointer brutal-shadow-sm hover:-translate-y-0.5"
                                                title="Preview and print official certificate"
                                            >
                                                <span className="material-symbols-outlined text-sm">visibility</span>
                                                Preview / Print
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* CERTIFICATE PREVIEW & PRINT MODAL */}
                {previewCert && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setPreviewCert(null); }}>
                        <div className="bg-white border-4 border-black brutal-shadow max-w-4xl w-full p-6 sm:p-8 my-8 space-y-6">
                            <div className="flex justify-between items-center border-b-2 border-black pb-4">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-electric-blue text-2xl">workspace_premium</span>
                                    <h3 className="font-display-lg text-xl uppercase font-black text-black">
                                        OFFICIAL CERTIFICATE PREVIEW
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setPreviewCert(null)}
                                    className="bg-black text-white p-1.5 hover:bg-rose-600 transition-colors border border-black cursor-pointer font-bold text-xs"
                                >
                                    ✕ CLOSE
                                </button>
                            </div>

                            {/* Printable Certificate Frame */}
                            <div id="codesrijan-certificate-frame" className="border-8 border-black p-8 sm:p-12 bg-[#FCFAF2] text-center space-y-6 relative shadow-inner">
                                <div className="border-2 border-dashed border-[#0066FF] p-6 sm:p-8 space-y-6">
                                    <div className="flex justify-between items-center text-xs font-mono font-bold text-zinc-500 uppercase border-b pb-2">
                                        <span>CODESRIJAN 2026 OFFICIAL CREDENTIAL</span>
                                        <span>HASH: {previewCert.metadata?.verificationCode || previewCert.id}</span>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="w-14 h-14 bg-[#FFD700] text-black border-2 border-black flex items-center justify-center font-bold text-2xl mx-auto shadow-[2px_2px_0px_#000]">
                                            ★
                                        </div>
                                        <h2 className="font-display-lg text-2xl sm:text-4xl uppercase text-electric-blue tracking-tight font-black pt-2">
                                            {previewCert.metadata?.title || (previewCert.type === 'winner' ? 'Certificate of Excellence' : previewCert.type === 'runner_up' ? 'Certificate of Merit' : 'Certificate of Participation')}
                                        </h2>
                                        <p className="font-mono text-xs uppercase tracking-widest text-zinc-600">
                                            PROUDLY PRESENTED TO
                                        </p>
                                    </div>

                                    <div className="py-2">
                                        <div className="text-3xl sm:text-5xl font-black uppercase text-black tracking-wide border-b-4 border-black pb-2 inline-block px-6">
                                            {previewCert.userName || currentUser?.name || 'Operative'}
                                        </div>
                                    </div>

                                    <p className="font-mono text-xs sm:text-sm text-zinc-700 max-w-xl mx-auto leading-relaxed">
                                        For outstanding performance, system architecture, and technical innovation demonstrated during competitive hackathon operations within the CodeSrijan engineering ecosystem.
                                    </p>

                                    <div className="flex flex-col sm:flex-row justify-between items-center pt-8 gap-6 border-t-2 border-black mt-6">
                                        <div className="text-left">
                                            <span className="font-bold uppercase text-[10px] text-zinc-500 block">Verification Authority:</span>
                                            <span className="font-mono text-xs font-bold text-electric-blue">{previewCert.metadata?.verificationCode || previewCert.id}</span>
                                            <span className="block text-[10px] text-zinc-400 font-mono">Date Issued: {previewCert.issueDate ? new Date(previewCert.issueDate).toLocaleDateString() : new Date().toLocaleDateString()}</span>
                                        </div>
                                        <div className="text-center sm:text-right">
                                            <div className="w-48 border-b-2 border-black pb-1 mb-1">
                                                <span className="font-mono text-xs italic text-zinc-600">CodeSrijan Directorate</span>
                                            </div>
                                            <span className="font-bold uppercase text-[10px] text-black block tracking-wider">Executive Organizing Council</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Action Buttons */}
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(previewCert.metadata?.verificationCode || previewCert.id);
                                        toast.success("Verification hash copied to clipboard!");
                                    }}
                                    className="py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-black font-bold text-xs uppercase border-2 border-black transition-colors flex items-center gap-2 cursor-pointer w-full sm:w-auto"
                                >
                                    <span className="material-symbols-outlined text-sm">content_copy</span>
                                    Copy Hash
                                </button>

                                <div className="flex gap-3 w-full sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={() => window.print()}
                                        className="flex-1 sm:flex-initial py-2.5 px-5 bg-pure-white hover:bg-zinc-100 text-black font-bold text-xs uppercase border-2 border-black transition-colors flex items-center justify-center gap-2 cursor-pointer brutal-shadow-sm"
                                    >
                                        <span className="material-symbols-outlined text-sm">print</span>
                                        Print / PDF
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDownloadCertificate(previewCert)}
                                        className="flex-1 sm:flex-initial py-2.5 px-5 bg-electric-blue hover:bg-black text-white font-bold text-xs uppercase border-2 border-black transition-colors flex items-center justify-center gap-2 cursor-pointer brutal-shadow-sm"
                                    >
                                        <span className="material-symbols-outlined text-sm">download</span>
                                        Download File
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
