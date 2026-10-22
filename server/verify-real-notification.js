// Sends exactly one real admin notification; all application data stays disposable/local.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

if (!process.argv.includes('--send')) {
    console.log('No email sent. Explicit --send is required for the one-message delivery check.');
    process.exit(0);
}

const reference = `QA-ONLY-NO-PAYMENT-${Date.now()}`;
let mongo, httpServer, relayAttempts = 0, relayAcceptance;
const originalFetch = globalThis.fetch;
try {
    const relayUrl = fs.readFileSync(new URL('.apps_script_url.tmp', import.meta.url), 'utf8').trim();
    const relaySecret = fs.readFileSync(new URL('.apps_script_secret.tmp', import.meta.url), 'utf8').trim();
    assert.ok(relayUrl.startsWith('https://script.google.com/macros/s/') && relaySecret);
    mongo = await MongoMemoryServer.create();
    process.env.NODE_ENV = 'test';
    process.env.MONGO_URI = mongo.getUri('codesrijan_test_real_notification');
    process.env.MONGO_DB_NAME = 'codesrijan_test_real_notification';
    process.env.APPS_SCRIPT_URL = relayUrl;
    process.env.APPS_SCRIPT_SECRET = relaySecret;
    process.env.ADMIN_NOTIFICATION_EMAIL = 'codesrijan@gmail.com';
    process.env.FRONTEND_URL = 'https://codesrijan-nine.vercel.app';
    for (const key of ['GMAIL_USER', 'GMAIL_APP_PASSWORD', 'EMAIL_USER', 'EMAIL_PASS', 'SEED_ADMIN_PASSWORD', 'SEED_STUDENT_PASSWORD']) process.env[key] = '';
    globalThis.fetch = async (url, options) => {
        if (String(url) === relayUrl) {
            if (++relayAttempts > 1) throw new Error('One-message delivery check exhausted.');
            const payload = JSON.parse(options.body);
            assert.equal(payload.template, 'payment_review_notification');
            assert.equal(payload.to, process.env.ADMIN_NOTIFICATION_EMAIL);
            const response = await originalFetch(url, options);
            const result = await response.clone().json();
            const knownErrors = [
                'Invalid cryptographic signature.',
                'Payment notifications require the configured administrator recipient.',
                'Unsupported template: payment_review_notification',
                'Request expired or clock drift exceeds 5 minutes.',
                'Relay secret unconfigured in Script Properties.'
            ];
            relayAcceptance = {
                success: result.success === true,
                remainingQuota: result.remainingQuota ?? null,
                reason: result.success ? null : (knownErrors.includes(result.error) ? result.error : 'Other relay rejection (raw response withheld)')
            };
            return response;
        }
        return originalFetch(url, options);
    };
    ({ httpServer } = await import('./server.js'));
    await mongoose.connection.asPromise();
    const { User, Hackathon, Registration } = await import('./models/index.js');
    const { Session } = await import('./models/auth.js');
    const token = crypto.randomBytes(32).toString('hex');
    await User.create({ id: reference, email: 'qa-only@example.test', name: 'QA ONLY / NO PAYMENT', role: 'student', accountStatus: 'active', emailVerified: true });
    await Session.create({ userId: reference, sessionTokenHash: crypto.createHash('sha256').update(token).digest('hex'), expiresAt: new Date(Date.now() + 300000) });
    await Hackathon.create({ id: reference, name: 'QA ONLY / NO PAYMENT — isolated notification delivery check', entryType: 'paid', fee: 0, currency: 'INR' });
    await Registration.create({ id: reference, hackathonId: reference, userId: reference, entryType: 'paid', feeAmount: 0, currency: 'INR', paymentStatus: 'pending_proof', status: 'awaiting_payment_proof' });
    await new Promise(resolve => httpServer.listen(0, '127.0.0.1', resolve));
    const response = await fetch(`http://127.0.0.1:${httpServer.address().port}/api/hackathons/${reference}/payment-proof`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ transactionReference: reference, paymentProofUrl: 'data:image/png;base64,UUEgT05MWSAvIE5PIFBBWU1FTlQ=' })
    });
    await response.arrayBuffer();
    const saved = await Registration.findOne({ id: reference });
    console.log(JSON.stringify({ reference, httpStatus: response.status, paymentStatus: saved?.paymentStatus, notificationStatus: saved?.paymentNotificationStatus, relayAttempts, relayAcceptance, productionDataCreated: false, inboxReceipt: 'awaiting independent inbox verification' }));
    assert.equal(response.status, 200);
    assert.equal(relayAttempts, 1);
    assert.equal(saved.paymentStatus, 'payment_under_review');
    assert.equal(saved.paymentNotificationStatus, 'sent');
    assert.equal(relayAcceptance?.success, true);
} catch {
    console.error('Controlled notification check failed. Do not rerun automatically: first check inbox/relay evidence for an already delivered message.');
    process.exitCode = 1;
} finally {
    globalThis.fetch = originalFetch;
    if (httpServer?.listening) await new Promise(resolve => httpServer.close(resolve));
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
}
