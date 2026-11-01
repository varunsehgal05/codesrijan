import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { io as socketClient } from 'socket.io-client';
import { User, Team, Hackathon, Project, Submission, Evaluation, MentorRequest } from './models/index.js';
import { MentorAssignment, JudgeAssignment, EvaluationCriteria } from './models/tertiary.js';
import { Notification, ActivityLog, Conversation, Message, SupportTicket } from './models/secondary.js';
import { Session } from './models/auth.js';
import { setTestAppsScriptDispatcher, setTestTransporter } from './services/email.js';

const mongod = await MongoMemoryServer.create({ binary: { systemBinary: process.env.MONGOMS_SYSTEM_BINARY || path.join(os.homedir(), '.cache/mongodb-binaries/mongod-x64-win32-8.2.6.exe') } });
process.env.MONGO_URI = mongod.getUri('codesrijan_test_roles');
process.env.MONGO_DB_NAME = 'codesrijan_test_roles';
process.env.SEED_ADMIN_PASSWORD = '';
process.env.SEED_STUDENT_PASSWORD = '';
setTestAppsScriptDispatcher(async () => ({ success: true, messageId: 'mock' }));
setTestTransporter({ sendMail: async () => ({ messageId: 'mock' }) });
await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB_NAME });
const { httpServer, setSystemSettings } = await import('./server.js');
await new Promise(resolve => httpServer.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${httpServer.address().port}/api`;
const tokens = {};
async function call(url, user, body, method = body === undefined ? 'GET' : 'POST', extraHeaders = {}) {
    const response = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', ...(user ? { Authorization: `Bearer ${tokens[user] || user}` } : {}), ...extraHeaders }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, data: await response.json().catch(() => null), headers: response.headers };
}
let requestId, evaluationId;
const scores = [{ criteriaId: 'innovation', score: 8 }, { criteriaId: 'execution', score: 6 }];
try {
    for (const [id, role, teamId] of [['student','student','team-a'], ['outsider','student','team-b'], ['mentor','mentor'], ['other-mentor','mentor'], ['judge','judge'], ['other-judge','judge'], ['admin','admin']]) {
        await User.create({ id, email: `${id}@example.invalid`, role, teamId, name: id, emailVerified: true, accountStatus: 'active' });
        tokens[id] = crypto.randomBytes(32).toString('hex');
        await Session.create({ userId: id, sessionTokenHash: crypto.createHash('sha256').update(tokens[id]).digest('hex'), expiresAt: new Date(Date.now()+600000) });
    }
    await Hackathon.create({ id: 'event', name: 'Isolated QA event', status: 'evaluation' });
    await Team.create([{ id: 'team-a', name: 'Assigned squad', hackathonId: 'event', leaderId: 'student', memberIds: ['student'], adminNote: 'Never expose', isSubmitted: true }, { id: 'team-b', name: 'Unassigned squad', hackathonId: 'event', leaderId: 'outsider', memberIds: ['outsider'], isSubmitted: true }]);
    await Project.create([{ id: 'project-a', teamId: 'team-a', hackathonId: 'event' }, { id: 'project-b', teamId: 'team-b', hackathonId: 'event' }]);
    await Submission.create([{ id: 'sub-a', projectId: 'project-a', teamId: 'team-a', hackathonId: 'event', status: 'submitted' }, { id: 'sub-b', projectId: 'project-b', teamId: 'team-b', hackathonId: 'event', status: 'submitted' }]);
    await MentorAssignment.create({ id: 'ma', mentorId: 'mentor', teamId: 'team-a', hackathonId: 'event', status: 'assigned' });
    await JudgeAssignment.create([{ id: 'ja', judgeId: 'judge', projectId: 'project-a', hackathonId: 'event', status: 'assigned' }, { id: 'jb', judgeId: 'other-judge', projectId: 'project-b', hackathonId: 'event', status: 'assigned' }]);
    await EvaluationCriteria.create([{ id: 'innovation', hackathonId: 'event', name: 'Innovation', minScore: 0, maxScore: 10, weight: 40 }, { id: 'execution', hackathonId: 'event', name: 'Execution', minScore: 0, maxScore: 10, weight: 60 }]);
    await Evaluation.init();

    await test('role endpoints reject missing and invalid authentication', async () => {
        for (const route of ['/mentor/dashboard', '/judge/dashboard', '/evaluations', '/submissions']) {
            assert.equal((await call(route)).status, 401);
            assert.equal((await call(route, 'invalid-test-token')).status, 401);
        }
    });
    await test('wrong roles cannot access private role dashboards or scores', async () => {
        for (const [route, user] of [['/mentor/dashboard','student'], ['/mentor/dashboard','judge'], ['/judge/dashboard','mentor'], ['/evaluations','student'], ['/evaluations','mentor'], ['/submissions','student']]) assert.equal((await call(route,user)).status,403);
    });
    await test('mentor dashboard restricts squads and redacts sensitive roster fields', async () => {
        const r=await call('/mentor/dashboard','mentor'); assert.equal(r.status,200); assert.deepEqual(r.data.teams.map(t=>t.id),['team-a']); assert.equal(r.data.teams[0].adminNote,undefined); assert.equal(r.data.teams[0].members[0].email,undefined); assert.equal(r.data.metrics.assignedSquads,1);
        assert.deepEqual((await call('/mentor/dashboard','other-mentor')).data.teams,[]);
    });
    await test('guidance validates membership and input while rejecting mass assignment', async () => {
        assert.equal((await call('/mentor/requests','student',{topic:{$ne:null},description:'help'})).status,400);
        const r=await call('/mentor/requests','student',{topic:'Build help',description:'Please inspect the deployment.',teamId:'team-b',mentorId:'other-mentor',status:'resolved',priority:'high'});assert.equal(r.status,201);requestId=r.data.id;assert.equal(r.data.teamId,'team-a');assert.equal(r.data.status,'pending');assert.equal(r.data.mentorId,undefined);
        assert.equal(await Notification.countDocuments({userId:'mentor',referenceId:requestId}),1);assert.equal(await Notification.countDocuments({userId:'other-mentor',referenceId:requestId}),0);
    });
    await test('guidance history and claims enforce squad and assignment isolation', async () => {
        assert.equal((await call('/teams/team-a/mentor-requests','outsider')).status,403);
        assert.equal((await call('/teams/team-a/mentor-requests','judge')).status,403);
        assert.deepEqual((await call('/mentor/requests/all','other-mentor')).data,[]);
        assert.equal((await call(`/mentor/requests/${requestId}/accept`,'other-mentor',{})).status,403);
        assert.equal((await call(`/mentor/requests/${requestId}/resolve`,'student',{})).status,403);
        assert.equal((await call(`/mentor/requests/${requestId}/accept`,'mentor',{meetLink:'javascript:alert(1)'})).status,400);
    });
    await test('parallel request claims have exactly one winner', async () => {
        const rows=await Promise.all([call(`/mentor/requests/${requestId}/accept`,'mentor',{}),call(`/mentor/requests/${requestId}/accept`,'mentor',{})]);assert.deepEqual(rows.map(r=>r.status).sort(),[200,409]);
    });
    await test('guidance supports response history, resolution and student reopening', async () => {
        assert.equal((await call(`/mentor/requests/${requestId}/resolve`,'mentor',{})).status,400);
        assert.equal((await call(`/mentor/requests/${requestId}/respond`,'mentor',{message:'Check the event environment configuration.'})).status,200);
        assert.equal((await call(`/mentor/requests/${requestId}/resolve`,'mentor',{})).status,200);
        const history=(await call('/teams/team-a/mentor-requests','student')).data[0];assert.equal(history.responses.length,1);assert.equal(history.status,'resolved');
        assert.equal((await call(`/mentor/requests/${requestId}/respond`,'mentor',{message:'Late'})).status,409);
        assert.equal((await call(`/mentor/requests/${requestId}/reopen`,'outsider',{})).status,403);
        assert.equal((await call(`/mentor/requests/${requestId}/reopen`,'student',{})).status,200);
    });
    await test('private mentor notes cannot be read by other roles or mentors', async () => {
        const r=await call('/mentor/teams/team-a/notes','mentor',{notes:'Private diagnostic context'});assert.equal(r.status,201);
        assert.equal((await call('/mentor/teams/team-a/notes','mentor')).data.length,1);
        for(const user of ['student','judge','admin','other-mentor']) assert.equal((await call('/mentor/teams/team-a/notes',user)).status,403);
        assert.equal(JSON.stringify((await call('/mentor/dashboard','mentor')).data).includes('Private diagnostic context'),false);
    });
    await test('conversation metadata and support auto-healing cannot bypass ownership', async () => {
        await Conversation.create({id:'private-conversation',type:'direct',participantIds:['student','mentor']});
        await Message.create({id:'private-message',conversationId:'private-conversation',senderId:'student',message:'Private fixture'});
        await SupportTicket.create({id:'private-support',userId:'student',subject:'Private ticket',description:'team-b text does not grant ownership',status:'open',conversationId:'support-not-created'});
        for (const route of ['/conversations/private-conversation','/conversations/private-conversation/messages','/conversations/support-not-created','/conversations/support-not-created/messages']) assert.equal((await call(route,'outsider')).status,403);
        assert.equal(await Conversation.countDocuments({id:'support-not-created'}),0);
        assert.equal((await call('/conversations/private-conversation','student')).status,200);
        const list=await call('/conversations','outsider');assert.equal(list.status,200);assert.equal(list.data.some(c=>c.id==='support-not-created'),false);
    });
    await test('websocket private rooms authenticate and deny another squad channel', async () => {
        const socket = socketClient(base.replace('/api',''), {auth:{token:tokens.outsider},transports:['websocket'],forceNew:true,reconnection:false,timeout:3000});
        try {
            await new Promise((resolve,reject)=>{socket.once('connect',resolve);socket.once('connect_error',reject);});
            const denied=await socket.timeout(3000).emitWithAck('conversation:join','private-conversation');assert.equal(denied.allowed,false);
        } finally { socket.disconnect(); }
        const invalid=socketClient(base.replace('/api',''),{auth:{token:'invalid-fixture'},transports:['websocket'],forceNew:true,reconnection:false,timeout:3000});
        try { const error=await new Promise(resolve=>invalid.once('connect_error',resolve));assert.equal(error.message,'Unauthorized'); } finally { invalid.disconnect(); }
    });
    await test('judge queues and detail enforce assigned submission scope', async () => {
        assert.deepEqual((await call('/submissions','judge')).data.map(s=>s.id),['sub-a']);
        assert.equal((await call('/judge/submissions/sub-b','judge')).status,403);
        const r=await call('/judge/submissions/sub-a','judge');assert.equal(r.status,200);assert.equal(r.data.rubric.criteria.length,2);assert.equal(r.data.evaluation,null);
    });
    await test('all legacy evaluation write paths enforce assignment', async () => {
        for(const route of ['/evaluations','/evaluations/team-b']) assert.equal((await call(route,'judge',{submissionId:'sub-b',scores,status:'draft'})).status,403);
    });
    await test('backend rejects invalid scores and mandatory final feedback', async () => {
        for(const badScores of [[{criteriaId:'innovation',score:-1}],[{criteriaId:'innovation',score:11}],[{criteriaId:'innovation',score:'8'}],[{criteriaId:'innovation',score:8},{criteriaId:'innovation',score:8}],[{criteriaId:'unknown',score:8}]]) assert.equal((await call('/judge/submissions/sub-a/evaluation','judge',{scores:badScores,status:'draft'},'PUT')).status,400);
        assert.equal((await call('/judge/submissions/sub-a/evaluation','judge',{scores,status:'submitted'},'PUT')).status,400);
        assert.equal((await call('/judge/submissions/sub-a/evaluation','judge',{scores:[scores[0]],comments:'Incomplete',status:'submitted'},'PUT')).status,400);
    });
    await test('draft persists, resumes and calculates weighted score on server', async () => {
        const r=await call('/judge/submissions/sub-a/evaluation','judge',{scores,status:'draft',totalScore:9999,judgeId:'other-judge',assignmentId:'jb',comments:'Useful feedback'},'PUT');assert.equal(r.status,200);assert.equal(r.data.totalScore,68);assert.equal(r.data.judgeId,'judge');assert.equal(r.data.assignmentId,'ja');evaluationId=r.data.id;
        assert.equal((await call('/judge/submissions/sub-a','judge')).data.evaluation.id,evaluationId);assert.deepEqual((await call('/evaluations','other-judge')).data,[]);
    });
    await test('parallel final submission has one winner and locks every save route', async () => {
        const payload={scores,status:'submitted',comments:'Clear architecture and a useful prototype.'};
        const responses=await Promise.all([call('/judge/submissions/sub-a/evaluation','judge',payload,'PUT'),call('/judge/submissions/sub-a/evaluation','judge',payload,'PUT')]);assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);
        for(const route of ['/evaluations','/evaluations/team-a']) assert.equal((await call(route,'judge',{...payload,submissionId:'sub-a'})).status,409);
        assert.equal(await Evaluation.countDocuments({assignmentId:'ja',judgeId:'judge'}),1);assert.equal((await call('/judge/dashboard','judge')).data.metrics.submittedEvaluations,1);
    });
    await test('reopening requires administrator, reason and emits audit record', async () => {
        assert.equal((await call(`/admin/evaluations/${evaluationId}/reopen`,'judge',{reason:'Review'})).status,403);
        assert.equal((await call(`/admin/evaluations/${evaluationId}/reopen`,'admin',{})).status,400);
        assert.equal((await call(`/admin/evaluations/${evaluationId}/reopen`,'admin',{reason:'Correct the feedback after review.'})).status,200);
        assert.equal((await call('/judge/submissions/sub-a/evaluation','judge',{scores,status:'submitted',comments:'Corrected feedback'},'PUT')).status,200);
        assert.equal(await ActivityLog.countDocuments({action:'EVALUATION_REOPENED',entityId:evaluationId}),1);
    });
    await test('legacy submitted evaluations remain locked and visible to their assigned judge', async () => {
        await Evaluation.create({id:'legacy-final',judgeId:'other-judge',teamId:'team-b',hackathonId:'event',scores,totalScore:68,status:'submitted'});
        const r=await call('/judge/submissions/sub-b','other-judge');assert.equal(r.status,200);assert.equal(r.data.evaluation.id,'legacy-final');
        assert.equal((await call('/judge/submissions/sub-b/evaluation','other-judge',{scores,status:'draft'},'PUT')).status,409);
        assert.equal((await call('/evaluations','other-judge')).data.length,1);
    });
    await test('assignment configuration forbids role spoofing and validates event ownership', async () => {
        assert.equal((await call('/admin/mentor-assignments','student',{mentorId:'student',hackathonId:'event',teamId:'team-a'})).status,403);
        assert.equal((await call('/admin/mentor-assignments','admin',{mentorId:'student',hackathonId:'event',teamId:'team-a'})).status,400);
        assert.equal((await call('/admin/mentor-assignments','admin',{mentorId:'other-mentor',hackathonId:'event',teamId:'team-b'})).status,201);
    });
    await test('event rubric configuration is administrator-only and immutable after grading starts', async () => {
        const body={criteria:[{name:'Only criterion',maxScore:5,weight:100}],roundingDecimals:1,mandatoryFeedback:false};
        assert.equal((await call('/admin/hackathons/event/rubric','judge',body,'PUT')).status,403);
        assert.equal((await call('/admin/hackathons/event/rubric','admin',body,'PUT')).status,409);
        await Hackathon.create({id:'ungraded',name:'Ungraded event'});
        assert.equal((await call('/admin/hackathons/ungraded/rubric','admin',{criteria:[{name:'Invalid',maxScore:10,weight:50}]},'PUT')).status,400);
        const r=await call('/admin/hackathons/ungraded/rubric','admin',body,'PUT');assert.equal(r.status,200);assert.equal(r.data.roundingDecimals,1);assert.equal(r.data.mandatoryFeedback,false);assert.equal(r.data.criteria[0].weight,100);
    });
    await test('revoked assignments immediately block both reads and writes', async () => {
        await MentorAssignment.updateOne({id:'ma'},{$set:{status:'reassigned'}});
        assert.equal((await call('/mentor/teams/team-a/notes','mentor')).status,403);
        assert.deepEqual((await call('/mentor/dashboard','mentor')).data.teams,[]);
        await JudgeAssignment.updateOne({id:'ja'},{$set:{status:'reassigned'}});
        assert.equal((await call('/judge/submissions/sub-a','judge')).status,403);assert.deepEqual((await call('/evaluations','judge')).data,[]);
    });
    await test('session expiry, revocation and account disabling apply on subsequent requests', async () => {
        await Session.updateOne({userId:'judge'},{$set:{expiresAt:new Date(0)}});assert.equal((await call('/judge/dashboard','judge')).status,401);
        await Session.updateOne({userId:'mentor'},{$set:{revokedAt:new Date()}});assert.equal((await call('/mentor/dashboard','mentor')).status,401);
        await User.updateOne({id:'other-judge'},{$set:{accountStatus:'disabled'}});assert.equal((await call('/judge/dashboard','other-judge')).status,403);
    });
    await test('CORS excludes attacker origins and role endpoints obey maintenance', async () => {
        const r=await call('/judge/dashboard',undefined,undefined,'GET',{Origin:'https://attacker.example.invalid'});assert.equal(r.headers.get('access-control-allow-origin'),null);
        setSystemSettings({maintenanceMode:true});assert.equal((await call('/mentor/dashboard','other-mentor')).status,503);assert.equal((await call('/judge/dashboard','admin')).status,200);
        await Session.updateOne({userId:'admin'},{$set:{expiresAt:new Date(0)}});assert.equal((await call('/hackathons','admin')).status,503);setSystemSettings({maintenanceMode:false});
    });
} finally {
    await new Promise(resolve=>httpServer.close(resolve));
    await mongoose.disconnect();
    await mongod.stop();
}
