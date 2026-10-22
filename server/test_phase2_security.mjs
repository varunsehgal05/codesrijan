import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import dns from 'dns';

// Load env
dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Set test environment
process.env.NODE_ENV = 'test';

import { requireTestDatabaseUri } from './test-database.js';
process.env.MONGO_URI = requireTestDatabaseUri();
process.env.MONGO_DB_NAME = new URL(process.env.MONGO_URI).pathname.slice(1);
const { app, httpServer } = await import('./server.js');
import { User, Hackathon } from './models/index.js';
import { EmailVerification, Session, PasswordResetToken } from './models/auth.js';
import { sendVerificationEmail, sendPasswordResetEmail, setTestTransporter } from './services/email.js';

let serverInstance;
let baseUrl;

async function startServer() {
    return new Promise((resolve) => {
        serverInstance = httpServer.listen(0, () => {
            const port = serverInstance.address().port;
            baseUrl = `http://localhost:${port}/api`;
            resolve();
        });
    });
}

async function closeServer() {
    return new Promise((resolve) => {
        if (serverInstance) {
            serverInstance.close(() => resolve());
        } else {
            resolve();
        }
    });
}

// Simple fetch wrapper
async function apiRequest(path, options = {}) {
    const url = `${baseUrl}${path}`;
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const res = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
    });
    let data;
    try {
        data = await res.json();
    } catch {
        data = null;
    }
    return { status: res.status, ok: res.ok, data };
}

let testPassed = 0;
let testFailed = 0;

function assert(condition, testName, details = '') {
    if (condition) {
        console.log(`  ✅ PASS: ${testName}`);
        testPassed++;
    } else {
        console.error(`  ❌ FAIL: ${testName}${details ? ` -> ${details}` : ''}`);
        testFailed++;
    }
}

async function runTestSuite() {
    console.log('\n================================================================');
    console.log('   CODESRIJAN PHASE 2: GMAIL SMTP & SECURITY TEST SUITE         ');
    console.log('================================================================\n');

    await startServer();
    console.log(`Test API Server running on ${baseUrl}`);

    // Ensure database connection
    if (mongoose.connection.readyState !== 1) {
        console.log('Connecting to MongoDB Atlas test database...');
        const mongoUri = requireTestDatabaseUri();
        await mongoose.connect(mongoUri, { dbName: process.env.MONGO_DB_NAME });
    }
    console.log('Database connected.\n');

    const testTimestamp = Date.now();
    const testEmail1 = `qa.phase2.${testTimestamp}@codesrijan.test`;
    const testEmail2 = `qa.phase2.sibling.${testTimestamp}@codesrijan.test`;
    let user1Id;
    let user2Id;

    try {
        // Cleanup any pre-existing test records
        await User.deleteMany({ email: { $in: [testEmail1, testEmail2] } });

        // ---------------------------------------------------------------------
        // GROUP 1: GMAIL SMTP CONFIGURATION & PROVIDER RESILIENCE
        // ---------------------------------------------------------------------
        console.log('[GROUP 1: GMAIL SMTP CONFIGURATION & ERROR HANDLING]');
        
        // 1. Missing credentials fails safely
        setTestTransporter(null);
        const savedUser = process.env.EMAIL_USER;
        const savedPass = process.env.EMAIL_PASS;
        const savedGmailUser = process.env.GMAIL_USER;
        const savedGmailPass = process.env.GMAIL_APP_PASSWORD;
        delete process.env.EMAIL_USER;
        delete process.env.EMAIL_PASS;
        delete process.env.GMAIL_USER;
        delete process.env.GMAIL_APP_PASSWORD;

        const missingConfigResult = await sendVerificationEmail('test@example.com', '999999');
        assert(
            missingConfigResult.success === false && missingConfigResult.error.includes('unconfigured'),
            'Missing Gmail SMTP configuration fails safely without throwing unhandled error'
        );

        // Restore env
        if (savedUser) process.env.EMAIL_USER = savedUser;
        if (savedPass) process.env.EMAIL_PASS = savedPass;
        if (savedGmailUser) process.env.GMAIL_USER = savedGmailUser;
        if (savedGmailPass) process.env.GMAIL_APP_PASSWORD = savedGmailPass;

        // 2. SMTP Authentication Failure
        setTestTransporter({
            sendMail: async () => {
                throw new Error('535 5.7.8 Username and Password not accepted');
            }
        });
        const authFailResult = await sendVerificationEmail('test@example.com', '999999');
        assert(
            authFailResult.success === false && authFailResult.error.includes('535'),
            'SMTP authentication failure (invalid App Password) is surfaced safely'
        );

        // 3. SMTP Connection Timeout / Port Block
        setTestTransporter({
            sendMail: async () => {
                throw new Error('ETIMEDOUT: Connection to smtp.gmail.com:465 timed out');
            }
        });
        const timeoutResult = await sendVerificationEmail('test@example.com', '999999');
        assert(
            timeoutResult.success === false && timeoutResult.error.includes('ETIMEDOUT'),
            'SMTP connection timeout / firewall port block fails safely without hanging'
        );

        // 4. Successful Mocked SMTP Send
        setTestTransporter({
            sendMail: async (mailOptions) => ({
                messageId: `<mock-test-${Date.now()}@gmail.com>`,
                accepted: [mailOptions.to]
            })
        });
        const successResult = await sendVerificationEmail('test@example.com', '123456');
        assert(
            successResult.success === true && successResult.messageId.includes('@gmail.com'),
            'Successful SMTP dispatch returns success: true and messageId'
        );

        // ---------------------------------------------------------------------
        // GROUP 2: REGISTRATION & SECURE ACCOUNT LIFECYCLE
        // ---------------------------------------------------------------------
        console.log('\n[GROUP 2: REGISTRATION & SECURE ACCOUNT LIFECYCLE]');
        const shortPassRes = await apiRequest('/auth/register', {
            method: 'POST',
            body: { name: 'Short Pass User', email: testEmail1, password: '123' }
        });
        assert(
            shortPassRes.status === 400 && shortPassRes.data.message.includes('at least 8 characters'),
            'Registration rejects passwords under 8 characters with HTTP 400'
        );

        const regRes = await apiRequest('/auth/register', {
            method: 'POST',
            body: {
                name: 'Phase2 QA User',
                email: testEmail1,
                password: 'CyberStrongPass123!',
                college: 'National Institute of Tech',
                branch: 'CSE',
                year: '3'
            }
        });
        user1Id = regRes.data.userId;
        assert(
            (regRes.status === 201 || regRes.status === 200) && user1Id && !regRes.data.testOtp,
            'Registration creates account in pending_verification and does NOT leak testOtp or passkey'
        );

        // Verify account in DB is pending
        const dbUser = await User.findOne({ id: user1Id });
        assert(
            dbUser && dbUser.accountStatus === 'pending_verification' && !dbUser.emailVerified,
            'Newly registered account is strictly pending_verification and emailVerified is false'
        );

        // ---------------------------------------------------------------------
        // GROUP 3: DUPLICATE REGISTRATION RECOVERY
        // ---------------------------------------------------------------------
        const immediateDuplicate = await apiRequest('/auth/register', {
            method: 'POST',
            body: { name: 'Rate limited recovery', email: testEmail1, password: 'BlockedRecoveryPassword!' }
        });
        assert(immediateDuplicate.status === 429, 'Pending re-registration shares the OTP resend cooldown');
        const unchangedUser = await User.findOne({ id: user1Id });
        assert(unchangedUser.passwordHash === dbUser.passwordHash, 'Rate-limited recovery does not change account credentials');
        // Advance only disposable fixture time; exercise recovery after the real cooldown.
        await EmailVerification.updateMany({ userId: user1Id, usedAt: null }, {
            $set: { lastResendAt: new Date(Date.now() - 61000) }
        });
        const duplicateRes = await apiRequest('/auth/register', {
            method: 'POST',
            body: {
                name: 'Phase2 QA User Updated',
                email: testEmail1,
                password: 'NewStrongPassword456!',
                college: 'Updated Tech University',
                branch: 'AI_DS',
                year: '4'
            }
        });
        assert(
            duplicateRes.status === 200 && duplicateRes.data.userId === user1Id,
            'Duplicate registration of pending account recovers safely without creating duplicate records'
        );

        const countUsers = await User.countDocuments({ email: testEmail1 });
        assert(countUsers === 1, 'Only exactly 1 user document exists after recovery');

        // ---------------------------------------------------------------------
        // GROUP 4: RESEND THROTTLING & ANTI-ENUMERATION
        // ---------------------------------------------------------------------
        console.log('\n[GROUP 3: RESEND THROTTLING & ANTI-ENUMERATION]');
        // Immediate resend should be blocked by 60s cooldown
        const throttledRes = await apiRequest('/auth/resend-otp', {
            method: 'POST',
            body: { userId: user1Id }
        });
        assert(
            throttledRes.status === 429 && throttledRes.data.retryAfter > 0,
            'Resend within 60s cooldown returns HTTP 429 Rate Limit with retryAfter seconds'
        );

        // Enumeration test: requesting resend for non-existent email returns generic message
        const enumRes = await apiRequest('/auth/resend-otp', {
            method: 'POST',
            body: { email: 'nonexistent.random.ghost.identity@nowhere.com' }
        });
        assert(
            enumRes.status === 200 && enumRes.data.message.includes('If an unverified account exists'),
            'Account enumeration is mitigated: non-existent email receives generic 200 message'
        );

        // ---------------------------------------------------------------------
        // GROUP 5: UNIVERSAL OTP BYPASS '123456' IS REJECTED
        // ---------------------------------------------------------------------
        console.log('\n[GROUP 4: UNIVERSAL BYPASS EXCISION & OTP VALIDATION]');
        const bypassRes = await apiRequest('/auth/verify-email', {
            method: 'POST',
            body: { userId: user1Id, code: '123456' }
        });
        assert(
            bypassRes.status === 400 && bypassRes.data.message.includes('Invalid verification code'),
            'Unauthorized static/universal OTP bypass (123456) is STRICTLY REJECTED'
        );

        // ---------------------------------------------------------------------
        // GROUP 6: INCORRECT OTP FAILS & DECREMENTS ATTEMPTS
        // ---------------------------------------------------------------------
        const incorrectRes = await apiRequest('/auth/verify-email', {
            method: 'POST',
            body: { userId: user1Id, code: '000000' }
        });
        assert(
            incorrectRes.status === 400 && incorrectRes.data.remainingAttempts < 5,
            'Incorrect OTP fails with HTTP 400 and returns decrementing remaining attempts'
        );

        // ---------------------------------------------------------------------
        // GROUP 7: FIVE INCORRECT ATTEMPTS TRIGGER 10-MINUTE LOCKOUT
        // ---------------------------------------------------------------------
        console.log('\n[GROUP 5: BRUTE FORCE DEFENSE & 5-ATTEMPT LOCKOUT]');
        // Submit 3 more failed attempts to reach 5 total
        await apiRequest('/auth/verify-email', { method: 'POST', body: { userId: user1Id, code: '111111' } });
        await apiRequest('/auth/verify-email', { method: 'POST', body: { userId: user1Id, code: '222222' } });
        const fifthFailRes = await apiRequest('/auth/verify-email', { method: 'POST', body: { userId: user1Id, code: '333333' } });
        
        assert(
            fifthFailRes.status === 429 && fifthFailRes.data.locked === true,
            '5th consecutive incorrect attempt triggers HTTP 429 Session Lockout'
        );

        // Attempting again while locked returns 429
        const lockedRes = await apiRequest('/auth/verify-email', { method: 'POST', body: { userId: user1Id, code: '999999' } });
        assert(
            lockedRes.status === 429 && lockedRes.data.locked === true,
            'Subsequent attempt during lockout window is immediately blocked with HTTP 429'
        );

        // ---------------------------------------------------------------------
        // GROUP 8: VALID OTP VERIFICATION & TOKEN CONSUMPTION
        // ---------------------------------------------------------------------
        console.log('\n[GROUP 6: VALID OTP VERIFICATION & TOKEN CONSUMPTION]');
        // Mint a fresh test OTP directly for testing valid flow
        const realOtp = '849201';
        const freshHash = await bcrypt.hash(realOtp, 10);
        await EmailVerification.deleteMany({ userId: user1Id });
        await EmailVerification.create({
            userId: user1Id,
            tokenHash: freshHash,
            expiresAt: new Date(Date.now() + 15 * 60000),
            attempts: 0,
            maxAttempts: 5
        });

        const validRes = await apiRequest('/auth/verify-email', {
            method: 'POST',
            body: { userId: user1Id, code: realOtp }
        });
        assert(
            validRes.status === 200 && validRes.data.token && validRes.data.user.role === 'student',
            'Legitimate 6-digit OTP succeeds, returns session token, and activates student'
        );

        const verifiedUser = await User.findOne({ id: user1Id });
        assert(
            verifiedUser.accountStatus === 'active' && verifiedUser.emailVerified === true,
            'User record in database transitioned to accountStatus: active and emailVerified: true'
        );

        // ---------------------------------------------------------------------
        // GROUP 9: REUSED OTP FAILS (SINGLE-USE ENFORCEMENT)
        // ---------------------------------------------------------------------
        const reuseRes = await apiRequest('/auth/verify-email', {
            method: 'POST',
            body: { userId: user1Id, code: realOtp }
        });
        assert(
            reuseRes.status === 400 && reuseRes.data.message.includes('No active verification request'),
            'Reusing an already consumed OTP fails: single-use token strictly enforced'
        );

        // ---------------------------------------------------------------------
        // GROUP 10: EXPIRED OTP FAILS
        // ---------------------------------------------------------------------
        console.log('\n[GROUP 7: EXPIRY & CROSS-USER DEFENSE]');
        const expiredOtp = '731952';
        const expiredHash = await bcrypt.hash(expiredOtp, 10);
        await EmailVerification.create({
            userId: user1Id,
            tokenHash: expiredHash,
            expiresAt: new Date(Date.now() - 60000), // Expired 1 minute ago
            attempts: 0,
            maxAttempts: 5
        });
        const expiredRes = await apiRequest('/auth/verify-email', {
            method: 'POST',
            body: { userId: user1Id, code: expiredOtp }
        });
        assert(
            expiredRes.status === 400 && expiredRes.data.message.includes('expired'),
            'Expired OTP fails with HTTP 400 verification code has expired'
        );

        // ---------------------------------------------------------------------
        // GROUP 11: CROSS-USER TOKEN ATTACK REJECTED
        // ---------------------------------------------------------------------
        const regUser2 = await apiRequest('/auth/register', {
            method: 'POST',
            body: {
                name: 'Phase2 User Two',
                email: testEmail2,
                password: 'SecondUserPass123!',
                college: 'State Tech',
                branch: 'IT',
                year: '2'
            }
        });
        user2Id = regUser2.data.userId;

        const user2Otp = '654321';
        const user2Hash = await bcrypt.hash(user2Otp, 10);
        await EmailVerification.deleteMany({ userId: user2Id });
        await EmailVerification.create({
            userId: user2Id,
            tokenHash: user2Hash,
            expiresAt: new Date(Date.now() + 15 * 60000),
            attempts: 0,
            maxAttempts: 5
        });

        const crossUserRes = await apiRequest('/auth/verify-email', {
            method: 'POST',
            body: { userId: user1Id, code: user2Otp }
        });
        assert(
            crossUserRes.status === 400,
            "Another user's verification token cannot be used to verify a different account"
        );

        // ---------------------------------------------------------------------
        // GROUP 12: LOGIN & PASSWORD RESET REGRESSION
        // ---------------------------------------------------------------------
        console.log('\n[GROUP 8: REGRESSION & CORE FUNCTIONALITY PRESERVATION]');
        const loginRes = await apiRequest('/auth/login', {
            method: 'POST',
            body: { email: testEmail1, password: 'NewStrongPassword456!' }
        });
        assert(
            loginRes.status === 200 && loginRes.data.token && loginRes.data.user.id === user1Id,
            'Verified account logs in successfully and receives valid session token'
        );

        const forgotRes = await apiRequest('/auth/forgot-password', {
            method: 'POST',
            body: { email: testEmail1 }
        });
        assert(
            forgotRes.status === 200 &&
            !forgotRes.data.resetToken &&
            !forgotRes.data.resetLink,
            'Forgot password does NOT leak raw resetToken or resetLink in HTTP response'
        );

        const meUnauth = await apiRequest('/auth/me');
        assert(
            meUnauth.status === 401 || meUnauth.status === 403,
            'Protected endpoint /api/auth/me rejects unauthenticated callers'
        );

        const meAuth = await apiRequest('/auth/me', {
            headers: { Authorization: `Bearer ${loginRes.data.token}` }
        });
        assert(
            meAuth.status === 200 && meAuth.data.user.id === user1Id,
            'Protected endpoint /api/auth/me validates session token and returns current user'
        );

        const hackathonsRes = await apiRequest('/hackathons');
        assert(
            hackathonsRes.status === 200 && Array.isArray(hackathonsRes.data),
            'Public hackathons endpoint remains fully functional'
        );

        // Cleanup test users
        await User.deleteMany({ email: { $in: [testEmail1, testEmail2] } });
        await EmailVerification.deleteMany({ userId: { $in: [user1Id, user2Id] } });
        await Session.deleteMany({ userId: { $in: [user1Id, user2Id] } });
        await PasswordResetToken.deleteMany({ userId: { $in: [user1Id, user2Id] } });

    } catch (err) {
        console.error('Unexpected error during test suite execution:', err);
        testFailed++;
    } finally {
        await closeServer();
        await mongoose.disconnect();
    }

    console.log('\n======================================================');
    console.log(`TEST SUMMARY: ${testPassed} PASSED, ${testFailed} FAILED`);
    console.log('======================================================\n');

    if (testFailed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runTestSuite();
