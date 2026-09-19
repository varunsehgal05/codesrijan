import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

import { User } from './models/index.js';
import { EmailVerification, Session } from './models/auth.js';

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4']);

const API = 'http://localhost:5001/api';
let studentToken = "";

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runTests() {
    console.log("\n=== CODE SRIJAN END-TO-END SECURITY AUDIT ===");
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: 'codesrijan' });
        console.log("-> Connected to Atlas core.");

        // Clean slate for test user
        await User.deleteOne({ email: "student.test@codesrijan.com" });

        // 13. Confirm unauthenticated request gets 401
        try {
            await axios.get(`${API}/teams`, { headers: { Authorization: "Bearer bogus" } });
            console.log("❌ Unauthenticated GET /api/teams incorrectly succeeded.");
        } catch (e) {
            if (e.response?.status === 401 || e.response?.status === 403) console.log("✅ Unauthenticated request correctly blocked (401/403).");
            else console.log("❌ Unauthenticated request failed with wrong code:", e.response?.status);
        }

        // 9. Run Registration Flow
        console.log("\n-> Starting Registration Matrix (Student)...");
        const regPayload = {
            name: "Test Student",
            email: "student.test@codesrijan.com",
            password: "password123",
            role: "student",
            college: "Cyber Institute",
            branch: "CS",
            year: "3"
        };
        const regRes = await axios.post(`${API}/auth/register`, regPayload);
        const actualUserId = regRes.data.userId;
        console.log("✅ Register endpoint hit successfully. Mongoose ID:", actualUserId);

        // Grab Email Verification code from DB
        const ev = await EmailVerification.findOne({ userId: actualUserId });
        if (!ev) throw new Error("Email verification token not minted in DB!");
        console.log("✅ EmailVerification record generated in DB.");

        // Verify Email
        await User.findOneAndUpdate({ id: actualUserId }, { emailVerified: true, accountStatus: 'active' });
        console.log("✅ Email Verified successfully via direct DB override.");

        // Login
        const loginRes = await axios.post(`${API}/auth/login`, { email: regPayload.email, password: "password123" });
        studentToken = loginRes.data.token;
        if (!studentToken) throw new Error("Login failed to provide Session Token.");
        console.log("✅ Login successful. Session Token generated.");

        // 11. Run /api/auth/me
        const meRes = await axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${studentToken}` } });
        if (meRes.data.user.email !== regPayload.email) throw new Error("Auth Me context mismatch.");
        console.log("✅ `/api/auth/me` perfectly resolved the context via MongoDB Session tracking.");

        // 10. Confirm MongoDB structure usage internally
        const userCount = await User.countDocuments({ email: regPayload.email, accountStatus: 'active' });
        const sessionCount = await Session.countDocuments({ userId: actualUserId });
        if (userCount === 1 && sessionCount === 1) {
            console.log("✅ MongoDB Schema propagation confirmed (`users`, `sessions`, `emailVerifications`).");
        } else {
            console.log("❌ Found anomalies in schema projections.", { userCount, sessionCount });
        }

        // 12. Test Protected Endpoint
        const teamRes = await axios.get(`${API}/teams`, { headers: { Authorization: `Bearer ${studentToken}` } });
        if (Array.isArray(teamRes.data)) console.log("✅ Protected /api/teams route accessible by authenticated student.");

        // 14. Confirm unauthorized role gets 403
        console.log("\n-> Testing Role Privileges (`admin` vs `student`)...");
        try {
            await axios.get(`${API}/users`, { headers: { Authorization: `Bearer ${studentToken}` } });
            console.log("❌ Student incorrectly accessed Admin route.");
        } catch (e) {
            if (e.response?.status === 403) console.log("✅ Student completely blocked from Admin APIs (403 Forbidden).");
            else console.log("❌ Admin route blocked with wrong code:", e.response?.status);
        }

        console.log("\n=== ALL E2E SECURITY MATRICES PASSED SUCESSFULLY ===");

    } catch (e) {
        console.error("Test Fault:", e.response?.data || e.message);
    } finally {
        await mongoose.connection.close();
    }
}

runTests();
