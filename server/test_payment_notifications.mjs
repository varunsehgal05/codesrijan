// Fully isolated: no production database or external email calls.
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { setTestAppsScriptDispatcher, sendPaymentReviewNotification, sendVerificationEmail, sendPasswordResetEmail } from './services/email.js';

const properties = { CODESRIJAN_RELAY_SECRET: 'local-test-secret', ADMIN_NOTIFICATION_EMAIL: 'admin@example.test', FRONTEND_URL: 'https://example.test' };
const data = { eventName: '<img src=x onerror=alert(1)>', registrationName: 'QA squad', registrationReference: 'qa-reg', feeAmount: 100, currency: 'INR', transactionReference: 'QA-123456', submittedAt: new Date().toISOString(), reviewUrl: 'https://example.test/admin/payments' };

test('relay authenticates, restricts payment recipients/templates, escapes HTML and preserves existing templates', () => {
    const sent = [], cache = new Map();
    const relay = vm.createContext({
        PropertiesService: { getScriptProperties: () => ({ getProperty: key => properties[key] }) },
        LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
        CacheService: { getScriptCache: () => ({ get: key => cache.get(key), put: (key, value) => cache.set(key, value) }) },
        Utilities: { computeHmacSha256Signature: (message, secret) => [...crypto.createHmac('sha256', secret).update(message).digest()] },
        MailApp: { getRemainingDailyQuota: () => 100, sendEmail: mail => sent.push(mail) },
        ContentService: { MimeType: { JSON: 'json' }, createTextOutput: value => ({ value, setMimeType() {} }) }
    });
    vm.runInContext(fs.readFileSync(new URL('../google-apps-script/Code.gs', import.meta.url), 'utf8'), relay);
    const request = (template, to, body, forged = false) => {
        const timestamp = Date.now(), nonce = crypto.randomBytes(16).toString('hex');
        const signature = crypto.createHmac('sha256', forged ? 'wrong' : properties.CODESRIJAN_RELAY_SECRET).update(`${timestamp}.${nonce}.${template}.${to}.${JSON.stringify(body)}`).digest('hex');
        const payload = { auth: { timestamp, nonce, signature }, template, to, data: body };
        const result = JSON.parse(relay.doPost({ postData: { contents: JSON.stringify(payload) } }).value);
        return { result, payload };
    };
    assert.equal(request('payment_review_notification', properties.ADMIN_NOTIFICATION_EMAIL, data, true).result.success, false);
    assert.equal(request('arbitrary_html', properties.ADMIN_NOTIFICATION_EMAIL, data).result.success, false);
    assert.equal(request('payment_review_notification', 'attacker@example.test', data).result.success, false);
    assert.equal(request('payment_review_notification', properties.ADMIN_NOTIFICATION_EMAIL, { ...data, reviewUrl: 'https://evil.test' }).result.success, false);
    assert.equal(request('payment_review_notification', properties.ADMIN_NOTIFICATION_EMAIL, { ...data, eventName: '' }).result.success, false);
    const { result, payload } = request('payment_review_notification', properties.ADMIN_NOTIFICATION_EMAIL, data);
    assert.equal(result.success, true);
    assert.equal(sent.length, 1);
    assert.ok(sent[0].htmlBody.includes('&lt;img'));
    assert.ok(!sent[0].htmlBody.includes('<img'));
    assert.equal(JSON.parse(relay.doPost({ postData: { contents: JSON.stringify(payload) } }).value).success, false);
    assert.ok(relay.renderTemplate('verification_otp', { code: '123456' }));
    assert.ok(relay.renderTemplate('password_reset', { resetLink: 'https://example.test/reset' }));
    assert.ok(relay.renderTemplate('welcome', { name: 'QA' }));
});

test('actual payment endpoint persists one submission and dispatches once across concurrent retries; failure retains queue', async () => {
    const mongo = await MongoMemoryServer.create();
    process.env.NODE_ENV = 'test';
    process.env.MONGO_URI = mongo.getUri();
    process.env.ADMIN_NOTIFICATION_EMAIL = properties.ADMIN_NOTIFICATION_EMAIL;
    process.env.FRONTEND_URL = properties.FRONTEND_URL;
    const calls = [];
    let fail = false;
    setTestAppsScriptDispatcher(async (template, to, body) => { calls.push({ template, to, body }); return { success: !fail }; });
    let httpServer;
    try {
        ({ httpServer } = await import('./server.js'));
        await mongoose.connection.asPromise();
        const { User, Team, Hackathon, Registration } = await import('./models/index.js');
        const { Session } = await import('./models/auth.js');
        await Registration.init();
        for (const role of ['student', 'admin']) {
            await User.create({ id: `qa-${role}`, name: 'QA', email: `${role}@example.test`, role, accountStatus: 'active', emailVerified: true });
            await Session.create({ userId: `qa-${role}`, sessionTokenHash: crypto.createHash('sha256').update(`local-${role}`).digest('hex'), expiresAt: new Date(Date.now() + 60000) });
        }
        await Hackathon.create({ id: 'qa-event', name: 'QA event' });
        await Registration.create({ id: 'qa-reg', hackathonId: 'qa-event', userId: 'qa-student', entryType: 'paid', feeAmount: 100, paymentStatus: 'pending_proof', status: 'awaiting_payment_proof' });
        await new Promise(resolve => httpServer.listen(0, '127.0.0.1', resolve));
        const base = `http://127.0.0.1:${httpServer.address().port}`;
        await Hackathon.create({ id: 'qa-roster-event', name: 'QA roster event', status: 'registration_open', entryType: 'paid', fee: 100, feeBasis: 'per_participant', teamSizeMin: 1, teamSizeMax: 1 });
        await Team.create({ id: 'qa-team', name: 'QA team', leaderId: 'qa-student', memberIds: ['qa-student', 'qa-student'] });
        const registerTeam = () => fetch(`${base}/api/hackathons/qa-roster-event/register`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer local-student' },
            body: JSON.stringify({ type: 'team', teamId: 'qa-team' })
        });
        const rosterResponse = await registerTeam();
        assert.equal(rosterResponse.status, 200);
        const roster = (await rosterResponse.json()).registration;
        assert.equal(roster.feeAmount, 100);
        assert.equal(roster.rosterMembers.length, 1);
        await Registration.deleteOne({ id: roster.id });
        await Team.updateOne({ id: 'qa-team' }, { $set: { memberIds: ['missing-account'] } });
        await Hackathon.updateOne({ id: 'qa-roster-event' }, { $set: { teamSizeMax: 3 } });
        assert.equal((await registerTeam()).status, 400);
        const submit = () => fetch(`${base}/api/hackathons/qa-event/payment-proof`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer local-student' },
            body: JSON.stringify({ transactionReference: 'QA-123456', paymentProofUrl: 'https://private.example.test/receipt', to: 'attacker@example.test', subject: 'untrusted', html: '<script>' })
        });
        const responses = await Promise.all([submit(), submit()]);
        assert.equal(responses.filter(response => response.ok).length, 1);
        assert.equal(await Registration.countDocuments({ paymentStatus: 'payment_under_review' }), 1);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].template, 'payment_review_notification');
        assert.equal(calls[0].to, properties.ADMIN_NOTIFICATION_EMAIL);
        assert.equal(calls[0].body.reviewUrl, data.reviewUrl);
        assert.ok(!JSON.stringify(calls).includes('private.example.test'));
        assert.ok(!JSON.stringify(calls).includes('untrusted'));
        assert.equal((await Registration.findOne({ id: 'qa-reg' })).paymentNotificationStatus, 'sent');
        assert.equal((await submit()).status, 400);
        assert.equal(calls.length, 1);
        await Registration.updateOne({ id: 'qa-reg' }, { $set: { paymentStatus: 'rejected', status: 'rejected' } });
        fail = true;
        assert.equal((await submit()).status, 200);
        assert.equal(calls.length, 2);
        const saved = await Registration.findOne({ id: 'qa-reg' });
        assert.equal(saved.paymentStatus, 'payment_under_review');
        assert.equal(saved.paymentNotificationStatus, 'failed');
        const queue = await (await fetch(`${base}/api/admin/payments`, { headers: { Authorization: 'Bearer local-admin' } })).json();
        assert.equal(queue.summary.pendingCount, 1);
        await sendVerificationEmail('student@example.test', '123456');
        await sendPasswordResetEmail('student@example.test', 'https://example.test/reset');
        assert.equal(calls.at(-2).template, 'verification_otp');
        assert.equal(calls.at(-1).template, 'password_reset');
        delete process.env.FRONTEND_URL;
        assert.equal((await sendPaymentReviewNotification(saved, 'QA', 'QA')).success, false);
    } finally {
        setTestAppsScriptDispatcher(null);
        if (httpServer?.listening) await new Promise(resolve => httpServer.close(resolve));
        await mongoose.disconnect();
        await mongo.stop();
    }
});

