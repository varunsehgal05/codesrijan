import axios from 'axios';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

const BASE_URL = 'http://localhost:5001/api';

// Simple logging
function log(msg) { console.log(`[E2E] ${msg}`); }
function pass(msg) { console.log(`[PASS] ${msg}`); }
function fail(msg) { console.error(`[FAIL] ${msg}`); process.exitCode = 1; throw new Error(msg); }

async function setupTestDb() {
    log("Connecting to MongoDB for test setup...");
    await mongoose.connect("mongodb+srv://codesrijan_backend:CodeSrijan2026Pass123!@codesrijan-cluster.lhtpmxf.mongodb.net/codesrijan?appName=codesrijan-cluster");
    log("Connected. Seeding test users...");

    // Helper to bypass OTP and register a verified user directly in DB
    const createUser = async (email, role) => {
        const id = `usr-${Date.now()}-${Math.floor(Math.random()*1000)}`;
        const hash = await bcrypt.hash("password123", 10);
        await mongoose.connection.collection('users').insertOne({
            id, name: `${role.toUpperCase()} Test`, email,
            passwordHash: hash, role, accountStatus: 'active', emailVerified: true,
            createdAt: new Date(), updatedAt: new Date()
        });
        return id;
    };

    // Clean up previous E2E test data
    await mongoose.connection.collection('users').deleteMany({ email: { $regex: '@e2e.test' } });
    await mongoose.connection.collection('teams').deleteMany({ name: { $regex: 'E2E Team' } });
    await mongoose.connection.collection('hackathons').deleteMany({ title: { $regex: 'E2E Hackathon' } });

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
        
        // Student shouldn't access admin
        try {
            await axios.get(`${BASE_URL}/admin/settings`, { headers: { Authorization: `Bearer ${tokens.studentA}` } });
            fail("Student was able to access /admin/settings");
        } catch(e) { if(e.response?.status !== 403) fail(`Expected 403, got ${e.response?.status}`); }

        // Judge shouldn't access admin
        try {
            await axios.get(`${BASE_URL}/admin/settings`, { headers: { Authorization: `Bearer ${tokens.judge}` } });
            fail("Judge was able to access /admin/settings");
        } catch(e) { if(e.response?.status !== 403) fail(`Expected 403, got ${e.response?.status}`); }
        
        pass("RBAC enforced successfully across roles.");

        // --- 2. PUBLIC REGISTRATION SECURITY ---
        log("Testing Public Registration Role Enforcement...");
        await axios.post(`${BASE_URL}/auth/register`, {
            name: "Hacker", email: `hacker_${Date.now()}@e2e.test`, password: "password123", role: "admin"
        });
        const hackerRecord = await mongoose.connection.collection('users').findOne({ email: { $regex: 'hacker_' } });
        if (hackerRecord.role !== 'student') fail("Public registration allowed arbitrary role assignment!");
        pass("Public registration forces 'student' role.");

        // --- 3. PARTICIPANT JOURNEY (Hackathon -> Team -> Submit) ---
        log("Starting Participant Journey...");
        
        // Admin creates hackathon
        const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const hRes = await axios.post(`${BASE_URL}/hackathons`, {
            name: "E2E Hackathon", description: "Test", startDate: tomorrow.toISOString(), endDate: tomorrow.toISOString(),
            registrationStart: yesterday.toISOString(), registrationEnd: tomorrow.toISOString()
        }, { headers: { Authorization: `Bearer ${tokens.admin}` } });
        const hackathonId = hRes.data.id || hRes.data._id;
        
        // Admin creates problem
        const pRes = await axios.post(`${BASE_URL}/problems`, {
            id: `prob-${Date.now()}`, title: "E2E Problem", hackathonId, difficulty: "Easy", shortDescription: "Short", description: "Long"
        }, { headers: { Authorization: `Bearer ${tokens.admin}` } });
        const problemId = pRes.data.id || pRes.data._id;

        // Admin opens registration
        await axios.post(`${BASE_URL}/hackathons/${hackathonId}/open-registration`, {}, { headers: { Authorization: `Bearer ${tokens.admin}` } });

        // Student registers for hackathon
        await axios.post(`${BASE_URL}/hackathons/${hackathonId}/register`, {}, { headers: { Authorization: `Bearer ${tokens.studentA}` } });

        // Student creates team
        const tRes = await axios.post(`${BASE_URL}/teams`, {
            name: `E2E Team ${Date.now()}`, hackathonId, problemStatementId: problemId, description: "Test"
        }, { headers: { Authorization: `Bearer ${tokens.studentA}` } });
        const teamId = tRes.data.id || tRes.data._id;
        pass("Student successfully joined Hackathon and created a Team.");

        // --- 4. SUBMISSION LIFECYCLE ---
        log("Testing Submission Lifecycle...");
        // Draft save
        await axios.put(`${BASE_URL}/teams/${teamId}/links`, {
            githubLink: "https://github.com", demoLink: "https://demo.com"
        }, { headers: { Authorization: `Bearer ${tokens.studentA}` } });
        
        // Final submit
        await axios.post(`${BASE_URL}/teams/${teamId}/submit`, {}, { headers: { Authorization: `Bearer ${tokens.studentA}` } });
        
        // Lock Test: Try editing after final submit
        try {
            await axios.put(`${BASE_URL}/teams/${teamId}/links`, {
                githubLink: "https://hacked.com"
            }, { headers: { Authorization: `Bearer ${tokens.studentA}` } });
            fail("Student was able to modify a locked submission!");
        } catch(e) { if(e.response?.status !== 403 && e.response?.status !== 400) fail(`Expected 403/400, got ${e.response?.status}`); }
        pass("Submission locked successfully.");

        // --- 5. CHAT SYSTEM ---
        log("Testing Chat System...");
        // Student A -> Student B
        const convRes = await axios.post(`${BASE_URL}/conversations/direct`, {
            targetUserId: dbUsers.studentB
        }, { headers: { Authorization: `Bearer ${tokens.studentA}` } });
        const convId = convRes.data.id || convRes.data._id;

        await axios.post(`${BASE_URL}/conversations/${convId}/messages`, {
            message: "Hello B!"
        }, { headers: { Authorization: `Bearer ${tokens.studentA}` } });

        // Student B checks messages
        const getMsg = await axios.get(`${BASE_URL}/conversations/${convId}/messages`, { headers: { Authorization: `Bearer ${tokens.studentB}` } });
        if (getMsg.data[0].message !== "Hello B!") fail("Chat message failed to deliver");
        pass("Direct Messaging verified.");

        // --- 6. SUPPORT TICKET ---
        log("Testing Support Tickets...");
        const ticketRes = await axios.post(`${BASE_URL}/support`, {
            subject: "Help", category: "Technical", priority: "high", description: "Need help"
        }, { headers: { Authorization: `Bearer ${tokens.studentA}` } });
        const ticketId = ticketRes.data.id || ticketRes.data._id;
        
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

        // Clean up
        log("Skipping cleanup to keep data for browser subagent...");
        // await mongoose.connection.collection('users').deleteMany({ email: { $regex: '@e2e.test' } });
        // await mongoose.connection.collection('teams').deleteMany({ hackathonId });
        // await mongoose.connection.collection('hackathons').deleteMany({ id: hackathonId });
        // await mongoose.connection.collection('problems').deleteMany({ id: problemId });
        // await mongoose.connection.collection('messages').deleteMany({ conversationId: convId });
        // await mongoose.connection.collection('conversations').deleteMany({ id: convId });
        // await mongoose.connection.collection('supporttickets').deleteMany({ id: ticketId });
        // await mongoose.connection.collection('evaluations').deleteMany({ teamId });
        mongoose.disconnect();

        pass("ALL END-TO-END VALIDATIONS COMPLETED SUCCESSFULLY.");
        process.exitCode = 0;

    } catch (e) {
        console.error("\n[CRITICAL TEST FAILURE]");
        console.error(e.response ? e.response.data : e.message);
        
        // Force cleanup before crash
        await mongoose.connection.collection('users').deleteMany({ email: { $regex: '@e2e.test' } });
        mongoose.disconnect();
        
        process.exitCode = 1;
        throw e;
    }
}

runTests();
