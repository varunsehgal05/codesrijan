import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import axios from "axios";
import { useAppStore } from "../lib/store";

export const Route = createFileRoute("/admin/users")({
    component: AdminUsers,
});

function AdminUsers() {
    const { users, teams } = useAppStore();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Form states
    const [formData, setFormData] = useState({ name: '', email: '', role: 'student', status: 'Active' });

    const API_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com/api';

    const displayUsers = users.map(u => {
        const userTeam = teams.find(t => t.id === u.teamId);
        return {
            id: u.id,
            name: (u.name) || ((u as any).firstName + ' ' + (u as any).lastName) || "Unknown User",
            email: u.email,
            team: userTeam ? userTeam.name : "Free Agent",
            role: (u.role || 'student').toLowerCase(),
            status: ((u as any).accountStatus === 'active' || u.role) ? 'Active' : 'Inactive',
        };
    });

    const handleForceAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            await axios.post(`${API_URL}/admin/users`, formData, { headers: { Authorization: `Bearer ${token}` } });
            alert("SUCCESS: Operative successfully injected into the matrix.");
            window.location.reload();
        } catch (e: any) {
            alert(`FAIL: ${e.response?.data?.message || e.message}`);
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
            alert(`SUCCESS: Modifications applied to ${editingUser.id}`);
            window.location.reload();
        } catch (e: any) {
            alert(`FAIL: ${e.response?.data?.message || e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (u: any) => {
        setEditingUser(u);
        setFormData({ name: u.name, email: u.email, role: u.role, status: u.status });
        setIsEditOpen(true);
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto relative">

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

            {/* Data Grid HUD */}
            <div className="bg-pure-white brutal-border brutal-shadow overflow-x-auto z-10 relative">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-stark-black text-pure-white">
                            <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">ID</th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">Hacker Name</th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">Squad</th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">Role Focus</th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-b-4 border-electric-blue">Status</th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-b-4 border-electric-blue border-l-2 bg-electric-blue text-pure-white text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayUsers.map((u, i) => (
                            <tr key={u.id || i} className="border-b-2 border-stark-black hover:bg-surface-container transition-colors group">
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
                                    <button onClick={() => openEditModal(u)} className="bg-stark-black text-[#FFD700] px-6 py-2 font-label-caps text-xs brutal-border hover:-translate-y-0.5 transition-all w-full flex items-center justify-center tracking-widest font-bold">
                                        EDIT
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
