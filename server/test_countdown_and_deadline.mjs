import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { calculateRemainingTime } from '../src/lib/countdown.js';

test('=== CODESRIJAN SUBMISSION COUNTDOWN & DEADLINE TEST SUITE (10 CHECKS) ===', async (t) => {
    // -------------------------------------------------------------
    // CHECK 1: Valid future deadline (> 24 hours) preserves total hours & days
    // -------------------------------------------------------------
    await t.test('Check 1: Deadline 42 hours in future computes totalHours=42, days=1, hours=18 without discarding days', () => {
        const now = new Date('2026-10-27T00:00:00.000Z').getTime();
        const deadline = new Date('2026-10-28T18:30:15.000Z').getTime(); // 42h 30m 15s later
        
        const res = calculateRemainingTime(new Date(deadline).toISOString(), now);
        assert.equal(res.isConfigured, true, 'Deadline should be marked configured');
        assert.equal(res.isExpired, false, 'Deadline should not be expired');
        assert.equal(res.totalHours, 42, 'Total hours must be 42 (not truncated to 18)');
        assert.equal(res.days, 1, 'Days should be 1');
        assert.equal(res.hours, 18, 'Remainder hours should be 18');
        assert.equal(res.minutes, 30, 'Minutes should be 30');
        assert.equal(res.seconds, 15, 'Seconds should be 15');
        assert.equal(res.urgency, 'normal', 'Urgency should be normal when > 6 hours remain');
    });

    // -------------------------------------------------------------
    // CHECK 2: Hour rollover (exactly 1 hour, 0 minutes, 0 seconds)
    // -------------------------------------------------------------
    await t.test('Check 2: Exact 1-hour rollover computes 1h 0m 0s cleanly', () => {
        const now = 1000000000;
        const deadline = now + 3600 * 1000; // +1 hour exactly

        const res = calculateRemainingTime(new Date(deadline).toISOString(), now);
        assert.equal(res.totalHours, 1);
        assert.equal(res.minutes, 0);
        assert.equal(res.seconds, 0);
        assert.equal(res.isExpired, false);
        assert.equal(res.urgency, 'warning', '1 hour threshold enters warning phase');
    });

    // -------------------------------------------------------------
    // CHECK 3: Minute rollover (59 seconds remaining)
    // -------------------------------------------------------------
    await t.test('Check 3: Less than one minute remaining computes 0h 0m 59s with critical urgency', () => {
        const now = 1000000000;
        const deadline = now + 59 * 1000; // 59 seconds

        const res = calculateRemainingTime(new Date(deadline).toISOString(), now);
        assert.equal(res.totalHours, 0);
        assert.equal(res.minutes, 0);
        assert.equal(res.seconds, 59);
        assert.equal(res.isExpired, false);
        assert.equal(res.urgency, 'critical', '< 1 hour triggers critical urgency');
    });

    // -------------------------------------------------------------
    // CHECK 4: Critical urgency threshold (< 1 hour remaining)
    // -------------------------------------------------------------
    await t.test('Check 4: 45 minutes remaining triggers critical urgency state', () => {
        const now = 1000000000;
        const deadline = now + 45 * 60 * 1000; // 45 minutes

        const res = calculateRemainingTime(new Date(deadline).toISOString(), now);
        assert.equal(res.totalHours, 0);
        assert.equal(res.minutes, 45);
        assert.equal(res.seconds, 0);
        assert.equal(res.urgency, 'critical');
    });

    // -------------------------------------------------------------
    // CHECK 5: Warning urgency threshold (< 6 hours remaining)
    // -------------------------------------------------------------
    await t.test('Check 5: 4 hours remaining triggers warning urgency state', () => {
        const now = 1000000000;
        const deadline = now + 4 * 3600 * 1000 + 15 * 60 * 1000; // 4h 15m

        const res = calculateRemainingTime(new Date(deadline).toISOString(), now);
        assert.equal(res.totalHours, 4);
        assert.equal(res.minutes, 15);
        assert.equal(res.urgency, 'warning');
    });

    // -------------------------------------------------------------
    // CHECK 6: Expired deadline clamps to 0 and stops
    // -------------------------------------------------------------
    await t.test('Check 6: Past deadline clamps cleanly to 0 with no negative numbers or NaN', () => {
        const now = new Date('2026-10-27T10:00:00.000Z').getTime();
        const deadline = new Date('2026-10-26T15:00:00.000Z').getTime(); // yesterday

        const res = calculateRemainingTime(new Date(deadline).toISOString(), now);
        assert.equal(res.isExpired, true, 'Should be marked expired');
        assert.equal(res.isConfigured, true, 'Should be marked configured');
        assert.equal(res.totalHours, 0, 'totalHours clamped to 0');
        assert.equal(res.hours, 0, 'hours clamped to 0');
        assert.equal(res.minutes, 0, 'minutes clamped to 0');
        assert.equal(res.seconds, 0, 'seconds clamped to 0');
        assert.equal(res.urgency, 'expired', 'urgency marked expired');
    });

    // -------------------------------------------------------------
    // CHECK 7: Null or undefined deadline handled safely
    // -------------------------------------------------------------
    await t.test('Check 7: Null or undefined deadline returns unconfigured state without error', () => {
        const resNull = calculateRemainingTime(null);
        assert.equal(resNull.isConfigured, false);
        assert.equal(resNull.isExpired, false);
        assert.equal(resNull.urgency, 'unconfigured');

        const resUndef = calculateRemainingTime(undefined);
        assert.equal(resUndef.isConfigured, false);
        assert.equal(resUndef.isExpired, false);
        assert.equal(resUndef.urgency, 'unconfigured');
    });

    // -------------------------------------------------------------
    // CHECK 8: Malformed or unparseable date strings
    // -------------------------------------------------------------
    await t.test('Check 8: Malformed date string returns unconfigured state safely without throwing', () => {
        const resInvalid = calculateRemainingTime('not-a-valid-date-stamp');
        assert.equal(resInvalid.isConfigured, false);
        assert.equal(resInvalid.isExpired, false);
        assert.equal(resInvalid.urgency, 'unconfigured');
        assert.equal(resInvalid.totalHours, 0);
    });

    // -------------------------------------------------------------
    // CHECK 9: Multi-day deadline (e.g. 5 days, 12 hours)
    // -------------------------------------------------------------
    await t.test('Check 9: 5.5 day deadline correctly computes totalHours=132 and days=5', () => {
        const now = 1000000000;
        const diffMs = (5 * 24 + 12) * 3600 * 1000 + 40 * 60 * 1000 + 20 * 1000; // 132h 40m 20s
        const deadline = now + diffMs;

        const res = calculateRemainingTime(new Date(deadline).toISOString(), now);
        assert.equal(res.totalHours, 132);
        assert.equal(res.days, 5);
        assert.equal(res.hours, 12);
        assert.equal(res.minutes, 40);
        assert.equal(res.seconds, 20);
        assert.equal(res.urgency, 'normal');
    });

    // -------------------------------------------------------------
    // CHECK 10: Server-side submission deadline enforcement test
    // -------------------------------------------------------------
    await t.test('Check 10: Backend server enforces submissionDeadline independently and rejects late payload', async () => {
        const mongo = await MongoMemoryServer.create();
        const testUri = mongo.getUri();

        process.env.NODE_ENV = 'test';
        process.env.MONGO_URI = testUri;
        process.env.MONGO_DB_NAME = 'deadline_test_db';
        process.env.JWT_SECRET = 'test_secret_for_deadline_test_123';

        const { app } = await import('./server.js');
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connection.asPromise();
        }
        const Hackathon = mongoose.model('Hackathon');
        const Team = mongoose.model('Team');
        const User = mongoose.model('User');
        const Session = mongoose.model('Session');

        // Create expired hackathon
        const expiredHack = await Hackathon.create({
            id: 'hack-expired-test',
            name: 'Expired Test Hackathon',
            status: 'active',
            submissionDeadline: new Date(Date.now() - 3600000) // 1 hour ago
        });

        // Create leader user & team
        const leader = await User.create({
            id: 'usr-leader-deadline',
            email: 'leader_deadline@test.com',
            name: 'Leader Deadline',
            role: 'student',
            accountStatus: 'active',
            emailVerified: true
        });

        const team = await Team.create({
            id: 'team-deadline-test',
            name: 'Deadline Squad',
            leaderId: leader.id,
            hackathonId: expiredHack.id,
            memberIds: [leader.id]
        });

        const rawToken = crypto.randomBytes(32).toString('hex');
        const sessionTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        await Session.create({
            id: `sess-${Date.now()}`,
            userId: leader.id,
            sessionTokenHash,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 86400000)
        });

        // Start test HTTP server
        const server = http.createServer(app);
        await new Promise(resolve => server.listen(0, resolve));
        const port = server.address().port;
        const baseUrl = `http://localhost:${port}`;

        // Attempt submission after deadline via native fetch
        const resp = await fetch(`${baseUrl}/api/teams/${team.id}/submit`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${rawToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ description: 'Late project submission' })
        });

        const data = await resp.json();

        assert.equal(resp.status, 403, 'Late submission must be rejected with HTTP 403');
        assert.match(data.message, /Submission deadline has elapsed/i, 'Error message must explicitly mention elapsed submission deadline');

        await new Promise(resolve => server.close(resolve));
        await mongoose.disconnect();
        await mongo.stop();
    });
});
