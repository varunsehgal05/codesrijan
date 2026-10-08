import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import axios from "axios";
import { useAppStore } from "../lib/store";
import { toast } from "react-hot-toast";

export const Route = createFileRoute("/admin/users")({
    component: AdminUsers,
});

function AdminUsers() {
    const { users, teams } = useAppStore();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [infoUser, setInfoUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Filters and Tabs
    const [activeTab, setActiveTab] = useState<'Active' | 'Suspended'>('Active');
    const [searchQuery, setSearchQuery] = useState("");
    const [filterRole, setFilterRole] = useState("all");

    // Multi-Selection and Bulk Deletion State
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

    // Form states
    const [formData, setFormData] = useState({ name: '', email: '', role: 'student', status: 'Active' });

    const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api.onrender.com/api');

    const displayUsers = useMemo(() => {
        return users.map(u => {
            const userTeam = teams.find(t => t.id === u.teamId);
            const status = ((u as any).accountStatus === 'suspended' || (u as any).status === 'Suspended') ? 'Suspended' : 'Active';
            return {
                id: u.id,
                name: (u.name) || ((u as any).firstName + ' ' + (u as any).lastName) || "Unknown User",
                email: u.email,
                phone: (u as any).phone || (u as any).phoneNumber || (u as any).mobile || "Not provided",
                college: (u as any).college || "Not specified",
                branch: (u as any).branch || "N/A",
                year: (u as any).year || "N/A",
                emailVerified: (u as any).emailVerified !== undefined ? (u as any).emailVerified : true,
                createdAt: (u as any).createdAt || (u as any).joinedAt || "N/A",
                team: userTeam ? userTeam.name : "Free Agent",
                role: (u.role || 'student').toLowerCase(),
                status: status,
                raw: u
            };
        });
    }, [users, teams]);

    const filteredUsers = useMemo(() => {
        return displayUsers.filter(u => {
            if (activeTab === 'Active' && u.status === 'Suspended') return false;
            if (activeTab === 'Suspended' && u.status !== 'Suspended') return false;
            if (filterRole !== 'all' && u.role !== filterRole) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return u.name.toLowerCase().includes(q) || (u.email && u.email.toLowerCase().includes(q)) || u.id.toLowerCase().includes(q);
            }
            return true;
        });
    }, [displayUsers, activeTab, filterRole, searchQuery]);

    const handleForceAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            await axios.post(`${API_URL}/admin/users`, formData, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("SUCCESS: Operative successfully injected into the matrix.");
            window.location.reload();
        } catch (e: any) {
            toast.error(`FAIL: ${e.response?.data?.message || e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            await axios.put(`${API_URL}/admin/users/${editingUser.id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
            toast.success(`SUCCESS: Modifications applied to ${editingUser.id}`);
            window.location.reload();
        } catch (e: any) {
            toast.error(`FAIL: ${e.response?.data?.message || e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (u: any) => {
        setEditingUser(u);
        setFormData({ name: u.name, email: u.email, role: u.role, status: u.status });
        setIsEditOpen(true);
    };

    const handleDeleteUser = async (user: any) => {
        const confirmDelete = window.confirm(`PERMANENT PURGE WARNING:\n\nAre you sure you want to permanently delete user "${user.name}" (${user.email})?\n\nThis will remove their identity permanently from the database and Firebase.`);
        if (!confirmDelete) return;

        setLoading(true);
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            await axios.delete(`${API_URL}/admin/users/${user.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`SUCCESS: Account ${user.email} permanently purged from database.`);
            window.location.reload();
        } catch (e: any) {
            toast.error(`FAIL to delete account: ${e.response?.data?.message || e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelectUser = (id: string) => {
        setSelectedUserIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        const visibleIds = filteredUsers.map(u => u.id);
        const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedUserIds.includes(id));
        if (allSelected) {
            setSelectedUserIds(prev => prev.filter(id => !visibleIds.includes(id)));
        } else {
            setSelectedUserIds(prev => Array.from(new Set([...prev, ...visibleIds])));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedUserIds.length === 0) return;
        const confirmBulk = window.confirm(`PERMANENT BULK DELETE WARNING:\n\nAre you sure you want to permanently delete ${selectedUserIds.length} selected participant(s)?\n\nThis action will remove all selected identities permanently from the database and Firebase.`);
        if (!confirmBulk) return;

        setLoading(true);
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            await Promise.all(
                selectedUserIds.map(id => 
                    axios.delete(`${API_URL}/admin/users/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                )
            );
            toast.success(`SUCCESS: ${selectedUserIds.length} participant account(s) permanently purged.`);
            setSelectedUserIds([]);
            window.location.reload();
        } catch (e: any) {
            toast(`Bulk deletion process completed with warnings: ${e.message}`);
            window.location.reload();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto relative pb-20">

            {/* INJECTION MODAL (FORCE ADD) */}
            {isAddOpen && (
                <div className="fixed inset-0 bg-stark-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <form onSubmit={handleForceAdd} className="bg-pure-white w-full max-w-lg brutal-border brutal-shadow-lg p-8 flex flex-col gap-6">
                        <div className="flex justify-between items-center border-b-4 border-stark-black pb-4">
                            <h3 className="font-display-lg text-2xl uppercase bg-electric-blue text-pure-white px-2 py-1 transform -skew-x-6 inline-block">Force Inject Node</h3>
                            <button type="button" onClick={() => setIsAddOpen(false)} className="text-3xl hover:text-error hover:rotate-90 transition-all font-bold">&times;</button>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold uppercase">Operative Name</label>
                            <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="brutal-border p-3 bg-surface-container font-code-snippet focus:outline-none focus:ring-2 focus:ring-electric-blue" placeholder="John Matrix" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold uppercase">Email Address (Unique Vector)</label>
                            <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="brutal-border p-3 bg-surface-container font-code-snippet focus:outline-none focus:ring-2 focus:ring-electric-blue" placeholder="john.matrix@codesrijan.io" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold uppercase">Clearance Role</label>
                            <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="brutal-border p-3 bg-surface-container font-code-snippet">
                                <option value="student">STUDENT (Hacker)</option>
                                <option value="judge">JUDGE (Evaluator)</option>
                                <option value="mentor">MENTOR (Guide)</option>
                                <option value="admin">ADMIN (Root)</option>
                            </select>
                        </div>
                        <button disabled={loading} type="submit" className="bg-stark-black text-pure-white font-label-bold uppercase px-6 py-4 mt-2 brutal-shadow-hover hover:bg-electric-blue transition-all disabled:opacity-50">
                            {loading ? "Injecting..." : "Execute Force Add"}
                        </button>
                    </form>
                </div>
            )}

            {/* EDIT MODAL */}
            {isEditOpen && editingUser && (
                <div className="fixed inset-0 bg-stark-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <form onSubmit={handleEditSubmit} className="bg-pure-white w-full max-w-lg brutal-border brutal-shadow-lg p-8 flex flex-col gap-6">
                        <div className="flex justify-between items-center border-b-4 border-stark-black pb-4">
                            <h3 className="font-display-lg text-2xl uppercase bg-[#FFD700] text-stark-black px-2 py-1 transform -skew-x-6 inline-block">Modify Node</h3>
                            <button type="button" onClick={() => setIsEditOpen(false)} className="text-3xl hover:text-error hover:rotate-90 transition-all font-bold">&times;</button>
                        </div>
                        <div className="bg-surface-container-high px-4 py-2 brutal-border-sm font-code-snippet text-xs truncate">
                            TARGET: {editingUser.id}
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold uppercase">Update Identity Name</label>
                            <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="brutal-border p-3 bg-surface-container font-code-snippet focus:outline-none focus:ring-2 focus:ring-electric-blue" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold uppercase">Update Clearance Rank</label>
                            <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="brutal-border p-3 bg-surface-container font-code-snippet">
                                <option value="student">STUDENT</option>
                                <option value="judge">JUDGE</option>
                                <option value="mentor">MENTOR</option>
                                <option value="admin">ADMIN</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold uppercase">Modify Node Status</label>
                            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="brutal-border p-3 bg-surface-container font-code-snippet">
                                <option value="Active">ACTIVE</option>
                                <option value="Suspended">SUSPENDED</option>
                            </select>
                        </div>
                        <button disabled={loading} type="submit" className="bg-[#FFD700] text-stark-black font-label-bold uppercase px-6 py-4 mt-2 brutal-border brutal-shadow-hover transition-all disabled:opacity-50 hover:bg-success hover:text-white">
                            {loading ? "Applying Specs..." : "Lock In Modifications"}
                        </button>
                    </form>
                </div>
            )}

            {/* FULL USER INFO MODAL */}
            {isInfoOpen && infoUser && (
                <div className="fixed inset-0 bg-stark-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-pure-white w-full max-w-xl brutal-border brutal-shadow-lg p-8 flex flex-col gap-6 relative max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b-4 border-stark-black pb-4">
                            <div>
                                <span className="font-code-snippet text-xs text-electric-blue font-bold uppercase block">OPERATIVE SPECIFICATION</span>
                                <h3 className="font-display-lg text-2xl uppercase bg-electric-blue text-pure-white px-2 py-0.5 inline-block transform -skew-x-6">
                                    {infoUser.name}
                                </h3>
                            </div>
                            <button type="button" onClick={() => setIsInfoOpen(false)} className="text-3xl hover:text-error hover:rotate-90 transition-all font-bold">&times;</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-code-snippet text-sm">
                            <div className="bg-surface-container p-4 brutal-border flex flex-col gap-1">
                                <span className="text-xs text-on-surface-variant font-bold uppercase">Operative ID</span>
                                <span className="font-bold text-stark-black break-all">{infoUser.id}</span>
                            </div>
                            <div className="bg-surface-container p-4 brutal-border flex flex-col gap-1">
                                <span className="text-xs text-on-surface-variant font-bold uppercase">Clearance Role</span>
                                <span className="font-bold uppercase text-electric-blue">{infoUser.role}</span>
                            </div>
                            <div className="bg-surface-container p-4 brutal-border flex flex-col gap-1 col-span-1 md:col-span-2">
                                <span className="text-xs text-on-surface-variant font-bold uppercase">Email Address</span>
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-stark-black break-all">{infoUser.email}</span>
                                    <button onClick={() => { navigator.clipboard.writeText(infoUser.email); toast("Email copied!"); }} className="text-xs bg-stark-black text-pure-white px-2 py-1 brutal-border">COPY</button>
                                </div>
                            </div>
                            <div className="bg-surface-container p-4 brutal-border flex flex-col gap-1 col-span-1 md:col-span-2">
                                <span className="text-xs text-on-surface-variant font-bold uppercase">Phone / Contact Number</span>
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-stark-black">{infoUser.phone}</span>
                                    {infoUser.phone !== 'Not provided' && (
                                        <button onClick={() => { navigator.clipboard.writeText(infoUser.phone); toast("Phone copied!"); }} className="text-xs bg-stark-black text-pure-white px-2 py-1 brutal-border">COPY</button>
                                    )}
                                </div>
                            </div>
                            <div className="bg-surface-container p-4 brutal-border flex flex-col gap-1 col-span-1 md:col-span-2">
                                <span className="text-xs text-on-surface-variant font-bold uppercase">College / Institution</span>
                                <span className="font-bold text-stark-black">{infoUser.college}</span>
                            </div>
                            <div className="bg-surface-container p-4 brutal-border flex flex-col gap-1">
                                <span className="text-xs text-on-surface-variant font-bold uppercase">Branch</span>
                                <span className="font-bold text-stark-black">{infoUser.branch}</span>
                            </div>
                            <div className="bg-surface-container p-4 brutal-border flex flex-col gap-1">
                                <span className="text-xs text-on-surface-variant font-bold uppercase">Academic Year</span>
                                <span className="font-bold text-stark-black">{infoUser.year}</span>
                            </div>
                            <div className="bg-surface-container p-4 brutal-border flex flex-col gap-1">
                                <span className="text-xs text-on-surface-variant font-bold uppercase">Assigned Squad</span>
                                <span className="font-bold text-electric-blue">{infoUser.team}</span>
                            </div>
                            <div className="bg-surface-container p-4 brutal-border flex flex-col gap-1">
                                <span className="text-xs text-on-surface-variant font-bold uppercase">Account Status</span>
                                <span className={`font-bold uppercase ${infoUser.status === 'Active' ? 'text-success' : 'text-error'}`}>{infoUser.status}</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t-2 border-stark-black">
                            <button onClick={() => { setIsInfoOpen(false); openEditModal(infoUser); }} className="bg-[#FFD700] text-stark-black font-label-bold uppercase px-4 py-2 brutal-border brutal-shadow-hover text-xs">
                                Edit Operative
                            </button>
                            <button type="button" onClick={() => setIsInfoOpen(false)} className="bg-stark-black text-pure-white font-label-bold uppercase px-6 py-2 brutal-border text-xs">
                                Close Panel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Panel */}
            <div className="bg-pure-white p-6 brutal-border brutal-shadow flex justify-between items-center z-10 relative">
                <div>
                    <h2 className="font-display-lg text-headline-xl uppercase text-stark-black tracking-tight leading-none bg-electric-blue text-pure-white px-2 py-1 inline-block transform -skew-x-6">
                        USERS & SQUADS
                    </h2>
                    <p className="font-body-md text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">
                        Directory and Recruitment Status
                    </p>
                </div>
                <button onClick={() => { setFormData({ name: '', email: '', role: 'student', status: 'Active' }); setIsAddOpen(true); }} className="bg-electric-blue text-pure-white px-6 py-3 font-label-bold uppercase brutal-border brutal-shadow-hover transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined">person_add</span>
                    Force Add User
                </button>
            </div>

            {/* Controls Bar */}
            <div className="bg-pure-white p-4 brutal-border flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex gap-2 w-full md:w-auto items-center">
                    <button 
                        onClick={() => setActiveTab('Active')} 
                        className={`px-6 py-2 font-label-bold uppercase brutal-border transition-all ${activeTab === 'Active' ? 'bg-stark-black text-pure-white brutal-shadow' : 'bg-surface hover:bg-surface-container'}`}
                    >
                        Active Users
                    </button>
                    <button 
                        onClick={() => setActiveTab('Suspended')} 
                        className={`px-6 py-2 font-label-bold uppercase brutal-border transition-all ${activeTab === 'Suspended' ? 'bg-error text-pure-white brutal-shadow' : 'bg-surface hover:bg-surface-container'}`}
                    >
                        Suspended Users
                    </button>
                    {selectedUserIds.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="bg-error text-pure-white px-4 py-2 font-label-bold uppercase brutal-border brutal-shadow hover:bg-stark-black transition-all flex items-center gap-2 animate-bounce"
                        >
                            <span className="material-symbols-outlined text-sm">delete_forever</span>
                            Purge Selected ({selectedUserIds.length})
                        </button>
                    )}
                </div>
                
                <div className="flex gap-4 w-full md:w-auto items-center">
                    <select 
                        value={filterRole} 
                        onChange={(e) => setFilterRole(e.target.value)} 
                        className="p-2 border-2 border-stark-black font-code-snippet focus:outline-none"
                    >
                        <option value="all">All Roles</option>
                        <option value="student">Student</option>
                        <option value="judge">Judge</option>
                        <option value="mentor">Mentor</option>
                        <option value="admin">Admin</option>
                    </select>
                    
                    <div className="flex items-center border-2 border-stark-black p-2 bg-surface">
                        <span className="material-symbols-outlined mr-2">search</span>
                        <input 
                            type="text" 
                            placeholder="Search name, email, ID..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent focus:outline-none font-code-snippet w-64"
                        />
                    </div>
                </div>
            </div>

            {/* Data Grid HUD */}
            <div className="bg-pure-white brutal-border brutal-shadow overflow-x-auto z-10 relative">
                <table className="w-full text-left border-collapse min-w-[850px]">
                    <thead>
                        <tr className="bg-stark-black text-pure-white">
                            <th className="p-4 border-r-2 border-electric-blue border-b-4 text-center w-12">
                                <input 
                                    type="checkbox" 
                                    onChange={handleSelectAll} 
                                    checked={filteredUsers.length > 0 && filteredUsers.every(u => selectedUserIds.includes(u.id))}
                                    className="w-4 h-4 accent-electric-blue cursor-pointer"
                                    title="Select All Visible Participants"
                                />
                            </th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">ID</th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">Hacker Name</th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">Squad</th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">Role Focus</th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-b-4 border-electric-blue">Status</th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-b-4 border-electric-blue border-l-2 bg-electric-blue text-pure-white text-center min-w-[180px]">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center font-code-snippet text-on-surface-variant uppercase">
                                    No users found matching current filters.
                                </td>
                            </tr>
                        ) : filteredUsers.map((u, i) => (
                            <tr key={u.id || i} className={`border-b-2 border-stark-black hover:bg-surface-container transition-colors group ${selectedUserIds.includes(u.id) ? 'bg-electric-blue/10' : ''}`}>
                                <td className="p-4 border-r-2 border-stark-black text-center">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedUserIds.includes(u.id)}
                                        onChange={() => toggleSelectUser(u.id)}
                                        className="w-4 h-4 accent-electric-blue cursor-pointer"
                                    />
                                </td>
                                <td className="p-4 font-code-snippet text-sm border-r-2 border-stark-black truncate max-w-[120px]">{u.id}</td>
                                <td className="p-4 font-label-bold text-stark-black border-r-2 border-stark-black truncate">{u.name}</td>
                                <td className="p-4 font-body-md border-r-2 border-stark-black truncate">{u.team}</td>
                                <td className="p-4 border-r-2 border-stark-black">
                                    <span className="inline-block px-2 py-1 bg-surface-container-high text-stark-black font-code-snippet uppercase text-[10px] tracking-wider font-bold brutal-border">
                                        {u.role}
                                    </span>
                                </td>
                                <td className="p-4 border-r-2 border-stark-black">
                                    <span className={`inline-flex items-center gap-2 px-2 py-1 font-label-bold text-xs brutal-border uppercase ${u.status === 'Active' ? 'bg-electric-blue text-pure-white' :
                                        u.status === 'Looking for Team' ? 'bg-[#FFD700] text-stark-black' :
                                            'bg-error text-pure-white'
                                        }`}>
                                        <span className="w-2 h-2 rounded-full bg-current block"></span>
                                        {u.status}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex gap-1.5 justify-center flex-wrap">
                                        <button onClick={() => { setInfoUser(u); setIsInfoOpen(true); }} className="bg-electric-blue text-pure-white px-2.5 py-1.5 font-label-caps text-xs brutal-border hover:-translate-y-0.5 transition-all flex items-center gap-1 tracking-widest font-bold">
                                            <span className="material-symbols-outlined text-[14px]">info</span> INFO
                                        </button>
                                        <button onClick={() => openEditModal(u)} className="bg-stark-black text-[#FFD700] px-2.5 py-1.5 font-label-caps text-xs brutal-border hover:-translate-y-0.5 transition-all flex items-center gap-1 tracking-widest font-bold">
                                            <span className="material-symbols-outlined text-[14px]">edit</span> EDIT
                                        </button>
                                        <button onClick={() => handleDeleteUser(u)} className="bg-error text-pure-white px-2.5 py-1.5 font-label-caps text-xs brutal-border hover:-translate-y-0.5 transition-all flex items-center gap-1 tracking-widest font-bold hover:bg-stark-black">
                                            <span className="material-symbols-outlined text-[14px]">delete</span> DELETE
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
