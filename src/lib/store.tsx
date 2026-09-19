import React, { createContext, useContext, useState, useEffect } from "react";
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'https://codesrijan-api.onrender.com/api';
export const socket = io(API_URL.replace('/api', ''));

// Global API Interceptor for JWT Tokens
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem("codesrijan_auth_token");
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

export type Role = "student" | "admin" | "judge" | "mentor";

export interface User {
    id: string;
    name: string;
    email: string;
    password?: string; // Optional field for transport primarily
    role: Role;
    teamId?: string;
}

export interface Team {
    id: string;
    name: string;
    leaderId: string;
    problemId?: string;
    repositoryUrl?: string;
    demoUrl?: string;
    isSubmitted?: boolean;
    members: string[]; // array of user IDs
}

export interface Problem {
    id: string;
    title: string;
    category: string;
    difficulty: string;
    sponsor: string;
    description: string;
    prizePool: number;
}

export interface Hackathon {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    submissionDeadline: string;
    status: string;
}

export interface ChatMessage {
    id: string;
    teamId: string;
    authorId: string;
    authorName: string;
    content: string;
    timestamp: number;
}

interface StoreState {
    currentUser: User | null;
    users: User[];
    teams: Team[];
    problems: Problem[];
    hackathons: Hackathon[];
    chatMessages: ChatMessage[];
    isLoaded: boolean;
}

interface StoreContextType extends StoreState {
    login: (email: string, password?: string) => Promise<any>;
    register: (user: User) => Promise<any>;
    verifyEmail: (userId: string, code: string) => Promise<boolean>;
    logout: () => void;
    createTeam: (name: string, leaderId: string) => void;
    joinTeam: (teamId: string, userId: string) => void;
    assignProblem: (teamId: string, problemId: string) => void;
    submitProject: (teamId: string, repositoryUrl: string, demoUrl: string) => void;
    addChatMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
    refetchData: () => Promise<void>;
}

const AppStoreContext = createContext<StoreContextType | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<StoreState>({
        currentUser: null,
        users: [],
        teams: [],
        problems: [],
        hackathons: [],
        chatMessages: [],
        isLoaded: false
    });

    useEffect(() => {
        if (state.currentUser?.teamId) {
            socket.emit('join_team', state.currentUser.teamId);
        }

        const handleReceive = (msg: ChatMessage) => {
            setState(prev => {
                const isDuplicate = prev.chatMessages.some((m: ChatMessage) => m.id === msg.id);
                if (isDuplicate) return prev;
                return { ...prev, chatMessages: [...prev.chatMessages, msg] };
            });
        };

        socket.on('receive_message', handleReceive);

        return () => {
            socket.off('receive_message', handleReceive);
        };
    }, [state.currentUser?.teamId]);

    const refetchData = async () => {
        try {
            const [usersRes, teamsRes, problemsRes, hackathonsRes] = await Promise.all([
                axios.get(`${API_URL}/users`).catch(() => ({ data: [] })),
                axios.get(`${API_URL}/teams`).catch(() => ({ data: [] })),
                axios.get(`${API_URL}/problems`).catch(() => ({ data: [] })),
                axios.get(`${API_URL}/hackathons`).catch(() => ({ data: [] }))
            ]);

            setState(prev => ({
                ...prev,
                users: usersRes.data,
                teams: teamsRes.data,
                problems: problemsRes.data,
                hackathons: hackathonsRes.data,
                isLoaded: true
            }));
        } catch (e) {
            console.error("Failed to fetch from Node API", e);
            setState(prev => ({ ...prev, isLoaded: true }));
        }
    };

    // Initialize state mapping
    useEffect(() => {
        const storedToken = localStorage.getItem("codesrijan_auth_token");
        if (storedToken) {
            const loadWithToken = async () => {
                try {
                    const meRes = await axios.get(`${API_URL}/auth/me`, {
                        headers: { Authorization: `Bearer ${storedToken}` }
                    });

                    // We only load global data once the auth context is confirmed strictly via API
                    await refetchData();
                    setState(prev => ({ ...prev, currentUser: meRes.data.user }));
                } catch (e) {
                    console.error("Token invalid or expired. Purging local identity.");
                    console.error("Token invalid or expired. Purging local identity.");
                    localStorage.removeItem("codesrijan_auth_token");
                    refetchData();
                }
            };
            loadWithToken();
        } else {
            refetchData();
        }
    }, []);

    // Realtime Chat synchronization
    useEffect(() => {
        const handleReceiveMsg = (data: any) => {
            setState(prev => {
                // Prevent duplicate insertions
                if (prev.chatMessages.find(m => m.id === data.id)) return prev;
                return { ...prev, chatMessages: [...prev.chatMessages, data] };
            });
        };

        socket.on('receive_message', handleReceiveMsg);

        if (state.currentUser?.teamId) {
            socket.emit('join_team', state.currentUser.teamId);
        }

        return () => {
            socket.off('receive_message', handleReceiveMsg);
        };
    }, [state.currentUser?.teamId]);

    const login = async (email: string, password?: string) => {
        try {
            const res = await axios.post(`${API_URL}/auth/login`, { email, password });

            if (res.data.needsVerification) {
                throw new Error(JSON.stringify({ type: "verification_required", userId: res.data.userId }));
            }

            const { user: u, token } = res.data;
            setState(prev => ({ ...prev, currentUser: u }));
            localStorage.setItem("codesrijan_auth_token", token);
            socket.emit('authenticate', res.data.token);
            return u;
        } catch (e: any) {
            console.error("Login Error:", e);
            if (e.message && e.message.includes("verification_required")) throw e;
            throw new Error(e.response?.data?.message || "Authentication failed. Connection to server refused.");
        }
    };

    const register = async (user: User) => {
        try {
            const res = await axios.post(`${API_URL}/auth/register`, user);
            return res.data;
        } catch (e: any) {
            console.error("Register Error:", e);
            throw new Error(e.response?.data?.message || "Registration failed. Server unavailable.");
        }
    };

    const verifyEmail = async (userId: string, code: string) => {
        try {
            await axios.post(`${API_URL}/auth/verify-email`, { userId, code });
            return true;
        } catch (e: any) {
            throw new Error(e.response?.data?.message || "Verification failed");
        }
    };

    const logout = () => {
        setState(prev => ({ ...prev, currentUser: null }));
        localStorage.removeItem("codesrijan_auth_token");
    };

    const createTeam = async (name: string, leaderId: string) => {
        try {
            const payload = {
                name,
                leaderId,
                description: "",
                recruitmentOpen: true
            };
            await axios.post(`${API_URL}/teams`, payload);
            await refetchData();
            // Re-sync current user via the `/auth/me` pipeline
            const meRes = await axios.get(`${API_URL}/auth/me`);
            setState(prev => ({ ...prev, currentUser: meRes.data.user }));
        } catch (e: any) {
            console.error("Create Team Error:", e.response?.data || e);
        }
    };

    const sendInvite = async (teamId: string, receiverId: string) => {
        try {
            await axios.post(`${API_URL}/teams/${teamId}/invite`, { receiverId });
            // For now, silently succeed
        } catch (e) {
            console.error("Send Invite Error:", e);
        }
    };

    const joinTeam = async (inviteId: string) => {
        try {
            await axios.post(`${API_URL}/teams/accept-invite/${inviteId}`);
            await refetchData();
            const meRes = await axios.get(`${API_URL}/auth/me`);
            setState(prev => ({ ...prev, currentUser: meRes.data.user }));
        } catch (e: any) {
            console.error("Join Team Error:", e.response?.data || e);
        }
    };

    const assignProblem = async (teamId: string, problemId: string) => {
        try {
            await axios.post(`${API_URL}/teams/${teamId}/problem`, { problemId });
            await refetchData();
        } catch (e) {
            console.error("Assign Problem Error:", e);
        }
    };

    const submitProject = async (teamId: string, repositoryUrl: string, demoUrl: string) => {
        try {
            // Include placeholder description and title for now 
            await axios.post(`${API_URL}/submissions`, { teamId, repositoryUrl, demoUrl, description: "Final submission", projectTitle: "Hackathon Entry" });
            await refetchData();
        } catch (e) { console.error("Submit Project Error:", e); }
    };

    const addChatMessage = (msg: Omit<ChatMessage, "id" | "timestamp">) => {
        const newMsg = {
            ...msg,
            id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            timestamp: Date.now()
        };
        socket.emit('send_message', newMsg);
    };

    return (
        <AppStoreContext.Provider value={{
            ...state,
            login, register, verifyEmail, logout,
            createTeam, joinTeam, assignProblem, submitProject, addChatMessage,
            refetchData
        }}>
            {children}
        </AppStoreContext.Provider>
    );
}

export function useAppStore() {
    const ctx = useContext(AppStoreContext);
    if (!ctx) throw new Error("useAppStore must be within AppStoreProvider");
    return ctx;
}
