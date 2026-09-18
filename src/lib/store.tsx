import React, { createContext, useContext, useState, useEffect } from "react";
import axios from 'axios';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue, push, set } from 'firebase/database';

const API_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com/api';

// Optional Firebase Init
let db: any = null;
try {
    if (!getApps().length) {
        const firebaseConfig = {
            apiKey: import.meta.env['VITE_FIREBASE_API_KEY'] || "AIzaSyBjkd8HbYmXfBFmauP_eocJw3Bj0GALPiQ",
            authDomain: import.meta.env['VITE_FIREBASE_AUTH_DOMAIN'] || "arenax-chat-room.firebaseapp.com",
            databaseURL: import.meta.env['VITE_FIREBASE_DATABASE_URL'] || "https://arenax-chat-room.firebaseio.com",
            projectId: import.meta.env['VITE_FIREBASE_PROJECT_ID'] || "arenax-chat-room",
            storageBucket: import.meta.env['VITE_FIREBASE_STORAGE_BUCKET'] || "arenax-chat-room.firebasestorage.app",
            messagingSenderId: import.meta.env['VITE_FIREBASE_MESSAGING_SENDER_ID'] || "940787466445",
            appId: import.meta.env['VITE_FIREBASE_APP_ID'] || "1:940787466445:web:9faac285479f815081a984"
        };
        const app = initializeApp(firebaseConfig);
        db = getDatabase(app);
    }
} catch (e) {
    console.warn("Firebase not properly configured. Chat will be disabled.", e);
}

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
        chatMessages: [],
        isLoaded: false
    });

    const refetchData = async () => {
        try {
            const [usersRes, teamsRes, problemsRes] = await Promise.all([
                axios.get(`${API_URL}/users`).catch(() => ({ data: [] })),
                axios.get(`${API_URL}/teams`).catch(() => ({ data: [] })),
                axios.get(`${API_URL}/problems`).catch(() => ({ data: [] }))
            ]);

            setState(prev => ({
                ...prev,
                users: usersRes.data,
                teams: teamsRes.data,
                problems: problemsRes.data,
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
                    localStorage.removeItem("codesrijan_auth_token");
                    localStorage.removeItem("codesrijan_current_user_id");
                    refetchData();
                }
            };
            loadWithToken();
        } else {
            refetchData();
        }
    }, []);

    // Firebase Chat synchronization
    useEffect(() => {
        if (!db) return;

        // Setup listener for team active chats
        // For security across teams we would normally paginate or filter dynamically, 
        // but for Hackathon prototype we just read all or specific team.
        if (state.currentUser?.teamId) {
            const chatRef = ref(db, `chats/${state.currentUser.teamId}`);
            onValue(chatRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const parsedMessages = Object.keys(data).map(key => ({
                        id: key,
                        ...data[key]
                    }));
                    setState(prev => ({ ...prev, chatMessages: parsedMessages }));
                }
            });
        }
    }, [state.currentUser?.teamId]);

    const login = async (email: string, password?: string) => {
        try {
            const res = await axios.post(`${API_URL}/auth/login`, { email, password });

            if (res.data.needsVerification) {
                localStorage.setItem("codesrijan_pending_verification_id", res.data.userId);
                throw new Error("verification_required");
            }

            const { user: u, token } = res.data;
            setState(prev => ({ ...prev, currentUser: u }));
            localStorage.setItem("codesrijan_current_user_id", u.id);
            localStorage.setItem("codesrijan_auth_token", token);
            return u;
        } catch (e: any) {
            console.error("Login Error:", e);
            if (e.message === "verification_required") throw e;
            throw new Error(e.response?.data?.message || "Authentication failed. Connection to server refused.");
        }
    };

    const register = async (user: User) => {
        try {
            const res = await axios.post(`${API_URL}/auth/register`, user);
            localStorage.setItem("codesrijan_pending_verification_id", res.data.userId);
            return res.data;
        } catch (e: any) {
            console.error("Register Error:", e);
            throw new Error(e.response?.data?.message || "Registration failed. Server unavailable.");
        }
    };

    const verifyEmail = async (userId: string, code: string) => {
        try {
            await axios.post(`${API_URL}/auth/verify-email`, { userId, code });
            localStorage.removeItem("codesrijan_pending_verification_id");
            return true;
        } catch (e: any) {
            throw new Error(e.response?.data?.message || "Verification failed");
        }
    };

    const logout = () => {
        setState(prev => ({ ...prev, currentUser: null }));
        localStorage.removeItem("codesrijan_current_user_id");
        localStorage.removeItem("codesrijan_auth_token");
    };

    const createTeam = async (name: string, leaderId: string) => {
        try {
            const payload = {
                id: `t-${Date.now()}`,
                name,
                leaderId,
                members: [leaderId]
            };
            await axios.post(`${API_URL}/teams`, payload);
            await refetchData();
            // Re-sync current user
            setState(prev => {
                const u = prev.users.find(u => u.id === prev.currentUser?.id);
                return { ...prev, currentUser: u || null };
            });
        } catch (e) { console.error("Create Team Error:", e); }
    };

    const joinTeam = async (teamId: string, userId: string) => {
        try {
            await axios.post(`${API_URL}/teams/join`, { teamId, userId });
            await refetchData();
            // Re-sync current user
            setState(prev => {
                const u = prev.users.find(u => u.id === prev.currentUser?.id);
                return { ...prev, currentUser: u || null };
            });
        } catch (e) { console.error("Join Team Error:", e); }
    };

    const assignProblem = (teamId: string, problemId: string) => {
        // Needs a new node route: app.post('/api/teams/problem')
        // For simplicity we'll skip backend mutation in this stub and just update state locally
        setState(prev => ({
            ...prev,
            teams: prev.teams.map(t => t.id === teamId ? { ...t, problemId } : t)
        }));
    };

    const submitProject = async (teamId: string, repositoryUrl: string, demoUrl: string) => {
        try {
            await axios.post(`${API_URL}/teams/submit`, { teamId, repositoryUrl, demoUrl });
            await refetchData();
        } catch (e) { console.error("Submit Project Error:", e); }
    };

    const addChatMessage = (msg: Omit<ChatMessage, "id" | "timestamp">) => {
        if (!db) {
            console.warn("DB not connected. Cannot send Firebase message.");
            return;
        }
        const chatRef = ref(db, `chats/${msg.teamId}`);
        const newMsgRef = push(chatRef);
        set(newMsgRef, {
            ...msg,
            timestamp: Date.now()
        });
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
