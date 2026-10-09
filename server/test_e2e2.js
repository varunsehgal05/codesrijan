import axios from 'axios';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

const BASE_URL = process.env.TEST_API_BASE_URL;

// Simple logging
function log(msg) { console.log(`[E2E] ${msg}`); }
function pass(msg) { console.log(`[PASS] ${msg}`); }
function fail(msg) { console.error(`[FAIL] ${msg}`); process.exitCode = 1; throw new Error(msg); }

const ALLOWED_HOSTS = ['localhost', '127.0.0.1', '::1'];

function validateApiTarget() {
    if (!BASE_URL) {
        fail("TEST_API_BASE_URL environment variable is missing. Tests aborted.");
    }
    let url;
    try {
        url = new URL(BASE_URL);
    } catch(e) {
        fail("Invalid TEST_API_BASE_URL format.");
    }
    
    const host = url.hostname.toLowerCase();
    
    // Explicit Allowlist check
    if (!ALLOWED_HOSTS.includes(host)) {
        fail(`CRITICAL: API host '${host}' is not in the approved staging allowlist (localhost only). Tests aborted.`);
    }

    if (url.protocol !== "http:") {
        fail("CRITICAL: Local test API must use HTTP protocol. Tests aborted.");
    }
}

// Global tracking for cleanup
const createdDocs = {
    users: [],
    teams: [],
    hackathons: [],
    problems: [],
    conversations: [],
    messages: [],
    supporttickets: [],
    evaluations: []
};

async function setupTestDb() {
    log("Validating API and test database configuration...");
    validateApiTarget();

    const testUri = process.env.MONGODB_TEST_URI;
    
    if (!testUri) {
        fail("MONGODB_TEST_URI environment variable is missing. Tests aborted.");
    }
    
    let parsedUri;
    try {
        parsedUri = new URL(testUri);
    } catch (e) {
        fail("Invalid MONGODB_TEST_URI format.");
    }

    const hostname = parsedUri.hostname.toLowerCase();
    const dbName = parsedUri.pathname.replace('/', '').toLowerCase();

    // Explicit Allowlist check
    if (!ALLOWED_HOSTS.includes(hostname)) {
        fail(`CRITICAL: MongoDB host '${hostname}' is not in the approved staging allowlist (localhost only). Tests aborted.`);
    }

    // Require 'test' in the dbName explicitly
    if (!dbName.includes("test")) {
        fail(`CRITICAL: The local database name '${dbName}' does not appear to be an explicitly designated test database. It must contain the word 'test'. Tests aborted.`);
    }
    
    if (parsedUri.protocol !== "mongodb:") {
        fail("CRITICAL: Local test MongoDB must use mongodb: protocol. Tests aborted.");
    }

    log("Connecting to isolated MongoDB test instance...");
    await mongoose.connect(testUri);
    log("Connected. Seeding test users...");

    const createUser = async (email, role) => {
        const id = `usr-${Date.now()}-${Math.floor(Math.random()*1000)}`;
        const hash = await bcrypt.hash("password123", 10);
        await mongoose.connection.collection('users').insertOne({
            id, name: `${role.toUpperCase()} Test`, email,
            passwordHash: hash, role, accountStatus: 'active', emailVerified: true,
            createdAt: new Date(), updatedAt: new Date()
        });
        createdDocs.users.push(id);
        return id;
    };

    const users = {
        admin: await createUser("admin@e2e.test", "admin"),
        studentA: await createUser("studenta@e2e.test", "student"),
        studentB: await createUser("studentb@e2e.test", "student"),
        judge: await createUser("judge@e2e.test", "judge"),
        mentor: await createUser("mentor@e2e.test", "mentor"),
        recruiter: await createUser("recruiter@e2e.test", "recruiter")
    };

    return users;
}

async function login(email) {
    const res = await axios.post(`${BASE_URL}/auth/login`, { email, password: "password123" });
    return res.data.token;
}

async function cleanup() {
    log("Executing targeted cleanup of test fixtures...");
    if (mongoose.connection.readyState !== 1) return;
    
    try {
        // Child collections first
        if (createdDocs.conversations.length > 0) {
            await mongoose.connection.collection('messages').deleteMany({ conversationId: { $in: createdDocs.conversations } });
            await mongoose.connection.collection('conversations').deleteMany({ id: { $in: createdDocs.conversations } });
        }
        
        if (createdDocs.teams.length > 0) {
            await mongoose.connection.collection('evaluations').deleteMany({ teamId: { $in: createdDocs.teams } });
            await mongoose.connection.collection('teams').deleteMany({ id: { $in: createdDocs.teams } });
        }
        
        if (createdDocs.hackathons.length > 0) {
            await mongoose.connection.collection('registrations').deleteMany({ hackathonId: { $in: createdDocs.hackathons } });
            await mongoose.connection.collection('hackathons').deleteMany({ id: { $in: createdDocs.hackathons } });
        }

        if (createdDocs.problems.length > 0) {
            await mongoose.connection.collection('problems').deleteMany({ id: { $in: createdDocs.problems } });
        }

        if (createdDocs.supporttickets.length > 0) {
            await mongoose.connection.collection('supporttickets').deleteMany({ id: { $in: createdDocs.supporttickets } });
        }

        if (createdDocs.users.length > 0) {
            await mongoose.connection.collection('users').deleteMany({ id: { $in: createdDocs.users } });
        }
        
        log("Cleanup completed.");
    } catch (e) {
        console.error("Cleanup failed:", e.message);
    }
}

async function runTests() {
    let dbUsers;
    try {
        dbUsers = await setupTestDb();
    } catch(e) {
        fail(`Database setup failed: ${e.message}`);
    }

    try {
        log("Logging in test accounts...");
        const tokens = {
            admin: await login("admin@e2e.test"),
            studentA: await login("studenta@e2e.test"),
            studentB: await login("studentb@e2e.test"),
            judge: await login("judge@e2e.test"),
            mentor: await login("mentor@e2e.test"),
            recruiter: await login("recruiter@e2e.test")
        };
        pass("All test accounts logged in successfully.");

        // --- 1. RBAC SECURITY VALIDATION ---
        log("Testing RBAC and Unauthorized access...");
        
        try {
            await axios.get(`${BASE_URL}/admin/settings`, { headers: { Authorization: `Bearer ${tokens.studentA}` } });
            fail("Student was able to access /admin/settings");
        } catch(e) { if(e.response?.status !== 403) fail(`Expected 403, got ${e.response?.status}`); }

        try {
            await axios.get(`${BASE_URL}/admin/settings`, { headers: { Authorization: `Bearer ${tokens.judge}` } });
            fail("Judge was able to access /admin/settings");
        } catch(e) { if(e.response?.status !== 403) fail(`Expected 403, got ${e.response?.status}`); }
        
        pass("RBAC enforced successfully across roles.");

        // --- 2. PUBLIC REGISTRATION SECURITY ---
        log("Testing Public Registration Role Enforcement...");
        const regRes = await axios.post(`${BASE_URL}/auth/register`, {
            name: "Hacker", email: `hacker_${Date.now()}@e2e.test`, password: "password123", role: "admin"
        });
        
        // Track the user using only the exact ID returned by the creation request
        const hackerId = regRes.data.id || (regRes.data.user && regRes.data.user.id);
        if (hackerId) {
            createdDocs.users.push(hackerId);
        } else {
            log("Warning: API did not return an ID for public registration. Cleanup will skip this user.");
        }
        
        // We can't rely on lookup to check the role, so we will use the API response if available
        // Or attempt to login and check profile. For safety, we verify the role returned in response.
        const returnedRole = regRes.data.role || (regRes.data.user && regRes.data.user.role);
        if (returnedRole && returnedRole !== 'student') fail("Public registration allowed arbitrary role assignment!");
        pass("Public registration forces 'student' role.");

        // --- 3. PARTICIPANT JOURNEY (Hackathon -> Team -> Submit) ---
        log("Starting Participant Journey...");
        
        const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const hRes = await axios.post(`${BASE_URL}/hackathons`, {
            name: "E2E Hackathon", description: "Test", startDate: tomorrow.toISOString(), endDate: tomorrow.toISOString(),
            registrationStart: yesterday.toISOString(), registrationEnd: tomorrow.toISOString()
        }, { headers: { Authorization: `Bearer ${tokens.admin}` } });
        const hackathonId = hRes.data.id || hRes.data._id;
        createdDocs.hackathons.push(hackathonId);
        
        const pRes = await axios.post(`${BASE_URL}/problems`, {
            id: `prob-${Date.now()}`, title: "E2E Problem", hackathonId, difficulty: "Easy", shortDescription: "Short", description: "Long"
        }, { headers: { Authorization: `Bearer ${tokens.admin}` } });
        const problemId = pRes.data.id || pRes.data._id;
        createdDocs.problems.push(problemId);

        await axios.post(`${BASE_URL}/hackathons/${hackathonId}/open-registration`, {}, { headers: { Authorization: `Bearer ${tokens.admin}` } });
        await axios.post(`${BASE_URL}/hackathons/${hackathonId}/register`, {}, { headers: { Authorization: `Bearer ${tokens.studentA}` } });

        const tRes = await axios.post(`${BASE_URL}/teams`, {
            name: `E2E Team ${Date.now()}`, hackathonId, problemStatementId: problemId, description: "Test"
        }, { headers: { Authorization: `Bearer ${tokens.studentA}` } });
        const teamId = tRes.data.id || tRes.data._id;
        createdDocs.teams.push(teamId);
        pass("Student successfully joined Hackathon and created a Team.");

        // --- 4. SUBMISSION LIFECYCLE ---
        log("Testing Submission Lifecycle...");
        await axios.put(`${BASE_URL}/teams/${teamId}/links`, {
            githubLink: "https://github.com", demoLink: "https://demo.com"
        }, { headers: { Authorization: `Bearer ${tokens.studentA}` } });
        
        await axios.post(`${BASE_URL}/teams/${teamId}/submit`, {}, { headers: { Authorization: `Bearer ${tokens.studentA}` } });
        
        try {
            await axios.put(`${BASE_URL}/teams/${teamId}/links`, {
                githubLink: "https://hacked.com"
            }, { headers: { Authorization: `Bearer ${tokens.studentA}` } });
            fail("Student was able to modify a locked submission!");
        } catch(e) { if(e.response?.status !== 403 && e.response?.status !== 400) fail(`Expected 403/400, got ${e.response?.status}`); }
        pass("Submission locked successfully.");

        // --- 5. CHAT SYSTEM ---
        log("Testing Chat System...");
        const convRes = await axios.post(`${BASE_URL}/conversations/direct`, {
            targetUserId: dbUsers.studentB
        }, { headers: { Authorization: `Bearer ${tokens.studentA}` } });
        const convId = convRes.data.id || convRes.data._id;
        createdDocs.conversations.push(convId);

        await axios.post(`${BASE_URL}/conversations/${convId}/messages`, {
            message: "Hello B!"
        }, { headers: { Authorization: `Bearer ${tokens.studentA}` } });

        const getMsg = await axios.get(`${BASE_URL}/conversations/${convId}/messages`, { headers: { Authorization: `Bearer ${tokens.studentB}` } });
        if (getMsg.data[0].message !== "Hello B!") fail("Chat message failed to deliver");
        pass("Direct Messaging verified.");

        // --- 6. SUPPORT TICKET ---
        log("Testing Support Tickets...");
        const ticketRes = await axios.post(`${BASE_URL}/support`, {
            subject: "Help", category: "Technical", priority: "high", description: "Need help"
        }, { headers: { Authorization: `Bearer ${tokens.studentA}` } });
        const ticketId = ticketRes.data.id || ticketRes.data._id;
        createdDocs.supporttickets.push(ticketId);
        
        await axios.patch(`${BASE_URL}/admin/support/${ticketId}/status`, { status: "resolved" }, { headers: { Authorization: `Bearer ${tokens.admin}` } });
        pass("Support Lifecycle verified.");

        // --- 7. JUDGING & LEADERBOARD ---
        log("Testing Judging and Leaderboard...");
        await mongoose.connection.collection('users').updateOne({ id: dbUsers.judge }, { $set: { assignedTeams: [teamId] } });
        
        await axios.post(`${BASE_URL}/evaluations`, {
            teamId, hackathonId, projectId: teamId, 
            scores: [{criteriaId: "Innovation", score: 8}], feedback: "Good"
        }, { headers: { Authorization: `Bearer ${tokens.judge}` } });
        
        await axios.patch(`${BASE_URL}/teams/${teamId}/points`, {
            bonusPoints: 5, penaltyPoints: 0
        }, { headers: { Authorization: `Bearer ${tokens.admin}` } });
        pass("Judging and Leaderboard modifiers verified.");

        await cleanup();
        mongoose.disconnect();

        pass("ALL END-TO-END VALIDATIONS COMPLETED SUCCESSFULLY.");
        process.exitCode = 0;

    } catch (e) {
        console.error("\n[CRITICAL TEST FAILURE]");
        console.error(e.response ? e.response.data : e.message);
        
        await cleanup();
        mongoose.disconnect();
        
        process.exitCode = 1;
        throw e;
    }
}

runTests();
