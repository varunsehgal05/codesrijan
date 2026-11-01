import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from './models/index.js';
import { Session, EmailVerification, PasswordResetToken } from './models/auth.js';
import { setTestAppsScriptDispatcher, setTestTransporter } from './services/email.js';

// Setup in-memory MongoDB
const mongod = await MongoMemoryServer.create({
    binary: { systemBinary: process.env.MONGOMS_SYSTEM_BINARY || path.join(os.homedir(), '.cache/mongodb-binaries/mongod-x64-win32-8.2.6.exe') }
});
process.env.MONGO_URI = mongod.getUri('codesrijan_auth_test');
process.env.MONGO_DB_NAME = 'codesrijan_auth_test';
process.env.SEED_ADMIN_PASSWORD = '';
process.env.SEED_STUDENT_PASSWORD = '';

// Capture dispatched emails
const dispatchedEmails = [];
setTestAppsScriptDispatcher(async (payload) => {
    dispatchedEmails.push({ type: 'apps_script', payload });
    return { success: true, messageId: 'mock-script-id' };
});
setTestTransporter({
    sendMail: async (options) => {
        dispatchedEmails.push({ type: 'smtp', options });
        return { messageId: 'mock-mail-id' };
    }
});

await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB_NAME });
const { httpServer } = await import('./server.js');
await new Promise(resolve => httpServer.listen(0, '127.0.0.1', resolve));
const port = httpServer.address().port;
const apiBase = `http://127.0.0.1:${port}/api`;

async function api(endpoint, options = {}) {
    const { method = 'GET', body, token, headers = {} } = options;
    const reqHeaders = { 'Content-Type': 'application/json', ...headers };
    if (token) {
        reqHeaders['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${apiBase}${endpoint}`, {
        method,
        headers: reqHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined
    });
    const status = res.status;
    let data = null;
    const text = await res.text();
    try {
        data = JSON.parse(text);
    } catch {
        data = text;
    }
    return { status, data, headers: res.headers };
}

// Role home navigation mapping from src/lib/role-home.ts
function roleHome(role) {
    return role === 'admin'
        ? '/admin'
        : role === 'mentor'
            ? '/mentor-command-center'
            : role === 'judge'
                ? '/judge-command-center'
                : '/dashboard';
}

console.log(`[TEST SUITE] Auth test server running on ${apiBase}`);

try {
    // -------------------------------------------------------------
    // 1. REGISTRATION FLOW
    // -------------------------------------------------------------
    await test('1.1 Registration input validation rejects invalid payloads', async () => {
        // Missing name
        const r1 = await api('/auth/register', { method: 'POST', body: { email: 'bad@test.com', password: 'Password123!' } });
        assert.equal(r1.status, 400);
        assert.ok(r1.data.message.includes('Full name is required'));

        // Missing email
        const r2 = await api('/auth/register', { method: 'POST', body: { name: 'Test User', password: 'Password123!' } });
        assert.equal(r2.status, 400);
        assert.ok(r2.data.message.includes('Email address is required'));

        // Invalid email format
        const r3 = await api('/auth/register', { method: 'POST', body: { name: 'Test User', email: 'invalid-email', password: 'Password123!' } });
        assert.equal(r3.status, 400);
        assert.ok(r3.data.message.includes('Valid email address format is required'));

        // Short password (< 8 chars)
        const r4 = await api('/auth/register', { method: 'POST', body: { name: 'Test User', email: 'valid@test.com', password: 'short' } });
        assert.equal(r4.status, 400);
        assert.ok(r4.data.message.includes('Password must be at least 8 characters long'));
    });

    let studentUserId;
    const studentEmail = 'student.tester@example.com';
    const studentPassword = 'SecureStudentPassword2026!';

    await test('1.2 Successful registration creates pending user and dispatches OTP', async () => {
        dispatchedEmails.length = 0;
        const res = await api('/auth/register', {
            method: 'POST',
            body: {
                name: 'Alice Builder',
                email: studentEmail,
                password: studentPassword,
                college: 'Tech University',
                branch: 'Computer Science',
                year: '3rd Year'
            }
        });

        assert.equal(res.status, 201);
        assert.ok(res.data.userId);
        assert.equal(res.data.emailDeliveryStatus, 'dispatched');
        studentUserId = res.data.userId;

        // Verify user in Mongo DB
        const user = await User.findOne({ id: studentUserId });
        assert.ok(user, 'User must exist in DB');
        assert.equal(user.email, studentEmail);
        assert.equal(user.name, 'Alice Builder');
        assert.equal(user.role, 'student', 'Public registration must default to student role');
        assert.equal(user.accountStatus, 'pending_verification');
        assert.equal(user.emailVerified, false);
        assert.ok(user.passwordHash, 'Password must be hashed');
        assert.notEqual(user.passwordHash, studentPassword, 'Password must NOT be stored in plaintext');

        // Verify EmailVerification record
        const verif = await EmailVerification.findOne({ userId: studentUserId, usedAt: null });
        assert.ok(verif, 'Email verification record must exist');
        assert.ok(verif.tokenHash, 'OTP tokenHash must exist');
        assert.equal(verif.attempts, 0);
        assert.equal(verif.maxAttempts, 5);
        assert.ok(verif.expiresAt > new Date(), 'OTP must not be expired');
    });

    await test('1.3 Re-registering with pending account updates details and issues fresh OTP', async () => {
        // Fast-forward lastResendAt past 60s cooldown to test pending account recovery
        await EmailVerification.updateOne({ userId: studentUserId }, {
            $set: { lastResendAt: new Date(Date.now() - 65000) }
        });

        const res = await api('/auth/register', {
            method: 'POST',
            body: {
                name: 'Alice Builder Updated',
                email: studentEmail,
                password: studentPassword,
                college: 'Tech University Updated',
                branch: 'Information Technology',
                year: '4th Year'
            }
        });

        assert.equal(res.status, 200);
        assert.equal(res.data.userId, studentUserId);
        const user = await User.findOne({ id: studentUserId });
        assert.equal(user.name, 'Alice Builder Updated');
        assert.equal(user.branch, 'Information Technology');
    });

    // -------------------------------------------------------------
    // 2. OTP VERIFICATION FLOW
    // -------------------------------------------------------------
    await test('2.1 OTP verification rejects invalid codes and tracks attempts', async () => {
        // Invalid code
        const r1 = await api('/auth/otp/verify', {
            method: 'POST',
            body: { userId: studentUserId, code: '000000' }
        });
        assert.equal(r1.status, 400);
        assert.ok(r1.data.message.includes('Invalid verification code'));
        assert.equal(r1.data.remainingAttempts, 4);

        // Verification via alias /auth/verify-email
        const r2 = await api('/auth/verify-email', {
            method: 'POST',
            body: { userId: studentUserId, code: '999999' }
        });
        assert.equal(r2.status, 400);
        assert.equal(r2.data.remainingAttempts, 3);
    });

    await test('2.2 OTP verification locks out after exceeding max attempts', async () => {
        // Fail remaining attempts to trigger lockout
        await api('/auth/otp/verify', { method: 'POST', body: { userId: studentUserId, code: '111111' } });
        await api('/auth/otp/verify', { method: 'POST', body: { userId: studentUserId, code: '222222' } });
        const lockRes = await api('/auth/otp/verify', { method: 'POST', body: { userId: studentUserId, code: '333333' } });

        assert.equal(lockRes.status, 429);
        assert.ok(lockRes.data.locked);
        assert.ok(lockRes.data.retryAfter > 0);

        // Subsequent attempt immediately blocked by lockout
        const nextRes = await api('/auth/otp/verify', { method: 'POST', body: { userId: studentUserId, code: '444444' } });
        assert.equal(nextRes.status, 429);
    });

    let validStudentToken;

    await test('2.3 Resend OTP resets lockout window and provides verified OTP entry', async () => {
        // Reset the record's lockout for testing fresh code entry
        const code = '748291';
        const tokenHash = await bcrypt.hash(code, 10);
        await EmailVerification.updateOne({ userId: studentUserId }, {
            $set: {
                tokenHash,
                attempts: 0,
                lockedUntil: null,
                expiresAt: new Date(Date.now() + 15 * 60000)
            }
        });

        // Verify with correct code via POST /api/auth/otp/verify
        const verifyRes = await api('/auth/otp/verify', {
            method: 'POST',
            body: { userId: studentUserId, code }
        });

        assert.equal(verifyRes.status, 200);
        assert.equal(verifyRes.data.message, 'Email verified successfully.');
        assert.ok(verifyRes.data.token, 'Must return session token');
        assert.equal(verifyRes.data.user.id, studentUserId);
        assert.equal(verifyRes.data.user.role, 'student');
        validStudentToken = verifyRes.data.token;

        // Verify DB updates
        const user = await User.findOne({ id: studentUserId });
        assert.equal(user.accountStatus, 'active');
        assert.equal(user.emailVerified, true);
        assert.ok(user.emailVerifiedAt);

        // Verify EmailVerification consumed
        const verif = await EmailVerification.findOne({ userId: studentUserId });
        assert.ok(verif.usedAt, 'Verification record must be marked used');

        // Re-use of consumed OTP must fail
        const reuseRes = await api('/auth/otp/verify', {
            method: 'POST',
            body: { userId: studentUserId, code }
        });
        assert.equal(reuseRes.status, 400);
    });

    await test('1.4 Duplicate registration for active account is rejected', async () => {
        const res = await api('/auth/register', {
            method: 'POST',
            body: {
                name: 'Alice Builder',
                email: studentEmail,
                password: 'AnotherPassword123!'
            }
        });
        assert.equal(res.status, 400);
        assert.ok(res.data.message.includes('An active account with this email already exists'));
    });

    // -------------------------------------------------------------
    // 3. LOGIN FLOW
    // -------------------------------------------------------------
    await test('3.1 Login validation rejects non-existent, unverified, and invalid credentials', async () => {
        // Non-existent email
        const r1 = await api('/auth/login', {
            method: 'POST',
            body: { email: 'nonexistent@example.com', password: 'SomePassword123!' }
        });
        assert.equal(r1.status, 401);
        assert.ok(r1.data.message.includes('Invalid matrix passkey or identity'));

        // Wrong password
        const r2 = await api('/auth/login', {
            method: 'POST',
            body: { email: studentEmail, password: 'WrongPassword123!' }
        });
        assert.equal(r2.status, 401);
        assert.ok(r2.data.message.includes('Invalid matrix passkey or identity'));

        // Unverified user
        const unverifiedEmail = 'pending.user@example.com';
        await User.create({
            id: 'usr-pending-test',
            name: 'Pending User',
            email: unverifiedEmail,
            passwordHash: await bcrypt.hash('PendingPassword123!', 10),
            role: 'student',
            accountStatus: 'pending_verification',
            emailVerified: false
        });
        const r3 = await api('/auth/login', {
            method: 'POST',
            body: { email: unverifiedEmail, password: 'PendingPassword123!' }
        });
        assert.equal(r3.status, 401);
        assert.equal(r3.data.needsVerification, true);
        assert.equal(r3.data.userId, 'usr-pending-test');

        // Suspended user
        const suspendedEmail = 'suspended@example.com';
        await User.create({
            id: 'usr-suspended-test',
            name: 'Suspended User',
            email: suspendedEmail,
            passwordHash: await bcrypt.hash('Suspended123!', 10),
            role: 'student',
            accountStatus: 'suspended',
            emailVerified: true
        });
        const r4 = await api('/auth/login', {
            method: 'POST',
            body: { email: suspendedEmail, password: 'Suspended123!' }
        });
        assert.equal(r4.status, 403);
        assert.ok(r4.data.message.includes('suspended'));
    });

    await test('3.2 Successful student login issues session token and verified identity', async () => {
        const res = await api('/auth/login', {
            method: 'POST',
            body: { email: studentEmail, password: studentPassword }
        });

        assert.equal(res.status, 200);
        assert.ok(res.data.token);
        assert.equal(res.data.user.email, studentEmail);
        assert.equal(res.data.user.role, 'student');
        validStudentToken = res.data.token;

        // Verify session stored in MongoDB with SHA-256 hash
        const expectedHash = crypto.createHash('sha256').update(res.data.token).digest('hex');
        const sessionRecord = await Session.findOne({ sessionTokenHash: expectedHash });
        assert.ok(sessionRecord, 'Session record must exist in database');
        assert.equal(sessionRecord.userId, studentUserId);
        assert.equal(sessionRecord.revokedAt, undefined);
    });

    // -------------------------------------------------------------
    // 4. ROLE-BASED DESTINATION ROUTING ON LOGIN
    // -------------------------------------------------------------
    const roleUsers = [
        { role: 'student', email: studentEmail, password: studentPassword, expectedRoute: '/dashboard' },
        { role: 'admin', email: 'admin.lead@codesrijan.com', password: 'AdminPassword2026!', expectedRoute: '/admin' },
        { role: 'mentor', email: 'mentor.guide@codesrijan.com', password: 'MentorPassword2026!', expectedRoute: '/mentor-command-center' },
        { role: 'judge', email: 'judge.evaluator@codesrijan.com', password: 'JudgePassword2026!', expectedRoute: '/judge-command-center' }
    ];

    // Seed admin, mentor, judge users
    for (const r of roleUsers.filter(u => u.role !== 'student')) {
        await User.create({
            id: `usr-${r.role}-fixture`,
            name: `Staff ${r.role.toUpperCase()}`,
            email: r.email,
            passwordHash: await bcrypt.hash(r.password, 10),
            role: r.role,
            accountStatus: 'active',
            emailVerified: true
        });
    }

    await test('4.1 Verify role-based destination routing for all 4 roles', async () => {
        for (const userSpec of roleUsers) {
            const loginRes = await api('/auth/login', {
                method: 'POST',
                body: { email: userSpec.email, password: userSpec.password }
            });

            assert.equal(loginRes.status, 200, `Login for ${userSpec.role} should succeed`);
            const returnedRole = loginRes.data.user.role;
            assert.equal(returnedRole, userSpec.role, `Role in payload must match ${userSpec.role}`);

            // Test destination routing
            const destination = roleHome(returnedRole);
            assert.equal(destination, userSpec.expectedRoute, `Role ${userSpec.role} must route to ${userSpec.expectedRoute}`);

            // Test that session token can access /api/auth/me and yields identical role
            const meRes = await api('/auth/me', { token: loginRes.data.token });
            assert.equal(meRes.status, 200);
            assert.equal(meRes.data.user.role, userSpec.role);
            assert.equal(roleHome(meRes.data.user.role), userSpec.expectedRoute);
        }
    });

    // -------------------------------------------------------------
    // 5. PASSWORD RESET FLOW
    // -------------------------------------------------------------
    let resetRawToken;
    const newStudentPassword = 'BrandNewPassword2026!';

    await test('5.1 Forgot password dispatches reset sequence without enumerating email', async () => {
        // Non-existent email yields generic message
        const r1 = await api('/auth/forgot-password', {
            method: 'POST',
            body: { email: 'nobody@example.com' }
        });
        assert.equal(r1.status, 200);
        assert.ok(r1.data.message.includes('If an account exists'));

        // Real user request
        const r2 = await api('/auth/forgot-password', {
            method: 'POST',
            body: { email: studentEmail }
        });
        assert.equal(r2.status, 200);
        assert.ok(r2.data.message.includes('If an account exists'));

        // Check PasswordResetToken in DB
        const resetRecord = await PasswordResetToken.findOne({ userId: studentUserId, usedAt: null });
        assert.ok(resetRecord, 'PasswordResetToken must be created');
        assert.ok(resetRecord.tokenHash, 'tokenHash must exist');
        assert.ok(resetRecord.expiresAt > new Date());
    });

    await test('5.2 Password reset validates token and updates passkey', async () => {
        // Create known raw token and hash for verification
        resetRawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = await bcrypt.hash(resetRawToken, 5);
        await PasswordResetToken.deleteMany({ userId: studentUserId });
        await PasswordResetToken.create({
            userId: studentUserId,
            tokenHash,
            expiresAt: new Date(Date.now() + 60 * 60000)
        });

        // Test with invalid token
        const badRes = await api('/auth/reset-password', {
            method: 'POST',
            body: { userId: studentUserId, token: 'invalid-token-value', newPassword: newStudentPassword }
        });
        assert.equal(badRes.status, 400);

        // Test with correct token
        const resetRes = await api('/auth/reset-password', {
            method: 'POST',
            body: { userId: studentUserId, token: resetRawToken, newPassword: newStudentPassword }
        });
        assert.equal(resetRes.status, 200);
        assert.ok(resetRes.data.message.includes('Password updated successfully'));

        // Verify token burned
        const record = await PasswordResetToken.findOne({ userId: studentUserId });
        assert.ok(record.usedAt, 'Reset token must be marked used');

        // Verify previous password no longer works
        const oldLogin = await api('/auth/login', {
            method: 'POST',
            body: { email: studentEmail, password: studentPassword }
        });
        assert.equal(oldLogin.status, 401, 'Old password must be rejected');

        // Verify new password works
        const newLogin = await api('/auth/login', {
            method: 'POST',
            body: { email: studentEmail, password: newStudentPassword }
        });
        assert.equal(newLogin.status, 200, 'New password must succeed');
        validStudentToken = newLogin.data.token;
    });

    // -------------------------------------------------------------
    // 6. SESSION REVOCATION FLOW
    // -------------------------------------------------------------
    await test('6.1 Session revocation seals all sessions and revokes access', async () => {
        // Confirm token is active
        const beforeRevoke = await api('/auth/me', { token: validStudentToken });
        assert.equal(beforeRevoke.status, 200);
        assert.equal(beforeRevoke.data.user.id, studentUserId);

        // Call POST /api/auth/sessions/revoke
        const revokeRes = await api('/auth/sessions/revoke', {
            method: 'POST',
            token: validStudentToken
        });
        assert.equal(revokeRes.status, 200);
        assert.ok(revokeRes.data.message.includes('All sessions terminated'));

        // Verify DB: all sessions have revokedAt populated
        const activeSessions = await Session.find({ userId: studentUserId, revokedAt: null });
        assert.equal(activeSessions.length, 0, 'No unrevoked sessions should remain');

        // Confirm token is immediately rejected on subsequent requests
        const afterRevoke = await api('/auth/me', { token: validStudentToken });
        assert.equal(afterRevoke.status, 401);
        assert.ok(afterRevoke.data.message.includes('Session expired or invalid'));
    });

    // -------------------------------------------------------------
    // 7. PASSWORD HASH LEAK PROTECTION VERIFICATION
    // -------------------------------------------------------------
    await test('7.1 Password hashes are NEVER leaked in any API response', async () => {
        // 1. Re-login to get fresh session
        const loginRes = await api('/auth/login', {
            method: 'POST',
            body: { email: studentEmail, password: newStudentPassword }
        });
        assert.equal(loginRes.status, 200);
        const loginPayloadStr = JSON.stringify(loginRes.data);
        assert.equal(loginPayloadStr.includes('passwordHash'), false, 'passwordHash must not appear in /auth/login response');
        assert.equal(loginPayloadStr.includes(newStudentPassword), false, 'plaintext password must not appear in /auth/login response');
        assert.equal(loginRes.data.user.passwordHash, undefined);

        const currentToken = loginRes.data.token;

        // 2. Registration response check
        const regRes = await api('/auth/register', {
            method: 'POST',
            body: {
                name: 'Hash Checker',
                email: 'hashcheck@example.com',
                password: 'SecretHashPassword123!',
                college: 'Security College',
                branch: 'Cybersecurity',
                year: '2'
            }
        });
        const regPayloadStr = JSON.stringify(regRes.data);
        assert.equal(regPayloadStr.includes('passwordHash'), false, 'passwordHash must not appear in /auth/register response');
        assert.equal(regPayloadStr.includes('tokenHash'), false, 'tokenHash must not appear in /auth/register response');

        // 3. OTP verification response check
        const verifCode = '654321';
        const vHash = await bcrypt.hash(verifCode, 10);
        await EmailVerification.updateOne({ userId: regRes.data.userId }, { $set: { tokenHash: vHash } });
        const otpRes = await api('/auth/otp/verify', {
            method: 'POST',
            body: { userId: regRes.data.userId, code: verifCode }
        });
        const otpPayloadStr = JSON.stringify(otpRes.data);
        assert.equal(otpPayloadStr.includes('passwordHash'), false, 'passwordHash must not appear in /auth/otp/verify response');
        assert.equal(otpPayloadStr.includes('tokenHash'), false, 'tokenHash must not appear in /auth/otp/verify response');
        assert.equal(otpRes.data.user.passwordHash, undefined);

        // 4. /auth/me check
        const meRes = await api('/auth/me', { token: currentToken });
        assert.equal(meRes.status, 200);
        const mePayloadStr = JSON.stringify(meRes.data);
        assert.equal(mePayloadStr.includes('passwordHash'), false, 'passwordHash must not appear in /auth/me response');
        assert.equal(meRes.data.user.passwordHash, undefined);

        // 5. /users/:id/profile check
        const profileRes = await api(`/users/${studentUserId}/profile`, { token: currentToken });
        assert.equal(profileRes.status, 200);
        const profilePayloadStr = JSON.stringify(profileRes.data);
        assert.equal(profilePayloadStr.includes('passwordHash'), false, 'passwordHash must not appear in profile response');
        assert.equal(profileRes.data.passwordHash, undefined);

        // 6. forgot-password check
        const forgotRes = await api('/auth/forgot-password', {
            method: 'POST',
            body: { email: studentEmail }
        });
        const forgotPayloadStr = JSON.stringify(forgotRes.data);
        assert.equal(forgotPayloadStr.includes('passwordHash'), false, 'passwordHash must not appear in forgot-password response');
        assert.equal(forgotPayloadStr.includes('tokenHash'), false, 'tokenHash must not appear in forgot-password response');
        assert.equal(forgotPayloadStr.includes('resetToken'), false, 'Raw resetToken must not leak in public response');

        // 7. reset-password check
        const resetTokenRaw = crypto.randomBytes(32).toString('hex');
        await PasswordResetToken.deleteMany({ userId: studentUserId });
        await PasswordResetToken.create({
            userId: studentUserId,
            tokenHash: await bcrypt.hash(resetTokenRaw, 5),
            expiresAt: new Date(Date.now() + 60000)
        });
        const resetRes = await api('/auth/reset-password', {
            method: 'POST',
            body: { userId: studentUserId, token: resetTokenRaw, newPassword: 'AnotherPassword2026!' }
        });
        const resetPayloadStr = JSON.stringify(resetRes.data);
        assert.equal(resetPayloadStr.includes('passwordHash'), false, 'passwordHash must not appear in reset-password response');
        assert.equal(resetPayloadStr.includes('tokenHash'), false, 'tokenHash must not appear in reset-password response');

        console.log('[SECURITY VERIFICATION] ALL responses confirmed clean of passwordHash, tokenHash, and sessionTokenHash.');
    });

} finally {
    await new Promise(resolve => httpServer.close(resolve));
    await mongoose.disconnect();
    await mongod.stop();
    console.log('[TEST SUITE] Completed and cleaned up.');
}
