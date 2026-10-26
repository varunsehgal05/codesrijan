import test from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import http from 'http';

test('=== CODESRIJAN 1.0 — PLATFORM HEALTH, OPERATIONS, SUPPORT & AUDIT SUITE ===', async (t) => {
    // 1. Setup MongoMemoryServer
    const mongo = await MongoMemoryServer.create();
    process.env.NODE_ENV = 'test';
    process.env.MONGO_URI = mongo.getUri();
    process.env.MONGO_DB_NAME = 'admin_health_ops_test_db';
    process.env.JWT_SECRET = 'test_jwt_secret_codesrijan_123456';

    const {
        app,
        logAdminActivity,
        isTicketStatusActive
    } = await import('./server.js');
    const { getStorageStats } = await import('./services/storage.js');

    const User = mongoose.model('User');
    const Session = mongoose.model('Session');
    const Hackathon = mongoose.model('Hackathon');
    const Registration = mongoose.model('Registration');
    const Team = mongoose.model('Team');
    const Submission = mongoose.model('Submission');
    const SupportTicket = mongoose.model('SupportTicket');
    const ActivityLog = mongoose.model('ActivityLog');

    // Create Test Server
    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;

    // Create Test Users & Tokens
    const adminUser = await User.create({
        id: 'usr-admin-ops',
        name: 'Chief Admin',
        email: 'admin.ops@codesrijan.com',
        role: 'admin',
        isVerified: true,
        accountStatus: 'active',
        emailVerified: true
    });

    const studentUser = await User.create({
        id: 'usr-student-ops',
        name: 'Student Operative',
        email: 'student.ops@codesrijan.com',
        role: 'student',
        isVerified: true,
        accountStatus: 'active',
        emailVerified: true
    });

    const adminToken = jwt.sign(
        { id: adminUser.id, email: adminUser.email, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
    const crypto = await import('crypto');
    const adminTokenHash = crypto.createHash('sha256').update(adminToken).digest('hex');
    await Session.create({
        id: 'sess-admin-ops',
        userId: adminUser.id,
        sessionTokenHash: adminTokenHash,
        expiresAt: new Date(Date.now() + 3600000)
    });

    const studentToken = jwt.sign(
        { id: studentUser.id, email: studentUser.email, role: 'student' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
    const studentTokenHash = crypto.createHash('sha256').update(studentToken).digest('hex');
    await Session.create({
        id: 'sess-student-ops',
        userId: studentUser.id,
        sessionTokenHash: studentTokenHash,
        expiresAt: new Date(Date.now() + 3600000)
    });

    // Helper request function
    const makeRequest = async (path, options = {}) => {
        const url = `${baseUrl}${path}`;
        const res = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        const contentType = res.headers.get('content-type') || '';
        let body;
        if (contentType.includes('application/json')) {
            body = await res.json();
        } else {
            body = await res.text();
        }
        return { status: res.status, headers: res.headers, body };
    };

    // -------------------------------------------------------------
    // Scenario 1: Storage Statistics & Budget Telemetry (Feature 1)
    // -------------------------------------------------------------
    await t.test('Scenario 1: Storage Stats returns valid budget headroom and operational status', async () => {
        const stats = await getStorageStats();
        assert.ok(stats, 'Storage stats should be returned');
        assert.equal(stats.provider, 'gridfs');
        assert.equal(stats.status, 'operational');
        assert.equal(typeof stats.budgetBytes, 'number');
        assert.equal(typeof stats.remainingBudgetBytes, 'number');
        assert.equal(typeof stats.usagePercent, 'number');
        assert.ok(stats.budgetBytes >= 75 * 1024 * 1024, 'Storage budget should be at least 75MB');
        assert.ok(stats.remainingBudgetBytes <= stats.budgetBytes, 'Remaining budget cannot exceed total budget');
    });

    // -------------------------------------------------------------
    // Scenario 2: Admin Platform Health Endpoint (Feature 1)
    // -------------------------------------------------------------
    await t.test('Scenario 2: GET /api/admin/health security and metrics aggregation', async () => {
        // 2a. Deny unauthenticated requests
        const unauthRes = await makeRequest('/api/admin/health');
        assert.equal(unauthRes.status, 401, 'Unauthenticated request must be denied with 401');

        // 2b. Deny student role
        const studentRes = await makeRequest('/api/admin/health', {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        assert.equal(studentRes.status, 403, 'Student role must be denied access with 403');

        // 2c. Authorize admin
        const adminRes = await makeRequest('/api/admin/health', {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert.equal(adminRes.status, 200, 'Admin must receive 200 OK');
        assert.equal(adminRes.body.status, 'operational');
        assert.ok(adminRes.body.services.backend.uptimeSeconds >= 0);
        assert.equal(adminRes.body.services.database.status, 'operational');
        assert.equal(adminRes.body.services.storage.provider, 'gridfs');
        assert.ok(adminRes.body.operationalMetrics, 'Operational metrics must be present');
        assert.equal(typeof adminRes.body.operationalMetrics.pendingPaymentReviews, 'number');
        assert.equal(typeof adminRes.body.operationalMetrics.activeSupportTickets, 'number');
    });

    // -------------------------------------------------------------
    // Scenario 3: Hackathon Operations Dashboard (Feature 2)
    // -------------------------------------------------------------
    await t.test('Scenario 3: GET /api/admin/hackathon-operations calculates real phases and counts', async () => {
        // Create sample hackathon
        const hackathon = await Hackathon.create({
            id: 'hk-ops-test-01',
            name: 'CodeSrijan Alpha Hack',
            status: 'active',
            fee: 150,
            currency: 'INR',
            startDate: new Date(Date.now() - 3600000), // 1 hr ago (live)
            endDate: new Date(Date.now() + 86400000), // 24 hrs from now
            submissionDeadline: new Date(Date.now() + 80000000),
            registrationDeadline: new Date(Date.now() - 1800000),
            problemStatementsRevealed: true
        });

        // Create sample team and registration
        await Team.create({
            id: 'tm-ops-01',
            name: 'Vanguard Cyber',
            hackathonId: hackathon.id,
            leaderId: studentUser.id,
            memberIds: [studentUser.id],
            status: 'active'
        });

        await Registration.create({
            id: 'reg-ops-01',
            hackathonId: hackathon.id,
            userId: studentUser.id,
            teamId: 'tm-ops-01',
            paymentStatus: 'verified',
            feeAmount: 150,
            status: 'registered'
        });

        // 3a. Deny non-admin
        const studentRes = await makeRequest('/api/admin/hackathon-operations', {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        assert.equal(studentRes.status, 403, 'Non-admin denied access');

        // 3b. Admin retrieves accurate operations
        const adminRes = await makeRequest('/api/admin/hackathon-operations', {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert.equal(adminRes.status, 200);
        assert.ok(Array.isArray(adminRes.body.operations));
        const found = adminRes.body.operations.find(o => o.id === hackathon.id);
        assert.ok(found, 'Created hackathon should be present in operations');
        assert.equal(found.isPaid, true);
        assert.equal(found.fee, 150);
        assert.equal(found.phase, 'hacking');
        assert.equal(found.metrics.totalRegistrations, 1);
        assert.equal(found.metrics.verifiedRegistrations, 1);
        assert.equal(found.metrics.activeSquads, 1);
    });

    // -------------------------------------------------------------
    // Scenario 4: Hackathon Roster CSV Export (Feature 2)
    // -------------------------------------------------------------
    await t.test('Scenario 4: GET /api/admin/hackathons/:id/export-csv sanitizes and formats CSV', async () => {
        // 4a. Deny non-admin
        const studentRes = await makeRequest('/api/admin/hackathons/hk-ops-test-01/export-csv', {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        assert.equal(studentRes.status, 403);

        // 4b. Admin receives CSV with proper headers
        const adminRes = await makeRequest('/api/admin/hackathons/hk-ops-test-01/export-csv', {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert.equal(adminRes.status, 200);
        assert.ok(adminRes.headers.get('content-type').includes('text/csv'));
        assert.ok(adminRes.headers.get('content-disposition').includes('attachment; filename="hackathon-hk-ops-test-01-roster.csv"'));
        assert.ok(adminRes.body.includes('Registration ID') && adminRes.body.includes('Squad Name'));
        assert.ok(adminRes.body.includes('reg-ops-01'));
        assert.ok(adminRes.body.includes('Vanguard Cyber'));
    });

    // -------------------------------------------------------------
    // Scenario 5: Support Ticket Categories & Role Separation (Feature 3)
    // -------------------------------------------------------------
    await t.test('Scenario 5: Support ticket categories, affected page, and admin barrier', async () => {
        // 5a. Admin cannot create student support ticket from student endpoint
        const adminTry = await makeRequest('/api/support', {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({
                subject: 'Admin trying student ticket',
                description: 'Should be blocked by server'
            })
        });
        assert.equal(adminTry.status, 403, 'Admins must be forbidden from creating student tickets');

        // 5b. Subject too short fails validation
        const shortSub = await makeRequest('/api/support', {
            method: 'POST',
            headers: { Authorization: `Bearer ${studentToken}` },
            body: JSON.stringify({
                subject: 'ab',
                description: 'Testing short subject validation'
            })
        });
        assert.equal(shortSub.status, 400);

        // 5c. Valid ticket creation with structured category and affectedPage
        const validTicket = await makeRequest('/api/support', {
            method: 'POST',
            headers: { Authorization: `Bearer ${studentToken}` },
            body: JSON.stringify({
                subject: 'Workspace Drag and Drop Issue',
                category: 'bug_report',
                priority: 'high',
                affectedPage: '/workspace',
                description: 'Tasks do not update column status when dragged.'
            })
        });
        assert.equal(validTicket.status, 201);
        assert.equal(validTicket.body.category, 'bug_report');
        assert.equal(validTicket.body.affectedPage, '/workspace');
        assert.equal(validTicket.body.status, 'open');
        assert.equal(validTicket.body.userId, studentUser.id);
    });

    // -------------------------------------------------------------
    // Scenario 6: Support Ticket Spam Rate Limiting (Feature 3)
    // -------------------------------------------------------------
    await t.test('Scenario 6: Rate limits student support ticket creation (max 5 per 15 mins)', async () => {
        // We already created 1 in Scenario 5c. Let's create 4 more:
        for (let i = 0; i < 4; i++) {
            const res = await makeRequest('/api/support', {
                method: 'POST',
                headers: { Authorization: `Bearer ${studentToken}` },
                body: JSON.stringify({
                    subject: `Rate limit test ticket ${i}`,
                    category: 'feedback',
                    description: `Testing rate limiting iteration ${i}`
                })
            });
            assert.equal(res.status, 201);
        }

        // 6th ticket should trigger rate-limiting 429
        const rateLimited = await makeRequest('/api/support', {
            method: 'POST',
            headers: { Authorization: `Bearer ${studentToken}` },
            body: JSON.stringify({
                subject: 'Excessive ticket creation attempt',
                category: 'feedback',
                description: 'This ticket must exceed the 15-minute rate limit'
            })
        });
        assert.equal(rateLimited.status, 429, '6th ticket within 15 minutes must be rate-limited with 429');
    });

    // -------------------------------------------------------------
    // Scenario 7: Admin Support Status Patch & Audit Logging (Feature 3 & 7)
    // -------------------------------------------------------------
    await t.test('Scenario 7: PATCH /api/admin/support/:id/status validates status and records audit log', async () => {
        const ticket = await SupportTicket.findOne({ userId: studentUser.id });
        assert.ok(ticket);

        // 7a. Rejects invalid status
        const invalidPatch = await makeRequest(`/api/admin/support/${ticket.id}/status`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({ status: 'invalid_status_xyz' })
        });
        assert.equal(invalidPatch.status, 400);

        // 7b. Accepts valid status (resolved) and logs audit
        const validPatch = await makeRequest(`/api/admin/support/${ticket.id}/status`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({ status: 'resolved' })
        });
        assert.equal(validPatch.status, 200);
        assert.equal(validPatch.body.status, 'resolved');
        assert.ok(validPatch.body.resolvedAt);

        // Verify ActivityLog was recorded
        const auditLog = await ActivityLog.findOne({
            action: 'UPDATE_SUPPORT_STATUS',
            entityId: ticket.id
        });
        assert.ok(auditLog, 'Audit log entry must be recorded in ActivityLog');
        assert.equal(auditLog.entityType, 'SUPPORT_TICKET');
        assert.equal(auditLog.role, 'admin');
    });

    // -------------------------------------------------------------
    // Scenario 8: Admin Audit Trail Fetching (Feature 7)
    // -------------------------------------------------------------
    await t.test('Scenario 8: GET /api/admin/logs returns immutable audit log stream', async () => {
        // 8a. Deny student
        const studentRes = await makeRequest('/api/admin/logs', {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        assert.equal(studentRes.status, 403);

        // 8b. Admin retrieves logs
        const adminRes = await makeRequest('/api/admin/logs', {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert.equal(adminRes.status, 200);
        assert.ok(Array.isArray(adminRes.body));
        assert.ok(adminRes.body.length >= 1, 'At least 1 audit log must be returned');
        const latest = adminRes.body[0];
        assert.ok(latest.action);
        assert.ok(latest.userId);
        assert.ok(latest.createdAt);
    });

    // -------------------------------------------------------------
    // Scenario 9: Strict Active Ticket Whitelist Validation
    // -------------------------------------------------------------
    await t.test('Scenario 9: isTicketStatusActive strictly validates active vs non-active', () => {
        // Active
        assert.equal(isTicketStatusActive('open'), true);
        assert.equal(isTicketStatusActive('OPEN'), true);
        assert.equal(isTicketStatusActive('in_progress'), true);
        assert.equal(isTicketStatusActive('IN_PROGRESS'), true);
        assert.equal(isTicketStatusActive('in-progress'), true);
        assert.equal(isTicketStatusActive('In Progress'), true);

        // Non-active
        assert.equal(isTicketStatusActive('closed'), false);
        assert.equal(isTicketStatusActive('CLOSED'), false);
        assert.equal(isTicketStatusActive('resolved'), false);
        assert.equal(isTicketStatusActive('RESOLVED'), false);
        assert.equal(isTicketStatusActive(null), false);
        assert.equal(isTicketStatusActive(undefined), false);
        assert.equal(isTicketStatusActive(''), false);
        assert.equal(isTicketStatusActive('   '), false);
        assert.equal(isTicketStatusActive('pending'), false);
        assert.equal(isTicketStatusActive('unknown'), false);
    });

    // Cleanup
    await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect();
    await mongo.stop();
});
