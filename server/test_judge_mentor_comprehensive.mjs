import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User, Team, Hackathon, Project, Submission, Evaluation, MentorRequest } from './models/index.js';
import { MentorAssignment, JudgeAssignment, EvaluationCriteria } from './models/tertiary.js';
import { Notification, ActivityLog, Conversation, Message, SupportTicket } from './models/secondary.js';
import { Session } from './models/auth.js';
import { setTestAppsScriptDispatcher, setTestTransporter, sendRoleAssignmentEmail } from './services/email.js';

let dispatchedEmails = [];
setTestTransporter({
    sendMail: async (opts) => {
        dispatchedEmails.push(opts);
        return { messageId: 'test-email-' + Date.now() };
    }
});
setTestAppsScriptDispatcher(async () => ({ success: true, messageId: 'mock' }));

const mongod = await MongoMemoryServer.create({ binary: { systemBinary: process.env.MONGOMS_SYSTEM_BINARY || path.join(os.homedir(), '.cache/mongodb-binaries/mongod-x64-win32-8.2.6.exe') } });
process.env.MONGO_URI = mongod.getUri('codesrijan_test_comprehensive');
process.env.MONGO_DB_NAME = 'codesrijan_test_comprehensive';
process.env.SEED_ADMIN_PASSWORD = '';
process.env.SEED_STUDENT_PASSWORD = '';

await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB_NAME });
const { httpServer } = await import('./server.js');
await new Promise(resolve => httpServer.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${httpServer.address().port}/api`;
const tokens = {};

async function call(url, user, body, method = body === undefined ? 'GET' : 'POST', extraHeaders = {}) {
    const response = await fetch(base + url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(user ? { Authorization: `Bearer ${tokens[user] || user}` } : {}),
            ...extraHeaders
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    });
    return { status: response.status, data: await response.json().catch(() => null), headers: response.headers };
}

test('SETUP: Seed comprehensive role operatives and hackathon fixtures', async () => {
    for (const [id, role, teamId, handle] of [
        ['judge-1', 'judge', null, 'justice_alan'],
        ['mentor-1', 'mentor', null, 'mentor_ada'],
        ['student-1', 'student', 'team-alpha', 'hacker_one'],
        ['student-2', 'student', null, 'hacker_two'],
        ['admin-1', 'admin', null, 'super_admin']
    ]) {
        await User.create({
            id,
            email: `${id}@codesrijan.test`,
            role,
            teamId,
            handle,
            name: `User ${id}`,
            emailVerified: true,
            accountStatus: 'active'
        });
        tokens[id] = crypto.randomBytes(32).toString('hex');
        await Session.create({
            userId: id,
            sessionTokenHash: crypto.createHash('sha256').update(tokens[id]).digest('hex'),
            expiresAt: new Date(Date.now() + 600000)
        });
    }

    await Hackathon.create({
        id: 'hack-target',
        name: 'CodeSrijan Grand Arena',
        status: 'evaluation',
        evaluationDeadline: new Date(Date.now() + 86400000)
    });

    await Team.create({
        id: 'team-alpha',
        name: 'Squad Alpha',
        hackathonId: 'hack-target',
        leaderId: 'student-1',
        memberIds: ['student-1'],
        isSubmitted: false
    });

    await Project.create({
        id: 'proj-alpha',
        teamId: 'team-alpha',
        hackathonId: 'hack-target',
        name: 'Autonomous AI Node'
    });

    await Submission.create({
        id: 'sub-alpha',
        projectId: 'proj-alpha',
        teamId: 'team-alpha',
        hackathonId: 'hack-target',
        projectTitle: 'Autonomous AI Node',
        description: 'Multi-agent orchestration system.',
        status: 'submitted',
        submittedAt: new Date()
    });

    await JudgeAssignment.create({
        id: 'ja-alpha',
        judgeId: 'judge-1',
        projectId: 'proj-alpha',
        hackathonId: 'hack-target',
        status: 'assigned'
    });

    await MentorAssignment.create({
        id: 'ma-alpha',
        mentorId: 'mentor-1',
        teamId: 'team-alpha',
        hackathonId: 'hack-target',
        status: 'assigned'
    });

    await EvaluationCriteria.create([
        { id: 'crit-arch', hackathonId: 'hack-target', name: 'Technical Architecture', minScore: 0, maxScore: 30, weight: 50 },
        { id: 'crit-ui', hackathonId: 'hack-target', name: 'UI & Usability', minScore: 0, maxScore: 30, weight: 50 }
    ]);
});

test('TC-JUDGE-01: Judge Overview Dashboard returns verified metrics and assignments', async () => {
    const res = await call('/judge/dashboard', 'judge-1');
    assert.equal(res.status, 200, 'Judge dashboard returns 200');
    assert.ok(res.data.assignments.length >= 1, 'Assigned submissions listed');
    assert.ok(res.data.submissions.length >= 1, 'Submissions data present');
    assert.equal(res.data.assignments[0].projectId, 'proj-alpha');

    // Role boundary: Student cannot view judge dashboard
    const forbidden = await call('/judge/dashboard', 'student-1');
    assert.equal(forbidden.status, 403, 'Student cannot access judge dashboard');
});

test('TC-JUDGE-02: Judge Submissions endpoint lists assigned projects with rubric', async () => {
    const subRes = await call('/submissions', 'judge-1');
    assert.equal(subRes.status, 200);
    assert.ok(Array.isArray(subRes.data));

    const detailRes = await call('/judge/submissions/sub-alpha', 'judge-1');
    assert.equal(detailRes.status, 200);
    assert.equal(detailRes.data.submission.id, 'sub-alpha');
    assert.ok(detailRes.data.rubric.criteria.length >= 2, 'Rubric criteria loaded');
});

test('TC-JUDGE-03: Judge evaluation lifecycle - draft saving and final locking', async () => {
    // Save draft
    const draftRes = await call('/judge/submissions/sub-alpha/evaluation', 'judge-1', {
        scores: [
            { criteriaId: 'crit-arch', score: 25 },
            { criteriaId: 'crit-ui', score: 24 }
        ],
        comments: 'Outstanding architecture and system design.',
        status: 'draft'
    }, 'PUT');
    assert.equal(draftRes.status, 200, 'Draft evaluation saved');
    assert.equal(draftRes.data.status, 'draft');

    // Submit final
    const finalRes = await call('/judge/submissions/sub-alpha/evaluation', 'judge-1', {
        scores: [
            { criteriaId: 'crit-arch', score: 28 },
            { criteriaId: 'crit-ui', score: 27 }
        ],
        comments: 'Locked and verified submission.',
        status: 'submitted'
    }, 'PUT');
    assert.equal(finalRes.status, 200, 'Final evaluation submitted');
    assert.equal(finalRes.data.status, 'submitted');

    // Attempting to overwrite locked evaluation rejected with 409
    const lockCheck = await call('/judge/submissions/sub-alpha/evaluation', 'judge-1', {
        scores: [{ criteriaId: 'crit-arch', score: 10 }],
        status: 'draft'
    }, 'PUT');
    assert.equal(lockCheck.status, 409, 'Locked evaluation cannot be modified');
});

test('TC-MENTOR-01: Mentor Overview Dashboard returns assigned squads and sessions', async () => {
    const res = await call('/mentor/dashboard', 'mentor-1');
    assert.equal(res.status, 200, 'Mentor dashboard returns 200');
    assert.ok(res.data.teams.some(t => t.id === 'team-alpha'), 'Assigned team in mentor dashboard');
    assert.equal(res.data.metrics.assignedSquads, 1);

    // Role boundary: Student cannot view mentor dashboard
    const forbidden = await call('/mentor/dashboard', 'student-1');
    assert.equal(forbidden.status, 403, 'Student cannot access mentor dashboard');
});

test('TC-MENTOR-02: Mentor private notes workflow is strictly isolated', async () => {
    const postNote = await call('/mentor/teams/team-alpha/notes', 'mentor-1', {
        notes: 'Team Alpha is progressing well on multi-agent dispatch.'
    });
    assert.equal(postNote.status, 201, 'Mentor note created');

    const getNotes = await call('/mentor/teams/team-alpha/notes', 'mentor-1');
    assert.equal(getNotes.status, 200);
    assert.ok(getNotes.data.some(n => n.notes.includes('multi-agent')));

    // Students or judges cannot see private mentor notes
    const studentNote = await call('/mentor/teams/team-alpha/notes', 'student-1');
    assert.equal(studentNote.status, 403, 'Students cannot read mentor private notes');
});

test('TC-MENTOR-03: Mentor guidance queue, claiming, and response workflow', async () => {
    // Student requests guidance
    const reqRes = await call('/mentor/requests', 'student-1', {
        topic: 'Deployment assistance',
        description: 'Need assistance deploying worker nodes.',
        priority: 'high'
    });
    assert.equal(reqRes.status, 201, 'Guidance request created');
    const requestId = reqRes.data.id;

    // Mentor views queue
    const queueRes = await call('/mentor/guidance/queue', 'mentor-1');
    assert.equal(queueRes.status, 200);
    assert.ok(queueRes.data.some(r => r.id === requestId), 'Request in mentor queue');

    // Mentor claims request
    const claimRes = await call(`/mentor/guidance/${requestId}/claim`, 'mentor-1', {
        meetLink: 'https://meet.google.com/test-room-123'
    });
    assert.equal(claimRes.status, 200);
    assert.equal(claimRes.data.status, 'accepted');

    // Mentor responds and resolves
    const respondRes = await call(`/mentor/requests/${requestId}/respond`, 'mentor-1', {
        message: 'Checked container logs. Everything is green.'
    });
    assert.equal(respondRes.status, 200);

    const resolveRes = await call(`/mentor/requests/${requestId}/resolve`, 'mentor-1', {});
    assert.equal(resolveRes.status, 200);
    assert.equal(resolveRes.data.status, 'resolved');
});

test('TC-ROLE-EMAIL: Role assignment dispatches official notification email', async () => {
    dispatchedEmails = [];
    const updateRes = await call('/admin/users/student-2', 'admin-1', {
        name: 'User student-2',
        role: 'judge',
        status: 'Active'
    }, 'PUT');
    assert.equal(updateRes.status, 200, 'User role updated to judge');
    assert.equal(updateRes.data.role, 'judge');

    // Verify email was dispatched
    assert.ok(dispatchedEmails.length >= 1, 'Role elevation email was dispatched');
    const sent = dispatchedEmails.find(m => m.to === 'student-2@codesrijan.test');
    assert.ok(sent, 'Email addressed to student-2');
    assert.ok(sent.subject.includes('ROLE ASSIGNMENT'), 'Subject contains ROLE ASSIGNMENT');
    assert.ok(sent.html.includes('EVALUATION MAGISTRATE'), 'HTML contains Judge title');
    assert.ok(sent.html.includes('/judge-command-center'), 'HTML includes judge portal link');
});

test('TC-ISOLATION: New student cannot access other users support tickets', async () => {
    // Student 1 files a support ticket
    const ticketRes = await call('/support', 'student-1', {
        subject: 'Confidential hacker inquiry',
        category: 'support',
        description: 'Sensitive student question for support staff',
        priority: 'high'
    });
    assert.equal(ticketRes.status, 201);
    const convId = ticketRes.data.conversationId || ticketRes.data.id;

    // Student 2 (new account) queries conversations list
    const convList = await call('/conversations', 'student-2');
    assert.equal(convList.status, 200);
    const foreignTicket = (convList.data || []).find(c => c.id === convId || c.supportTicket?.userId === 'student-1');
    assert.equal(foreignTicket, undefined, 'Student 2 cannot see Student 1 support ticket in list');

    // Student 2 directly probes the ticket conversation
    const probeRes = await call(`/conversations/${convId}`, 'student-2');
    assert.equal(probeRes.status, 403, 'Direct access to foreign ticket conversation returns 403 Forbidden');
});

test('TC-SUBMIT-ATOMIC: Final submission prevents duplicate submissions atomically', async () => {
    await Hackathon.create({
        id: 'hack-open',
        name: 'Open Hackathon',
        status: 'submission_open',
        submissionDeadline: new Date(Date.now() + 86400000)
    });

    // Create fresh team for submission test
    await Team.create({
        id: 'team-gamma',
        name: 'Squad Gamma',
        hackathonId: 'hack-open',
        leaderId: 'student-1',
        memberIds: ['student-1'],
        isSubmitted: false
    });

    // Student 1 submits project
    const submit1 = await call('/teams/team-gamma/submit', 'student-1', {
        description: 'First payload transmission',
        technologies: ['React', 'Node.js', 'MongoDB'],
        githubLink: 'https://github.com/example/test'
    });
    assert.equal(submit1.status, 200, 'First submission succeeded');
    assert.equal(submit1.data.team.isSubmitted, true);

    // Duplicate submission attempt
    const submit2 = await call('/teams/team-gamma/submit', 'student-1', {
        description: 'Duplicate transmission attempt'
    });
    assert.equal(submit2.status, 409, 'Duplicate submission blocked with 409 Conflict');

    // Verify only 1 submission exists in database for team-gamma
    const count = await Submission.countDocuments({ teamId: 'team-gamma' });
    assert.equal(count, 1, 'Exactly 1 submission record exists in ledger');
});

test('TEARDOWN: Cleanup comprehensive test server', async () => {
    httpServer.close();
    await mongoose.disconnect();
    await mongod.stop();
});
