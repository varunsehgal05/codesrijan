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

                                        <div className="flex gap-2">
                                            {cert.metadata?.fileUrl ? (
                                                <a
                                                    href={cert.metadata.fileUrl}
                                                    download={`CodeSrijan-Certificate-${cert.id}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex-1 py-2.5 bg-stark-black hover:bg-electric-blue text-white text-center font-bold text-xs uppercase border border-black transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    <span className="material-symbols-outlined text-sm">download</span>
                                                    Download Certificate
                                                </a>
                                            ) : (
                                                <button
                                                    onClick={() => toast.success(`Certificate ${cert.id} verified on chain.`)}
                                                    className="flex-1 py-2.5 bg-stark-black hover:bg-electric-blue text-white text-center font-bold text-xs uppercase border border-black transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    <span className="material-symbols-outlined text-sm">verified</span>
                                                    Verified Certificate
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* DUAL ACTION CARDS: CLAIM & VERIFY */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Claim Certificate Card */}
                    <div className="bg-surface-bright brutal-border shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-8 flex flex-col justify-between">
                        <div>
                            <div className="w-12 h-12 bg-electric-blue flex items-center justify-center text-white mb-6 brutal-border shadow-[2px_2px_0px_0px_#000]">
                                <span className="material-symbols-outlined">workspace_premium</span>
                            </div>
                            <h2 className="font-headline-lg text-ink-black uppercase text-xl font-bold">
                                Claim Participation Certificate
                            </h2>
                            <p className="font-body-md text-zinc-600 mt-2 mb-6 text-xs leading-relaxed">
                                Participation certificates unlock automatically once your squad delivers the verified repository link and project demo in the workspace.
                            </p>
                        </div>

                        <div className="bg-surface-container-low p-3.5 border-l-4 border-electric-blue mb-6 text-xs">
                            <span className="font-bold text-black uppercase block mb-1">Eligibility Status:</span>
                            {isEligible ? (
                                <p className="text-emerald-700 font-bold flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-sm">check_circle</span> Submission Delivered & Verified
                                </p>
                            ) : (
                                <p className="text-rose-700 font-bold flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-sm">cancel</span> Awaiting Project Submission in Workspace
                                </p>
                            )}
                        </div>

                        <button
                            onClick={handleGenerate}
                            className={`w-full py-3.5 uppercase font-label-bold brutal-border shadow-[4px_4px_0px_0px_#000] flex justify-center items-center gap-2 transition-all text-xs ${
                                isEligible 
                                    ? 'bg-electric-blue text-white hover:bg-black cursor-pointer' 
                                    : 'bg-zinc-200 text-zinc-400 cursor-not-allowed border-zinc-400'
                            }`}
                            disabled={!isEligible}
                        >
                            <span className="material-symbols-outlined text-sm">download</span> 
                            Generate & Claim Certificate
                        </button>
                    </div>

                    {/* Verify Authenticity Card */}
                    <div className="bg-pure-white brutal-border shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-8 flex flex-col justify-between">
                        <div>
                            <div className="w-12 h-12 bg-stark-black text-white flex items-center justify-center mb-6 brutal-border shadow-[2px_2px_0px_0px_#000]">
                                <span className="material-symbols-outlined">verified</span>
                            </div>
                            <h2 className="font-headline-lg text-ink-black uppercase text-xl font-bold">
                                Verify Authenticity
                            </h2>
                            <p className="font-body-md text-zinc-600 mt-2 mb-6 text-xs leading-relaxed">
                                CodeSrijan cryptographically binds unique hashes to every certificate. Enter any Certificate ID below to validate legitimacy and recipient credentials.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="e.g. CS-CERT-..., CS-0943-AB"
                                value={verifyId}
                                onChange={(e) => setVerifyId(e.target.value)}
                                className="w-full bg-surface-bright brutal-border p-3 text-xs font-mono text-ink-black focus:outline-none focus:ring-2 focus:ring-electric-blue"
                            />
                            <button
                                onClick={handleVerify}
                                className="w-full bg-stark-black text-white hover:bg-electric-blue hover:text-white brutal-border shadow-[4px_4px_0px_0px_#000] py-3.5 uppercase font-label-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <span className="material-symbols-outlined text-sm">search_check</span>
                                Scan Database & Verify
                            </button>

                            {verificationResult && (
                                <div className={`mt-3 p-3 brutal-border flex items-start gap-3 animate-fade-in text-xs ${verificationResult.valid ? 'bg-emerald-50 text-emerald-900 border-emerald-600' : 'bg-rose-50 text-rose-900 border-rose-600'}`}>
                                    <span className="material-symbols-outlined text-lg">
                                        {verificationResult.valid ? 'verified' : 'gpp_bad'}
                                    </span>
                                    <div>
                                        <p className="font-bold uppercase">
                                            {verificationResult.valid ? 'Certificate Record Authenticated' : 'Record Not Found in Registry'}
                                        </p>
                                        {verificationResult.valid && (
                                            <div className="mt-1 space-y-0.5 text-[11px]">
                                                <p>Recipient: <strong>{verificationResult.holder}</strong></p>
                                                <p>Commendation: {verificationResult.title}</p>
                                                <p>Issued: {verificationResult.issueDate}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
