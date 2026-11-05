import React, { createContext, useContext, useState, useEffect } from "react";
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api-6tfr.onrender.com/api');
export const socket = io(API_URL.replace('/api', ''), { autoConnect: false, auth: (cb) => cb({ token: typeof localStorage === 'undefined' ? null : localStorage.getItem('codesrijan_auth_token') }) });

// Global API Interceptor for JWT Tokens
axios.defaults.timeout = 15000; // 15s max timeout to prevent hanging connections
axios.interceptors.request.use((config) => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem("codesrijan_auth_token") : null;
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

const USER_CACHE_KEY = "codesrijan_user";
export const getCachedUser = (): User | null => {
    try {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(USER_CACHE_KEY) : null;
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
};
export const setCachedUser = (user: User | null) => {
    try {
        if (typeof localStorage === 'undefined') return;
        if (user) {
            localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(USER_CACHE_KEY);
        }
    } catch {}
};

const CACHE_KEY = "codesrijan_platform_cache_v2";

export const getCachedState = (): any => {
    try {
        if (typeof localStorage === 'undefined') return {};
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        if (Date.now() - (parsed._cachedAt || 0) < 1000 * 60 * 30) { // 30 min cache
            return parsed;
        }
    } catch {
        // Ignore cache read errors
    }
    return {};
};

export const persistCache = (data: any) => {
    try {
        if (typeof localStorage === 'undefined') return;
        const toSave = {
            users: data.users || [],
            teams: data.teams || [],
            problems: data.problems || [],
            hackathons: data.hackathons || [],
            _cachedAt: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(toSave));
    } catch {
        // Ignore storage quotas
    }
};

export type Role = "student" | "admin" | "judge" | "mentor";

export interface User {
    id: string;
    name: string;
    email: string;
    password?: string; // Optional field for transport primarily
    role: Role;
    teamId?: string;
    college?: string;
    branch?: string;
    year?: string;
    handle?: string;
    profileImage?: string;
    phone?: string;
    mobile?: string;
    github?: string;
    linkedin?: string;
    portfolio?: string;
    bio?: string;
    skills?: string[];
    techStack?: string[];
    assignedHackathons?: string[];
    assignedCategories?: string[];
    assignedTeams?: string[];
    accountStatus?: string;
    emailVerified?: boolean;
    _id?: string;
}

interface EmailVerificationResult {
    message: string;
    token: string;
    user: User;
}

export interface Team {
    id: string;
    name: string;
    leaderId: string;
    hackathonId?: string;
    problemId?: string;
    problemStatementId?: string;
    repositoryUrl?: string;
    demoUrl?: string;
    githubLink?: string;
    figmaLink?: string;
    demoLink?: string;
    isSubmitted?: boolean;
    members?: string[]; // Legacy compatibility 
    memberIds: string[]; // Native MongoDB property
    description?: string;
    status?: 'forming' | 'active' | 'verified' | 'submitted' | 'disqualified' | 'completed';
    maxMembers?: number;
    points?: number;
    bonusPoints?: number;
    penaltyPoints?: number;
    adminNote?: string;
    conversationId?: string;
    isTest?: boolean;
}

export function resolveUserTeam(teams: Team[] | undefined | null, currentUser: User | undefined | null): Team | undefined {
    if (!currentUser || !Array.isArray(teams)) return undefined;
    const uid = currentUser.id || currentUser._id;
    return teams.find(t => 
        Boolean(t) && (
            (currentUser.teamId && t.id === currentUser.teamId) || 
            (uid && t.leaderId === uid) || 
            (uid && (t as any)._id === currentUser.teamId) ||
            (Array.isArray(t.memberIds) && Boolean(uid) && t.memberIds.includes(uid!)) ||
            (Array.isArray(t.members) && Boolean(uid) && t.members.includes(uid!))
        )
    );
}

export interface Problem {
    id: string;
    title: string;
    slug?: string;
    category?: string;
    difficulty?: string;
    sponsor?: string;
    description: string;
    fullDescription?: string;
    domain?: string;
    hackathonId?: string;
    requirements?: string[];
    constraints?: string[];
    resources?: string[];
    prizePool?: number;
    pdfUrl?: string;
    isPublished?: boolean;
    isLocked?: boolean;
}

export interface Hackathon {
    id: string;
    name: string;
    title?: string;
    slug?: string;
    description: string;
    theme?: string;
    banner?: string;
    logo?: string;
    venue?: string;
    mode?: string;
    startDate: string;
    endDate: string;
    registrationStart?: string;
    registrationEnd?: string;
    submissionDeadline: string;
    evaluationDeadline?: string;
    resultDate?: string;
    status: string;
    entryType?: 'free' | 'paid';
    fee?: number;
    feeBasis?: string;
    currency?: string;
    upiId?: string;
    payeeName?: string;
    qrImageUrl?: string;
    paymentInstructions?: string;
    capacity?: number;
    teamSizeMin?: number;
    teamSizeMax?: number;
    problemRevealMode?: string;
    problemStatementsRevealed?: boolean;
    tagline?: string;
    isTest?: boolean;
    certificateTemplateUrl?: string;
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
    registrations: any[];
    tasks: any[];
    evaluations: any[];
    isLoaded: boolean;
}

interface StoreContextType extends StoreState {
    login: (email: string, password?: string) => Promise<any>;
    register: (user: User) => Promise<any>;
    verifyEmail: (userId: string, code: string) => Promise<EmailVerificationResult>;
    logout: () => void;
    createTeam: (name: string, leaderId: string, hackathonId: string, problemStatementId: string) => void;
    joinTeam: (teamId: string, userId: string) => void;
    assignProblem: (teamId: string, problemId: string) => void;
    submitProject: (teamId: string, repositoryUrl: string, demoUrl: string) => void;
    addChatMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
    refetchData: () => Promise<void>;
}

const AppStoreContext = createContext<StoreContextType | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<StoreState>(() => {
        return {
            currentUser: null,
            users: [],
            teams: [],
            problems: [],
            hackathons: [],
            chatMessages: [],
            registrations: [],
            tasks: [],
            evaluations: [],
            isLoaded: false
        };
    });

    useEffect(() => {
        const cachedUser = typeof window !== 'undefined' ? getCachedUser() : null;
        const rawToken = typeof localStorage !== 'undefined' ? localStorage.getItem("codesrijan_auth_token") : null;
        const storedToken = (rawToken && rawToken.trim() && rawToken !== 'null' && rawToken !== 'undefined') ? rawToken.trim() : null;
        const cachedPlatform = typeof window !== 'undefined' ? getCachedState() : {};

        setState(prev => ({
            ...prev,
            currentUser: storedToken ? cachedUser : null,
            users: Array.isArray(cachedPlatform.users) ? cachedPlatform.users : prev.users,
            teams: Array.isArray(cachedPlatform.teams) ? cachedPlatform.teams : prev.teams,
            problems: Array.isArray(cachedPlatform.problems) ? cachedPlatform.problems : prev.problems,
            hackathons: Array.isArray(cachedPlatform.hackathons) ? cachedPlatform.hackathons : prev.hackathons,
            isLoaded: storedToken ? !!cachedUser : true
        }));

        void refetchData();
    }, []);

    useEffect(() => {
        if (state.currentUser?.id) socket.connect();
        else socket.disconnect();
        return () => { socket.disconnect(); };
    }, [state.currentUser?.id]);

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

        const handleFriendUpdate = () => {
            void refetchData();
        };
        socket.on('user:friends_updated', handleFriendUpdate);
        socket.on('friend:update', handleFriendUpdate);
        socket.on('team:invite_received', handleFriendUpdate);
        socket.on('team:kicked', handleFriendUpdate);

        return () => {
            socket.off('receive_message', handleReceive);
            socket.off('user:friends_updated', handleFriendUpdate);
            socket.off('friend:update', handleFriendUpdate);
            socket.off('team:invite_received', handleFriendUpdate);
            socket.off('team:kicked', handleFriendUpdate);
        };
    }, [state.currentUser?.teamId]);

    const refetchData = async () => {
        try {
            const rawToken = typeof localStorage !== 'undefined' ? localStorage.getItem("codesrijan_auth_token") : null;
            const token = (rawToken && rawToken.trim() && rawToken !== 'null' && rawToken !== 'undefined') ? rawToken.trim() : null;
            const authHeader = token ? { headers: { Authorization: `Bearer ${token}` }, timeout: 6000 } : { timeout: 6000 };

            // Fire main core endpoints in parallel for maximum performance with auth token
            const [meRes, usersRes, teamsRes, problemsRes, hackathonsRes] = await Promise.allSettled([
                token ? axios.get(`${API_URL}/auth/me`, authHeader) : Promise.reject(new Error("No token")),
                axios.get(`${API_URL}/users`, authHeader),
                axios.get(`${API_URL}/teams`, authHeader),
                axios.get(`${API_URL}/problems`, authHeader),
                axios.get(`${API_URL}/hackathons`, authHeader)
            ]);

            let nextUser = null;
            if (meRes.status === 'fulfilled' && meRes.value.data?.user) {
                nextUser = meRes.value.data.user;
                setCachedUser(nextUser);
            } else if (meRes.status === 'rejected' && token) {
                const err = meRes.reason;
                if (err?.response?.status === 401 || err?.response?.status === 403) {
                    localStorage.removeItem("codesrijan_auth_token");
                    setCachedUser(null);
                }
            }

            const usersData = usersRes.status === 'fulfilled' ? usersRes.value.data : [];
            const teamsData = teamsRes.status === 'fulfilled' ? teamsRes.value.data : [];
            const problemsData = problemsRes.status === 'fulfilled' ? problemsRes.value.data : [];
            const hackathonsData = hackathonsRes.status === 'fulfilled' ? hackathonsRes.value.data : [];

            // Secondary role-specific parallel fetches
            const secondaryPromises: Promise<any>[] = [];
            
            // Team tasks
            if (nextUser?.teamId && token) {
                secondaryPromises.push(
                    axios.get(`${API_URL}/teams/${nextUser.teamId}/tasks`, authHeader).catch(() => ({ data: [] }))
                );
            } else {
                secondaryPromises.push(Promise.resolve({ data: [] }));
            }

            // Student registrations
            if (token && nextUser?.role === 'student') {
                secondaryPromises.push(
                    axios.get(`${API_URL}/student/registrations`, authHeader).catch(() => ({ data: [] }))
                );
            } else {
                secondaryPromises.push(Promise.resolve({ data: [] }));
            }

            // Admin evaluations
            if (token && nextUser?.role === 'admin') {
                secondaryPromises.push(
                    axios.get(`${API_URL}/evaluations`, authHeader).catch(() => ({ data: [] }))
                );
            } else {
                secondaryPromises.push(Promise.resolve({ data: [] }));
            }

            const [tasksRes, regRes, evalRes] = await Promise.all(secondaryPromises);

            persistCache({
                users: usersData.length ? usersData : undefined,
                teams: teamsData.length ? teamsData : undefined,
                problems: problemsData.length ? problemsData : undefined,
                hackathons: hackathonsData.length ? hackathonsData : undefined
            });

            const finalTeams = teamsData.length ? teamsData : prev.teams;
            let syncUser = nextUser ? nextUser : (token ? prev.currentUser : null);
            if (syncUser) {
                const resolvedTeam = resolveUserTeam(finalTeams, syncUser);
                if (resolvedTeam && (!syncUser.teamId || syncUser.teamId !== resolvedTeam.id)) {
                    syncUser = { ...syncUser, teamId: resolvedTeam.id };
                    setCachedUser(syncUser);
                }
            }

            setState(prev => ({
                ...prev,
                users: usersData.length ? usersData : prev.users,
                teams: finalTeams,
                problems: problemsData.length ? problemsData : prev.problems,
                hackathons: hackathonsData.length ? hackathonsData : prev.hackathons,
                registrations: regRes.data || prev.registrations,
                tasks: tasksRes.data || prev.tasks,
                evaluations: evalRes.data || prev.evaluations,
                currentUser: syncUser,
                isLoaded: true
            }));
        } catch (e) {
            console.warn("Failed to complete background sync from Node API", e);
            setState(prev => ({ ...prev, isLoaded: true }));
        }
    };

    // Initialize state mapping
    useEffect(() => {
        const rawToken = typeof localStorage !== 'undefined' ? localStorage.getItem("codesrijan_auth_token") : null;
        const storedToken = (rawToken && rawToken.trim() && rawToken !== 'null' && rawToken !== 'undefined') ? rawToken.trim() : null;

        // First instantly load from local cache if present
        const cached = getCachedState();
        if (cached.hackathons && cached.hackathons.length > 0) {
            setState(prev => ({
                ...prev,
                ...cached
            }));
        }

        if (storedToken) {
            const loadWithToken = async () => {
                try {
                    const meRes = await axios.get(`${API_URL}/auth/me`, {
                        headers: { Authorization: `Bearer ${storedToken}` },
                        timeout: 8000
                    });

                    const user = meRes.data.user;
                    setCachedUser(user);
                    // Set user & mark loaded immediately for instant UI render
                    setState(prev => ({ ...prev, currentUser: user, isLoaded: true }));
                    
                    // Fetch auxiliary collections asynchronously in background
                    void refetchData();
                } catch (e: any) {
                    if (e.response?.status === 401 || e.response?.status === 403) {
                        // Stale or expired token - purge quietly without alarming console error
                        localStorage.removeItem("codesrijan_auth_token");
                        setCachedUser(null);
                        setState(prev => ({ ...prev, currentUser: null, isLoaded: true }));
                    } else {
                        console.warn("Network error verifying session, server might be spinning up. Keeping token intact.");
                        // CRITICAL: Always mark loaded so UI unblocks and never freezes indefinitely
                        setState(prev => ({ ...prev, isLoaded: true }));
                    }
                    void refetchData();
                }
            };
            void loadWithToken();
        } else {
            // Fresh unauthenticated visitor - clear any malformed token and load public state
            localStorage.removeItem("codesrijan_auth_token");
            setCachedUser(null);
            setState(prev => ({ ...prev, currentUser: null, isLoaded: true }));
            void refetchData();
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
            // Attempt Firebase Auth sign-in if password provided
            if (password) {
                try {
                    const { getAuth, signInWithEmailAndPassword } = await import("firebase/auth");
                    const firebaseApp = (await import("./firebase")).default;
                    if (!firebaseApp) throw new Error('Firebase sign-in is not configured.');
                    const auth = getAuth(firebaseApp);
                    const userCredential = await signInWithEmailAndPassword(auth, email, password);
                    const idToken = await userCredential.user.getIdToken();
                    
                    localStorage.setItem("codesrijan_auth_token", idToken);
                    const meRes = await axios.get(`${API_URL}/auth/me`, {
                        headers: { Authorization: `Bearer ${idToken}` },
                        timeout: 8000
                    });

                    const u = meRes.data.user;
                    setCachedUser(u);
                    setState(prev => ({ ...prev, currentUser: u }));
                    socket.disconnect().connect();
                    return u;
                } catch (fbErr: any) {
                    console.warn("Firebase Client Auth bypass/fallback to Express API:", fbErr.message);
                }
            }

            const res = await axios.post(`${API_URL}/auth/login`, { email, password });

            if (res.data.needsVerification) {
                throw new Error(JSON.stringify({ type: "verification_required", userId: res.data.userId }));
            }

            const { user: u, token } = res.data;
            setCachedUser(u);
            setState(prev => ({ ...prev, currentUser: u }));
            localStorage.setItem("codesrijan_auth_token", token);
            socket.disconnect().connect();
            return u;
        } catch (e: any) {
            console.error("Login failed", e.response?.status || "network error");
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
            const res = await axios.post<EmailVerificationResult>(`${API_URL}/auth/verify-email`, { userId, code });
            const { user: u, token } = res.data;
            if (u && token) {
                setCachedUser(u);
                setState(prev => ({ ...prev, currentUser: u }));
                localStorage.setItem("codesrijan_auth_token", token);
                socket.disconnect().connect();
            }
            return res.data;
        } catch (e: any) {
            throw new Error(e.response?.data?.message || "Verification failed");
        }
    };

    const logout = () => {
        try {
            socket.disconnect();
        } catch {}
        setCachedUser(null);
        setState(prev => ({ ...prev, currentUser: null }));
        try {
            localStorage.removeItem("codesrijan_auth_token");
            localStorage.removeItem("codesrijan_user");
            localStorage.removeItem("codesrijan_cached_user");
            sessionStorage.clear();
        } catch {}
        if (typeof window !== 'undefined') {
            window.location.replace('/login');
        }
    };

    const createTeam = async (name: string, leaderId: string, hackathonId: string, problemStatementId: string) => {
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            const payload = {
                name,
                leaderId,
                hackathonId,
                problemStatementId,
                description: "",
                recruitmentOpen: true
            };
            await axios.post(`${API_URL}/teams`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await refetchData();
        } catch (e: any) {
            console.error("Create Team Error:", e.response?.data || e);
            throw e;
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
            const rawToken = typeof localStorage !== 'undefined' ? localStorage.getItem("codesrijan_auth_token") : null;
            const token = rawToken?.trim();
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            await axios.post(`${API_URL}/teams/${teamId}/problem`, { problemId }, { headers });
            setState(prev => ({
                ...prev,
                teams: prev.teams.map(t => t.id === teamId ? { ...t, problemId, problemStatementId: problemId } : t)
            }));
            await refetchData();
        } catch (e: any) {
            console.error("Assign Problem Error:", e);
            throw e;
        }
    };

    const submitProject = async (teamId: string, repositoryUrl: string, demoUrl: string) => {
        try {
            const rawToken = typeof localStorage !== 'undefined' ? localStorage.getItem("codesrijan_auth_token") : null;
            const token = rawToken?.trim();
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            // Include placeholder description and title for now 
            await axios.post(`${API_URL}/submissions`, { teamId, repositoryUrl, demoUrl, description: "Final submission", projectTitle: "Hackathon Entry" }, { headers });
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

export const useStore = useAppStore;

