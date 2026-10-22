import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User, Registration } from './models/index.js';
import { EmailVerification, Session } from './models/auth.js';
import { setTestAppsScriptDispatcher, setTestTransporter } from './services/email.js';
const mongod = await MongoMemoryServer.create({ binary: { systemBinary: process.env.MONGOMS_SYSTEM_BINARY || path.join(os.homedir(), '.cache/mongodb-binaries/mongod-x64-win32-8.2.6.exe') } });
process.env.MONGO_URI = mongod.getUri('codesrijan_test_security');
process.env.MONGO_DB_NAME = 'codesrijan_test_security';
process.env.SEED_ADMIN_PASSWORD = '';
process.env.SEED_STUDENT_PASSWORD = '';
setTestAppsScriptDispatcher(async () => ({ success: true, messageId: 'mock' }));
setTestTransporter({ sendMail: async () => ({ messageId: 'mock', accepted: ['mock'] }) });
await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB_NAME });
const { httpServer } = await import('./server.js');
await new Promise(resolve => httpServer.listen(0, '127.0.0.1', resolve));
const base = 'http://127.0.0.1:' + httpServer.address().port + '/api';
const call = (path, body, token) => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify(body) });
async function pending(id, attempts = 0, extras = {}) {
    await User.create({ id, email: id + '@example.invalid', name: id, role: 'student' });
    return EmailVerification.create({ userId: id, tokenHash: await bcrypt.hash('749238', 4), expiresAt: new Date(Date.now() + 600000), lastResendAt: new Date(Date.now() - 61000), attempts, ...extras });
}
try {
    await test('parallel OTP consumption permits one session only', async () => {
        await pending('consume');
        const results = await Promise.all(Array.from({ length: 6 }, () => call('/auth/verify-email', { userId: 'consume', code: '749238' })));
        assert.equal(results.filter(r => r.status === 200).length, 1);
        assert.equal(await Session.countDocuments({ userId: 'consume' }), 1);
    });
    await test('verification cannot reactivate a disabled account', async () => {
        await pending('disabled-after-issue');
        await User.updateOne({ id: 'disabled-after-issue' }, { $set: { accountStatus: 'disabled' } });
        assert.notEqual((await call('/auth/verify-email', { userId: 'disabled-after-issue', code: '749238' })).status, 200);
        assert.equal((await User.findOne({ id: 'disabled-after-issue' })).accountStatus, 'disabled');
        assert.equal(await Session.countDocuments({ userId: 'disabled-after-issue' }), 0);
    });
    await test('parallel bad attempts cannot exceed five or lose increments', async () => {
        await pending('brute');
        await Promise.all(Array.from({ length: 10 }, () => call('/auth/verify-email', { userId: 'brute', code: '000000' })));
        const row = await EmailVerification.findOne({ userId: 'brute' });
        assert.equal(row.attempts, 5); assert.ok(row.lockedUntil > new Date());
        assert.equal((await call('/auth/resend-otp', { userId: 'brute' })).status, 429);
        assert.equal((await call('/auth/register', { name: 'Changed', email: 'brute@example.invalid', password: 'ChangedPassword123' })).status, 429);
        assert.equal((await EmailVerification.findOne({ userId: 'brute' })).attempts, 5);
    });
    await test('resend preserves failed attempts and enforces hourly budget', async () => {
        await pending('resend', 3);
        assert.equal((await call('/auth/resend-otp', { userId: 'resend' })).status, 200);
        let row = await EmailVerification.findOne({ userId: 'resend' }); assert.equal(row.attempts, 3);
        await EmailVerification.updateOne({ _id: row._id }, { $set: { lastResendAt: new Date(Date.now() - 61000), resendCount: 5 } });
        assert.equal((await call('/auth/resend-otp', { userId: 'resend' })).status, 429);
    });
    await test('parallel resend requests rotate one code only', async () => {
        await pending('parallel-resend');
        const results = await Promise.all(Array.from({ length: 5 }, () => call('/auth/resend-otp', { userId: 'parallel-resend' })));
        assert.equal(results.filter(r => r.status === 200).length, 1);
        assert.equal(results.filter(r => r.status === 429).length, 4);
    });
    await test('email prefix never grants administrator during registration', async () => {
        const result = await call('/auth/register', { name: 'Prefix test', email: 'admin.prefix@example.invalid', password: 'StrongPassword123' });
        assert.equal(result.status, 201);
        assert.equal((await User.findOne({ email: 'admin.prefix@example.invalid' })).role, 'student');
    });
    await test('reset email ignores attacker Origin', async () => {
        let delivered;
        process.env.FRONTEND_URL = 'https://trusted.example.invalid';
        setTestAppsScriptDispatcher(async (template, to, data) => { delivered = data; return { success: true }; });
        await User.create({ id: 'reset-origin', email: 'reset-origin@example.invalid', role: 'student' });
        const response = await fetch(base + '/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://attacker.example.invalid' }, body: JSON.stringify({ email: 'reset-origin@example.invalid' }) });
        assert.equal(response.status, 200);
        assert.equal((await response.text()).includes('token='), false);
        assert.equal(new URL(delivered.resetLink).origin, 'https://trusted.example.invalid');
        setTestAppsScriptDispatcher(async () => ({ success: true, messageId: 'mock' }));
    });
    await test('review requires submitted proof and competing decisions have one winner', async () => {
        const token = 'local-admin-test';
        await User.create({ id: 'review-admin', email: 'review@example.invalid', role: 'admin', accountStatus: 'active', emailVerified: true });
        await Session.create({ userId: 'review-admin', sessionTokenHash: crypto.createHash('sha256').update(token).digest('hex'), expiresAt: new Date(Date.now() + 600000) });
        await Registration.create({ id: 'review', hackathonId: 'event', userId: 'owner', status: 'awaiting_payment_proof', paymentStatus: 'pending_proof' });
        assert.equal((await call('/admin/payments/review/review', { decision: 'approve' }, token)).status, 409);
        await Registration.updateOne({ id: 'review' }, { $set: { status: 'payment_under_review', paymentStatus: 'payment_under_review', transactionReference: 'TEST123', paymentProofUrl: 'data:image/png;base64,AAAA' } });
        const responses = await Promise.all([call('/admin/payments/review/review', { decision: 'approve' }, token), call('/admin/payments/review/review', { decision: 'reject', reason: 'Mismatch' }, token)]);
        assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]);
        assert.equal((await Registration.findOne({ id: 'review' })).reviewHistory.length, 1);
    });
} finally {
    await new Promise(resolve => httpServer.close(resolve));
    await mongoose.disconnect();
    await mongod.stop();
}
